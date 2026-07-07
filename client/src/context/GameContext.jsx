import React, { createContext, useContext, useReducer } from 'react';

export const GameContext = createContext(null);

const savedRoomCode = typeof window !== 'undefined' ? sessionStorage.getItem('roomCode') : null;
const savedPlayerName = typeof window !== 'undefined' ? sessionStorage.getItem('playerName') : null;
const savedIsHost = typeof window !== 'undefined' ? sessionStorage.getItem('isHost') === 'true' : false;

const initialState = {
  socket: null,
  roomCode: savedRoomCode,
  isHost: savedIsHost,
  playerName: savedPlayerName,
  players: [],        // {id, name, status, wordCount?, score?}
  phase: savedRoomCode ? (savedIsHost ? 'hosting' : 'lobby') : 'landing',   // landing | lobby | hosting | playing | submitted | result | leaderboard | final
  currentQuestion: null,
  timeLeft: 60,
  totalTime: 60,
  roundNumber: 0,
  totalRounds: 0,
  isEmergency: false,
  leaderboard: [],
  roundResult: null,        // {score, correctSentence, grammarExplanation, ...}
  roundEndedData: null,     // full round_ended payload
  finalLeaderboard: [],
  reactions: [],            // [{senderName, reaction, id}]
  hintData: null,           // {firstWord, structureHint}
  error: null,
  hostSubmissions: {},      // {playerId: {wordCount, score, submitted}}
  hostRoundInfo: null,      // {correctSentence, impostorWord}
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };

    case 'ROOM_CREATED':
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('roomCode', action.payload.roomCode);
        sessionStorage.setItem('isHost', 'true');
      }
      return {
        ...state,
        roomCode: action.payload.roomCode,
        totalRounds: action.payload.totalRounds,
        isHost: true,
        phase: 'lobby',
      };

    case 'ROOM_JOINED':
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('roomCode', action.payload.roomCode);
        sessionStorage.setItem('playerName', action.payload.playerName);
        sessionStorage.setItem('isHost', 'false');
      }
      return {
        ...state,
        roomCode: action.payload.roomCode,
        playerName: action.payload.playerName,
        players: action.payload.players,
        isHost: false,
        phase: 'lobby',
      };

    case 'PLAYER_JOINED':
      return { ...state, players: action.payload.players };

    case 'ROUND_STARTED':
      return {
        ...state,
        currentQuestion: action.payload.question,
        timeLeft: action.payload.timeLimit,
        totalTime: action.payload.timeLimit,
        roundNumber: action.payload.roundNumber,
        totalRounds: action.payload.totalRounds,
        isEmergency: action.payload.isEmergency,
        phase: state.isHost ? 'hosting' : 'playing',
        roundResult: null,
        hintData: null,
        hostSubmissions: {},
        hostRoundInfo: null,
        roundEndedData: null,
      };

    case 'TIMER_TICK':
      return { ...state, timeLeft: action.payload.timeLeft };

    case 'ANSWER_RESULT':
      return {
        ...state,
        roundResult: action.payload,
      };

    case 'ROUND_ENDED':
      return {
        ...state,
        leaderboard: action.payload.leaderboard,
        roundEndedData: action.payload,
        // Players on result screen stay there; host sees leaderboard
        phase: state.isHost ? 'leaderboard' : state.phase,
      };

    case 'LEADERBOARD_UPDATE':
      return {
        ...state,
        leaderboard: action.payload.leaderboard,
        totalRounds: action.payload.totalRounds ?? state.totalRounds,
        phase: state.isHost ? 'leaderboard' : state.phase,
      };

    case 'GAME_ENDED':
      return { ...state, finalLeaderboard: action.payload.finalLeaderboard, phase: 'final' };

    case 'HOST_DISCONNECTED':
      return { ...state, error: 'Host has disconnected.', phase: 'landing' };

    case 'ADD_REACTION': {
      const r = { ...action.payload, id: Date.now() + Math.random() };
      return { ...state, reactions: [...state.reactions.slice(-6), r] };
    }

    case 'HINT_REVEALED':
      return { ...state, hintData: action.payload };

    case 'HOST_ROUND_INFO':
      return { ...state, hostRoundInfo: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'ANSWER_SUBMITTED':
      return {
        ...state,
        hostSubmissions: {
          ...state.hostSubmissions,
          [action.payload.playerId]: action.payload,
        },
        players: state.players.map((p) =>
          p.id === action.payload.playerId
            ? { ...p, status: 'submitted', score: action.payload.score }
            : p
        ),
      };

    case 'PLAYER_PROGRESS':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId
            ? { ...p, wordCount: action.payload.wordCount }
            : p
        ),
      };

    case 'SET_PHASE':
      return { ...state, phase: action.payload };

    case 'RESET':
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      return {
        ...initialState,
        roomCode: null,
        playerName: null,
        isHost: false,
        phase: 'landing',
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
