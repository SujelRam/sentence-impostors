import React from 'react';
import { useGame } from '../context/GameContext';
import ScoreBreakdown from '../components/ScoreBreakdown';

export default function RoundResult() {
  const { state } = useGame();
  const res = state.roundResult;

  if (!res) return <div className="min-h-screen flex items-center justify-center font-display text-xl animate-pulse">Waiting for round end...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10 overflow-y-auto">
      <div className="game-card w-full max-w-xl p-6 md:p-10 animate-slide-up">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold mb-2">
            {res.score.isFullyCorrect ? (
              <span className="text-c-green text-glow-green">PERFECT!</span>
            ) : res.score.total > 0 ? (
              <span className="text-c-yellow text-glow-yellow">GOOD TRY!</span>
            ) : (
              <span className="text-c-red text-glow-red">OOPS!</span>
            )}
          </h2>
          {!res.score.isFullyCorrect && res.score.total > 0 && (
            <p className="text-gray-300">You got {res.score.partialAccuracy}% of the words in the right place.</p>
          )}
        </div>

        <div className="bg-navy-950/50 border border-white/5 rounded-xl p-4 mb-6 text-center">
          <div className="text-sm text-gray-400 mb-1">Correct Sentence:</div>
          <div className="text-lg font-bold text-white">{res.correctSentence}</div>
          
          {res.hasImpostorWord && (
            <div className="mt-3 text-sm border-t border-white/10 pt-3">
              <span className="text-c-red font-bold">Impostor Word:</span> <span className="line-through text-gray-400">{res.impostorWord}</span>
            </div>
          )}
        </div>

        <ScoreBreakdown score={res.score} />

        {res.grammarExplanation && (
          <div className="mt-6 bg-c-cyan/10 border border-c-cyan/30 rounded-xl p-4 text-sm text-c-cyan">
            <strong className="block mb-1">💡 Learning Note:</strong>
            {res.grammarExplanation}
          </div>
        )}

        <div className="mt-8 text-center text-gray-400 text-sm animate-pulse">
          Look at the host screen for the leaderboard!
        </div>

      </div>
    </div>
  );
}
