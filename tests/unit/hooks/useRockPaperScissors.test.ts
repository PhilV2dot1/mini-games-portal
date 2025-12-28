import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRockPaperScissors, type Choice, type GameResult } from '@/hooks/useRockPaperScissors';

/**
 * useRockPaperScissors Hook Tests
 *
 * Tests for the Rock Paper Scissors game hook that manages:
 * - Game logic (Rock beats Scissors, Paper beats Rock, Scissors beats Paper)
 * - Free mode with random computer choice
 * - On-chain mode with blockchain transactions
 * - Stats tracking (wins, losses, ties, streaks)
 * - Transaction receipt parsing for instant results
 */

// Mock dependencies
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x1234567890ABCDEF1234567890ABCDEF12345678' as `0x${string}`,
    isConnected: true,
  })),
  useReadContract: vi.fn(() => ({
    data: [0n, 0n, 0n, 0n, 0n, 0n, 0n], // [wins, losses, ties, _, _, currentStreak, bestStreak]
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn(),
    data: undefined,
    isPending: false,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    data: null,
    isSuccess: false,
  })),
  usePublicClient: vi.fn(() => ({})),
}));

vi.mock('@/lib/contracts/rps-abi', () => ({
  RPS_CONTRACT_ADDRESS: '0xRPS' as `0x${string}`,
  RPS_CONTRACT_ABI: [],
}));

