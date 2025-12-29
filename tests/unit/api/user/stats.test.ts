/**
 * Tests for GET /api/user/stats
 *
 * This route provides user statistics for charts and analytics including:
 * - Win rates by game
 * - Points progress over time
 * - Activity timeline
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/user/stats/route';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
const mockCreateServerClient = createServerClient as ReturnType<typeof vi.fn>;

describe('GET /api/user/stats', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabaseClient = {
      rpc: vi.fn(),
    };

    mockCreateServerClient.mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // SUCCESS CASES
  // ============================================================

  describe('Success Cases', () => {
    it('should return all stats when all RPC calls succeed', async () => {
      const mockWinRates = [
        { game_id: 'tic-tac-toe', games_played: 10, games_won: 7, win_rate: 0.7 },
        { game_id: 'jackpot', games_played: 5, games_won: 2, win_rate: 0.4 },
      ];

      const mockPointsProgress = [
        { date: '2025-01-01', total_points: 100 },
        { date: '2025-01-02', total_points: 150 },
        { date: '2025-01-03', total_points: 200 },
      ];

      const mockActivityTimeline = [
        { game_id: 'tic-tac-toe', result: 'win', points_earned: 10, played_at: '2025-01-03T12:00:00Z' },
        { game_id: 'jackpot', result: 'loss', points_earned: 5, played_at: '2025-01-03T11:00:00Z' },
      ];

      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: mockWinRates, error: null })
        .mockResolvedValueOnce({ data: mockPointsProgress, error: null })
        .mockResolvedValueOnce({ data: mockActivityTimeline, error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        winRates: mockWinRates,
        pointsProgress: mockPointsProgress,
        activityTimeline: mockActivityTimeline,
      });

      // Verify RPC calls
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(3);
      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(1, 'get_user_win_rate_by_game', {
        p_user_id: 'user-123',
      });
      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(2, 'get_user_points_progress', {
        p_user_id: 'user-123',
        p_days: 30, // default
      });
      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(3, 'get_user_activity_timeline', {
        p_user_id: 'user-123',
        p_limit: 20,
      });
    });

    it('should use custom days parameter when provided', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123&days=7');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(2, 'get_user_points_progress', {
        p_user_id: 'user-123',
        p_days: 7,
      });
    });

    it('should use default days=30 when not provided', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-456');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(2, 'get_user_points_progress', {
        p_user_id: 'user-456',
        p_days: 30,
      });
    });

    it('should handle large days parameter', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123&days=365');
      await GET(request as any);

      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(2, 'get_user_points_progress', {
        p_user_id: 'user-123',
        p_days: 365,
      });
    });
  });

  // ============================================================
  // VALIDATION ERRORS
  // ============================================================

  describe('Validation Errors', () => {
    it('should return 400 when userId is missing', async () => {
      const request = new Request('http://localhost/api/user/stats');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User ID is required');
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });

    it('should return 400 when userId is empty string', async () => {
      const request = new Request('http://localhost/api/user/stats?userId=');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User ID is required');
    });
  });

  // ============================================================
  // GRACEFUL DEGRADATION (Partial Failures)
  // ============================================================

  describe('Graceful Degradation', () => {
    it('should return empty array for winRates when RPC fails', async () => {
      const mockPointsProgress = [{ date: '2025-01-01', total_points: 100 }];
      const mockActivityTimeline = [{ game_id: 'tic-tac-toe', result: 'win', points_earned: 10 }];

      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: null, error: { message: 'RPC error' } }) // winRates fails
        .mockResolvedValueOnce({ data: mockPointsProgress, error: null })
        .mockResolvedValueOnce({ data: mockActivityTimeline, error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        winRates: [],
        pointsProgress: mockPointsProgress,
        activityTimeline: mockActivityTimeline,
      });
    });

    it('should return empty array for pointsProgress when RPC fails', async () => {
      const mockWinRates = [{ game_id: 'tic-tac-toe', win_rate: 0.7 }];
      const mockActivityTimeline = [{ game_id: 'jackpot', result: 'win' }];

      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: mockWinRates, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } }) // pointsProgress fails
        .mockResolvedValueOnce({ data: mockActivityTimeline, error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        winRates: mockWinRates,
        pointsProgress: [],
        activityTimeline: mockActivityTimeline,
      });
    });

    it('should return empty array for activityTimeline when RPC fails', async () => {
      const mockWinRates = [{ game_id: 'tic-tac-toe', win_rate: 0.7 }];
      const mockPointsProgress = [{ date: '2025-01-01', total_points: 100 }];

      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: mockWinRates, error: null })
        .mockResolvedValueOnce({ data: mockPointsProgress, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Timeline error' } }); // activityTimeline fails

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        winRates: mockWinRates,
        pointsProgress: mockPointsProgress,
        activityTimeline: [],
      });
    });

    it('should return all empty arrays when all RPCs fail', async () => {
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: null, error: { message: 'Error 1' } })
        .mockResolvedValueOnce({ data: null, error: { message: 'Error 2' } })
        .mockResolvedValueOnce({ data: null, error: { message: 'Error 3' } });

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        winRates: [],
        pointsProgress: [],
        activityTimeline: [],
      });
    });

    it('should handle null data from successful RPC calls', async () => {
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: null, error: null }) // null data but no error
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        winRates: [],
        pointsProgress: [],
        activityTimeline: [],
      });
    });
  });

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  describe('Error Handling', () => {
    it('should return 500 when createServerClient throws', async () => {
      mockCreateServerClient.mockImplementation(() => {
        throw new Error('Supabase connection failed');
      });

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBeDefined();
    });

    it('should return 500 when RPC throws exception', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('RPC exception'));

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle invalid days parameter (non-numeric)', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123&days=invalid');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      // parseInt('invalid') = NaN, which should be handled
      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(2, 'get_user_points_progress', {
        p_user_id: 'user-123',
        p_days: NaN,
      });
    });

    it('should handle zero days parameter', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123&days=0');
      await GET(request as any);

      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(2, 'get_user_points_progress', {
        p_user_id: 'user-123',
        p_days: 0,
      });
    });

    it('should handle negative days parameter', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123&days=-5');
      await GET(request as any);

      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(2, 'get_user_points_progress', {
        p_user_id: 'user-123',
        p_days: -5,
      });
    });

    it('should handle user with no stats (empty arrays)', async () => {
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const request = new Request('http://localhost/api/user/stats?userId=new-user');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        winRates: [],
        pointsProgress: [],
        activityTimeline: [],
      });
    });

    it('should handle UUID-format userId', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new Request(`http://localhost/api/user/stats?userId=${uuid}`);
      await GET(request as any);

      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(1, 'get_user_win_rate_by_game', {
        p_user_id: uuid,
      });
    });

    it('should handle userId with special characters', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const specialUserId = 'user-123!@#$%';
      const encodedUserId = encodeURIComponent(specialUserId);
      const request = new Request(`http://localhost/api/user/stats?userId=${encodedUserId}`);
      await GET(request as any);

      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(1, 'get_user_win_rate_by_game', {
        p_user_id: specialUserId,
      });
    });
  });

  // ============================================================
  // DATA STRUCTURE TESTS
  // ============================================================

  describe('Data Structure Tests', () => {
    it('should preserve winRates data structure', async () => {
      const mockWinRates = [
        {
          game_id: 'tic-tac-toe',
          games_played: 15,
          games_won: 10,
          win_rate: 0.6667,
          avg_points: 12.5,
        },
      ];

      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: mockWinRates, error: null })
        .mockResolvedValue({ data: [], error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.winRates).toEqual(mockWinRates);
      expect(data.winRates[0]).toHaveProperty('game_id');
      expect(data.winRates[0]).toHaveProperty('games_played');
      expect(data.winRates[0]).toHaveProperty('win_rate');
    });

    it('should preserve pointsProgress data structure', async () => {
      const mockPointsProgress = [
        { date: '2025-01-01', total_points: 100, daily_change: 0 },
        { date: '2025-01-02', total_points: 150, daily_change: 50 },
      ];

      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: mockPointsProgress, error: null })
        .mockResolvedValue({ data: [], error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.pointsProgress).toEqual(mockPointsProgress);
      expect(data.pointsProgress[0]).toHaveProperty('date');
      expect(data.pointsProgress[0]).toHaveProperty('total_points');
    });

    it('should preserve activityTimeline data structure', async () => {
      const mockActivityTimeline = [
        {
          game_id: 'jackpot',
          result: 'win',
          points_earned: 1000,
          played_at: '2025-01-03T15:30:00Z',
          mode: 'onchain',
        },
      ];

      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: mockActivityTimeline, error: null });

      const request = new Request('http://localhost/api/user/stats?userId=user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.activityTimeline).toEqual(mockActivityTimeline);
      expect(data.activityTimeline[0]).toHaveProperty('game_id');
      expect(data.activityTimeline[0]).toHaveProperty('result');
      expect(data.activityTimeline[0]).toHaveProperty('points_earned');
      expect(data.activityTimeline[0]).toHaveProperty('played_at');
    });
  });
});
