import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useJackpot } from '@/hooks/useJackpot';

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
}));

// Mock the JACKPOT contract config
vi.mock('@/lib/contracts/jackpot-abi', () => ({
  JACKPOT_CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
  JACKPOT_CONTRACT_ABI: [],
}));

// Import the mocked functions after the mock is defined
import { useAccount, useWriteContract } from 'wagmi';

// Mock crypto addresses
const MOCK_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const MOCK_TX_HASH = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

const mockUseAccount = vi.mocked(useAccount);
const mockUseWriteContract = vi.mocked(useWriteContract);

describe('useJackpot', () => {
  // Mock function
  const mockWriteContractAsync = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();

    // Clear call history but keep implementations
    mockUseAccount.mockClear();
    mockUseWriteContract.mockClear();
    mockWriteContractAsync.mockClear();

    // Reset to default return values
    mockUseAccount.mockReturnValue({
      address: MOCK_WALLET_ADDRESS,
      isConnected: true,
      chain: { id: 42220 },
    });

    mockUseWriteContract.mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
      isPending: false,
      error: null,
    });

    mockWriteContractAsync.mockResolvedValue(MOCK_TX_HASH);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    mockWriteContractAsync.mockClear();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useJackpot());

      expect(result.current.state).toBe('idle');
      expect(result.current.mode).toBe('free');
      expect(result.current.totalScore).toBe(0);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.isSpinning).toBe(false);
      expect(result.current.sessionId).toBeNull();
    });

    it('should initialize in free mode when no wallet connected', () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      });

      const { result } = renderHook(() => useJackpot());

      expect(result.current.mode).toBe('free');
    });

    it('should allow switching to onchain mode when wallet connected', () => {
      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      expect(result.current.mode).toBe('onchain');
    });
  });

  describe('Free Mode - Weighted Random Outcomes', () => {
    it('should return jackpot outcome (BTC) when random is in first 2% range', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // Within 2% range

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      expect(result.current.state).toBe('spinning');
      expect(result.current.isSpinning).toBe(true);

      // Fast-forward spin animation (3s)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.state).toBe('result');
      expect(result.current.lastResult).toEqual({
        score: 1000,
        isJackpot: true,
        badge: 'Gold',
      });

      // Fast-forward score update (3.5s)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });

      expect(result.current.totalScore).toBe(1000);
      expect(result.current.isSpinning).toBe(false);
    });

    it('should return ETH outcome when random is in 2-7% range', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.04); // Within 2-7% range (weight 5)

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.lastResult).toEqual({
        score: 500,
        isJackpot: false,
        badge: 'Gold',
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });

      expect(result.current.totalScore).toBe(500);
    });

    it('should return XRP outcome when random is in 7-15% range', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.10); // Within 7-15% range (weight 8)

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.lastResult).toEqual({
        score: 250,
        isJackpot: false,
        badge: 'Silver',
      });
    });

    it('should return BNB outcome when random is in 15-27% range', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.20); // Within 15-27% range (weight 12)

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.lastResult).toEqual({
        score: 100,
        isJackpot: false,
        badge: 'Silver',
      });
    });

    it('should return SOL outcome when random is in 27-42% range', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.35); // Within 27-42% range (weight 15)

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.lastResult).toEqual({
        score: 50,
        isJackpot: false,
        badge: undefined,
      });
    });

    it('should return CELO outcome when random is in 42-60% range', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.50); // Within 42-60% range (weight 18)

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.lastResult).toEqual({
        score: 25,
        isJackpot: false,
        badge: undefined,
      });
    });

    it('should return OP outcome when random is in 60-80% range', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.70); // Within 60-80% range (weight 20)

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.lastResult).toEqual({
        score: 10,
        isJackpot: false,
        badge: undefined,
      });
    });

    it('should return MISS outcome when random is in 80-100% range', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.90); // Within 80-100% range (weight 20)

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.lastResult).toEqual({
        score: 0,
        isJackpot: false,
        badge: undefined,
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });

      expect(result.current.totalScore).toBe(0);
    });
  });

  describe('Free Mode - Spin Mechanics', () => {
    it('should not allow spin while already spinning', async () => {
      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      expect(result.current.isSpinning).toBe(true);

      // Try to spin again
      act(() => {
        result.current.spin();
      });

      // Should still only have one spin in progress
      expect(result.current.state).toBe('spinning');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });
    });

    it('should accumulate score across multiple spins', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.20) // BNB: 100 points
        .mockReturnValueOnce(0.35) // SOL: 50 points
        .mockReturnValueOnce(0.50); // CELO: 25 points

      const { result } = renderHook(() => useJackpot());

      // First spin
      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.totalScore).toBe(100);

      // Second spin
      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.totalScore).toBe(150);

      // Third spin
      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.totalScore).toBe(175);
    });

    it('should update totalScore only after delay completes', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.20); // BNB: 100 points

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      // After 3s (spin completes)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.state).toBe('result');
      expect(result.current.lastResult?.score).toBe(100);
      expect(result.current.totalScore).toBe(0); // Not updated yet

      // After additional 3.5s (score update delay)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });

      expect(result.current.totalScore).toBe(100); // Now updated
      expect(result.current.isSpinning).toBe(false);
    });

    it('should handle MISS outcome (zero points)', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.90); // MISS: 0 points

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.lastResult?.score).toBe(0);
      expect(result.current.totalScore).toBe(0);
    });
  });

  describe('Onchain Mode', () => {
    it('should not allow spin in onchain mode without wallet', async () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      });

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.state).toBe('idle');
      expect(mockWriteContractAsync).not.toHaveBeenCalled();
    });

    it('should initiate smart contract transaction when spinning in onchain mode', async () => {
      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      // Don't await - just trigger the spin
      act(() => {
        result.current.spin();
      });

      // Advance timers slightly to allow async contract call
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(mockWriteContractAsync).toHaveBeenCalled();
      expect(mockWriteContractAsync).toHaveBeenCalledWith({
        address: expect.any(String),
        abi: expect.any(Array),
        functionName: 'startParty',
        args: [BigInt(1)], // Hardcoded FID in the hook
      });

      expect(result.current.state).toBe('spinning');
    });

    it('should complete spin with result in onchain mode', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // Jackpot

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      act(() => {
        result.current.spin();
      });

      // Advance timers for spin animation (3000ms)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.state).toBe('result');
      expect(result.current.lastResult?.isJackpot).toBe(true);
      expect(result.current.lastResult?.score).toBe(1000);

      // Advance timers for score update delay (3500ms)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });

      expect(result.current.totalScore).toBe(1000);
      expect(result.current.isSpinning).toBe(false);
    });

    it('should handle transaction error gracefully', async () => {
      const txError = new Error('Transaction rejected');
      mockWriteContractAsync.mockRejectedValue(txError);

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.isSpinning).toBe(false);
    });

    it('should show isPending as true when contract write is pending', () => {
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: true,
        error: null,
      });

      const { result } = renderHook(() => useJackpot());

      expect(result.current.isSpinning).toBe(true);
    });

    it('should set sessionId as bigint timestamp', async () => {
      const mockTimestamp = 1700000000000;
      vi.setSystemTime(new Date(mockTimestamp));

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.sessionId).toBe(BigInt(mockTimestamp));
    });

    it('should accumulate score across onchain spins', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.20) // BNB: 100 points
        .mockReturnValueOnce(0.35); // SOL: 50 points

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      // First spin
      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.totalScore).toBe(100);

      // Second spin
      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.totalScore).toBe(150);
    });
  });

  describe('Score Submission', () => {
    it('should submit score to smart contract in onchain mode', async () => {
      const mockTimestamp = 1700000000000;
      vi.setSystemTime(new Date(mockTimestamp));

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      const sessionId = result.current.sessionId;
      const score = result.current.lastResult?.score;

      await act(async () => {
        await result.current.submitScore();
      });

      // Should be called twice: once for spin, once for submitScore
      expect(mockWriteContractAsync).toHaveBeenCalledTimes(2);
      expect(mockWriteContractAsync).toHaveBeenLastCalledWith({
        address: expect.any(String),
        abi: expect.any(Array),
        functionName: 'submitScore',
        args: [sessionId, BigInt(score!)],
      });
    });

    it('should not submit score in free mode', async () => {
      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      await act(async () => {
        await result.current.submitScore();
      });

      // Should not be called at all in free mode
      expect(mockWriteContractAsync).not.toHaveBeenCalled();
    });

    it('should reset state after successful score submission', async () => {
      const mockTimestamp = 1700000000000;
      vi.setSystemTime(new Date(mockTimestamp));

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.lastResult).not.toBeNull();
      expect(result.current.sessionId).not.toBeNull();

      await act(async () => {
        await result.current.submitScore();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.lastResult).toBeNull();
      expect(result.current.sessionId).toBeNull();
      expect(result.current.isSpinning).toBe(false);
    });

    it('should handle score submission error gracefully', async () => {
      mockWriteContractAsync
        .mockResolvedValueOnce(MOCK_TX_HASH) // First call for spin
        .mockRejectedValueOnce(new Error('Submission failed')); // Second call for submitScore

      const mockTimestamp = 1700000000000;
      vi.setSystemTime(new Date(mockTimestamp));

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      await act(async () => {
        await result.current.submitScore();
      });

      // Should not throw, just handle gracefully
      expect(result.current.isSpinning).toBe(false);
    });

    it('should not submit score without sessionId', async () => {
      const { result } = renderHook(() => useJackpot());

      await act(async () => {
        await result.current.submitScore();
      });

      expect(mockWriteContractAsync).not.toHaveBeenCalled();
    });
  });

  describe('Mode Switching', () => {
    it('should switch from free to onchain mode', () => {
      const { result } = renderHook(() => useJackpot());

      expect(result.current.mode).toBe('free');

      act(() => {
        result.current.setMode('onchain');
      });

      expect(result.current.mode).toBe('onchain');
    });

    it('should switch from onchain to free mode', () => {
      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      expect(result.current.mode).toBe('onchain');

      act(() => {
        result.current.setMode('free');
      });

      expect(result.current.mode).toBe('free');
    });

    it('should reset game state when switching modes', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.20);

      const { result } = renderHook(() => useJackpot());

      // Play a game in free mode
      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.totalScore).toBe(100);
      expect(result.current.lastResult).not.toBeNull();

      // Switch mode
      act(() => {
        result.current.setMode('onchain');
      });

      // State should be reset
      expect(result.current.state).toBe('idle');
      expect(result.current.lastResult).toBeNull();
      expect(result.current.sessionId).toBeNull();
      expect(result.current.isSpinning).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should reset game state', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.20);

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.totalScore).toBe(100);
      expect(result.current.lastResult).not.toBeNull();

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.totalScore).toBe(0);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.sessionId).toBeNull();
    });

    it('should maintain state across re-renders', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.20);

      const { result, rerender } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      const scoreBeforeRerender = result.current.totalScore;
      const resultBeforeRerender = result.current.lastResult;

      rerender();

      expect(result.current.totalScore).toBe(scoreBeforeRerender);
      expect(result.current.lastResult).toEqual(resultBeforeRerender);
    });

    it('should clear lastResult after reset', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01);

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.spin();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      expect(result.current.lastResult?.isJackpot).toBe(true);

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.lastResult).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle contract write error without crashing', async () => {
      mockWriteContractAsync.mockRejectedValue(new Error('Contract error'));

      const { result } = renderHook(() => useJackpot());

      act(() => {
        result.current.setMode('onchain');
      });

      await act(async () => {
        await result.current.spin();
      });

      // Should handle error gracefully
      expect(result.current.state).toBe('idle');
      expect(result.current.isSpinning).toBe(false);
    });

    it('should handle multiple rapid spins gracefully', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.50);

      const { result } = renderHook(() => useJackpot());

      // Start first spin
      act(() => {
        result.current.spin();
      });

      // Try to start second spin immediately (should be blocked)
      act(() => {
        result.current.spin();
      });

      expect(result.current.state).toBe('spinning');

      // Complete the spin
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });

      // Should have completed one spin
      expect(result.current.state).toBe('result');
      expect(result.current.totalScore).toBe(25); // CELO outcome
    });

    it('should maintain isConnected state from wagmi', () => {
      const { result } = renderHook(() => useJackpot());

      expect(result.current.isConnected).toBe(true);

      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      });

      const { result: result2 } = renderHook(() => useJackpot());

      expect(result2.current.isConnected).toBe(false);
    });
  });
});
