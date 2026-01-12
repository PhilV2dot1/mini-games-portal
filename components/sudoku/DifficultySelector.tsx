import { Difficulty, DIFFICULTY_CONFIG } from "@/hooks/useSudoku";
import { motion } from "framer-motion";

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
  hard: "Expert mode!",
};

export function DifficultySelector({
  difficulty,
  onDifficultyChange,
  disabled,
}: DifficultySelectorProps) {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-gray-300">
      <h3 className="text-lg font-black text-gray-900 mb-4 text-center">
        🎯 Select Difficulty
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {difficulties.map((diff) => {
          const isActive = difficulty === diff;
          const config = DIFFICULTY_CONFIG[diff];

          return (
            <motion.button
              key={diff}
              onClick={() => onDifficultyChange(diff)}
              disabled={disabled}
              className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                isActive
                  ? "bg-gradient-to-r from-celo to-celo text-gray-900 border-celo ring-2 ring-celo ring-offset-2"
                  : "bg-white text-gray-700 border-gray-300 hover:border-celo hover:bg-yellow-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              aria-pressed={isActive}
            >
              <div className="text-3xl mb-2">{DIFFICULTY_EMOJIS[diff]}</div>
              <div className="text-sm font-black capitalize">{diff}</div>
              <div className="text-xs mt-1 opacity-80">{config.clues} clues</div>
              <div className="text-xs mt-1 opacity-70">{DIFFICULTY_HINTS[diff]}</div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
