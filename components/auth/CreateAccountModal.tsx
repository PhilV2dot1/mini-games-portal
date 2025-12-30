'use client';

/**
 * CreateAccountModal - Modal for account creation
 *
 * Displays after user has accumulated stats to motivate profile claiming.
 * Supports email/password signup and social login (Google, Twitter).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStats?: {
    totalPoints: number;
    gamesPlayed: number;
  };
  onSuccess?: () => void;
}

export function CreateAccountModal({
  isOpen,
  onClose,
  currentStats,
  onSuccess,
}: CreateAccountModalProps) {
  const { signUp, signInWithGoogle, signInWithTwitter, signInWithDiscord, claimProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Supabase Auth account
      const signupResult = await signUp(email, password);

      if (!signupResult.success) {
        setError(signupResult.error || 'Échec de la création du compte');
        setLoading(false);
        return;
      }

      // Step 2: Claim profile with localStorage stats
      const localStats = localStorage.getItem('celo_games_portal_stats');
      if (localStats) {
        await claimProfile(JSON.parse(localStats));
        // Clear localStorage after successful migration
        localStorage.removeItem('celo_games_portal_stats');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Signup error:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'twitter' | 'discord') => {
    setError('');
    setLoading(true);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'twitter') {
        await signInWithTwitter();
      } else if (provider === 'discord') {
        await signInWithDiscord();
      }
      // Note: Social login redirects, so we don't need to handle success here
    } catch (err) {
      console.error('Social login error:', err);
      setError('Échec de la connexion sociale');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-gray-700 max-w-md w-full"
              style={{ boxShadow: '0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Créer un compte
                </h2>
                <p className="text-gray-600 text-sm">
                  Sauvegardez vos progrès et jouez sur tous vos appareils
                </p>
              </div>

              {/* Stats Display */}
              {currentStats && currentStats.gamesPlayed > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4 mb-6"
                >
                  <p className="text-yellow-900 font-semibold text-center mb-2">
                    🎮 Vos stats actuelles
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-celo">
                        {currentStats.totalPoints}
                      </div>
                      <div className="text-xs text-yellow-700">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-celo">
                        {currentStats.gamesPlayed}
                      </div>
                      <div className="text-xs text-yellow-700">Parties</div>
                    </div>
                  </div>
                  <p className="text-yellow-800 text-xs text-center mt-2">
                    Ces stats seront préservées !
                  </p>
                </motion.div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-100 border-2 border-green-400 rounded-xl p-4 mb-4 text-center"
                >
                  <p className="text-green-800 font-semibold">
                    ✅ Compte créé avec succès !
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Vérifiez votre email pour confirmer
                  </p>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-100 border-2 border-red-400 rounded-xl p-3 mb-4"
                >
                  <p className="text-red-800 text-sm">⚠️ {error}</p>
                </motion.div>
              )}

              {/* Social Login Buttons */}
              <div className="space-y-3 mb-4">
                <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 rounded-xl px-4 py-3 font-semibold text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuer avec Google
                </button>

                <button
                  onClick={() => handleSocialLogin('twitter')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] border-2 border-[#1DA1F2] rounded-xl px-4 py-3 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  Continuer avec Twitter
                </button>

                <button
                  onClick={() => handleSocialLogin('discord')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] border-2 border-[#5865F2] rounded-xl px-4 py-3 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Continuer avec Discord
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou avec email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    disabled={loading}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-celo focus:ring-2 focus:ring-yellow-200 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-celo focus:ring-2 focus:ring-yellow-200 outline-none transition-all disabled:opacity-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-celo focus:ring-2 focus:ring-yellow-200 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Création en cours...' : 'Créer mon compte'}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center space-y-2">
                <button
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Continuer en tant qu&apos;invité
                </button>
                <p className="text-xs text-gray-500">
                  En créant un compte, vous acceptez nos conditions d&apos;utilisation
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
