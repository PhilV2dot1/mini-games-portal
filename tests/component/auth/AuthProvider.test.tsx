import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

/**
 * AuthProvider Component Tests
 *
 * Tests for the authentication context provider that manages:
 * - Auth state (user, session, loading)
 * - Email/password auth (signUp, signIn, signOut)
 * - OAuth providers (Google, Twitter, Discord)
 * - Wallet and Farcaster linking
 * - Profile claiming
 */

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Test component that uses the auth context
function TestComponent() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'ready'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="anonymous">{auth.isAnonymous ? 'yes' : 'no'}</div>
      <div data-testid="user-email">{auth.user?.email || 'none'}</div>
      <button onClick={() => auth.signUp('test@example.com', 'password123')}>
        Sign Up
      </button>
      <button onClick={() => auth.signIn('test@example.com', 'password123')}>
        Sign In
      </button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
      <button onClick={() => auth.signInWithGoogle()}>Google</button>
      <button onClick={() => auth.signInWithTwitter()}>Twitter</button>
      <button onClick={() => auth.signInWithDiscord()}>Discord</button>
      <button onClick={() => auth.linkWallet('0x123')}>Link Wallet</button>
      <button onClick={() => auth.linkFarcaster(12345)}>Link Farcaster</button>
      <button onClick={() => auth.claimProfile({})}>Claim Profile</button>
    </div>
  );
}

describe('AuthProvider', () => {
  let mockSubscription: { unsubscribe: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock subscription
    mockSubscription = {
      unsubscribe: vi.fn(),
    };

    // Default mock: no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  test('should render children and provide auth context', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
  });

  test('should start with loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  test('should be anonymous when no session', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(screen.getByTestId('anonymous')).toHaveTextContent('yes');
      expect(screen.getByTestId('user-email')).toHaveTextContent('none');
    });
  });

  test('should set user and session when authenticated', async () => {
    const mockUser: Partial<User> = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockSession: Partial<Session> = {
      user: mockUser as User,
      access_token: 'token-123',
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as Session },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      expect(screen.getByTestId('anonymous')).toHaveTextContent('no');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  test('should subscribe to auth state changes', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  test('should unsubscribe on unmount', async () => {
    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    unmount();

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });

  // ============================================================================
  // useAuth Hook Tests
  // ============================================================================

  test('useAuth should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    spy.mockRestore();
  });

  // ============================================================================
  // Sign Up Tests
  // ============================================================================

  test('signUp should succeed with valid credentials', async () => {
    const mockUser: Partial<User> = {
      id: 'new-user-123',
      email: 'new@example.com',
    };

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: mockUser as User,
        session: null,
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const signUpButton = screen.getByText('Sign Up');

    let result: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      result = await (signUpButton as HTMLButtonElement).onclick?.({} as never) as never;
    });

    // Note: We can't easily get the return value from onClick, so we verify the mock was called
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      },
    });
  });

  test('signUp should handle error from Supabase', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: { name: 'AuthError', message: 'Email already registered' },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const signUpButton = screen.getByText('Sign Up');
    await act(async () => {
      signUpButton.click();
    });

    expect(supabase.auth.signUp).toHaveBeenCalled();
  });

  test('signUp should handle missing user in response', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const signUpButton = screen.getByText('Sign Up');
    await act(async () => {
      signUpButton.click();
    });

    expect(supabase.auth.signUp).toHaveBeenCalled();
  });

  // ============================================================================
  // Sign In Tests
  // ============================================================================

  test('signIn should succeed with valid credentials', async () => {
    const mockUser: Partial<User> = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockSession: Partial<Session> = {
      user: mockUser as User,
      access_token: 'token-123',
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: mockUser as User,
        session: mockSession as Session,
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const signInButton = screen.getByText('Sign In');
    await act(async () => {
      signInButton.click();
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  test('signIn should handle invalid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: { name: 'AuthError', message: 'Invalid credentials' },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const signInButton = screen.getByText('Sign In');
    await act(async () => {
      signInButton.click();
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
  });

  // ============================================================================
  // Sign Out Tests
  // ============================================================================

  test('signOut should call Supabase signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const signOutButton = screen.getByText('Sign Out');
    await act(async () => {
      signOutButton.click();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  test('signOut should handle errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(supabase.auth.signOut).mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const signOutButton = screen.getByText('Sign Out');
    await act(async () => {
      signOutButton.click();
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  // ============================================================================
  // OAuth Tests
  // ============================================================================

  test('signInWithGoogle should call OAuth with google provider', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'google', url: 'https://google.com/auth' },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const googleButton = screen.getByText('Google');
    await act(async () => {
      googleButton.click();
    });

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    });
  });

  test('signInWithTwitter should call OAuth with twitter provider', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'twitter', url: 'https://twitter.com/auth' },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const twitterButton = screen.getByText('Twitter');
    await act(async () => {
      twitterButton.click();
    });

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'twitter',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    });
  });

  test('signInWithDiscord should call OAuth with discord provider', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'discord', url: 'https://discord.com/auth' },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const discordButton = screen.getByText('Discord');
    await act(async () => {
      discordButton.click();
    });

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'discord',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    });
  });

  // ============================================================================
  // Wallet Linking Tests
  // ============================================================================

  test('linkWallet should require authentication', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const linkWalletButton = screen.getByText('Link Wallet');
    await act(async () => {
      linkWalletButton.click();
    });

    // Should not call API when not authenticated
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('linkWallet should call API when authenticated', async () => {
    const mockUser: Partial<User> = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockSession: Partial<Session> = {
      user: mockUser as User,
      access_token: 'token-123',
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as Session },
      error: null,
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    const linkWalletButton = screen.getByText('Link Wallet');
    await act(async () => {
      linkWalletButton.click();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/claim-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authUserId: 'user-123',
          walletAddress: '0x123',
        }),
      });
    });
  });

  // ============================================================================
  // Farcaster Linking Tests
  // ============================================================================

  test('linkFarcaster should require authentication', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const linkFarcasterButton = screen.getByText('Link Farcaster');
    await act(async () => {
      linkFarcasterButton.click();
    });

    // Should not call API when not authenticated
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('linkFarcaster should call API when authenticated', async () => {
    const mockUser: Partial<User> = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockSession: Partial<Session> = {
      user: mockUser as User,
      access_token: 'token-123',
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as Session },
      error: null,
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    const linkFarcasterButton = screen.getByText('Link Farcaster');
    await act(async () => {
      linkFarcasterButton.click();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/claim-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authUserId: 'user-123',
          fid: 12345,
        }),
      });
    });
  });

  // ============================================================================
  // Profile Claiming Tests
  // ============================================================================

  test('claimProfile should require authentication', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    const claimProfileButton = screen.getByText('Claim Profile');
    await act(async () => {
      claimProfileButton.click();
    });

    // Should not call API when not authenticated
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('claimProfile should call API with local stats when authenticated', async () => {
    const mockUser: Partial<User> = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockSession: Partial<Session> = {
      user: mockUser as User,
      access_token: 'token-123',
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as Session },
      error: null,
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    const claimProfileButton = screen.getByText('Claim Profile');
    await act(async () => {
      claimProfileButton.click();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authUserId: 'user-123',
          localStats: {},
        }),
      });
    });
  });
});
