'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccount } from 'wagmi';

export interface DailyChallenge {
  challenge_id: string;
  game_id: string;
  description: string;
  description_fr: string;
  target: number;
  metric: 'wins' | 'games_played' | 'points';
  bonus_points: number;
  progress: number;
  completed: boolean;
  rewarded: boolean;
  challenge_date: string;
}

interface UseDailyChallengeReturn {
  challenge: DailyChallenge | null;
  loading: boolean;
  pointsJustAwarded: number | null;
  refresh: () => void;
  reportProgress: (gameId: string, metric: 'wins' | 'games_played' | 'points', value: number) => Promise<void>;
}

/**
 * Fetches today's daily challenge and the current user's progress.
 * Call reportProgress(gameId, metric, value) after each game to update.
 */
export function useDailyChallenge(): UseDailyChallengeReturn {
  const { user, isAuthenticated } = useAuth();
  const { address: walletAddress } = useAccount();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [pointsJustAwarded, setPointsJustAwarded] = useState<number | null>(null);

  // Resolve user ID (auth or wallet)
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      return;
    }
    if (walletAddress) {
      // Look up user ID by wallet
      fetch(`/api/user/profile?wallet=${walletAddress.toLowerCase()}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.user?.id) setUserId(data.user.id); })
        .catch(() => {});
    }
  }, [user?.id, walletAddress]);

  const fetchChallenge = useCallback(() => {
    setLoading(true);
    const url = userId
      ? `/api/daily-challenge?userId=${userId}`
      : '/api/daily-challenge';

    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setChallenge(data?.challenge ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const reportProgress = useCallback(async (
    gameId: string,
    metric: 'wins' | 'games_played' | 'points',
    value: number
  ) => {
    if (!userId || !challenge) return;
    if (challenge.game_id !== gameId) return;
    if (challenge.metric !== metric) return;
    if (challenge.rewarded) return; // Already done

    const newProgress = Math.min(challenge.progress + value, challenge.target);
    const completed = newProgress >= challenge.target;

    // Optimistic update
    setChallenge(prev => prev ? { ...prev, progress: newProgress, completed } : null);

    try {
      const res = await fetch('/api/daily-challenge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          challengeId: challenge.challenge_id,
          progress: newProgress,
          completed,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.newlyCompleted && data.pointsAwarded > 0) {
          setPointsJustAwarded(data.pointsAwarded);
          setChallenge(prev => prev ? { ...prev, rewarded: true } : null);
          setTimeout(() => setPointsJustAwarded(null), 4000);
        }
      }
    } catch (err) {
      console.error('[useDailyChallenge] reportProgress error:', err);
    }
  }, [userId, challenge]);

  return {
    challenge,
    loading,
    pointsJustAwarded,
    refresh: fetchChallenge,
    reportProgress,
  };
}
