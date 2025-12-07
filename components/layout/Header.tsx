"use client";

import { motion } from "framer-motion";
import { useLocalStats } from "@/hooks/useLocalStats";

export function Header() {
  const { profile } = useLocalStats();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center mb-8"
    >
      <div className="mb-4">
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-3">
          Celo Games Portal
        </h1>
        <div className="h-2 w-64 mx-auto rounded-full" style={{ backgroundColor: '#FCFF52' }}></div>
      </div>
      <p className="text-lg sm:text-xl text-gray-700 font-medium mb-4">
        Play 6 Mini-Games on the Blockchain
      </p>

      {profile.gamesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-6 bg-white/90 backdrop-blur-lg rounded-2xl px-6 py-3 shadow-lg"
          style={{ border: '4px solid #FCFF52' }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{profile.totalPoints}</div>
            <div className="text-xs text-gray-600 font-medium">Total Points</div>
          </div>
          <div className="w-px h-10 bg-gray-300" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{profile.gamesPlayed}</div>
            <div className="text-xs text-gray-600 font-medium">Games Played</div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
