'use client';

/**
 * ProfileSetup - Quick profile setup component for new users
 *
 * Allows users to:
 * - Choose a predefined avatar
 * - Set their username
 * - Optionally link wallet or create account
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAccount } from 'wagmi';

interface ProfileSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const PREDEFINED_AVATARS = [
  'default-player', 'controller', 'joystick', 'trophy', 'crown', 'star',
  'rocket', 'gem', 'flame', 'lightning', 'heart', 'dice'
];

export function ProfileSetup({ isOpen, onClose, onComplete }: ProfileSetupProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const [step, setStep] = useState<'avatar' | 'username' | 'done'>('avatar');
  const [selectedAvatar, setSelectedAvatar] = useState('/avatars/predefined/default-player.svg');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(`/avatars/predefined/${avatar}.svg`);
    setStep('username');
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError(t('profileSetup.usernameRequired'));
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError(t('profileSetup.usernameLength'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      // If user is anonymous (not authenticated AND not wallet connected), save to localStorage
      if (!user && !walletConnected) {
        // Get existing localStorage stats
        const STORAGE_KEY = 'celo_games_portal_stats';
        const stored = localStorage.getItem(STORAGE_KEY);
        const profile = stored ? JSON.parse(stored) : {
          totalPoints: 0,
          gamesPlayed: 0,
          games: {},
        };

        // Add username, display_name and avatar to profile
        profile.username = username;
        profile.display_name = username; // Use username as initial display_name
        profile.avatar_type = 'predefined';
        profile.avatar_url = selectedAvatar;

        // Save back to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

        setStep('done');
        setTimeout(() => {
          onComplete?.();
          onClose();
        }, 2000);
        return;
      }

      // If user is authenticated OR wallet connected, save to database via API
      const requestBody: Record<string, unknown> = {
        username,
        display_name: username, // Use username as initial display_name
        avatar_type: 'predefined',
        avatar_url: selectedAvatar,
      };

      if (user?.id) {
        requestBody.userId = user.id;
      } else if (walletConnected && walletAddress) {
        requestBody.walletAddress = walletAddress.toLowerCase();
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('profileSetup.saveFailed'));
      }

      setStep('done');
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 2000);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message || t('errors.generic'));
    } finally {
      setSaving(false);
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
              className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{ boxShadow: '0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  🎮 {t('profileSetup.welcome')}
                </h2>
                <p className="text-gray-600">
                  {t('profileSetup.subtitle')}
                </p>
              </div>

              {/* Avatar Selection Step */}
              {step === 'avatar' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                    {t('profileSetup.chooseAvatar')}
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-6">
                    {PREDEFINED_AVATARS.map((avatar) => (
                      <motion.button
                        key={avatar}
                        onClick={() => handleAvatarSelect(avatar)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-300 hover:border-yellow-400 hover:ring-2 hover:ring-yellow-400 transition-all bg-gradient-to-br from-gray-100 to-gray-200"
                      >
                        <Image
                          src={`/avatars/predefined/${avatar}.svg`}
                          alt={avatar}
                          fill
                          className="object-cover p-1"
                          onError={(e) => {
                            // Fallback to emoji if image doesn't exist
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<span class="text-2xl">🎮</span>';
                            }
                          }}
                        />
                      </motion.button>
                    ))}
                  </div>
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl p-3 text-center">
                    <p className="text-sm text-gray-700">
                      💡 <span className="font-semibold text-gray-900">{t('profileSetup.tip')}:</span> {t('profileSetup.unlockCustom')}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Username Step */}
              {step === 'username' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Avatar Preview */}
                  <div className="flex justify-center">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg">
                      <Image
                        src={selectedAvatar}
                        alt="Avatar sélectionné"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                      {t('profileSetup.chooseUsername')}
                    </h3>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="PlayerOne"
                      maxLength={20}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-yellow-400 transition-all text-lg text-center"
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      {t('profileSetup.usernameRules')}
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-100 border-2 border-red-400 rounded-xl p-3">
                      <p className="text-red-800 text-sm text-center">⚠️ {error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('avatar')}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-xl transition-all"
                    >
                      ← {t('profileSetup.back')}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !username.trim()}
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-400 text-gray-900 font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg"
                    >
                      {saving ? t('profileSetup.saving') : t('profileSetup.startPlaying')}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Done Step */}
              {step === 'done' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('profileSetup.success')}
                  </h3>
                  <p className="text-gray-600">
                    {t('profileSetup.ready')}
                  </p>
                </motion.div>
              )}

              {/* Skip button */}
              {step !== 'done' && (
                <button
                  onClick={onClose}
                  className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  {t('profileSetup.skip')}
                </button>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
