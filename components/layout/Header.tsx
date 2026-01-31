"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLocalStats } from "@/hooks/useLocalStats";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AudioControls } from "@/components/shared/AudioControls";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ChainSelector } from "@/components/shared/ChainSelector";
import { ChainWarning } from "@/components/shared/ChainWarning";
import { LoginModal } from "@/components/auth/LoginModal";
import { CreateAccountModal } from "@/components/auth/CreateAccountModal";
import Link from "next/link";

export function Header() {
  const { profile } = useLocalStats();
  const { t } = useLanguage();
  const { user, isAuthenticated, signOut } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Fetch user's display name from database
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      fetch(`/api/user/profile?id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.user?.display_name) {
            setDisplayName(data.user.display_name);
          }
        })
        .catch(err => {
          console.error('Error fetching display name:', err);
        });
    } else {
      setDisplayName(null);
    }
  }, [user?.id, isAuthenticated]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      {/* Top Bar */}
      <div className="bg-white/90 dark:bg-gray-900/95 rounded-xl shadow-md mb-6 dark:shadow-gray-900/50" style={{ borderBottom: '3px solid #FCFF52' }}>
        <div className="flex items-center justify-between p-4">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #FCFF52, #e5e600)' }}>
              <span className="text-2xl">🎮</span>
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
                Mini Games Portal
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {t('header.subtitle')}
              </p>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <AudioControls size="sm" />
            <LanguageSwitcher />

            {/* Authentication */}
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-semibold text-sm rounded-lg transition-colors"
                >
                  {t('auth.login')}
                </button>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="px-4 py-2 text-gray-900 font-semibold text-sm rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#FCFF52' }}
                >
                  {t('auth.createAccount')}
                </button>
                <div className="hidden sm:block">
                  <ConnectButton
                    showBalance={false}
                    chainStatus="icon"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="hidden sm:block">
                  <ConnectButton
                    showBalance={true}
                    chainStatus="icon"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>{displayName || user?.email?.split('@')[0] || t('nav.profile')}</span>
                    <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                      <Link
                        href="/profile/me"
                        className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        onClick={() => setShowUserMenu(false)}
                      >
                        {t('nav.profile')}
                      </Link>
                      <Link
                        href="/profile/edit"
                        className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm border-t border-gray-100 dark:border-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        {t('edit')}
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm border-t border-gray-100 dark:border-gray-700"
                      >
                        {t('nav.signOut')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {t('nav.home')}
              </Link>
              <Link
                href="/leaderboard"
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {t('nav.leaderboard')}
              </Link>
              <Link
                href="/profile/me"
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {t('nav.profile')}
              </Link>
              <Link
                href="/about"
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                style={{ color: '#b8b900' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FCFF5220'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('nav.guide')}
              </Link>
            </div>

            {/* Chain Selector + Stats */}
            <div className="hidden md:flex items-center gap-4">
              <ChainSelector />
              {profile.gamesPlayed > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600 dark:text-gray-400">Points:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{profile.totalPoints}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600 dark:text-gray-400">Games:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{profile.gamesPlayed}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Chain Warning (unsupported network) */}
      <ChainWarning className="mb-4" />

      {/* Authentication Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />

      <CreateAccountModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        currentStats={profile}
      />
    </motion.header>
  );
}
