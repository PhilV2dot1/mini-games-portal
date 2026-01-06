import React from "react";
import { motion } from "framer-motion";
import { PlayerStats as PlayerStatsType, formatTime } from "@/hooks/useSolitaire";

interface PlayerStatsProps {
  stats: PlayerStatsType;
}

export function PlayerStats({ stats }: PlayerStatsProps) {
  const winRate = stats.gamesPlayed > 0
    ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1)
    : "0.0";

  const avgScore = stats.gamesPlayed > 0
    ? Math.round(stats.totalScore / stats.gamesPlayed)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border-2 border-gray-200 p-6"
    >
      <h3 className="text-lg font-bold text-gray-900 mb-4">Player Statistics</h3>

      <div className="grid grid-cols-3 gap-4">
        {/* Games Played */}
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-2xl font-bold text-gray-900">{stats.gamesPlayed}</span>
          <span className="text-xs text-gray-600 mt-1">Games Played</span>
        </div>

        {/* Games Won */}
        <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
          <span className="text-2xl font-bold text-green-700">{stats.gamesWon}</span>
          <span className="text-xs text-gray-600 mt-1">Games Won</span>
        </div>

        {/* Win Rate */}
        <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-2xl font-bold text-blue-700">{winRate}%</span>
          <span className="text-xs text-gray-600 mt-1">Win Rate</span>
        </div>

        {/* Total Score */}
        <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
          <span className="text-2xl font-bold text-purple-700">{stats.totalScore.toLocaleString()}</span>
          <span className="text-xs text-gray-600 mt-1">Total Score</span>
        </div>

        {/* Best Score */}
        <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
          <span className="text-2xl font-bold text-yellow-700">{stats.bestScore.toLocaleString()}</span>
          <span className="text-xs text-gray-600 mt-1">Best Score</span>
        </div>

        {/* Average Score */}
        <div className="flex flex-col items-center p-3 bg-indigo-50 rounded-lg">
          <span className="text-2xl font-bold text-indigo-700">{avgScore.toLocaleString()}</span>
          <span className="text-xs text-gray-600 mt-1">Avg Score</span>
        </div>

        {/* Fastest Win Time */}
        <div className="flex flex-col items-center p-3 bg-teal-50 rounded-lg">
          <span className="text-2xl font-bold text-teal-700 font-mono">
            {stats.fastestWinTime > 0 ? formatTime(stats.fastestWinTime) : "--:--"}
          </span>
          <span className="text-xs text-gray-600 mt-1">Fastest Win</span>
        </div>

        {/* Fewest Moves */}
        <div className="flex flex-col items-center p-3 bg-pink-50 rounded-lg">
          <span className="text-2xl font-bold text-pink-700">
            {stats.fewestMoves > 0 ? stats.fewestMoves : "--"}
          </span>
          <span className="text-xs text-gray-600 mt-1">Fewest Moves</span>
        </div>
      </div>
    </motion.div>
  );
}
