'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccount } from 'wagmi';

export interface LoginStreakState {
  currentStreak: number;
  bestStreak: number;
  totalLoginDays: number;
  bonusPointsEarned: number | null; // non-null only on the first load of a new day
  isNewDay: boolean;
  loading: boolean;
}

/**
 * Records a daily login on mount and returns streak data.
 * The API is idempotent — safe to call multiple times.
 */
export function useLoginStreak(): LoginStreakState {
  const { user, isAuthenticated } = useAuth();
  const { address: walletAddress } = useAccount();
  const [state, setState] = useState<LoginStreakState>({
    currentStreak: 0,
    bestStreak: 0,
    totalLoginDays: 0,
    bonusPointsEarned: null,
    isNewDay: false,
    loading: true,
  });
  const calledRef = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Resolve userId
  useEffect(() => {
    if (user?.id) { setUserId(user.id); return; }
    if (walletAddress) {
      fetch(`/api/user/profile?wallet=${walletAddress.toLowerCase()}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.user?.id) setUserId(d.user.id); })
        .catch(() => {});
    }
  }, [user?.id, walletAddress]);

  useEffect(() => {
    if (!userId) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    if (calledRef.current) return;
    calledRef.current = true;

    fetch('/api/login-streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.isNewDay) {
          // Award XP for logging in on a new day
          fetch('/api/user/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, reason: 'login_streak' }),
          }).catch(() => {});
        }
        setState({
          currentStreak: data.currentStreak ?? 0,
          bestStreak: data.bestStreak ?? 0,
          totalLoginDays: 0,
          bonusPointsEarned: data.isNewDay && data.bonusPoints > 0 ? data.bonusPoints : null,
          isNewDay: data.isNewDay ?? false,
          loading: false,
        });
      })
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, [userId]);

  return state;
}
