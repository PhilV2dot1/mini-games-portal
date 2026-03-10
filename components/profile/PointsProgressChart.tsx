'use client';

/**
 * PointsProgressChart - Line chart showing points progress over time
 *
 * Displays daily and cumulative points earned
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PointsProgressData {
  date: string;
  daily_points: number;
  cumulative_points: number;
}

interface PointsProgressChartProps {
  data: PointsProgressData[];
}

export function PointsProgressChart({ data }: PointsProgressChartProps) {
  const { t } = useLanguage();

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <p className="text-gray-600">{t('stats.noProgressData') || 'No progress data yet'}</p>
        <p className="text-sm text-gray-500 mt-1">{t('stats.playToSeeProgress') || 'Play games to see your progress!'}</p>
      </div>
    );
  }

  // Format data for display
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric'
    }),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-300 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('stats.pointsProgress') || 'Points Progress'}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('stats.pointsProgressSubtitle') || 'Points earned over time (last 30 days)'}</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            stroke="#6b7280"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #1f2937)',
              border: '2px solid var(--chain-primary)',
              borderRadius: '8px',
              color: '#f9fafb',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="daily_points"
            name={t('stats.dailyPoints') || 'Daily Points'}
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="cumulative_points"
            name={t('stats.cumulativeTotal') || 'Cumulative Total'}
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
