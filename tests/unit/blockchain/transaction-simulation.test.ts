import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

/**
 * Onchain Transaction Simulation Tests
 *
 * Unit tests that simulate blockchain transactions WITHOUT requiring
 * a real connection to the blockchain. These tests use mocks to verify:
 *
 * - Transaction initiation and submission
 * - Transaction pending states
 * - Transaction confirmation and receipts
 * - Error handling (user rejection, insufficient funds, gas errors)
 * - State updates after successful transactions
 * - Contract interaction patterns
 *
 * Unlike integration tests in tests/blockchain/, these run instantly
 * and don't require testnet CELO or network connectivity.
 */

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useReadContract: vi.fn(),
  useSwitchChain: vi.fn(),
}));

vi.mock('wagmi/chains', () => ({
  celo: { id: 42220, name: 'Celo' },
}));

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const mockUseAccount = useAccount as ReturnType<typeof vi.fn>;
const mockUseWriteContract = useWriteContract as ReturnType<typeof vi.fn>;
const mockUseWaitForTransactionReceipt = useWaitForTransactionReceipt as ReturnType<typeof vi.fn>;

// Mock hook that simulates contract interactions
function useContractTransaction() {
  const account = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const submitTransaction = async (contractAddress: string, functionName: string, args: unknown[]) => {
    if (!account.isConnected) {
      throw new Error('Wallet not connected');
    }

    writeContract({
      address: contractAddress as `0x${string}`,
      abi: [],
      functionName,
      args,
      chainId: 42220,
    });
  };

  return {
    submitTransaction,
    hash,
    isPending,
    isConfirming,
    receipt,
    error,
    reset,
    isConnected: account.isConnected,
  };
}

