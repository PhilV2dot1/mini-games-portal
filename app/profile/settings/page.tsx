'use client';

/**
 * Profile Settings Page
 *
 * Hub for user account settings including security and privacy
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400">
        <div className="text-center bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-gray-300">
          <div className="text-gray-900 text-xl font-semibold mb-2">Chargement...</div>
          <div className="text-sm text-gray-600">Chargement des paramètres</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/profile/me"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 font-semibold transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-gray-300 hover:border-celo"
          >
            ← Retour au profil
          </Link>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Paramètres</h1>
          <p className="text-gray-700">Gérez votre compte et vos préférences</p>
        </div>

        {/* Settings sections */}
        <div className="space-y-6">
          {/* Security Settings */}
          <SecuritySettings />

          {/* Future sections can be added here */}
          {/* Example: Notifications, Privacy, Email Preferences, etc. */}
        </div>

        {/* Additional options */}
        <div className="mt-8 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Autres paramètres</h3>
          <div className="space-y-3">
            <Link
              href="/profile/edit"
              className="block p-4 border-2 border-gray-300 rounded-xl hover:border-celo hover:bg-celo/5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-900">
                      Modifier le profil
                    </h4>
                    <p className="text-sm text-gray-600">
                      Avatar, nom, bio, liens sociaux, thème
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-celo transition-colors">
                  →
                </span>
              </div>
            </Link>

            <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <h4 className="font-semibold text-gray-700">
                      Notifications
                    </h4>
                    <p className="text-sm text-gray-500">
                      Gérer les préférences de notification (Bientôt disponible)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h4 className="font-semibold text-gray-700">
                      Données et confidentialité
                    </h4>
                    <p className="text-sm text-gray-500">
                      Exporter vos données, supprimer le compte (Bientôt disponible)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Besoin d&apos;aide ?{' '}
            <a
              href="mailto:support@celo-games-portal.com"
              className="text-celo hover:brightness-110 font-semibold"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
