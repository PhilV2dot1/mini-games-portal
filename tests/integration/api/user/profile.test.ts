import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/user/profile/route';

/**
 * /api/user/profile API Tests
 *
 * Tests for the most complex API route in the application.
 * Handles GET (user profile retrieval with auto-creation) and
 * PUT (profile updates with validation).
 *
 * Key features tested:
 * - User lookup by fid, wallet, or userId
 * - Auto-creation of profiles (OAuth and wallet users)
 * - Privacy enforcement
 * - Data aggregation (sessions, badges, rank, stats)
 * - Profile updates with comprehensive validation
 * - Username uniqueness checks
 * - Error handling
 */

// Mock Supabase
const mockSupabaseData = {
  user: null,
  session: null,
};

const mockGetUser = vi.fn(() => Promise.resolve({ data: { user: mockSupabaseData.user }, error: null }));
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOr = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

// Mock admin client functions
const mockAdminGetUserById = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        getUserById: mockAdminGetUserById,
      },
    },
    from: mockFrom,
  })),
}));

// Mock validation functions
vi.mock('@/lib/validations/profile', () => ({
  validateUsername: vi.fn(async () => ({ valid: true })),
  validateDisplayName: vi.fn(() => ({ valid: true })),
  validateBio: vi.fn(() => ({ valid: true })),
  validateSocialLinks: vi.fn(() => ({ valid: true })),
}));

vi.mock('@/lib/constants/themes', () => ({
  isValidThemeColor: vi.fn(() => true),
}));

