import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChainTheme } from '@/hooks/useChainTheme';

// Mock useChainSelector
vi.mock('@/hooks/useChainSelector', () => ({
  useChainSelector: vi.fn(),
}));

import { useChainSelector } from '@/hooks/useChainSelector';

describe('useChainTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return celo theme when on Celo', () => {
    vi.mocked(useChainSelector).mockReturnValue({
      isOnCelo: true,
      isOnBase: false,
      isSupportedChain: true,
      isConnected: true,
      currentChain: { id: 42220 } as any,
      currentChainId: 42220,
      currentChainName: 'celo',
      currentChainConfig: null,
      switchToChain: vi.fn(),
      switchToCelo: vi.fn(),
      switchToBase: vi.fn(),
      isOnMegaeth: false,
      switchToMegaeth: vi.fn(),
    });

    const { result } = renderHook(() => useChainTheme());

    expect(result.current.activeChain).toBe('celo');
    expect(result.current.theme.primary).toBe('#FCFF52');
    expect(result.current.theme.contrastText).toBe('#111827');
    expect(result.current.isOnCelo).toBe(true);
    expect(result.current.isOnBase).toBe(false);
  });

  test('should return base theme when on Base', () => {
    vi.mocked(useChainSelector).mockReturnValue({
      isOnCelo: false,
      isOnBase: true,
      isSupportedChain: true,
      isConnected: true,
      currentChain: { id: 8453 } as any,
      currentChainId: 8453,
      currentChainName: 'base',
      currentChainConfig: null,
      switchToChain: vi.fn(),
      switchToCelo: vi.fn(),
      switchToBase: vi.fn(),
      isOnMegaeth: false,
      switchToMegaeth: vi.fn(),
    });

    const { result } = renderHook(() => useChainTheme());

    expect(result.current.activeChain).toBe('base');
    expect(result.current.theme.primary).toBe('#0052FF');
    expect(result.current.theme.contrastText).toBe('#ffffff');
    expect(result.current.isOnBase).toBe(true);
    expect(result.current.isOnCelo).toBe(false);
  });

  test('should return megaeth theme when on MegaETH', () => {
    vi.mocked(useChainSelector).mockReturnValue({
      isOnCelo: false,
      isOnBase: false,
      isSupportedChain: true,
      isConnected: true,
      currentChain: { id: 4326 } as any,
      currentChainId: 4326,
      currentChainName: 'megaeth',
      currentChainConfig: null,
      switchToChain: vi.fn(),
      switchToCelo: vi.fn(),
      switchToBase: vi.fn(),
      isOnMegaeth: true,
      switchToMegaeth: vi.fn(),
    });

    const { result } = renderHook(() => useChainTheme());

    expect(result.current.activeChain).toBe('megaeth');
    expect(result.current.theme.primary).toBe('#00D4AA');
    expect(result.current.theme.contrastText).toBe('#111827');
    expect(result.current.isOnMegaeth).toBe(true);
    expect(result.current.isOnCelo).toBe(false);
    expect(result.current.isOnBase).toBe(false);
  });

  test('should default to celo theme when disconnected', () => {
    vi.mocked(useChainSelector).mockReturnValue({
      isOnCelo: false,
      isOnBase: false,
      isSupportedChain: false,
      isConnected: false,
      currentChain: undefined as any,
      currentChainId: undefined,
      currentChainName: null,
      currentChainConfig: null,
      switchToChain: vi.fn(),
      switchToCelo: vi.fn(),
      switchToBase: vi.fn(),
      isOnMegaeth: false,
      switchToMegaeth: vi.fn(),
    });

    const { result } = renderHook(() => useChainTheme());

    expect(result.current.activeChain).toBe('celo');
    expect(result.current.theme.primary).toBe('#FCFF52');
    expect(result.current.isConnected).toBe(false);
  });

  test('should default to celo theme on unsupported chain', () => {
    vi.mocked(useChainSelector).mockReturnValue({
      isOnCelo: false,
      isOnBase: false,
      isSupportedChain: false,
      isConnected: true,
      currentChain: { id: 1 } as any,
      currentChainId: 1,
      currentChainName: null,
      currentChainConfig: null,
      switchToChain: vi.fn(),
      switchToCelo: vi.fn(),
      switchToBase: vi.fn(),
      isOnMegaeth: false,
      switchToMegaeth: vi.fn(),
    });

    const { result } = renderHook(() => useChainTheme());

    expect(result.current.activeChain).toBe('celo');
    expect(result.current.isSupportedChain).toBe(false);
  });

  test('should pass through isSupportedChain from useChainSelector', () => {
    vi.mocked(useChainSelector).mockReturnValue({
      isOnCelo: true,
      isOnBase: false,
      isSupportedChain: true,
      isConnected: true,
      currentChain: { id: 42220 } as any,
      currentChainId: 42220,
      currentChainName: 'celo',
      currentChainConfig: null,
      switchToChain: vi.fn(),
      switchToCelo: vi.fn(),
      switchToBase: vi.fn(),
      isOnMegaeth: false,
      switchToMegaeth: vi.fn(),
    });

    const { result } = renderHook(() => useChainTheme());

    expect(result.current.isSupportedChain).toBe(true);
  });

  test('theme should have all required properties', () => {
    vi.mocked(useChainSelector).mockReturnValue({
      isOnCelo: true,
      isOnBase: false,
      isSupportedChain: true,
      isConnected: true,
      currentChain: { id: 42220 } as any,
      currentChainId: 42220,
      currentChainName: 'celo',
      currentChainConfig: null,
      switchToChain: vi.fn(),
      switchToCelo: vi.fn(),
      switchToBase: vi.fn(),
      isOnMegaeth: false,
      switchToMegaeth: vi.fn(),
    });

    const { result } = renderHook(() => useChainTheme());

    expect(result.current.theme).toHaveProperty('primary');
    expect(result.current.theme).toHaveProperty('hover');
    expect(result.current.theme).toHaveProperty('light');
    expect(result.current.theme).toHaveProperty('dark');
    expect(result.current.theme).toHaveProperty('contrastText');
  });
});
