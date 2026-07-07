import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import CrewCharacter from '../components/CrewCharacter';

export default function Landing() {
  const navigate = useNavigate();
  const { createRoom, joinRoom } = useSocket();
  
  const [joinMode, setJoinMode] = useState(false);
  const [hostMode, setHostMode] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('mixed');

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim() && playerName.trim()) {
      joinRoom(roomCode.toUpperCase(), playerName.trim());
    }
  };

  const handleHost = (e) => {
    e.preventDefault();
    createRoom({ numQuestions: Number(numQuestions), difficulty });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
      <div className="absolute top-10 w-full flex justify-center animate-float">
        <CrewCharacter color="#3FE0E0" size={100} />
      </div>

      <div className="game-card max-w-md w-full p-8 text-center mt-20 animate-slide-up">
        <h1 className="font-display text-4xl font-black mb-2 tracking-wider text-white text-glow-cyan">
          SENTENCE <br/><span className="text-c-red text-glow-red">IMPOSTORS</span>
        </h1>
        <p className="text-gray-300 mb-8 font-medium">
          Rearrange the scrambled crew words into the correct sentence!
        </p>

        {!joinMode && !hostMode ? (
          <div className="flex flex-col gap-4">
            <button onClick={() => setJoinMode(true)} className="btn btn-primary w-full text-lg py-4">
              Join Game
            </button>
            <button onClick={() => setHostMode(true)} className="btn btn-secondary w-full text-lg py-4">
              Host Game
            </button>
            <button onClick={() => navigate('/how-to-play')} className="text-gray-400 hover:text-white underline mt-4 text-sm font-medium">
              How to Play?
            </button>
          </div>
        ) : hostMode ? (
          <form onSubmit={handleHost} className="flex flex-col gap-4 animate-scale-in text-left">
            <div>
              <label className="text-gray-400 text-sm font-bold mb-1 block">Number of Questions (1-25)</label>
              <input type="number" min="1" max="25" value={numQuestions} onChange={e => setNumQuestions(e.target.value)} className="game-input text-center" required />
            </div>
            <div>
              <label className="text-gray-400 text-sm font-bold mb-1 block">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="game-input text-center bg-navy-800">
                <option value="mixed">Mixed (All Levels)</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setHostMode(false)} className="btn btn-secondary flex-1">Back</button>
              <button type="submit" className="btn btn-primary flex-1">Create Room</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4 animate-scale-in">
            <input 
              type="text" 
              placeholder="Room Code (e.g. ABCD)" 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="game-input text-center text-xl font-display tracking-widest uppercase"
              maxLength={6}
              required
            />
            <input 
              type="text" 
              placeholder="Your Name" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="game-input text-center text-lg"
              maxLength={12}
              required
            />
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setJoinMode(false)} className="btn btn-secondary flex-1">
                Back
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={!roomCode || !playerName}>
                Enter
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
