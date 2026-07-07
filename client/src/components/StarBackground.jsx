import React, { useMemo } from 'react';

/** Deterministic star field + nebulae + planets + shooting stars */

// 200 stars with golden-ratio spacing
const STARS = Array.from({ length: 200 }, (_, i) => ({
  id: i,
  top:  `${((i * 137.508) % 100).toFixed(2)}%`,
  left: `${((i * 97.303)  % 100).toFixed(2)}%`,
  size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.1,
  duration: `${2 + (i % 4)}s`,
  delay: `${((i * 0.37) % 3).toFixed(2)}s`,
  opacity: 0.2 + (i % 7) * 0.1,
}));

const NEBULAE = [
  { top: '8%',  left: '18%', size: 420, color: 'rgba(63,224,224,0.05)',  blur: 90 },
  { top: '62%', left: '72%', size: 500, color: 'rgba(168,85,247,0.05)',  blur: 110 },
  { top: '35%', left: '48%', size: 580, color: 'rgba(63,224,224,0.025)', blur: 130 },
  { top: '80%', left: '10%', size: 340, color: 'rgba(43,212,106,0.04)',  blur: 80 },
  { top: '20%', left: '80%', size: 300, color: 'rgba(245,197,66,0.03)',  blur: 80 },
];

const SHOOTING_STARS = [
  { top: '15%', left: '60%', delay: '2s' },
  { top: '40%', left: '20%', delay: '7s' },
  { top: '70%', left: '85%', delay: '12s' },
];

export default function StarBackground() {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        overflow: 'hidden', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 10%, rgba(11,16,43,1) 0%, #020510 70%)',
      }}
    >
      {/* Nebula glows */}
      {NEBULAE.map((n, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: n.top, left: n.left,
            width: n.size, height: n.size,
            background: n.color,
            filter: `blur(${n.blur}px)`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Stars */}
      {STARS.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: 'white',
            opacity: s.opacity,
            animation: `twinkle ${s.duration} ease-in-out infinite alternate`,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* Shooting stars */}
      {SHOOTING_STARS.map((ss, i) => (
        <div
          key={i}
          className="shooting-star"
          style={{ top: ss.top, left: ss.left, '--delay': ss.delay }}
        />
      ))}

      {/* Saturn-like planet top-right */}
      <div style={{ position: 'absolute', top: '12%', right: '7%', animation: 'float 7s ease-in-out infinite' }}>
        <div style={{
          width: 68, height: 68,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 34% 34%, #C084FC, #7C3AED 60%, #3B0764)',
          boxShadow: '0 0 34px rgba(168,85,247,0.45)',
          position: 'relative',
        }}>
          {/* Ring */}
          <div style={{
            position: 'absolute', top: '50%', left: '-28%',
            width: '156%', height: 22,
            border: '3px solid rgba(196,132,252,0.38)',
            borderRadius: '50%',
            transform: 'translateY(-50%) rotateX(68deg)',
          }} />
        </div>
      </div>

      {/* Small cyan planet bottom-left */}
      <div style={{ position: 'absolute', top: '72%', left: '3%', animation: 'float 9s ease-in-out infinite', animationDelay: '2.5s' }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 34% 34%, #67E8F9, #0E7490 60%, #082F49)',
          boxShadow: '0 0 24px rgba(63,224,224,0.4)',
        }} />
      </div>

      {/* Asteroid cluster detail */}
      <div style={{ position: 'absolute', top: '32%', right: '13%' }}>
        {[4, 3, 5, 2, 4].map((sz, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: sz, height: sz - 1,
            background: 'rgba(200,200,210,0.35)',
            borderRadius: '50%',
            top: i * 13, left: i * 9,
          }} />
        ))}
      </div>
    </div>
  );
}