describe('useRockPaperScissors', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  test('should initialize with correct default state', () => {
    const { result } = renderHook(() => useRockPaperScissors());

    expect(result.current.mode).toBe('free');
    expect(result.current.status).toBe('idle');
    expect(result.current.stats).toEqual({ wins: 0, losses: 0, ties: 0 });
    expect(result.current.lastResult).toBeNull();
    expect(result.current.message).toBe('');
  });

  test('should have all required functions defined', () => {
    const { result } = renderHook(() => useRockPaperScissors());

    expect(typeof result.current.play).toBe('function');
    expect(typeof result.current.startGame).toBe('function');
    expect(typeof result.current.resetStats).toBe('function');
    expect(typeof result.current.switchMode).toBe('function');
  });

  // ============================================================================
  // Game Logic Tests (determineWinner)
  // ============================================================================

  test('should return tie when both choose the same', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    // Mock Math.random to return 0 (Rock)
    vi.spyOn(Math, 'random').mockReturnValue(0);

    await act(async () => {
      await result.current.play(0); // Player chooses Rock
    });

    // Need to advance timers for the 500ms delay
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult?.result).toBe('tie');
    });
  });

  test('should return win when Rock beats Scissors', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    // Mock Math.random to return 0.9 (will be floor(0.9 * 3) = 2 = Scissors)
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    await act(async () => {
      await result.current.play(0); // Player chooses Rock
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult?.result).toBe('win');
      expect(result.current.lastResult?.playerChoice).toBe(0);
      expect(result.current.lastResult?.computerChoice).toBe(2);
    });
  });

  test('should return win when Paper beats Rock', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    // Mock Math.random to return 0 (Rock)
    vi.spyOn(Math, 'random').mockReturnValue(0);

    await act(async () => {
      await result.current.play(1); // Player chooses Paper
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult?.result).toBe('win');
      expect(result.current.lastResult?.playerChoice).toBe(1);
      expect(result.current.lastResult?.computerChoice).toBe(0);
    });
  });

  test('should return win when Scissors beats Paper', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    // Mock Math.random to return 0.4 (will be floor(0.4 * 3) = 1 = Paper)
    vi.spyOn(Math, 'random').mockReturnValue(0.4);

    await act(async () => {
      await result.current.play(2); // Player chooses Scissors
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult?.result).toBe('win');
      expect(result.current.lastResult?.playerChoice).toBe(2);
      expect(result.current.lastResult?.computerChoice).toBe(1);
    });
  });

  test('should return lose when Rock loses to Paper', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    // Mock Math.random to return 0.4 (Paper)
    vi.spyOn(Math, 'random').mockReturnValue(0.4);

    await act(async () => {
      await result.current.play(0); // Player chooses Rock
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult?.result).toBe('lose');
    });
  });

  test('should return lose when Paper loses to Scissors', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    // Mock Math.random to return 0.9 (Scissors)
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    await act(async () => {
      await result.current.play(1); // Player chooses Paper
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult?.result).toBe('lose');
    });
  });

  test('should return lose when Scissors loses to Rock', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    // Mock Math.random to return 0 (Rock)
    vi.spyOn(Math, 'random').mockReturnValue(0);

    await act(async () => {
      await result.current.play(2); // Player chooses Scissors
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult?.result).toBe('lose');
    });
  });

  // ============================================================================
  // playFree Tests
  // ============================================================================

  test('should set status to processing then finished', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0);

    // Start playing
    act(() => {
      result.current.play(0);
    });

    // Status should be 'playing' immediately
    expect(result.current.status).toBe('playing');

    // Advance timers
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Status should be 'finished' after delay
    await waitFor(() => {
      expect(result.current.status).toBe('finished');
    });
  });

  test('should update stats on win in free mode', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    // Mock to always lose (player Rock vs computer Paper)
    vi.spyOn(Math, 'random').mockReturnValue(0.4);

    await act(async () => {
      await result.current.play(0);
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Change mock to win (player Rock vs computer Scissors)
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    await act(async () => {
      await result.current.play(0);
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.stats.wins).toBe(1);
      expect(result.current.stats.losses).toBe(1);
    });
  });

  test('should update stats on loss in free mode', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0.4); // Computer chooses Paper

    await act(async () => {
      await result.current.play(0); // Player chooses Rock
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.stats.losses).toBe(1);
    });
  });

  test('should update stats on tie in free mode', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0); // Computer chooses Rock

    await act(async () => {
      await result.current.play(0); // Player chooses Rock
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.stats.ties).toBe(1);
    });
  });

  test('should set correct message on win', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // Scissors

    await act(async () => {
      await result.current.play(0); // Rock
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.message).toContain('You Win');
    });
  });

  test('should set correct message on lose', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0.4); // Paper

    await act(async () => {
      await result.current.play(0); // Rock
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.message).toContain('You Lose');
    });
  });

  test('should set correct message on tie', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0); // Rock

    await act(async () => {
      await result.current.play(0); // Rock
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.message).toContain("It's a Tie");
    });
  });

  test('should have 500ms delay before result', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0);

    await act(async () => {
      await result.current.play(0);
    });

    // Before advancing timers
    expect(result.current.status).toBe('playing');
    expect(result.current.lastResult).toBeNull();

    // Advance 250ms (not enough)
    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.lastResult).toBeNull();

    // Advance another 250ms (total 500ms)
    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(result.current.lastResult).not.toBeNull();
    });
  });

  // ============================================================================
  // playOnChain Tests
  // ============================================================================

  test('should show error if not connected', async () => {
    vi.mocked(await import('wagmi')).useAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);

    const { result } = renderHook(() => useRockPaperScissors());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.play(0);
    });

    expect(result.current.message).toContain('connect your wallet');
    expect(result.current.status).toBe('idle');
  });

  test('should call writeContract when playing onchain', async () => {
    const mockWriteContract = vi.fn();

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContract: mockWriteContract,
      data: undefined,
      isPending: false,
    } as any);

    const { result } = renderHook(() => useRockPaperScissors());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.play(0); // Rock
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: '0xRPS',
      abi: [],
      functionName: 'jouer',
      args: [BigInt(0)],
    });
  });

  test('should clear lastResult while waiting for transaction', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    // Play a free game first
    vi.spyOn(Math, 'random').mockReturnValue(0);

    await act(async () => {
      await result.current.play(0);
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult).not.toBeNull();
    });

    // Switch to onchain and play again
    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.play(0);
    });

    expect(result.current.lastResult).toBeNull();
  });

  test('should prevent playing when status is processing', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0);

    // Start a game
    act(() => {
      result.current.play(0);
    });

    // Try to play again before first one finishes
    act(() => {
      result.current.play(1);
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should only have one result
    await waitFor(() => {
      expect(result.current.lastResult?.playerChoice).toBe(0);
    });
  });

  // ============================================================================
  // startGame Tests
  // ============================================================================

  test('should reset game state on startGame', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0);

    await act(async () => {
      await result.current.play(0);
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult).not.toBeNull();
    });

    act(() => {
      result.current.startGame();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.lastResult).toBeNull();
    expect(result.current.message).toBe('');
  });

  // ============================================================================
  // resetStats Tests
  // ============================================================================

  test('should reset stats in free mode', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // Win

    await act(async () => {
      await result.current.play(0);
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.stats.wins).toBe(1);
    });

    act(() => {
      result.current.resetStats();
    });

    expect(result.current.stats).toEqual({ wins: 0, losses: 0, ties: 0 });
  });

  test('should not reset stats in onchain mode', () => {
    const { result } = renderHook(() => useRockPaperScissors());

    act(() => {
      result.current.switchMode('onchain');
    });

    const statsBefore = result.current.stats;

    act(() => {
      result.current.resetStats();
    });

    // Stats should not be reset in onchain mode (they come from contract)
    expect(result.current.stats).toEqual(statsBefore);
  });

  test('should also reset game state when resetting stats', () => {
    const { result } = renderHook(() => useRockPaperScissors());

    act(() => {
      result.current.resetStats();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.lastResult).toBeNull();
    expect(result.current.message).toBe('');
  });

  // ============================================================================
  // switchMode Tests
  // ============================================================================

  test('should switch from free to onchain mode', () => {
    const { result } = renderHook(() => useRockPaperScissors());

    expect(result.current.mode).toBe('free');

    act(() => {
      result.current.switchMode('onchain');
    });

    expect(result.current.mode).toBe('onchain');
  });

  test('should switch from onchain to free mode', () => {
    const { result } = renderHook(() => useRockPaperScissors());

    act(() => {
      result.current.switchMode('onchain');
    });

    act(() => {
      result.current.switchMode('free');
    });

    expect(result.current.mode).toBe('free');
  });

  test('should reset game state when switching modes', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0);

    await act(async () => {
      await result.current.play(0);
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult).not.toBeNull();
    });

    act(() => {
      result.current.switchMode('onchain');
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.lastResult).toBeNull();
    expect(result.current.message).toBe('');
  });

  test('should reset stats when switching to free mode', () => {
    const { result } = renderHook(() => useRockPaperScissors());

    act(() => {
      result.current.switchMode('onchain');
    });

    act(() => {
      result.current.switchMode('free');
    });

    expect(result.current.stats).toEqual({ wins: 0, losses: 0, ties: 0 });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  test('should handle multiple games correctly', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.9) // Scissors (win for Rock)
      .mockReturnValueOnce(0.4) // Paper (lose for Rock)
      .mockReturnValueOnce(0); // Rock (tie)

    // Game 1 - Win
    await act(async () => {
      await result.current.play(0);
    });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Game 2 - Lose
    await act(async () => {
      await result.current.play(0);
    });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Game 3 - Tie
    await act(async () => {
      await result.current.play(0);
    });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.stats.wins).toBe(1);
      expect(result.current.stats.losses).toBe(1);
      expect(result.current.stats.ties).toBe(1);
    });
  });

  test('should handle all three player choices', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0);

    const choices: Choice[] = [0, 1, 2];

    for (const choice of choices) {
      await act(async () => {
        await result.current.play(choice);
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.lastResult?.playerChoice).toBe(choice);
      });

      act(() => {
        result.current.startGame();
      });
    }
  });

  test('should maintain isPending state correctly', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.play(0);
    });

    // During processing
    expect(result.current.isPending).toBe(false); // isPending is for write transaction

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // After finished
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  test('should generate result message with choices', async () => {
    const { result } = renderHook(() => useRockPaperScissors());

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // Scissors

    await act(async () => {
      await result.current.play(0); // Rock
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.lastResult?.message).toContain('🪨 Rock');
      expect(result.current.lastResult?.message).toContain('✂️ Scissors');
      expect(result.current.lastResult?.message).toContain('You Win');
    });
  });
});
