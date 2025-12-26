'use client';

/**
 * WinRateChart - Bar chart showing win rates by game
 *
 * Displays win/loss statistics for each game played
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface WinRateData {
  game_id: string;
  game_name: string;
  game_icon: string;
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number;
}

interface WinRateChartProps {
  data: WinRateData[];
}

export function WinRateChart({ data }: WinRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <p className="text-gray-600">Pas encore de statistiques de jeu</p>
        <p className="text-sm text-gray-500 mt-1">Jouez à des jeux pour voir vos taux de victoire!</p>
      </div>
    );
  }

  // Format data for display
  const chartData = data.map((item) => ({
    name: item.game_name,
    wins: item.wins,
    losses: item.losses,
    winRate: parseFloat(item.win_rate.toString()),
    totalGames: item.total_games,
  }));

  // Colors
  const COLORS = {
    wins: '#10b981',
    losses: '#ef4444',
  };

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Taux de Victoire par Jeu</h3>
        <p className="text-sm text-gray-600">Performances dans chaque jeu</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
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
            formatter={(value: number, name: string) => {
              if (name === 'winRate') {
                return [`${value.toFixed(1)}%`, 'Taux de victoire'];
              }
              return [value, name === 'wins' ? 'Victoires' : 'Défaites'];
            }}
          />
          <Legend
            formatter={(value) => {
              if (value === 'wins') return 'Victoires';
              if (value === 'losses') return 'Défaites';
              return value;
            }}
          />
          <Bar dataKey="wins" fill={COLORS.wins} radius={[8, 8, 0, 0]} />
          <Bar dataKey="losses" fill={COLORS.losses} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Game stats summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {chartData.map((game, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200"
          >
            <div className="text-2xl font-bold text-gray-900">
              {game.winRate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">{game.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {game.totalGames} {game.totalGames === 1 ? 'partie' : 'parties'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
