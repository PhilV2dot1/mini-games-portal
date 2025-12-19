import { GameId } from "./games";

export interface GameStats {
  played: number;
  wins: number;
  losses: number;
  totalPoints: number;
  lastPlayed: number; // timestamp
}

export interface UserProfile {
  totalPoints: number;
  gamesPlayed: number;
  username?: string;
  avatar_type?: 'default' | 'predefined' | 'custom';
  avatar_url?: string;
  games: Record<GameId, GameStats>;
}

export type GameResult = "win" | "lose" | "draw" | "push";
