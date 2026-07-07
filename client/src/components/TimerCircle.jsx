import React from 'react';

/**
 * Circular SVG countdown timer.
 */
export default function TimerCircle({ timeLeft, totalTime, isEmergency = false }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;
  
  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const color = isWarning || isEmergency ? '#FF4545' : '#2BD46A';
  const glowClass = isWarning || isEmergency ? 'glow-red' : 'glow-green';

  return (
    <div className={`relative flex items-center justify-center rounded-full ${glowClass} ${isWarning ? 'animate-shake' : ''}`} style={{ width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90 transform">
        <circle cx="40" cy="40" r={radius} className="timer-track" />
        <circle 
          cx="40" cy="40" r={radius} 
          className="timer-fill" 
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute text-2xl font-bold font-display" style={{ color: '#FFF' }}>
        {timeLeft}
      </div>
    </div>
  );
}
