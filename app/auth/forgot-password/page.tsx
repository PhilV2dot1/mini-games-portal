'use client';

/**
 * Forgot Password Page
 * Allows users to request a password reset email via Supabase Auth
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Get the redirect URL for password reset
      const redirectUrl = `${window.location.origin}/auth/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de l\'envoi de l\'email'
      );
    } finally {
      setLoading(false);
    }
  };

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
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mot de passe oublié
            </h1>
            <p className="text-gray-600 text-sm">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe
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
                    Email envoyé!
                  </h3>
                  <p className="text-sm text-green-800">
                    Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.
                    Vérifiez votre boîte de réception (et vos spams).
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-yellow-400 transition-all"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-400 text-gray-900 font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Vous vous souvenez de votre mot de passe?{' '}
              <Link href="/" className="text-yellow-600 hover:text-yellow-700 font-semibold">
                Se connecter
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Pas encore de compte?{' '}
              <Link href="/" className="text-yellow-600 hover:text-yellow-700 font-semibold">
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1 text-sm">
                Conseils de sécurité
              </h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Le lien de réinitialisation expire après 1 heure</li>
                <li>• Vérifiez que l&apos;email provient bien de Celo Games Portal</li>
                <li>• Ne partagez jamais votre lien de réinitialisation</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
