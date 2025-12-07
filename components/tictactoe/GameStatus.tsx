"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameStatusProps {
  message: string;
  result?: "win" | "lose" | "draw" | null;
}

export function GameStatus({ message, result }: GameStatusProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "px-6 py-3 rounded-xl font-bold text-center shadow-lg border-2",
          result === "win" && "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border-[#FCFF52] text-white",
          result === "lose" && "bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500 text-white",
          result === "draw" && "bg-gradient-to-br from-gray-700 to-gray-800 border-[#FCFF52] text-white",
          !result && "bg-white/90 border-gray-700 text-gray-900"
        )}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
}
