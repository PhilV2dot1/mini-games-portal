import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/badges/check/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('POST /api/badges/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    test('returns 400 when userId is missing', async () => {
      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId is required');
    });
  });

  describe('Stats calculation', () => {
    test('calculates basic stats correctly', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn();

      // First call: get all badges
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'badge-1',
              name: 'Beginner',
              requirement: { games_played: 5 },
              points: 50,
            },
          ],
          error: null,
        }),
      });

      // Second call: get existing user badges
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      // Third call: get game sessions
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { game_id: 'blackjack', result: 'win', mode: 'free' },
                { game_id: 'blackjack', result: 'lose', mode: 'free' },
                { game_id: 'rps', result: 'win', mode: 'free' },
                { game_id: '2048', result: 'win', mode: 'onchain' },
                { game_id: 'mastermind', result: 'win', mode: 'free' },
              ],
              error: null,
            }),
          }),
        }),
      });

      // Fourth call: get leaderboard rank
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { rank: 10 },
              error: null,
            }),
          }),
        }),
      });

      // Fifth call: insert user badges
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      // Sixth call: get user total_points
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 100 },
              error: null,
            }),
          }),
        }),
      });

      // Seventh call: update user points
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toEqual({
        games_played: 5,
        wins: 4,
        win_streak: 3, // 3 consecutive wins (rps, 2048, mastermind)
        leaderboard_rank: 10,
        unique_games: 4, // blackjack, rps, 2048, mastermind
        games_won_all: 4, // won all 4 games
        games_played_og: 2, // blackjack, rps
        games_played_new: 2, // 2048, mastermind
        onchain_games: 1,
        celo_wagered: 0.01,
      });
    });

    test('calculates win streak correctly with losses', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn();

      // Badges
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      // Existing badges
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      // Sessions (in reverse order - most recent first)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { game_id: 'blackjack', result: 'win', mode: 'free' }, // Most recent
                { game_id: 'blackjack', result: 'win', mode: 'free' },
                { game_id: 'blackjack', result: 'win', mode: 'free' },
                { game_id: 'blackjack', result: 'lose', mode: 'free' }, // Streak break
                { game_id: 'blackjack', result: 'win', mode: 'free' },
                { game_id: 'blackjack', result: 'win', mode: 'free' },
              ],
              error: null,
            }),
          }),
        }),
      });

      // Leaderboard
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.stats.win_streak).toBe(3); // Max streak is 3 at the beginning
    });

    test('handles push/draw results (not breaking streak)', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { game_id: 'blackjack', result: 'win', mode: 'free' },
                { game_id: 'blackjack', result: 'push', mode: 'free' }, // Should not break streak
                { game_id: 'blackjack', result: 'win', mode: 'free' },
                { game_id: 'tictactoe', result: 'draw', mode: 'free' }, // Should not break streak
                { game_id: 'blackjack', result: 'win', mode: 'free' },
              ],
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.stats.win_streak).toBe(3); // All 3 wins count (push/draw don't break)
    });
  });

  describe('Badge requirement evaluation', () => {
    test('awards badge when games_played requirement is met', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-starter',
        name: 'Getting Started',
        requirement: { games_played: 5 },
        points: 50,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: Array(5).fill({ game_id: 'blackjack', result: 'win', mode: 'free' }),
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 100 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.newBadges[0].id).toBe('badge-starter');
    });

    test('does not award badge when games_played requirement is not met', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-veteran',
        name: 'Veteran',
        requirement: { games_played: 100 },
        points: 200,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: Array(50).fill({ game_id: 'blackjack', result: 'win', mode: 'free' }),
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(0);
    });

    test('awards badge for wins requirement', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-winner',
        name: 'Winner',
        requirement: { wins: 10 },
        points: 100,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const sessions = [
        ...Array(10).fill({ game_id: 'blackjack', result: 'win', mode: 'free' }),
        ...Array(5).fill({ game_id: 'blackjack', result: 'lose', mode: 'free' }),
      ];

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: sessions,
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 200 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.wins).toBe(10);
    });

    test('awards badge for win_streak requirement', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-streak',
        name: 'On Fire',
        requirement: { win_streak: 5 },
        points: 150,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: Array(5).fill({ game_id: 'blackjack', result: 'win', mode: 'free' }),
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 300 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.win_streak).toBe(5);
    });

    test('awards badge for leaderboard_rank requirement', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-top10',
        name: 'Top 10',
        requirement: { leaderboard_rank: 10 },
        points: 500,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: Array(20).fill({ game_id: 'blackjack', result: 'win', mode: 'free' }),
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { rank: 5 }, // Rank 5 qualifies for top 10
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 1000 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.leaderboard_rank).toBe(5);
    });

    test('awards badge for unique_games requirement', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-explorer',
        name: 'Game Explorer',
        requirement: { unique_games: 4 },
        points: 100,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { game_id: 'blackjack', result: 'win', mode: 'free' },
                { game_id: 'rps', result: 'win', mode: 'free' },
                { game_id: 'tictactoe', result: 'win', mode: 'free' },
                { game_id: '2048', result: 'win', mode: 'free' },
              ],
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 150 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.unique_games).toBe(4);
    });

    test('awards badge for games_won_all requirement', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-completionist',
        name: 'Completionist',
        requirement: { games_won_all: 6 }, // Won all 6 games
        points: 300,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { game_id: 'blackjack', result: 'win', mode: 'free' },
                { game_id: 'rps', result: 'win', mode: 'free' },
                { game_id: 'tictactoe', result: 'win', mode: 'free' },
                { game_id: 'jackpot', result: 'win', mode: 'free' },
                { game_id: '2048', result: 'win', mode: 'free' },
                { game_id: 'mastermind', result: 'win', mode: 'free' },
              ],
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 500 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.games_won_all).toBe(6);
    });

    test('awards badge for games_played_og requirement', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-og',
        name: 'OG Player',
        requirement: { games_played_og: 4 }, // All 4 OG games
        points: 200,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { game_id: 'blackjack', result: 'win', mode: 'free' },
                { game_id: 'rps', result: 'win', mode: 'free' },
                { game_id: 'tictactoe', result: 'win', mode: 'free' },
                { game_id: 'jackpot', result: 'win', mode: 'free' },
              ],
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 400 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.games_played_og).toBe(4);
    });

    test('awards badge for games_played_new requirement', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-new',
        name: 'New Games Fan',
        requirement: { games_played_new: 2 }, // Both new games
        points: 150,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { game_id: '2048', result: 'win', mode: 'free' },
                { game_id: 'mastermind', result: 'win', mode: 'free' },
              ],
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 250 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.games_played_new).toBe(2);
    });

    test('awards badge for onchain_games requirement', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-onchain',
        name: 'On-Chain Player',
        requirement: { onchain_games: 10 },
        points: 300,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: Array(10).fill({ game_id: 'blackjack', result: 'win', mode: 'onchain' }),
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 600 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.onchain_games).toBe(10);
      expect(data.stats.celo_wagered).toBe(0.1); // 10 * 0.01
    });

    test('awards badge for celo_wagered requirement', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-whale',
        name: 'Whale',
        requirement: { celo_wagered: 1.0 }, // 100 on-chain games
        points: 1000,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: Array(100).fill({ game_id: 'blackjack', result: 'win', mode: 'onchain' }),
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 2000 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.celo_wagered).toBe(1.0);
    });

    test('evaluates multiple requirements correctly', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-master',
        name: 'Master',
        requirement: {
          games_played: 50,
          wins: 25,
          win_streak: 5,
        },
        points: 500,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const sessions = [
        ...Array(5).fill({ game_id: 'blackjack', result: 'win', mode: 'free' }), // 5 win streak
        ...Array(20).fill({ game_id: 'blackjack', result: 'win', mode: 'free' }), // 25 total wins
        ...Array(25).fill({ game_id: 'blackjack', result: 'lose', mode: 'free' }), // 50 total games
      ];

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: sessions,
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 1000 },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(1);
      expect(data.stats.games_played).toBe(50);
      expect(data.stats.wins).toBe(25);
      expect(data.stats.win_streak).toBe(25); // All wins are consecutive
    });

    test('does not award badge if any requirement is not met', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-impossible',
        name: 'Impossible',
        requirement: {
          games_played: 100,
          wins: 100, // Need 100 wins
        },
        points: 1000,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const sessions = [
        ...Array(50).fill({ game_id: 'blackjack', result: 'win', mode: 'free' }),
        ...Array(50).fill({ game_id: 'blackjack', result: 'lose', mode: 'free' }),
      ];

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: sessions,
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(0); // games_played met, but wins not met
    });
  });

  describe('Duplicate prevention', () => {
    test('does not award badge user already has', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-existing',
        name: 'Already Earned',
        requirement: { games_played: 1 },
        points: 50,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      // User already has this badge
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ badge_id: 'badge-existing' }],
            error: null,
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ game_id: 'blackjack', result: 'win', mode: 'free' }],
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.newBadges).toHaveLength(0);
    });
  });

  describe('Points update', () => {
    test('updates user total_points with badge points', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-points',
        name: 'Points Badge',
        requirement: { games_played: 1 },
        points: 250,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ game_id: 'blackjack', result: 'win', mode: 'free' }],
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Get current points
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 500 },
              error: null,
            }),
          }),
        }),
      });

      // Update points
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        update: updateMock,
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      await POST(request);

      // Verify update was called with correct new total
      expect(updateMock).toHaveBeenCalledWith({ total_points: 750 }); // 500 + 250
    });

    test('updates points for multiple badges', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badges = [
        {
          id: 'badge-1',
          name: 'Badge 1',
          requirement: { games_played: 1 },
          points: 100,
        },
        {
          id: 'badge-2',
          name: 'Badge 2',
          requirement: { wins: 1 },
          points: 150,
        },
      ];

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: badges, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ game_id: 'blackjack', result: 'win', mode: 'free' }],
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 300 },
              error: null,
            }),
          }),
        }),
      });

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      fromMock.mockReturnValueOnce({
        update: updateMock,
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      await POST(request);

      // Verify update was called with total of both badges
      expect(updateMock).toHaveBeenCalledWith({ total_points: 550 }); // 300 + 100 + 150
    });
  });

  describe('Error handling', () => {
    test('returns 500 when badge fetch fails', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch badges');
    });

    test('continues when badge insertion fails', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const badge = {
        id: 'badge-test',
        name: 'Test Badge',
        requirement: { games_played: 1 },
        points: 50,
      };

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [badge], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ game_id: 'blackjack', result: 'win', mode: 'free' }],
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      // Badge insertion fails
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return successfully
      expect(response.status).toBe(200);
      expect(data.newBadges).toHaveLength(1);
    });

    test('returns empty badges when user has no sessions', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn();

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null, // No sessions
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.newBadges).toEqual([]);
    });
  });
});
