"use client";

import { motion } from "framer-motion";
import { Board, Player, ROWS, COLS } from "@/hooks/useConnectFive";
import { cn } from "@/lib/utils";

interface ConnectFiveBoardProps {
  board: Board;
  onColumnClick: (col: number) => void;
  disabled: boolean;
}

export function ConnectFiveBoard({
  board,
  onColumnClick,
  disabled,
}: ConnectFiveBoardProps) {
  const getCellColor = (player: Player | null) => {
    if (player === 1) return "bg-red-500 border-red-600"; // Human
    if (player === 2) return "bg-yellow-400 border-yellow-500"; // AI
    return "bg-white border-gray-300"; // Empty
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-2xl border-4 border-blue-800">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: COLS }).map((_, col) => (
          <div key={col} className="space-y-2">
            {/* Column click area */}
            <button
              onClick={() => !disabled && onColumnClick(col)}
              disabled={disabled || board[0][col] !== null}
              className={cn(
                "w-full h-8 rounded-lg transition-all duration-200 flex items-center justify-center text-2xl font-bold",
                disabled || board[0][col] !== null
                  ? "cursor-not-allowed opacity-30 bg-blue-800/30"
                  : "cursor-pointer bg-blue-500/40 hover:bg-blue-400/60 hover:scale-105"
              )}
              aria-label={`Drop piece in column ${col + 1}`}
            >
              {!(disabled || board[0][col] !== null) && "↓"}
            </button>

            {/* Cells */}
            {Array.from({ length: ROWS }).map((_, row) => {
              const cell = board[row][col];
              return (
                <motion.div
                  key={`${row}-${col}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: row * 0.05 + col * 0.05 }}
                  className={cn(
                    "w-full aspect-square rounded-full border-4 transition-all duration-200",
                    getCellColor(cell),
                    cell && "shadow-lg"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
