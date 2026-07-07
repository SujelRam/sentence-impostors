import React from 'react';
import { useNavigate } from 'react-router-dom';
import CrewCharacter from '../components/CrewCharacter';

export default function HowToPlay() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 relative z-10 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <button onClick={() => navigate('/')} className="btn btn-secondary mb-6">
          ← Back
        </button>

        <div className="game-card p-6 md:p-10">
          <h1 className="font-display text-3xl font-bold text-glow-cyan text-center mb-8">HOW TO PLAY</h1>
          
          <div className="flex flex-col gap-8">
            <RuleSection 
              number="1"
              title="Join the Crew"
              desc="Enter the room code provided by your host to join the lobby."
              color="#3FE0E0"
            />
            
            <RuleSection 
              number="2"
              title="Fix the Scrambled Comms"
              desc="The host starts the round. You'll receive a jumbled sentence. Drag and drop the word tiles into the correct grammatical order."
              color="#F5C542"
            >
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-3">
                <div className="text-sm text-gray-400 mb-2">Scrambled:</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Tile text="apple" color="tile-red" />
                  <Tile text="ate" color="tile-green" />
                  <Tile text="The" color="tile-cyan" />
                  <Tile text="cat" color="tile-yellow" />
                  <Tile text="the" color="tile-purple" />
                </div>
                <div className="text-sm text-gray-400 mb-2">Correct:</div>
                <div className="flex flex-wrap gap-2">
                  <Tile text="The" color="tile-cyan" />
                  <Tile text="cat" color="tile-yellow" />
                  <Tile text="ate" color="tile-green" />
                  <Tile text="the" color="tile-purple" />
                  <Tile text="apple" color="tile-red" />
                </div>
              </div>
            </RuleSection>

            <RuleSection 
              number="3"
              title="Beat the Timer"
              desc="Submit your answer before the 60-second timer runs out. Faster submissions earn a Time Bonus!"
              color="#2BD46A"
            />

            <RuleSection 
              number="4"
              title="Beware the Impostor Word!"
              desc="In some rounds, there is an extra word that doesn't belong. Find it and leave it out of your sentence for bonus points."
              color="#FF4545"
            >
              <div className="flex justify-center mt-4 animate-shake">
                <CrewCharacter color="#FF4545" size={60} label="Impostor" />
              </div>
            </RuleSection>

          </div>

          <div className="mt-10 text-center">
            <button onClick={() => navigate('/')} className="btn btn-primary w-full max-w-xs text-lg">
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleSection({ number, title, desc, color, children }) {
  return (
    <div className="flex gap-4 items-start">
      <div 
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-xl text-navy-900 mt-1"
        style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}80` }}
      >
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-xl mb-1 text-white">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{desc}</p>
        {children}
      </div>
    </div>
  );
}

function Tile({ text, color }) {
  return (
    <span className={`px-3 py-1 rounded-md text-sm font-bold border ${color}`}>
      {text}
    </span>
  );
}
