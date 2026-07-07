import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../hooks/useSocket';
import { useSound } from '../hooks/useSound';
import { tileColor } from '../utils/helpers';
import TimerCircle from '../components/TimerCircle';
import ProgressBar from '../components/ProgressBar';
import WordTile from '../components/WordTile';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export default function PlayerGame() {
  const { state } = useGame();
  const { submitAnswer, updateProgress, sendReaction } = useSocket();
  const { playRoundStart, playTileClick, playTimerWarning } = useSound();
  
  const q = state.currentQuestion;
  const [bankWords, setBankWords] = useState([]);
  const [answerWords, setAnswerWords] = useState([]);
  const [timeTaken, setTimeTaken] = useState(0);

  // Initialize words
  useEffect(() => {
    if (q && q.scrambledWords) {
      setBankWords(q.scrambledWords.map((w, i) => ({ id: `word-${i}`, word: w, color: tileColor(i) })));
      setAnswerWords([]);
      setTimeTaken(0);
      playRoundStart();
    }
  }, [q, playRoundStart]);

  // Track time taken
  useEffect(() => {
    if (state.timeLeft === 10) playTimerWarning();
    if (state.timeLeft < state.totalTime && state.timeLeft > 0 && !state.roundResult) {
      setTimeTaken(state.totalTime - state.timeLeft);
    }
  }, [state.timeLeft, state.totalTime, playTimerWarning, state.roundResult]);

  // Report progress live
  useEffect(() => {
    updateProgress(state.roomCode, answerWords.length);
  }, [answerWords.length, state.roomCode, updateProgress]);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    playTileClick();

    const activeId = active.id;
    const overId = over.id;

    // Find where the item came from
    const fromBank = bankWords.find(w => w.id === activeId);
    const fromAnswer = answerWords.find(w => w.id === activeId);
    const item = fromBank || fromAnswer;

    if (!item) return;

    // Reordering within Answer Zone
    if (fromAnswer && answerWords.some(w => w.id === overId)) {
      const oldIndex = answerWords.findIndex(w => w.id === activeId);
      const newIndex = answerWords.findIndex(w => w.id === overId);
      setAnswerWords(arrayMove(answerWords, oldIndex, newIndex));
      return;
    }

    // Moving from Bank to Answer
    if (fromBank && (overId === 'answer-zone' || answerWords.some(w => w.id === overId))) {
      setBankWords(prev => prev.filter(w => w.id !== activeId));
      
      if (overId === 'answer-zone') {
        setAnswerWords(prev => [...prev, item]);
      } else {
        const insertIndex = answerWords.findIndex(w => w.id === overId);
        setAnswerWords(prev => {
          const arr = [...prev];
          arr.splice(insertIndex, 0, item);
          return arr;
        });
      }
      return;
    }

    // Moving from Answer to Bank
    if (fromAnswer && overId === 'bank-zone') {
      setAnswerWords(prev => prev.filter(w => w.id !== activeId));
      setBankWords(prev => [...prev, item]);
    }
  };

  // Click to move (accessibility / mobile fallback)
  const handleTileClick = (id, source) => {
    playTileClick();
    if (source === 'bank') {
      const item = bankWords.find(w => w.id === id);
      setBankWords(prev => prev.filter(w => w.id !== id));
      setAnswerWords(prev => [...prev, item]);
    } else {
      const item = answerWords.find(w => w.id === id);
      setAnswerWords(prev => prev.filter(w => w.id !== id));
      setBankWords(prev => [...prev, item]);
    }
  };

  const handleSubmit = () => {
    if (answerWords.length === 0) return;
    const answerStrArray = answerWords.map(w => w.word);
    submitAnswer(state.roomCode, answerStrArray, timeTaken, false);
  };

  if (!q) return <div className="text-center mt-20 text-xl font-bold animate-pulse">Loading round...</div>;

  const isRoundEnded = state.timeLeft <= 0;
  const myPlayer = state.players.find(p => p.name === state.playerName);
  const isSubmitted = myPlayer?.status === 'submitted';
  const disabledState = isSubmitted || isRoundEnded;

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 relative z-10">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <div className="text-gray-400 font-bold mb-1 text-sm md:text-base">ROUND {state.roundNumber}</div>
          <ProgressBar current={state.timeLeft} total={state.totalTime} color={state.timeLeft <= 10 ? '#FF4545' : '#2BD46A'} />
        </div>
        <div className="mx-6">
          <TimerCircle timeLeft={state.timeLeft} totalTime={state.totalTime} isEmergency={state.isEmergency} />
        </div>
        <div className="flex-1"></div>
      </div>

      {/* Main Drag & Drop Area */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        
        {/* Answer Zone */}
        <div className="mb-6 flex-1 flex flex-col">
          <h3 className="text-gray-400 font-bold mb-2 uppercase tracking-wide">Your Answer:</h3>
          <SortableContext items={answerWords.map(w => w.id)} strategy={rectSortingStrategy}>
            <div 
              id="answer-zone" 
              className={`drop-zone flex-1 bg-navy-950/40 p-4 min-h-[140px] items-start content-start ${disabledState ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {answerWords.length === 0 && <span className="text-gray-500 italic m-auto">Drag words here...</span>}
              {answerWords.map(item => (
                <WordTile key={item.id} id={item.id} word={item.word} colorClass={item.color} disabled={disabledState} onClick={() => handleTileClick(item.id, 'answer')} />
              ))}
            </div>
          </SortableContext>
        </div>

        {/* Bank Zone */}
        <div className="mb-8">
          <h3 className="text-gray-400 font-bold mb-2 uppercase tracking-wide">Word Bank:</h3>
          <SortableContext items={bankWords.map(w => w.id)} strategy={rectSortingStrategy}>
            <div 
              id="bank-zone" 
              className={`drop-zone bg-black/20 p-4 min-h-[120px] ${disabledState ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {bankWords.map(item => (
                <WordTile key={item.id} id={item.id} word={item.word} colorClass={item.color} disabled={disabledState} onClick={() => handleTileClick(item.id, 'bank')} />
              ))}
            </div>
          </SortableContext>
        </div>

      </DndContext>

      {/* Footer Controls */}
      <div className="flex justify-between items-center mt-auto pb-4">
        <button 
          onClick={() => { setBankWords([...bankWords, ...answerWords]); setAnswerWords([]); }}
          disabled={disabledState || answerWords.length === 0}
          className="btn btn-secondary"
        >
          Clear
        </button>
        
        {isSubmitted || isRoundEnded ? (
          <div className="flex flex-col items-center">
            <div className={`font-bold text-xl mb-4 ${isSubmitted ? 'text-c-green' : 'text-c-yellow'} animate-pulse`}>
              {isSubmitted ? 'Submitted! Waiting...' : "Time's up! Waiting..."}
            </div>
            
            {/* Reaction Buttons */}
            <div className="flex gap-3 bg-navy-900/50 p-2 rounded-full border border-white/10 shadow-lg">
              {['🚀', '🤯', '😂', '🎯', '🔥'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(state.roomCode, emoji)}
                  className="w-10 h-10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center text-xl hover:scale-110 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={answerWords.length === 0}
            className="btn btn-primary px-10 text-lg"
          >
            SUBMIT
          </button>
        )}
      </div>

    </div>
  );
}
