import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBlackjack } from '@/hooks/useBlackjack';
import type { Card, Outcome } from '@/lib/games/blackjack-cards';

/**
 * useBlackjack Gameplay Tests
 * Tests: Hit, Stand, Bust, Credits
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

describe('useBlackjack - Gameplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateShuffledDeck.mockReturnValue([
      { value: 5, suit: '♠', display: '5' },
      { value: 7, suit: '♥', display: '7' },
      { value: 10, suit: '♦', display: '10' },
      { value: 6, suit: '♣', display: '6' },
      { value: 3, suit: '♠', display: '3' },
    ]);
    mockDetermineWinner.mockReturnValue('win');
  });

  test('should add card when hitting', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    const sizeBefore = result.current.playerHand.length;
    act(() => result.current.hit());
    expect(result.current.playerHand.length).toBe(sizeBefore + 1);
  });

  test('should detect bust on hit', () => {
    mockCreateShuffledDeck.mockReturnValueOnce([
      { value: 10, suit: '♠', display: '10' },
      { value: 10, suit: '♥', display: '10' },
      { value: 5, suit: '♦', display: '5' },
      { value: 6, suit: '♣', display: '6' },
      { value: 5, suit: '♠', display: '5' },
    ]);
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    act(() => result.current.hit());
    expect(result.current.outcome).toBe('lose');
    expect(result.current.gamePhase).toBe('finished');
  });

  test('should deduct credits on bust', () => {
    mockCreateShuffledDeck.mockReturnValueOnce([
      { value: 10, suit: '♠', display: '10' },
      { value: 10, suit: '♥', display: '10' },
      { value: 5, suit: '♦', display: '5' },
      { value: 6, suit: '♣', display: '6' },
      { value: 5, suit: '♠', display: '5' },
    ]);
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    const creditsBefore = result.current.credits;
    act(() => result.current.hit());
    expect(result.current.credits).toBe(creditsBefore - 10);
  });

  test('should reveal dealer card on stand', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    expect(result.current.showDealerCard).toBe(false);
    act(() => result.current.stand());
    expect(result.current.showDealerCard).toBe(true);
  });

  test('should add credits on win', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    const creditsBefore = result.current.credits;
    act(() => result.current.stand());
    expect(result.current.credits).toBe(creditsBefore + 10);
  });

  test('should deduct credits on lose', () => {
    mockDetermineWinner.mockReturnValueOnce('lose');
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    const creditsBefore = result.current.credits;
    act(() => result.current.stand());
    expect(result.current.credits).toBe(creditsBefore - 10);
  });

  test('should not change credits on push', () => {
    mockDetermineWinner.mockReturnValueOnce('push');
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    const creditsBefore = result.current.credits;
    act(() => result.current.stand());
    expect(result.current.credits).toBe(creditsBefore);
  });

  test('should increment wins on win', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    act(() => result.current.stand());
    expect(result.current.stats.wins).toBe(1);
  });

  test('should track win streak', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    act(() => result.current.stand());
    expect(result.current.stats.currentStreak).toBe(1);
    act(() => result.current.newGame());
    act(() => result.current.stand());
    expect(result.current.stats.currentStreak).toBe(2);
  });

  test('should break streak on loss', () => {
    mockDetermineWinner.mockReturnValueOnce('win').mockReturnValueOnce('lose');
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    act(() => result.current.stand());
    act(() => result.current.newGame());
    act(() => result.current.stand());
    expect(result.current.stats.currentStreak).toBe(0);
  });

  test('should prevent game with low credits', () => {
    mockDetermineWinner.mockReturnValue('lose');
    const { result } = renderHook(() => useBlackjack());
    while (result.current.credits >= 10) {
      act(() => result.current.newGame());
      act(() => result.current.stand());
    }
    act(() => result.current.newGame());
    expect(result.current.message).toContain('Not enough credits');
  });

  test('should reset credits to 1000', () => {
    const { result } = renderHook(() => useBlackjack());
    act(() => result.current.newGame());
    act(() => result.current.resetCredits());
    expect(result.current.credits).toBe(1000);
  });
});
