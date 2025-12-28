import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileSetup } from '@/components/profile/ProfileSetup';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccount } from 'wagmi';
import { useLanguage } from '@/lib/i18n/LanguageContext';

/**
 * ProfileSetup Component Tests
 *
 * Tests for the profile setup modal that allows users to:
 * - Select a predefined avatar
 * - Choose a username
 * - Save profile (localStorage for anonymous, API for authenticated/wallet users)
 */

// Mock dependencies
vi.mock('@/components/auth/AuthProvider');
vi.mock('wagmi');
vi.mock('@/lib/i18n/LanguageContext');
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, className, onError }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={onError}
      data-fill={fill}
    />
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, style, ...props }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock setTimeout
vi.useFakeTimers();

describe('ProfileSetup', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  const mockTranslations: Record<string, string> = {
    'profileSetup.welcome': 'Welcome',
    'profileSetup.subtitle': 'Setup your profile',
    'profileSetup.chooseAvatar': 'Choose an avatar',
    'profileSetup.chooseUsername': 'Choose a username',
    'profileSetup.usernameRequired': 'Username is required',
    'profileSetup.usernameLength': 'Username must be 3-20 characters',
    'profileSetup.usernameRules': '3-20 characters',
    'profileSetup.back': 'Back',
    'profileSetup.startPlaying': 'Start Playing',
    'profileSetup.saving': 'Saving...',
    'profileSetup.success': 'Success!',
    'profileSetup.ready': 'You are ready to play',
    'profileSetup.skip': 'Skip for now',
    'profileSetup.tip': 'Tip',
    'profileSetup.unlockCustom': 'Unlock custom avatars',
    'profileSetup.saveFailed': 'Save failed',
    'errors.generic': 'An error occurred',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Default mocks
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isAuthenticated: false,
      isAnonymous: true,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithTwitter: vi.fn(),
      signInWithDiscord: vi.fn(),
      linkWallet: vi.fn(),
      linkFarcaster: vi.fn(),
      claimProfile: vi.fn(),
    });

    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      isReconnecting: false,
      status: 'disconnected',
    } as any);

    vi.mocked(useLanguage).mockReturnValue({
      language: 'fr',
      setLanguage: vi.fn(),
      t: (key: string) => mockTranslations[key] || key,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  test('should not render when isOpen is false', () => {
    const { container } = render(
      <ProfileSetup isOpen={false} onClose={mockOnClose} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('should render when isOpen is true', () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('🎮 Welcome')).toBeInTheDocument();
    expect(screen.getByText('Setup your profile')).toBeInTheDocument();
  });

  test('should close when clicking backdrop', () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60');
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should not close when clicking modal content', () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    const modal = screen.getByText('Choose an avatar').closest('div');
    fireEvent.click(modal!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('should render skip button', () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    const skipButton = screen.getByText('Skip for now');
    expect(skipButton).toBeInTheDocument();

    fireEvent.click(skipButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  // ============================================================================
  // Avatar Selection Step Tests
  // ============================================================================

  test('should start with avatar selection step', () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Choose an avatar')).toBeInTheDocument();
  });

  test('should render 12 predefined avatars', () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );

    expect(avatarButtons.length).toBeGreaterThanOrEqual(12);
  });

  test('should select avatar and move to username step', async () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );

    fireEvent.click(avatarButtons[0]);

    expect(screen.getByText('Choose a username')).toBeInTheDocument();
  });

  // ============================================================================
  // Username Step Tests
  // ============================================================================

  test('should show username input after avatar selection', async () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );

    fireEvent.click(avatarButtons[0]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();
  });

  test('should allow typing username', async () => {
    const user = userEvent.setup({ delay: null });

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'TestPlayer');

    expect(input).toHaveValue('TestPlayer');
  });

  test('should show back button on username step', async () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByText('← Back')).toBeInTheDocument();
  });

  test('should go back to avatar selection when clicking back', async () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByText('← Back')).toBeInTheDocument();

    // Click back
    fireEvent.click(screen.getByText('← Back'));

    expect(screen.getByText('Choose an avatar')).toBeInTheDocument();
  });

  test('should disable save button when username is empty', async () => {
    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    // Direct assertion - no waitFor
    const saveButton = screen.getByText('Start Playing');
    expect(saveButton).toBeDisabled();
  });

  test('should enable save button when username is provided', async () => {
    const user = userEvent.setup({ delay: null });

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'TestPlayer');

    const saveButton = screen.getByText('Start Playing');
    expect(saveButton).not.toBeDisabled();
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  // Note: Empty username validation is handled by disabling the save button
  // See test: "should disable save button when username is empty"

  test('should show error if username is too short', async () => {
    const user = userEvent.setup({ delay: null });

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type short username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'ab');

    const saveButton = screen.getByText('Start Playing');
    fireEvent.click(saveButton);

    expect(screen.getByText('⚠️ Username must be 3-20 characters')).toBeInTheDocument();
  });

  // Note: Username length validation is handled by input maxLength attribute
  // Input prevents typing more than 20 characters

  // ============================================================================
  // Save - Anonymous User (localStorage)
  // ============================================================================

  test('should save to localStorage for anonymous user', async () => {
    const user = userEvent.setup({ delay: null });

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'AnonymousPlayer');

    // Save
    const saveButton = screen.getByText('Start Playing');
    fireEvent.click(saveButton);

        expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();

    // Check localStorage
    const stored = localStorage.getItem('celo_games_portal_stats');
    expect(stored).toBeTruthy();

    const profile = JSON.parse(stored!);
    expect(profile.username).toBe('AnonymousPlayer');
    expect(profile.display_name).toBe('AnonymousPlayer');
    expect(profile.avatar_type).toBe('predefined');
    expect(profile.avatar_url).toContain('/avatars/predefined/');
  });

  test('should close after 2 seconds on success', async () => {
    const user = userEvent.setup({ delay: null });

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'TestPlayer');

    // Save
    const saveButton = screen.getByText('Start Playing');
    fireEvent.click(saveButton);

    expect(screen.getByText('Success!')).toBeInTheDocument();

    // Fast-forward timers
    await vi.runAllTimersAsync();

        expect(mockOnComplete).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  // ============================================================================
  // Save - Authenticated User (API)
  // ============================================================================

  test('should save to API for authenticated user', async () => {
    const user = userEvent.setup({ delay: null });

    // Mock authenticated user
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      session: {} as any,
      isAuthenticated: true,
      isAnonymous: false,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithTwitter: vi.fn(),
      signInWithDiscord: vi.fn(),
      linkWallet: vi.fn(),
      linkFarcaster: vi.fn(),
      claimProfile: vi.fn(),
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[1]); // Select second avatar

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'AuthUser');

    // Save
    const saveButton = screen.getByText('Start Playing');
    fireEvent.click(saveButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'AuthUser',
          display_name: 'AuthUser',
          avatar_type: 'predefined',
          avatar_url: '/avatars/predefined/controller.svg',
          userId: 'user-123',
        }),
      });
  });

  // ============================================================================
  // Save - Wallet Connected (API)
  // ============================================================================

  test('should save to API for wallet connected user', async () => {
    const user = userEvent.setup({ delay: null });

    // Mock wallet connected
    vi.mocked(useAccount).mockReturnValue({
      address: '0x1234567890ABCDEF',
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: 'connected',
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[2]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'WalletUser');

    // Save
    const saveButton = screen.getByText('Start Playing');
    fireEvent.click(saveButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'WalletUser',
          display_name: 'WalletUser',
          avatar_type: 'predefined',
          avatar_url: '/avatars/predefined/joystick.svg',
          walletAddress: '0x1234567890abcdef', // lowercase
        }),
      });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  test('should show error when API call fails', async () => {
    const user = userEvent.setup({ delay: null });

    // Mock authenticated user
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      session: {} as any,
      isAuthenticated: true,
      isAnonymous: false,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithTwitter: vi.fn(),
      signInWithDiscord: vi.fn(),
      linkWallet: vi.fn(),
      linkFarcaster: vi.fn(),
      claimProfile: vi.fn(),
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Username already taken' }),
    } as Response);

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'TakenUsername');

    // Save
    const saveButton = screen.getByText('Start Playing');
    fireEvent.click(saveButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Username already taken')).toBeInTheDocument();

    // Should still be on username step
    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();
  });

  test('should show generic error when API throws', async () => {
    const user = userEvent.setup({ delay: null });

    // Mock authenticated user
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      session: {} as any,
      isAuthenticated: true,
      isAnonymous: false,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithTwitter: vi.fn(),
      signInWithDiscord: vi.fn(),
      linkWallet: vi.fn(),
      linkFarcaster: vi.fn(),
      claimProfile: vi.fn(),
    });

    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'TestUser');

    // Save
    const saveButton = screen.getByText('Start Playing');
    fireEvent.click(saveButton);

    // Wait for async operations to complete
    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Network error')).toBeInTheDocument();
  });

  test('should not show skip button on done step', async () => {
    const user = userEvent.setup({ delay: null });

    render(<ProfileSetup isOpen={true} onClose={mockOnClose} />);

    // Select avatar
    const avatarButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('img')
    );
    fireEvent.click(avatarButtons[0]);

    expect(screen.getByPlaceholderText('PlayerOne')).toBeInTheDocument();

    // Type username
    const input = screen.getByPlaceholderText('PlayerOne');
    await user.type(input, 'TestPlayer');

    // Save
    const saveButton = screen.getByText('Start Playing');
    fireEvent.click(saveButton);

    expect(screen.getByText('Success!')).toBeInTheDocument();

    // Skip button should not be visible
    expect(screen.queryByText('Skip for now')).not.toBeInTheDocument();
  });
});
