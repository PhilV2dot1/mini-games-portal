"use client";

import { motion } from "framer-motion";
import { TicTacToeCell } from "./TicTacToeCell";

interface TicTacToeBoardProps {
  board: (0 | 1 | 2)[];
  onCellClick: (position: number) => void;
  disabled: boolean;
}

export function TicTacToeBoard({
  board,
  onCellClick,
  disabled,
}: TicTacToeBoardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full mx-auto"
    >
      <div
        className="grid grid-cols-3 gap-3 p-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-gray-700"
        style={{ boxShadow: '0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      >
        {board.map((value, index) => (
          <TicTacToeCell
            key={index}
            value={value}
            onClick={() => onCellClick(index)}
            disabled={disabled}
          />
        ))}
      </div>
    </motion.div>
  );
}
