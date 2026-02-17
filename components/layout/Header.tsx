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
import { MobileMenu } from "@/components/layout/MobileMenu";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
      <div className="bg-white/90 dark:bg-gray-900/95 rounded-xl shadow-md mb-6 dark:shadow-gray-900/50" style={{ borderBottom: '3px solid var(--chain-primary)' }}>
        {/* Line 1: Brand + small controls */}
        <div className="flex items-center justify-between p-4">
          {/* Brand — title stays on one line */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--chain-primary), var(--chain-dark))' }}>
              <span className="text-2xl sm:text-3xl">🎮</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
              Mini Games Portal
            </h1>
          </Link>

          {/* Right: only small icon controls */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle size="sm" />
              <AudioControls size="sm" />
              <LanguageSwitcher />
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={t('nav.menu')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Line 2: Nav + Chain + Auth */}
        <nav className="hidden md:block border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2">
            {/* Nav links */}
            <div className="flex items-center gap-1">
              {[
                { href: "/", label: t('nav.home') },
                { href: "/leaderboard", label: t('nav.leaderboard') },
                { href: "/profile/me", label: t('nav.profile') },
                { href: "/friends", label: t('nav.friends') },
                { href: "/tournaments", label: t('nav.tournaments') },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/about"
                className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors"
                style={{ color: 'var(--chain-dark)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--chain-primary) 12%, transparent)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('nav.guide')}
              </Link>
            </div>

            {/* Right: Chain selector + Auth + Wallet */}
            <div className="flex items-center gap-3">
              <ChainSelector />

              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-semibold text-sm rounded-lg transition-colors"
                  >
                    {t('auth.login')}
                  </button>
                  <ConnectButton showBalance={false} chainStatus="icon" />
                </>
              ) : (
                <>
                  <ConnectButton showBalance={false} chainStatus="icon" />
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
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
        </nav>
      </div>

      {/* Chain Warning */}
      <ChainWarning className="mb-4" />

      {/* Modals */}
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

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        profile={profile}
        isAuthenticated={isAuthenticated}
        user={user}
        displayName={displayName}
        signOut={signOut}
        onLoginClick={() => setShowLoginModal(true)}
        onSignupClick={() => setShowSignupModal(true)}
      />
    </motion.header>
  );
}
