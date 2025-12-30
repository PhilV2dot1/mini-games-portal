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
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group border-2 border-gray-200 overflow-hidden"
        style={{ borderColor: 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FCFF52'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
      >
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #FCFF52, #e5e600)' }} />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 relative group-hover:scale-105 transition-transform duration-200">
              <Image
                src={game.icon}
                alt={game.name}
                width={80}
                height={80}
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2 leading-tight tracking-tight">
            {game.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm text-center mb-4 leading-relaxed min-h-[2.5rem]">
            {game.description}
          </p>

          {/* Stats */}
          {typeof stats !== 'boolean' && 'played' in stats && stats.played > 0 && (
            <div className="flex justify-center gap-4 text-gray-500 text-xs mb-4 pb-4 border-b border-gray-200">
              <div className="text-center">
                <div className="font-bold text-gray-900 text-sm mb-0.5">{stats.played}</div>
                <div className="uppercase tracking-wide">Played</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 text-sm mb-0.5">{stats.wins}</div>
                <div className="uppercase tracking-wide">Wins</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 text-sm mb-0.5">{stats.totalPoints}</div>
                <div className="uppercase tracking-wide">Points</div>
              </div>
            </div>
          )}

          {/* Play button */}
          <div className="text-center">
            <style jsx>{`
              .play-button {
                background-color: #1f2937;
                color: white;
              }
              .group:hover .play-button {
                background-color: #FCFF52;
                color: #1f2937;
              }
            `}</style>
            <div className="play-button inline-flex items-center gap-2 font-semibold text-sm px-6 py-2.5 rounded-lg transition-all duration-200 shadow-sm">
              Play Now
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
