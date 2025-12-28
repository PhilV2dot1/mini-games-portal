import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/leaderboard/global/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('GET /api/leaderboard/global', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pagination', () => {
    test('uses default pagination (limit=100, offset=0)', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockLeaderboard = [
        {
          rank: 1,
          user_id: 'user-1',
          username: 'player1',
          display_name: 'Player One',
          fid: null,
          total_points: 1000,
          games_played: 50,
          wins: 40,
          theme_color: 'blue',
          avatar_type: 'default',
          avatar_url: null,
        },
        {
          rank: 2,
          user_id: 'user-2',
          username: 'player2',
          display_name: null,
          fid: null,
          total_points: 900,
          games_played: 45,
          wins: 35,
          theme_color: 'yellow',
          avatar_type: 'predefined',
          avatar_url: null,
        },
      ];

      const rangeMock = vi.fn().mockResolvedValue({
        data: mockLeaderboard,
        error: null,
      });

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: rangeMock,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(rangeMock).toHaveBeenCalledWith(0, 99); // offset 0, offset + limit - 1
      expect(data.leaderboard).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    test('applies custom limit and offset', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockLeaderboard = [
        {
          rank: 11,
          user_id: 'user-11',
          username: 'player11',
          display_name: 'Player Eleven',
          fid: null,
          total_points: 500,
          games_played: 30,
          wins: 20,
          theme_color: 'yellow',
          avatar_type: 'default',
          avatar_url: null,
        },
      ];

      const rangeMock = vi.fn().mockResolvedValue({
        data: mockLeaderboard,
        error: null,
      });

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: rangeMock,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest(
        'http://localhost/api/leaderboard/global?limit=10&offset=10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(rangeMock).toHaveBeenCalledWith(10, 19); // offset 10, offset + limit - 1
      expect(data.leaderboard).toHaveLength(1);
    });

    test('handles offset without limit', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: rangeMock,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest(
        'http://localhost/api/leaderboard/global?offset=50'
      );

      await GET(request);

      expect(rangeMock).toHaveBeenCalledWith(50, 149); // offset 50, default limit 100
    });

    test('handles limit without offset', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const rangeMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: rangeMock,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest(
        'http://localhost/api/leaderboard/global?limit=25'
      );

      await GET(request);

      expect(rangeMock).toHaveBeenCalledWith(0, 24); // offset 0, limit 25
    });
  });

  describe('Ordering', () => {
    test('orders by rank ascending', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockLeaderboard = [
        {
          rank: 1,
          user_id: 'user-1',
          username: 'player1',
          total_points: 1000,
          games_played: 50,
          wins: 40,
        },
        {
          rank: 2,
          user_id: 'user-2',
          username: 'player2',
          total_points: 900,
          games_played: 45,
          wins: 35,
        },
        {
          rank: 3,
          user_id: 'user-3',
          username: 'player3',
          total_points: 800,
          games_played: 40,
          wins: 30,
        },
      ];

      const orderMock = vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          data: mockLeaderboard,
          error: null,
        }),
      });

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: orderMock,
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(orderMock).toHaveBeenCalledWith('rank', { ascending: true });
      expect(data.leaderboard[0].rank).toBe(1);
      expect(data.leaderboard[1].rank).toBe(2);
      expect(data.leaderboard[2].rank).toBe(3);
    });
  });

  describe('Response formatting', () => {
    test('formats response fields correctly', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockEntry = {
        rank: 1,
        user_id: 'user-123',
        username: 'testuser',
        display_name: 'Test User',
        fid: 12345,
        total_points: 500,
        games_played: 25,
        wins: 20,
        theme_color: 'blue',
        avatar_type: 'custom',
        avatar_url: 'https://example.com/avatar.png',
      };

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [mockEntry],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(data.leaderboard[0]).toEqual({
        rank: 1,
        userId: 'user-123',
        username: 'testuser',
        displayName: 'Test User',
        fid: 12345,
        totalPoints: 500,
        gamesPlayed: 25,
        wins: 20,
        theme_color: 'blue',
        avatar_type: 'custom',
        avatar_url: 'https://example.com/avatar.png',
      });
    });

    test('uses username as displayName when displayName is null', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockEntry = {
        rank: 1,
        user_id: 'user-123',
        username: 'myusername',
        display_name: null,
        fid: null,
        total_points: 500,
        games_played: 25,
        wins: 20,
        theme_color: 'yellow',
        avatar_type: 'default',
        avatar_url: null,
      };

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [mockEntry],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(data.leaderboard[0].displayName).toBe('myusername');
    });

    test('uses username as fallback when both displayName and username exist', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockEntry = {
        rank: 1,
        user_id: 'user-123',
        username: 'username123',
        display_name: null,
        fid: 999,
        total_points: 300,
        games_played: 20,
        wins: 15,
        theme_color: 'yellow',
        avatar_type: 'default',
        avatar_url: null,
      };

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [mockEntry],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(data.leaderboard[0].username).toBe('username123');
      expect(data.leaderboard[0].displayName).toBe('username123');
    });

    test('uses "Player {fid}" when username and displayName are null', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockEntry = {
        rank: 1,
        user_id: 'user-123',
        username: null,
        display_name: null,
        fid: 555,
        total_points: 200,
        games_played: 10,
        wins: 5,
        theme_color: 'yellow',
        avatar_type: 'default',
        avatar_url: null,
      };

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [mockEntry],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(data.leaderboard[0].username).toBe('Player 555');
      expect(data.leaderboard[0].displayName).toBe('Player 555');
    });

    test('uses "Player Unknown" when all identifiers are null', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockEntry = {
        rank: 1,
        user_id: 'user-123',
        username: null,
        display_name: null,
        fid: null,
        total_points: 100,
        games_played: 5,
        wins: 2,
        theme_color: 'yellow',
        avatar_type: 'default',
        avatar_url: null,
      };

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [mockEntry],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(data.leaderboard[0].username).toBe('Player Unknown');
      expect(data.leaderboard[0].displayName).toBe('Player Unknown');
    });

    test('defaults theme_color to yellow when null', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockEntry = {
        rank: 1,
        user_id: 'user-123',
        username: 'testuser',
        display_name: 'Test User',
        fid: null,
        total_points: 300,
        games_played: 15,
        wins: 10,
        theme_color: null,
        avatar_type: 'default',
        avatar_url: null,
      };

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [mockEntry],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(data.leaderboard[0].theme_color).toBe('yellow');
    });

    test('preserves theme_color when set', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockEntry = {
        rank: 1,
        user_id: 'user-123',
        username: 'testuser',
        display_name: 'Test User',
        fid: null,
        total_points: 300,
        games_played: 15,
        wins: 10,
        theme_color: 'blue',
        avatar_type: 'default',
        avatar_url: null,
      };

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [mockEntry],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(data.leaderboard[0].theme_color).toBe('blue');
    });
  });

  describe('Empty results', () => {
    test('returns empty array when leaderboard is empty', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toEqual([]);
      expect(data.count).toBe(0);
    });

    test('returns empty array when offset exceeds total entries', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest(
        'http://localhost/api/leaderboard/global?offset=1000'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('Error handling', () => {
    test('returns 500 when database query fails', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch leaderboard');
      expect(data.details).toBeTruthy();
    });

    test('returns 500 when leaderboard data is null', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch leaderboard');
    });

    test('handles unexpected errors gracefully', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const fromMock = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Count field', () => {
    test('returns correct count for non-empty results', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockLeaderboard = Array(10).fill(null).map((_, i) => ({
        rank: i + 1,
        user_id: `user-${i}`,
        username: `player${i}`,
        display_name: `Player ${i}`,
        fid: null,
        total_points: 1000 - i * 10,
        games_played: 50,
        wins: 40,
        theme_color: 'yellow',
        avatar_type: 'default',
        avatar_url: null,
      }));

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockLeaderboard,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(data.count).toBe(10);
      expect(data.leaderboard).toHaveLength(10);
    });

    test('count equals leaderboard length', async () => {
      const { supabase } = await import('@/lib/supabase/client');

      const mockLeaderboard = Array(5).fill(null).map((_, i) => ({
        rank: i + 1,
        user_id: `user-${i}`,
        username: `player${i}`,
        total_points: 500,
        games_played: 25,
        wins: 20,
      }));

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockLeaderboard,
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const request = new NextRequest('http://localhost/api/leaderboard/global');

      const response = await GET(request);
      const data = await response.json();

      expect(data.count).toBe(data.leaderboard.length);
    });
  });
});
