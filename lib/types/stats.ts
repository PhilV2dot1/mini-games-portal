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
  games: Record<GameId, GameStats>;
}

export type GameResult = "win" | "lose" | "draw" | "push";
