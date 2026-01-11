"use client";

import { motion } from "framer-motion";

interface GameControlsProps {
  onRoll: () => void;
  rollsRemaining: number;
  currentTurn: number;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function GameControls({
  onRoll,
  rollsRemaining,
  currentTurn,
  disabled = false,
  isProcessing = false,
}: GameControlsProps) {
  const canRoll = rollsRemaining > 0 && !disabled;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Roll Button */}
      <motion.button
        onClick={onRoll}
        disabled={!canRoll || isProcessing}
        className={`
          px-8 py-4 rounded-xl text-xl font-bold
          transition-all duration-200
          ${
            canRoll && !isProcessing
              ? "bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-black"
              : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
          }
        `}
        whileHover={canRoll && !isProcessing ? { scale: 1.05 } : {}}
        whileTap={canRoll && !isProcessing ? { scale: 0.95 } : {}}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          `🎲 Roll Dice`
        )}
      </motion.button>

      {/* Rolls Remaining Indicator */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Rolls Remaining
        </span>
        <div className="flex gap-2">
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              className={`
                w-3 h-3 rounded-full
                ${
                  index < rollsRemaining
                    ? "bg-celo"
                    : "bg-gray-300 dark:bg-gray-700"
                }
              `}
              animate={
                index < rollsRemaining
                  ? { scale: [1, 1.2, 1] }
                  : { scale: 1 }
              }
              transition={{
                duration: 0.6,
                repeat: index < rollsRemaining ? Infinity : 0,
                repeatDelay: 1,
              }}
            />
          ))}
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {rollsRemaining}
        </span>
      </div>

      {/* Turn Counter */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Turn
        </span>
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {currentTurn} / 13
        </span>
        {/* Progress bar */}
        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-celo"
            initial={{ width: 0 }}
            animate={{ width: `${(currentTurn / 13) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
