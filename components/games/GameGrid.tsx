"use client";

import { GameMetadata } from "@/lib/types";
import { GameCard } from "./GameCard";
import { motion } from "framer-motion";

interface GameGridProps {
  games: GameMetadata[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
};

export function GameGrid({ games }: GameGridProps) {
  // Mark 2048 and Mastermind as new
  const newGameIds = ["2048", "mastermind"];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {games.map((game) => (
        <motion.div key={game.id} variants={item}>
          <GameCard game={game} isNew={newGameIds.includes(game.id)} />
        </motion.div>
      ))}
    </motion.div>
  );
}
