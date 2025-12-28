import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletConnect } from '@/components/shared/WalletConnect';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useFarcaster } from '@/components/providers';
import { useSwitchToCelo } from '@/hooks/useSwitchToCelo';

/**
 * WalletConnect Component Tests
 *
 * Tests for the wallet connection component that handles:
 * - Displaying available wallet connectors
 * - Connecting/disconnecting wallets
 * - Switching to Celo network
 * - Farcaster wallet conditional display
 * - Error states and loading states
 */

// Mock dependencies
vi.mock('wagmi');
vi.mock('@/components/providers');
vi.mock('@/hooks/useSwitchToCelo');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate }: any) => (
      <div className={className} data-initial={JSON.stringify(initial)} data-animate={JSON.stringify(animate)}>
        {children}
      </div>
    ),
    button: ({ children, className, onClick, disabled, whileTap, ...props }: any) => (
      <button
        className={className}
        onClick={onClick}
        disabled={disabled}
        data-while-tap={JSON.stringify(whileTap)}
        {...props}
      >
        {children}
      </button>
    ),
  },
}));

describe('WalletConnect', () => {
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: disconnected state
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
      connector: undefined,
    } as any);

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: [],
      isPending: false,
      error: null,
    } as any);

    vi.mocked(useDisconnect).mockReturnValue({
      disconnect: mockDisconnect,
    } as any);

    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: false,
      isSDKReady: true,
      sdk: null,
    });

    vi.mocked(useSwitchToCelo).mockReturnValue({
      isOnCelo: true,
      isSwitching: false,
      switchToCelo: vi.fn(),
    });
  });

  // ============================================================================
  // Disconnected State Tests
  // ============================================================================

  test('should show connect message when disconnected', () => {
    render(<WalletConnect />);

    expect(screen.getByText('Connect your wallet to play on-chain')).toBeInTheDocument();
  });

  test('should render connector buttons when disconnected', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
      { uid: '2', name: 'WalletConnect', type: 'walletConnect' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('WalletConnect')).toBeInTheDocument();
  });

  test('should show connector icons', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
      { uid: '2', name: 'WalletConnect', type: 'walletConnect' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('🦊')).toBeInTheDocument(); // MetaMask
    expect(screen.getByText('🔗')).toBeInTheDocument(); // WalletConnect
  });

  test('should show connector descriptions', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('Connect with MetaMask')).toBeInTheDocument();
  });

  test('should call connect when clicking connector button', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    const button = screen.getByText('MetaMask').closest('button');
    fireEvent.click(button!);

    expect(mockConnect).toHaveBeenCalledWith({ connector: mockConnectors[0] });
  });

  test('should show message when no connectors available', () => {
    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: [],
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('No wallet connectors available')).toBeInTheDocument();
  });

  // ============================================================================
  // Farcaster Connector Tests
  // ============================================================================

  test('should show Farcaster wallet when in Farcaster', () => {
    const mockConnectors = [
      { uid: '1', name: 'Farcaster Wallet', type: 'farcaster' },
      { uid: '2', name: 'MetaMask', type: 'injected' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: true,
      isSDKReady: true,
      sdk: {} as any,
    });

    render(<WalletConnect />);

    expect(screen.getByText('Farcaster Wallet')).toBeInTheDocument();
    expect(screen.getByText('🔵')).toBeInTheDocument();
  });

  test('should hide Farcaster wallet when not in Farcaster', () => {
    const mockConnectors = [
      { uid: '1', name: 'Farcaster Wallet', type: 'farcaster' },
      { uid: '2', name: 'MetaMask', type: 'injected' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: false,
      isSDKReady: false,
      sdk: null,
    });

    render(<WalletConnect />);

    expect(screen.queryByText('Farcaster Wallet')).not.toBeInTheDocument();
    expect(screen.getByText('MetaMask')).toBeInTheDocument();
  });

  test('should show warning when in Farcaster but SDK not ready', () => {
    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: true,
      isSDKReady: false,
      sdk: null,
    });

    render(<WalletConnect />);

    expect(screen.getByText('Farcaster SDK not ready. Some features may not work.')).toBeInTheDocument();
  });

  test('should not show SDK warning when not in Farcaster', () => {
    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: false,
      isSDKReady: false,
      sdk: null,
    });

    render(<WalletConnect />);

    expect(screen.queryByText('Farcaster SDK not ready. Some features may not work.')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Pending State Tests
  // ============================================================================

  test('should show connecting state when pending', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: true,
      error: null,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  test('should disable buttons when pending', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: true,
      error: null,
    } as any);

    render(<WalletConnect />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('should show spinner when pending', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: true,
      error: null,
    } as any);

    const { container } = render(<WalletConnect />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // ============================================================================
  // Error State Tests
  // ============================================================================

  test('should show error message when connection fails', () => {
    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: [],
      isPending: false,
      error: { name: 'Error', message: 'User rejected connection' } as any,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('User rejected connection')).toBeInTheDocument();
  });

  test('should show error in red box', () => {
    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: [],
      isPending: false,
      error: { name: 'Error', message: 'Connection failed' } as any,
    } as any);

    const { container } = render(<WalletConnect />);

    const errorBox = container.querySelector('.bg-red-100');
    expect(errorBox).toBeInTheDocument();
    expect(errorBox).toHaveTextContent('Connection failed');
  });

  // ============================================================================
  // Connected State Tests
  // ============================================================================

  test('should show connected wallet address', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
  });

  test('should show active connector name', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('via MetaMask')).toBeInTheDocument();
  });

  test('should show disconnect button when connected', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  test('should call disconnect when clicking disconnect button', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    render(<WalletConnect />);

    const disconnectButton = screen.getByText('Disconnect');
    fireEvent.click(disconnectButton);

    expect(mockDisconnect).toHaveBeenCalled();
  });

  test('should not show connect message when connected', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    render(<WalletConnect />);

    expect(screen.queryByText('Connect your wallet to play on-chain')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Network Switching Tests
  // ============================================================================

  test('should show green indicator when on Celo', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    vi.mocked(useSwitchToCelo).mockReturnValue({
      isOnCelo: true,
      isSwitching: false,
      switchToCelo: vi.fn(),
    });

    const { container } = render(<WalletConnect />);

    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).toBeInTheDocument();
  });

  test('should show orange indicator when not on Celo', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    vi.mocked(useSwitchToCelo).mockReturnValue({
      isOnCelo: false,
      isSwitching: false,
      switchToCelo: vi.fn(),
    });

    const { container } = render(<WalletConnect />);

    const indicator = container.querySelector('.bg-orange-500');
    expect(indicator).toBeInTheDocument();
  });

  test('should show switching message when switching network', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    vi.mocked(useSwitchToCelo).mockReturnValue({
      isOnCelo: false,
      isSwitching: true,
      switchToCelo: vi.fn(),
    });

    render(<WalletConnect />);

    expect(screen.getByText('Switching to Celo network...')).toBeInTheDocument();
  });

  test('should show spinner when switching network', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    vi.mocked(useSwitchToCelo).mockReturnValue({
      isOnCelo: false,
      isSwitching: true,
      switchToCelo: vi.fn(),
    });

    const { container } = render(<WalletConnect />);

    const switchingBox = screen.getByText('Switching to Celo network...').closest('div');
    const spinner = switchingBox?.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('should not show switching message when not switching', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    vi.mocked(useSwitchToCelo).mockReturnValue({
      isOnCelo: true,
      isSwitching: false,
      switchToCelo: vi.fn(),
    });

    render(<WalletConnect />);

    expect(screen.queryByText('Switching to Celo network...')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Multiple Connectors Tests
  // ============================================================================

  test('should render all available connectors', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
      { uid: '2', name: 'WalletConnect', type: 'walletConnect' },
      { uid: '3', name: 'Browser Wallet', type: 'injected' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('WalletConnect')).toBeInTheDocument();
    expect(screen.getByText('Browser Wallet')).toBeInTheDocument();
  });

  test('should call connect with correct connector for each button', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
      { uid: '2', name: 'WalletConnect', type: 'walletConnect' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    const metaMaskButton = screen.getByText('MetaMask').closest('button');
    fireEvent.click(metaMaskButton!);
    expect(mockConnect).toHaveBeenCalledWith({ connector: mockConnectors[0] });

    mockConnect.mockClear();

    const wcButton = screen.getByText('WalletConnect').closest('button');
    fireEvent.click(wcButton!);
    expect(mockConnect).toHaveBeenCalledWith({ connector: mockConnectors[1] });
  });

  // ============================================================================
  // Address Formatting Tests
  // ============================================================================

  test('should format short address correctly', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
  });

  test('should format full address correctly', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('0xABCD...EF12')).toBeInTheDocument();
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  test('should have aria-label on disconnect button', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: { name: 'MetaMask' } as any,
    } as any);

    render(<WalletConnect />);

    const disconnectButton = screen.getByLabelText('Disconnect wallet');
    expect(disconnectButton).toBeInTheDocument();
  });

  test('should have aria-label on connector buttons', () => {
    const mockConnectors = [
      { uid: '1', name: 'MetaMask', type: 'injected' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    const button = screen.getByLabelText('Connect with MetaMask');
    expect(button).toBeInTheDocument();
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  test('should handle connector without icon', () => {
    const mockConnectors = [
      { uid: '1', name: 'Unknown Wallet', type: 'unknown' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('Unknown Wallet')).toBeInTheDocument();
    expect(screen.getByText('🔗')).toBeInTheDocument(); // Default icon
  });

  test('should handle connector without description', () => {
    const mockConnectors = [
      { uid: '1', name: 'Custom Wallet', type: 'custom' },
    ];

    vi.mocked(useConnect).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors as any,
      isPending: false,
      error: null,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('Connect with Custom Wallet')).toBeInTheDocument();
  });

  test('should handle connected without connector name', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      isConnected: true,
      connector: undefined,
    } as any);

    render(<WalletConnect />);

    expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
    expect(screen.queryByText(/^via /)).not.toBeInTheDocument();
  });
});
