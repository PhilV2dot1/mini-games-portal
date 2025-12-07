"use client";

import { useState, useEffect, useCallback } from "react";
import { GameId, GameMode, GameResult, UserProfile, GameStats } from "@/lib/types";

const STORAGE_KEY = "celo_games_portal_stats";

const DEFAULT_GAME_STATS: GameStats = {
  played: 0,
  wins: 0,
  losses: 0,
  totalPoints: 0,
  lastPlayed: 0,
};

const DEFAULT_PROFILE: UserProfile = {
  totalPoints: 0,
  gamesPlayed: 0,
  games: {
    blackjack: { ...DEFAULT_GAME_STATS },
    rps: { ...DEFAULT_GAME_STATS },
    tictactoe: { ...DEFAULT_GAME_STATS },
    jackpot: { ...DEFAULT_GAME_STATS },
    "2048": { ...DEFAULT_GAME_STATS },
    mastermind: { ...DEFAULT_GAME_STATS },
  },
};

// Points configuration
const POINTS_CONFIG = {
  free: { perGame: 10, perWin: 25, perLoss: 0 },
  onchain: { perGame: 25, perWin: 75, perLoss: 0 },
};

function calculatePoints(
  mode: GameMode,
  result: GameResult,
  streakBonus: number = 0
): number {
  const config = POINTS_CONFIG[mode];
  let basePoints = config.perGame;

  if (result === "win") {
    basePoints += config.perWin;
  }

  const multiplier = 1 + (streakBonus * 0.1);
  return Math.floor(basePoints * multiplier);
}

function getStreakBonus(currentStreak: number): number {
  return Math.floor(currentStreak / 3);
}

export function useLocalStats() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stats from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
        } catch (error) {
          console.error("Failed to parse stored stats:", error);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile, isLoaded]);

  const recordGame = useCallback((
    gameId: GameId,
    mode: GameMode,
    result: GameResult
  ) => {
    setProfile((prev) => {
      const gameStats = prev.games[gameId];
      const streakBonus = getStreakBonus(gameStats.wins);
      const points = calculatePoints(mode, result, streakBonus);

      const newGameStats: GameStats = {
        played: gameStats.played + 1,
        wins: result === "win" ? gameStats.wins + 1 : gameStats.wins,
        losses: result === "lose" ? gameStats.losses + 1 : gameStats.losses,
        totalPoints: gameStats.totalPoints + points,
        lastPlayed: Date.now(),
      };

      return {
        totalPoints: prev.totalPoints + points,
        gamesPlayed: prev.gamesPlayed + 1,
        games: {
          ...prev.games,
          [gameId]: newGameStats,
        },
      };
    });
  }, []);

  const getStats = useCallback((gameId?: GameId): GameStats | UserProfile => {
    if (gameId) {
      return profile.games[gameId];
    }
    return profile;
  }, [profile]);

  const resetStats = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
  }, []);

  return {
    profile,
    recordGame,
    getStats,
    resetStats,
    isLoaded,
  };
}
