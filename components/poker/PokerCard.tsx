"use client";

import { Card } from "@/lib/games/poker-cards";
import { PlayingCard } from "@/components/shared/PlayingCard";

interface PokerCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  className?: string;
}

export function PokerCard({ card, faceDown = false, size = 'md', highlight = false, className = '' }: PokerCardProps) {
  // Empty slot
  if (!card) {
    const slotSizes = { sm: 'w-10 h-14', md: 'w-14 h-20', lg: 'w-[4.5rem] h-[6.5rem]' };
    return (
      <div className={`${slotSizes[size]} rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 ${className}`} />
    );
  }

  const svgSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
  const glowClass = highlight ? 'drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]' : '';

  return (
    <PlayingCard
      suit={card.suit}
      value={card.value}
      faceDown={faceDown || card.faceUp === false}
      size={svgSize}
      className={`${glowClass} ${className}`}
    />
  );
}
