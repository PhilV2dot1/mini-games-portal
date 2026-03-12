/**
 * Weekly Missions — Phase Z6.2
 * 5 missions renewed every Monday, +100 XP each
 */

export type MissionType =
  | 'games_played'
  | 'wins'
  | 'points'
  | 'unique_games'
  | 'daily_challenges';

export interface WeeklyMission {
  mission_id: string;
  mission_index: number;
  type: MissionType;
  game_id: string | null;
  target: number;
  xp_reward: number;
  week_start: string;
  progress: number;
  completed: boolean;
  rewarded: boolean;
}

/** i18n key suffix per mission type */
export const MISSION_TYPE_KEYS: Record<MissionType, string> = {
  games_played: 'gamesPlayed',
  wins: 'wins',
  points: 'points',
  unique_games: 'uniqueGames',
  daily_challenges: 'dailyChallenges',
};

/** Emoji icon per mission type */
export const MISSION_ICONS: Record<MissionType, string> = {
  games_played: '🎮',
  wins: '🏆',
  points: '⭐',
  unique_games: '🗺️',
  daily_challenges: '📅',
};

/** Returns days left until next Monday reset */
export function getDaysUntilReset(): number {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  return daysUntilMonday;
}
