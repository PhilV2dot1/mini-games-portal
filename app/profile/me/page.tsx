'use client';

/**
 * My Profile Page - View current user's profile
 *
 * Shows profile for:
 * - Anonymous users (from localStorage)
 * - Authenticated users (from database)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { useLocalStats } from '@/hooks/useLocalStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { BadgeGallery } from '@/components/badges/BadgeGallery';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface DbProfile {
  user: {
    id: string;
    fid: number | null;
    username: string;
    wallet_address: string | null;
    total_points: number;
    created_at: string;
    avatar_type: string;
    avatar_url: string;
    avatar_unlocked: boolean;
    bio: string;
    social_links: Record<string, string>;
    email: string;
    is_anonymous: boolean;
  };
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  recentSessions: unknown[];
  badges: unknown[];
  gameStats: Record<string, {
    played: number;
    wins: number;
    points: number;
  }>;
  rank: number | null;
}

interface GameStat {
  played: number;
  wins: number;
  losses: number;
  totalPoints?: number;
  points?: number;
}

export default function MyProfilePage() {
  const { profile: localProfile, isLoaded: localLoaded } = useLocalStats();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [dbProfile, setDbProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDatabaseProfile = useCallback(async () => {
    if (!user?.id) return;

    console.log('[Profile/Me] Loading database profile for user:', user.id);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/profile?id=${user.id}`);
      console.log('[Profile/Me] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Profile/Me] API error:', errorData);
        throw new Error(errorData.error || 'Failed to load profile');
      }

      const data = await response.json();
      console.log('[Profile/Me] Profile data loaded:', data);
      setDbProfile(data);
    } catch (err) {
      console.error('[Profile/Me] Error loading database profile:', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch database profile for authenticated users
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && user?.id) {
      loadDatabaseProfile();
    }
  }, [isAuthenticated, user?.id, authLoading, loadDatabaseProfile]);

  // Show loading only while auth is loading or while fetching database profile
  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400">
        <div className="text-center bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-gray-300">
          <div className="text-gray-900 text-xl font-semibold mb-2">{t('loading') || 'Chargement...'}</div>
        </div>
      </div>
    );
  }

  // Show loading for anonymous users while localStorage loads
  if (!isAuthenticated && !localLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400">
        <div className="text-center bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-gray-300">
          <div className="text-gray-900 text-xl font-semibold mb-2">{t('loading') || 'Chargement...'}</div>
        </div>
      </div>
    );
  }

  // Use database profile for authenticated users, localStorage for anonymous
  const profile = isAuthenticated && dbProfile ? dbProfile.user : localProfile;

  // Get stats from appropriate source
  const stats = isAuthenticated && dbProfile ? dbProfile.stats : {
    gamesPlayed: localProfile?.gamesPlayed || 0,
    wins: Object.values(localProfile?.games || {}).reduce((sum: number, game: GameStat) => sum + game.wins, 0),
    losses: Object.values(localProfile?.games || {}).reduce((sum: number, game: GameStat) => sum + game.losses, 0),
  };

  const totalPoints = isAuthenticated && dbProfile ? dbProfile.user.total_points : localProfile?.totalPoints || 0;
  const games = isAuthenticated && dbProfile ? dbProfile.gameStats : localProfile?.games || {};
  const username = profile?.username || `Player_${user?.id?.substring(0, 8) || 'Guest'}`;
  const avatarUrl = profile?.avatar_url || '/avatars/predefined/default-player.svg';
  const bio = profile?.bio || '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-2 border-red-400 rounded-xl p-4 mb-6"
          >
            <p className="text-red-800 font-semibold">⚠️ {error}</p>
          </motion.div>
        )}

        {/* Back to Home */}
        <Link
          href="/"
          className="inline-block mb-6 text-gray-700 hover:text-gray-900 font-semibold transition-colors"
        >
          ← {t('nav.home') || 'Accueil'}
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg border-2 border-yellow-400"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg">
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <h1 className="text-3xl font-black text-gray-900">
                  {username}
                </h1>
                {bio && (
                  <p className="text-sm text-gray-600 mt-1">{bio}</p>
                )}
                {!isAuthenticated && (
                  <p className="text-sm text-gray-600 mt-1">
                    🆓 {t('home.freePlay') || 'Mode Gratuit'}
                  </p>
                )}
                {isAuthenticated && user && (
                  <p className="text-sm text-gray-600 mt-1">
                    {user.email || `User ID: ${user.id.substring(0, 8)}`}
                  </p>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <Link
              href="/profile/edit"
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold rounded-xl transition-all shadow-lg"
            >
              ✏️ {t('home.edit') || 'Modifier'}
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 {t('home.stats') || 'Statistiques'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 text-center border-2 border-gray-300">
              <div className="text-3xl font-black text-gray-900">{totalPoints}</div>
              <div className="text-xs text-gray-600 font-semibold">{t('home.points') || 'Points Totaux'}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 text-center border-2 border-gray-300">
              <div className="text-3xl font-black text-gray-900">{stats.gamesPlayed}</div>
              <div className="text-xs text-gray-600 font-semibold">{t('home.gamesPlayed') || 'Parties Jouées'}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border-2 border-green-300">
              <div className="text-3xl font-black text-green-600">
                {stats.wins}
              </div>
              <div className="text-xs text-gray-600 font-semibold">{t('stats.wins') || 'Victoires'}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 text-center border-2 border-red-300">
              <div className="text-3xl font-black text-red-600">
                {stats.losses}
              </div>
              <div className="text-xs text-gray-600 font-semibold">{t('stats.losses') || 'Défaites'}</div>
            </div>
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">🏅 {t('badges.title') || 'Badges'}</h2>
            <Link
              href="/about"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              {t('home.learnMoreBadges') || 'Learn more'}
            </Link>
          </div>
          <BadgeGallery
            userId={user?.id}
            localStats={!user ? profile : undefined}
            compact={false}
          />
        </motion.div>

        {/* Per-Game Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎮 {t('stats.perGame') || 'Statistiques par Jeu'}</h2>
          {Object.keys(games).length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(games).map(([gameId, gameStats]) => {
                // Handle both localStorage and database formats
                const typedStats = gameStats as GameStat;
                const played = typedStats.played || 0;
                const wins = typedStats.wins || 0;
                const losses = typedStats.losses || 0;
                const points = typedStats.points || typedStats.totalPoints || 0;
                const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

                return (
                  <div key={gameId} className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 border-2 border-gray-300">
                    <div className="font-black text-gray-900 mb-3 capitalize text-lg">
                      {gameId === '2048' ? '2048' : gameId}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('stats.played') || 'Jouées'}:</span>
                        <span className="font-bold">{played}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('stats.wins') || 'Victoires'}:</span>
                        <span className="font-bold text-green-600">{wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('stats.losses') || 'Défaites'}:</span>
                        <span className="font-bold text-red-600">{losses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('stats.winRate') || 'Taux Victoire'}:</span>
                        <span className="font-bold">{winRate}%</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="text-gray-600">{t('home.points') || 'Points'}:</span>
                        <span className="font-bold text-gray-900">{points}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              {t('stats.noGames') || 'Aucune partie jouée pour le moment'}
            </p>
          )}
        </motion.div>

        {/* Call to Action for Anonymous Users */}
        {!isAuthenticated && stats.gamesPlayed >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-xl p-6 text-center shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🎉 {t('profile.saveYourProgress') || 'Sauvegardez votre Progression!'}
            </h3>
            <p className="text-gray-700 mb-4">
              {t('profile.createAccountMessage') || 'Créez un compte pour sauvegarder vos statistiques et participer au classement mondial!'}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold rounded-xl transition-all shadow-lg"
            >
              ⛓️ {t('profile.createAccount') || 'Créer un Compte'}
            </Link>
          </motion.div>
        )}
      </div>
    </main>
  );
}