describe('Onchain Transaction Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: connected wallet
    mockUseAccount.mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678' as `0x${string}`,
      isConnected: true,
      chain: { id: 42220, name: 'Celo' },
    });

    // Default: no pending transaction
    mockUseWriteContract.mockReturnValue({
      writeContract: vi.fn(),
      data: undefined,
      isPending: false,
      error: null,
      reset: vi.fn(),
    });

    // Default: no receipt yet
    mockUseWaitForTransactionReceipt.mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  describe('Transaction Initiation', () => {
    test('should be able to initiate transaction when connected', () => {
      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isPending).toBe(false);
    });

    test('should throw error when attempting transaction while disconnected', async () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        chain: undefined,
      });

      const { result } = renderHook(() => useContractTransaction());

      await expect(async () => {
        await result.current.submitTransaction('0xCONTRACT', 'startGame', []);
      }).rejects.toThrow('Wallet not connected');
    });

    test('should call writeContract with correct parameters', async () => {
      const mockWriteContract = vi.fn();
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useContractTransaction());

      await act(async () => {
        await result.current.submitTransaction('0xABCDEF', 'playGame', [100n, true]);
      });

      expect(mockWriteContract).toHaveBeenCalledWith({
        address: '0xABCDEF',
        abi: [],
        functionName: 'playGame',
        args: [100n, true],
        chainId: 42220,
      });
    });
  });

  describe('Transaction Pending State', () => {
    test('should show isPending=true during transaction', () => {
      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        isPending: true,
        error: null,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.isPending).toBe(true);
      expect(result.current.hash).toBeUndefined();
    });

    test('should have hash after transaction submitted', () => {
      const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`;

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: mockHash,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.hash).toBe(mockHash);
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('Transaction Confirmation', () => {
    test('should show isConfirming=true while waiting for receipt', () => {
      const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`;

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: mockHash,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: null,
        isLoading: true,
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.isConfirming).toBe(true);
      expect(result.current.receipt).toBeNull();
    });

    test('should have receipt after transaction confirmed', () => {
      const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`;
      const mockReceipt = {
        transactionHash: mockHash,
        status: 'success' as const,
        blockNumber: 12345n,
        gasUsed: 50000n,
        logs: [],
      };

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: mockHash,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: mockReceipt,
        isLoading: false,
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.isConfirming).toBe(false);
      expect(result.current.receipt).toEqual(mockReceipt);
      expect(result.current.receipt?.status).toBe('success');
    });
  });

  describe('Transaction Error Handling', () => {
    test('should handle user rejection error', () => {
      const rejectionError = new Error('User rejected the request');

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        isPending: false,
        error: rejectionError,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.error).toBe(rejectionError);
      expect(result.current.error?.message).toContain('rejected');
    });

    test('should handle insufficient funds error', () => {
      const insufficientFundsError = new Error('insufficient funds for gas');

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        isPending: false,
        error: insufficientFundsError,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.error).toBe(insufficientFundsError);
      expect(result.current.error?.message).toContain('insufficient funds');
    });

    test('should handle contract revert error', () => {
      const revertError = new Error('execution reverted: Game already active');

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        isPending: false,
        error: revertError,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.error).toBe(revertError);
      expect(result.current.error?.message).toContain('reverted');
    });

    test('should handle network switch error', () => {
      const networkError = new Error('Chain mismatch: Expected 42220, got 1');

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        isPending: false,
        error: networkError,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.error).toBe(networkError);
      expect(result.current.error?.message).toContain('Chain mismatch');
    });
  });

  describe('Transaction Reset', () => {
    test('should be able to reset transaction state', () => {
      const mockReset = vi.fn();

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: '0xABCDEF' as `0x${string}`,
        isPending: false,
        error: null,
        reset: mockReset,
      });

      const { result } = renderHook(() => useContractTransaction());

      act(() => {
        result.current.reset();
      });

      expect(mockReset).toHaveBeenCalled();
    });

    test('should reset after error to retry', () => {
      const mockReset = vi.fn();
      const mockWriteContract = vi.fn();

      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: new Error('User rejected'),
        reset: mockReset,
      });

      const { result } = renderHook(() => useContractTransaction());

      // User rejects first transaction
      expect(result.current.error).toBeTruthy();

      // Reset to try again
      act(() => {
        result.current.reset();
      });

      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe('Transaction State Transitions', () => {
    test('should transition from idle → pending → confirmed', async () => {
      const mockWriteContract = vi.fn();
      const mockHash = '0xABC123' as `0x${string}`;

      // Start idle
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      const { result, rerender } = renderHook(() => useContractTransaction());

      expect(result.current.isPending).toBe(false);
      expect(result.current.hash).toBeUndefined();

      // Transition to pending
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: true,
        error: null,
        reset: vi.fn(),
      });

      rerender();

      expect(result.current.isPending).toBe(true);

      // Transaction submitted, get hash
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: mockHash,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      rerender();

      expect(result.current.hash).toBe(mockHash);
      expect(result.current.isPending).toBe(false);
    });

    test('should handle confirmation waiting state', () => {
      const mockHash = '0xDEF456' as `0x${string}`;

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: mockHash,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      // Waiting for confirmation
      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: null,
        isLoading: true,
      });

      const { result, rerender } = renderHook(() => useContractTransaction());

      expect(result.current.isConfirming).toBe(true);
      expect(result.current.receipt).toBeNull();

      // Receipt received
      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: {
          transactionHash: mockHash,
          status: 'success' as const,
          blockNumber: 999n,
          gasUsed: 21000n,
          logs: [],
        },
        isLoading: false,
      });

      rerender();

      expect(result.current.isConfirming).toBe(false);
      expect(result.current.receipt).toBeDefined();
      expect(result.current.receipt?.status).toBe('success');
    });
  });

  describe('Edge Cases', () => {
    test('should handle transaction with no gas estimate', () => {
      const mockWriteContract = vi.fn();

      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useContractTransaction());

      act(() => {
        result.current.submitTransaction('0xCONTRACT', 'function', []);
      });

      expect(mockWriteContract).toHaveBeenCalled();
    });

    test('should handle undefined hash gracefully', () => {
      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: null,
        isLoading: false,
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.hash).toBeUndefined();
      expect(result.current.receipt).toBeNull();
      expect(result.current.isConfirming).toBe(false);
    });

    test('should handle reverted transaction receipt', () => {
      const mockHash = '0xREVERT' as `0x${string}`;

      mockUseWriteContract.mockReturnValue({
        writeContract: vi.fn(),
        data: mockHash,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: {
          transactionHash: mockHash,
          status: 'reverted' as const,
          blockNumber: 888n,
          gasUsed: 50000n,
          logs: [],
        },
        isLoading: false,
      });

      const { result } = renderHook(() => useContractTransaction());

      expect(result.current.receipt?.status).toBe('reverted');
    });

    test('should handle multiple consecutive transactions', () => {
      const mockWriteContract = vi.fn();
      const mockReset = vi.fn();

      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null,
        reset: mockReset,
      });

      const { result } = renderHook(() => useContractTransaction());

      // First transaction
      act(() => {
        result.current.submitTransaction('0xCONTRACT1', 'play', [1n]);
      });

      expect(mockWriteContract).toHaveBeenCalledTimes(1);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Second transaction
      act(() => {
        result.current.submitTransaction('0xCONTRACT2', 'play', [2n]);
      });

      expect(mockWriteContract).toHaveBeenCalledTimes(2);
    });
  });

  describe('Real-world Transaction Patterns', () => {
    test('should simulate successful game transaction flow', async () => {
      const mockWriteContract = vi.fn();
      const mockHash = '0xGAME123' as `0x${string}`;

      // 1. Idle state
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      const { result, rerender } = renderHook(() => useContractTransaction());

      // 2. User submits transaction
      await act(async () => {
        await result.current.submitTransaction('0xGAME', 'startGame', []);
      });

      // 3. Transaction pending in wallet
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: true,
        error: null,
        reset: vi.fn(),
      });

      rerender();
      expect(result.current.isPending).toBe(true);

      // 4. Transaction submitted to blockchain
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: mockHash,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: null,
        isLoading: true,
      });

      rerender();
      expect(result.current.hash).toBe(mockHash);
      expect(result.current.isConfirming).toBe(true);

      // 5. Transaction confirmed
      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: {
          transactionHash: mockHash,
          status: 'success' as const,
          blockNumber: 12345n,
          gasUsed: 75000n,
          logs: [
            {
              address: '0xGAME' as `0x${string}`,
              topics: [],
              data: '0x',
            },
          ],
        },
        isLoading: false,
      });

      rerender();
      expect(result.current.receipt).toBeDefined();
      expect(result.current.receipt?.status).toBe('success');
      expect(result.current.isConfirming).toBe(false);
    });

    test('should simulate failed transaction with retry', async () => {
      const mockWriteContract = vi.fn();
      const mockReset = vi.fn();

      // 1. First attempt - user rejects
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: new Error('User rejected the request'),
        reset: mockReset,
      });

      const { result, rerender } = renderHook(() => useContractTransaction());

      expect(result.current.error).toBeTruthy();

      // 2. Reset state
      act(() => {
        result.current.reset();
      });

      expect(mockReset).toHaveBeenCalled();

      // 3. Second attempt - success
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: '0xSUCCESS' as `0x${string}`,
        isPending: false,
        error: null,
        reset: mockReset,
      });

      rerender();

      await act(async () => {
        await result.current.submitTransaction('0xCONTRACT', 'retry', []);
      });

      expect(result.current.hash).toBe('0xSUCCESS');
      expect(result.current.error).toBeNull();
    });
  });
});
