'use client';

/**
 * SecuritySettings - Component for account security settings
 *
 * Allows users to change their password with validation
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

export function SecuritySettings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins une majuscule';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins une minuscule';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins un chiffre';
    }
    return null;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setLoading(true);

    try {
      // Update password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      console.error('Password change error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  };

  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-gray-300 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🔐</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sécurité du compte</h2>
          <p className="text-sm text-gray-600">Gérez votre mot de passe et la sécurité de votre compte</p>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 border-2 border-green-400 rounded-xl p-4 mb-6"
        >
          <p className="text-green-800 font-semibold text-sm">
            ✅ Mot de passe changé avec succès !
          </p>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-100 border-2 border-red-400 rounded-xl p-4 mb-6"
        >
          <p className="text-red-800 text-sm">⚠️ {error}</p>
        </motion.div>
      )}

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="space-y-6">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe actuel
          </label>
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-celo focus:outline-none transition-all"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Nouveau mot de passe
          </label>
          <input
            type={showPasswords ? 'text' : 'password'}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-celo focus:outline-none transition-all"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 8 caractères avec majuscule, minuscule et chiffre
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmer le nouveau mot de passe
          </label>
          <input
            type={showPasswords ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-celo focus:outline-none transition-all"
            disabled={loading}
          />
        </div>

        {/* Show/Hide password toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showPasswords"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
          />
          <label htmlFor="showPasswords" className="text-sm text-gray-700">
            Afficher les mots de passe
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="flex-1 bg-gradient-to-r from-celo to-celo hover:brightness-110 disabled:from-gray-300 disabled:to-gray-400 text-gray-900 font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        </div>
      </form>

      {/* Security tips */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                Conseils de sécurité
              </h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Utilisez un mot de passe unique pour chaque compte</li>
                <li>• Combinez lettres majuscules, minuscules, chiffres et symboles</li>
                <li>• Évitez les informations personnelles facilement devinables</li>
                <li>• Changez régulièrement votre mot de passe</li>
                <li>• Ne partagez jamais votre mot de passe</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
