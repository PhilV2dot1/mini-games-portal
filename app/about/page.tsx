'use client';

/**
 * About Page - Explain game mechanics, badges, and leaderboard
 *
 * Comprehensive guide to:
 * - How to earn points
 * - Badge system
 * - Leaderboard rankings
 * - Game modes
 */

import React from 'react';
import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AboutPage() {
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
            🎮 How to Play
          </h1>
          <p className="text-lg text-gray-700 text-center">
            Learn how to earn points, unlock badges and climb the leaderboard!
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
            🎯 Game Modes
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-300">
              <h3 className="text-lg font-bold text-blue-900 mb-2">🆓 Free Play Mode</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Play immediately without a wallet</li>
                <li>• Earn points and badges</li>
                <li>• Stats saved locally</li>
                <li>• Perfect for discovering the games</li>
              </ul>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-300">
              <h3 className="text-lg font-bold text-purple-900 mb-2">⛓️ On-Chain Mode</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>• Connect your Celo wallet</li>
                <li>• Stats saved on the blockchain</li>
                <li>• Participate in the global leaderboard</li>
                <li>• Free to play (gas fees only)</li>
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
            ⭐ Points System
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-semibold text-green-900">Victory</p>
                <p className="text-sm text-green-700">+10 to +50 points depending on the game</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-2xl">🎮</span>
              <div>
                <p className="font-semibold text-blue-900">Participation</p>
                <p className="text-sm text-blue-700">+5 points even if you lose</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="font-semibold text-purple-900">Streak Bonus</p>
                <p className="text-sm text-purple-700">Bonus points for consecutive wins</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-chain/5 rounded-lg">
              <span className="text-2xl">🏅</span>
              <div>
                <p className="font-semibold text-gray-900">Badges</p>
                <p className="text-sm text-gray-900">10 to 1000 bonus points per unlocked badge</p>
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
            🏅 Badges to Unlock
          </h2>
          <p className="text-gray-700 mb-4">
            Complete challenges to unlock badges and earn bonus points!
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">🎯 Progression</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>🏆 <strong>First Victory</strong> - Win your first game (+10 pts)</li>
                <li>🎮 <strong>Beginner</strong> - Play 10 games (+25 pts)</li>
                <li>🎯 <strong>Regular Player</strong> - Play 50 games (+75 pts)</li>
                <li>⭐ <strong>Veteran</strong> - Play 100 games (+150 pts)</li>
                <li>👑 <strong>Game Master</strong> - Play 500 games (+500 pts)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">⚡ Performance</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>🔥 <strong>Streak of 5</strong> - 5 wins in a row (+50 pts)</li>
                <li>⚡ <strong>Streak of 10</strong> - 10 wins in a row (+100 pts)</li>
                <li>💎 <strong>High Roller</strong> - Accumulate 1000 points (+250 pts)</li>
                <li>🏅 <strong>Champion</strong> - Accumulate 5000 points (+500 pts)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">📊 Leaderboard</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>📊 <strong>Top 10</strong> - Reach top 10 on leaderboard (+300 pts)</li>
                <li>🥉 <strong>Podium</strong> - Reach top 3 on leaderboard (+500 pts)</li>
                <li>🥇 <strong>Number 1</strong> - Reach 1st place (+1000 pts)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">🌟 Collection</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>🌟 <strong>Jack of All Trades</strong> - Play all games (+100 pts)</li>
                <li>📅 <strong>Perfect Week</strong> - Win every day for 7 days (+200 pts)</li>
              </ul>
            </div>
          </div>

          <div className="bg-chain/5 border-2 border-chain rounded-xl p-4">
            <p className="text-sm text-gray-900">
              💡 <strong>Tip:</strong> The <strong>Veteran</strong> badge (100 games) unlocks the ability
              to upload a custom avatar!
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
            📊 Leaderboard
          </h2>
          <p className="text-gray-700 mb-4">
            The leaderboard is updated in real-time and ranks players by their total points.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-chain/5 rounded-lg border-2 border-chain">
              <span className="text-3xl">🥇</span>
              <div>
                <p className="font-bold text-gray-900">1st Place</p>
                <p className="text-sm text-gray-900">Golden crown + exclusive badge</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border-2 border-gray-400">
              <span className="text-3xl">🥈</span>
              <div>
                <p className="font-bold text-gray-700">2nd Place</p>
                <p className="text-sm text-gray-600">Silver medal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-chain/5 rounded-lg border-2 border-chain">
              <span className="text-3xl">🥉</span>
              <div>
                <p className="font-bold text-gray-900">3rd Place</p>
                <p className="text-sm text-gray-900">Bronze medal</p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/leaderboard"
              className="inline-block bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
            >
              View Leaderboard →
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
            👤 Avatar System
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-900">Predefined Avatars</p>
              <p className="text-sm text-blue-700">Choose from 30 stylized gaming avatars</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="font-semibold text-purple-900">Custom Avatar 🔓</p>
              <p className="text-sm text-purple-700">
                Upload your own image (unlocked after 100 games or Veteran badge)
              </p>
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
            Start Playing! 🎮
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
