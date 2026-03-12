'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccount } from 'wagmi';
import { WeeklyMission, MissionType } from '@/lib/missions/missions';

interface UseWeeklyMissionsReturn {
  missions: WeeklyMission[];
  loading: boolean;
  xpJustAwarded: number | null;
  refresh: () => void;
  reportProgress: (type: MissionType, gameId: string | null, value: number) => Promise<void>;
}

export function useWeeklyMissions(): UseWeeklyMissionsReturn {
  const { user } = useAuth();
  const { address: walletAddress } = useAccount();
  const [userId, setUserId] = useState<string | null>(null);
  const [missions, setMissions] = useState<WeeklyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [xpJustAwarded, setXpJustAwarded] = useState<number | null>(null);
  const fetchedRef = useRef(false);

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

  const fetchMissions = useCallback(() => {
    setLoading(true);
    const url = userId
      ? `/api/weekly-missions?userId=${userId}`
      : '/api/weekly-missions';

    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setMissions(data?.missions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (fetchedRef.current && userId === null) return;
    fetchedRef.current = true;
    fetchMissions();
  }, [fetchMissions]);

  /**
   * Call after each game action to update matching missions.
   * type: mission type to match, value: amount to add to progress
   */
  const reportProgress = useCallback(async (
    type: MissionType,
    gameId: string | null,
    value: number
  ) => {
    if (!userId) return;

    const matching = missions.filter(m =>
      !m.rewarded &&
      m.type === type &&
      (m.game_id === null || m.game_id === gameId)
    );

    for (const mission of matching) {
      const newProgress = Math.min(mission.progress + value, mission.target);

      // Optimistic update
      setMissions(prev => prev.map(m =>
        m.mission_id === mission.mission_id
          ? { ...m, progress: newProgress, completed: newProgress >= m.target }
          : m
      ));

      try {
        const res = await fetch('/api/weekly-missions/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, missionId: mission.mission_id, newProgress }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.newlyCompleted && data.xpAwarded > 0) {
            setXpJustAwarded(data.xpAwarded);
            setMissions(prev => prev.map(m =>
              m.mission_id === mission.mission_id ? { ...m, rewarded: true } : m
            ));
            setTimeout(() => setXpJustAwarded(null), 4000);
          }
        }
      } catch (err) {
        console.error('[useWeeklyMissions] reportProgress error:', err);
      }
    }
  }, [userId, missions]);

  return { missions, loading, xpJustAwarded, refresh: fetchMissions, reportProgress };
}
