"use client";

import { AIDifficulty } from "@/hooks/useYahtzee";
import { cn } from "@/lib/utils";

interface DifficultySelectorProps {
  difficulty: AIDifficulty;
  onDifficultyChange: (difficulty: AIDifficulty) => void;
  disabled?: boolean;
}

export function DifficultySelector({
  difficulty,
  onDifficultyChange,
  disabled = false,
}: DifficultySelectorProps) {
  const difficulties: { value: AIDifficulty; emoji: string; label: string }[] = [
    { value: "easy", emoji: "😊", label: "Easy" },
    { value: "medium", emoji: "🤔", label: "Medium" },
    { value: "hard", emoji: "😤", label: "Hard" },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300 dark:bg-gray-800/90 dark:border-gray-600">
      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
        AI Difficulty
      </h3>
      <div className="flex gap-2">
        {difficulties.map((diff) => (
          <button
            key={diff.value}
            onClick={() => !disabled && onDifficultyChange(diff.value)}
            disabled={disabled}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-200",
              difficulty === diff.value
                ? "bg-celo text-gray-900 shadow-md scale-105"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="text-lg mb-1">{diff.emoji}</div>
            <div>{diff.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
