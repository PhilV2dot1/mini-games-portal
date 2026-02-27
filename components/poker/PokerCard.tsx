"use client";

import { Card } from "@/lib/games/poker-cards";
import { isRedSuit } from "@/lib/games/poker-cards";

interface PokerCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-10 h-14 text-sm',
  md: 'w-14 h-20 text-base',
  lg: 'w-[4.5rem] h-[6.5rem] text-lg',
};

export function PokerCard({ card, faceDown = false, size = 'md', highlight = false, className = '' }: PokerCardProps) {
  const sizeClass = SIZE_CLASSES[size];

  // Empty slot
  if (!card) {
    return (
      <div className={`${sizeClass} rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 ${className}`} />
    );
  }

  // Face down
  if (faceDown || card.faceUp === false) {
    return (
      <div className={`${sizeClass} rounded-lg border border-gray-300 dark:border-gray-600 bg-gradient-to-br from-indigo-700 to-indigo-900 flex items-center justify-center shadow-md ${className}`}>
        <span className="text-indigo-300 opacity-60 text-lg">🂠</span>
      </div>
    );
  }

  const isRed = isRedSuit(card.suit);

  return (
    <div className={`
      ${sizeClass} rounded-lg border
      ${highlight
        ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-yellow-400/20'
        : 'border-gray-200 dark:border-gray-600'
      }
      bg-white dark:bg-gray-100 shadow-md flex flex-col justify-between p-1 select-none
      ${className}
    `}>
      {/* Top-left rank + suit */}
      <div className={`leading-none font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div className="text-xs font-black">{card.display}</div>
        <div className="text-xs">{card.suit}</div>
      </div>
      {/* Center suit */}
      <div className={`text-center text-lg ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
        {card.suit}
      </div>
      {/* Bottom-right rank + suit (rotated) */}
      <div className={`leading-none font-bold self-end rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div className="text-xs font-black">{card.display}</div>
        <div className="text-xs">{card.suit}</div>
      </div>
    </div>
  );
}
