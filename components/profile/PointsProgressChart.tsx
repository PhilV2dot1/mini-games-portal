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

interface PointsProgressData {
  date: string;
  daily_points: number;
  cumulative_points: number;
}

interface PointsProgressChartProps {
  data: PointsProgressData[];
}

export function PointsProgressChart({ data }: PointsProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <p className="text-gray-600">Pas encore de données de progression</p>
        <p className="text-sm text-gray-500 mt-1">Jouez à des jeux pour voir vos progrès!</p>
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
    <div className="bg-white rounded-xl p-6 border-2 border-gray-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Progression des Points</h3>
        <p className="text-sm text-gray-600">Points gagnés au fil du temps (30 derniers jours)</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '2px solid #FCFF52',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="daily_points"
            name="Points Quotidiens"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="cumulative_points"
            name="Total Cumulé"
            stroke="#FCFF52"
            strokeWidth={3}
            dot={{ fill: '#FCFF52', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
