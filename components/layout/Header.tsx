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
import { ChainWarning } from "@/components/shared/ChainWarning";
import { useChainSelector } from "@/hooks/useChainSelector";
import { CeloIcon } from "@/components/shared/CeloIcon";
import { BaseIcon } from "@/components/shared/BaseIcon";
import { MegaEthIcon } from "@/components/shared/MegaEthIcon";
import { SoneiumIcon } from "@/components/shared/SoneiumIcon";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { LoginModal } from "@/components/auth/LoginModal";
import { CreateAccountModal } from "@/components/auth/CreateAccountModal";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { EthosLogo } from "@/components/auth/EthosScoreBadge";
import Link from "next/link";

export function Header() {
  const { profile } = useLocalStats();
  const { t } = useLanguage();
  const { user, isAuthenticated, signOut } = useAuth();
  const { isOnCelo, isOnBase, isOnMegaeth, isOnSoneium, switchToCelo, switchToBase, switchToMegaeth, switchToSoneium } = useChainSelector();

  const { isInstallable, installApp } = usePWAInstall();
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
          const name = data.user?.display_name || data.user?.username;
          // Don't use wallet addresses as display name
          if (name && !name.startsWith('0x')) {
            setDisplayName(name);
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

        {/* ── Line 1: Brand | Chains + Wallet + User ── */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--chain-primary), var(--chain-dark))' }}>
              <span className="text-xl">🎮</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
              Mini Games Portal
            </h1>
          </Link>

          {/* Right: Chains + Wallet + User (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Chain selector */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { fn: switchToCelo,    active: isOnCelo,    Icon: CeloIcon,    label: 'Celo' },
                { fn: switchToBase,    active: isOnBase,    Icon: BaseIcon,    label: 'Base' },
                { fn: switchToMegaeth, active: isOnMegaeth, Icon: MegaEthIcon, label: 'MegaETH' },
                { fn: switchToSoneium, active: isOnSoneium, Icon: SoneiumIcon, label: 'Soneium' },
              ].map(({ fn, active, Icon, label }) => (
                <button key={label} onClick={fn} title={label}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${active ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'opacity-50 hover:opacity-80 text-gray-600 dark:text-gray-400'}`}
                >
                  <Icon size={16} /><span>{label}</span>
                </button>
              ))}
            </div>

            {/* Wallet connect */}
            <ConnectButton showBalance={false} chainStatus="icon" />

            {/* Auth */}
            {!isAuthenticated ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-semibold text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                {t('auth.login')}
              </button>
            ) : (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-600 bg-gray-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user?.user_metadata?.ethos_picture || user?.user_metadata?.avatar_url || '/avatars/predefined/default-player.svg'}
                        alt="avatar" className="object-cover w-full h-full"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/avatars/predefined/default-player.svg'; }}
                      />
                    </div>
                    {user?.user_metadata?.ethos_score && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm whitespace-nowrap">
                        <EthosLogo className="w-2.5 h-2.5 text-indigo-500 flex-shrink-0" />
                        <span className="text-[10px] font-bold text-gray-800 leading-none">{user.user_metadata.ethos_score}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-gray-900 dark:text-white text-sm font-semibold max-w-[120px] truncate">
                    {(() => {
                      const truncate = (s: string) => s.startsWith('0x') && s.length > 10 ? `${s.slice(0, 6)}...${s.slice(-4)}` : s;
                      if (displayName) return displayName;
                      const ethosName = user?.user_metadata?.ethos_username;
                      if (ethosName && !ethosName.startsWith('0x')) return ethosName;
                      const emailPart = user?.email?.split('@')[0] || '';
                      return emailPart ? truncate(emailPart) : t('nav.profile');
                    })()}
                  </span>
                  <svg className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <Link href="/profile/me" className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm" onClick={() => setShowUserMenu(false)}>{t('nav.profile')}</Link>
                    <Link href="/profile/edit" className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm border-t border-gray-100 dark:border-gray-700" onClick={() => setShowUserMenu(false)}>{t('edit')}</Link>
                    <button onClick={() => { signOut(); setShowUserMenu(false); }} className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm border-t border-gray-100 dark:border-gray-700">{t('nav.signOut')}</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <NotificationCenter />
            <button onClick={() => setShowMobileMenu(true)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={t('nav.menu')}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Line 2: Nav links | Utilities ── */}
        <nav className="hidden md:block border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-1.5">
            {/* Nav links */}
            <div className="flex items-center gap-0.5">
              {[
                { href: "/",            label: t('nav.home') },
                { href: "/leaderboard", label: t('nav.leaderboard') },
                { href: "/profile/me",  label: t('nav.profile') },
                { href: "/friends",     label: t('nav.friends') },
                { href: "/tournaments", label: t('nav.tournaments') },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="px-3 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  {label}
                </Link>
              ))}
              <Link href="/about" className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors" style={{ color: 'var(--chain-dark)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--chain-primary) 12%, transparent)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('nav.guide')}
              </Link>
            </div>

            {/* Utility controls */}
            <div className="flex items-center gap-1.5">
              <ThemeToggle size="sm" />
              <AudioControls size="sm" />
              <LanguageSwitcher />
              <NotificationCenter />
              {isInstallable && (
                <button onClick={installApp} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors" style={{ backgroundColor: 'var(--chain-primary)', color: 'var(--chain-contrast)' }} title="Install app">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Install
                </button>
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
