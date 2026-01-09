import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameCard } from '@/components/games/GameCard';
import { useLocalStats } from '@/hooks/useLocalStats';
import type { GameMetadata } from '@/lib/types';

/**
 * GameCard Component Tests
 *
 * Tests for the game card component that displays:
 * - Game icon, name, and description
 * - NEW badge for new games
 * - Fee indicator for paid games
 * - Player stats (played, wins, points)
 * - Hover animations
 */

// Mock dependencies
vi.mock('@/hooks/useLocalStats');
vi.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => {
      // Mock translations for game descriptions
      const translations: Record<string, string> = {
        'games.blackjack': 'Beat the dealer to 21!',
        'games.rps': 'Classic hand game!',
        'games.tictactoe': 'Get three in a row!',
        'games.jackpot': 'Spin the crypto wheel!',
        'games.2048': 'Merge tiles to 2048!',
        'games.mastermind': 'Crack the crypto code!',
      };
      return translations[key] || key;
    },
  }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, className }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  ),
}));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, whileHover, whileTap, transition }: any) => (
      <div
        className={className}
        style={style}
        data-while-hover={JSON.stringify(whileHover)}
        data-while-tap={JSON.stringify(whileTap)}
        data-transition={JSON.stringify(transition)}
      >
        {children}
      </div>
    ),
    button: ({ children, className, style, whileHover, whileTap, transition, ...props }: any) => (
      <button
        className={className}
        style={style}
        data-while-hover={JSON.stringify(whileHover)}
        data-while-tap={JSON.stringify(whileTap)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </button>
    ),
  },
}));

