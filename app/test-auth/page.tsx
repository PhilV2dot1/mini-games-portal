'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useState } from 'react';

export default function TestAuthPage() {
  const {
    user,
    isAuthenticated,
    isAnonymous,
    loading,
    signUp,
    signIn,
    signOut,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async () => {
    const result = await signUp(email, password);
    setMessage(result.success ? '✅ Signup successful!' : `❌ ${result.error}`);
  };

  const handleSignIn = async () => {
    const result = await signIn(email, password);
    setMessage(result.success ? '✅ Login successful!' : `❌ ${result.error}`);
  };

  const handleSignOut = async () => {
    await signOut();
    setMessage('✅ Signed out!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading auth...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          🧪 Test d'Authentification
        </h1>

        {/* Auth Status */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">État actuel:</h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold">Authentifié:</span>{' '}
              {isAuthenticated ? '✅ Oui' : '❌ Non'}
            </p>
            <p>
              <span className="font-semibold">Anonyme:</span>{' '}
              {isAnonymous ? '✅ Oui' : '❌ Non'}
            </p>
            <p>
              <span className="font-semibold">User ID:</span>{' '}
              {user?.id || 'N/A'}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{' '}
              {user?.email || 'N/A'}
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 mb-4">
            <p className="text-sm text-yellow-900">{message}</p>
          </div>
        )}

        {/* Auth Form */}
        {!isAuthenticated && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none"
                placeholder="test@example.com"
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
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-yellow-400 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSignUp}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl transition-all"
              >
                Créer un compte
              </button>
              <button
                onClick={handleSignIn}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-xl transition-all"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}

        {/* Sign Out */}
        {isAuthenticated && (
          <div>
            <button
              onClick={handleSignOut}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Se déconnecter
            </button>
          </div>
        )}

        {/* Link to Home */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
