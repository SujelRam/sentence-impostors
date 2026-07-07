import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rankMedal } from '../utils/helpers';
import CrewCharacter from './CrewCharacter';
import { CREW_COLORS } from '../utils/helpers';

export default function Leaderboard({ data = [], animate = true }) {
  if (!data || data.length === 0) return <div className="text-gray-400 italic text-center">No players yet.</div>;

  return (
    <div className="w-full flex flex-col gap-3">
      <AnimatePresence>
        {data.map((player) => {
          const isTop3 = player.rank <= 3;
          const bgClass = player.rank === 1 ? 'lb-row-1' : player.rank === 2 ? 'lb-row-2' : player.rank === 3 ? 'lb-row-3' : 'lb-row-n';
          const glowClass = player.rank === 1 ? 'shadow-glow-yellow' : '';
          const crewColor = CREW_COLORS[(player.name.length + player.rank) % CREW_COLORS.length];

          return (
            <motion.div
              key={player.id}
              layout={animate}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`flex items-center justify-between p-3 rounded-xl ${bgClass} ${glowClass}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 text-center text-xl font-bold font-display">
                  {rankMedal(player.rank)}
                </div>
                <div className="hidden sm:block">
                  <CrewCharacter color={crewColor} size={36} />
                </div>
                <div>
                  <div className="font-bold text-lg">{player.name}</div>
                  {player.badges && player.badges.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1 flex gap-1">
                      {player.badges.map((b, i) => <span key={i} title={b.label}>{b.label.split(' ')[0]}</span>)}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold font-display text-white">
                  {player.totalScore} <span className="text-sm text-gray-400">pts</span>
                </div>
                {player.roundScore > 0 && (
                  <div className="text-sm text-c-green font-bold animate-slide-up">
                    +{player.roundScore}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
