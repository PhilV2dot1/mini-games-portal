"use client";

import { motion } from "framer-motion";
import { shareGameResult } from "@/lib/farcaster";

interface FarcasterShareProps {
  gameName: string;
  outcome: string;
  stats: { played: number; wins: number };
}

export function FarcasterShare({ gameName, outcome, stats }: FarcasterShareProps) {
  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const handleShare = async () => {
    await shareGameResult(gameName, outcome, stats, appUrl);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleShare}
      className="w-full py-3 px-6 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white rounded-xl font-semibold shadow-lg transition-all"
    >
      Share on Farcaster 🎯
    </motion.button>
  );
}
