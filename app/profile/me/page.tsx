'use client';

/**
 * My Profile Page - View current user's profile
 *
 * Shows profile for:
 * - Anonymous users (from localStorage)
 * - Authenticated users (from database)
 */

import React from 'react';
import { Header } from '@/components/layout/Header';
import { useLocalStats } from '@/hooks/useLocalStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { BadgeGallery } from '@/components/badges/BadgeGallery';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function MyProfilePage() {
  const { profile, isLoaded } = useLocalStats();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400">
        <div className="text-center bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-gray-300">
          <div className="text-gray-900 text-xl font-semibold mb-2">{t('loading') || 'Loading...'}</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Back to Home */}
        <Link
          href="/"
          className="inline-block mb-6 text-gray-700 hover:text-gray-900 font-semibold transition-colors"
        >
          ← {t('nav.home') || 'Home'}
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
                  src={profile.avatar_url || '/avatars/predefined/default-player.svg'}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <h1 className="text-3xl font-black text-gray-900">
                  {profile.username || `Player_${user?.id?.substring(0, 8) || 'Guest'}`}
                </h1>
                {!isAuthenticated && (
                  <p className="text-sm text-gray-600">
                    🆓 {t('home.freePlay') || 'Free Play Mode'}
                  </p>
                )}
                {isAuthenticated && user && (
                  <p className="text-sm text-gray-600">
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
              ✏️ {t('home.edit') || 'Edit'}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 {t('home.stats') || 'Statistics'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 text-center border-2 border-gray-300">
              <div className="text-3xl font-black text-gray-900">{profile.totalPoints}</div>
              <div className="text-xs text-gray-600 font-semibold">{t('home.points') || 'Total Points'}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 text-center border-2 border-gray-300">
              <div className="text-3xl font-black text-gray-900">{profile.gamesPlayed}</div>
              <div className="text-xs text-gray-600 font-semibold">{t('home.gamesPlayed') || 'Games Played'}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border-2 border-green-300">
              <div className="text-3xl font-black text-green-600">
                {Object.values(profile.games).reduce((sum, game) => sum + game.wins, 0)}
              </div>
              <div className="text-xs text-gray-600 font-semibold">{t('stats.wins') || 'Wins'}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 text-center border-2 border-red-300">
              <div className="text-3xl font-black text-red-600">
                {Object.values(profile.games).reduce((sum, game) => sum + game.losses, 0)}
              </div>
              <div className="text-xs text-gray-600 font-semibold">{t('stats.losses') || 'Losses'}</div>
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
          <BadgeGallery compact={false} />
        </motion.div>

        {/* Per-Game Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎮 {t('stats.perGame') || 'Per-Game Statistics'}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(profile.games).map(([gameId, stats]) => {
              const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

              return (
                <div key={gameId} className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 border-2 border-gray-300">
                  <div className="font-black text-gray-900 mb-3 capitalize text-lg">
                    {gameId === '2048' ? '2048' : gameId}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('stats.played') || 'Played'}:</span>
                      <span className="font-bold">{stats.played}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('stats.wins') || 'Wins'}:</span>
                      <span className="font-bold text-green-600">{stats.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('stats.losses') || 'Losses'}:</span>
                      <span className="font-bold text-red-600">{stats.losses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('stats.winRate') || 'Win Rate'}:</span>
                      <span className="font-bold">{winRate}%</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-600">{t('home.points') || 'Points'}:</span>
                      <span className="font-bold text-gray-900">{stats.totalPoints}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Call to Action for Anonymous Users */}
        {!isAuthenticated && profile.gamesPlayed >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-xl p-6 text-center shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🎉 {t('profile.saveYourProgress') || 'Save Your Progress!'}
            </h3>
            <p className="text-gray-700 mb-4">
              {t('profile.createAccountMessage') || 'Create an account to save your stats on the blockchain and compete on the global leaderboard!'}
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold rounded-xl transition-all shadow-lg">
              ⛓️ {t('profile.createAccount') || 'Create Account'}
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
