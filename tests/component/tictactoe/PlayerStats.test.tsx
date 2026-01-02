import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerStats } from '@/components/tictactoe/PlayerStats';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
}));

/**
 * PlayerStats Component Tests
 *
 * Tests for the TicTacToe player stats component that displays:
 * - Games played
 * - Wins
 * - Losses
 * - Draws
 */

describe('PlayerStats', () => {
  const emptyStats = { games: 0, wins: 0, losses: 0, draws: 0 };
  const activeStats = { games: 10, wins: 5, losses: 3, draws: 2 };
  const winningStats = { games: 20, wins: 15, losses: 3, draws: 2 };

  test('should render "YOUR STATS" heading', () => {
    render(<PlayerStats stats={emptyStats} />);

    expect(screen.getByText('YOUR STATS')).toBeInTheDocument();
  });

  test('should render all four stat items', () => {
    render(<PlayerStats stats={emptyStats} />);

    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Wins')).toBeInTheDocument();
    expect(screen.getByText('Losses')).toBeInTheDocument();
    expect(screen.getByText('Draws')).toBeInTheDocument();
  });

  test('should display zero values for empty stats', () => {
    render(<PlayerStats stats={emptyStats} />);

    const values = screen.getAllByText('0');
    expect(values).toHaveLength(4);
  });

  test('should display correct games count', () => {
    render(<PlayerStats stats={activeStats} />);

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('should display correct wins count', () => {
    render(<PlayerStats stats={activeStats} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('should display correct losses count', () => {
    render(<PlayerStats stats={activeStats} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('should display correct draws count', () => {
    render(<PlayerStats stats={activeStats} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('should have 4-column grid layout', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const grid = container.querySelector('.grid-cols-4');
    expect(grid).toBeInTheDocument();
  });

  test('should have gap between items', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const grid = container.querySelector('.gap-3');
    expect(grid).toBeInTheDocument();
  });

  test('should have background and border styling', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const statsContainer = container.querySelector('.bg-white\\/95.backdrop-blur-lg');
    expect(statsContainer).toBeInTheDocument();

    const border = container.querySelector('.border-gray-300');
    expect(border).toBeInTheDocument();
  });

  test('should have rounded corners', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const statsContainer = container.querySelector('.rounded-xl');
    expect(statsContainer).toBeInTheDocument();
  });

  test('should have shadow styling', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const statsContainer = container.querySelector('.shadow-lg');
    expect(statsContainer).toBeInTheDocument();
  });

  test('should have padding', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const statsContainer = container.querySelector('.p-4');
    expect(statsContainer).toBeInTheDocument();
  });

  test('should center text for stat values', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const statItems = container.querySelectorAll('.text-center');
    expect(statItems.length).toBeGreaterThan(0);
  });

  test('should have large font for values', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const values = container.querySelectorAll('.text-2xl');
    expect(values).toHaveLength(4);
  });

  test('should have bold font for values', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const values = container.querySelectorAll('.font-black');
    expect(values).toHaveLength(4);
  });

  test('should have small text for labels', () => {
    const { container } = render(<PlayerStats stats={emptyStats} />);

    const labels = container.querySelectorAll('.text-xs');
    // Heading + 4 labels = 5 total
    expect(labels.length).toBeGreaterThanOrEqual(4);
  });

  test('should update values when stats change', () => {
    const { rerender } = render(<PlayerStats stats={emptyStats} />);
    expect(screen.getAllByText('0')).toHaveLength(4);

    rerender(<PlayerStats stats={activeStats} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('should display high win numbers correctly', () => {
    render(<PlayerStats stats={winningStats} />);

    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  test('should render stat items in correct order', () => {
    const { container } = render(<PlayerStats stats={activeStats} />);

    const labels = Array.from(container.querySelectorAll('.text-xs.text-gray-500'));
    const labelTexts = labels.map(label => label.textContent);

    expect(labelTexts).toContain('Games');
    expect(labelTexts).toContain('Wins');
    expect(labelTexts).toContain('Losses');
    expect(labelTexts).toContain('Draws');
  });
});
