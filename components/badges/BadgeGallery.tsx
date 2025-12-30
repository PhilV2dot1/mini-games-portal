'use client';

/**
 * BadgeGallery - Display available badges and user progress
 *
 * Shows all badges with:
 * - Badge icon and name
 * - Description and requirements
 * - Locked/unlocked status
 * - Progress towards earning
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned?: boolean;
  earned_at?: string;
}

interface LocalStats {
  totalPoints: number;
  gamesPlayed: number;
  games: Record<string, { played: number; wins: number; losses: number; totalPoints: number; lastPlayed: number }>;
}

interface BadgeGalleryProps {
  userId?: string;
  localStats?: LocalStats;
  compact?: boolean;
  showOnlyEarned?: boolean;
  maxDisplay?: number;
}

const ALL_BADGES: Badge[] = [
  {
    id: 'first_win',
    name: 'Première Victoire',
    description: 'Remportez votre premier jeu',
    icon: '🏆',
    category: 'Progression',
    points: 10,
  },
  {
    id: 'win_streak_5',
    name: 'Série de 5',
    description: 'Gagnez 5 parties d&apos;affilée',
    icon: '🔥',
    category: 'Performance',
    points: 50,
  },
  {
    id: 'win_streak_10',
    name: 'Série de 10',
    description: 'Gagnez 10 parties d&apos;affilée',
    icon: '⚡',
    category: 'Performance',
    points: 100,
  },
  {
    id: 'games_10',
    name: 'Débutant',
    description: 'Jouez 10 parties',
    icon: '🎮',
    category: 'Progression',
    points: 25,
  },
  {
    id: 'games_50',
    name: 'Joueur Régulier',
    description: 'Jouez 50 parties',
    icon: '🎯',
    category: 'Progression',
    points: 75,
  },
  {
    id: 'veteran',
    name: 'Vétéran',
    description: 'Jouez 100 parties',
    icon: '⭐',
    category: 'Progression',
    points: 150,
  },
  {
    id: 'master',
    name: 'Maître du Jeu',
    description: 'Jouez 500 parties',
    icon: '👑',
    category: 'Elite',
    points: 500,
  },
  {
    id: 'all_games',
    name: 'Touche-à-tout',
    description: 'Jouez à tous les jeux',
    icon: '🌟',
    category: 'Collection',
    points: 100,
  },
  {
    id: 'perfect_week',
    name: 'Semaine Parfaite',
    description: 'Gagnez au moins une partie chaque jour pendant 7 jours',
    icon: '📅',
    category: 'Engagement',
    points: 200,
  },
  {
    id: 'high_roller',
    name: 'Gros Joueur',
    description: 'Accumulez 1000 points',
    icon: '💎',
    category: 'Points',
    points: 250,
  },
  {
    id: 'points_5000',
    name: 'Champion',
    description: 'Accumulez 5000 points',
    icon: '🏅',
    category: 'Points',
    points: 500,
  },
  {
    id: 'leaderboard_top10',
    name: 'Top 10',
    description: 'Atteignez le top 10 du classement',
    icon: '📊',
    category: 'Classement',
    points: 300,
  },
  {
    id: 'leaderboard_top3',
    name: 'Podium',
    description: 'Atteignez le top 3 du classement',
    icon: '🥉',
    category: 'Classement',
    points: 500,
  },
  {
    id: 'leaderboard_1',
    name: 'Numéro 1',
    description: 'Atteignez la 1ère place du classement',
    icon: '🥇',
    category: 'Classement',
    points: 1000,
  },
];

export function BadgeGallery({
  userId,
  localStats,
  compact = false,
  showOnlyEarned = false,
  maxDisplay
}: BadgeGalleryProps) {
  const { t } = useLanguage();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to calculate earned badges from local stats
  function calculateEarnedBadges(stats: LocalStats): Set<string> {
    const earned = new Set<string>();

    const totalWins = Object.values(stats.games).reduce((sum, game) => sum + game.wins, 0);
    const gamesPlayedCount = Object.values(stats.games).filter(g => g.played > 0).length;

    // Progression badges
    if (totalWins >= 1) earned.add('first_win');
    if (stats.gamesPlayed >= 10) earned.add('games_10');
    if (stats.gamesPlayed >= 50) earned.add('games_50');
    if (stats.gamesPlayed >= 100) earned.add('veteran');
    if (stats.gamesPlayed >= 500) earned.add('master');

    // Points badges
    if (stats.totalPoints >= 1000) earned.add('points_1000');
    if (stats.totalPoints >= 5000) earned.add('points_5000');

    // Collection badge
    if (gamesPlayedCount >= 6) earned.add('all_games'); // All 6 games

    return earned;
  }

  useEffect(() => {
    async function loadBadges() {
      let earnedIds = new Set<string>();

      // Load earned badges from API if user is logged in
      if (userId) {
        try {
          const response = await fetch(`/api/user/profile?id=${userId}`);
          if (response.ok) {
            const data = await response.json();
            earnedIds = new Set<string>(data.badges?.map((b: Badge) => b.id) || []);
          }
        } catch (error) {
          console.error('Error loading badges:', error);
        }
      }
      // Calculate earned badges from local stats if available
      else if (localStats) {
        earnedIds = calculateEarnedBadges(localStats);
      }

      // Always show all badges (locked if not earned) and translate them
      let displayBadges = ALL_BADGES.map(badge => ({
        ...badge,
        name: t(`badges.${badge.id}`),
        description: t(`badges.desc_${badge.id}`),
        category: t(`badges.cat_${badge.category.toLowerCase().replace(' ', '_')}`),
        earned: earnedIds.has(badge.id),
      }));

      if (showOnlyEarned) {
        displayBadges = displayBadges.filter(b => b.earned);
      }

      if (maxDisplay) {
        displayBadges = displayBadges.slice(0, maxDisplay);
      }

      setBadges(displayBadges);
      setLoading(false);
    }

    loadBadges();
  }, [userId, localStats, showOnlyEarned, maxDisplay, t]); // Added t for translations

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  const earnedCount = badges.filter(b => b.earned).length;
  const totalCount = ALL_BADGES.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('badges.title')}</h2>
            <p className="text-sm text-gray-600">
              {earnedCount} / {totalCount} {t('badges.unlocked')}
            </p>
          </div>
          <Link
            href="/about"
            className="text-celo hover:text-yellow-700 font-semibold text-sm underline"
          >
            {t('badges.howToEarn')}
          </Link>
        </div>
      )}

      {/* Progress Bar */}
      {!compact && (
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full"
          />
        </div>
      )}

      {/* Badge Grid */}
      <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-3 gap-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'}`}>
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative bg-white/90 backdrop-blur-sm rounded-xl p-4 border-2 ${
              badge.earned
                ? 'border-celo shadow-lg'
                : 'border-gray-300 opacity-70'
            } transition-all hover:scale-105`}
          >
            {/* Badge Icon */}
            <div className={`${compact ? 'text-4xl' : 'text-5xl'} text-center mb-2`}>
              {badge.earned ? badge.icon : '🔒'}
            </div>

            {/* Badge Name */}
            <h3 className={`font-bold text-gray-900 text-center mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
              {badge.name}
            </h3>

            {!compact && (
              <>
                {/* Badge Description */}
                <p className="text-xs text-gray-600 text-center mb-2">
                  {badge.description}
                </p>
              </>
            )}

            {/* Badge Points */}
            <div className="text-center">
              <span className={`inline-block bg-celo/10 text-yellow-800 font-semibold px-2 py-1 rounded-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
                +{badge.points} pts
              </span>
            </div>

            {/* Earned Indicator */}
            {badge.earned && (
              <div className="absolute top-2 right-2 bg-celo text-gray-900 rounded-full w-6 h-6 flex items-center justify-center">
                <span className="text-xs font-bold">✓</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* View All Link */}
      {compact && maxDisplay && badges.length >= maxDisplay && (
        <div className="text-center pt-2">
          <Link
            href="/profile"
            className="text-celo hover:text-yellow-700 font-semibold text-sm underline"
          >
            {t('badges.viewAll')} ({totalCount})
          </Link>
        </div>
      )}
    </div>
  );
}
