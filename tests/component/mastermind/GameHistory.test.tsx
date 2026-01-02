import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameHistory } from '@/components/mastermind/GameHistory';
import { GameHistory as GameHistoryType } from '@/lib/games/mastermind-logic';

// Mock GuessRow component
vi.mock('@/components/mastermind/GuessRow', () => ({
  GuessRow: ({ guess, feedback }: any) => (
    <div data-testid="guess-row">
      {guess.join(',')} | {feedback ? `${feedback.blackPegs}B-${feedback.whitePegs}W` : 'no feedback'}
    </div>
  ),
}));

/**
 * GameHistory Component Tests
 *
 * Tests for the Mastermind game history component that displays:
 * - Previous guess rows with feedback
 * - Empty rows for remaining attempts
 * - Scrollable container
 */

describe('GameHistory', () => {
  const createHistoryEntry = (guess: any[], blackPegs: number, whitePegs: number): GameHistoryType => ({
    guess,
    feedback: { blackPegs, whitePegs },
  });

  test('should render empty rows when no history', () => {
    const { container } = render(<GameHistory history={[]} maxAttempts={10} />);

    const emptyRows = container.querySelectorAll('.bg-white\\/40');
    expect(emptyRows).toHaveLength(10);
  });

  test('should render guess rows for history entries', () => {
    const history: GameHistoryType[] = [
      createHistoryEntry(['red', 'blue', 'green', 'yellow'], 1, 2),
      createHistoryEntry(['red', 'red', 'red', 'red'], 2, 0),
    ];

    render(<GameHistory history={history} maxAttempts={10} />);

    const guessRows = screen.getAllByTestId('guess-row');
    expect(guessRows).toHaveLength(2);
  });

  test('should render correct number of empty rows', () => {
    const history: GameHistoryType[] = [
      createHistoryEntry(['red', 'blue', 'green', 'yellow'], 1, 2),
      createHistoryEntry(['red', 'red', 'red', 'red'], 2, 0),
    ];

    const { container } = render(<GameHistory history={history} maxAttempts={10} />);

    // 10 max attempts - 2 history entries = 8 empty rows
    const emptyRows = container.querySelectorAll('.bg-white\\/40');
    expect(emptyRows).toHaveLength(8);
  });

  test('should not render empty rows when history is full', () => {
    const history: GameHistoryType[] = Array(10).fill(null).map(() =>
      createHistoryEntry(['red', 'blue', 'green', 'yellow'], 1, 1)
    );

    const { container } = render(<GameHistory history={history} maxAttempts={10} />);

    const emptyRows = container.querySelectorAll('.bg-white\\/40');
    expect(emptyRows).toHaveLength(0);
  });

  test('should render history entries with correct data', () => {
    const history: GameHistoryType[] = [
      createHistoryEntry(['red', 'blue', 'green', 'yellow'], 2, 1),
    ];

    render(<GameHistory history={history} maxAttempts={10} />);

    const guessRow = screen.getByTestId('guess-row');
    expect(guessRow).toHaveTextContent('red,blue,green,yellow');
    expect(guessRow).toHaveTextContent('2B-1W');
  });

  test('should have scrollable container', () => {
    const { container } = render(<GameHistory history={[]} maxAttempts={10} />);

    const scrollContainer = container.querySelector('.overflow-y-auto');
    expect(scrollContainer).toBeInTheDocument();
  });

  test('should have max height constraint', () => {
    const { container } = render(<GameHistory history={[]} maxAttempts={10} />);

    const scrollContainer = container.querySelector('.max-h-\\[400px\\]');
    expect(scrollContainer).toBeInTheDocument();
  });

  test('should have background and styling', () => {
    const { container } = render(<GameHistory history={[]} maxAttempts={10} />);

    const historyContainer = container.querySelector('.bg-white\\/60.backdrop-blur-sm');
    expect(historyContainer).toBeInTheDocument();
  });

  test('should have rounded corners', () => {
    const { container } = render(<GameHistory history={[]} maxAttempts={10} />);

    const historyContainer = container.querySelector('.rounded-lg');
    expect(historyContainer).toBeInTheDocument();
  });

  test('should have spacing between rows', () => {
    const { container } = render(<GameHistory history={[]} maxAttempts={10} />);

    const historyContainer = container.querySelector('.space-y-1');
    expect(historyContainer).toBeInTheDocument();
  });

  test('should handle single history entry', () => {
    const history: GameHistoryType[] = [
      createHistoryEntry(['red', 'blue', 'green', 'yellow'], 0, 4),
    ];

    const { container } = render(<GameHistory history={history} maxAttempts={10} />);

    const guessRows = screen.getAllByTestId('guess-row');
    expect(guessRows).toHaveLength(1);

    const emptyRows = container.querySelectorAll('.bg-white\\/40');
    expect(emptyRows).toHaveLength(9);
  });

  test('should handle maxAttempts of 12', () => {
    const history: GameHistoryType[] = [
      createHistoryEntry(['red', 'blue', 'green', 'yellow'], 1, 1),
    ];

    const { container } = render(<GameHistory history={history} maxAttempts={12} />);

    const emptyRows = container.querySelectorAll('.bg-white\\/40');
    expect(emptyRows).toHaveLength(11);
  });

  test('should render empty rows with correct styling', () => {
    const { container } = render(<GameHistory history={[]} maxAttempts={5} />);

    const emptyRows = Array.from(container.querySelectorAll('.bg-white\\/40'));

    emptyRows.forEach(row => {
      expect(row).toHaveClass('rounded-lg');
      expect(row).toHaveClass('border-gray-200');
    });
  });

  test('should render empty rows with correct height', () => {
    const { container } = render(<GameHistory history={[]} maxAttempts={5} />);

    const emptyRows = Array.from(container.querySelectorAll('.bg-white\\/40'));

    emptyRows.forEach(row => {
      expect(row).toHaveClass('h-10');
    });
  });

  test('should handle multiple history entries in order', () => {
    const history: GameHistoryType[] = [
      createHistoryEntry(['red', 'red', 'red', 'red'], 1, 0),
      createHistoryEntry(['blue', 'blue', 'blue', 'blue'], 2, 0),
      createHistoryEntry(['green', 'green', 'green', 'green'], 3, 0),
    ];

    render(<GameHistory history={history} maxAttempts={10} />);

    const guessRows = screen.getAllByTestId('guess-row');
    expect(guessRows[0]).toHaveTextContent('red,red,red,red');
    expect(guessRows[1]).toHaveTextContent('blue,blue,blue,blue');
    expect(guessRows[2]).toHaveTextContent('green,green,green,green');
  });

  test('should handle feedback with no pegs', () => {
    const history: GameHistoryType[] = [
      createHistoryEntry(['red', 'blue', 'green', 'yellow'], 0, 0),
    ];

    render(<GameHistory history={history} maxAttempts={10} />);

    const guessRow = screen.getByTestId('guess-row');
    expect(guessRow).toHaveTextContent('0B-0W');
  });

  test('should handle feedback with all black pegs', () => {
    const history: GameHistoryType[] = [
      createHistoryEntry(['red', 'blue', 'green', 'yellow'], 4, 0),
    ];

    render(<GameHistory history={history} maxAttempts={10} />);

    const guessRow = screen.getByTestId('guess-row');
    expect(guessRow).toHaveTextContent('4B-0W');
  });

  test('should have padding', () => {
    const { container } = render(<GameHistory history={[]} maxAttempts={10} />);

    const historyContainer = container.querySelector('.p-1\\.5');
    expect(historyContainer).toBeInTheDocument();
  });
});
