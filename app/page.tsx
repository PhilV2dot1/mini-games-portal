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

        {/* Welcome Banner - Simplified */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-xl p-6 mb-8 shadow-md"
          style={{ borderLeft: '4px solid #FCFF52' }}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('home.welcome')}
              </h2>
              <p className="text-sm text-gray-700">
                {t('home.subtitle')}
              </p>
            </div>
            <Link
              href="/about"
              className="text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all shadow hover:shadow-md whitespace-nowrap hover:opacity-90"
              style={{ backgroundColor: '#FCFF52' }}
            >
              {t('home.howToPlay')}
            </Link>
          </div>
        </motion.div>

        {/* Game Grid - Primary Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('home.availableGames')}</h2>
            {isAuthenticated && userProfile && (
              <Link
                href="/leaderboard"
                className="text-gray-700 hover:text-gray-900 font-semibold text-sm flex items-center gap-2 transition-colors"
              >
                {t('home.leaderboard')} →
              </Link>
            )}
          </div>
          <GameGrid games={games} />
        </motion.div>

        {/* Quick Stats - Compact */}
        {isAuthenticated && userProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white/90 rounded-xl p-5 mb-8 shadow-md border border-gray-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t('home.yourProfile')}</h3>
              <Link
                href="/profile/edit"
                className="font-medium text-sm transition-colors"
                style={{ color: '#b8b900' }}
              >
                {t('home.edit')}
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                <div className="text-3xl font-bold text-gray-900 mb-1">{userProfile.total_points || 0}</div>
                <div className="text-xs text-gray-600">{t('home.points')}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {userProfile.username ? '✓' : '-'}
                </div>
                <div className="text-xs text-gray-600">{t('home.profile')}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {userProfile.avatar_unlocked ? '🔓' : '🔒'}
                </div>
                <div className="text-xs text-gray-600">{t('home.customAvatar')}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile CTA for non-authenticated users */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-xl p-6 mb-8 shadow-md"
            style={{ borderLeft: '4px solid #FCFF52' }}
          >
            <div className="flex items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{t('home.createProfile')}</h3>
                <p className="text-sm text-gray-700">
                  {t('home.saveProgress')}
                </p>
              </div>
              <button
                onClick={() => setShowProfileSetup(true)}
                className="text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all shadow hover:shadow-md whitespace-nowrap hover:opacity-90"
                style={{ backgroundColor: '#FCFF52' }}
              >
                {t('home.setupNow')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Badge Preview - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white/90 rounded-xl p-5 mb-8 shadow-md border border-gray-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{t('home.availableBadges')}</h3>
            <Link
              href="/about"
              className="font-medium text-sm transition-colors"
              style={{ color: '#b8b900' }}
            >
              {t('home.viewAllBadges')} →
            </Link>
          </div>
          <BadgeGallery
            userId={userProfile?.id}
            localStats={!isAuthenticated ? profile : undefined}
            compact={true}
            maxDisplay={6}
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
