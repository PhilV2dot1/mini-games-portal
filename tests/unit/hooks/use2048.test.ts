import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { use2048 } from '@/hooks/use2048';
import type { Grid, Direction } from '@/lib/games/2048-logic';
import * as game2048Logic from '@/lib/games/2048-logic';

/**
 * use2048 Hook Tests
 *
 * Tests for the 2048 game hook that manages:
 * - Game grid state and initialization
 * - Move handling (up, down, left, right)
 * - Score tracking
 * - Win/loss detection
 * - Keyboard controls
 * - Free and on-chain game modes
 * - On-chain game start with fee payment
 * - Score submission to blockchain
 */

// Mock dependencies
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x1234567890ABCDEF1234567890ABCDEF12345678' as `0x${string}`,
    isConnected: true,
    chain: { id: 42220 },
  })),
  useWriteContract: vi.fn(() => ({
    writeContractAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('wagmi/chains', () => ({
  celo: { id: 42220, name: 'Celo' },
  base: { id: 8453, name: 'Base' },
}));

vi.mock('@/lib/contracts/addresses', () => ({
  getContractAddress: () => '0x2048' as `0x${string}`,
  isGameAvailableOnChain: () => true,
  isSupportedChain: () => true,
  getChainName: () => 'celo',
  CHAIN_CONFIG: {},
  CONTRACT_ADDRESSES: {},
}));

vi.mock('@/lib/contracts/2048-abi', () => ({
  GAME2048_CONTRACT_ADDRESS: '0x2048' as `0x${string}`,
  GAME2048_CONTRACT_ABI: [],
  GAME_FEE: '10000000000000000', // 0.01 CELO
}));

describe('use2048', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  test('should initialize with correct default state', () => {
    const mockGrid: Grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 0],
    ];

    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: mockGrid,
      score: 0,
    });

    const { result } = renderHook(() => use2048());

    expect(result.current.grid).toEqual(mockGrid);
    expect(result.current.score).toBe(0);
    expect(result.current.mode).toBe('free');
    expect(result.current.status).toBe('playing');
    expect(result.current.gameStartedOnChain).toBe(false);
  });

  test('should have all required functions defined', () => {
    const { result } = renderHook(() => use2048());

    expect(typeof result.current.handleMove).toBe('function');
    expect(typeof result.current.startNewGame).toBe('function');
    expect(typeof result.current.submitScore).toBe('function');
    expect(typeof result.current.switchMode).toBe('function');
  });

  test('should initialize grid with 2 tiles', () => {
    const mockGrid: Grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 0],
    ];

    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: mockGrid,
      score: 0,
    });

    const { result } = renderHook(() => use2048());

    // Count non-zero tiles
    const nonZeroTiles = result.current.grid.flat().filter(val => val !== 0);
    expect(nonZeroTiles.length).toBe(2);
  });

  // ============================================================================
  // handleMove Tests
  // ============================================================================

  test('should update grid when move is valid', () => {
    const initialGrid: Grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const movedGrid: Grid = [
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: initialGrid,
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: movedGrid,
      score: 0,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue(movedGrid);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.handleMove('right');
    });

    expect(game2048Logic.move).toHaveBeenCalledWith(initialGrid, 'right');
    expect(result.current.grid).toEqual(movedGrid);
  });

  test('should not update grid when move is invalid', () => {
    const initialGrid: Grid = [
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: initialGrid,
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: initialGrid,
      score: 0,
      moved: false, // No move happened
    });

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.handleMove('right');
    });

    // Grid should not change
    expect(result.current.grid).toEqual(initialGrid);
  });

  test('should update score after valid move', () => {
    const initialGrid: Grid = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const movedGrid: Grid = [
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: initialGrid,
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: movedGrid,
      score: 4, // Merging 2+2 gives score 4
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue(movedGrid);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.handleMove('left');
    });

    expect(result.current.score).toBe(4);
  });

  test('should accumulate score across multiple moves', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move')
      .mockReturnValueOnce({ newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], score: 4, moved: true })
      .mockReturnValueOnce({ newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], score: 8, moved: true })
      .mockReturnValueOnce({ newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], score: 16, moved: true });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.handleMove('left');
    });
    expect(result.current.score).toBe(4);

    act(() => {
      result.current.handleMove('right');
    });
    expect(result.current.score).toBe(12); // 4 + 8

    act(() => {
      result.current.handleMove('up');
    });
    expect(result.current.score).toBe(28); // 12 + 16
  });

  test('should add random tile after valid move', () => {
    const gridAfterMove: Grid = [
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const gridWithNewTile: Grid = [
      [4, 0, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: gridAfterMove,
      score: 4,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue(gridWithNewTile);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.handleMove('left');
    });

    expect(game2048Logic.addRandomTile).toHaveBeenCalledWith(gridAfterMove);
    expect(result.current.grid).toEqual(gridWithNewTile);
  });

  test('should detect win condition when 2048 tile is reached', () => {
    const gridWith2048: Grid = [
      [2048, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: gridWith2048,
      score: 2048,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue(gridWith2048);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(true);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.handleMove('left');
    });

    expect(result.current.status).toBe('won');
  });

  test('should detect loss condition when no valid moves remain', () => {
    const fullGrid: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];

    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: fullGrid,
      score: 0,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue(fullGrid);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(false); // No valid moves

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.handleMove('down');
    });

    expect(result.current.status).toBe('lost');
  });

  test('should handle all four directions', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    const { result } = renderHook(() => use2048());

    const directions: Direction[] = ['up', 'down', 'left', 'right'];

    directions.forEach(direction => {
      act(() => {
        result.current.handleMove(direction);
      });

      expect(game2048Logic.move).toHaveBeenCalledWith(expect.anything(), direction);
    });
  });

  // ============================================================================
  // Keyboard Controls Tests
  // ============================================================================

  test('should handle ArrowUp key', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    renderHook(() => use2048());

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(game2048Logic.move).toHaveBeenCalledWith(expect.anything(), 'up');
  });

  test('should handle ArrowDown key', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    renderHook(() => use2048());

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(game2048Logic.move).toHaveBeenCalledWith(expect.anything(), 'down');
  });

  test('should handle ArrowLeft key', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    renderHook(() => use2048());

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(game2048Logic.move).toHaveBeenCalledWith(expect.anything(), 'left');
  });

  test('should handle ArrowRight key', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    renderHook(() => use2048());

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(game2048Logic.move).toHaveBeenCalledWith(expect.anything(), 'right');
  });

  test('should ignore non-arrow keys', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
      moved: true,
    });

    renderHook(() => use2048());

    const event = new KeyboardEvent('keydown', { key: 'a' });

    act(() => {
      window.dispatchEvent(event);
    });

    // Should not call move for non-arrow keys
    expect(game2048Logic.move).not.toHaveBeenCalled();
  });

  // ============================================================================
  // startNewGame Tests
  // ============================================================================

  test('should start new game in free mode', () => {
    const newGrid: Grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 0],
    ];

    vi.spyOn(game2048Logic, 'initializeGame')
      .mockReturnValueOnce({ grid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], score: 0 })
      .mockReturnValueOnce({ grid: newGrid, score: 0 });

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.startNewGame();
    });

    expect(result.current.grid).toEqual(newGrid);
    expect(result.current.score).toBe(0);
    expect(result.current.status).toBe('playing');
  });

  test('should alert if trying to start onchain game without wallet connection', async () => {
    vi.mocked(await import('wagmi')).useAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startNewGame();
    });

    expect(window.alert).toHaveBeenCalledWith('Please connect your wallet first!');
  });

  test('should call writeContractAsync with game fee in onchain mode', async () => {
    const mockWriteContractAsync = vi.fn().mockResolvedValue(undefined);

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
    } as any);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startNewGame();
    });

    expect(mockWriteContractAsync).toHaveBeenCalledWith({
      address: '0x2048',
      abi: [],
      functionName: 'startGame',
    });
  });

  test('should set gameStartedOnChain to true after onchain game starts', async () => {
    const mockWriteContractAsync = vi.fn().mockResolvedValue(undefined);

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
    } as any);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startNewGame();
    });

    await waitFor(() => {
      expect(result.current.gameStartedOnChain).toBe(true);
    });
  });

  test('should handle writeContract error gracefully', async () => {
    const mockWriteContractAsync = vi.fn().mockRejectedValue(new Error('Transaction failed'));

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
    } as any);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startNewGame();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to start on-chain game:', expect.any(Error));
    expect(result.current.gameStartedOnChain).toBe(false);
  });

  // ============================================================================
  // submitScore Tests
  // ============================================================================

  test('should submit score in onchain mode after game started', async () => {
    const mockWriteContractAsync = vi.fn().mockResolvedValue(undefined);

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
    } as any);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    // Start game
    await act(async () => {
      await result.current.startNewGame();
    });

    // Mock some score
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 2048,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 2048,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(true);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    act(() => {
      result.current.handleMove('left');
    });

    // Submit score
    await act(async () => {
      await result.current.submitScore();
    });

    expect(mockWriteContractAsync).toHaveBeenCalledWith({
      address: '0x2048',
      abi: [],
      functionName: 'submitScore',
      args: [expect.any(BigInt), true], // score as BigInt, won=true
    });
  });

  test('should not submit score in free mode', async () => {
    const mockWriteContractAsync = vi.fn();

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
    } as any);

    const { result } = renderHook(() => use2048());

    // In free mode by default
    await act(async () => {
      await result.current.submitScore();
    });

    expect(mockWriteContractAsync).not.toHaveBeenCalled();
  });

  test('should not submit score if game was not started onchain', async () => {
    const mockWriteContractAsync = vi.fn();

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
    } as any);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    // Don't start game, just try to submit
    await act(async () => {
      await result.current.submitScore();
    });

    expect(mockWriteContractAsync).not.toHaveBeenCalled();
  });

  test('should set gameStartedOnChain to false after successful submit', async () => {
    const mockWriteContractAsync = vi.fn().mockResolvedValue(undefined);

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
    } as any);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startNewGame();
    });

    expect(result.current.gameStartedOnChain).toBe(true);

    await act(async () => {
      await result.current.submitScore();
    });

    await waitFor(() => {
      expect(result.current.gameStartedOnChain).toBe(false);
    });
  });

  test('should handle submit score error gracefully', async () => {
    const mockWriteContractAsync = vi.fn()
      .mockResolvedValueOnce(undefined) // startGame success
      .mockRejectedValueOnce(new Error('Submit failed')); // submitScore fails

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
    } as any);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startNewGame();
    });

    await act(async () => {
      await result.current.submitScore();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to submit score:', expect.any(Error));
  });

  // ============================================================================
  // switchMode Tests
  // ============================================================================

  test('should switch from free to onchain mode', () => {
    const { result } = renderHook(() => use2048());

    expect(result.current.mode).toBe('free');

    act(() => {
      result.current.switchMode('onchain');
    });

    expect(result.current.mode).toBe('onchain');
  });

  test('should switch from onchain to free mode', () => {
    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    act(() => {
      result.current.switchMode('free');
    });

    expect(result.current.mode).toBe('free');
  });

  test('should reset game state when switching modes', () => {
    const newGrid: Grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 0],
    ];

    vi.spyOn(game2048Logic, 'initializeGame')
      .mockReturnValueOnce({ grid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], score: 0 })
      .mockReturnValueOnce({ grid: newGrid, score: 0 });

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    expect(result.current.grid).toEqual(newGrid);
    expect(result.current.score).toBe(0);
    expect(result.current.status).toBe('playing');
    expect(result.current.gameStartedOnChain).toBe(false);
  });

  test('should reset gameStartedOnChain when switching modes', async () => {
    const mockWriteContractAsync = vi.fn().mockResolvedValue(undefined);

    vi.mocked(await import('wagmi')).useWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
    } as any);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.switchMode('onchain');
    });

    await act(async () => {
      await result.current.startNewGame();
    });

    expect(result.current.gameStartedOnChain).toBe(true);

    act(() => {
      result.current.switchMode('free');
    });

    expect(result.current.gameStartedOnChain).toBe(false);
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  test('should handle multiple moves without errors', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    const { result } = renderHook(() => use2048());

    // Make 10 moves
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.handleMove(['up', 'down', 'left', 'right'][i % 4] as Direction);
      });
    }

    expect(result.current.status).toBe('playing');
  });

  test('should maintain status after winning', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 2048,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(true);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(true);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.handleMove('left');
    });

    expect(result.current.status).toBe('won');

    // Try to move again (should still be won)
    act(() => {
      result.current.handleMove('right');
    });

    expect(result.current.status).toBe('won');
  });

  test('should maintain status after losing', () => {
    vi.spyOn(game2048Logic, 'initializeGame').mockReturnValue({
      grid: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      score: 0,
    });

    vi.spyOn(game2048Logic, 'move').mockReturnValue({
      newGrid: [[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]],
      score: 0,
      moved: true,
    });

    vi.spyOn(game2048Logic, 'addRandomTile').mockReturnValue([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]);
    vi.spyOn(game2048Logic, 'hasWon').mockReturnValue(false);
    vi.spyOn(game2048Logic, 'hasValidMoves').mockReturnValue(false);

    const { result } = renderHook(() => use2048());

    act(() => {
      result.current.handleMove('down');
    });

    expect(result.current.status).toBe('lost');

    // Try to move again (should still be lost)
    act(() => {
      result.current.handleMove('up');
    });

    expect(result.current.status).toBe('lost');
  });
});
