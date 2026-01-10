import { motion } from "framer-motion";
import type { PlayerStats as Stats } from "@/hooks/useMinesweeper";

interface PlayerStatsProps {
  stats: Stats;
}

export function PlayerStats({ stats }: PlayerStatsProps) {
  const winRate =
    stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(1) : "0.0";

  const avgFlagsUsed =
    stats.games > 0 ? (stats.totalFlagsUsed / stats.games).toFixed(1) : "0.0";

  // Format time in seconds to MM:SS
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-gray-300"
    >
      <h3 className="text-xl font-black text-gray-900 mb-4 text-center">
        📊 Statistics
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Games Played */}
        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="text-2xl font-black text-blue-600">{stats.games}</div>
          <div className="text-xs text-gray-700 font-semibold">
            Games Played
          </div>
        </div>

        {/* Wins */}
        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <div className="text-2xl font-black text-green-600">{stats.wins}</div>
          <div className="text-xs text-gray-700 font-semibold">Wins</div>
        </div>

        {/* Losses */}
        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
          <div className="text-2xl font-black text-red-600">
            {stats.losses}
          </div>
          <div className="text-xs text-gray-700 font-semibold">Losses</div>
        </div>

        {/* Win Rate */}
        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <div className="text-2xl font-black text-purple-600">
            {winRate}%
          </div>
          <div className="text-xs text-gray-700 font-semibold">Win Rate</div>
        </div>

        {/* Perfect Games */}
        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
          <div className="text-2xl font-black text-yellow-600">
            {stats.perfectGames}
          </div>
          <div className="text-xs text-gray-700 font-semibold">
            Perfect Games
          </div>
        </div>

        {/* Avg Flags */}
        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
          <div className="text-2xl font-black text-orange-600">
            {avgFlagsUsed}
          </div>
          <div className="text-xs text-gray-700 font-semibold">Avg Flags</div>
        </div>
      </div>

      {/* Best Times */}
      <div className="mt-4 pt-4 border-t-2 border-gray-200">
        <h4 className="text-sm font-bold text-gray-700 mb-3 text-center">
          🏆 Best Times
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            <div className="text-lg font-bold text-gray-800">
              {formatTime(stats.bestTimes.easy)}
            </div>
            <div className="text-xs text-gray-600">Easy</div>
          </div>
          <div className="flex flex-col items-center p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            <div className="text-lg font-bold text-gray-800">
              {formatTime(stats.bestTimes.medium)}
            </div>
            <div className="text-xs text-gray-600">Medium</div>
          </div>
          <div className="flex flex-col items-center p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            <div className="text-lg font-bold text-gray-800">
              {formatTime(stats.bestTimes.hard)}
            </div>
            <div className="text-xs text-gray-600">Hard</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
