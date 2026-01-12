import { PlayerStats as Stats } from "@/hooks/useSudoku";
import { motion } from "framer-motion";

interface PlayerStatsProps {
  stats: Stats;
  formatTime: (seconds: number) => string;
}

export function PlayerStats({ stats, formatTime }: PlayerStatsProps) {
  const winRate = stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(1) : "0.0";
  const avgHints = stats.games > 0 ? (stats.totalHintsUsed / stats.games).toFixed(1) : "0.0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-gray-300"
    >
      <h3 className="text-2xl font-black text-gray-900 mb-4 text-center">
        📊 Your Statistics
      </h3>

      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
          <div className="text-sm text-gray-600 font-semibold mb-1">Games Played</div>
          <div className="text-3xl font-black text-blue-600">{stats.games}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
          <div className="text-sm text-gray-600 font-semibold mb-1">Wins</div>
          <div className="text-3xl font-black text-green-600">{stats.wins}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
          <div className="text-sm text-gray-600 font-semibold mb-1">Win Rate</div>
          <div className="text-3xl font-black text-purple-600">{winRate}%</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center border border-yellow-200">
          <div className="text-sm text-gray-600 font-semibold mb-1">Perfect Games</div>
          <div className="text-3xl font-black text-yellow-600">{stats.perfectGames}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center border border-orange-200">
          <div className="text-sm text-gray-600 font-semibold mb-1">Avg Hints</div>
          <div className="text-3xl font-black text-orange-600">{avgHints}</div>
        </div>
      </div>

      {/* Best Times */}
      <div className="border-t-2 border-gray-300 pt-4">
        <h4 className="text-lg font-black text-gray-900 mb-3 text-center">⏱️ Best Times</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
            <div className="text-xs text-gray-600 font-semibold mb-1">Easy</div>
            <div className="text-lg font-black text-green-600">
              {stats.bestTimes.easy ? formatTime(stats.bestTimes.easy) : "—"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 text-center border border-yellow-200">
            <div className="text-xs text-gray-600 font-semibold mb-1">Medium</div>
            <div className="text-lg font-black text-yellow-600">
              {stats.bestTimes.medium ? formatTime(stats.bestTimes.medium) : "—"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center border border-red-200">
            <div className="text-xs text-gray-600 font-semibold mb-1">Hard</div>
            <div className="text-lg font-black text-red-600">
              {stats.bestTimes.hard ? formatTime(stats.bestTimes.hard) : "—"}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
