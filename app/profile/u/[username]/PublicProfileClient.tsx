'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned_at?: string;
}

interface GameSession {
  id: string;
  game_id: string;
  mode: string;
  result: string;
  points_earned: number;
  played_at: string;
  games?: { name: string; icon: string };
}

interface PublicProfile {
  user: {
    id: string;
    fid: number | null;
    username: string;
    display_name?: string;
    wallet_address: string | null;
    total_points?: number;
    created_at: string;
    avatar_type: string;
    avatar_url: string;
    bio: string;
    social_links: Record<string, string>;
  };
  stats?: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  recentSessions?: GameSession[];
  gameStats?: Record<string, { played: number; wins: number; points: number }>;
  badges?: Badge[];
  rank: number | null;
}

interface Props {
  username: string;
  initialData: PublicProfile | null;
}

export default function PublicProfileClient({ username, initialData }: Props) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<PublicProfile | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialData) return;
    setLoading(true);
    fetch(`/api/user/profile?username=${encodeURIComponent(username)}`)
      .then(res => {
        if (res.status === 404) throw new Error('not_found');
        if (!res.ok) throw new Error('fetch_error');
        return res.json();
      })
      .then(data => { setProfile(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [username, initialData]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-gray-300 dark:border-gray-700">
          <div className="text-gray-900 dark:text-white text-xl font-semibold">{t('loading') || 'Chargement...'}</div>
        </div>
      </div>
    );
  }

  if (error === 'not_found' || !profile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <Header />
          <div className="mt-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-8 text-center shadow-lg border-2 border-gray-300 dark:border-gray-700">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              {t('profile.notFound') || 'Profil introuvable'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('profile.notFoundDesc') || `Le joueur "${username}" n'existe pas ou a un profil privé.`}
            </p>
            <Link href="/" className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-all">
              ← {t('nav.home') || 'Accueil'}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { user, stats, badges = [], gameStats = {}, recentSessions = [], rank } = profile;
  const displayName = user.display_name || user.username;
  const avatarUrl = user.avatar_url || '/avatars/predefined/default-player.svg';
  const memberSince = new Date(user.created_at).getFullYear();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />

        {/* Back */}
        <Link
          href="/"
          className="inline-block mb-6 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold transition-colors"
        >
          ← {t('nav.home') || 'Accueil'}
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg border-2 border-chain"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-chain shadow-lg flex-shrink-0">
                <Image src={avatarUrl} alt={`${displayName} avatar`} fill className="object-cover" />
              </div>

              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">{displayName}</h1>
                {user.username !== displayName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                )}
                {user.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xs">{user.bio}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {rank && (
                    <span className="text-xs font-bold bg-chain/10 border border-chain/30 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full">
                      #{rank} {t('profile.globalRank') || 'Classement Global'}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('profile.memberSince') || 'Membre depuis'} {memberSince}
                  </span>
                  {/* Social Links */}
                  {user.social_links?.twitter && (
                    <a
                      href={`https://twitter.com/${user.social_links.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      𝕏 @{user.social_links.twitter}
                    </a>
                  )}
                  {user.social_links?.farcaster && (
                    <a
                      href={`https://warpcast.com/${user.social_links.farcaster}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-500 hover:underline"
                    >
                      ⌀ {user.social_links.farcaster}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 transition-all text-sm flex-shrink-0"
              data-testid="share-profile-button"
            >
              {copied ? '✅' : '🔗'} {copied ? (t('profile.copied') || 'Copié !') : (t('profile.shareProfile') || 'Partager')}
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg border-2 border-gray-300 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📊 {t('home.stats') || 'Statistiques'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {user.total_points !== undefined && (
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 text-center border-2 border-gray-300 dark:border-gray-500">
                  <div className="text-3xl font-black text-gray-900 dark:text-white">{user.total_points}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{t('home.points') || 'Points'}</div>
                </div>
              )}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 text-center border-2 border-gray-300 dark:border-gray-500">
                <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.gamesPlayed}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{t('home.gamesPlayed') || 'Parties'}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 text-center border-2 border-green-300 dark:border-green-700">
                <div className="text-3xl font-black text-green-600 dark:text-green-400">{stats.wins}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{t('stats.wins') || 'Victoires'}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 text-center border-2 border-blue-300 dark:border-blue-700">
                <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.winRate}%</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{t('stats.winRate') || 'Taux Victoire'}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg border-2 border-gray-300 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🏅 {t('badges.title') || 'Badges'} ({badges.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-gradient-to-br from-chain/5 to-chain/10 border-2 border-chain/30 rounded-lg p-3 text-center hover:scale-105 transition-transform"
                >
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <div className="font-black text-gray-900 dark:text-white text-xs mb-1">{badge.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">+{badge.points} pts</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Per-Game Stats */}
        {Object.keys(gameStats).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg border-2 border-gray-300 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🎮 {t('stats.perGame') || 'Statistiques par Jeu'}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(gameStats).map(([gameId, gs]) => {
                const winRate = gs.played > 0 ? Math.round((gs.wins / gs.played) * 100) : 0;
                return (
                  <div key={gameId} className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border-2 border-gray-300 dark:border-gray-500">
                    <div className="font-black text-gray-900 dark:text-white mb-3 capitalize text-base">{gameId}</div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{t('stats.played') || 'Jouées'}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{gs.played}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{t('stats.wins') || 'Victoires'}:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{gs.wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{t('stats.winRate') || 'Taux'}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{winRate}%</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-gray-300 dark:border-gray-500">
                        <span className="text-gray-500 dark:text-gray-400">{t('home.points') || 'Points'}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{gs.points}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recent Games */}
        {recentSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-gray-300 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🕹️ {t('profile.recentGames') || 'Parties Récentes'}
            </h2>
            <div className="space-y-2">
              {recentSessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{session.games?.icon || '🎮'}</span>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm capitalize">
                        {session.games?.name || session.game_id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{session.mode}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`font-bold ${session.result === 'win' ? 'text-green-600 dark:text-green-400' : session.result === 'draw' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {session.result === 'win' ? '✅' : session.result === 'draw' ? '🤝' : '❌'} {session.result.toUpperCase()}
                    </span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">+{session.points_earned} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!stats && badges.length === 0 && Object.keys(gameStats).length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-8 text-center shadow-lg border-2 border-gray-300 dark:border-gray-700"
          >
            <div className="text-5xl mb-3">🎮</div>
            <p className="text-gray-500 dark:text-gray-400">
              {t('profile.noPublicData') || 'Ce joueur n\'a pas encore de statistiques publiques.'}
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
