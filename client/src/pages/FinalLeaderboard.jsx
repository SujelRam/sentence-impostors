import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';
import { useSound } from '../hooks/useSound';

// Using standard emoji confetti
function ConfettiParticle() {
  const emojis = ['✨', '🚀', '🎉', '🌟', '💥'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  const left = `${Math.random() * 100}%`;
  const size = `${Math.random() * 1.5 + 0.8}rem`;
  const delay = `${Math.random() * 2}s`;
  const duration = `${Math.random() * 1.5 + 1.5}s`;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        fontSize: size,
        top: '-10%',
        animation: `confettiFall ${duration} ease-in forwards`,
        animationDelay: delay,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {emoji}
    </div>
  );
}

export default function FinalLeaderboard() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const { playCorrect } = useSound();

  useEffect(() => {
    playCorrect();
  }, [playCorrect]);

  const lb = state.finalLeaderboard || [];
  const top3 = lb.slice(0, 3);
  const others = lb.slice(3);

  const handleHome = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden">
      {/* Confetti generator */}
      {Array.from({ length: 40 }).map((_, i) => <ConfettiParticle key={i} />)}

      <div className="w-full max-w-3xl text-center flex flex-col items-center mt-10">
        <h1 className="font-display text-4xl md:text-5xl font-black mb-2 text-glow-yellow text-c-yellow animate-slide-down">
          GAME OVER!
        </h1>
        <p className="text-gray-300 mb-10 font-medium">The Impostors have been exposed.</p>

        {/* Podium Layout */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-2 sm:gap-4 mb-12 h-64 animate-scale-in w-full px-4">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="flex flex-col items-center flex-1 max-w-[140px] opacity-90 relative z-10">
                <div className="text-xl font-bold text-white truncate w-full px-1">{top3[1].name}</div>
                <div className="text-sm text-gray-400 mb-2">{top3[1].totalScore} pts</div>
                <div className="w-full h-32 bg-gradient-to-t from-gray-700 to-gray-500 rounded-t-xl border border-gray-400 flex items-start justify-center pt-4 shadow-lg">
                  <span className="text-4xl">🥈</span>
                </div>
              </div>
            )}
            
            {/* 1st Place */}
            {top3[0] && (
              <div className="flex flex-col items-center flex-1 max-w-[160px] relative z-20">
                <div className="text-c-yellow text-xs font-black uppercase tracking-widest mb-1 animate-pulse">Champion</div>
                <div className="text-2xl font-black text-white truncate w-full px-1 text-shadow">{top3[0].name}</div>
                <div className="text-base font-bold text-c-yellow mb-2">{top3[0].totalScore} pts</div>
                <div className="w-full h-44 bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-t-xl border border-yellow-300 flex items-start justify-center pt-4 shadow-glow-yellow">
                  <span className="text-5xl drop-shadow-md">👑</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="flex flex-col items-center flex-1 max-w-[140px] opacity-80 relative z-10">
                <div className="text-xl font-bold text-white truncate w-full px-1">{top3[2].name}</div>
                <div className="text-sm text-gray-400 mb-2">{top3[2].totalScore} pts</div>
                <div className="w-full h-24 bg-gradient-to-t from-orange-800 to-orange-600 rounded-t-xl border border-orange-500 flex items-start justify-center pt-3 shadow-lg">
                  <span className="text-3xl">🥉</span>
                </div>
              </div>
            )}
          </div>
        )}

        {others.length > 0 && (
          <div className="game-card p-6 mb-8 text-left max-h-80 overflow-y-auto w-full max-w-2xl">
            <h3 className="font-bold text-xl mb-4 text-white pl-2">Other Standings</h3>
            <Leaderboard data={others} animate={false} />
          </div>
        )}

        <button onClick={handleHome} className="btn btn-secondary px-10">
          Return to Home
        </button>
      </div>
    </div>
  );
}
