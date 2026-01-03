"use client";

import Link from "next/link";
import Image from "next/image";
import { GameMetadata } from "@/lib/types";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface GameCardProps {
  game: GameMetadata;
}

export function GameCard({ game }: GameCardProps) {
  const { getStats } = useLocalStats();
  const stats = getStats(game.id);
  const { t } = useLanguage();

  // Get translated description
  const translationKey = `games.${game.id}`;
  const description = t(translationKey as 'games.blackjack') || game.description;

  return (
    <Link href={game.route}>
      <Card
        variant="default"
        padding="lg"
        hover
        className="relative cursor-pointer group border-2 border-gray-200 hover:border-celo overflow-hidden"
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
            {description}
          </p>

          {/* Stats */}
          {typeof stats !== 'boolean' && stats && 'played' in stats && stats.played > 0 && (
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
            <Button
              variant="primary"
              size="md"
              className="group-hover:bg-celo group-hover:text-gray-900"
              rightIcon={
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
              ariaLabel={`Play ${game.name}`}
            >
              Play Now
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
