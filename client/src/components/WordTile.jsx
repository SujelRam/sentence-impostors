import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function WordTile({ id, word, colorClass, disabled = false, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (onClick && !disabled && !isDragging) {
          onClick(id);
        }
      }}
      className={`word-tile ${colorClass} ${disabled ? 'word-tile-disabled' : ''} ${isDragging ? 'word-tile-dragging' : ''}`}
    >
      {word}
    </div>
  );
}
