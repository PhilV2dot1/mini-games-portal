"use client";

import { AIDifficulty } from "@/hooks/useConnectFive";
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
  const difficulties: { value: AIDifficulty; label: string; emoji: string }[] = [
    { value: "easy", label: "Easy", emoji: "😊" },
    { value: "medium", label: "Medium", emoji: "🤔" },
    { value: "hard", label: "Hard", emoji: "😤" },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300">
      <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">
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
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
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
