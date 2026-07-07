import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../hooks/useSocket';
import { copyToClipboard } from '../utils/helpers';
import ProgressBar from '../components/ProgressBar';
import TimerCircle from '../components/TimerCircle';
import Leaderboard from '../components/Leaderboard';

export default function HostRoom() {
  const { state } = useGame();
  const { startRound, nextQuestion, endGame, kickPlayer } = useSocket();

  const handleCopy = () => {
    copyToClipboard(state.roomCode);
  };

  // ── Render Helpers ────────────────────────────────────────────────────────
  const renderLobby = () => (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 game-card p-8 text-center flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-300">ROOM CODE</h2>
        <div className="room-code text-6xl mb-6">{state.roomCode}</div>
        <button onClick={handleCopy} className="btn btn-secondary mb-8">Copy Join Link</button>
        
        {state.players.length > 0 ? (
          <button onClick={() => startRound(state.roomCode)} className="btn btn-primary text-xl py-4 px-12 animate-pulse-glow">
            START GAME
          </button>
        ) : (
          <div className="text-c-yellow font-bold animate-pulse">Waiting for players to join...</div>
        )}
      </div>

      <div className="flex-1 game-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Crew ({state.players.length})</h3>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {state.players.length === 0 && <div className="text-gray-400 italic">Lobby is empty.</div>}
          {state.players.map(p => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center">
              <span className="font-bold text-lg">{p.name}</span>
              <button onClick={() => kickPlayer(state.roomCode, p.id)} className="text-red-400 hover:text-red-300 text-sm underline">Kick</button>
            </div>
          ))}
        </div>
        </div>
      </div>
  );

  const renderActiveRound = () => {
    const answeredCount = Object.keys(state.hostSubmissions).length;
    
    return (
      <div className="flex flex-col gap-6">
        <div className="game-card p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1">
            <div className="text-gray-400 font-bold mb-1">ROUND {state.roundNumber} OF {state.totalRounds}</div>
            <ProgressBar current={state.roundNumber} total={state.totalRounds} />
            {state.isEmergency && (
              <div className="text-c-red font-bold mt-2 animate-pulse text-sm">🚨 EMERGENCY ROUND (2x POINTS, 30s)</div>
            )}
          </div>
          
          <TimerCircle timeLeft={state.timeLeft} totalTime={state.totalTime} isEmergency={state.isEmergency} />
          
          <div className="flex-1 text-right">
            <div className="text-2xl font-bold"><span className="text-c-green">{answeredCount}</span> / {state.players.length}</div>
            <div className="text-gray-400 text-sm">Submitted</div>
          </div>
        </div>

        {/* Display scrambled words to host */}
        {state.currentQuestion && (
          <div className="bg-navy-950/40 border border-c-cyan/30 shadow-[0_0_15px_rgba(63,224,224,0.2)] p-6 rounded-xl text-center mb-6 animate-pulse">
            <div className="text-sm text-gray-400 mb-4 tracking-widest uppercase">Scrambled Words</div>
            <div className="flex flex-wrap justify-center gap-3">
              {state.currentQuestion.scrambledWords.map((w, i) => (
                <span key={i} className="px-4 py-2 rounded-lg text-lg font-bold border border-white/20 bg-white/5 text-white shadow-sm">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.players.map(p => {
            const sub = state.hostSubmissions[p.id];
            const isSub = !!sub;
            return (
              <div key={p.id} className={`p-4 rounded-xl border ${isSub ? 'bg-c-green/10 border-c-green/30' : 'bg-white/5 border-white/10'} transition-colors`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">{p.name}</span>
                  <span className={isSub ? 'status-submitted' : 'status-answering'}>
                    {isSub ? 'Done' : 'Thinking...'}
                  </span>
                </div>
                {!isSub ? (
                  <div className="text-sm text-gray-400 mt-2">
                    Words arranged: <span className="text-white font-bold">{p.wordCount || 0}</span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-c-green mt-2 animate-slide-up">
                    Score: +{sub.score}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLeaderboardPhase = () => (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full gap-6">
      <div className="game-card w-full p-8">
        <h2 className="text-3xl font-display font-bold text-center mb-6 text-glow-cyan">ROUND RESULTS</h2>
        
        {state.roundEndedData && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-center">
            <div className="text-sm text-gray-400 mb-1">Correct Sentence:</div>
            <div className="text-lg font-bold text-white mb-2">{state.roundEndedData.correctSentence}</div>
            {state.roundEndedData.fastestPlayerName && (
              <div className="text-sm text-c-yellow font-bold mt-2">
                ⚡ Fastest: {state.roundEndedData.fastestPlayerName}
              </div>
            )}
          </div>
        )}

        <Leaderboard data={state.leaderboard} />
        
        <div className="mt-8 flex justify-center">
          <button onClick={() => nextQuestion(state.roomCode)} className="btn btn-primary px-12 text-xl py-4 shadow-glow-cyan animate-pulse-glow">
            {state.roundNumber >= state.totalRounds ? 'Show Final Podium' : 'Next Round →'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      {state.phase === 'lobby' && renderLobby()}
      {(state.phase === 'hosting' || state.phase === 'playing') && renderActiveRound()}
      {state.phase === 'leaderboard' && renderLeaderboardPhase()}
    </div>
  );
}
