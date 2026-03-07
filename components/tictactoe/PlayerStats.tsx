"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PlayerStatsProps {
  stats: {
    games: number;
    wins: number;
    losses: number;
    draws: number;
  };
}

export function PlayerStats({ stats }: PlayerStatsProps) {
  const { t } = useLanguage();

  const statItems = [
    { label: t('stats.games'), value: stats.games },
    { label: t('stats.wins'), value: stats.wins },
    { label: t('stats.losses'), value: stats.losses },
    { label: t('stats.draws'), value: stats.draws },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-gray-300 dark:border-gray-600"
    >
      <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3">{t('games.yourStats').toUpperCase()}</h3>
      <div className="grid grid-cols-4 gap-3">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="text-center"
          >
            <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{item.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
