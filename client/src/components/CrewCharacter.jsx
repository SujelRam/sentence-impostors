import React from 'react';

/**
 * Among-Us–style crew character rendered in pure SVG.
 * Props:
 *  color    — fill colour (hex or css)
 *  size     — pixel size (default 80)
 *  animate  — float animation (default false)
 *  label    — name label below
 *  badge    — small emoji badge in top-right
 */
export default function CrewCharacter({ color = '#3FE0E0', size = 80, animate = false, label, badge }) {
  const h = size;
  const w = size * 0.75;

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        animation: animate ? 'float 3.5s ease-in-out infinite' : undefined,
      }}
    >
      <div style={{ position: 'relative' }}>
        <svg width={w} height={h} viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <ellipse cx="30" cy="48" rx="22" ry="28" fill={color} />
          {/* Head */}
          <ellipse cx="30" cy="26" rx="20" ry="18" fill={color} />
          {/* Visor */}
          <ellipse cx="30" cy="24" rx="13" ry="10" fill="rgba(100,220,255,0.85)" />
          {/* Visor shine */}
          <ellipse cx="25" cy="20" rx="5" ry="3.5" fill="rgba(255,255,255,0.45)" />
          {/* Backpack */}
          <rect x="49" y="38" width="9" height="18" rx="4" fill={color} />
          <rect x="50" y="40" width="7" height="14" rx="3" fill={darken(color, 0.18)} />
          {/* Left leg */}
          <rect x="16" y="70" width="11" height="8" rx="5" fill={color} />
          {/* Right leg */}
          <rect x="33" y="70" width="11" height="8" rx="5" fill={color} />
          {/* Shine on body */}
          <ellipse cx="20" cy="44" rx="5" ry="8" fill="rgba(255,255,255,0.1)" />
        </svg>

        {badge && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            fontSize: size * 0.22, lineHeight: 1,
          }}>
            {badge}
          </span>
        )}
      </div>

      {label && (
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: size * 0.16,
          color: '#EAF0FF',
          textAlign: 'center',
          maxWidth: w + 20,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

/** Slightly darken a hex colour for the backpack detail */
function darken(hex, amount) {
  const c = hex.replace('#', '');
  const num = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8)  & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, ( num        & 0xff) - Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}
