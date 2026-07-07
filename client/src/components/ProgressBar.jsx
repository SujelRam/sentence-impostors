import React from 'react';

export default function ProgressBar({ current, total, color = '#3FE0E0' }) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  
  return (
    <div className="progress-container">
      <div 
        className="progress-fill" 
        style={{ width: `${percentage}%`, backgroundColor: color }} 
      />
    </div>
  );
}
