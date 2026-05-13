"use client";

import { motion } from "framer-motion";
import type { Difficulty } from "@/hooks/useSnake";
import { DIFFICULTY_SPEEDS } from "@/hooks/useSnake";

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  disabled: boolean;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "expert"];

const LABELS: Record<Difficulty, string> = {
  easy:   "Easy",
  medium: "Medium",
  expert: "Expert",
};

const EMOJIS: Record<Difficulty, string> = {
  easy:   "🐢",
  medium: "🐍",
  expert: "⚡",
};

const HINTS: Record<Difficulty, string> = {
  easy:   "Slow pace, ideal for beginners",
  medium: "Standard speed",
  expert: "Fast — for seasoned snakers",
};

const ACTIVE_COLORS: Record<Difficulty, string> = {
  easy:   "from-green-400 to-green-500 ring-green-400",
  medium: "from-yellow-400 to-yellow-500 ring-yellow-400",
  expert: "from-red-500 to-red-600 ring-red-500",
};

export function DifficultySelector({
  difficulty,
  onDifficultyChange,
  disabled,
}: DifficultySelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300 dark:border-gray-600"
    >
      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center uppercase tracking-wide">
        Difficulty
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {DIFFICULTIES.map((d) => {
          const isActive = difficulty === d;
          return (
            <motion.button
              key={d}
              onClick={() => onDifficultyChange(d)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              title={HINTS[d]}
              className={`p-3 rounded-lg font-semibold transition-all ${
                isActive
                  ? `bg-gradient-to-br ${ACTIVE_COLORS[d]} text-white shadow-lg ring-2 ring-offset-2`
                  : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:brightness-105"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl" role="img" aria-hidden="true">
                  {EMOJIS[d]}
                </span>
                <span className="text-xs sm:text-sm font-black">
                  {LABELS[d]}
                </span>
                <span className="text-[10px] text-current opacity-70">
                  {DIFFICULTY_SPEEDS[d]}ms
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
