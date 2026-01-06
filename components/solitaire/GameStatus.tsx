import React from "react";
import { motion } from "framer-motion";
import { GameStatus as GameStatusType, formatTime } from "@/hooks/useSolitaire";
import { cn } from "@/lib/utils";

interface GameStatusProps {
  score: number;
  moves: number;
  elapsedTime: number;
  status: GameStatusType;
  message: string;
}

export function GameStatus({ score, moves, elapsedTime, status, message }: GameStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between px-6 py-3 rounded-lg border-2",
        "transition-all duration-300",
        status === "won" && "bg-green-50 border-green-500",
        status === "playing" && "bg-blue-50 border-blue-500",
        status === "idle" && "bg-gray-50 border-gray-300",
        status === "processing" && "bg-yellow-50 border-yellow-500",
        status === "gameover" && "bg-red-50 border-red-500"
      )}
    >
      {/* Left: Status message */}
      <div className="flex-1">
        <span
          className={cn(
            "font-medium text-base",
            status === "won" && "text-green-700",
            status === "playing" && "text-blue-700",
            status === "idle" && "text-gray-600",
            status === "processing" && "text-yellow-700",
            status === "gameover" && "text-red-700"
          )}
        >
          {message}
        </span>
      </div>

      {/* Right: Game stats */}
      <div className="flex gap-6">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 font-medium">Score</span>
          <span className="text-lg font-bold text-gray-900">{score}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 font-medium">Moves</span>
          <span className="text-lg font-bold text-gray-900">{moves}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 font-medium">Time</span>
          <span className="text-lg font-bold text-gray-900 font-mono">
            {formatTime(elapsedTime)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
