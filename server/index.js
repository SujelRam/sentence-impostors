/**
 * Sentence Impostors — Express + Socket.IO Server
 * Handles real-time room creation, player management, round lifecycle, and scoring.
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  createRoom, getRoom, findRoomBySocketId,
  deleteRoom, addPlayer, removePlayer, getPlayer, updateLeaderboard,
} = require('./roomManager');
const { calculateScore } = require('./scoring');
const allQuestions = require('./questions');

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', rooms: 0 }));

// ─── Timer Helpers ────────────────────────────────────────────────────────────

function startTimer(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;
  if (room.timerInterval) clearInterval(room.timerInterval);

  room.timerInterval = setInterval(() => {
    const r = getRoom(roomCode);
    if (!r || !r.roundActive) { clearInterval(r?.timerInterval); return; }

    r.timeLeft = Math.max(0, r.timeLeft - 1);
    io.to(roomCode).emit('timer_tick', { timeLeft: r.timeLeft });

    if (r.timeLeft === 10) io.to(roomCode).emit('timer_warning');
    if (r.timeLeft <= 0) {
      clearInterval(r.timerInterval);
      r.timerInterval = null;
      endRound(roomCode);
    }
  }, 1000);
}

// ─── Round Lifecycle ──────────────────────────────────────────────────────────

function endRound(roomCode) {
  const room = getRoom(roomCode);
  if (!room || !room.roundActive) return;

  room.roundActive = false;
  if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }

  const currentQ = room.questions[room.currentQuestionIndex];
  let fastestPlayer = null;
  let fastestTime = Infinity;

  const results = room.players.map((player) => {
    const score = player.submitted
      ? calculateScore({
          playerAnswer: player.answer,
          correctSentence: currentQ.sentence,
          timeLeft: Math.max(0, room.totalTime - player.timeTaken),
          totalTime: room.totalTime,
          usedHint: player.usedHint,
          isEmergency: room.isEmergency,
          streak: player.streak,
          hasImpostorWord: currentQ.hasImpostorWord,
          impostorWord: currentQ.impostorWord,
        })
      : {
          sentenceScore: 0, grammarScore: 0, timeBonus: 0,
          impostorBonus: 0, streakBonus: 0, hintPenalty: 0,
          total: 0, isFullyCorrect: false, partialAccuracy: 0,
        };

    // Update streak & correct count
    if (score.isFullyCorrect) {
      player.streak = (player.streak || 0) + 1;
      player.correctRounds = (player.correctRounds || 0) + 1;
      if (player.submitted && player.timeTaken < fastestTime) {
        fastestTime = player.timeTaken;
        fastestPlayer = player;
      }
    } else {
      player.streak = 0;
    }

    // Update fastest personal time
    if (player.submitted && (!player.fastestTime || player.timeTaken < player.fastestTime)) {
      player.fastestTime = player.timeTaken;
    }

    player.totalScore = (player.totalScore || 0) + score.total;
    player.roundScore = score.total;

    return {
      playerId: player.id,
      playerName: player.name,
      answer: player.answer,
      submitted: player.submitted,
      score,
      streak: player.streak,
    };
  });

  // ── Badge awards ────────────────────────────────────────────────────────────
  if (fastestPlayer) {
    if (!fastestPlayer.badges) fastestPlayer.badges = [];
    fastestPlayer.badges.push({ type: 'fastest', label: '⚡ Fastest Crew Mate', round: room.roundNumber });
  }
  room.players.forEach((p) => {
    if (!p.badges) p.badges = [];
    if (p.streak === 3 && !p.badges.some((b) => b.type === 'streak3')) {
      p.badges.push({ type: 'streak3', label: '🔥 On Fire! (3 Streak)', round: room.roundNumber });
    }
    if (p.streak === 5 && !p.badges.some((b) => b.type === 'streak5')) {
      p.badges.push({ type: 'streak5', label: '💥 Unstoppable! (5 Streak)', round: room.roundNumber });
    }
  });

  const leaderboard = updateLeaderboard(room);

  io.to(roomCode).emit('round_ended', {
    results,
    correctSentence: currentQ.sentence,
    grammarExplanation: currentQ.grammarExplanation,
    hasImpostorWord: currentQ.hasImpostorWord,
    impostorWord: currentQ.impostorWord,
    leaderboard,
    roundNumber: room.roundNumber,
    fastestPlayerName: fastestPlayer?.name || null,
  });
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const disconnectTimeouts = new Map();

io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  // ── Host: Create Room ────────────────────────────────────────────────────
  socket.on('create_room', (options = {}) => {
    const { numQuestions = 5, difficulty = 'mixed' } = options;

    let pool = allQuestions;
    if (difficulty !== 'mixed') {
       pool = allQuestions.filter(q => q.difficulty === difficulty);
    }
    
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    let roomQuestions = shuffledPool.slice(0, Math.min(numQuestions, shuffledPool.length));

    // If there aren't enough questions in the pool for this difficulty, duplicate them
    while (roomQuestions.length < numQuestions && roomQuestions.length > 0) {
      roomQuestions.push(roomQuestions[roomQuestions.length % shuffledPool.length]);
    }

    if (roomQuestions.length === 0) {
      roomQuestions.push(allQuestions[0]);
    }

    const room = createRoom(socket.id, roomQuestions);
    room.totalRounds = roomQuestions.length;
    socket.join(room.roomCode);

    socket.emit('room_created', { roomCode: room.roomCode, totalRounds: room.totalRounds });
    console.log(`🏠 Room ${room.roomCode} created by ${socket.id}`);
  });

  // ── Player: Join Room ────────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode, playerName }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = getRoom(code);

    if (!room) { socket.emit('join_error', { message: 'Room not found. Check your code!' }); return; }

    const cleanedName = (playerName || '').trim();

    // Check if player is rejoining
    const existingPlayer = room.players.find(
      (p) => p.name.toLowerCase() === cleanedName.toLowerCase()
    );

    if (existingPlayer) {
      // Clear disconnect timeout
      const key = `${code}-${existingPlayer.name}`;
      if (disconnectTimeouts.has(key)) {
        clearTimeout(disconnectTimeouts.get(key));
        disconnectTimeouts.delete(key);
        console.log(`🔄 Cleared disconnect timeout for player ${existingPlayer.name} rejoining room ${code}`);
      }

      // Update ID to new socket.id
      existingPlayer.id = socket.id;
      socket.join(code);

      // Emit room joined with current state
      socket.emit('room_joined', {
        roomCode: code,
        playerName: existingPlayer.name,
        players: room.players.map((p) => ({ id: p.id, name: p.name, status: p.status })),
      });

      io.to(code).emit('player_joined', {
        players: room.players.map((p) => ({ id: p.id, name: p.name, status: p.status })),
      });

      console.log(`🔄 Player ${existingPlayer.name} successfully reconnected to room ${code}`);

      // If game has started, catch up the rejoining player
      if (room.gameStarted) {
        if (room.roundActive) {
          const q = room.questions[room.currentQuestionIndex];
          const scrambledWords = [...q.scrambledWords].sort(() => Math.random() - 0.5);
          socket.emit('round_started', {
            question: {
              id: q.id,
              scrambledWords,
              difficulty: q.difficulty,
              hasImpostorWord: q.hasImpostorWord,
              category: q.category,
            },
            timeLimit: room.totalTime,
            timeLeft: room.timeLeft,
            roundNumber: room.roundNumber,
            totalRounds: room.totalRounds,
            isEmergency: room.isEmergency,
          });

          if (existingPlayer.submitted) {
            socket.emit('answer_result', {
              score: calculateScore({
                playerAnswer: existingPlayer.answer,
                correctSentence: q.sentence,
                timeLeft: Math.max(0, room.totalTime - existingPlayer.timeTaken),
                totalTime: room.totalTime,
                usedHint: existingPlayer.usedHint,
                isEmergency: room.isEmergency,
                streak: existingPlayer.streak,
                hasImpostorWord: q.hasImpostorWord,
                impostorWord: q.impostorWord,
              }),
              correctSentence: q.sentence,
              grammarExplanation: q.grammarExplanation,
              hasImpostorWord: q.hasImpostorWord,
              impostorWord: q.impostorWord,
            });
          }
        } else {
          if (room.leaderboard && room.leaderboard.length > 0) {
            socket.emit('leaderboard_update', {
              leaderboard: room.leaderboard,
              totalRounds: room.totalRounds,
            });
          }
        }
      }
      return;
    }

    if (room.gameStarted) { socket.emit('join_error', { message: 'Game has already started!' }); return; }

    const player = {
      id: socket.id,
      name: cleanedName,
      totalScore: 0, roundScore: 0,
      answer: [], submitted: false,
      timeTaken: 0, usedHint: false,
      streak: 0, correctRounds: 0,
      badges: [], status: 'waiting',
      wordCount: 0, fastestTime: null,
    };

    const result = addPlayer(code, player);
    if (result.error) { socket.emit('join_error', { message: result.error }); return; }

    socket.join(code);
    socket.emit('room_joined', {
      roomCode: code,
      playerName: player.name,
      players: room.players.map((p) => ({ id: p.id, name: p.name, status: p.status })),
    });
    io.to(code).emit('player_joined', {
      players: room.players.map((p) => ({ id: p.id, name: p.name, status: p.status })),
      newPlayer: player.name,
    });
    console.log(`👤 ${player.name} joined room ${code}`);
  });

  // ── Host: Rejoin Room ────────────────────────────────────────────────────
  socket.on('rejoin_host', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = getRoom(code);
    if (!room) { socket.emit('join_error', { message: 'Room not found.' }); return; }

    // Clear disconnect timeout for host
    const key = `${code}-host`;
    if (disconnectTimeouts.has(key)) {
      clearTimeout(disconnectTimeouts.get(key));
      disconnectTimeouts.delete(key);
      console.log(`🔄 Cleared disconnect timeout for host rejoining room ${code}`);
    }

    room.hostId = socket.id;
    socket.join(code);

    socket.emit('room_created', { roomCode: room.roomCode, totalRounds: room.totalRounds });

    // Send host current submissions if round is active
    if (room.gameStarted) {
      if (room.roundActive) {
        const q = room.questions[room.currentQuestionIndex];
        socket.emit('host_round_info', {
          correctSentence: q.sentence,
          impostorWord: q.impostorWord,
        });
        
        room.players.forEach(p => {
          if (p.submitted) {
            socket.emit('answer_submitted', {
              playerId: p.id,
              playerName: p.name,
              wordCount: p.answer.length,
              score: p.roundScore || 0,
            });
          }
        });
      }
    }

    io.to(code).emit('player_joined', {
      players: room.players.map((p) => ({ id: p.id, name: p.name, status: p.status })),
    });

    console.log(`🔄 Host successfully reconnected to room ${code}`);
  });

  // ── Host: Start Round ────────────────────────────────────────────────────
  socket.on('start_round', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id || room.roundActive) return;

    if (room.currentQuestionIndex >= room.questions.length) {
      const lb = updateLeaderboard(room);
      io.to(roomCode).emit('game_ended', { finalLeaderboard: lb });
      return;
    }

    room.gameStarted = true;
    room.roundActive = true;
    room.roundNumber++;

    room.isEmergency = false;
    room.totalTime = 60;
    room.timeLeft = room.totalTime;

    const q = room.questions[room.currentQuestionIndex];

    // Reset all players
    room.players.forEach((p) => {
      p.answer = []; p.submitted = false; p.timeTaken = 0;
      p.usedHint = false; p.status = 'answering'; p.wordCount = 0;
    });

    // Re-shuffle the scrambled words each round for variety
    const scrambledWords = [...q.scrambledWords].sort(() => Math.random() - 0.5);

    io.to(roomCode).emit('round_started', {
      question: {
        id: q.id,
        scrambledWords,
        difficulty: q.difficulty,
        hasImpostorWord: q.hasImpostorWord,
        category: q.category,
        // ⚠️  Do NOT send correct sentence or impostorWord to clients here
      },
      timeLimit: room.totalTime,
      roundNumber: room.roundNumber,
      totalRounds: room.totalRounds,
      isEmergency: room.isEmergency,
    });

    // Send the correct answer secretly to the host only
    io.to(room.hostId).emit('host_round_info', {
      correctSentence: q.sentence,
      impostorWord: q.impostorWord,
    });

    startTimer(roomCode);
    console.log(`▶️  Round ${room.roundNumber} started in ${roomCode} (emergency: ${room.isEmergency})`);
  });

  // ── Player: Submit Answer ────────────────────────────────────────────────
  socket.on('submit_answer', ({ roomCode, answer, timeTaken, usedHint }) => {
    const room = getRoom(roomCode);
    if (!room || !room.roundActive) return;

    const player = getPlayer(roomCode, socket.id);
    if (!player || player.submitted) return;

    player.submitted = true;
    player.answer = answer;
    player.timeTaken = timeTaken;
    player.usedHint = usedHint;
    player.status = 'submitted';

    const q = room.questions[room.currentQuestionIndex];
    const score = calculateScore({
      playerAnswer: answer,
      correctSentence: q.sentence,
      timeLeft: Math.max(0, room.totalTime - timeTaken),
      totalTime: room.totalTime,
      usedHint,
      isEmergency: room.isEmergency,
      streak: player.streak,
      hasImpostorWord: q.hasImpostorWord,
      impostorWord: q.impostorWord,
    });

    // Show result immediately to the submitting player
    socket.emit('answer_result', {
      score,
      correctSentence: q.sentence,
      grammarExplanation: q.grammarExplanation,
      hasImpostorWord: q.hasImpostorWord,
      impostorWord: q.impostorWord,
    });

    // Notify host dashboard
    io.to(room.hostId).emit('answer_submitted', {
      playerId: player.id,
      playerName: player.name,
      wordCount: answer.length,
      score: score.total,
    });

    // Auto-end round if everyone submitted
    if (room.players.every((p) => p.submitted)) {
      setTimeout(() => endRound(roomCode), 1500);
    }
  });

  // ── Player: Live Progress Update ─────────────────────────────────────────
  socket.on('update_progress', ({ roomCode, wordCount }) => {
    const room = getRoom(roomCode);
    if (!room || !room.roundActive) return;
    const player = getPlayer(roomCode, socket.id);
    if (!player || player.submitted) return;

    player.wordCount = wordCount;
    io.to(room.hostId).emit('player_progress', {
      playerId: player.id,
      playerName: player.name,
      wordCount,
    });
  });

  // ── Host: Next Question ──────────────────────────────────────────────────
  socket.on('next_question', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;

    if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
    room.roundActive = false;
    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.questions.length) {
      const lb = updateLeaderboard(room);
      io.to(roomCode).emit('game_ended', { finalLeaderboard: lb });
    } else {
      // Start the next round immediately
      room.gameStarted = true;
      room.roundActive = true;
      room.roundNumber++;

      room.isEmergency = false;
      room.totalTime = 60;
      room.timeLeft = room.totalTime;

      const q = room.questions[room.currentQuestionIndex];

      // Reset all players
      room.players.forEach((p) => {
        p.answer = []; p.submitted = false; p.timeTaken = 0;
        p.usedHint = false; p.status = 'answering'; p.wordCount = 0;
      });

      const scrambledWords = [...q.scrambledWords].sort(() => Math.random() - 0.5);

      io.to(roomCode).emit('round_started', {
        question: {
          id: q.id,
          scrambledWords,
          difficulty: q.difficulty,
          hasImpostorWord: q.hasImpostorWord,
          category: q.category,
        },
        timeLimit: room.totalTime,
        roundNumber: room.roundNumber,
        totalRounds: room.totalRounds,
        isEmergency: room.isEmergency,
      });

      startTimer(roomCode);
      console.log(`▶️  Round ${room.roundNumber} started in ${roomCode} (emergency: ${room.isEmergency})`);
    }
  });

  // ── Host: End Game Manually ──────────────────────────────────────────────
  socket.on('end_game', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
    room.roundActive = false;
    const lb = updateLeaderboard(room);
    io.to(roomCode).emit('game_ended', { finalLeaderboard: lb });
  });

  // ── Player: Use Hint ─────────────────────────────────────────────────────
  socket.on('use_hint', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || !room.roundActive) return;
    const player = getPlayer(roomCode, socket.id);
    if (!player || player.usedHint) return;

    player.usedHint = true;
    const q = room.questions[room.currentQuestionIndex];
    const firstWord = q.sentence.split(' ')[0];
    const structureHint = q.grammarExplanation.split('.')[0];

    socket.emit('hint_revealed', { firstWord, structureHint });
  });

  // ── Anyone: Emoji Reaction ───────────────────────────────────────────────
  socket.on('send_reaction', ({ roomCode, reaction }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const isHost = room.hostId === socket.id;
    const player = getPlayer(roomCode, socket.id);
    const senderName = isHost ? '👑 Host' : (player?.name || 'Unknown');
    io.to(roomCode).emit('reaction_received', { senderName, reaction });
  });

  // ── Host: Add Custom Question ────────────────────────────────────────────
  socket.on('add_custom_question', ({ roomCode, sentence, difficulty }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    const words = sentence.trim().split(/\s+/);
    const scrambled = [...words].sort(() => Math.random() - 0.5);
    const customQ = {
      id: Date.now(),
      sentence: sentence.trim(),
      scrambledWords: scrambled,
      difficulty: difficulty || 'medium',
      hasImpostorWord: false,
      impostorWord: null,
      grammarExplanation: 'Custom question added by the host.',
      category: 'custom',
    };
    room.questions.push(customQ);
    room.totalRounds = room.questions.length;
    socket.emit('custom_question_added', { success: true, totalRounds: room.totalRounds });
  });

  // ── Host: Kick Player ────────────────────────────────────────────────────
  socket.on('kick_player', ({ roomCode, playerId }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    const target = io.sockets.sockets.get(playerId);
    if (target) {
      target.emit('player_kicked', { message: 'You have been removed by the host.' });
      target.leave(roomCode);
    }
    removePlayer(roomCode, playerId);
    io.to(roomCode).emit('player_joined', {
      players: room.players.map((p) => ({ id: p.id, name: p.name, status: p.status })),
    });
  });

  // ── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    const room = findRoomBySocketId(socket.id);
    if (!room) return;

    if (room.hostId === socket.id) {
      // Set a grace period for host reconnection (8 seconds)
      const key = `${room.roomCode}-host`;
      if (disconnectTimeouts.has(key)) clearTimeout(disconnectTimeouts.get(key));

      const timeoutId = setTimeout(() => {
        disconnectTimeouts.delete(key);
        io.to(room.roomCode).emit('host_disconnected', { message: 'The host has left the game.' });
        deleteRoom(room.roomCode);
        console.log(`🏠 Room ${room.roomCode} deleted due to host inactivity.`);
      }, 8000);

      disconnectTimeouts.set(key, timeoutId);
      console.log(`⏳ Host disconnected. Waiting 8s for reconnection in room ${room.roomCode}...`);
    } else {
      // Set a grace period for player reconnection (8 seconds)
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        const key = `${room.roomCode}-${player.name}`;
        if (disconnectTimeouts.has(key)) clearTimeout(disconnectTimeouts.get(key));

        const timeoutId = setTimeout(() => {
          disconnectTimeouts.delete(key);
          const playerName = removePlayer(room.roomCode, socket.id);
          if (playerName) {
            io.to(room.roomCode).emit('player_joined', {
              players: room.players.map((p) => ({ id: p.id, name: p.name, status: p.status })),
              leftPlayer: playerName,
            });
            console.log(`👤 Player ${playerName} removed from room ${room.roomCode} after disconnect timeout.`);
          }
        }, 8000);

          disconnectTimeouts.set(key, timeoutId);
          console.log(`⏳ Player ${player.name} disconnected. Waiting 8s for reconnection in room ${room.roomCode}...`);
      }
    }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Sentence Impostors server listening on port ${PORT}`);
});
