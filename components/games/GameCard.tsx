"use client";

import Link from "next/link";
import Image from "next/image";
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
        whileHover={{ scale: 1.03, y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 cursor-pointer group overflow-hidden"
        style={{ border: '3px solid #FCFF52' }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-celo to-transparent" />
        </div>

        {/* NEW Badge */}
        {isNew && (
          <div className="absolute top-2 right-2 bg-celo text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
            NEW
          </div>
        )}

        {/* Fee indicator */}
        {game.hasFee && !isNew && (
          <div className="absolute top-2 right-2 bg-celo text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            0.01 CELO
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 relative">
              <Image
                src={game.icon}
                alt={game.name}
                width={64}
                height={64}
                className="object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-black text-gray-900 text-center mb-1 group-hover:scale-105 transition-transform leading-tight">
            {game.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-xs text-center mb-2 leading-snug">
            {game.description}
          </p>

          {/* Stats */}
          {typeof stats !== 'boolean' && 'played' in stats && stats.played > 0 && (
            <div className="flex justify-center gap-3 text-gray-500 text-[10px] mb-2">
              <div className="text-center">
                <div className="font-bold text-gray-900 text-xs">{stats.played}</div>
                <div>Played</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 text-xs">{stats.wins}</div>
                <div>Wins</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 text-xs">{stats.totalPoints}</div>
                <div>Points</div>
              </div>
            </div>
          )}

          {/* Play button hint */}
          <div className="text-center text-gray-900 text-xs font-bold group-hover:scale-105 transition-transform opacity-70 group-hover:opacity-100">
            Play →
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
