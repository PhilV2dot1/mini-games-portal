import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameStatus } from '@/components/tictactoe/GameStatus';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

/**
 * GameStatus Component Tests
 *
 * Tests for the TicTacToe game status component that displays:
 * - Game messages
 * - Win/lose/draw states with different styling
 * - No result state
 */

describe('GameStatus', () => {
  test('should render the message', () => {
    render(<GameStatus message="Your turn!" />);

    expect(screen.getByText('Your turn!')).toBeInTheDocument();
  });

  test('should render win state with correct styling', () => {
    const { container } = render(<GameStatus message="You won!" result="win" />);

    expect(screen.getByText('You won!')).toBeInTheDocument();
    const statusDiv = container.querySelector('.border-\\[\\#FCFF52\\]');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should render lose state with correct styling', () => {
    const { container } = render(<GameStatus message="You lost!" result="lose" />);

    expect(screen.getByText('You lost!')).toBeInTheDocument();
    const statusDiv = container.querySelector('.border-gray-500');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should render draw state with correct styling', () => {
    const { container } = render(<GameStatus message="It's a draw!" result="draw" />);

    expect(screen.getByText("It's a draw!")).toBeInTheDocument();
    const statusDiv = container.querySelector('.border-\\[\\#FCFF52\\]');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should render no result state with default styling', () => {
    const { container } = render(<GameStatus message="Make your move" />);

    expect(screen.getByText('Make your move')).toBeInTheDocument();
    const statusDiv = container.querySelector('.bg-white\\/90');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should have rounded corners', () => {
    const { container } = render(<GameStatus message="Test" />);

    const statusDiv = container.querySelector('.rounded-xl');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should have padding', () => {
    const { container } = render(<GameStatus message="Test" />);

    const statusDiv = container.querySelector('.px-6.py-3');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should have bold font', () => {
    const { container } = render(<GameStatus message="Test" />);

    const statusDiv = container.querySelector('.font-bold');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should be centered', () => {
    const { container } = render(<GameStatus message="Test" />);

    const statusDiv = container.querySelector('.text-center');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should have shadow', () => {
    const { container } = render(<GameStatus message="Test" />);

    const statusDiv = container.querySelector('.shadow-lg');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should have border', () => {
    const { container } = render(<GameStatus message="Test" />);

    const statusDiv = container.querySelector('.border-2');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should have gradient background for win', () => {
    const { container } = render(<GameStatus message="You won!" result="win" />);

    const statusDiv = container.querySelector('.bg-gradient-to-br');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should have gradient background for lose', () => {
    const { container } = render(<GameStatus message="You lost!" result="lose" />);

    const statusDiv = container.querySelector('.bg-gradient-to-br');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should have gradient background for draw', () => {
    const { container } = render(<GameStatus message="It's a draw!" result="draw" />);

    const statusDiv = container.querySelector('.bg-gradient-to-br');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should handle result prop being null', () => {
    const { container } = render(<GameStatus message="Waiting..." result={null} />);

    expect(screen.getByText('Waiting...')).toBeInTheDocument();
    const statusDiv = container.querySelector('.bg-white\\/90');
    expect(statusDiv).toBeInTheDocument();
  });

  test('should update message when it changes', () => {
    const { rerender } = render(<GameStatus message="Message 1" />);
    expect(screen.getByText('Message 1')).toBeInTheDocument();

    rerender(<GameStatus message="Message 2" />);
    expect(screen.getByText('Message 2')).toBeInTheDocument();
  });

  test('should update result styling when it changes', () => {
    const { rerender, container } = render(<GameStatus message="Game on" result={null} />);
    let statusDiv = container.querySelector('.bg-white\\/90');
    expect(statusDiv).toBeInTheDocument();

    rerender(<GameStatus message="You won!" result="win" />);
    statusDiv = container.querySelector('.border-\\[\\#FCFF52\\]');
    expect(statusDiv).toBeInTheDocument();
  });
});
