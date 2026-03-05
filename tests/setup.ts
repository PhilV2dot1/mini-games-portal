import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-project-id';

// Mock @farcaster/miniapp-sdk to avoid ES module issues
vi.mock('@farcaster/miniapp-sdk', () => ({
  sdk: {
    actions: {
      ready: vi.fn(),
      openUrl: vi.fn(),
    },
    wallet: {
      ethProvider: null,
    },
  },
}));

// Mock @/lib/wagmi to prevent module-level createConfig() call from failing when wagmi is mocked
vi.mock('@/lib/wagmi', () => ({
  config: {},
  megaeth: { id: 6342, name: 'MegaETH Testnet' },
  soneium: { id: 1868, name: 'Soneium' },
}));

// Mock @rainbow-me/rainbowkit to prevent it from calling wagmi's createConnector/createConfig
// at module evaluation time (which fails when wagmi is mocked in individual tests)
vi.mock('@rainbow-me/rainbowkit', () => ({
  RainbowKitProvider: ({ children }: { children: React.ReactNode }) => children,
  ConnectButton: vi.fn(() => null),
  getDefaultConfig: vi.fn(() => ({})),
  getDefaultWallets: vi.fn(() => ({ wallets: [] })),
  connectorsForWallets: vi.fn(() => []),
  darkTheme: vi.fn(() => ({})),
  lightTheme: vi.fn(() => ({})),
  midnightTheme: vi.fn(() => ({})),
  useConnectModal: vi.fn(() => ({ openConnectModal: vi.fn() })),
  useAccountModal: vi.fn(() => ({ openAccountModal: vi.fn() })),
  useChainModal: vi.fn(() => ({ openChainModal: vi.fn() })),
}));
vi.mock('@rainbow-me/rainbowkit/wallets', () => ({
  coinbaseWallet: vi.fn(() => ({})),
  walletConnectWallet: vi.fn(() => ({})),
  injectedWallet: vi.fn(() => ({})),
  rabbyWallet: vi.fn(() => ({})),
  braveWallet: vi.fn(() => ({})),
  metaMaskWallet: vi.fn(() => ({})),
  phantomWallet: vi.fn(() => ({})),
  valoraWallet: vi.fn(() => ({})),
}));

// Mock @vanilla-extract modules to avoid CommonJS issues
// These are used by @rainbow-me/rainbowkit internally
vi.mock('@vanilla-extract/sprinkles/createUtils', () => ({
  default: {
    createMapValueFn: vi.fn(() => vi.fn()),
    createNormalizeValueFn: vi.fn(() => vi.fn()),
  },
  createMapValueFn: vi.fn(() => vi.fn()),
  createNormalizeValueFn: vi.fn(() => vi.fn()),
}));
vi.mock('@vanilla-extract/css', () => ({
  style: vi.fn(() => ''),
  styleVariants: vi.fn(() => ({})),
  createVar: vi.fn(() => ''),
  fallbackVar: vi.fn(() => ''),
  createTheme: vi.fn(() => ['', {}]),
  createThemeContract: vi.fn(() => ({})),
  assignVars: vi.fn(() => ({})),
  createGlobalTheme: vi.fn(),
  globalStyle: vi.fn(),
  keyframes: vi.fn(() => ''),
}));
vi.mock('@vanilla-extract/dynamic', () => ({
  assignInlineVars: vi.fn(() => ({})),
  setElementVars: vi.fn(),
}));
vi.mock('@vanilla-extract/recipes', () => ({
  recipe: vi.fn(() => vi.fn(() => '')),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
