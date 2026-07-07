import React from 'react';
import { useGame } from '../context/GameContext';
import CrewCharacter from '../components/CrewCharacter';
import { CREW_COLORS, copyToClipboard } from '../utils/helpers';
import { motion } from 'framer-motion';

export default function PlayerLobby() {
  const { state } = useGame();

  const handleCopy = () => {
    copyToClipboard(state.roomCode);
    alert('Room code copied!'); // Could use a toast here
  };

  const myPlayerIndex = state.players.findIndex(p => p.id === state.socket?.id);
  const myColor = CREW_COLORS[(state.playerName.length + (myPlayerIndex > -1 ? myPlayerIndex : 0)) % CREW_COLORS.length];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
      <div className="game-card w-full max-w-md p-8 text-center animate-scale-in">
        <h2 className="text-xl text-gray-400 font-bold mb-2">YOU'RE IN!</h2>
        <div className="flex justify-center mb-6">
          <CrewCharacter color={myColor} size={120} animate label={state.playerName} />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 relative">
          <div className="text-sm text-gray-400 mb-1">Room Code</div>
          <div className="room-code tracking-widest">{state.roomCode}</div>
          <button 
            onClick={handleCopy}
            className="absolute top-2 right-2 text-xs bg-white/10 px-2 py-1 rounded text-gray-300 hover:text-white"
          >
            Copy
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-4 h-4 rounded-full bg-c-yellow animate-pulse"></div>
          <span className="text-lg font-bold text-c-yellow">Waiting for host to start...</span>
        </div>

        <div className="text-left">
          <div className="text-sm text-gray-400 mb-2">Crew Members ({state.players.length}):</div>
          <div className="flex flex-wrap gap-2">
            {state.players.map((p, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                key={p.id} 
                className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium"
              >
                {p.name}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
