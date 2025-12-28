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

    expect(screen.getByText('Beat the dealer to 21')).toBeInTheDocument();
  });

  test('should render game icon', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    const icon = screen.getByAlt('Blackjack');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/icons/blackjack.svg');
  });

  test('should render as link to game route', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/games/blackjack');
  });

  test('should render play button hint', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    expect(screen.getByText('Play →')).toBeInTheDocument();
  });

  // ============================================================================
  // NEW Badge Tests
  // ============================================================================

  test('should show NEW badge when isNew is true', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} isNew={true} />);

    expect(screen.getByText('NEW')).toBeInTheDocument();
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
  // Fee Indicator Tests
  // ============================================================================

  test('should show fee indicator for paid games', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const paidGame: GameMetadata = {
      ...mockGame,
      hasFee: true,
    };

    render(<GameCard game={paidGame} />);

    expect(screen.getByText('0.01 CELO')).toBeInTheDocument();
  });

  test('should not show fee indicator for free games', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    render(<GameCard game={mockGame} />);

    expect(screen.queryByText('0.01 CELO')).not.toBeInTheDocument();
  });

  test('should not show fee indicator when game is new (NEW badge takes priority)', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const newPaidGame: GameMetadata = {
      ...mockGame,
      hasFee: true,
    };

    render(<GameCard game={newPaidGame} isNew={true} />);

    expect(screen.getByText('NEW')).toBeInTheDocument();
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
    expect(screen.getByText('Classic hand game')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  test('should render 2048 game with fee indicator', () => {
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
    expect(screen.getByText('0.01 CELO')).toBeInTheDocument();
  });

  test('should render Mastermind game', () => {
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
    expect(screen.getByText('Crack the code')).toBeInTheDocument();
    expect(screen.getByText('0.01 CELO')).toBeInTheDocument();
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
      description: 'This is a very long description that explains the game in great detail and might wrap to multiple lines in the UI',
    };

    render(<GameCard game={longDescGame} />);

    expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
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

  test('should have hover and tap animation props', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const { container } = render(<GameCard game={mockGame} />);

    const motionDiv = container.querySelector('[data-while-hover]');
    expect(motionDiv).toBeInTheDocument();

    const whileHover = JSON.parse(motionDiv!.getAttribute('data-while-hover')!);
    expect(whileHover).toEqual({ scale: 1.03, y: -3 });

    const whileTap = JSON.parse(motionDiv!.getAttribute('data-while-tap')!);
    expect(whileTap).toEqual({ scale: 0.98 });
  });

  test('should have correct border style', () => {
    mockGetStats.mockReturnValue({ played: 0, wins: 0, totalPoints: 0 });

    const { container } = render(<GameCard game={mockGame} />);

    const card = container.querySelector('[style*="border"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({ border: '3px solid #FCFF52' });
  });
});
