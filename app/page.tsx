"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { GameGrid } from "@/components/games/GameGrid";
import { BadgeGallery } from "@/components/badges/BadgeGallery";
import { ProfileSetup } from "@/components/profile/ProfileSetup";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { GAMES } from "@/lib/types";
import Link from "next/link";
import { motion } from "framer-motion";

interface UserProfile {
  id: string;
  username?: string;
  total_points?: number;
  avatar_unlocked?: boolean;
}

export default function Home() {
  const games = Object.values(GAMES);
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [hasSeenSetup, setHasSeenSetup] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile data
  useEffect(() => {
    if (isAuthenticated && user) {
      const loadProfile = async () => {
        try {
          const response = await fetch(`/api/user/profile?id=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data.user);

            // Check if profile setup is needed
            if (!hasSeenSetup && (!data.user?.username || data.user.username.startsWith('Player_'))) {
              const timer = setTimeout(() => {
                setShowProfileSetup(true);
                setHasSeenSetup(true);
              }, 1000);
              return () => clearTimeout(timer);
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      };

      loadProfile();
    }
  }, [isAuthenticated, user, hasSeenSetup]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 mb-6 shadow-xl border-2 border-yellow-600"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎮 {t('home.welcome')}
              </h1>
              <p className="text-gray-800">
                {t('home.subtitle')}
              </p>
            </div>
            <Link
              href="/about"
              className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all shadow-lg whitespace-nowrap"
            >
              📖 {t('home.howToPlay')}
            </Link>
          </div>
        </motion.div>

        {/* Quick Stats or Profile CTA */}
        {isAuthenticated && userProfile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg border-2 border-gray-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('home.yourProfile')}</h2>
              <Link
                href="/profile/edit"
                className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm underline"
              >
                ✏️ {t('home.edit')}
              </Link>
            </div>
            {/* First 3 tiles grouped with Celo style */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center border-2 border-gray-300 hover:border-yellow-400 transition-all">
                <div className="text-4xl font-black text-gray-900">{userProfile.total_points || 0}</div>
                <div className="text-xs text-gray-700 font-semibold mt-1">{t('home.points')}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center border-2 border-gray-300 hover:border-yellow-400 transition-all">
                <div className="text-4xl font-black text-gray-900">
                  {userProfile.username ? '✓' : '-'}
                </div>
                <div className="text-xs text-gray-700 font-semibold mt-1">{t('home.profile')}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center border-2 border-gray-300 hover:border-yellow-400 transition-all">
                <div className="text-4xl font-black text-gray-900">
                  {userProfile.avatar_unlocked ? '🔓' : '🔒'}
                </div>
                <div className="text-xs text-gray-700 font-semibold mt-1">{t('home.customAvatar')}</div>
              </div>
            </div>
            {/* Leaderboard link with Celo yellow */}
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-4 text-center shadow-lg border-2 border-yellow-600 hover:scale-105 transition-transform">
              <Link href="/leaderboard" className="block">
                <div className="text-3xl font-bold text-gray-900 mb-1">📊</div>
                <div className="text-sm text-gray-900 font-bold">{t('home.leaderboard')}</div>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 mb-6 shadow-xl border-2 border-yellow-600"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">👤 {t('home.createProfile')}</h2>
              <p className="text-gray-800 mb-4">
                {t('home.saveProgress')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                >
                  🎮 {t('home.setupNow')}
                </button>
                <Link
                  href="/about"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                >
                  📖 {t('home.learnMore')}
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Grid - Moved up for better visibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 {t('home.availableGames')}</h2>
          <GameGrid games={games} />
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-4 mb-6 shadow-lg"
          style={{ border: '3px solid #FCFF52' }}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t('home.gameModes')}</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-gray-700">
            <div>
              <div className="font-semibold text-gray-900 mb-0.5 text-sm">🆓 {t('home.freeMode')}</div>
              <p className="text-xs">{t('home.freeModeDesc')}</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-0.5 text-sm">⛓️ {t('home.onChainMode')}</div>
              <p className="text-xs">{t('home.onChainModeDesc')}</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <Link
              href="/about"
              className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm underline"
            >
              {t('home.learnMoreBadges')} →
            </Link>
          </div>
        </motion.div>

        {/* Badge Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg border-2 border-gray-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">🏅 {t('home.availableBadges')}</h2>
            <Link
              href="/about"
              className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm underline"
            >
              {t('home.viewAllBadges')} →
            </Link>
          </div>
          <BadgeGallery
            userId={userProfile?.id}
            compact={true}
            maxDisplay={12}
          />
        </motion.div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-600 text-xs">
          <p>{t('home.footerBuilt')}</p>
          <p className="mt-1">
            <a
              href="https://celo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-celo font-semibold transition-colors underline decoration-celo"
            >
              {t('home.footerLearnCelo')}
            </a>
          </p>
        </footer>
      </div>

      {/* Profile Setup Modal */}
      <ProfileSetup
        isOpen={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onComplete={() => {
          setShowProfileSetup(false);
          // Could trigger a refresh or show a success message
        }}
      />
    </main>
  );
}
