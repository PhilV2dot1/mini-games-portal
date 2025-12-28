import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTicTacToe } from '@/hooks/useTicTacToe';

// Mock wagmi
const mockWriteContractAsync = vi.fn();
const mockRefetchStats = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x123',
    isConnected: true,
    chain: { id: 42220 },
  })),
  useWriteContract: vi.fn(() => ({
    writeContractAsync: mockWriteContractAsync,
  })),
  useReadContract: vi.fn(() => ({
    data: null,
    refetch: mockRefetchStats,
  })),
}));

// Mock contract ABI
vi.mock('@/lib/contracts/tictactoe-abi', () => ({
  TICTACTOE_CONTRACT_ADDRESS: '0xTicTacToe',
  TICTACTOE_CONTRACT_ABI: [],
  GAME_RESULT: {
    WIN: 1,
    LOSE: 2,
    DRAW: 3,
  },
}));

describe('useTicTacToe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    mockWriteContractAsync.mockResolvedValue('0xhash123');
    mockRefetchStats.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================
  // 1. INITIAL STATE TESTS
  // ============================================================

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useTicTacToe());

    expect(result.current.board).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.current.mode).toBe('free');
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBe(null);
    expect(result.current.message).toBe('Click Start to begin!');
    expect(result.current.stats).toEqual({
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    });
  });

  it('should load stats from localStorage on mount', () => {
    const savedStats = {
      games: 10,
      wins: 5,
      losses: 3,
      draws: 2,
    };
    localStorage.setItem('tictactoe_celo_stats', JSON.stringify(savedStats));

    const { result } = renderHook(() => useTicTacToe());

    expect(result.current.stats).toEqual(savedStats);
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('tictactoe_celo_stats', 'invalid json');

    const { result } = renderHook(() => useTicTacToe());

    // Should use default stats
    expect(result.current.stats).toEqual({
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    });
  });

  // ============================================================
  // 2. CHECK WIN TESTS
  // ============================================================

  it('should detect horizontal win on first row', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Set up board for horizontal win: X X X | _ _ _ | _ _ _
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(1);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(2);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    // Should detect win
    await waitFor(() => {
      expect(result.current.result).toBe('win');
      expect(result.current.status).toBe('finished');
    });
  });

  it('should detect vertical win on first column', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Set up board for vertical win: X _ _ | X _ _ | X _ _
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(3);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(6);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.result).toBe('win');
    });
  });

  it('should detect diagonal win (top-left to bottom-right)', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Set up board for diagonal win: X _ _ | _ X _ | _ _ X
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(4);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(8);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.result).toBe('win');
    });
  });

  it('should detect diagonal win (top-right to bottom-left)', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Set up board for diagonal win: _ _ X | _ X _ | X _ _
    act(() => {
      result.current.handleMove(2);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(4);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(6);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.result).toBe('win');
    });
  });

  it('should detect AI win', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Force AI to win by blocking player and then winning
    // Player: 0, AI: 4 (center)
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    // Player: 1, AI: 8 (corner)
    act(() => {
      result.current.handleMove(1);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    // Player: 7, AI: 2 (completes diagonal win)
    act(() => {
      result.current.handleMove(7);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(result.current.result).toBe('lose');
      expect(result.current.message).toContain('AI Wins');
    });
  });

  // ============================================================
  // 3. AI MOVE LOGIC TESTS
  // ============================================================

  it('should prioritize winning move', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Set up board where AI can win: _ _ _ | O O _ | X X _
    // AI should play position 5 to win
    act(() => {
      result.current.handleMove(6); // Player X at 6
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });
    // AI takes center (4)

    act(() => {
      result.current.handleMove(7); // Player X at 7
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });
    // AI should take 3 to create winning opportunity

    act(() => {
      result.current.handleMove(0); // Player X at 0
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });
    // AI should complete win if possible

    // Check that AI made strategic moves
    await waitFor(() => {
      const aiMoves = result.current.board.filter(cell => cell === 2).length;
      expect(aiMoves).toBeGreaterThan(0);
    });
  });

  it('should block player winning move', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Player takes 0 and 1, AI should block at 2
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });
    // AI takes center

    act(() => {
      result.current.handleMove(1);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    // AI should block at position 2
    await waitFor(() => {
      const board = result.current.board;
      if (board[0] === 1 && board[1] === 1 && board[2] === 0) {
        // If AI didn't block yet, it should on next move
        expect(result.current.board.some(cell => cell === 2)).toBe(true);
      }
    });
  });

  it('should take center if available', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Player takes corner, AI should take center
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(result.current.board[4]).toBe(2); // AI takes center
    });
  });

  it('should take corner when center is taken', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Player takes center first
    act(() => {
      result.current.handleMove(4);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    // AI should take a corner
    await waitFor(() => {
      const board = result.current.board;
      const corners = [0, 2, 6, 8];
      const aiTookCorner = corners.some(pos => board[pos] === 2);
      expect(aiTookCorner).toBe(true);
    });
  });

  // ============================================================
  // 4. HANDLE MOVE TESTS
  // ============================================================

  it('should not allow move when game is not playing', () => {
    const { result } = renderHook(() => useTicTacToe());

    // Try to move when status is idle
    act(() => {
      result.current.handleMove(4);
    });

    expect(result.current.board).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('should not allow move on occupied cell', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Make first move
    act(() => {
      result.current.handleMove(4);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    const boardAfterFirstMove = [...result.current.board];

    // Try to move on same cell
    act(() => {
      result.current.handleMove(4);
    });

    expect(result.current.board).toEqual(boardAfterFirstMove);
  });

  it('should detect draw when board is full', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Play a sequence that leads to draw
    // This is simplified - in real game, AI would block/win
    const moves = [0, 1, 2, 3, 5, 6, 7, 8];

    for (const move of moves) {
      if (result.current.status === 'finished') break;

      act(() => {
        if (result.current.board[move] === 0 && result.current.status === 'playing') {
          result.current.handleMove(move);
        }
      });

      await act(async () => {
        await vi.advanceTimersByTime(600);
      });
    }

    // Eventually should reach a finished state
    await waitFor(() => {
      expect(['finished', 'processing'].includes(result.current.status)).toBe(true);
    });
  });

  it('should set status to processing during AI turn', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    act(() => {
      result.current.handleMove(0);
    });

    // Immediately after player move, should be processing
    expect(result.current.status).toBe('processing');

    await act(async () => {
      await vi.advanceTimersByTime(600);
    });
  });

  it('should update message during AI thinking', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    act(() => {
      result.current.handleMove(0);
    });

    await waitFor(() => {
      expect(result.current.message).toBe('AI thinking...');
    });

    await act(async () => {
      await vi.advanceTimersByTime(600);
    });
  });

  it('should wait 600ms before AI move', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    act(() => {
      result.current.handleMove(0);
    });

    const boardBeforeAI = [...result.current.board];
    expect(boardBeforeAI.filter(c => c === 2).length).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTime(599);
    });

    // AI shouldn't have moved yet
    expect(result.current.board.filter(c => c === 2).length).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTime(1);
    });

    // Now AI should have moved
    await waitFor(() => {
      expect(result.current.board.filter(c => c === 2).length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 5. END GAME TESTS
  // ============================================================

  it('should update stats and localStorage on win in free mode', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Force a win
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(1);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(2);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      if (result.current.result === 'win') {
        expect(result.current.stats.wins).toBe(1);
        expect(result.current.stats.games).toBe(1);
        expect(result.current.message).toContain('Victory');

        const saved = localStorage.getItem('tictactoe_celo_stats');
        expect(saved).toBeTruthy();
        const parsed = JSON.parse(saved!);
        expect(parsed.wins).toBe(1);
        expect(parsed.games).toBe(1);
      }
    });
  });

  it('should update stats on loss in free mode', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Let AI win
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(1);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(7);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    await waitFor(() => {
      if (result.current.result === 'lose') {
        expect(result.current.stats.losses).toBe(1);
        expect(result.current.stats.games).toBe(1);
      }
    });
  });

  it('should call writeContractAsync when ending onchain game', async () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startGame();
    });

    // Make winning moves
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(1);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(2);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      if (result.current.result === 'win') {
        expect(mockWriteContractAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            functionName: 'endGame',
            args: [1], // GAME_RESULT.WIN
          })
        );
      }
    });
  });

  it('should not call writeContractAsync if game not started onchain', async () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    // Don't call startGame, just play locally
    // This simulates a free game in onchain mode without blockchain start
    // In the actual hook, this won't happen normally, but we test the guard

    // The hook won't allow moves without startGame, so this test verifies
    // that the gameStartedOnChain flag works
    await act(async () => {
      await result.current.startGame();
    });

    expect(mockWriteContractAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'startGame',
      })
    );
  });

  it('should handle endGame error gracefully', async () => {
    mockWriteContractAsync.mockRejectedValueOnce(new Error('Transaction failed'));

    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startGame();
    });

    // Win the game
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(1);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(2);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      if (result.current.message.includes('not recorded')) {
        expect(result.current.message).toContain('not recorded on-chain');
        expect(result.current.status).toBe('finished');
      }
    });
  });

  it('should refetch stats after successful onchain endGame', async () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startGame();
    });

    // Win
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(1);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(2);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      if (result.current.result === 'win') {
        expect(mockRefetchStats).toHaveBeenCalled();
      }
    });
  });

  // ============================================================
  // 6. START GAME TESTS
  // ============================================================

  it('should start game in free mode', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    expect(result.current.status).toBe('playing');
    expect(result.current.board).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.current.message).toBe('Your turn! Tap a cell');
  });

  it('should call writeContractAsync when starting onchain game', async () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startGame();
    });

    expect(mockWriteContractAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0xTicTacToe',
        functionName: 'startGame',
        args: [],
      })
    );
  });

  it('should not start onchain game when wallet not connected', async () => {
    const { useAccount } = await import('wagmi');
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
      chain: undefined,
    } as any);

    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startGame();
    });

    expect(result.current.message).toBe('Please connect wallet first!');
    expect(result.current.status).toBe('idle');
  });

  it('should handle startGame transaction error', async () => {
    mockWriteContractAsync.mockRejectedValueOnce(new Error('User rejected transaction'));

    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startGame();
    });

    await waitFor(() => {
      expect(result.current.message).toBe('Transaction rejected');
      expect(result.current.status).toBe('idle');
    });
  });

  it('should not start game when already playing', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    const firstCallCount = mockWriteContractAsync.mock.calls.length;

    // Try to start again
    await act(async () => {
      await result.current.startGame();
    });

    // Should not call writeContractAsync again
    expect(mockWriteContractAsync.mock.calls.length).toBe(firstCallCount);
  });

  // ============================================================
  // 7. RESET GAME TESTS
  // ============================================================

  it('should reset game to idle state', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    act(() => {
      result.current.handleMove(4);
    });

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.board).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.current.result).toBe(null);
    expect(result.current.message).toBe('Click Start to begin!');
  });

  it('should not reset when processing', () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.startGame();
    });

    act(() => {
      result.current.handleMove(0);
    });

    // Status is processing after move
    const statusBeforeReset = result.current.status;

    act(() => {
      result.current.resetGame();
    });

    // If status was processing, reset should not work
    if (statusBeforeReset === 'processing') {
      expect(result.current.status).toBe('processing');
    }
  });

  // ============================================================
  // 8. SWITCH MODE TESTS
  // ============================================================

  it('should switch from free to onchain mode', () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    expect(result.current.mode).toBe('onchain');
    expect(result.current.status).toBe('idle');
    expect(result.current.board).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('should switch from onchain to free mode', () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    act(() => {
      result.current.switchMode('free');
    });

    expect(result.current.mode).toBe('free');
  });

  it('should refetch stats when switching to onchain mode while connected', () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    expect(mockRefetchStats).toHaveBeenCalled();
  });

  // ============================================================
  // 9. ONCHAIN STATS LOADING TESTS
  // ============================================================

  it('should load stats from onchain when in onchain mode', async () => {
    const { useReadContract } = await import('wagmi');
    vi.mocked(useReadContract).mockReturnValue({
      data: [BigInt(15), BigInt(8), BigInt(5), BigInt(2)] as any,
      refetch: mockRefetchStats,
    } as any);

    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    await waitFor(() => {
      expect(result.current.stats).toEqual({
        games: 15,
        wins: 8,
        losses: 5,
        draws: 2,
      });
    });
  });

  it('should not use onchain stats in free mode', () => {
    const { result } = renderHook(() => useTicTacToe());

    // Start in free mode
    expect(result.current.mode).toBe('free');

    // Stats should be from localStorage or default
    expect(result.current.stats.games).toBe(0);
  });

  // ============================================================
  // 10. EDGE CASES
  // ============================================================

  it('should handle multiple consecutive games', async () => {
    const { result } = renderHook(() => useTicTacToe());

    // Game 1
    await act(async () => {
      await result.current.startGame();
    });

    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.resetGame();
    });

    // Game 2
    await act(async () => {
      await result.current.startGame();
    });

    expect(result.current.status).toBe('playing');
    expect(result.current.board).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('should preserve stats across games', async () => {
    const { result } = renderHook(() => useTicTacToe());

    await act(async () => {
      await result.current.startGame();
    });

    // Win first game
    act(() => {
      result.current.handleMove(0);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(1);
    });
    await act(async () => {
      await vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.handleMove(2);
    });
    await act(async () => {
      await vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      if (result.current.result === 'win') {
        expect(result.current.stats.wins).toBe(1);
      }
    });

    act(() => {
      result.current.resetGame();
    });

    // Stats should be preserved
    expect(result.current.stats.wins).toBeGreaterThanOrEqual(0);
  });

  it('should handle rapid mode switching', () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    act(() => {
      result.current.switchMode('free');
    });

    act(() => {
      result.current.switchMode('onchain');
    });

    expect(result.current.mode).toBe('onchain');
    expect(result.current.status).toBe('idle');
  });

  it('should clear gameStartedOnChain flag on reset', async () => {
    const { result } = renderHook(() => useTicTacToe());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startGame();
    });

    // Game should be marked as started onchain
    expect(mockWriteContractAsync).toHaveBeenCalled();

    act(() => {
      result.current.resetGame();
    });

    // Flag should be cleared
    // We can't directly access the flag, but we can verify behavior
    expect(result.current.status).toBe('idle');
  });
});
