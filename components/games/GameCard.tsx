"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GameMetadata } from "@/lib/types";
import { useLocalStats } from "@/hooks/useLocalStats";

interface GameCardProps {
  game: GameMetadata;
  isNew?: boolean;
}

export function GameCard({ game, isNew = false }: GameCardProps) {
  const { getStats } = useLocalStats();
  const stats = getStats(game.id);

  return (
    <Link href={game.route}>
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="relative bg-gradient-to-br from-white via-gray-100 to-gray-200 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-150 cursor-pointer group overflow-hidden"
        style={{ border: '4px solid #FCFF52' }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-celo to-transparent" />
        </div>

        {/* NEW Badge */}
        {isNew && (
          <div className="absolute top-3 right-3 bg-celo text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
            NEW
          </div>
        )}

        {/* Fee indicator */}
        {game.hasFee && !isNew && (
          <div className="absolute top-3 right-3 bg-celo text-gray-900 text-xs font-semibold px-2 py-1 rounded-full shadow-md">
            0.01 CELO
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="text-6xl mb-4 text-center">
            {game.icon}
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-2 group-hover:scale-105 transition-transform">
            {game.name}
          </h3>

          {/* Description */}
          <p className="text-gray-700 text-sm text-center mb-4">
            {game.description}
          </p>

          {/* Stats */}
          {typeof stats !== 'boolean' && 'played' in stats && stats.played > 0 && (
            <div className="flex justify-center gap-4 text-gray-600 text-xs">
              <div className="text-center">
                <div className="font-bold text-gray-900">{stats.played}</div>
                <div>Played</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{stats.wins}</div>
                <div>Wins</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{stats.totalPoints}</div>
                <div>Points</div>
              </div>
            </div>
          )}

          {/* Play button hint */}
          <div className="mt-4 text-center text-gray-900 text-sm font-semibold group-hover:scale-105 transition-transform">
            Tap to Play →
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