describe('/api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock data
    mockSupabaseData.user = null;
    mockSupabaseData.session = null;

    // Create default chainable mock with proper chaining support
    const createDefaultChain = () => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        or: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        // Make the chain awaitable (so .order().limit() works as Promise)
        then: vi.fn((resolve) => {
          resolve({ data: [], error: null });
          return Promise.resolve({ data: [], error: null });
        }),
        catch: vi.fn(() => Promise.resolve({ data: [], error: null })),
      };
      return chain;
    };

    // Setup table-aware mock chain
    // Store custom mocks per table (tests can override these)
    const tableMocks: Record<string, any> = {};

    mockFrom.mockImplementation((tableName: string) => {
      // If a test has set up a custom mock for this table, use it
      if (tableMocks[tableName]) {
        const customMock = tableMocks[tableName];
        delete tableMocks[tableName]; // Use once, then clean up
        return customMock;
      }
      // Otherwise use default chain
      return createDefaultChain();
    });

    // Helper function tests can use to set up table-specific mocks
    (global as any).mockTableQuery = (table: string, mock: any) => {
      tableMocks[table] = mock;
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // GET - USER LOOKUP TESTS
  // ============================================================

  describe('GET - User Lookup', () => {
    it('should return 400 if no identifier provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/profile');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Either fid, wallet, or id is required');
    });

    it('should find user by fid', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'TestUser',
        fid: 12345,
        total_points: 500,
        profile_visibility: 'public',
      };

      // First .from('users') call - return user
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile?fid=12345');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe('TestUser');
    });

    it('should find user by wallet address (normalized to lowercase)', async () => {
      const walletAddress = '0xAbCdEf1234567890';
      const mockUser = {
        id: 'user-wallet',
        username: 'WalletUser',
        wallet_address: walletAddress.toLowerCase(),
        total_points: 1000,
        profile_visibility: 'public',
      };

      // First .from('users') call - return user
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?wallet=${walletAddress}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe('WalletUser');
    });

    it('should find user by userId (auth_user_id or id)', async () => {
      const userId = 'auth-user-123';
      const mockUser = {
        id: 'user-456',
        auth_user_id: userId,
        username: 'OAuthUser',
        email: 'user@example.com',
        profile_visibility: 'public',
      };

      // First .from('users') call - return user
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?id=${userId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe('OAuthUser');
    });

    it('should return 404 when fid user not found', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const request = new NextRequest('http://localhost:3000/api/user/profile?fid=99999');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  // ============================================================
  // GET - AUTO-CREATION TESTS (OAuth Users)
  // ============================================================

  describe('GET - Auto-Creation (OAuth)', () => {
    it('should auto-create profile for OAuth user when not found', async () => {
      const userId = 'oauth-user-new';
      const authUser = {
        id: userId,
        email: 'newuser@example.com',
        app_metadata: { provider: 'google' },
      };

      const newUser = {
        id: 'created-user-123',
        auth_user_id: userId,
        email: 'newuser@example.com',
        username: 'newuser',
        auth_provider: 'google',
        is_anonymous: false,
        total_points: 0,
        avatar_type: 'default',
        avatar_url: '/avatars/predefined/default-player.svg',
        profile_visibility: 'public',
      };

      // 1. Initial user query - not found
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      // Admin getUserById returns auth user
      mockAdminGetUserById.mockResolvedValue({ data: { user: authUser }, error: null });

      // 2. Check if username exists (admin client) - doesn't exist
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      // 3. Insert new user (admin client)
      mockFrom.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: newUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?id=${userId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockAdminGetUserById).toHaveBeenCalledWith(userId);
      expect(data.user.username).toBe('newuser');
      expect(data.user.email).toBe('newuser@example.com');
    });

    it('should generate unique username if email username already exists', async () => {
      const userId = 'oauth-user-duplicate';
      const authUser = {
        id: userId,
        email: 'existing@example.com',
        app_metadata: { provider: 'google' },
      };

      const newUser = {
        id: 'created-user-456',
        auth_user_id: userId,
        username: 'existing_abc1', // Random suffix added
        email: 'existing@example.com',
        profile_visibility: 'public',
      };

      // 1. Initial user query - not found
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      // Admin getUserById returns auth user
      mockAdminGetUserById.mockResolvedValue({ data: { user: authUser }, error: null });

      // 2. Check if username 'existing' exists (admin client) - it does!
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: { username: 'existing' }, error: null })),
          })),
        })),
      });

      // 3. Insert new user with unique suffix (admin client)
      mockFrom.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: newUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?id=${userId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should have username with suffix (we can't check exact suffix as it's random)
      expect(data.user.username).toMatch(/^existing_/);
    });

    it('should handle existing user when unique constraint violated during creation', async () => {
      const userId = 'oauth-race-condition';
      const authUser = {
        id: userId,
        email: 'raceuser@example.com',
      };

      const existingUser = {
        id: 'existing-from-race',
        auth_user_id: userId,
        username: 'raceuser',
        profile_visibility: 'public',
      };

      // 1. Initial user query - not found
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      mockAdminGetUserById.mockResolvedValue({ data: { user: authUser }, error: null });

      // 2. Check if username exists (admin client) - doesn't exist
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      // 3. Insert fails with unique constraint violation (admin client)
      mockFrom.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key value' } })),
          })),
        })),
      });

      // 4. Fetch existing user after race condition (regular client)
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: existingUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?id=${userId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.id).toBe('existing-from-race');
    });

    it('should return 500 if OAuth user creation fails', async () => {
      const userId = 'oauth-fail';
      const authUser = {
        id: userId,
        email: 'fail@example.com',
      };

      // 1. Initial user query - not found
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      mockAdminGetUserById.mockResolvedValue({ data: { user: authUser }, error: null });

      // 2. Check if username exists (admin client) - doesn't exist
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      // 3. Insert fails with non-unique-constraint error (admin client)
      mockFrom.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { code: '23503', message: 'foreign key violation' } })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?id=${userId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Échec de la création du profil');
    });

    it('should return 404 if auth user not found in Supabase Auth', async () => {
      const userId = 'non-existent-auth';

      // 1. Initial user query - not found
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      mockAdminGetUserById.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' }
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?id=${userId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur non trouvé dans Supabase Auth');
    });
  });

  // ============================================================
  // GET - AUTO-CREATION TESTS (Wallet Users)
  // ============================================================

  describe('GET - Auto-Creation (Wallet)', () => {
    it('should auto-create profile for wallet user when not found', async () => {
      const walletAddress = '0x1234567890abcdef';

      const newUser = {
        id: 'wallet-user-new',
        wallet_address: walletAddress.toLowerCase(),
        username: 'Player_12345678',
        display_name: 'Player_12345678',
        is_anonymous: false,
        total_points: 0,
        avatar_type: 'default',
        avatar_url: '/avatars/predefined/default-player.svg',
        theme_color: 'yellow',
        profile_visibility: 'public',
      };

      // 1. Initial wallet query - not found
      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      // 2. Insert new wallet user
      mockFrom.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: newUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?wallet=${walletAddress}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.wallet_address).toBe(walletAddress.toLowerCase());
      expect(data.user.username).toMatch(/^Player_/);
    });

    it('should return 500 if wallet profile creation fails', async () => {
      const walletAddress = '0x9876543210fedcba';

      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?wallet=${walletAddress}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create profile');
    });
  });

  // ============================================================
  // GET - PRIVACY ENFORCEMENT TESTS
  // ============================================================

  describe('GET - Privacy Enforcement', () => {
    it('should return private profile error when profile_visibility is private and requester is not owner', async () => {
      const mockUser = {
        id: 'private-user',
        auth_user_id: 'auth-private',
        username: 'PrivateUser',
        profile_visibility: 'private',
      };

      // Requester is different user
      mockSupabaseData.user = { id: 'different-user' };

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile?id=auth-private');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Ce profil est privé');
    });

    it('should allow access to private profile when requester is the owner (by auth_user_id)', async () => {
      const userId = 'auth-owner';
      const mockUser = {
        id: 'user-123',
        auth_user_id: userId,
        username: 'PrivateOwner',
        profile_visibility: 'private',
      };

      // Requester is the owner
      mockSupabaseData.user = { id: userId };

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?id=${userId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe('PrivateOwner');
    });

    it('should allow access to private profile when requester is the owner (by id)', async () => {
      const userId = 'user-direct';
      const mockUser = {
        id: userId,
        username: 'DirectOwner',
        profile_visibility: 'private',
      };

      // Requester is the owner
      mockSupabaseData.user = { id: userId };

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost:3000/api/user/profile?id=${userId}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe('DirectOwner');
    });

    it('should allow access to public profile for any requester', async () => {
      const mockUser = {
        id: 'public-user',
        username: 'PublicUser',
        profile_visibility: 'public',
      };

      // No requester (anonymous)
      mockSupabaseData.user = null;

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile?id=public-user');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe('PublicUser');
    });

    it('should allow access when profile_visibility is null (defaults to public)', async () => {
      const mockUser = {
        id: 'default-public',
        username: 'DefaultPublic',
        profile_visibility: null,
      };

      mockSupabaseData.user = null;

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile?id=default-public');

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  // ============================================================
  // GET - DATA AGGREGATION TESTS
  // ============================================================

  describe('GET - Data Aggregation', () => {
    it('should include game sessions in response', async () => {
      const mockUser = {
        id: 'user-with-sessions',
        username: 'ActivePlayer',
        profile_visibility: 'public',
      };

      const mockSessions = [
        { id: 's1', game_id: 'blackjack', result: 'win', points: 100, played_at: '2024-01-01' },
        { id: 's2', game_id: 'rps', result: 'lose', points: 10, played_at: '2024-01-02' },
      ];

      mockMaybeSingle.mockResolvedValueOnce({ data: mockUser, error: null });

      // Mock different queries for sessions, badges, leaderboard
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Initial user query
          return {
            select: () => ({
              or: () => ({
                maybeSingle: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Sessions query
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: mockSessions, error: null }),
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          // Badges query
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          };
        } else {
          // Leaderboard query
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile?id=user-with-sessions');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toBeDefined();
      expect(data.sessions).toHaveLength(2);
    });

    it('should include badges in response', async () => {
      const mockUser = {
        id: 'user-with-badges',
        username: 'BadgeCollector',
        profile_visibility: 'public',
      };

      const mockBadges = [
        { badge_id: 'first_win', earned_at: '2024-01-01' },
        { badge_id: 'games_10', earned_at: '2024-01-02' },
      ];

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: () => ({
              or: () => ({
                maybeSingle: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          };
        } else if (callCount === 2) {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: mockBadges, error: null }),
              }),
            }),
          };
        } else {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile?id=user-with-badges');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.badges).toBeDefined();
      expect(data.badges).toHaveLength(2);
    });

    it('should include leaderboard rank in response', async () => {
      const mockUser = {
        id: 'ranked-user',
        username: 'TopPlayer',
        profile_visibility: 'public',
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: () => ({
              or: () => ({
                maybeSingle: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          };
        } else if (callCount === 2 || callCount === 3) {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        } else {
          // Leaderboard query
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { rank: 42 }, error: null }),
              }),
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile?id=ranked-user');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rank).toBe(42);
    });

    it('should calculate per-game statistics from sessions', async () => {
      const mockUser = {
        id: 'stats-user',
        username: 'StatsPlayer',
        profile_visibility: 'public',
      };

      const mockSessions = [
        { game_id: 'blackjack', result: 'win', points: 100 },
        { game_id: 'blackjack', result: 'lose', points: 10 },
        { game_id: 'blackjack', result: 'win', points: 100 },
        { game_id: 'rps', result: 'win', points: 35 },
      ];

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: () => ({
              or: () => ({
                maybeSingle: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          };
        } else if (callCount === 2) {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: mockSessions, error: null }),
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          };
        } else {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile?id=stats-user');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gameStats).toBeDefined();
      expect(data.gameStats.blackjack).toEqual({
        played: 3,
        wins: 2,
        points: 210,
      });
      expect(data.gameStats.rps).toEqual({
        played: 1,
        wins: 1,
        points: 35,
      });
    });
  });

  // ============================================================
  // PUT - VALIDATION TESTS
  // ============================================================

  describe('PUT - Validation Tests', () => {
    it('should return 401 if no userId or walletAddress provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ display_name: 'Test' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentification requise');
    });

    it('should validate display_name and return error if invalid', async () => {
      const { validateDisplayName } = await import('@/lib/validations/profile');
      vi.mocked(validateDisplayName).mockReturnValue({
        valid: false,
        error: 'Display name trop court',
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'user-1' }, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-1',
          display_name: 'ab',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Display name trop court');
    });

    it('should validate username and return error if invalid', async () => {
      const { validateUsername } = await import('@/lib/validations/profile');
      vi.mocked(validateUsername).mockResolvedValue({
        valid: false,
        error: 'Username already taken',
      });

      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-2' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-2',
          username: 'TakenName',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username already taken');
    });

    it('should validate bio and return error if invalid', async () => {
      const { validateBio } = await import('@/lib/validations/profile');
      vi.mocked(validateBio).mockReturnValue({
        valid: false,
        error: 'Bio trop longue',
      });

      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-3' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-3',
          bio: 'a'.repeat(500),
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bio trop longue');
    });

    it('should validate social_links and return error if invalid', async () => {
      const { validateSocialLinks } = await import('@/lib/validations/profile');
      vi.mocked(validateSocialLinks).mockReturnValue({
        valid: false,
        errors: { twitter: 'Invalid URL' },
      });

      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-4' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-4',
          social_links: { twitter: 'not-a-url' },
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Liens sociaux invalides');
    });

    it('should validate theme_color and return error if invalid', async () => {
      const { isValidThemeColor } = await import('@/lib/constants/themes');
      vi.mocked(isValidThemeColor).mockReturnValue(false);

      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-5' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-5',
          theme_color: 'invalid-color',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Couleur de thème invalide');
    });

    it('should validate profile_visibility and return error if invalid', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-6' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-6',
          profile_visibility: 'invalid-visibility',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('visibilité du profil invalide');
    });
  });

  // ============================================================
  // PUT - UPDATE TESTS
  // ============================================================

  describe('PUT - Update Tests', () => {
    it('should update display_name successfully', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-update-1' }, error: null });
      mockSingle.mockResolvedValue({
        data: { id: 'user-update-1', display_name: 'New Display Name' },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-update-1',
          display_name: 'New Display Name',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalled();
      expect(data.success).toBe(true);
    });

    it('should update username successfully', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-update-2' }, error: null });
      mockSingle.mockResolvedValue({
        data: { id: 'user-update-2', username: 'NewUsername' },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-update-2',
          username: 'NewUsername',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should update bio successfully', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-update-3' }, error: null });
      mockSingle.mockResolvedValue({
        data: { id: 'user-update-3', bio: 'My new bio' },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-update-3',
          bio: 'My new bio',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });

    it('should update theme_color successfully', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-update-4' }, error: null });
      mockSingle.mockResolvedValue({
        data: { id: 'user-update-4', theme_color: 'blue' },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-update-4',
          theme_color: 'blue',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });

    it('should update profile_visibility successfully', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-update-5' }, error: null });
      mockSingle.mockResolvedValue({
        data: { id: 'user-update-5', profile_visibility: 'private' },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-update-5',
          profile_visibility: 'private',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });

    it('should update multiple fields at once', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-update-multi' }, error: null });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-update-multi',
          display_name: 'Multi Update',
          bio: 'Updated bio',
          theme_color: 'purple',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-update-multi',
          display_name: 'Multi Update',
          bio: 'Updated bio',
          theme_color: 'purple',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });

    it('should create new user profile if wallet user not found', async () => {
      const walletAddress = '0xNewWallet123';

      // User not found
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      // Insert new user
      mockSingle.mockResolvedValue({
        data: {
          id: 'new-wallet-user',
          wallet_address: walletAddress.toLowerCase(),
          username: 'NewPlayer',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          walletAddress,
          username: 'NewPlayer',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockInsert).toHaveBeenCalled();
      expect(data.success).toBe(true);
    });
  });

  // ============================================================
  // PUT - ERROR HANDLING TESTS
  // ============================================================

  describe('PUT - Error Handling', () => {
    it('should return 404 if OAuth user not found', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'non-existent-oauth',
          display_name: 'Test',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur non trouvé');
    });

    it('should return 500 if database update fails', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-fail' }, error: null });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-fail',
          display_name: 'Fail Update',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('mise à jour du profil');
    });

    it('should return 500 if username validation throws error', async () => {
      const { validateUsername } = await import('@/lib/validations/profile');
      vi.mocked(validateUsername).mockRejectedValue(new Error('Validation error'));

      mockMaybeSingle.mockResolvedValue({ data: { id: 'user-val-error' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-val-error',
          username: 'TestUser',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('validation du nom d\'utilisateur');
    });

    it('should return 500 if user creation fails for wallet user', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          walletAddress: '0xFailWallet',
          username: 'FailUser',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('création de l\'utilisateur');
    });
  });
});

