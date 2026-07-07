/** Misc helper utilities */

const TILE_COLORS = ['tile-cyan', 'tile-yellow', 'tile-green', 'tile-red', 'tile-purple', 'tile-orange', 'tile-pink'];

/**
 * Assign a colour class to a word tile deterministically by its index.
 */
export function tileColor(index) {
  return TILE_COLORS[index % TILE_COLORS.length];
}

/**
 * Rank medal emoji for positions 1–3.
 */
export function rankMedal(rank) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
}

/**
 * Format seconds as MM:SS.
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Copy text to clipboard and return true on success.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Difficulty badge styling.
 */
export function difficultyStyle(difficulty) {
  switch (difficulty) {
    case 'easy':   return { label: 'Easy',   color: '#2BD46A', bg: 'rgba(43,212,106,0.15)' };
    case 'medium': return { label: 'Medium', color: '#F5C542', bg: 'rgba(245,197,66,0.15)' };
    case 'hard':   return { label: 'Hard',   color: '#FF4545', bg: 'rgba(255,69,69,0.15)' };
    default:       return { label: difficulty, color: '#3FE0E0', bg: 'rgba(63,224,224,0.15)' };
  }
}

/**
 * Pick a random element from an array.
 */
export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Crew character colour palette (Among Us style) */
export const CREW_COLORS = [
  '#FF4545', '#3FE0E0', '#2BD46A', '#A855F7',
  '#F97316', '#F5C542', '#EC4899', '#60A5FA',
  '#34D399', '#FB923C',
];
