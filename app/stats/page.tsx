'use client';

/**
 * Statistics Page - Advanced stats & charts for the current user
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/components/auth/AuthProvider';
import { PointsProgressChart } from '@/components/profile/PointsProgressChart';
import { WinRateChart } from '@/components/profile/WinRateChart';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';

const PERIOD_OPTIONS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 365 },
];

interface StatsSummary {
  total_games: number;
  total_wins: number;
  total_losses: number;
  overall_win_rate: number;
  total_points: number;
  days_active: number;
  favorite_game_name: string | null;
  favorite_game_icon: string | null;
  best_streak: number;
  badges_earned: number;
}

interface StreakData {
  game_id: string;
  game_name: string;
  game_icon: string;
  current_streak: number;
  best_streak: number;
}

interface StatsData {
  winRates: Array<{
    game_id: string;
    game_name: string;
    game_icon: string;
    total_games: number;
    wins: number;
    losses: number;
    win_rate: number;
  }>;
  pointsProgress: Array<{
    date: string;
    daily_points: number;
    cumulative_points: number;
  }>;
  activityTimeline: Array<{
    activity_type: string;
    activity_timestamp: string;
    game_name?: string;
    game_icon?: string;
    result?: string;
    points_earned: number;
    badge_name?: string;
    badge_icon?: string;
  }>;
  streaks: StreakData[];
  summary: StatsSummary | null;
}

export default function StatsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/user/stats?userId=${user.id}&days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch statistics');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.id, days]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const summary = stats?.summary;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              {t('stats.title') || 'Statistics'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t('stats.subtitle') || 'Visualize your performance and progress'}
            </p>
          </div>
          <Link
            href="/profile/me"
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            ← {t('nav.profile') || 'Profile'}
          </Link>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setDays(opt.days)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                days === opt.days
                  ? 'text-gray-900 dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              style={days === opt.days ? { backgroundColor: 'var(--chain-primary)' } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border-2 border-gray-200 dark:border-gray-700">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-yellow-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">{t('stats.loading') || 'Loading statistics...'}</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('stats.totalGames') || 'Games', value: summary.total_games, icon: '🎮' },
                  { label: t('stats.winRate') || 'Win Rate', value: `${summary.overall_win_rate ?? 0}%`, icon: '🏆' },
                  { label: t('stats.totalPoints') || 'Points', value: summary.total_points, icon: '⭐' },
                  { label: t('stats.bestStreak') || 'Best Streak', value: summary.best_streak, icon: '🔥' },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 text-center"
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Favorite game + days active */}
            {summary && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 flex items-center gap-4">
                  <div className="text-3xl">{summary.favorite_game_icon || '🎯'}</div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('stats.favoriteGame') || 'Favorite Game'}</div>
                    <div className="font-bold text-gray-900 dark:text-white">{summary.favorite_game_name || '—'}</div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 flex items-center gap-4">
                  <div className="text-3xl">📅</div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('stats.daysActive') || 'Days Active'}</div>
                    <div className="font-bold text-gray-900 dark:text-white">{summary.days_active}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Streaks by game */}
            {stats.streaks && stats.streaks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🔥 {t('stats.streaks') || 'Win Streaks'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.streaks.map((s) => (
                    <div
                      key={s.game_id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{s.game_icon}</span>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{s.game_name}</span>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t('stats.current') || 'Current'}</div>
                          <div className="font-bold text-orange-500">{s.current_streak}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t('stats.best') || 'Best'}</div>
                          <div className="font-bold text-yellow-500">{s.best_streak}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Points progress chart */}
            {stats.pointsProgress && stats.pointsProgress.length > 0 && (
              <PointsProgressChart data={stats.pointsProgress} />
            )}

            {/* Win rate chart */}
            {stats.winRates && stats.winRates.length > 0 && (
              <WinRateChart data={stats.winRates} />
            )}

            {/* Recent activity */}
            {stats.activityTimeline && stats.activityTimeline.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('stats.recentActivity') || 'Recent Activity'}
                </h3>
                <div className="space-y-2">
                  {stats.activityTimeline.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xl">
                          {activity.activity_type === 'game'
                            ? (activity.game_icon || '🎮')
                            : (activity.badge_icon || '🏆')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {activity.activity_type === 'game' ? activity.game_name : activity.badge_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.activity_timestamp).toLocaleDateString('fr-FR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm" style={{ color: 'var(--chain-primary)' }}>
                          +{activity.points_earned} pts
                        </div>
                        {activity.result && (
                          <div className={`text-xs font-semibold ${
                            activity.result === 'win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {activity.result === 'win' ? (t('stats.win') || 'Win') : (t('stats.loss') || 'Loss')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No data state */}
            {!summary && stats.winRates.length === 0 && stats.pointsProgress.length === 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border-2 border-gray-200 dark:border-gray-700">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('stats.noData') || 'No statistics yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('stats.noDataMessage') || 'Play games to see your statistics and progress charts!'}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
