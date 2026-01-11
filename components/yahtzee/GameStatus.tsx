"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GameStatus as GameStatusType } from "@/hooks/useYahtzee";

interface GameStatusProps {
  status: GameStatusType;
  message: string;
  finalScore?: number;
  currentPlayer?: "human" | "ai";
  winner?: "human" | "ai" | "tie" | null;
  playerScore?: number;
  aiScore?: number;
}

export function GameStatus({
  status,
  message,
  finalScore,
  currentPlayer,
  winner,
  playerScore,
  aiScore,
}: GameStatusProps) {
  const getStatusColor = (): string => {
    switch (status) {
      case "idle":
        return "from-gray-500 to-gray-700";
      case "playing":
        return "from-gray-600 to-gray-800";
      case "processing":
        return "from-yellow-500 to-orange-500";
      case "finished":
        return "from-green-500 to-emerald-500";
      default:
        return "from-gray-500 to-gray-700";
    }
  };

  const getStatusIcon = (): string => {
    // Show winner icons if game is finished
    if (status === "finished" && winner) {
      if (winner === "human") return "🏆";
      if (winner === "ai") return "🤖";
      if (winner === "tie") return "🤝";
    }

    // Show AI icon when it's AI's turn
    if (status === "playing" && currentPlayer === "ai") {
      return "🤖";
    }

    switch (status) {
      case "idle":
        return "🎲";
      case "playing":
        return "🎮";
      case "processing":
        return "⏳";
      case "finished":
        return finalScore && finalScore >= 300 ? "🏆" : finalScore && finalScore >= 200 ? "⭐" : "✅";
      default:
        return "🎲";
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status + message}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className={`
          w-full max-w-2xl mx-auto
          bg-gradient-to-r ${getStatusColor()}
          text-white rounded-xl p-4 sm:p-6
          shadow-lg
        `}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <motion.span
            className="text-4xl sm:text-5xl"
            animate={{
              rotate: status === "processing" ? [0, 360] : 0,
              scale: status === "finished" ? [1, 1.2, 1] : 1,
            }}
            transition={{
              rotate: { duration: 2, repeat: status === "processing" ? Infinity : 0 },
              scale: { duration: 0.5 },
            }}
          >
            {getStatusIcon()}
          </motion.span>

          <div className="flex-1">
            <p className="text-lg sm:text-xl font-bold">
              {message}
            </p>

            {/* Show winner information for AI mode */}
            {status === "finished" && winner && playerScore !== undefined && aiScore !== undefined && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mt-2"
              >
                <p className="text-2xl sm:text-3xl font-bold">
                  {playerScore} - {aiScore}
                </p>
                {winner === "human" && (
                  <p className="text-sm sm:text-base mt-1 text-yellow-200">
                    Congratulations! You defeated the AI! 🎉
                  </p>
                )}
                {winner === "ai" && (
                  <p className="text-sm sm:text-base mt-1 text-blue-200">
                    Better luck next time! 🤖
                  </p>
                )}
                {winner === "tie" && (
                  <p className="text-sm sm:text-base mt-1 text-green-200">
                    Perfect match! 🤝
                  </p>
                )}
              </motion.div>
            )}

            {/* Show final score for solo mode */}
            {status === "finished" && finalScore !== undefined && !winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mt-2"
              >
                <p className="text-2xl sm:text-3xl font-bold">
                  Final Score: {finalScore}
                </p>
                {finalScore >= 300 && (
                  <p className="text-sm sm:text-base mt-1 text-yellow-200">
                    Legendary performance! 🎉
                  </p>
                )}
                {finalScore >= 200 && finalScore < 300 && (
                  <p className="text-sm sm:text-base mt-1 text-blue-200">
                    Great game! 🎊
                  </p>
                )}
              </motion.div>
            )}

            {/* Show turn indicator for AI mode during play */}
            {status === "playing" && currentPlayer && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm sm:text-base mt-1 text-gray-200"
              >
                {currentPlayer === "human" ? "🎮 Your Turn" : "🤖 AI is playing..."}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
