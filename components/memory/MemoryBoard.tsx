"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { Card } from "@/lib/games/memory-logic";
// Color crypto SVG icons via jsDelivr (cryptocurrency-icons package)
const CRYPTO_ICON_URL = (symbol: string) =>
  `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/${symbol}.svg`;

interface MemoryBoardProps {
  board: Card[];
  cols: number;
  onFlip: (index: number) => void;
  disabled: boolean;
}

const MemoryCard = memo(function MemoryCard({
  card,
  index,
  onFlip,
  disabled,
}: {
  card: Card;
  index: number;
  onFlip: (index: number) => void;
  disabled: boolean;
}) {
  const isRevealed = card.isFlipped || card.isMatched;

  return (
    <motion.button
      data-testid={`memory-card-${index}`}
      onClick={() => onFlip(index)}
      disabled={disabled || isRevealed}
      className={`
        aspect-square rounded-xl font-bold
        flex items-center justify-center cursor-pointer
        transition-all duration-200 border-2
        ${card.isMatched
          ? "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 scale-95"
          : isRevealed
          ? "bg-white dark:bg-gray-700 border-chain shadow-lg"
          : "bg-gradient-to-br from-chain/80 to-chain border-chain/50 hover:brightness-110 hover:scale-105 shadow-md"
        }
        disabled:cursor-default
      `}
      whileTap={!disabled && !isRevealed ? { scale: 0.9 } : undefined}
    >
      {isRevealed ? (
        <motion.span
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center w-full h-full p-1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CRYPTO_ICON_URL(card.emoji)}
            alt={card.emoji.toUpperCase()}
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
          />
        </motion.span>
      ) : (
        <span className="text-white/80 text-2xl">?</span>
      )}
    </motion.button>
  );
});

export const MemoryBoard = memo(function MemoryBoard({
  board,
  cols,
  onFlip,
  disabled,
}: MemoryBoardProps) {
  return (
    <div
      className="grid gap-2 sm:gap-3 w-full max-w-md mx-auto"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {board.map((card, index) => (
        <MemoryCard
          key={card.id}
          card={card}
          index={index}
          onFlip={onFlip}
          disabled={disabled}
        />
      ))}
    </div>
  );
});
