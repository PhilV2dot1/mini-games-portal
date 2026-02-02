"use client";

import { motion } from "framer-motion";
import type { GameMode } from "@/lib/types";
import type { PlayerStats as PlayerStatsType } from "@/hooks/useYahtzee";
import { YAHTZEE_CONTRACT_ADDRESS } from "@/lib/contracts/yahtzee-abi";
import { getExplorerAddressUrl, getExplorerName } from "@/lib/contracts/addresses";
import { useAccount } from "wagmi";

interface PlayerStatsProps {
  stats: PlayerStatsType;
  averageScore: number;
  mode: GameMode;
}

export function PlayerStats({ stats, averageScore, mode }: PlayerStatsProps) {
  const { chain } = useAccount();
  const statCards = [
    {
      label: "Games Played",
      value: stats.gamesPlayed,
      icon: "🎲",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "High Score",
      value: stats.highScore,
      icon: "🏆",
      color: "from-yellow-500 to-amber-500",
    },
    {
      label: "Average Score",
      value: averageScore,
      icon: "📊",
      color: "from-gray-600 to-gray-800",
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Your Statistics
        </h2>
        {mode === "free" && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Saved locally
          </span>
        )}
        {mode === "onchain" && (
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            On-chain
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              bg-gradient-to-br ${stat.color}
              rounded-xl p-4 shadow-lg
              text-white
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <motion.span
                className="text-3xl font-bold"
                key={stat.value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {stat.value}
              </motion.span>
            </div>
            <p className="text-sm opacity-90">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {mode === "onchain" && (
        <motion.a
          href={getExplorerAddressUrl(chain?.id, YAHTZEE_CONTRACT_ADDRESS)}
          target="_blank"
          rel="noopener noreferrer"
          className="
            block text-center text-sm text-gray-900 hover:text-chain
            transition-colors duration-200 font-semibold underline decoration-chain
          "
          whileHover={{ scale: 1.02 }}
        >
          View contract on {getExplorerName(chain?.id)} →
        </motion.a>
      )}
    </div>
  );
}
