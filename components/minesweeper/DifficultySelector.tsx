import { motion } from "framer-motion";
import type { Difficulty } from "@/hooks/useMinesweeper";
import { DIFFICULTY_CONFIG } from "@/hooks/useMinesweeper";

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  disabled: boolean;
}

const DIFFICULTY_EMOJIS: Record<Difficulty, string> = {
  easy: "😊",
  medium: "🤔",
  hard: "😤",
};

const DIFFICULTY_HINTS: Record<Difficulty, string> = {
  easy: "Great for learning!",
  medium: "Balanced challenge",
  hard: "Expert mode - good luck!",
};

export function DifficultySelector({
  difficulty,
  onDifficultyChange,
  disabled,
}: DifficultySelectorProps) {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300"
    >
      <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">
        Select Difficulty
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {difficulties.map((diff) => {
          const config = DIFFICULTY_CONFIG[diff];
          const isActive = difficulty === diff;

          return (
            <motion.button
              key={diff}
              onClick={() => onDifficultyChange(diff)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              className={`p-3 rounded-lg font-semibold transition-all ${
                isActive
                  ? "bg-gradient-to-br from-celo to-yellow-500 text-gray-900 shadow-lg ring-2 ring-celo ring-offset-2"
                  : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300"
              } ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              aria-pressed={isActive}
              aria-label={`${diff} difficulty: ${config.rows}×${config.cols} grid with ${config.mines} mines. ${DIFFICULTY_HINTS[diff]}`}
              title={DIFFICULTY_HINTS[diff]}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl" role="img" aria-hidden="true">
                  {DIFFICULTY_EMOJIS[diff]}
                </span>
                <span className="text-xs sm:text-sm font-black capitalize">
                  {diff}
                </span>
                <span className="text-[10px] text-gray-600">
                  {config.rows}×{config.cols}
                </span>
                <span className="text-[10px] text-gray-600">
                  {config.mines} mines
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
