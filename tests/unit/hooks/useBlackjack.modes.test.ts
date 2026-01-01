import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBlackjack } from '@/hooks/useBlackjack';
import type { Card, Outcome } from '@/lib/games/blackjack-cards';

/**
 * useBlackjack Modes Tests
 * Tests: Mode switching, Onchain, Edge cases
 */

const { mockCreateShuffledDeck, mockDetermineWinner } = vi.hoisted(() => ({
  mockCreateShuffledDeck: vi.fn<[], Card[]>(),
  mockDetermineWinner: vi.fn<[number, number, boolean], Outcome>(),
}));

vi.mock('@/lib/games/blackjack-cards', () => ({
  createShuffledDeck: mockCreateShuffledDeck,
  determineWinner: mockDetermineWinner,
  convertToCard: vi.fn(),
}));

vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: '0x1234' as `0x${string}`, isConnected: true, chain: { id: 42220 } })),
  useReadContract: vi.fn(() => ({ data: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n] })),
  useWriteContract: vi.fn(() => ({ writeContract: vi.fn() })),
  useWaitForTransactionReceipt: vi.fn(() => ({ data: null })),
  useSwitchChain: vi.fn(() => ({ switchChain: vi.fn() })),
}));

vi.mock('wagmi/chains', () => ({ celo: { id: 42220 } }));
vi.mock('viem', () => ({ parseEventLogs: vi.fn(() => []) }));
vi.mock('@/lib/contracts/blackjack-abi', () => ({
  CONTRACT_ADDRESS: '0xBLACKJACK' as `0x${string}`,
  CONTRACT_ABI: [],
}));

describe('useBlackjack - Modes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateShuffledDeck.mockReturnValue([
      { value: 5, suit: '♠', display: '5' },
      { value: 7, suit: '♥', display: '7' },
      { value: 10, suit: '♦', display: '10' },
      { value: 6, suit: '♣', display: '6' },
    ]);
    mockDetermineWinner.mockReturnValue('win');
  });

  test('should switch to onchain mode', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.switchMode('onchain'));
    expect(result.current.mode).toBe('onchain');
  });

  test('should reset game on mode switch', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    expect(result.current.gamePhase).toBe('playing');
    act(() => result.current.switchMode('onchain'));
    expect(result.current.gamePhase).toBe('betting');
    expect(result.current.playerHand).toHaveLength(0);
  });

  test('should reset stats on switch to free', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    act(() => result.current.stand());
    expect(result.current.stats.wins).toBe(1);
    act(() => result.current.switchMode('onchain'));
    act(() => result.current.switchMode('free'));
    expect(result.current.stats.wins).toBe(0);
  });

  test('should not allow hit in onchain mode', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.switchMode('onchain'));
    act(() => result.current.hit());
    expect(result.current.playerHand).toHaveLength(0);
  });

  test('should not allow stand in onchain mode', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.switchMode('onchain'));
    act(() => result.current.stand());
    expect(result.current.gamePhase).toBe('betting');
  });

  test('should not newGame in onchain mode', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.switchMode('onchain'));
    act(() => result.current.newGame());
    expect(result.current.gamePhase).toBe('betting');
  });

  test('should not reset credits in onchain', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.switchMode('onchain'));
    act(() => result.current.resetCredits());
    expect(result.current.mode).toBe('onchain');
  });

  test('should never have negative credits', () => {
    mockDetermineWinner.mockReturnValue('lose');
    const { result } = renderHook(() => useBlackjack());
    for (let i = 0; i < 200; i++) {
      if (result.current.credits >= 10) {
        act(() => result.current.newGame());
        act(() => result.current.stand());
      }
    }
    expect(result.current.credits).toBeGreaterThanOrEqual(0);
  });

  test('should maintain state after multiple games', () => {
    mockDetermineWinner.mockReturnValueOnce('win').mockReturnValueOnce('lose').mockReturnValueOnce('win');
    const { result } = renderHook(() => useBlackjack());
    for (let i = 0; i < 3; i++) {
      act(() => result.current.newGame());
      act(() => result.current.stand());
    }
    expect(result.current.stats.wins).toBe(2);
    expect(result.current.stats.losses).toBe(1);
  });

  test('should not allow hit before game starts', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.hit());
    expect(result.current.playerHand).toHaveLength(0);
  });
});
