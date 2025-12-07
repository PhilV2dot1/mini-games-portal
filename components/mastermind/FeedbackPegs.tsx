"use client";

import { Feedback } from "@/lib/games/mastermind-logic";

interface FeedbackPegsProps {
  feedback: Feedback;
}

export function FeedbackPegs({ feedback }: FeedbackPegsProps) {
  const pegs = [
    ...Array(feedback.blackPegs).fill('black'),
    ...Array(feedback.whitePegs).fill('white'),
    ...Array(4 - feedback.blackPegs - feedback.whitePegs).fill('empty'),
  ];

  return (
    <div className="grid grid-cols-2 gap-1 ml-auto">
      {pegs.map((type, i) => (
        <div
          key={i}
          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2"
          style={{
            backgroundColor: type === 'black' ? '#1f2937' : type === 'white' ? '#f3f4f6' : 'transparent',
            borderColor: type === 'empty' ? '#d1d5db' : type === 'black' ? '#111827' : '#9ca3af',
          }}
        />
      ))}
    </div>
  );
}
