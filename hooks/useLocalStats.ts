"use client";

import { useState, useEffect, useCallback } from "react";
import { GameId, GameMode, GameResult, UserProfile, GameStats } from "@/lib/types";
import { useAccount } from "wagmi";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";

const STORAGE_KEY = "celo_games_portal_stats";
const ACCOUNT_PROMPT_THRESHOLD = 5; // Show create account modal after 5 games

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
  username: undefined,
  avatar_type: undefined,
  avatar_url: undefined,
  games: {
    blackjack: { ...DEFAULT_GAME_STATS },
    rps: { ...DEFAULT_GAME_STATS },
    tictactoe: { ...DEFAULT_GAME_STATS },
    jackpot: { ...DEFAULT_GAME_STATS },
    "2048": { ...DEFAULT_GAME_STATS },
    mastermind: { ...DEFAULT_GAME_STATS },
    connectfive: { ...DEFAULT_GAME_STATS },
    snake: { ...DEFAULT_GAME_STATS },
    solitaire: { ...DEFAULT_GAME_STATS },
    minesweeper: { ...DEFAULT_GAME_STATS },
    yahtzee: { ...DEFAULT_GAME_STATS },
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
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [hasSyncedStats, setHasSyncedStats] = useState(false);

  const { address } = useAccount();
  const { user, isAuthenticated, isAnonymous } = useAuth();
  const { showBadgeToast } = useToast();

  // Load stats from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          // Migrate old data: add missing game entries
          const migratedProfile = { ...DEFAULT_PROFILE, ...parsed };
          migratedProfile.games = { ...DEFAULT_PROFILE.games, ...parsed.games };

          setProfile(migratedProfile);
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

  // Sync localStorage stats to database when user becomes authenticated
  useEffect(() => {
    const syncStatsToDatabase = async () => {
      if (!isAuthenticated || !user || hasSyncedStats) return;

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      try {
        const localStats = JSON.parse(stored);

        // Only sync if user has accumulated stats
        if (localStats.gamesPlayed > 0) {
          console.log('Syncing localStorage stats to database...');

          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              authUserId: user.id,
              localStats,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Stats synced successfully:', data);
            setHasSyncedStats(true);

            // Optional: Clear localStorage after successful sync
            // localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error syncing stats to database:', error);
      }
    };

    syncStatsToDatabase();
  }, [isAuthenticated, user, hasSyncedStats]);

  // Check if should show account creation prompt
  useEffect(() => {
    if (isLoaded && isAnonymous && profile.gamesPlayed >= ACCOUNT_PROMPT_THRESHOLD) {
      // Check if user has already dismissed the prompt
      const dismissed = localStorage.getItem('account_prompt_dismissed');
      if (!dismissed) {
        setShowAccountPrompt(true);
      }
    }
  }, [isLoaded, isAnonymous, profile.gamesPlayed]);

  const recordGame = useCallback(async (
    gameId: GameId,
    mode: GameMode,
    result: GameResult,
    txHash?: string,
    difficulty?: 'easy' | 'medium' | 'hard'
  ) => {
    // Calculate points
    let points = 0;
    setProfile((prev) => {
      const gameStats = prev.games[gameId];
      const streakBonus = getStreakBonus(gameStats.wins);
      points = calculatePoints(mode, result, streakBonus);

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

    // Also record to Supabase if user has wallet connected or is authenticated
    if (address || isAuthenticated) {
      try {
        const response = await fetch('/api/game/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            gameId,
            mode,
            result,
            txHash,
            difficulty,
          }),
        });

        if (!response.ok) {
          console.error('Failed to record game session to database');
        } else {
          const data = await response.json();
          console.log('Game session recorded to database:', data);

          // Check for new badges
          if (data.userId) {
            try {
              const badgeResponse = await fetch('/api/badges/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.userId }),
              });

              if (badgeResponse.ok) {
                const badgeData = await badgeResponse.json();
                if (badgeData.newBadges && badgeData.newBadges.length > 0) {
                  console.log('New badges earned:', badgeData.newBadges);

                  // Show Toast notification for each badge
                  badgeData.newBadges.forEach((badge: { name: string; icon: string; points: number }) => {
                    showBadgeToast(badge.name, badge.icon, badge.points);
                  });

                  // Also show browser notification if permission granted (fallback)
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    badgeData.newBadges.forEach((badge: { name: string; icon: string; points: number }) => {
                      new Notification('🎉 Badge Unlocked!', {
                        body: `${badge.icon} ${badge.name} (+${badge.points} points)`,
                        icon: '/icons/badge.png',
                      });
                    });
                  }
                }
              }
            } catch (badgeError) {
              console.error('Error checking badges:', badgeError);
            }
          }
        }
      } catch (error) {
        console.error('Error recording game session:', error);
      }
    }
  }, [address, isAuthenticated]);

  const getStats = useCallback((gameId?: GameId): GameStats | UserProfile => {
    if (gameId) {
      return profile.games[gameId];
    }
    return profile;
  }, [profile]);

  const resetStats = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
  }, []);

  const dismissAccountPrompt = useCallback(() => {
    setShowAccountPrompt(false);
    localStorage.setItem('account_prompt_dismissed', 'true');
  }, []);

  const clearDismissedPrompt = useCallback(() => {
    localStorage.removeItem('account_prompt_dismissed');
  }, []);

  return {
    profile,
    recordGame,
    getStats,
    resetStats,
    isLoaded,
    showAccountPrompt,
    dismissAccountPrompt,
    clearDismissedPrompt,
    isAuthenticated,
    isAnonymous,
  };
}
