'use client';

/**
 * Reset Password Page
 * Allows users to set a new password after clicking the reset link
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  // Check if we have a valid session from the email link
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Lien de réinitialisation invalide ou expiré. Veuillez faire une nouvelle demande.');
          setValidToken(false);
        } else {
          setValidToken(true);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setError('Erreur lors de la vérification du lien');
        setValidToken(false);
      } finally {
        setCheckingToken(false);
      }
    };

    checkSession();
  }, [searchParams]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la réinitialisation'
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 flex items-center justify-center p-4">
        <div className="text-center bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-gray-300">
          <div className="text-gray-900 text-xl font-semibold mb-2">Vérification...</div>
          <div className="text-sm text-gray-600">Vérification du lien de réinitialisation</div>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-gray-300 p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Lien invalide ou expiré
              </h1>
              <p className="text-gray-600 text-sm mb-6">
                {error || 'Ce lien de réinitialisation n\'est plus valide. Veuillez faire une nouvelle demande.'}
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold rounded-xl transition-all shadow-lg"
              >
                Demander un nouveau lien
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <Link
          href="/"
          className="inline-block mb-6 text-gray-700 hover:text-gray-900 font-semibold transition-colors"
        >
          ← Retour à l&apos;accueil
        </Link>

        {/* Main card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-gray-300 p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-600 text-sm">
              Choisissez un nouveau mot de passe sécurisé
            </p>
          </div>

          {/* Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-100 border-2 border-green-400 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">
                    Mot de passe modifié!
                  </h3>
                  <p className="text-sm text-green-800">
                    Votre mot de passe a été réinitialisé avec succès. Redirection...
                  </p>
                </div>
              </div>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-yellow-400 transition-all"
                disabled={loading || success}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 caractères avec majuscule, minuscule et chiffre
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-yellow-400 transition-all"
                disabled={loading || success}
              />
            </div>

            <button
              type="submit"
              disabled={loading || success || !password || !confirmPassword}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-400 text-gray-900 font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        </div>

        {/* Password strength tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1 text-sm">
                Conseils pour un mot de passe fort
              </h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Utilisez un mélange de lettres, chiffres et symboles</li>
                <li>• Évitez les mots du dictionnaire et informations personnelles</li>
                <li>• Utilisez un mot de passe unique pour chaque compte</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
