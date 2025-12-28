import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalStats } from '@/hooks/useLocalStats';
import { GameId, GameMode, GameResult } from '@/lib/types';

/**
 * useLocalStats Hook Tests
 *
 * Tests for the critical local statistics management hook.
 * This hook manages:
 * - localStorage persistence
 * - Database synchronization
 * - Point calculation with streak bonuses
 * - Account creation prompts
 * - Badge checking
 */

// Mock wagmi
const mockAddress = '0x1234567890abcdef';
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: undefined,
    isConnected: false,
  })),
}));

// Mock AuthProvider
const mockUser = { id: 'auth-user-123', email: 'test@example.com' };
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isAnonymous: true,
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('useLocalStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();

    // Default fetch mock (success)
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, userId: 'user-123' }),
    } as Response);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================
  // 1. INITIALIZATION & LOCALSTORAGE LOADING TESTS
  // ============================================================

  describe('Initialization & localStorage', () => {
    it('should initialize with default profile when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStats());

      expect(result.current.profile).toEqual({
        totalPoints: 0,
        gamesPlayed: 0,
        username: undefined,
        avatar_type: undefined,
        avatar_url: undefined,
        games: {
          blackjack: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          rps: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          tictactoe: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          jackpot: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          '2048': { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          mastermind: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
        },
      });
      expect(result.current.isLoaded).toBe(true);
    });

    it('should load stats from localStorage on mount', () => {
      const savedStats = {
        totalPoints: 500,
        gamesPlayed: 10,
        username: 'TestUser',
        games: {
          blackjack: { played: 10, wins: 5, losses: 5, totalPoints: 250, lastPlayed: Date.now() },
          rps: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          tictactoe: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          jackpot: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          '2048': { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          mastermind: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
        },
      };

      localStorage.setItem('celo_games_portal_stats', JSON.stringify(savedStats));

      const { result } = renderHook(() => useLocalStats());

      expect(result.current.profile.totalPoints).toBe(500);
      expect(result.current.profile.gamesPlayed).toBe(10);
      expect(result.current.profile.username).toBe('TestUser');
      expect(result.current.profile.games.blackjack.played).toBe(10);
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorage.setItem('celo_games_portal_stats', 'invalid-json{{{');

      const { result } = renderHook(() => useLocalStats());

      // Should fall back to default profile
      expect(result.current.profile.totalPoints).toBe(0);
      expect(result.current.profile.gamesPlayed).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse stored stats:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should set isLoaded to true after initialization', () => {
      const { result } = renderHook(() => useLocalStats());

      expect(result.current.isLoaded).toBe(true);
    });
  });

  // ============================================================
  // 2. LOCALSTORAGE PERSISTENCE TESTS
  // ============================================================

  describe('localStorage Persistence', () => {
    it('should save profile to localStorage when it changes', async () => {
      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });

      const stored = localStorage.getItem('celo_games_portal_stats');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.totalPoints).toBeGreaterThan(0);
      expect(parsed.gamesPlayed).toBe(1);
      expect(parsed.games.blackjack.played).toBe(1);
      expect(parsed.games.blackjack.wins).toBe(1);
    });

    it('should not save to localStorage before isLoaded is true', () => {
      // This is implicitly tested by initialization, but let's be explicit
      const { result } = renderHook(() => useLocalStats());

      // After initialization, isLoaded should be true
      expect(result.current.isLoaded).toBe(true);

      // localStorage should have been set (or be empty if default)
      const stored = localStorage.getItem('celo_games_portal_stats');
      if (stored) {
        expect(JSON.parse(stored)).toBeDefined();
      }
    });
  });

  // ============================================================
  // 3. POINT CALCULATION TESTS
  // ============================================================

  describe('Point Calculation', () => {
    it('should calculate points for free mode win (10 + 25 = 35)', async () => {
      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });

      // Free mode: 10 per game + 25 per win = 35 points
      expect(result.current.profile.totalPoints).toBe(35);
      expect(result.current.profile.games.blackjack.totalPoints).toBe(35);
    });

    it('should calculate points for free mode loss (10 + 0 = 10)', async () => {
      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'lose');
      });

      // Free mode: 10 per game + 0 per loss = 10 points
      expect(result.current.profile.totalPoints).toBe(10);
      expect(result.current.profile.games.blackjack.totalPoints).toBe(10);
    });

    it('should calculate points for onchain mode win (25 + 75 = 100)', async () => {
      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'onchain', 'win');
      });

      // Onchain mode: 25 per game + 75 per win = 100 points
      expect(result.current.profile.totalPoints).toBe(100);
      expect(result.current.profile.games.blackjack.totalPoints).toBe(100);
    });

    it('should calculate points for onchain mode loss (25 + 0 = 25)', async () => {
      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'onchain', 'lose');
      });

      // Onchain mode: 25 per game + 0 per loss = 25 points
      expect(result.current.profile.totalPoints).toBe(25);
      expect(result.current.profile.games.blackjack.totalPoints).toBe(25);
    });

    it('should apply streak bonus after 3 wins (10% bonus)', async () => {
      const { result } = renderHook(() => useLocalStats());

      // Win 3 games to build up streak
      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win'); // 35 points (no bonus yet)
      });
      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win'); // 35 points (no bonus yet)
      });
      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win'); // 35 points (no bonus yet)
      });

      // 4th win should have 10% bonus
      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win'); // floor(35 * 1.1) = 38 points
      });

      // Total: 35 + 35 + 35 + 38 = 143 points
      expect(result.current.profile.totalPoints).toBe(143);
      expect(result.current.profile.games.blackjack.wins).toBe(4);
    });

    it('should apply increasing streak bonus (20% at 6 wins)', async () => {
      const { result } = renderHook(() => useLocalStats());

      // Win 6 games
      for (let i = 0; i < 6; i++) {
        await act(async () => {
          await result.current.recordGame('blackjack', 'free', 'win');
        });
      }

      // 7th win should have 20% bonus (6 wins / 3 = 2 bonus levels = 20%)
      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });

      // First 3: 35 + 35 + 35 = 105
      // Next 3: floor(35 * 1.1) * 3 = 38 * 3 = 114
      // 7th: floor(35 * 1.2) = 42
      // Total: 105 + 114 + 42 = 261
      expect(result.current.profile.totalPoints).toBe(261);
    });
  });

  // ============================================================
  // 4. RECORD GAME TESTS
  // ============================================================

  describe('recordGame Function', () => {
    it('should update game stats correctly on win', async () => {
      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });

      const blackjackStats = result.current.profile.games.blackjack;
      expect(blackjackStats.played).toBe(1);
      expect(blackjackStats.wins).toBe(1);
      expect(blackjackStats.losses).toBe(0);
      expect(blackjackStats.lastPlayed).toBeGreaterThan(0);
    });

    it('should update game stats correctly on loss', async () => {
      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('rps', 'free', 'lose');
      });

      const rpsStats = result.current.profile.games.rps;
      expect(rpsStats.played).toBe(1);
      expect(rpsStats.wins).toBe(0);
      expect(rpsStats.losses).toBe(1);
    });

    it('should increment gamesPlayed counter', async () => {
      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });
      await act(async () => {
        await result.current.recordGame('rps', 'free', 'lose');
      });

      expect(result.current.profile.gamesPlayed).toBe(2);
    });

    it('should handle all game IDs correctly', async () => {
      const { result } = renderHook(() => useLocalStats());

      const gameIds: GameId[] = ['blackjack', 'rps', 'tictactoe', 'jackpot', '2048', 'mastermind'];

      for (const gameId of gameIds) {
        await act(async () => {
          await result.current.recordGame(gameId, 'free', 'win');
        });
      }

      expect(result.current.profile.gamesPlayed).toBe(6);
      gameIds.forEach(gameId => {
        expect(result.current.profile.games[gameId].played).toBe(1);
      });
    });

    it('should POST to /api/game/session when wallet is connected', async () => {
      const { useAccount } = await import('wagmi');
      vi.mocked(useAccount).mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any);

      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'onchain', 'win', '0xtxhash');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/game/session',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: mockAddress,
            gameId: 'blackjack',
            mode: 'onchain',
            result: 'win',
            txHash: '0xtxhash',
          }),
        })
      );
    });

    it('should POST to /api/game/session when user is authenticated', async () => {
      const { useAuth } = await import('@/components/auth/AuthProvider');
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isAnonymous: false,
      } as any);

      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('rps', 'free', 'win');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/game/session',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should check for new badges after recording game', async () => {
      // Use real timers for this test since waitFor doesn't work with fake timers
      vi.useRealTimers();

      const { useAuth } = await import('@/components/auth/AuthProvider');
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isAnonymous: false,
      } as any);

      // Mock successful game session response with userId
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, userId: 'user-123' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ newBadges: [{ name: 'First Win', icon: '🏆' }] }),
        } as Response);

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });

      await waitFor(() => {
        // Should have called /api/badges/check
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/badges/check',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ userId: 'user-123' }),
          })
        );

        // Should log the new badge
        expect(consoleLogSpy).toHaveBeenCalledWith('🎉 Badge Unlocked: 🏆 First Win');
      });

      consoleLogSpy.mockRestore();
      vi.useFakeTimers(); // Restore fake timers for subsequent tests
    });

    it('should handle game session API error gracefully', async () => {
      const { useAccount } = await import('wagmi');
      vi.mocked(useAccount).mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });

      // Should still update local stats
      expect(result.current.profile.gamesPlayed).toBe(1);

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to record game session to database');

      consoleErrorSpy.mockRestore();
    });

    it('should handle badge check API error gracefully', async () => {
      // Use real timers for this test since waitFor doesn't work with fake timers
      vi.useRealTimers();

      const { useAuth } = await import('@/components/auth/AuthProvider');
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isAnonymous: false,
      } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock game session success, badge check failure
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, userId: 'user-123' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocalStats());

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });

      // Should still update local stats
      expect(result.current.profile.gamesPlayed).toBe(1);

      await waitFor(() => {
        // Should log error
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error checking badges:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
      vi.useFakeTimers(); // Restore fake timers for subsequent tests
    });
  });

  // ============================================================
  // 5. DATABASE SYNCHRONIZATION TESTS
  // ============================================================

  describe('Database Synchronization', () => {
    it('should sync localStorage stats to database when user becomes authenticated', async () => {
      // Use real timers for this test since waitFor doesn't work with fake timers
      vi.useRealTimers();

      // Start with localStorage stats
      const savedStats = {
        totalPoints: 250,
        gamesPlayed: 5,
        games: {
          blackjack: { played: 5, wins: 3, losses: 2, totalPoints: 250, lastPlayed: Date.now() },
          rps: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          tictactoe: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          jackpot: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          '2048': { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          mastermind: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
        },
      };
      localStorage.setItem('celo_games_portal_stats', JSON.stringify(savedStats));

      const { useAuth } = await import('@/components/auth/AuthProvider');

      // Start as anonymous
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isAnonymous: true,
      } as any);

      const { rerender } = renderHook(() => useLocalStats());

      // No sync yet
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/auth/signup',
        expect.anything()
      );

      // User becomes authenticated
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isAnonymous: false,
      } as any);

      rerender();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/signup',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              authUserId: mockUser.id,
              localStats: savedStats,
            }),
          })
        );
      });

      vi.useFakeTimers(); // Restore fake timers for subsequent tests
    });

    it('should not sync if gamesPlayed is 0', async () => {
      localStorage.setItem('celo_games_portal_stats', JSON.stringify({
        totalPoints: 0,
        gamesPlayed: 0,
        games: {},
      }));

      const { useAuth } = await import('@/components/auth/AuthProvider');
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isAnonymous: false,
      } as any);

      renderHook(() => useLocalStats());

      // Wait a bit to ensure no sync happens
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/auth/signup',
        expect.anything()
      );
    });

    it('should only sync once (hasSyncedStats flag)', async () => {
      // Use real timers for this test since waitFor doesn't work with fake timers
      vi.useRealTimers();

      const savedStats = {
        totalPoints: 250,
        gamesPlayed: 5,
        games: {
          blackjack: { played: 5, wins: 3, losses: 2, totalPoints: 250, lastPlayed: Date.now() },
          rps: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          tictactoe: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          jackpot: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          '2048': { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          mastermind: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
        },
      };
      localStorage.setItem('celo_games_portal_stats', JSON.stringify(savedStats));

      const { useAuth } = await import('@/components/auth/AuthProvider');
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isAnonymous: false,
      } as any);

      const { rerender } = renderHook(() => useLocalStats());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', expect.anything());
      });

      const firstCallCount = vi.mocked(global.fetch).mock.calls.filter(
        call => call[0] === '/api/auth/signup'
      ).length;

      // Force re-render
      rerender();

      // Wait a bit to ensure no additional sync happens
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not call again
      const secondCallCount = vi.mocked(global.fetch).mock.calls.filter(
        call => call[0] === '/api/auth/signup'
      ).length;

      expect(secondCallCount).toBe(firstCallCount);

      vi.useFakeTimers(); // Restore fake timers for subsequent tests
    });

    it('should handle sync error gracefully', async () => {
      // Use real timers for this test since waitFor doesn't work with fake timers
      vi.useRealTimers();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorage.setItem('celo_games_portal_stats', JSON.stringify({
        totalPoints: 250,
        gamesPlayed: 5,
        games: {
          blackjack: { played: 5, wins: 3, losses: 2, totalPoints: 250, lastPlayed: Date.now() },
          rps: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          tictactoe: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          jackpot: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          '2048': { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
          mastermind: { played: 0, wins: 0, losses: 0, totalPoints: 0, lastPlayed: 0 },
        },
      }));

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const { useAuth } = await import('@/components/auth/AuthProvider');
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isAnonymous: false,
      } as any);

      renderHook(() => useLocalStats());

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error syncing stats to database:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
      vi.useFakeTimers(); // Restore fake timers for subsequent tests
    });
  });

  // ============================================================
  // 6. ACCOUNT CREATION PROMPT TESTS
  // ============================================================

  describe('Account Creation Prompt', () => {
    beforeEach(async () => {
      // Ensure useAuth returns anonymous user for these tests
      const { useAuth } = await import('@/components/auth/AuthProvider');
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isAnonymous: true,
      } as any);
    });

    it('should not show prompt initially', () => {
      const { result } = renderHook(() => useLocalStats());

      expect(result.current.showAccountPrompt).toBe(false);
    });

    it('should show prompt after 5 games for anonymous user', async () => {
      const { result } = renderHook(() => useLocalStats());

      // Verify initial state
      expect(result.current.isAnonymous).toBe(true);
      expect(result.current.isLoaded).toBe(true);

      // Play 5 games
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.recordGame('blackjack', 'free', 'win');
        });
      }

      // Verify gamesPlayed count
      expect(result.current.profile.gamesPlayed).toBe(5);

      // Wait for all state updates and effects to complete
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // The prompt should now be shown
      expect(result.current.showAccountPrompt).toBe(true);
    });

    it('should not show prompt if already dismissed', async () => {
      localStorage.setItem('account_prompt_dismissed', 'true');

      const { result } = renderHook(() => useLocalStats());

      // Play 5 games
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.recordGame('blackjack', 'free', 'win');
        });
      }

      expect(result.current.showAccountPrompt).toBe(false);
    });

    it('should not show prompt for authenticated users', async () => {
      const { useAuth } = await import('@/components/auth/AuthProvider');
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isAnonymous: false,
      } as any);

      const { result } = renderHook(() => useLocalStats());

      // Play 5 games
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.recordGame('blackjack', 'free', 'win');
        });
      }

      expect(result.current.showAccountPrompt).toBe(false);
    });

    it('should dismiss prompt and set flag', () => {
      const { result } = renderHook(() => useLocalStats());

      // Manually trigger prompt (simulate 5 games)
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordGame('blackjack', 'free', 'win');
        }
      });

      act(() => {
        result.current.dismissAccountPrompt();
      });

      expect(result.current.showAccountPrompt).toBe(false);
      expect(localStorage.getItem('account_prompt_dismissed')).toBe('true');
    });

    it('should clear dismissed flag', () => {
      localStorage.setItem('account_prompt_dismissed', 'true');

      const { result } = renderHook(() => useLocalStats());

      act(() => {
        result.current.clearDismissedPrompt();
      });

      expect(localStorage.getItem('account_prompt_dismissed')).toBeNull();
    });
  });

  // ============================================================
  // 7. HELPER FUNCTIONS TESTS
  // ============================================================

  describe('Helper Functions', () => {
    describe('getStats', () => {
      it('should return full profile when no gameId provided', () => {
        const { result } = renderHook(() => useLocalStats());

        const stats = result.current.getStats();

        expect(stats).toEqual(result.current.profile);
        expect(stats).toHaveProperty('totalPoints');
        expect(stats).toHaveProperty('gamesPlayed');
        expect(stats).toHaveProperty('games');
      });

      it('should return specific game stats when gameId provided', () => {
        const { result } = renderHook(() => useLocalStats());

        const blackjackStats = result.current.getStats('blackjack');

        expect(blackjackStats).toEqual({
          played: 0,
          wins: 0,
          losses: 0,
          totalPoints: 0,
          lastPlayed: 0,
        });
      });

      it('should return updated stats after recording game', async () => {
        const { result } = renderHook(() => useLocalStats());

        await act(async () => {
          await result.current.recordGame('rps', 'free', 'win');
        });

        const rpsStats = result.current.getStats('rps');

        expect(rpsStats).toMatchObject({
          played: 1,
          wins: 1,
          losses: 0,
          totalPoints: 35,
        });
      });
    });

    describe('resetStats', () => {
      it('should reset profile to default state', async () => {
        const { result } = renderHook(() => useLocalStats());

        // Record some games
        await act(async () => {
          await result.current.recordGame('blackjack', 'free', 'win');
          await result.current.recordGame('rps', 'free', 'lose');
        });

        expect(result.current.profile.gamesPlayed).toBe(2);
        expect(result.current.profile.totalPoints).toBeGreaterThan(0);

        // Reset
        act(() => {
          result.current.resetStats();
        });

        expect(result.current.profile.gamesPlayed).toBe(0);
        expect(result.current.profile.totalPoints).toBe(0);
        expect(result.current.profile.games.blackjack.played).toBe(0);
        expect(result.current.profile.games.rps.played).toBe(0);
      });

      it('should clear localStorage after reset', async () => {
        const { result } = renderHook(() => useLocalStats());

        await act(async () => {
          await result.current.recordGame('blackjack', 'free', 'win');
        });

        act(() => {
          result.current.resetStats();
        });

        const stored = localStorage.getItem('celo_games_portal_stats');
        const parsed = JSON.parse(stored!);

        expect(parsed.gamesPlayed).toBe(0);
        expect(parsed.totalPoints).toBe(0);
      });
    });
  });

  // ============================================================
  // 8. EDGE CASES & INTEGRATION TESTS
  // ============================================================

  describe('Edge Cases & Integration', () => {
    it('should handle rapid consecutive game recordings', async () => {
      // Ensure clean mock state
      const { useAuth } = await import('@/components/auth/AuthProvider');
      const { useAccount } = await import('wagmi');

      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isAnonymous: true,
      } as any);

      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any);

      const { result } = renderHook(() => useLocalStats());

      // Record 10 games sequentially to avoid overlapping act() calls
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.recordGame('blackjack', 'free', i % 2 === 0 ? 'win' : 'lose');
        });
      }

      expect(result.current.profile.gamesPlayed).toBe(10);
      expect(result.current.profile.games.blackjack.played).toBe(10);
      expect(result.current.profile.games.blackjack.wins).toBe(5);
      expect(result.current.profile.games.blackjack.losses).toBe(5);
    });

    it('should handle mixed game types', async () => {
      // Ensure clean mock state
      const { useAuth } = await import('@/components/auth/AuthProvider');
      const { useAccount } = await import('wagmi');

      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isAnonymous: true,
      } as any);

      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any);

      const { result } = renderHook(() => useLocalStats());

      // Verify hook rendered successfully
      expect(result.current).toBeTruthy();
      expect(result.current.recordGame).toBeDefined();

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });
      await act(async () => {
        await result.current.recordGame('rps', 'onchain', 'win');
      });
      await act(async () => {
        await result.current.recordGame('tictactoe', 'free', 'lose');
      });

      expect(result.current.profile.gamesPlayed).toBe(3);
      expect(result.current.profile.games.blackjack.played).toBe(1);
      expect(result.current.profile.games.rps.played).toBe(1);
      expect(result.current.profile.games.tictactoe.played).toBe(1);

      // blackjack free win: 35, rps onchain win: 100, tictactoe free loss: 10
      expect(result.current.profile.totalPoints).toBe(145);
    });

    it('should maintain lastPlayed timestamp', async () => {
      // Ensure clean mock state
      const { useAuth } = await import('@/components/auth/AuthProvider');
      const { useAccount } = await import('wagmi');

      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isAnonymous: true,
      } as any);

      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any);

      const { result } = renderHook(() => useLocalStats());

      // Verify hook rendered successfully
      expect(result.current).toBeTruthy();
      expect(result.current.recordGame).toBeDefined();

      const beforeTime = Date.now();

      await act(async () => {
        await result.current.recordGame('blackjack', 'free', 'win');
      });

      const afterTime = Date.now();

      const lastPlayed = result.current.profile.games.blackjack.lastPlayed;

      expect(lastPlayed).toBeGreaterThanOrEqual(beforeTime);
      expect(lastPlayed).toBeLessThanOrEqual(afterTime);
    });
  });
});

