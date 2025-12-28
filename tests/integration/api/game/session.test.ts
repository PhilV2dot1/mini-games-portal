import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/game/session/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock calculateGamePoints
vi.mock('@/lib/utils/points', () => ({
  calculateGamePoints: vi.fn((mode, result) => {
    if (mode === 'free') {
      return result === 'win' ? 35 : 10;
    }
    return result === 'win' ? 100 : 25;
  }),
}));

describe('POST /api/game/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    test('returns 400 when gameId is missing', async () => {
      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'free',
          result: 'win',
          walletAddress: '0x123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    test('returns 400 when mode is missing', async () => {
      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          gameId: 'blackjack',
          result: 'win',
          walletAddress: '0x123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    test('returns 400 when result is missing', async () => {
      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          gameId: 'blackjack',
          mode: 'free',
          walletAddress: '0x123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    test('returns 400 when neither fid nor walletAddress is provided', async () => {
      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          gameId: 'blackjack',
          mode: 'free',
          result: 'win',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Either fid or walletAddress is required');
    });
  });

  describe('User creation and lookup with FID', () => {
    test('creates new user when FID does not exist', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      // Mock finding no existing user by FID
      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-user-id' },
              error: null
            }),
          }),
        }),
      });

      // Mock game session insert
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
          }),
        }),
      }).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-user-id' },
              error: null,
            }),
          }),
        }),
      }).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'session-123', user_id: 'new-user-id', points_earned: 35 },
              error: null,
            }),
          }),
        }),
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 0 },
              error: null,
            }),
          }),
        }),
      }).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: 'not_found' } });

      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          fid: 12345,
          gameId: 'blackjack',
          mode: 'free',
          result: 'win',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userId).toBe('new-user-id');
      expect(data.pointsEarned).toBe(35);
    });

    test('uses existing user when FID exists', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn();

      // First call: find existing user by FID
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'existing-user-id' },
              error: null,
            }),
          }),
        }),
      });

      // Second call: insert game session
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'session-456', user_id: 'existing-user-id', points_earned: 35 },
              error: null,
            }),
          }),
        }),
      });

      // Third call: get user points
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

      // Fourth call: update points
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: 'not_found' } });

      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          fid: 12345,
          gameId: 'blackjack',
          mode: 'free',
          result: 'win',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userId).toBe('existing-user-id');
    });
  });

  describe('User creation and lookup with wallet address', () => {
    test('normalizes wallet address to lowercase', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn();

      // Check for existing user (lowercase)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((field, value) => {
            expect(value).toBe('0xabc123def456'); // Should be lowercase
            return {
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'user-id' },
                error: null,
              }),
            };
          }),
        }),
      });

      // Insert game session
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'session-id', points_earned: 35 },
              error: null,
            }),
          }),
        }),
      });

      // Get user points
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { total_points: 50 },
              error: null,
            }),
          }),
        }),
      });

      // Update points
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: 'not_found' } });

      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: '0xABC123DEF456', // Mixed case
          gameId: 'blackjack',
          mode: 'free',
          result: 'win',
        }),
      });

      await POST(request);
    });
  });

  describe('Points calculation', () => {
    test('awards correct points for free mode win', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const { calculateGamePoints } = await import('@/lib/utils/points');

      const fromMock = vi.fn();
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'user-id' },
              error: null,
            }),
            single: vi.fn().mockResolvedValue({
              data: { total_points: 0 },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'session-id', points_earned: 35 },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: 'not_found' } });

      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          fid: 123,
          gameId: 'blackjack',
          mode: 'free',
          result: 'win',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(calculateGamePoints).toHaveBeenCalledWith('free', 'win');
      expect(data.pointsEarned).toBe(35);
    });

    test('awards correct points for on-chain mode win', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const { calculateGamePoints } = await import('@/lib/utils/points');

      const fromMock = vi.fn();
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'user-id' },
              error: null,
            }),
            single: vi.fn().mockResolvedValue({
              data: { total_points: 100 },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'session-id', points_earned: 100 },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: 'not_found' } });

      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: '0x123',
          gameId: 'blackjack',
          mode: 'onchain',
          result: 'win',
          txHash: '0xabc',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(calculateGamePoints).toHaveBeenCalledWith('onchain', 'win');
      expect(data.pointsEarned).toBe(100);
    });
  });

  describe('Error handling', () => {
    test('returns 500 when user creation fails', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn();
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          fid: 999,
          gameId: 'blackjack',
          mode: 'free',
          result: 'win',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create user');
    });

    test('returns 500 when session creation fails', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn();
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'user-id' },
              error: null,
            }),
          }),
        }),
      }).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Session error' },
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/game/session', {
        method: 'POST',
        body: JSON.stringify({
          fid: 123,
          gameId: 'blackjack',
          mode: 'free',
          result: 'win',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create game session');
    });
  });
});
