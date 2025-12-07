"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TicTacToeCellProps {
  value: 0 | 1 | 2; // 0 = empty, 1 = X, 2 = O
  onClick: () => void;
  disabled: boolean;
}

export function TicTacToeCell({ value, onClick, disabled }: TicTacToeCellProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || value !== 0}
      whileHover={!disabled && value === 0 ? { scale: 1.05 } : {}}
      whileTap={!disabled && value === 0 ? { scale: 0.95 } : {}}
      className={cn(
        "aspect-square flex items-center justify-center",
        "bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md",
        "text-4xl sm:text-5xl font-black",
        "transition-all duration-200",
        "border-2",
        value === 0 && !disabled
          ? "border-gray-300 hover:border-[#FCFF52] hover:shadow-lg cursor-pointer"
          : "border-gray-200 cursor-not-allowed",
        "text-gray-800"
      )}
    >
      {value === 1 && (
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          X
        </motion.span>
      )}
      {value === 2 && (
        <motion.span
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          O
        </motion.span>
      )}
    </motion.button>
  );
}
