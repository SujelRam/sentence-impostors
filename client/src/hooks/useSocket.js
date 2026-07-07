import { useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useGame } from '../context/GameContext';

const SOCKET_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:3001';

let socketInstance = null;
let isListenersAttached = false;

export function useSocket() {
  const { dispatch } = useGame();

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    if (!isListenersAttached) {
      const s = socketInstance;
      isListenersAttached = true;
      const d = (type, payload) => dispatch({ type, payload });

      s.on('room_created',        (p) => d('ROOM_CREATED', p));
      s.on('room_joined',         (p) => d('ROOM_JOINED', p));
      s.on('join_error',          (p) => d('SET_ERROR', p.message));
      s.on('player_joined',       (p) => d('PLAYER_JOINED', p));
      s.on('round_started',       (p) => d('ROUND_STARTED', p));
      s.on('timer_tick',          (p) => d('TIMER_TICK', p));
      s.on('answer_result',       (p) => d('ANSWER_RESULT', p));
      s.on('answer_submitted',    (p) => d('ANSWER_SUBMITTED', p));
      s.on('player_progress',     (p) => d('PLAYER_PROGRESS', p));
      s.on('round_ended',         (p) => d('ROUND_ENDED', p));
      s.on('leaderboard_update',  (p) => d('LEADERBOARD_UPDATE', p));
      s.on('game_ended',          (p) => d('GAME_ENDED', p));
      s.on('host_disconnected',   ()  => d('HOST_DISCONNECTED', null));
      s.on('reaction_received',   (p) => d('ADD_REACTION', p));
      s.on('hint_revealed',       (p) => d('HINT_REVEALED', p));
      s.on('host_round_info',     (p) => d('HOST_ROUND_INFO', p));
      s.on('player_kicked',       ()  => {
        dispatch({ type: 'RESET' });
      });

      const attemptRejoin = () => {
        const savedRoomCode = sessionStorage.getItem('roomCode');
        const savedPlayerName = sessionStorage.getItem('playerName');
        const savedIsHost = sessionStorage.getItem('isHost') === 'true';

        if (savedRoomCode) {
          if (savedIsHost) {
            console.log(`🔄 Rejoining host to room: ${savedRoomCode}`);
            s.emit('rejoin_host', { roomCode: savedRoomCode });
          } else if (savedPlayerName) {
            console.log(`🔄 Rejoining player ${savedPlayerName} to room: ${savedRoomCode}`);
            s.emit('join_room', { roomCode: savedRoomCode, playerName: savedPlayerName });
          }
        }
      };

      s.on('connect', attemptRejoin);
      if (s.connected) {
        attemptRejoin();
      }
    }
  }, [dispatch]);

  // ── Emit helpers ────────────────────────────────────────────────────────────
  const emit = useCallback((event, data) => {
    socketInstance?.emit(event, data);
  }, []);

  const createRoom      = useCallback((options) => emit('create_room', options), [emit]);
  const joinRoom        = useCallback((roomCode, playerName) => emit('join_room', { roomCode, playerName }), [emit]);
  const startRound      = useCallback((roomCode) => emit('start_round', { roomCode }), [emit]);
  const submitAnswer    = useCallback((roomCode, answer, timeTaken, usedHint) =>
    emit('submit_answer', { roomCode, answer, timeTaken, usedHint }), [emit]);
  const nextQuestion    = useCallback((roomCode) => emit('next_question', { roomCode }), [emit]);
  const endGame         = useCallback((roomCode) => emit('end_game', { roomCode }), [emit]);
  const sendReaction    = useCallback((roomCode, reaction) => emit('send_reaction', { roomCode, reaction }), [emit]);
  const useHint         = useCallback((roomCode) => emit('use_hint', { roomCode }), [emit]);
  const updateProgress  = useCallback((roomCode, wordCount) => emit('update_progress', { roomCode, wordCount }), [emit]);
  const addCustomQ      = useCallback((roomCode, sentence, difficulty) =>
    emit('add_custom_question', { roomCode, sentence, difficulty }), [emit]);
  const kickPlayer      = useCallback((roomCode, playerId) => emit('kick_player', { roomCode, playerId }), [emit]);

  return {
    socket: socketInstance,
    createRoom, joinRoom, startRound, submitAnswer,
    nextQuestion, endGame, sendReaction, useHint,
    updateProgress, addCustomQ, kickPlayer,
  };
}
