"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { GameMetadata } from "@/lib/types";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useOptionalAudio } from "@/lib/audio/AudioContext";
import { useShouldAnimate } from "@/lib/utils/motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface GameCardProps {
  game: GameMetadata;
  index?: number; // For stagger animation
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  const { getStats } = useLocalStats();
  const stats = getStats(game.id);
  const { t } = useLanguage();
  const audio = useOptionalAudio();
  const shouldAnimate = useShouldAnimate();

  // Get translated description
  const translationKey = `games.${game.id}`;
  const description = t(translationKey as 'games.blackjack') || game.description;

  const handleClick = () => {
    audio?.playUISound('click');
  };

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 30, scale: 0.95 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={shouldAnimate ? { delay: index * 0.08, duration: 0.3 } : undefined}
      whileHover={shouldAnimate ? {
        y: -8,
        scale: 1.02,
        transition: { duration: 0.15 },
      } : undefined}
      className="h-full"
    >
      <Link href={game.route} onClick={handleClick} className="block h-full">
        <Card
          variant="default"
          padding="lg"
          hover
          className="relative cursor-pointer group border-2 border-gray-200 dark:border-gray-700 hover:border-celo dark:hover:border-celo overflow-hidden h-full transition-shadow duration-200 hover:shadow-xl dark:bg-gray-800"
        >
          {/* Glow effect overlay on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
            style={{
              boxShadow: 'inset 0 0 0 2px #FCFF52, 0 0 20px 5px rgba(252, 255, 82, 0.15)',
            }}
          />

          {/* Subtle accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #FCFF52, #e5e600)' }} />

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <motion.div
                className="w-16 h-16 sm:w-20 sm:h-20 relative"
                whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : {}}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Image
                  src={game.icon}
                  alt={game.name}
                  width={80}
                  height={80}
                  className="object-contain drop-shadow-lg"
                />
              </motion.div>
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-2 leading-tight tracking-tight">
              {game.name}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4 leading-relaxed min-h-[2.5rem]">
              {description}
            </p>

            {/* Stats */}
            {typeof stats !== 'boolean' && stats && 'played' in stats && stats.played > 0 && (
              <div className="flex justify-center gap-4 text-gray-500 dark:text-gray-400 text-xs mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{stats.played}</div>
                  <div className="uppercase tracking-wide">Played</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{stats.wins}</div>
                  <div className="uppercase tracking-wide">Wins</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{stats.totalPoints}</div>
                  <div className="uppercase tracking-wide">Points</div>
                </div>
              </div>
            )}

            {/* Play button */}
            <div className="text-center">
              <Button
                variant="primary"
                size="md"
                className="group-hover:bg-celo group-hover:text-gray-900 transition-colors duration-200"
                rightIcon={
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={shouldAnimate ? { x: [0, 4, 0] } : {}}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
                }
                ariaLabel={`Play ${game.name}`}
              >
                Play Now
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
