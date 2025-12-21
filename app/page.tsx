"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GameGrid } from "@/components/games/GameGrid";
import { BadgeGallery } from "@/components/badges/BadgeGallery";
import { ProfileSetup } from "@/components/profile/ProfileSetup";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useLocalStats } from "@/hooks/useLocalStats";
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
  const { profile } = useLocalStats();
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
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-gray-500 via-gray-300 to-gray-100 rounded-2xl p-8 mb-8 shadow-2xl border-4 border-yellow-400"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                🎮 {t('home.welcome')}
              </h1>
              <p className="text-lg text-gray-800 mb-4 font-medium">
                {t('home.subtitle')}
              </p>
              {/* Game Modes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3 bg-white/40 backdrop-blur-sm rounded-xl p-3 hover:bg-white/60 transition-all">
                  <span className="text-2xl">🆓</span>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">{t('home.freeMode')}</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{t('home.freeModeDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/40 backdrop-blur-sm rounded-xl p-3 hover:bg-white/60 transition-all">
                  <span className="text-2xl">⛓️</span>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">{t('home.onChainMode')}</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{t('home.onChainModeDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/about"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap transform"
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
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 mb-8 shadow-xl border-2 border-gray-300 hover:border-gray-400 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('home.yourProfile')}</h2>
              <Link
                href="/profile/edit"
                className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm underline hover:scale-105 transition-transform inline-block"
              >
                ✏️ {t('home.edit')}
              </Link>
            </div>
            {/* Stats tiles */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border-2 border-gray-300 hover:border-yellow-400 hover:shadow-lg transition-all transform hover:-translate-y-1">
                <div className="text-5xl font-black text-gray-900 mb-2">{userProfile.total_points || 0}</div>
                <div className="text-sm text-gray-700 font-semibold">{t('home.points')}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border-2 border-gray-300 hover:border-yellow-400 hover:shadow-lg transition-all transform hover:-translate-y-1">
                <div className="text-5xl font-black text-gray-900 mb-2">
                  {userProfile.username ? '✓' : '-'}
                </div>
                <div className="text-sm text-gray-700 font-semibold">{t('home.profile')}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border-2 border-gray-300 hover:border-yellow-400 hover:shadow-lg transition-all transform hover:-translate-y-1">
                <div className="text-5xl font-black text-gray-900 mb-2">
                  {userProfile.avatar_unlocked ? '🔓' : '🔒'}
                </div>
                <div className="text-sm text-gray-700 font-semibold">{t('home.customAvatar')}</div>
              </div>
            </div>
            {/* Leaderboard link */}
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-5 text-center shadow-lg border-2 border-yellow-600 hover:shadow-xl hover:scale-105 transition-all transform cursor-pointer">
              <Link href="/leaderboard" className="block">
                <div className="text-4xl font-bold text-gray-900 mb-2">📊</div>
                <div className="text-base text-gray-900 font-bold">{t('home.leaderboard')}</div>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-gradient-to-br from-gray-500 via-gray-300 to-gray-100 rounded-2xl p-8 mb-8 shadow-2xl border-4 border-yellow-400"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">👤 {t('home.createProfile')}</h2>
                <p className="text-lg text-gray-800 font-medium">
                  {t('home.saveProgress')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap transform"
                >
                  🎮 {t('home.setupNow')}
                </button>
                <Link
                  href="/about"
                  className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap transform text-center"
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
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">🎯 {t('home.availableGames')}</h2>
          <GameGrid games={games} />
        </motion.div>

        {/* Badge Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 mb-8 shadow-xl border-2 border-gray-300 hover:border-gray-400 transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">🏅 {t('home.availableBadges')}</h2>
            <Link
              href="/about"
              className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm underline hover:scale-105 transition-transform inline-block"
            >
              {t('home.viewAllBadges')} →
            </Link>
          </div>
          <BadgeGallery
            userId={userProfile?.id}
            localStats={!isAuthenticated ? profile : undefined}
            compact={false}
            maxDisplay={12}
          />
        </motion.div>

        {/* Footer */}
        <Footer />
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
