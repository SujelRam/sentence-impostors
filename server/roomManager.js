/**
 * Room Manager — in-memory storage for all active game rooms.
 */

/** @type {Map<string, object>} */
const rooms = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Room CRUD ────────────────────────────────────────────────────────────────

/**
 * Create and store a new room.
 * @param {string} hostId   Socket ID of the host
 * @param {object[]} questions  Shuffled question bank for this room
 * @returns {object} The new room object
 */
function createRoom(hostId, questions) {
  const roomCode = generateRoomCode();
  const room = {
    roomCode,
    hostId,
    players: [],
    questions: shuffle(questions),
    currentQuestionIndex: 0,
    totalRounds: questions.length,
    gameStarted: false,
    roundActive: false,
    timerInterval: null,
    timeLeft: 60,
    totalTime: 60,
    isEmergency: false,
    leaderboard: [],
    roundNumber: 0,
    createdAt: Date.now(),
  };
  rooms.set(roomCode, room);
  return room;
}

function getRoom(roomCode) {
  return rooms.get(roomCode) || null;
}

/**
 * Find the room that a given socket ID belongs to (either host or player).
 */
function findRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (
      room.hostId === socketId ||
      room.players.some((p) => p.id === socketId)
    ) {
      return room;
    }
  }
  return null;
}

function deleteRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (room?.timerInterval) clearInterval(room.timerInterval);
  rooms.delete(roomCode);
}

// ─── Player management ───────────────────────────────────────────────────────

/**
 * Add a player to a room.  Returns { error } or { success }.
 */
function addPlayer(roomCode, player) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found. Check your code!' };
  if (room.gameStarted) return { error: 'Game has already started!' };
  if (player.name.trim().length < 2)
    return { error: 'Name must be at least 2 characters.' };

  const duplicate = room.players.find(
    (p) => p.name.toLowerCase() === player.name.trim().toLowerCase()
  );
  if (duplicate) return { error: 'That name is already taken in this room.' };

  room.players.push(player);
  return { success: true };
}

function removePlayer(roomCode, socketId) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  const player = room.players.find((p) => p.id === socketId);
  room.players = room.players.filter((p) => p.id !== socketId);
  return player?.name || null;
}

function getPlayer(roomCode, socketId) {
  return rooms.get(roomCode)?.players.find((p) => p.id === socketId) || null;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

/**
 * Rebuild leaderboard sorted by total score and attach rank.
 */
function updateLeaderboard(room) {
  room.leaderboard = room.players
    .map((p) => ({
      id: p.id,
      name: p.name,
      totalScore: p.totalScore || 0,
      roundScore: p.roundScore || 0,
      streak: p.streak || 0,
      badges: p.badges || [],
      correctRounds: p.correctRounds || 0,
      accuracy:
        room.roundNumber > 0
          ? Math.round(((p.correctRounds || 0) / room.roundNumber) * 100)
          : 0,
      fastestTime: p.fastestTime ?? null,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return room.leaderboard;
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

/** Remove rooms older than 2 hours to prevent memory leaks. */
function cleanupOldRooms() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    if (room.createdAt < cutoff) deleteRoom(code);
  }
}

setInterval(cleanupOldRooms, 30 * 60 * 1000);

module.exports = {
  createRoom,
  getRoom,
  findRoomBySocketId,
  deleteRoom,
  addPlayer,
  removePlayer,
  getPlayer,
  updateLeaderboard,
};
