"use client";

import { motion } from "framer-motion";
import { GameStatus as Status } from "@/hooks/useSnake";

interface GameStatusProps {
  message: string;
  status: Status;
  score: number;
}

export function GameStatus({ message, status, score }: GameStatusProps) {
  const getStatusColor = () => {
    if (status === "gameover") return "from-red-500 to-red-600";
    if (status === "playing") return "from-green-500 to-green-600";
    if (status === "waiting_start" || status === "waiting_end") return "from-yellow-500 to-yellow-600";
    return "from-blue-500 to-blue-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${getStatusColor()} text-white rounded-xl p-4 shadow-lg`}
    >
      <div className="flex justify-between items-center">
        <span className="font-bold">{message}</span>
        <span className="text-2xl font-black">Score: {score}</span>
      </div>
    </motion.div>
  );
}
