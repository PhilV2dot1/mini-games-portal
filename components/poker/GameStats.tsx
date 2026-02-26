"use client";

import { PokerStats } from "@/hooks/usePoker";

interface GameStatsProps {
  stats: PokerStats;
  mode: 'free' | 'onchain';
}

export function GameStats({ stats, mode }: GameStatsProps) {
  const winRate = stats.handsPlayed > 0
    ? Math.round((stats.handsWon / stats.handsPlayed) * 100)
    : 0;

  return (
    <div className="bg-white/5 dark:bg-gray-800/50 rounded-xl p-3">
      <div className="grid grid-cols-4 gap-2 text-center">
        <StatCell label="Played" value={stats.handsPlayed} />
        <StatCell label="Won" value={stats.handsWon} color="text-green-400" />
        <StatCell label="Win Rate" value={`${winRate}%`} color="text-yellow-400" />
        <StatCell label="🔥 Streak" value={stats.currentStreak} color="text-orange-400" />
      </div>
      {stats.bestStreak > 1 && (
        <div className="text-center mt-2 text-xs text-gray-400">
          Best streak: <span className="text-orange-400 font-bold">{stats.bestStreak}</span>
          {stats.biggestPot > 0 && (
            <> · Biggest pot: <span className="text-yellow-400 font-bold">{stats.biggestPot}</span></>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <div className={`font-bold text-base ${color}`}>{value}</div>
      <div className="text-gray-400 text-xs">{label}</div>
    </div>
  );
}
