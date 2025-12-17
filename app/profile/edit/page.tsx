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

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { AvatarSelector } from '@/components/profile/AvatarSelector';
import { AvatarUploadDialog } from '@/components/profile/AvatarUploadDialog';
import {
  validateUsername,
  validateSocialLinks,
  validateBio,
} from '@/lib/validations/profile';
import Image from 'next/image';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
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

  // Validation errors
  const [usernameError, setUsernameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [socialErrors, setSocialErrors] = useState({
    twitter: '',
    farcaster: '',
    discord: '',
  });

  // Load user profile
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    loadProfile();
  }, [isAuthenticated, authLoading, router]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();

      setUsername(data.username || '');
      setBio(data.bio || '');
      setAvatarType(data.avatar_type || 'default');
      setAvatarUrl(data.avatar_url || '/avatars/predefined/default-player.svg');
      setSocialLinks(data.social_links || { twitter: '', farcaster: '', discord: '' });
      setCanUploadCustom(data.avatar_unlocked || false);

      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Impossible de charger le profil');
      setLoading(false);
    }
  };

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

  // Save profile
  const handleSave = async () => {
    // Validate all fields
    if (usernameError || bioError || Object.values(socialErrors).some((e) => e)) {
      setError('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          bio,
          avatar_type: avatarType,
          avatar_url: avatarUrl,
          social_links: socialLinks,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Échec de la sauvegarde');
      }

      setSuccess(true);
      setHasUnsavedChanges(false);

      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving profile:', err);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="text-yellow-400 text-xl font-semibold mb-2">Chargement...</div>
          <div className="text-sm text-gray-300">Chargement du profil</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-yellow-400 hover:text-yellow-300 font-semibold mb-4 flex items-center gap-2"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Éditer mon profil</h1>
          <p className="text-gray-400">Personnalisez votre profil Celo Games Portal</p>
        </div>

        {/* Main form */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-gray-700 p-6 md:p-8 space-y-6">
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

          {/* Avatar section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg">
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

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="PlayerOne"
              className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none transition-all ${
                usernameError
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-yellow-400'
              }`}
            />
            {usernameError && <p className="text-red-600 text-xs mt-1">{usernameError}</p>}
            <p className="text-gray-500 text-xs mt-1">
              3-20 caractères, lettres, chiffres et underscore uniquement
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
                  : 'border-gray-300 focus:border-yellow-400'
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
                    : 'border-gray-300 focus:border-yellow-400'
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
                    : 'border-gray-300 focus:border-yellow-400'
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
                    : 'border-gray-300 focus:border-yellow-400'
                }`}
              />
              {socialErrors.discord && (
                <p className="text-red-600 text-xs mt-1">{socialErrors.discord}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={
                saving ||
                !hasUnsavedChanges ||
                !!usernameError ||
                !!bioError ||
                Object.values(socialErrors).some((e) => e)
              }
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-400 text-gray-900 font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg"
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
    </div>
  );
}
