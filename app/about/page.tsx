'use client';

/**
 * About Page - Explain game mechanics, badges, and leaderboard
 */

import React from 'react';
import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 mb-6 shadow-xl border-2 border-chain"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            🎮 {t('about.title')}
          </h1>
          <p className="text-lg text-gray-700 text-center">
            {t('about.subtitle')}
          </p>
        </motion.div>

        {/* Game Modes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-lg border-2 border-gray-300"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🎯 {t('about.gameModesTitle')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-300">
              <h3 className="text-lg font-bold text-blue-900 mb-2">🆓 {t('about.freePlayTitle')}</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                {(t('about.freePlayBullets') as string[]).map((bullet, i) => (
                  <li key={i}>• {bullet}</li>
                ))}
              </ul>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-300">
              <h3 className="text-lg font-bold text-purple-900 mb-2">⛓️ {t('about.onChainTitle')}</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                {(t('about.onChainBullets') as string[]).map((bullet, i) => (
                  <li key={i}>• {bullet}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Points System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-lg border-2 border-gray-300"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            ⭐ {t('about.pointsSystemTitle')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-semibold text-green-900">{t('about.victory')}</p>
                <p className="text-sm text-green-700">{t('about.victoryDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-2xl">🎮</span>
              <div>
                <p className="font-semibold text-blue-900">{t('about.participation')}</p>
                <p className="text-sm text-blue-700">{t('about.participationDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="font-semibold text-purple-900">{t('about.streakBonus')}</p>
                <p className="text-sm text-purple-700">{t('about.streakBonusDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-chain/5 rounded-lg">
              <span className="text-2xl">🏅</span>
              <div>
                <p className="font-semibold text-gray-900">{t('about.badgeBonus')}</p>
                <p className="text-sm text-gray-900">{t('about.badgeBonusDesc')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Badge System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-lg border-2 border-gray-300"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🏅 {t('about.badgesToUnlockTitle')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('about.badgesToUnlockDesc')}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">🎯 {t('badges.progression')}</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>🏆 <strong>{t('badges.first_win')}</strong> - {t('badges.desc_first_win')} (+10 pts)</li>
                <li>🎮 <strong>{t('badges.games_10')}</strong> - {t('badges.desc_games_10')} (+25 pts)</li>
                <li>🎯 <strong>{t('badges.games_50')}</strong> - {t('badges.desc_games_50')} (+75 pts)</li>
                <li>⭐ <strong>{t('badges.veteran')}</strong> - {t('badges.desc_veteran')} (+150 pts)</li>
                <li>👑 <strong>{t('badges.master')}</strong> - {t('badges.desc_master')} (+500 pts)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">⚡ {t('badges.performance')}</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>🔥 <strong>{t('badges.win_streak_5')}</strong> - {t('badges.desc_win_streak_5')} (+50 pts)</li>
                <li>⚡ <strong>{t('badges.win_streak_10')}</strong> - {t('badges.desc_win_streak_10')} (+100 pts)</li>
                <li>💎 <strong>{t('badges.high_roller')}</strong> - {t('badges.desc_high_roller')} (+250 pts)</li>
                <li>🏅 <strong>{t('badges.points_5000')}</strong> - {t('badges.desc_points_5000')} (+500 pts)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">📊 {t('badges.ranking')}</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>📊 <strong>{t('badges.leaderboard_top10')}</strong> - {t('badges.desc_leaderboard_top10')} (+300 pts)</li>
                <li>🥉 <strong>{t('badges.leaderboard_top3')}</strong> - {t('badges.desc_leaderboard_top3')} (+500 pts)</li>
                <li>🥇 <strong>{t('badges.leaderboard_1')}</strong> - {t('badges.desc_leaderboard_1')} (+1000 pts)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">🌟 {t('badges.collection')}</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>🌟 <strong>{t('badges.all_games')}</strong> - {t('badges.desc_all_games')} (+100 pts)</li>
                <li>📅 <strong>{t('badges.perfect_week')}</strong> - {t('badges.desc_perfect_week')} (+200 pts)</li>
              </ul>
            </div>
          </div>

          <div className="bg-chain/5 border-2 border-chain rounded-xl p-4">
            <p className="text-sm text-gray-900">
              💡 <strong>{t('about.veteranTip')}</strong> {t('about.veteranTipDesc')}
            </p>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-lg border-2 border-gray-300"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            📊 {t('about.leaderboardTitle')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('about.leaderboardDesc')}
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-chain/5 rounded-lg border-2 border-chain">
              <span className="text-3xl">🥇</span>
              <div>
                <p className="font-bold text-gray-900">{t('about.firstPlace')}</p>
                <p className="text-sm text-gray-900">{t('about.firstPlaceDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border-2 border-gray-400">
              <span className="text-3xl">🥈</span>
              <div>
                <p className="font-bold text-gray-700">{t('about.secondPlace')}</p>
                <p className="text-sm text-gray-600">{t('about.secondPlaceDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-chain/5 rounded-lg border-2 border-chain">
              <span className="text-3xl">🥉</span>
              <div>
                <p className="font-bold text-gray-900">{t('about.thirdPlace')}</p>
                <p className="text-sm text-gray-900">{t('about.thirdPlaceDesc')}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/leaderboard"
              className="inline-block bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
            >
              {t('about.viewLeaderboard')}
            </Link>
          </div>
        </motion.div>

        {/* Avatar System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-lg border-2 border-gray-300"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            👤 {t('about.avatarSystemTitle')}
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-900">{t('about.predefinedAvatars')}</p>
              <p className="text-sm text-blue-700">{t('about.predefinedAvatarsDesc')}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="font-semibold text-purple-900">{t('about.customAvatar')} 🔓</p>
              <p className="text-sm text-purple-700">{t('about.customAvatarDesc')}</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-8"
        >
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 font-bold py-4 px-8 rounded-xl transition-all shadow-xl text-lg"
          >
            {t('about.startPlaying')} 🎮
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
