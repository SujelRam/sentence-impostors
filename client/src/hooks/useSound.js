import { useCallback, useRef } from 'react';

/**
 * useSound — lightweight Web Audio API sound effects.
 * No external library required.
 */
export function useSound() {
  const ctxRef = useRef(null);

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }

  /** Play a simple beep tone */
  function playTone(frequency, duration, type = 'sine', gainValue = 0.25) {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_) { /* silently ignore if audio not available */ }
  }

  /** Ascending 3-note jingle (round start) */
  const playRoundStart = useCallback(() => {
    playTone(440, 0.12);
    setTimeout(() => playTone(550, 0.12), 140);
    setTimeout(() => playTone(660, 0.2), 280);
  }, []);

  /** Quick blip (tile click) */
  const playTileClick = useCallback(() => {
    playTone(880, 0.06, 'square', 0.12);
  }, []);

  /** Triumphant fanfare (correct answer) */
  const playCorrect = useCallback(() => {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.18, 'sine', 0.28), i * 110);
    });
  }, []);

  /** Buzzer (wrong / timer out) */
  const playWrong = useCallback(() => {
    playTone(180, 0.4, 'sawtooth', 0.18);
  }, []);

  /** Urgent ticking (timer warning at 10s) */
  const playTimerWarning = useCallback(() => {
    playTone(880, 0.08, 'square', 0.2);
    setTimeout(() => playTone(880, 0.08, 'square', 0.2), 200);
  }, []);

  /** Whoosh sound (leaderboard reveal) */
  const playLeaderboard = useCallback(() => {
    try {
      const ctx = getCtx();
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.2;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch (_) {}
  }, []);

  /** Countdown beep */
  const playCountdown = useCallback((n) => {
    if (n > 0) playTone(660, 0.15, 'sine', 0.3);
    else {
      playTone(880, 0.08); setTimeout(() => playTone(1100, 0.2), 100);
    }
  }, []);

  return { playRoundStart, playTileClick, playCorrect, playWrong, playTimerWarning, playLeaderboard, playCountdown };
}
