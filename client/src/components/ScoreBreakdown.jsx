import React from 'react';
import { motion } from 'framer-motion';

export default function ScoreBreakdown({ score }) {
  if (!score) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-w-sm mx-auto">
      <ScoreRow label="Sentence Accuracy" value={score.sentenceScore} max={70} color="text-c-cyan" delay={0.1} />
      <ScoreRow label="Grammar Accuracy" value={score.grammarScore} max={20} color="text-c-yellow" delay={0.3} />
      <ScoreRow label="Time Bonus" value={score.timeBonus} max={10} color="text-c-green" delay={0.5} />
      
      {score.impostorBonus > 0 && (
        <ScoreRow label="Impostor Bonus" value={score.impostorBonus} color="text-c-purple" delay={0.7} />
      )}
      
      {score.streakBonus > 0 && (
        <ScoreRow label="Streak Bonus" value={score.streakBonus} color="text-c-orange" delay={0.9} />
      )}
      
      {score.hintPenalty > 0 && (
        <div className="flex justify-between items-center py-1 border-b border-white/10 text-c-red font-bold animate-slide-up" style={{ animationDelay: '1.1s', animationFillMode: 'both' }}>
          <span>Hint Used</span>
          <span>-{score.hintPenalty}</span>
        </div>
      )}

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.3, type: 'spring' }}
        className="flex justify-between items-center py-3 mt-2 text-2xl font-bold font-display"
      >
        <span>TOTAL</span>
        <span className="text-white text-glow-cyan">{score.total}</span>
      </motion.div>
    </div>
  );
}

function ScoreRow({ label, value, max, color, delay }) {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
      className="flex justify-between items-center py-2 border-b border-white/10"
    >
      <span className="text-gray-300 font-medium">{label}</span>
      <div className={`font-bold ${color}`}>
        {value > 0 ? '+' : ''}{value} {max && <span className="text-xs opacity-50">/ {max}</span>}
      </div>
    </motion.div>
  );
}