describe('GameCard', () => {
  const mockGame: GameMetadata = {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Beat the dealer to 21',
    icon: '/icons/blackjack.svg',
    route: '/games/blackjack',
    hasFee: false,
    category: 'card',
  };

  const mockGetStats = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLocalStats).mockReturnValue({
      getStats: mockGetStats,
      updateStats: vi.fn(),
      getTotalPoints: vi.fn(),
      getAllGames: vi.fn(),
      clearStats: vi.fn(),
    });
  });

  // ============================================================================
  // Basic Rendering Tests
  // ============================================================================

  test('should render game name', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    expect(screen.getByText('Blackjack')).toBeInTheDocument();
  });

  test('should render game description', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    // Description comes from i18n mock
    expect(screen.getByText('Beat the dealer to 21!')).toBeInTheDocument();
  });

  test('should render game icon', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    const icon = screen.getByAltText('Blackjack');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/icons/blackjack.svg');
  });

  test('should render as link to game route', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/games/blackjack');
  });

  test('should render play button', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    expect(screen.getByText('Play Now')).toBeInTheDocument();
  });

  // ============================================================================
  // NEW Badge Tests (badges removed in new design)
  // ============================================================================

  test('should not show NEW badge (removed in new design)', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} isNew={true} />);

    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  test('should not show NEW badge when isNew is false', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} isNew={false} />);

    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  test('should not show NEW badge by default', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Fee Indicator Tests (fee badges removed in new design)
  // ============================================================================

  test('should not show fee indicator for paid games (removed in new design)', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const paidGame: GameMetadata = {
      ...mockGame,
      hasFee: true,
    };

    render(<GameCard game={paidGame} />);

    expect(screen.queryByText('0.01 CELO')).not.toBeInTheDocument();
  });

  test('should not show fee indicator for free games', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    expect(screen.queryByText('0.01 CELO')).not.toBeInTheDocument();
  });

  test('should not show fee indicator or NEW badge (both removed in new design)', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const newPaidGame: GameMetadata = {
      ...mockGame,
      hasFee: true,
    };

    render(<GameCard game={newPaidGame} isNew={true} />);

    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
    expect(screen.queryByText('0.01 CELO')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Stats Display Tests
  // ============================================================================

  test('should not show stats when player has not played', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    expect(screen.queryByText('Played')).not.toBeInTheDocument();
    expect(screen.queryByText('Wins')).not.toBeInTheDocument();
    expect(screen.queryByText('Points')).not.toBeInTheDocument();
  });

  test('should show stats when player has played', () => {
    mockGetStats.mockReturnValue({ played: 10, wins: 5, totalPoints: 150 });

    render(<GameCard game={mockGame} />);

    expect(screen.getByText('Played')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('Wins')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  test('should show stats with 0 wins', () => {
    mockGetStats.mockReturnValue({ played: 5, wins: 0, totalPoints: 25 });

    render(<GameCard game={mockGame} />);

    expect(screen.getByText('Played')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Wins')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();

    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  test('should show stats with high numbers', () => {
    mockGetStats.mockReturnValue({ played: 999, wins: 500, totalPoints: 15000 });

    render(<GameCard game={mockGame} />);

    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('15000')).toBeInTheDocument();
  });

  test('should call getStats with game id', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    expect(mockGetStats).toHaveBeenCalledWith('blackjack');
  });

  // ============================================================================
  // Different Game Types Tests
  // ============================================================================

  test('should render RPS game correctly', () => {
    mockGetStats.mockReturnValue({ played: 3, wins: 2, totalPoints: 45 });

    const rpsGame: GameMetadata = {
      id: 'rps',
      name: 'Rock Paper Scissors',
      description: 'Classic hand game',
      icon: '/icons/rps.svg',
      route: '/games/rps',
      hasFee: false,
      category: 'casual',
    };

    render(<GameCard game={rpsGame} />);

    expect(screen.getByText('Rock Paper Scissors')).toBeInTheDocument();
    // Description comes from i18n mock with exclamation
    expect(screen.getByText('Classic hand game!')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  test('should render 2048 game without fee indicator', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const game2048: GameMetadata = {
      id: '2048',
      name: '2048',
      description: 'Merge tiles to 2048',
      icon: '/icons/2048.svg',
      route: '/games/2048',
      hasFee: true,
      category: 'puzzle',
    };

    render(<GameCard game={game2048} />);

    expect(screen.getByText('2048')).toBeInTheDocument();
    expect(screen.queryByText('0.01 CELO')).not.toBeInTheDocument();
  });

  test('should render Mastermind game without fee indicator', () => {
    mockGetStats.mockReturnValue({ played: 7, wins: 4, totalPoints: 120 });

    const mastermindGame: GameMetadata = {
      id: 'mastermind',
      name: 'Mastermind',
      description: 'Crack the code',
      icon: '/icons/mastermind.svg',
      route: '/games/mastermind',
      hasFee: true,
      category: 'puzzle',
    };

    render(<GameCard game={mastermindGame} />);

    expect(screen.getByText('Mastermind')).toBeInTheDocument();
    // Description comes from i18n mock: 'Crack the crypto code!'
    expect(screen.getByText('Crack the crypto code!')).toBeInTheDocument();
    expect(screen.queryByText('0.01 CELO')).not.toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  test('should handle boolean stats return value', () => {
    mockGetStats.mockReturnValue(false);

    render(<GameCard game={mockGame} />);

    // Should not show stats
    expect(screen.queryByText('Played')).not.toBeInTheDocument();
  });

  test('should handle stats without played property', () => {
    mockGetStats.mockReturnValue({ wins: 5, totalPoints: 100 });

    render(<GameCard game={mockGame} />);

    // Should not show stats without played property
    expect(screen.queryByText('Played')).not.toBeInTheDocument();
  });

  test('should handle very long game name', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const longNameGame: GameMetadata = {
      ...mockGame,
      name: 'Super Ultra Mega Awesome Game Name',
    };

    render(<GameCard game={longNameGame} />);

    expect(screen.getByText('Super Ultra Mega Awesome Game Name')).toBeInTheDocument();
  });

  test('should handle very long description', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const longDescGame: GameMetadata = {
      ...mockGame,
      id: 'unknown-game', // Use ID not in i18n mock to trigger fallback
      description: 'This is a very long description that explains the game in great detail and might wrap to multiple lines in the UI',
    };

    render(<GameCard game={longDescGame} />);

    // When translation not found, i18n returns the key
    expect(screen.getByText('games.unknown-game')).toBeInTheDocument();
  });

  test('should handle game with special characters in name', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const specialCharGame: GameMetadata = {
      ...mockGame,
      name: 'Rock, Paper & Scissors!',
    };

    render(<GameCard game={specialCharGame} />);

    expect(screen.getByText('Rock, Paper & Scissors!')).toBeInTheDocument();
  });

  // ============================================================================
  // Animation Props Tests
  // ============================================================================

  test('should have hover animation props', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const { container } = render(<GameCard game={mockGame} />);

    const motionDiv = container.querySelector('[data-while-hover]');
    expect(motionDiv).toBeInTheDocument();

    const whileHover = JSON.parse(motionDiv!.getAttribute('data-while-hover')!);
    // Check that hover animation includes scale and y properties
    expect(whileHover.scale).toBe(1.02);
    expect(whileHover.y).toBe(-4);
  });

  test('should have gray border initially that changes on hover', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const { container } = render(<GameCard game={mockGame} />);

    // Card should have gray border and hover classes
    const card = container.querySelector('.border-gray-200');
    expect(card).toBeInTheDocument();
    expect(card?.className).toContain('hover:border-celo');
    expect(card?.className).toContain('border-2');
  });
});
