import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwitchToCelo } from '@/hooks/useSwitchToCelo';

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useSwitchChain: vi.fn(),
}));

vi.mock('wagmi/chains', () => ({
  celo: { id: 42220, name: 'Celo' },
  base: { id: 8453, name: 'Base' },
  optimism: { id: 10, name: 'Optimism' },
}));

// Import the mocked functions after the mock is defined
import { useAccount, useSwitchChain } from 'wagmi';

const mockUseAccount = useAccount as ReturnType<typeof vi.fn>;
const mockUseSwitchChain = useSwitchChain as ReturnType<typeof vi.fn>;

describe('useSwitchToCelo', () => {
  const mockSwitchChain = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: user connected to Celo
    mockUseAccount.mockReturnValue({
      chain: { id: 42220, name: 'Celo' },
      isConnected: true,
    });

    mockUseSwitchChain.mockReturnValue({
      switchChain: mockSwitchChain,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should return correct state when not connected', () => {
      mockUseAccount.mockReturnValue({
        chain: undefined,
        isConnected: false,
      });

      const { result } = renderHook(() => useSwitchToCelo());

      expect(result.current.isOnCelo).toBe(false);
      expect(result.current.currentChain).toBeUndefined();
      expect(result.current.isSwitching).toBe(false);
    });

    it('should return isOnCelo=true when connected to Celo', () => {
      mockUseAccount.mockReturnValue({
        chain: { id: 42220, name: 'Celo' },
        isConnected: true,
      });

      const { result } = renderHook(() => useSwitchToCelo());

      expect(result.current.isOnCelo).toBe(true);
      expect(result.current.currentChain).toEqual({ id: 42220, name: 'Celo' });
      expect(result.current.isSwitching).toBe(false);
    });

    it('should return isOnCelo=false when on wrong chain', () => {
      mockUseAccount.mockReturnValue({
        chain: { id: 1, name: 'Ethereum' },
        isConnected: true,
      });

      const { result } = renderHook(() => useSwitchToCelo());

      expect(result.current.isOnCelo).toBe(false);
      expect(result.current.currentChain).toEqual({ id: 1, name: 'Ethereum' });
      expect(result.current.isSwitching).toBe(true);
    });
  });

  describe('Auto-switching', () => {
    it('should call switchChain when connected to wrong network', () => {
      mockUseAccount.mockReturnValue({
        chain: { id: 1, name: 'Ethereum' },
        isConnected: true,
      });

      renderHook(() => useSwitchToCelo());

      expect(mockSwitchChain).toHaveBeenCalledWith(
        { chainId: 42220 },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('should not call switchChain when already on Celo', () => {
      mockUseAccount.mockReturnValue({
        chain: { id: 42220, name: 'Celo' },
        isConnected: true,
      });

      renderHook(() => useSwitchToCelo());

      expect(mockSwitchChain).not.toHaveBeenCalled();
    });

    it('should not call switchChain when not connected', () => {
      mockUseAccount.mockReturnValue({
        chain: undefined,
        isConnected: false,
      });

      renderHook(() => useSwitchToCelo());

      expect(mockSwitchChain).not.toHaveBeenCalled();
    });

    it('should log message when attempting to switch networks', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockUseAccount.mockReturnValue({
        chain: { id: 137, name: 'Polygon' },
        isConnected: true,
      });

      renderHook(() => useSwitchToCelo());

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Unsupported network detected: Polygon (137). Switching to Celo...'
      );

      consoleLogSpy.mockRestore();
    });

    it('should log success message on successful switch', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockUseAccount.mockReturnValue({
        chain: { id: 1, name: 'Ethereum' },
        isConnected: true,
      });

      renderHook(() => useSwitchToCelo());

      // Get the callbacks passed to switchChain
      const switchChainCall = mockSwitchChain.mock.calls[0];
      const callbacks = switchChainCall[1];

      // Simulate successful switch
      callbacks.onSuccess();

      expect(consoleLogSpy).toHaveBeenCalledWith('Successfully switched to Celo network');

      consoleLogSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should log error when switch fails', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('User rejected');

      mockUseAccount.mockReturnValue({
        chain: { id: 1, name: 'Ethereum' },
        isConnected: true,
      });

      renderHook(() => useSwitchToCelo());

      // Get the callbacks passed to switchChain
      const switchChainCall = mockSwitchChain.mock.calls[0];
      const callbacks = switchChainCall[1];

      // Simulate failed switch
      callbacks.onError(testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to switch to Celo network:',
        testError
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not call switchChain when switchChain function is unavailable', () => {
      mockUseSwitchChain.mockReturnValue({
        switchChain: undefined,
      });

      mockUseAccount.mockReturnValue({
        chain: { id: 1, name: 'Ethereum' },
        isConnected: true,
      });

      const { result } = renderHook(() => useSwitchToCelo());

      expect(mockSwitchChain).not.toHaveBeenCalled();
      expect(result.current.isSwitching).toBe(true); // Still indicates wrong chain
    });

    it('should handle missing chain object gracefully', () => {
      mockUseAccount.mockReturnValue({
        chain: null,
        isConnected: true,
      });

      const { result } = renderHook(() => useSwitchToCelo());

      expect(result.current.isOnCelo).toBe(false);
      expect(result.current.currentChain).toBeNull();
      // isSwitching is false when chain is null (guard: isConnected && chain ? ... : false)
      expect(result.current.isSwitching).toBe(false);
      // But switchChain is not called because chain is null (guard in useEffect)
      expect(mockSwitchChain).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should update isSwitching when on wrong network', () => {
      mockUseAccount.mockReturnValue({
        chain: { id: 56, name: 'BSC' },
        isConnected: true,
      });

      const { result } = renderHook(() => useSwitchToCelo());

      expect(result.current.isSwitching).toBe(true);
    });

    it('should update currentChain when chain changes', () => {
      const ethereumChain = { id: 1, name: 'Ethereum' };

      mockUseAccount.mockReturnValue({
        chain: ethereumChain,
        isConnected: true,
      });

      const { result, rerender } = renderHook(() => useSwitchToCelo());

      expect(result.current.currentChain).toEqual(ethereumChain);

      // Simulate chain change to Celo
      const celoChain = { id: 42220, name: 'Celo' };
      mockUseAccount.mockReturnValue({
        chain: celoChain,
        isConnected: true,
      });

      rerender();

      expect(result.current.currentChain).toEqual(celoChain);
      expect(result.current.isOnCelo).toBe(true);
    });

    it('should re-run effect when isConnected changes', () => {
      // Start disconnected
      mockUseAccount.mockReturnValue({
        chain: undefined,
        isConnected: false,
      });

      const { rerender } = renderHook(() => useSwitchToCelo());

      expect(mockSwitchChain).not.toHaveBeenCalled();

      // Connect to wrong network
      mockUseAccount.mockReturnValue({
        chain: { id: 1, name: 'Ethereum' },
        isConnected: true,
      });

      rerender();

      // Should now attempt to switch
      expect(mockSwitchChain).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle chain ID changing to Celo', () => {
      mockUseAccount.mockReturnValue({
        chain: { id: 1, name: 'Ethereum' },
        isConnected: true,
      });

      const { result, rerender } = renderHook(() => useSwitchToCelo());

      expect(result.current.isOnCelo).toBe(false);
      expect(mockSwitchChain).toHaveBeenCalledTimes(1);

      // User manually switches to Celo
      mockUseAccount.mockReturnValue({
        chain: { id: 42220, name: 'Celo' },
        isConnected: true,
      });

      rerender();

      expect(result.current.isOnCelo).toBe(true);
      expect(result.current.isSwitching).toBe(false);
      // Should not call switchChain again
      expect(mockSwitchChain).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection while switching', () => {
      mockUseAccount.mockReturnValue({
        chain: { id: 1, name: 'Ethereum' },
        isConnected: true,
      });

      const { result, rerender } = renderHook(() => useSwitchToCelo());

      expect(result.current.isSwitching).toBe(true);

      // User disconnects
      mockUseAccount.mockReturnValue({
        chain: undefined,
        isConnected: false,
      });

      rerender();

      expect(result.current.isSwitching).toBe(false);
      expect(result.current.isOnCelo).toBe(false);
    });

    it('should handle multiple network switches', () => {
      // Start on Ethereum
      mockUseAccount.mockReturnValue({
        chain: { id: 1, name: 'Ethereum' },
        isConnected: true,
      });

      const { rerender } = renderHook(() => useSwitchToCelo());

      expect(mockSwitchChain).toHaveBeenCalledTimes(1);

      // Switch to Polygon
      mockUseAccount.mockReturnValue({
        chain: { id: 137, name: 'Polygon' },
        isConnected: true,
      });

      rerender();

      // Should attempt to switch again
      expect(mockSwitchChain).toHaveBeenCalledTimes(2);

      // Finally on Celo
      mockUseAccount.mockReturnValue({
        chain: { id: 42220, name: 'Celo' },
        isConnected: true,
      });

      rerender();

      // Should not call again
      expect(mockSwitchChain).toHaveBeenCalledTimes(2);
    });
  });
});
