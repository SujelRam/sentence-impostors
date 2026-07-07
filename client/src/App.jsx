import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { useSocket } from './hooks/useSocket';

// Pages
import Landing         from './pages/Landing';
import HowToPlay       from './pages/HowToPlay';
import HostRoom        from './pages/HostRoom';
import PlayerLobby     from './pages/PlayerLobby';
import PlayerGame      from './pages/PlayerGame';
import RoundResult     from './pages/RoundResult';
import FinalLeaderboard from './pages/FinalLeaderboard';

// Shared UI
import StarBackground  from './components/StarBackground';
import ReactionBubbles from './components/ReactionBubbles';

/**
 * GameRouter — watches game state and performs navigation.
 * Also boots the socket connection via useSocket().
 */
function GameRouter() {
  const { state } = useGame();
  const navigate  = useNavigate();
  useSocket(); // initialise socket & register listeners

  useEffect(() => {
    if (!state.roomCode && state.phase !== 'landing') return;

    switch (state.phase) {
      case 'lobby':
        navigate(state.isHost ? `/host/${state.roomCode}` : `/lobby/${state.roomCode}`, { replace: true });
        break;
      case 'hosting':
        navigate(`/host/${state.roomCode}`, { replace: true });
        break;
      case 'playing':
        navigate(`/play/${state.roomCode}`, { replace: true });
        break;
      case 'result':
        if (!state.isHost) navigate(`/result/${state.roomCode}`, { replace: true });
        break;
      case 'leaderboard':
        if (state.isHost) navigate(`/host/${state.roomCode}`, { replace: true });
        break;
      case 'final':
        navigate(`/final/${state.roomCode}`, { replace: true });
        break;
      case 'landing':
        navigate('/', { replace: true });
        break;
      default:
        break;
    }
  }, [state.phase, state.roomCode, state.isHost]); // eslint-disable-line

  return (
    <>
      <StarBackground />
      <ReactionBubbles />

      {/* Full-screen error toast */}
      {state.error && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down"
          style={{
            background: 'rgba(255,69,69,0.15)',
            border: '1px solid rgba(255,69,69,0.5)',
            borderRadius: 12,
            padding: '12px 24px',
            color: '#FF4545',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
          }}
        >
          ⚠️ {state.error}
          <button
            onClick={() => window.location.reload()}
            style={{ marginLeft: 16, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#FF4545' }}
          >
            Refresh
          </button>
        </div>
      )}

      <Routes>
        <Route path="/"                  element={<Landing />} />
        <Route path="/how-to-play"       element={<HowToPlay />} />
        <Route path="/host/:roomCode"    element={<HostRoom />} />
        <Route path="/lobby/:roomCode"   element={<PlayerLobby />} />
        <Route path="/play/:roomCode"    element={<PlayerGame />} />
        <Route path="/result/:roomCode"  element={<RoundResult />} />
        <Route path="/final/:roomCode"   element={<FinalLeaderboard />} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <GameRouter />
      </BrowserRouter>
    </GameProvider>
  );
}
