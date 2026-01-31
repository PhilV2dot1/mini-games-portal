/**
 * Tests for authentication API routes
 *
 * Coverage:
 * - POST /api/auth/signup - User registration with stats migration
 * - GET /api/auth/callback - OAuth callback handling
 * - POST /api/auth/wallet - Wallet-based authentication
 * - POST /api/auth/claim-profile - Link wallet/FID to OAuth account
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as signupPOST } from '@/app/api/auth/signup/route';
import { GET as callbackGET } from '@/app/api/auth/callback/route';
import { POST as walletPOST } from '@/app/api/auth/wallet/route';
import { POST as claimProfilePOST } from '@/app/api/auth/claim-profile/route';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Mock viem for wallet signature verification
vi.mock('viem', () => ({
  verifyMessage: vi.fn(),
}));

import { createClient } from '@supabase/supabase-js';
import { verifyMessage } from 'viem';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;
const mockVerifyMessage = verifyMessage as ReturnType<typeof vi.fn>;

describe('Authentication Routes', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create chainable mock methods
    const createChainableMock = () => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn(),
        single: vi.fn(),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        delete: vi.fn(() => chain),
      };
      return chain;
    };

    // Create mock Supabase client with proper method chaining
    mockSupabaseClient = {
      auth: {
        admin: {
          createUser: vi.fn(),
        },
        exchangeCodeForSession: vi.fn(),
      },
      from: vi.fn(() => createChainableMock()),
      rpc: vi.fn(),
    };

    mockCreateClient.mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    describe('Email/Password Registration', () => {
      it('should create new user with email and password', async () => {
        const mockAuthUser = { id: 'auth-123', email: 'test@example.com' };
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          username: 'test',
          total_points: 0,
        };

        mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
          data: { user: mockAuthUser },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            })),
          })),
        });

        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });

        // Mock fetch for badge check
        global.fetch = vi.fn().mockResolvedValue({ ok: true });

        const response = await signupPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.userId).toBe('user-123');
        expect(data.supabaseUserId).toBe('auth-123');
        expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          email_confirm: true,
        });
      });

      it('should return error when email already exists', async () => {
        mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
          data: null,
          error: { message: 'User already registered' },
        });

        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: 'existing@example.com',
            password: 'password123',
          }),
        });

        const response = await signupPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Échec de la création du compte');
      });

      it('should return error when user ID is missing', async () => {
        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            // No password, no authUserId
          }),
        });

        const response = await signupPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('ID utilisateur requis');
      });
    });

    describe('Anonymous User Claims', () => {
      it('should claim existing anonymous user by wallet address', async () => {
        const mockAnonymousUser = {
          id: 'anon-123',
          wallet_address: '0xabc123',
          is_anonymous: true,
          total_points: 100,
        };

        const mockUpdatedUser = {
          ...mockAnonymousUser,
          email: 'test@example.com',
          is_anonymous: false,
          total_points: 100,
        };

        // Create chainable mock for finding anonymous user
        const findUserChain: any = {
          select: vi.fn(() => findUserChain),
          eq: vi.fn(() => findUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockAnonymousUser }),
        };

        // Create chainable mock for update
        const updateChain: any = {
          update: vi.fn(() => updateChain),
          eq: vi.fn(() => updateChain),
          select: vi.fn(() => updateChain),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedUser, error: null }),
        };

        // Mock from() calls in order
        mockSupabaseClient.from
          .mockReturnValueOnce(findUserChain)
          .mockReturnValueOnce(updateChain);

        global.fetch = vi.fn().mockResolvedValue({ ok: true });

        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
            email: 'test@example.com',
            walletAddress: '0xABC123', // Uppercase to test normalization
          }),
        });

        const response = await signupPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.migrated).toBe(true);
        expect(data.pointsPreserved).toBe(100);
        expect(data.message).toContain('Profil réclamé');
      });

      it('should claim existing anonymous user by FID', async () => {
        const mockAnonymousUser = {
          id: 'anon-456',
          fid: '12345',
          is_anonymous: true,
          total_points: 50,
        };

        const mockUpdatedUser = {
          ...mockAnonymousUser,
          email: 'test@example.com',
          is_anonymous: false,
        };

        const findUserChain: any = {
          select: vi.fn(() => findUserChain),
          eq: vi.fn(() => findUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockAnonymousUser }),
        };

        const updateChain: any = {
          update: vi.fn(() => updateChain),
          eq: vi.fn(() => updateChain),
          select: vi.fn(() => updateChain),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedUser, error: null }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(findUserChain)
          .mockReturnValueOnce(updateChain);

        global.fetch = vi.fn().mockResolvedValue({ ok: true });

        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-456',
            email: 'test@example.com',
            fid: '12345',
          }),
        });

        const response = await signupPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.migrated).toBe(true);
        expect(data.pointsPreserved).toBe(50);
      });

      it('should return error when claiming user fails', async () => {
        const mockAnonymousUser = {
          id: 'anon-123',
          wallet_address: '0xabc123',
          is_anonymous: true,
        };

        const findUserChain: any = {
          select: vi.fn(() => findUserChain),
          eq: vi.fn(() => findUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockAnonymousUser }),
        };

        const updateChain: any = {
          update: vi.fn(() => updateChain),
          eq: vi.fn(() => updateChain),
          select: vi.fn(() => updateChain),
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(findUserChain)
          .mockReturnValueOnce(updateChain);

        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
            email: 'test@example.com',
            walletAddress: '0xabc123',
          }),
        });

        const response = await signupPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Échec de la réclamation du profil');
      });
    });

    describe('LocalStorage Stats Migration', () => {
      it('should migrate localStorage stats to game sessions', async () => {
        const localStats = {
          totalPoints: 150,
          games: {
            'tic-tac-toe': {
              played: 10,
              wins: 7,
              losses: 3,
              totalPoints: 100,
            },
            'jackpot': {
              played: 5,
              wins: 2,
              losses: 3,
              totalPoints: 50,
            },
          },
        };

        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          total_points: 0,
        };

        mockSupabaseClient.from.mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            })),
          })),
        });

        // Mock game sessions insert
        const mockInsertSessions = vi.fn().mockResolvedValue({ error: null });
        mockSupabaseClient.from.mockReturnValueOnce({
          insert: mockInsertSessions,
        });

        // Mock total points update
        mockSupabaseClient.from.mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn(),
          })),
        });

        global.fetch = vi.fn().mockResolvedValue({ ok: true });

        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
            email: 'test@example.com',
            localStats,
          }),
        });

        const response = await signupPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.sessionsMigrated).toBe(15); // 7 wins + 3 losses from tic-tac-toe + 2 wins + 3 losses from jackpot = 15 total
        expect(mockInsertSessions).toHaveBeenCalled();
      });

      it('should not fail signup if stats migration fails', async () => {
        const localStats = {
          totalPoints: 100,
          games: {
            'invalid-game': {
              played: 5,
              wins: 3,
            },
          },
        };

        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
        };

        mockSupabaseClient.from.mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            })),
          })),
        });

        // Simulate stats migration error
        mockSupabaseClient.from.mockReturnValueOnce({
          insert: vi.fn().mockRejectedValue(new Error('Migration failed')),
        });

        global.fetch = vi.fn().mockResolvedValue({ ok: true });

        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
            email: 'test@example.com',
            localStats,
          }),
        });

        const response = await signupPOST(request as any);
        const data = await response.json();

        // Should still succeed
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid JSON body', async () => {
        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await signupPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBeTruthy();
      });

      it('should handle database errors when creating user', async () => {
        mockSupabaseClient.from.mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
            })),
          })),
        });

        const request = new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
            email: 'test@example.com',
          }),
        });

        const response = await signupPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Échec de la création du profil utilisateur');
      });
    });
  });

  describe('GET /api/auth/callback', () => {
    it('should exchange code for session and redirect to home', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
        error: null,
      });

      const request = new Request('http://localhost/api/auth/callback?code=abc123');

      const response = await callbackGET(request as any);

      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('Location')).toBe('http://localhost/');
      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc123');
    });

    it('should redirect to custom next URL when provided', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
        error: null,
      });

      const request = new Request('http://localhost/api/auth/callback?code=abc123&next=/dashboard');

      const response = await callbackGET(request as any);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost/dashboard');
    });

    it('should redirect to home when no code is provided', async () => {
      const request = new Request('http://localhost/api/auth/callback');

      const response = await callbackGET(request as any);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost/');
      expect(mockSupabaseClient.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    });

    it('should handle session exchange errors gracefully', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: null,
        error: { message: 'Invalid code' },
      });

      const request = new Request('http://localhost/api/auth/callback?code=invalid');

      const response = await callbackGET(request as any);

      // Should still redirect even if exchange fails
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost/');
    });

    it('should handle URL encoding in next parameter', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
        error: null,
      });

      const request = new Request('http://localhost/api/auth/callback?code=abc123&next=%2Fgames%2Ftic-tac-toe');

      const response = await callbackGET(request as any);

      expect(response.headers.get('Location')).toBe('http://localhost/games/tic-tac-toe');
    });
  });

  describe('POST /api/auth/wallet', () => {
    describe('Signature Verification', () => {
      it('should authenticate user with valid wallet signature', async () => {
        const mockUser = {
          id: 'user-123',
          wallet_address: '0xabc123',
          username: 'Player_abc123',
          total_points: 100,
          avatar_type: 'default',
          avatar_url: '/avatars/default.svg',
          is_anonymous: false,
        };

        mockVerifyMessage.mockResolvedValue(true);

        // Mock existing user lookup
        mockSupabaseClient.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockUser }),
            })),
          })),
        });

        // Mock update last login
        mockSupabaseClient.from.mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn(),
          })),
        });

        // Mock fetch user profile
        mockSupabaseClient.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            })),
          })),
        });

        const request = new Request('http://localhost/api/auth/wallet', {
          method: 'POST',
          body: JSON.stringify({
            address: '0xABC123',
            signature: '0xsignature',
            message: 'Sign in to Mini Games Portal',
          }),
        });

        const response = await walletPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user.wallet_address).toBe('0xabc123');
        expect(data.message).toBe('Logged in successfully');
        expect(mockVerifyMessage).toHaveBeenCalledWith({
          address: '0xabc123',
          message: 'Sign in to Mini Games Portal',
          signature: '0xsignature',
        });
      });

      it('should reject invalid signature', async () => {
        mockVerifyMessage.mockResolvedValue(false);

        const request = new Request('http://localhost/api/auth/wallet', {
          method: 'POST',
          body: JSON.stringify({
            address: '0xabc123',
            signature: '0xinvalid',
            message: 'Sign in',
          }),
        });

        const response = await walletPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Invalid signature');
      });

      it('should return error when missing required fields', async () => {
        const request = new Request('http://localhost/api/auth/wallet', {
          method: 'POST',
          body: JSON.stringify({
            address: '0xabc123',
            // Missing signature and message
          }),
        });

        const response = await walletPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing required fields');
      });
    });

    describe('User Creation', () => {
      it('should create new user when wallet does not exist', async () => {
        const newUser = {
          id: 'user-new',
          wallet_address: '0xdef456',
          username: 'Player_def456',
          total_points: 0,
          avatar_type: 'default',
          avatar_url: '/avatars/predefined/default-player.svg',
          is_anonymous: false,
        };

        mockVerifyMessage.mockResolvedValue(true);

        // Mock no existing user
        mockSupabaseClient.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            })),
          })),
        });

        // Mock insert new user
        mockSupabaseClient.from.mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: newUser, error: null }),
            })),
          })),
        });

        // Mock fetch user profile
        mockSupabaseClient.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: newUser, error: null }),
            })),
          })),
        });

        const request = new Request('http://localhost/api/auth/wallet', {
          method: 'POST',
          body: JSON.stringify({
            address: '0xDEF456',
            signature: '0xsignature',
            message: 'Sign in',
          }),
        });

        const response = await walletPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Account created successfully');
        expect(data.user.wallet_address).toBe('0xdef456');
        expect(data.user.username).toContain('Player_');
      });

      it('should handle user creation errors', async () => {
        mockVerifyMessage.mockResolvedValue(true);

        mockSupabaseClient.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            })),
          })),
        });

        mockSupabaseClient.from.mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
            })),
          })),
        });

        const request = new Request('http://localhost/api/auth/wallet', {
          method: 'POST',
          body: JSON.stringify({
            address: '0xabc123',
            signature: '0xsignature',
            message: 'Sign in',
          }),
        });

        const response = await walletPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to create user');
      });
    });

    describe('Wallet Address Normalization', () => {
      it('should normalize wallet address to lowercase', async () => {
        const mockUser = {
          id: 'user-123',
          wallet_address: '0xabc123def456',
          username: 'Player',
          total_points: 0,
        };

        mockVerifyMessage.mockResolvedValue(true);

        mockSupabaseClient.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockUser }),
            })),
          })),
        });

        mockSupabaseClient.from.mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn(),
          })),
        });

        mockSupabaseClient.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            })),
          })),
        });

        const request = new Request('http://localhost/api/auth/wallet', {
          method: 'POST',
          body: JSON.stringify({
            address: '0xABC123DEF456', // Uppercase
            signature: '0xsignature',
            message: 'Sign in',
          }),
        });

        await walletPOST(request as any);

        expect(mockVerifyMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            address: '0xabc123def456', // Should be lowercase
          })
        );
      });
    });
  });

  describe('POST /api/auth/claim-profile', () => {
    describe('Link Wallet to OAuth Account', () => {
      it('should link wallet address to existing OAuth account', async () => {
        const currentUser = {
          id: 'user-123',
          email: 'test@example.com',
          auth_user_id: 'auth-123',
          total_points: 50,
        };

        // Create chainable mocks
        const findCurrentUserChain: any = {
          select: vi.fn(() => findCurrentUserChain),
          eq: vi.fn(() => findCurrentUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: currentUser, error: null }),
        };

        const checkWalletChain: any = {
          select: vi.fn(() => checkWalletChain),
          eq: vi.fn(() => checkWalletChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };

        const updateChain: any = {
          update: vi.fn(() => updateChain),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(findCurrentUserChain)
          .mockReturnValueOnce(checkWalletChain)
          .mockReturnValueOnce(updateChain);

        const request = new Request('http://localhost/api/auth/claim-profile', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
            walletAddress: '0xabc123',
          }),
        });

        const response = await claimProfilePOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.linked).toBe('wallet');
        expect(data.merged).toBe(false);
        expect(data.message).toContain('Wallet lié avec succès');
      });

      it('should link FID to existing OAuth account', async () => {
        const currentUser = {
          id: 'user-456',
          email: 'test@example.com',
          auth_user_id: 'auth-456',
          total_points: 100,
        };

        const findCurrentUserChain: any = {
          select: vi.fn(() => findCurrentUserChain),
          eq: vi.fn(() => findCurrentUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: currentUser, error: null }),
        };

        const checkFidChain: any = {
          select: vi.fn(() => checkFidChain),
          eq: vi.fn(() => checkFidChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };

        const updateChain: any = {
          update: vi.fn(() => updateChain),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(findCurrentUserChain)
          .mockReturnValueOnce(checkFidChain)
          .mockReturnValueOnce(updateChain);

        const request = new Request('http://localhost/api/auth/claim-profile', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-456',
            fid: '12345',
          }),
        });

        const response = await claimProfilePOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.linked).toBe('fid');
        expect(data.message).toContain('Farcaster lié avec succès');
      });

      it('should link both wallet and FID', async () => {
        const currentUser = {
          id: 'user-789',
          email: 'test@example.com',
          auth_user_id: 'auth-789',
        };

        const findCurrentUserChain: any = {
          select: vi.fn(() => findCurrentUserChain),
          eq: vi.fn(() => findCurrentUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: currentUser, error: null }),
        };

        const checkExistingChain: any = {
          select: vi.fn(() => checkExistingChain),
          eq: vi.fn(() => checkExistingChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };

        const updateChain: any = {
          update: vi.fn(() => updateChain),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(findCurrentUserChain)
          .mockReturnValueOnce(checkExistingChain)
          .mockReturnValueOnce(updateChain);

        const request = new Request('http://localhost/api/auth/claim-profile', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-789',
            walletAddress: '0xabc123',
            fid: '12345',
          }),
        });

        const response = await claimProfilePOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.linked).toBe('both');
        expect(data.message).toContain('Wallet et Farcaster lié avec succès');
      });
    });

    describe('Merge Anonymous Accounts', () => {
      it('should merge anonymous account with OAuth account', async () => {
        const currentUser = {
          id: 'user-oauth',
          email: 'test@example.com',
          auth_user_id: 'auth-123',
          total_points: 50,
        };

        const anonymousUser = {
          id: 'user-anon',
          wallet_address: '0xabc123',
          is_anonymous: true,
          total_points: 100,
        };

        // Create chainable mocks for each operation
        const findCurrentUserChain: any = {
          select: vi.fn(() => findCurrentUserChain),
          eq: vi.fn(() => findCurrentUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: currentUser, error: null }),
        };

        const findAnonUserChain: any = {
          select: vi.fn(() => findAnonUserChain),
          eq: vi.fn(() => findAnonUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: anonymousUser }),
        };

        const updateSessionsChain: any = {
          update: vi.fn(() => updateSessionsChain),
          eq: vi.fn(),
        };

        const getExistingBadgesChain: any = {
          select: vi.fn(() => getExistingBadgesChain),
          eq: vi.fn().mockResolvedValue({ data: [{ badge_id: 'badge-1' }] }),
        };

        const getCurrentBadgesChain: any = {
          select: vi.fn(() => getCurrentBadgesChain),
          eq: vi.fn().mockResolvedValue({ data: [] }),
        };

        const insertBadgesChain: any = {
          insert: vi.fn(),
        };

        const deleteOldBadgesChain: any = {
          delete: vi.fn(() => deleteOldBadgesChain),
          eq: vi.fn(),
        };

        const updateUserChain: any = {
          update: vi.fn(() => updateUserChain),
          eq: vi.fn(),
        };

        const deleteAnonUserChain: any = {
          delete: vi.fn(() => deleteAnonUserChain),
          eq: vi.fn(),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(findCurrentUserChain)
          .mockReturnValueOnce(findAnonUserChain)
          .mockReturnValueOnce(updateSessionsChain)
          .mockReturnValueOnce(getExistingBadgesChain)
          .mockReturnValueOnce(getCurrentBadgesChain)
          .mockReturnValueOnce(insertBadgesChain)
          .mockReturnValueOnce(deleteOldBadgesChain)
          .mockReturnValueOnce(updateUserChain)
          .mockReturnValueOnce(deleteAnonUserChain);

        const request = new Request('http://localhost/api/auth/claim-profile', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
            walletAddress: '0xabc123',
          }),
        });

        const response = await claimProfilePOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.merged).toBe(true);
        expect(data.message).toContain('Profils fusionnés');
      });

      it('should transfer game sessions during merge', async () => {
        const currentUser = {
          id: 'user-oauth',
          auth_user_id: 'auth-123',
          total_points: 0,
        };

        const anonymousUser = {
          id: 'user-anon',
          wallet_address: '0xabc123',
          total_points: 200,
        };

        const findCurrentUserChain: any = {
          select: vi.fn(() => findCurrentUserChain),
          eq: vi.fn(() => findCurrentUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: currentUser, error: null }),
        };

        const findAnonUserChain: any = {
          select: vi.fn(() => findAnonUserChain),
          eq: vi.fn(() => findAnonUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: anonymousUser }),
        };

        const mockUpdateSessions = vi.fn(() => updateSessionsChain);
        const updateSessionsChain: any = {
          update: mockUpdateSessions,
          eq: vi.fn(),
        };

        // Mock remaining operations with proper chains
        const getBadgesChain: any = {
          select: vi.fn(() => getBadgesChain),
          eq: vi.fn().mockResolvedValue({ data: [] }),
        };

        const updateChain: any = {
          update: vi.fn(() => updateChain),
          eq: vi.fn(),
        };

        const deleteChain: any = {
          delete: vi.fn(() => deleteChain),
          eq: vi.fn(),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(findCurrentUserChain)
          .mockReturnValueOnce(findAnonUserChain)
          .mockReturnValueOnce(updateSessionsChain)
          .mockReturnValueOnce(getBadgesChain)
          .mockReturnValueOnce(getBadgesChain)
          .mockReturnValueOnce(deleteChain)
          .mockReturnValueOnce(updateChain)
          .mockReturnValueOnce(deleteChain);

        const request = new Request('http://localhost/api/auth/claim-profile', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
            walletAddress: '0xabc123',
          }),
        });

        await claimProfilePOST(request as any);

        expect(mockUpdateSessions).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return error when authUserId is missing', async () => {
        const request = new Request('http://localhost/api/auth/claim-profile', {
          method: 'POST',
          body: JSON.stringify({
            walletAddress: '0xabc123',
          }),
        });

        const response = await claimProfilePOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('ID utilisateur requis');
      });

      it('should return error when both wallet and FID are missing', async () => {
        const request = new Request('http://localhost/api/auth/claim-profile', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
          }),
        });

        const response = await claimProfilePOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Adresse wallet ou FID requis');
      });

      it('should return error when user is not found', async () => {
        mockSupabaseClient.from.mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        });

        const request = new Request('http://localhost/api/auth/claim-profile', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'nonexistent',
            walletAddress: '0xabc123',
          }),
        });

        const response = await claimProfilePOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toContain('Aucun profil trouvé');
      });

      it('should return error when profile update fails', async () => {
        const currentUser = {
          id: 'user-123',
          auth_user_id: 'auth-123',
        };

        const findCurrentUserChain: any = {
          select: vi.fn(() => findCurrentUserChain),
          eq: vi.fn(() => findCurrentUserChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: currentUser, error: null }),
        };

        const checkExistingChain: any = {
          select: vi.fn(() => checkExistingChain),
          eq: vi.fn(() => checkExistingChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };

        const updateChain: any = {
          update: vi.fn(() => updateChain),
          eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        };

        mockSupabaseClient.from
          .mockReturnValueOnce(findCurrentUserChain)
          .mockReturnValueOnce(checkExistingChain)
          .mockReturnValueOnce(updateChain);

        const request = new Request('http://localhost/api/auth/claim-profile', {
          method: 'POST',
          body: JSON.stringify({
            authUserId: 'auth-123',
            walletAddress: '0xabc123',
          }),
        });

        const response = await claimProfilePOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Échec de la mise à jour du profil');
      });
    });
  });
});
