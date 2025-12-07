"use client";

import { Guess } from "@/lib/games/mastermind-logic";
import { ColorPeg } from "./ColorPeg";
import { motion } from "framer-motion";

interface CurrentGuessProps {
  guess: Guess;
  onClearPosition: (position: number) => void;
  disabled?: boolean;
}

export function CurrentGuess({ guess, onClearPosition, disabled }: CurrentGuessProps) {
  return (
    <div className="flex justify-center gap-2 sm:gap-4 p-2 sm:p-4 bg-white/90 backdrop-blur-sm rounded-lg border border-yellow-500/50 shadow-sm">
      {guess.map((color, i) => (
        <div key={i} className="relative">
          <ColorPeg
            color={color}
            size="large"
            onClick={() => !disabled && color && onClearPosition(i)}
          />
          {color && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-red-600 transition-colors touch-target"
              onClick={() => !disabled && onClearPosition(i)}
            >
              ✕
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
