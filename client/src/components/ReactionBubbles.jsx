import React from 'react';
import { useGame } from '../context/GameContext';

/**
 * Renders floating emoji reactions sent by players/host.
 */
export default function ReactionBubbles() {
  const { state } = useGame();

  if (!state.reactions || state.reactions.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '10%', right: '5%', zIndex: 9999, pointerEvents: 'none' }}>
      {state.reactions.map((r) => (
        <div key={r.id} className="reaction-bubble" style={{
          left: `${(Math.random() - 0.5) * 80}px`,
          animationDelay: `${Math.random() * 0.2}s`,
        }}>
          {r.reaction}
          <div style={{
            fontSize: '0.6rem', color: '#FFF', textShadow: '0 0 4px #000',
            textAlign: 'center', marginTop: -6, background: 'rgba(0,0,0,0.5)',
            borderRadius: 4, padding: '0 4px', whiteSpace: 'nowrap'
          }}>
            {r.senderName}
          </div>
        </div>
      ))}
    </div>
  );
}
