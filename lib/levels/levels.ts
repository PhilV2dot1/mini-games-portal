/**
 * Player Level System — Phase Z6.1
 * 10 levels: Bronze I-III → Silver I-III → Gold I-II → Platinum → Diamond
 */

export interface PlayerLevel {
  level: number;
  name: string;       // i18n key suffix, e.g. 'bronze1'
  minXp: number;
  maxXp: number;      // -1 = no cap (Diamond)
  color: string;      // Tailwind text color
  bgColor: string;    // Tailwind bg color
  icon: string;       // emoji
}

export const LEVELS: PlayerLevel[] = [
  { level: 1, name: 'bronze1',   minXp: 0,    maxXp: 199,   color: 'text-amber-700',   bgColor: 'bg-amber-100',   icon: '🥉' },
  { level: 2, name: 'bronze2',   minXp: 200,  maxXp: 499,   color: 'text-amber-700',   bgColor: 'bg-amber-100',   icon: '🥉' },
  { level: 3, name: 'bronze3',   minXp: 500,  maxXp: 999,   color: 'text-amber-700',   bgColor: 'bg-amber-100',   icon: '🥉' },
  { level: 4, name: 'silver1',   minXp: 1000, maxXp: 1999,  color: 'text-slate-500',   bgColor: 'bg-slate-100',   icon: '🥈' },
  { level: 5, name: 'silver2',   minXp: 2000, maxXp: 3499,  color: 'text-slate-500',   bgColor: 'bg-slate-100',   icon: '🥈' },
  { level: 6, name: 'silver3',   minXp: 3500, maxXp: 5999,  color: 'text-slate-500',   bgColor: 'bg-slate-100',   icon: '🥈' },
  { level: 7, name: 'gold1',     minXp: 6000, maxXp: 9999,  color: 'text-yellow-600',  bgColor: 'bg-yellow-100',  icon: '🥇' },
  { level: 8, name: 'gold2',     minXp: 10000,maxXp: 14999, color: 'text-yellow-600',  bgColor: 'bg-yellow-100',  icon: '🥇' },
  { level: 9, name: 'platinum',  minXp: 15000,maxXp: 24999, color: 'text-cyan-600',    bgColor: 'bg-cyan-100',    icon: '💎' },
  { level: 10, name: 'diamond', minXp: 25000,maxXp: -1,    color: 'text-violet-600',  bgColor: 'bg-violet-100',  icon: '👑' },
];

export function getPlayerLevel(xp: number): PlayerLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

/** Returns progress within current level as 0–100 */
export function getLevelProgress(xp: number): number {
  const current = getPlayerLevel(xp);
  if (current.maxXp === -1) return 100;
  const range = current.maxXp - current.minXp + 1;
  const progress = xp - current.minXp;
  return Math.min(100, Math.round((progress / range) * 100));
}

/** XP awarded per action */
export const XP_REWARDS = {
  game_win: 10,
  daily_challenge: 25,
  login_streak: 5,
  onboarding: 50,
} as const;

export type XpReason = keyof typeof XP_REWARDS;
