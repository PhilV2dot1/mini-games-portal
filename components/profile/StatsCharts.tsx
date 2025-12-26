'use client';

/**
 * StatsCharts - Container component for user statistics charts
 *
 * Fetches and displays points progress and win rate charts
 */

import React, { useEffect, useState } from 'react';
import { PointsProgressChart } from './PointsProgressChart';
import { WinRateChart } from './WinRateChart';

interface StatsChartsProps {
  userId: string;
  days?: number;
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
    timestamp: string;
    game_name?: string;
    result?: string;
    points_earned: number;
    badge_name?: string;
  }>;
}

export function StatsCharts({ userId, days = 30 }: StatsChartsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      if (!userId) return;

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/user/stats?userId=${userId}&days=${days}`);

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId, days]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-300">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-yellow-400"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
        <p className="text-red-800 font-semibold">⚠️ {error}</p>
        <p className="text-red-600 text-sm mt-1">
          Impossible de charger les statistiques
        </p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const hasData =
    (stats.winRates && stats.winRates.length > 0) ||
    (stats.pointsProgress && stats.pointsProgress.length > 0);

  if (!hasData) {
    return (
      <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-gray-200">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Pas encore de statistiques
        </h3>
        <p className="text-gray-600">
          Jouez à des jeux pour voir vos statistiques et graphiques de progression!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 border-2 border-gray-700 text-center"
        style={{ boxShadow: '0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      >
        <div className="text-4xl mb-2">📊</div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Statistiques
        </h2>
        <p className="text-sm text-gray-600">
          Visualisez vos performances et votre progression
        </p>
      </div>

      {/* Points Progress Chart */}
      {stats.pointsProgress && stats.pointsProgress.length > 0 && (
        <PointsProgressChart data={stats.pointsProgress} />
      )}

      {/* Win Rate Chart */}
      {stats.winRates && stats.winRates.length > 0 && (
        <WinRateChart data={stats.winRates} />
      )}

      {/* Activity Summary */}
      {stats.activityTimeline && stats.activityTimeline.length > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Activité Récente
          </h3>
          <div className="space-y-2">
            {stats.activityTimeline.slice(0, 5).map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {activity.activity_type === 'game' ? '🎮' : '🏆'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {activity.activity_type === 'game'
                        ? activity.game_name
                        : activity.badge_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString('fr-FR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">
                    +{activity.points_earned} pts
                  </div>
                  {activity.result && (
                    <div className={`text-xs font-semibold ${
                      activity.result === 'win' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.result === 'win' ? 'Victoire' : 'Défaite'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
