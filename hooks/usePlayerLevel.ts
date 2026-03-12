'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccount } from 'wagmi';
import { getPlayerLevel, getLevelProgress, PlayerLevel, XP_REWARDS, XpReason } from '@/lib/levels/levels';

export interface PlayerLevelState {
  xp: number;
  level: PlayerLevel;
  progress: number; // 0–100 within current level
  loading: boolean;
}

/**
 * Fetches current XP and computes level info for the authenticated user.
 */
export function usePlayerLevel(): PlayerLevelState {
  const { user } = useAuth();
  const { address: walletAddress } = useAccount();
  const [userId, setUserId] = useState<string | null>(null);
  const [state, setState] = useState<PlayerLevelState>({
    xp: 0,
    level: getPlayerLevel(0),
    progress: 0,
    loading: true,
  });

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
    fetch(`/api/user/xp?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const xp = data.xp ?? 0;
        setState({
          xp,
          level: getPlayerLevel(xp),
          progress: getLevelProgress(xp),
          loading: false,
        });
      })
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, [userId]);

  return state;
}

/**
 * Awards XP to the current user.
 * Returns updated xp and level number on success, null on failure.
 */
export async function awardXp(
  userId: string,
  reason: XpReason,
  gameId?: string
): Promise<{ xp: number; level: number; amount: number } | null> {
  try {
    const res = await fetch('/api/user/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason, gameId }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export { XP_REWARDS };
export type { XpReason };
