'use client';

/**
 * Profile Edit Page - Edit user profile
 *
 * Allows authenticated users to edit their profile:
 * - Username
 * - Avatar (predefined or custom upload)
 * - Bio
 * - Social links (Twitter, Farcaster, Discord)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccount } from 'wagmi';
import { AvatarSelector } from '@/components/profile/AvatarSelector';
import { AvatarUploadDialog } from '@/components/profile/AvatarUploadDialog';
import { BannerSelector } from '@/components/profile/BannerSelector';
import { BannerUploadDialog } from '@/components/profile/BannerUploadDialog';
import ThemeSelector from '@/components/profile/ThemeSelector';
import { ProfileCompleteness } from '@/components/profile/ProfileCompleteness';
import { PrivacySettings, ProfileVisibility } from '@/components/profile/PrivacySettings';
import {
  validateUsername,
  validateSocialLinks,
  validateBio,
  validateDisplayName,
  DISPLAY_NAME_MAX_LENGTH,
} from '@/lib/validations/profile';
import { ThemeColor } from '@/lib/constants/themes';
import Image from 'next/image';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { address: walletAddress, isConnected: walletConnected } = useAccount();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [themeColor, setThemeColor] = useState<ThemeColor>('yellow');
  const [avatarType, setAvatarType] = useState<'default' | 'predefined' | 'custom'>('default');
  const [avatarUrl, setAvatarUrl] = useState('/avatars/predefined/default-player.svg');
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    farcaster: '',
    discord: '',
  });

  // Avatar unlock status
  const [canUploadCustom, setCanUploadCustom] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  // Banner state
  const [bannerType, setBannerType] = useState<'default' | 'predefined' | 'custom'>('default');
  const [bannerUrl, setBannerUrl] = useState('/banners/predefined/gradient-yellow.jpg');
  const [showBannerUpload, setShowBannerUpload] = useState(false);

  // Profile stats for completeness tracking
  const [profileStats, setProfileStats] = useState<{ gamesPlayed: number }>({ gamesPlayed: 0 });
  const [totalPoints, setTotalPoints] = useState(0);

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  const [showStats, setShowStats] = useState(true);
  const [showBadges, setShowBadges] = useState(true);
  const [showGameHistory, setShowGameHistory] = useState(true);

  // Validation errors
  const [displayNameError, setDisplayNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [socialErrors, setSocialErrors] = useState({
    twitter: '',
    farcaster: '',
    discord: '',
  });

  // Load user profile function (memoized to avoid re-creation)
  const loadProfile = useCallback(async () => {
    const hasUserId = user?.id;
    const hasWallet = walletConnected && walletAddress;

    if (!hasUserId && !hasWallet) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      // Build query based on what we have
      let url = '/api/user/profile?';
      if (hasUserId) {
        url += `id=${user.id}`;
      } else if (hasWallet) {
        url += `wallet=${walletAddress.toLowerCase()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();

      setDisplayName(data.user?.display_name || data.user?.username || '');
      setUsername(data.user?.username || '');
      setBio(data.user?.bio || '');
      setThemeColor(data.user?.theme_color || 'yellow');
      setAvatarType(data.user?.avatar_type || 'default');
      setAvatarUrl(data.user?.avatar_url || '/avatars/predefined/default-player.svg');
      setBannerType(data.user?.banner_type || 'default');
      setBannerUrl(data.user?.banner_url || '/banners/predefined/gradient-yellow.jpg');
      setSocialLinks(data.user?.social_links || { twitter: '', farcaster: '', discord: '' });
      setCanUploadCustom(data.user?.avatar_unlocked || false);
      setTotalPoints(data.user?.total_points || 0);
      setProfileStats({ gamesPlayed: data.stats?.gamesPlayed || 0 });
      setProfileVisibility(data.user?.profile_visibility || 'public');
      setShowStats(data.user?.show_stats !== false); // Default true
      setShowBadges(data.user?.show_badges !== false); // Default true
      setShowGameHistory(data.user?.show_game_history !== false); // Default true

      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Impossible de charger le profil');
      setLoading(false);
    }
  }, [user?.id, walletConnected, walletAddress]);

  // Load user profile on mount
  useEffect(() => {
    if (authLoading) return;

    // Allow access if either authenticated OR wallet connected
    if (!isAuthenticated && !walletConnected) {
      router.push('/');
      return;
    }

    loadProfile();
  }, [isAuthenticated, walletConnected, authLoading, router, loadProfile]);

  // Check unlock status
  useEffect(() => {
    if (isAuthenticated && user) {
      checkAvatarUnlock();
    }
  }, [isAuthenticated, user]);

  const checkAvatarUnlock = async () => {
    try {
      const response = await fetch('/api/avatars/check-unlock');
      if (response.ok) {
        const data = await response.json();
        setCanUploadCustom(data.unlocked);
      }
    } catch (err) {
      console.error('Error checking avatar unlock:', err);
    }
  };

  // Handle display name change with validation
  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    setHasUnsavedChanges(true);

    const result = validateDisplayName(value);
    setDisplayNameError(result.valid ? '' : result.error || '');
  };

  // Handle username change with validation
  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setHasUnsavedChanges(true);

    if (!value) {
      setUsernameError('Nom d\'utilisateur requis');
      return;
    }

    const result = await validateUsername(value, user?.id);
    setUsernameError(result.valid ? '' : result.error || '');
  };

  // Handle bio change
  const handleBioChange = (value: string) => {
    setBio(value);
    setHasUnsavedChanges(true);

    const result = validateBio(value);
    setBioError(result.valid ? '' : result.error || '');
  };

  // Handle social link change
  const handleSocialLinkChange = (
    platform: 'twitter' | 'farcaster' | 'discord',
    value: string
  ) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
    setHasUnsavedChanges(true);

    if (!value) {
      setSocialErrors((prev) => ({ ...prev, [platform]: '' }));
      return;
    }

    const result = validateSocialLinks({ [platform]: value });
    setSocialErrors((prev) => ({
      ...prev,
      [platform]: result.valid ? '' : (result.errors?.[platform] || ''),
    }));
  };

  // Handle avatar selection
  const handleAvatarSelect = (url: string, type: 'default' | 'predefined') => {
    setAvatarUrl(url);
    setAvatarType(type);
    setHasUnsavedChanges(true);
  };

  // Handle theme color change
  const handleThemeChange = (theme: ThemeColor) => {
    setThemeColor(theme);
    setHasUnsavedChanges(true);
  };

  // Handle banner selection
  const handleBannerSelect = (url: string, type: 'predefined') => {
    setBannerUrl(url);
    setBannerType(type);
    setHasUnsavedChanges(true);
  };

  // Handle privacy settings changes
  const handleVisibilityChange = (visibility: ProfileVisibility) => {
    setProfileVisibility(visibility);
    setHasUnsavedChanges(true);
  };

  const handleShowStatsChange = (show: boolean) => {
    setShowStats(show);
    setHasUnsavedChanges(true);
  };

  const handleShowBadgesChange = (show: boolean) => {
    setShowBadges(show);
    setHasUnsavedChanges(true);
  };

  const handleShowGameHistoryChange = (show: boolean) => {
    setShowGameHistory(show);
    setHasUnsavedChanges(true);
  };

  // Save profile
  const handleSave = async () => {
    // Validate all fields
    if (displayNameError || usernameError || bioError || Object.values(socialErrors).some((e) => e)) {
      setError('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Build request body with either userId or wallet address
      const requestBody: Record<string, unknown> = {
        display_name: displayName,
        username,
        bio,
        theme_color: themeColor,
        avatar_type: avatarType,
        avatar_url: avatarUrl,
        banner_type: bannerType,
        banner_url: bannerUrl,
        social_links: socialLinks,
        profile_visibility: profileVisibility,
        show_stats: showStats,
        show_badges: showBadges,
        show_game_history: showGameHistory,
      };

      if (user?.id) {
        requestBody.userId = user.id;
      } else if (walletConnected && walletAddress) {
        requestBody.walletAddress = walletAddress.toLowerCase();
      }

      console.log('[Profile Edit] Saving profile with data:', {
        display_name: displayName,
        username: username,
        hasUserId: !!user?.id,
        hasWallet: !!walletAddress,
      });

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('[Profile Edit] Save failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data,
        });
        throw new Error(data.error || 'Échec de la sauvegarde');
      }

      const data = await response.json();
      console.log('[Profile Edit] Save successful:', data);

      setSuccess(true);
      setHasUnsavedChanges(false);

      setTimeout(() => {
        router.push('/profile/me');
      }, 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('[Profile Edit] Error saving profile:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400">
        <div className="text-center bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-gray-300">
          <div className="text-gray-900 text-xl font-semibold mb-2">Chargement...</div>
          <div className="text-sm text-gray-600">Chargement du profil</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-700 hover:text-gray-900 font-semibold flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-gray-300 hover:border-celo transition-all"
            >
              ← Retour
            </button>
            <button
              onClick={() => router.push('/profile/settings')}
              className="text-gray-700 hover:text-gray-900 font-semibold flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-gray-300 hover:border-celo transition-all"
            >
              ⚙️ Paramètres
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Éditer mon profil</h1>
          <p className="text-gray-700">Personnalisez votre profil Celo Games Portal</p>
        </div>

        {/* Main form */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-gray-300 p-6 md:p-8 space-y-6">
          {/* Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-100 border-2 border-green-400 rounded-xl p-4"
            >
              <p className="text-green-800 font-semibold">
                ✅ Profil sauvegardé avec succès ! Redirection...
              </p>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-100 border-2 border-red-400 rounded-xl p-3"
            >
              <p className="text-red-800 text-sm">⚠️ {error}</p>
            </motion.div>
          )}

          {/* Profile Completeness (compact version) */}
          <ProfileCompleteness
            profile={{
              display_name: displayName,
              username: username,
              bio: bio,
              avatar_type: avatarType,
              social_links: socialLinks,
              total_points: totalPoints,
              stats: profileStats,
            }}
            compact={true}
          />

          {/* Avatar section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-celo shadow-lg">
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Avatar</h2>
                <p className="text-sm text-gray-600">Choisissez votre avatar de profil</p>
              </div>
            </div>

            <AvatarSelector
              currentAvatar={avatarUrl}
              onSelect={handleAvatarSelect}
              canUploadCustom={canUploadCustom}
              onUploadCustomClick={() => setShowAvatarUpload(true)}
            />
          </div>

          <hr className="border-gray-300" />

          {/* Banner Selector */}
          <BannerSelector
            currentBanner={bannerUrl}
            onSelect={handleBannerSelect}
            canUploadCustom={canUploadCustom}
            onUploadCustomClick={() => setShowBannerUpload(true)}
          />

          <hr className="border-gray-300" />

          {/* Theme Color Selector */}
          <ThemeSelector
            selectedTheme={themeColor}
            onThemeChange={handleThemeChange}
          />

          <hr className="border-gray-300" />

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom affiché <span className="text-green-600 text-xs">(✓ Espaces et émojis OK)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="Mon Super Pseudo 🎮"
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none transition-all ${
                displayNameError
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-celo'
              }`}
            />
            {displayNameError && <p className="text-red-600 text-xs mt-1">{displayNameError}</p>}
            <p className="text-gray-500 text-xs mt-1">
              ✨ Ce nom s&apos;affiche partout (max {DISPLAY_NAME_MAX_LENGTH} caractères, espaces et émojis autorisés)
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d&apos;utilisateur <span className="text-orange-600 text-xs">(✗ Pas d&apos;espaces)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="PlayerOne"
              className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none transition-all ${
                usernameError
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-celo'
              }`}
            />
            {usernameError && <p className="text-red-600 text-xs mt-1">{usernameError}</p>}
            <p className="text-gray-500 text-xs mt-1">
              🔗 Identifiant unique: 3-20 caractères (lettres, chiffres, underscore _ seulement)
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio <span className="text-gray-500 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => handleBioChange(e.target.value)}
              placeholder="Passionné de jeux blockchain..."
              rows={3}
              maxLength={200}
              className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none transition-all resize-none ${
                bioError
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-celo'
              }`}
            />
            {bioError && <p className="text-red-600 text-xs mt-1">{bioError}</p>}
            <p className="text-gray-500 text-xs mt-1">{bio.length}/200 caractères</p>
          </div>

          <hr className="border-gray-300" />

          {/* Social links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Liens sociaux</h3>

            {/* Twitter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter / X <span className="text-gray-500 font-normal">(optionnel)</span>
              </label>
              <input
                type="url"
                value={socialLinks.twitter}
                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                placeholder="https://twitter.com/username"
                className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none transition-all ${
                  socialErrors.twitter
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-celo'
                }`}
              />
              {socialErrors.twitter && (
                <p className="text-red-600 text-xs mt-1">{socialErrors.twitter}</p>
              )}
            </div>

            {/* Farcaster */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Farcaster <span className="text-gray-500 font-normal">(optionnel)</span>
              </label>
              <input
                type="url"
                value={socialLinks.farcaster}
                onChange={(e) => handleSocialLinkChange('farcaster', e.target.value)}
                placeholder="https://warpcast.com/username"
                className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none transition-all ${
                  socialErrors.farcaster
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-celo'
                }`}
              />
              {socialErrors.farcaster && (
                <p className="text-red-600 text-xs mt-1">{socialErrors.farcaster}</p>
              )}
            </div>

            {/* Discord */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discord <span className="text-gray-500 font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={socialLinks.discord}
                onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                placeholder="username#1234"
                className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none transition-all ${
                  socialErrors.discord
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-celo'
                }`}
              />
              {socialErrors.discord && (
                <p className="text-red-600 text-xs mt-1">{socialErrors.discord}</p>
              )}
            </div>
          </div>

          <hr className="border-gray-300" />

          {/* Privacy Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidentialité</h3>
            <PrivacySettings
              profileVisibility={profileVisibility}
              showStats={showStats}
              showBadges={showBadges}
              showGameHistory={showGameHistory}
              onVisibilityChange={handleVisibilityChange}
              onShowStatsChange={handleShowStatsChange}
              onShowBadgesChange={handleShowBadgesChange}
              onShowGameHistoryChange={handleShowGameHistoryChange}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={
                saving ||
                !hasUnsavedChanges ||
                !!displayNameError ||
                !!usernameError ||
                !!bioError ||
                Object.values(socialErrors).some((e) => e)
              }
              className="flex-1 bg-gradient-to-r from-celo to-celo hover:brightness-110 disabled:from-gray-300 disabled:to-gray-400 text-gray-900 font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-xl transition-all"
            >
              Annuler
            </button>
          </div>

          {/* Unsaved changes warning */}
          {hasUnsavedChanges && (
            <p className="text-center text-sm text-orange-600">
              ⚠️ Vous avez des modifications non sauvegardées
            </p>
          )}
        </div>
      </div>

      {/* Avatar Upload Dialog */}
      <AvatarUploadDialog
        isOpen={showAvatarUpload}
        onClose={() => setShowAvatarUpload(false)}
        userId={user?.id || ''}
        onSuccess={(url) => {
          setAvatarUrl(url);
          setAvatarType('custom');
          setHasUnsavedChanges(true);
        }}
      />

      {/* Banner Upload Dialog */}
      <BannerUploadDialog
        isOpen={showBannerUpload}
        onClose={() => setShowBannerUpload(false)}
        userId={user?.id || ''}
        onSuccess={(url) => {
          setBannerUrl(url);
          setBannerType('custom');
          setHasUnsavedChanges(true);
        }}
      />
    </div>
  );
}
