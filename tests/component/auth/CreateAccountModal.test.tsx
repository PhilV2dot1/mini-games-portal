import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateAccountModal } from '@/components/auth/CreateAccountModal';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * CreateAccountModal Component Tests
 *
 * Tests for the account creation modal that allows users to:
 * - Sign up with email/password
 * - Confirm password match
 * - Sign up with OAuth providers
 * - View current stats
 * - Claim profile with localStorage stats migration
 */

// Mock dependencies
vi.mock('@/components/auth/AuthProvider');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, style, initial, animate, exit }: any) => (
      <div onClick={onClick} className={className} style={style}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock setTimeout
vi.useFakeTimers();

describe('CreateAccountModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockSignUp = vi.fn();
  const mockSignInWithGoogle = vi.fn();
  const mockSignInWithTwitter = vi.fn();
  const mockSignInWithDiscord = vi.fn();
  const mockClaimProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isAuthenticated: false,
      isAnonymous: true,
      loading: false,
      signUp: mockSignUp,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: mockSignInWithGoogle,
      signInWithTwitter: mockSignInWithTwitter,
      signInWithDiscord: mockSignInWithDiscord,
      linkWallet: vi.fn(),
      linkFarcaster: vi.fn(),
      claimProfile: mockClaimProfile,
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
      <CreateAccountModal isOpen={false} onClose={mockOnClose} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('should render when isOpen is true', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Créer un compte')).toBeInTheDocument();
    expect(screen.getByText('Sauvegardez vos progrès et jouez sur tous vos appareils')).toBeInTheDocument();
  });

  test('should close when clicking backdrop', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60');
    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  // ============================================================================
  // Stats Display Tests
  // ============================================================================

  test('should display current stats when provided', () => {
    const stats = { totalPoints: 500, gamesPlayed: 10 };

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} currentStats={stats} />);

    expect(screen.getByText('🎮 Vos stats actuelles')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('Parties')).toBeInTheDocument();
    expect(screen.getByText('Ces stats seront préservées !')).toBeInTheDocument();
  });

  test('should not display stats when gamesPlayed is 0', () => {
    const stats = { totalPoints: 0, gamesPlayed: 0 };

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} currentStats={stats} />);

    expect(screen.queryByText('🎮 Vos stats actuelles')).not.toBeInTheDocument();
  });

  test('should not display stats when not provided', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.queryByText('🎮 Vos stats actuelles')).not.toBeInTheDocument();
  });

  test('should display large stats correctly', () => {
    const stats = { totalPoints: 9999, gamesPlayed: 999 };

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} currentStats={stats} />);

    expect(screen.getByText('9999')).toBeInTheDocument();
    expect(screen.getByText('999')).toBeInTheDocument();
  });

  // ============================================================================
  // Social Login Tests
  // ============================================================================

  test('should render all social login buttons', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Continuer avec Google')).toBeInTheDocument();
    expect(screen.getByText('Continuer avec Twitter')).toBeInTheDocument();
    expect(screen.getByText('Continuer avec Discord')).toBeInTheDocument();
  });

  test('should call signInWithGoogle when clicking Google button', async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined);

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const googleButton = screen.getByText('Continuer avec Google');
    fireEvent.click(googleButton);

    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  test('should call signInWithTwitter when clicking Twitter button', async () => {
    mockSignInWithTwitter.mockResolvedValue(undefined);

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const twitterButton = screen.getByText('Continuer avec Twitter');
    fireEvent.click(twitterButton);

    expect(mockSignInWithTwitter).toHaveBeenCalled();
  });

  test('should call signInWithDiscord when clicking Discord button', async () => {
    mockSignInWithDiscord.mockResolvedValue(undefined);

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const discordButton = screen.getByText('Continuer avec Discord');
    fireEvent.click(discordButton);

    expect(mockSignInWithDiscord).toHaveBeenCalled();
  });

  test('should show error when social login fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSignInWithGoogle.mockRejectedValue(new Error('OAuth failed'));

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const googleButton = screen.getByText('Continuer avec Google');
    fireEvent.click(googleButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Échec de la connexion sociale')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  // ============================================================================
  // Form Rendering Tests
  // ============================================================================

  test('should render email input', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument();
  });

  test('should render password input', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    expect(passwordInputs).toHaveLength(2); // Password and confirm password
  });

  test('should render password hint', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Minimum 8 caractères')).toBeInTheDocument();
  });

  test('should render submit button', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Créer mon compte')).toBeInTheDocument();
  });

  // ============================================================================
  // Form Validation Tests
  // ============================================================================

  test('should show error when email is empty', async () => {
    const user = userEvent.setup({ delay: null });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Email et mot de passe requis')).toBeInTheDocument();
  });

  test('should show error when password is empty', async () => {
    const user = userEvent.setup({ delay: null });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Email et mot de passe requis')).toBeInTheDocument();
  });

  test('should show error when password is too short', async () => {
    const user = userEvent.setup({ delay: null });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInputs[0], 'short');
    await user.type(passwordInputs[1], 'short');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Le mot de passe doit contenir au moins 8 caractères')).toBeInTheDocument();
  });

  test('should show error when passwords do not match', async () => {
    const user = userEvent.setup({ delay: null });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'different456');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Les mots de passe ne correspondent pas')).toBeInTheDocument();
  });

  test('should accept password with exactly 8 characters', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockResolvedValue({ success: true });
    mockClaimProfile.mockResolvedValue({ success: true });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInputs[0], '12345678');
    await user.type(passwordInputs[1], '12345678');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', '12345678');
  });

  // ============================================================================
  // Signup Flow Tests
  // ============================================================================

  test('should call signUp with email and password', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockResolvedValue({ success: true });
    mockClaimProfile.mockResolvedValue({ success: true });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInputs[0], 'mypassword123');
    await user.type(passwordInputs[1], 'mypassword123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'mypassword123');
  });

  test('should claim profile with localStorage stats after signup', async () => {
    const user = userEvent.setup({ delay: null });

    const mockStats = {
      totalPoints: 500,
      gamesPlayed: 10,
      games: { blackjack: { wins: 5 } },
    };

    localStorage.setItem('celo_games_portal_stats', JSON.stringify(mockStats));

    mockSignUp.mockResolvedValue({ success: true });
    mockClaimProfile.mockResolvedValue({ success: true });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(mockClaimProfile).toHaveBeenCalledWith(mockStats);
  });

  test('should remove localStorage stats after successful migration', async () => {
    const user = userEvent.setup({ delay: null });

    const mockStats = { totalPoints: 500, gamesPlayed: 10 };
    localStorage.setItem('celo_games_portal_stats', JSON.stringify(mockStats));

    mockSignUp.mockResolvedValue({ success: true });
    mockClaimProfile.mockResolvedValue({ success: true });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(localStorage.getItem('celo_games_portal_stats')).toBeNull();
  });

  test('should show success message after signup', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockResolvedValue({ success: true });
    mockClaimProfile.mockResolvedValue({ success: true });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('✅ Compte créé avec succès !')).toBeInTheDocument();
    expect(screen.getByText('Vérifiez votre email pour confirmer')).toBeInTheDocument();
  });

  test('should close modal after 2 seconds on success', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockResolvedValue({ success: true });
    mockClaimProfile.mockResolvedValue({ success: true });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('✅ Compte créé avec succès !')).toBeInTheDocument();

    // Fast-forward 2 seconds
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should show error when signUp fails', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockResolvedValue({ success: false, error: 'Email already exists' });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Email already exists')).toBeInTheDocument();

    expect(mockClaimProfile).not.toHaveBeenCalled();
  });

  test('should show generic error when signUp fails without error message', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockResolvedValue({ success: false });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Échec de la création du compte')).toBeInTheDocument();
  });

  test('should handle exception during signup', async () => {
    const user = userEvent.setup({ delay: null });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockSignUp.mockRejectedValue(new Error('Network error'));

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ Une erreur est survenue')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  // ============================================================================
  // Loading State Tests
  // ============================================================================

  test('should show loading text when submitting', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Création en cours...')).toBeInTheDocument();
  });

  test('should disable inputs when loading', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockImplementation(() => new Promise(() => {}));

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
    });

    expect(emailInput).toBeDisabled();
    expect(passwordInputs[0]).toBeDisabled();
    expect(passwordInputs[1]).toBeDisabled();
  });

  test('should disable social buttons when loading', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockImplementation(() => new Promise(() => {}));

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Continuer avec Google').closest('button')).toBeDisabled();
    expect(screen.getByText('Continuer avec Twitter').closest('button')).toBeDisabled();
    expect(screen.getByText('Continuer avec Discord').closest('button')).toBeDisabled();
  });

  // ============================================================================
  // Guest Mode Tests
  // ============================================================================

  test('should render guest mode button', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Continuer en tant qu'invité")).toBeInTheDocument();
  });

  test('should close modal when clicking guest mode', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const guestButton = screen.getByText("Continuer en tant qu'invité");
    fireEvent.click(guestButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  // ============================================================================
  // Footer Tests
  // ============================================================================

  test('should render terms of service text', () => {
    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("En créant un compte, vous acceptez nos conditions d'utilisation")).toBeInTheDocument();
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  test('should not claim profile if no localStorage stats', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockResolvedValue({ success: true });
    mockClaimProfile.mockResolvedValue({ success: true });

    // Ensure localStorage is empty
    localStorage.removeItem('celo_games_portal_stats');

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(mockSignUp).toHaveBeenCalled();

    // Should not call claimProfile if no stats
    expect(mockClaimProfile).not.toHaveBeenCalled();
  });

  test('should clear error when submitting again', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockResolvedValueOnce({ success: false, error: 'First error' });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Créer mon compte');

    // First attempt
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('⚠️ First error')).toBeInTheDocument();

    // Second attempt - should clear error
    mockSignUp.mockResolvedValueOnce({ success: true });
    mockClaimProfile.mockResolvedValue({ success: true });

    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    expect(screen.queryByText('⚠️ First error')).not.toBeInTheDocument();
  });

  test('should handle whitespace in email', async () => {
    const user = userEvent.setup({ delay: null });

    mockSignUp.mockResolvedValue({ success: true });
    mockClaimProfile.mockResolvedValue({ success: true });

    render(<CreateAccountModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');

    await user.type(emailInput, '  test@example.com  ');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByText('Créer mon compte');
    fireEvent.click(submitButton);

    await act(async () => {
      await Promise.resolve();
      await vi.runAllTimersAsync();
    });

    // Component trims whitespace from email (correct behavior)
    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
