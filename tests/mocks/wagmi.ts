import { vi } from 'vitest';

export const mockAccount = {
  address: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf' as `0x${string}`,
  isConnected: true,
  chain: { id: 42220, name: 'Celo' },
};

export const mockUseAccount = vi.fn(() => mockAccount);

export const mockUseReadContract = vi.fn(() => ({
  data: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n], // Mock stats
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const mockUseWriteContract = vi.fn(() => ({
  writeContract: vi.fn(),
  data: '0x1234567890abcdef' as `0x${string}`,
  isPending: false,
  error: null,
  reset: vi.fn(),
}));

export const mockUseWaitForTransactionReceipt = vi.fn(() => ({
  data: {
    status: 'success' as const,
    logs: [],
    transactionHash: '0x1234567890abcdef' as `0x${string}`,
  },
  isLoading: false,
  error: null,
}));

export const mockUseSwitchChain = vi.fn(() => ({
  switchChain: vi.fn(),
  isPending: false,
  error: null,
}));

// Helper to setup all wagmi mocks
export const setupWagmiMocks = () => {
  vi.mock('wagmi', () => ({
    useAccount: mockUseAccount,
    useReadContract: mockUseReadContract,
    useWriteContract: mockUseWriteContract,
    useWaitForTransactionReceipt: mockUseWaitForTransactionReceipt,
    useSwitchChain: mockUseSwitchChain,
    useConfig: vi.fn(() => ({})),
  }));
};
