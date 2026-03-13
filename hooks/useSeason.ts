'use client';

import { useState, useEffect } from 'react';

export interface Season {
  season_id: string;
  number: number;
  name: string;
  starts_at: string;
  ends_at: string;
  days_remaining: number;
}

export interface SeasonLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_type: string;
  avatar_url: string;
  points: number;
  games_played: number;
  wins: number;
}

interface UseSeasonReturn {
  season: Season | null;
  loading: boolean;
}

interface UseSeasonLeaderboardReturn {
  leaderboard: SeasonLeaderboardEntry[];
  seasonId: string | null;
  loading: boolean;
}

export function useSeason(): UseSeasonReturn {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/seasons')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setSeason(data?.season ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { season, loading };
}

export function useSeasonLeaderboard(seasonId?: string): UseSeasonLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<SeasonLeaderboardEntry[]>([]);
  const [resolvedSeasonId, setResolvedSeasonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = seasonId
      ? `/api/seasons/leaderboard?seasonId=${seasonId}&limit=50`
      : '/api/seasons/leaderboard?limit=50';

    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setLeaderboard(data?.leaderboard ?? []);
        setResolvedSeasonId(data?.seasonId ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [seasonId]);

  return { leaderboard, seasonId: resolvedSeasonId, loading };
}
