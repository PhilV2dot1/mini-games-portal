"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import type { GameStats } from "@/hooks/useRockPaperScissors";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PlayerStatsProps {
  stats: GameStats;
  onReset?: () => void;
}

export const PlayerStats = memo(function PlayerStats({ stats, onReset }: PlayerStatsProps) {
  const { t } = useLanguage();

  // Memoize calculations to prevent unnecessary re-computation
  const { total, winRate } = useMemo(() => {
    const totalGames = stats.wins + stats.losses + stats.ties;
    const wr = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;
    return { total: totalGames, winRate: wr };
  }, [stats.wins, stats.losses, stats.ties]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl p-4 border-2 border-gray-700 dark:border-gray-500 shadow-xl"
      style={{
        boxShadow: "0 0 0 6px var(--chain-primary), 0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('games.yourStats')}</h3>
        {onReset && total > 0 && (
          <button
            onClick={onReset}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors font-semibold"
          >
            {t('games.reset')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-3">
          <div className="text-2xl font-black text-green-600 dark:text-green-400">
            {stats.wins}
          </div>
          <div className="text-xs font-semibold text-green-700 dark:text-green-400">{t('stats.wins')}</div>
        </div>
        <div className="text-center bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl p-3">
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {stats.losses}
          </div>
          <div className="text-xs font-semibold text-red-700 dark:text-red-400">{t('stats.losses')}</div>
        </div>
        <div className="text-center bg-chain/5 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
          <div className="text-2xl font-black text-chain">
            {stats.ties}
          </div>
          <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">{t('stats.ties')}</div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-750 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('stats.winRate')}:
        </span>
        <span className="text-lg font-black text-gray-900 dark:text-gray-100">{winRate}%</span>
      </div>

      {/* Show streaks if available (on-chain mode) */}
      {(stats.currentStreak !== undefined || stats.bestStreak !== undefined) && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {stats.currentStreak !== undefined && (
            <div className="text-center bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-2">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                🔥 {stats.currentStreak}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400">{t('stats.current')}</div>
            </div>
          )}
          {stats.bestStreak !== undefined && (
            <div className="text-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2">
              <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                🏆 {stats.bestStreak}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('stats.best')}</div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});
