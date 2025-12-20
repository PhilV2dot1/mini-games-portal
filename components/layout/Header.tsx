"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
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

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center mb-6"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">
            Celo Mini Games Portal
          </h1>
          <div className="h-1.5 w-64 mx-auto rounded-full" style={{ backgroundColor: '#FCFF52' }}></div>
        </div>
        <LanguageSwitcher />
      </div>
      <p className="text-base sm:text-lg text-gray-700 font-medium mb-3">
        {t('nav.home')} - Play 6 Mini-Games on the Blockchain
      </p>

      {/* Navigation Links */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-3">
        <Link
          href="/"
          className="px-5 sm:px-6 py-3 bg-white/80 rounded-lg font-bold text-sm sm:text-base text-gray-700 hover:bg-white hover:text-gray-900 transition-colors shadow-sm"
        >
          🎮 {t('nav.home')}
        </Link>
        <Link
          href="/leaderboard"
          className="px-5 sm:px-6 py-3 bg-white/80 rounded-lg font-bold text-sm sm:text-base text-gray-700 hover:bg-white hover:text-gray-900 transition-colors shadow-sm"
        >
          🏆 {t('nav.leaderboard')}
        </Link>
        <Link
          href="/profile/me"
          className="px-5 sm:px-6 py-3 bg-white/80 rounded-lg font-bold text-sm sm:text-base text-gray-700 hover:bg-white hover:text-gray-900 transition-colors shadow-sm"
        >
          👤 {t('nav.profile')}
        </Link>
        <Link
          href="/about"
          className="px-5 sm:px-6 py-3 bg-yellow-400/90 rounded-lg font-bold text-sm sm:text-base text-gray-900 hover:bg-yellow-500 transition-colors shadow-sm"
        >
          📖 {t('nav.guide')}
        </Link>

        {/* Authentication Buttons */}
        {!isAuthenticated ? (
          <>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-5 sm:px-6 py-3 bg-blue-500/90 rounded-lg font-bold text-sm sm:text-base text-white hover:bg-blue-600 transition-colors shadow-sm"
            >
              🔐 Connexion
            </button>
            <button
              onClick={() => setShowSignupModal(true)}
              className="px-5 sm:px-6 py-3 bg-green-500/90 rounded-lg font-bold text-sm sm:text-base text-white hover:bg-green-600 transition-colors shadow-sm"
            >
              ✨ Créer un compte
            </button>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="px-5 sm:px-6 py-3 bg-purple-500/90 rounded-lg font-bold text-sm sm:text-base text-white hover:bg-purple-600 transition-colors shadow-sm"
            >
              👤 {user?.email?.split('@')[0] || 'Mon compte'} ▾
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50">
                <Link
                  href="/profile/me"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                  onClick={() => setShowUserMenu(false)}
                >
                  👤 Mon profil
                </Link>
                <Link
                  href="/profile/edit"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  ⚙️ Paramètres
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  🚪 Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {profile.gamesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-4 bg-white/90 backdrop-blur-lg rounded-xl px-4 py-2 shadow-lg"
          style={{ border: '3px solid #FCFF52' }}
        >
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{profile.totalPoints}</div>
            <div className="text-[10px] text-gray-600 font-medium">{t('home.points')}</div>
          </div>
          <div className="w-px h-8 bg-gray-300" />
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{profile.gamesPlayed}</div>
            <div className="text-[10px] text-gray-600 font-medium">{t('home.gamesPlayed')}</div>
          </div>
        </motion.div>
      )}

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
