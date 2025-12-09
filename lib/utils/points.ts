import type { GameMode } from '@/lib/types';

const POINTS_CONFIG = {
  free: { perGame: 10, perWin: 25, perLoss: 0 },
  onchain: { perGame: 25, perWin: 75, perLoss: 0 },
};

export function calculateGamePoints(
  mode: GameMode,
  result: 'win' | 'lose' | 'draw' | 'push',
  streakBonus: number = 0
): number {
  const config = POINTS_CONFIG[mode];
  let basePoints = config.perGame;

  if (result === 'win') {
    basePoints += config.perWin;
  }

  // Streak bonus: 10% more points for every 3-win streak
  const multiplicator = 1 + (streakBonus * 0.1);
  return Math.floor(basePoints * multiplicator);
}

export function getStreakBonus(currentStreak: number): number {
  return Math.floor(currentStreak / 3);
}
