import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

/**
 * LoginModal Component Tests
 *
 * Tests for the login modal that allows users to:
 * - Sign in with email/password
 * - Sign in with OAuth providers (Google, Twitter, Discord)
 * - Navigate to forgot password
 * - Switch to signup modal
 * - Continue as guest
 */

// Mock dependencies
vi.mock('@/components/auth/AuthProvider');
vi.mock('next/navigation');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, style, ...props }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('LoginModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSwitchToSignup = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockSignIn = vi.fn();
  const mockSignInWithGoogle = vi.fn();
  const mockSignInWithTwitter = vi.fn();
  const mockSignInWithDiscord = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isAuthenticated: false,
      isAnonymous: true,
      loading: false,
      signUp: vi.fn(),
      signIn: mockSignIn,
      signOut: vi.fn(),
      signInWithGoogle: mockSignInWithGoogle,
      signInWithTwitter: mockSignInWithTwitter,
      signInWithDiscord: mockSignInWithDiscord,
      linkWallet: vi.fn(),
      linkFarcaster: vi.fn(),
      claimProfile: vi.fn(),
    });

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as any);
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  test('should not render when isOpen is false', () => {
    const { container } = render(
      <LoginModal isOpen={false} onClose={mockOnClose} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('should render when isOpen is true', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByText('Bienvenue ! Connectez-vous pour continuer')).toBeInTheDocument();
  });

  test('should close when clicking backdrop', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60');
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should not close when clicking modal content', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const modal = screen.getByText('Connexion').closest('div');
    fireEvent.click(modal!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Social Login Tests
  // ============================================================================

  test('should render Google login button', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Continuer avec Google')).toBeInTheDocument();
  });

  test('should render Twitter login button', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Continuer avec Twitter')).toBeInTheDocument();
  });

  test('should render Discord login button', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Continuer avec Discord')).toBeInTheDocument();
  });

  test('should call signInWithGoogle when clicking Google button', async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined);

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const googleButton = screen.getByText('Continuer avec Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
  });

  test('should call signInWithTwitter when clicking Twitter button', async () => {
    mockSignInWithTwitter.mockResolvedValue(undefined);

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const twitterButton = screen.getByText('Continuer avec Twitter');
    fireEvent.click(twitterButton);

    await waitFor(() => {
      expect(mockSignInWithTwitter).toHaveBeenCalled();
    });
  });

  test('should call signInWithDiscord when clicking Discord button', async () => {
    mockSignInWithDiscord.mockResolvedValue(undefined);

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const discordButton = screen.getByText('Continuer avec Discord');
    fireEvent.click(discordButton);

    await waitFor(() => {
      expect(mockSignInWithDiscord).toHaveBeenCalled();
    });
  });

  test('should show error when social login fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSignInWithGoogle.mockRejectedValue(new Error('Social login failed'));

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const googleButton = screen.getByText('Continuer avec Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Échec de la connexion sociale')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  test('should disable social buttons when loading', async () => {
    mockSignInWithGoogle.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const googleButton = screen.getByText('Continuer avec Google').closest('button');
    fireEvent.click(googleButton!);

    await waitFor(() => {
      expect(googleButton).toBeDisabled();
      expect(screen.getByText('Continuer avec Twitter').closest('button')).toBeDisabled();
      expect(screen.getByText('Continuer avec Discord').closest('button')).toBeDisabled();
    });
  });

  // ============================================================================
  // Email/Password Form Tests
  // ============================================================================

  test('should render email input', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should render password input', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should allow typing email', async () => {
    const user = userEvent.setup();

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  test('should allow typing password', async () => {
    const user = userEvent.setup();

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  test('should render submit button', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Se connecter')).toBeInTheDocument();
  });

  test('should show error when submitting without email', async () => {
    const user = userEvent.setup();

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByText('Se connecter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Email et mot de passe requis')).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  test('should show error when submitting without password', async () => {
    const user = userEvent.setup();

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByText('Se connecter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Email et mot de passe requis')).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  test('should call signIn with email and password when form is submitted', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({ success: true });

    render(<LoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByText('Se connecter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('should close modal and call onSuccess when login succeeds', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({ success: true });

    render(<LoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByText('Se connecter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('should show error when login fails', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({ success: false, error: 'Invalid credentials' });

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByText('Se connecter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Invalid credentials')).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('should show generic error when login fails without error message', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({ success: false });

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByText('Se connecter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Échec de la connexion')).toBeInTheDocument();
    });
  });

  test('should handle exception during login', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockSignIn.mockRejectedValue(new Error('Network error'));

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByText('Se connecter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Une erreur est survenue')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  test('should show loading state when submitting', async () => {
    const user = userEvent.setup();

    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByText('Se connecter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Connexion...')).toBeInTheDocument();
    });
  });

  test('should disable form inputs when loading', async () => {
    const user = userEvent.setup();

    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByText('Se connecter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  // ============================================================================
  // Forgot Password Tests
  // ============================================================================

  test('should render forgot password button', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Mot de passe oublié ?')).toBeInTheDocument();
  });

  test('should navigate to forgot password page and close modal', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const forgotPasswordButton = screen.getByText('Mot de passe oublié ?');
    fireEvent.click(forgotPasswordButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/auth/forgot-password');
  });

  // ============================================================================
  // Switch to Signup Tests
  // ============================================================================

  test('should render signup link', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} onSwitchToSignup={mockOnSwitchToSignup} />);

    expect(screen.getByText('Pas encore de compte ?')).toBeInTheDocument();
    expect(screen.getByText('Créer un compte')).toBeInTheDocument();
  });

  test('should call onSwitchToSignup when clicking signup link', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} onSwitchToSignup={mockOnSwitchToSignup} />);

    const signupLink = screen.getByText('Créer un compte');
    fireEvent.click(signupLink);

    expect(mockOnSwitchToSignup).toHaveBeenCalled();
  });

  test('should not crash when onSwitchToSignup is not provided', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const signupLink = screen.getByText('Créer un compte');
    fireEvent.click(signupLink);

    // Should not throw error
    expect(true).toBe(true);
  });

  // ============================================================================
  // Guest Mode Tests
  // ============================================================================

  test('should render guest mode link', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Continuer en tant qu'invité")).toBeInTheDocument();
  });

  test('should close modal when clicking guest mode', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const guestLink = screen.getByText("Continuer en tant qu'invité");
    fireEvent.click(guestLink);

    expect(mockOnClose).toHaveBeenCalled();
  });

  // ============================================================================
  // Divider Tests
  // ============================================================================

  test('should render email divider', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('ou avec email')).toBeInTheDocument();
  });

  // ============================================================================
  // Form Submission Tests
  // ============================================================================

  test('should submit form when pressing Enter in email field', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({ success: true });

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(emailInput, '{Enter}');

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('should submit form when pressing Enter in password field', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({ success: true });

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123{Enter}');

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  // ============================================================================
  // Autocomplete Tests
  // ============================================================================

  test('should have email autocomplete on email input', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    expect(emailInput).toHaveAttribute('autocomplete', 'email');
  });

  test('should have current-password autocomplete on password input', () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });

  // ============================================================================
  // Error Clearing Tests
  // ============================================================================

  test('should clear error when submitting again', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValueOnce({ success: false, error: 'Wrong password' });

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Se connecter');

    // First attempt - fail
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrong');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Wrong password')).toBeInTheDocument();
    });

    // Second attempt - should clear error
    mockSignIn.mockResolvedValueOnce({ success: true });

    await user.clear(passwordInput);
    await user.type(passwordInput, 'correct');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('⚠️ Wrong password')).not.toBeInTheDocument();
    });
  });

  test('should clear error when attempting social login', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValueOnce({ success: false, error: 'Wrong password' });

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Se connecter');

    // Email login fails
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrong');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Wrong password')).toBeInTheDocument();
    });

    // Try social login - should clear error
    mockSignInWithGoogle.mockResolvedValue(undefined);

    const googleButton = screen.getByText('Continuer avec Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.queryByText('⚠️ Wrong password')).not.toBeInTheDocument();
    });
  });
});
