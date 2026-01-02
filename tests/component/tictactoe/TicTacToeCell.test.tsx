import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TicTacToeCell } from '@/components/tictactoe/TicTacToeCell';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, disabled, className, ...props }: any) => (
      <button onClick={onClick} disabled={disabled} className={className} {...props}>
        {children}
      </button>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>{children}</span>
    ),
  },
}));

/**
 * TicTacToeCell Component Tests
 *
 * Tests for the TicTacToe cell component that displays:
 * - Empty cells (value 0)
 * - X marks (value 1)
 * - O marks (value 2)
 * - Click handling
 * - Disabled states
 */

describe('TicTacToeCell', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  test('should render a button', () => {
    render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={false} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('should render empty cell when value is 0', () => {
    const { container } = render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('button');
    expect(button?.textContent).toBe('');
  });

  test('should render X when value is 1', () => {
    render(<TicTacToeCell value={1} onClick={mockOnClick} disabled={false} />);

    expect(screen.getByText('X')).toBeInTheDocument();
  });

  test('should render O when value is 2', () => {
    render(<TicTacToeCell value={2} onClick={mockOnClick} disabled={false} />);

    expect(screen.getByText('O')).toBeInTheDocument();
  });

  test('should call onClick when empty cell is clicked', () => {
    render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={false} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('should not call onClick when disabled', () => {
    render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('should be disabled when value is X', () => {
    render(<TicTacToeCell value={1} onClick={mockOnClick} disabled={false} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('should be disabled when value is O', () => {
    render(<TicTacToeCell value={2} onClick={mockOnClick} disabled={false} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('should be disabled when disabled prop is true', () => {
    render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('should have cursor-pointer when empty and not disabled', () => {
    const { container } = render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('.cursor-pointer');
    expect(button).toBeInTheDocument();
  });

  test('should have cursor-not-allowed when filled', () => {
    const { container } = render(<TicTacToeCell value={1} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('.cursor-not-allowed');
    expect(button).toBeInTheDocument();
  });

  test('should have cursor-not-allowed when disabled', () => {
    const { container } = render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={true} />);

    const button = container.querySelector('.cursor-not-allowed');
    expect(button).toBeInTheDocument();
  });

  test('should have border and background styling', () => {
    const { container } = render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('.border-2');
    expect(button).toBeInTheDocument();

    const bgGradient = container.querySelector('.bg-gradient-to-br');
    expect(bgGradient).toBeInTheDocument();
  });

  test('should have rounded corners', () => {
    const { container } = render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('.rounded-xl');
    expect(button).toBeInTheDocument();
  });

  test('should have aspect-square class', () => {
    const { container } = render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('.aspect-square');
    expect(button).toBeInTheDocument();
  });

  test('should have flex layout', () => {
    const { container } = render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('.flex.items-center.justify-center');
    expect(button).toBeInTheDocument();
  });

  test('should have shadow styling', () => {
    const { container } = render(<TicTacToeCell value={0} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('.shadow-md');
    expect(button).toBeInTheDocument();
  });

  test('should have large text size', () => {
    const { container } = render(<TicTacToeCell value={1} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('.text-4xl');
    expect(button).toBeInTheDocument();
  });

  test('should have bold font', () => {
    const { container } = render(<TicTacToeCell value={1} onClick={mockOnClick} disabled={false} />);

    const button = container.querySelector('.font-black');
    expect(button).toBeInTheDocument();
  });

  test('should handle all three values correctly', () => {
    const values: (0 | 1 | 2)[] = [0, 1, 2];

    values.forEach(value => {
      const { unmount } = render(<TicTacToeCell value={value} onClick={mockOnClick} disabled={false} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      unmount();
    });
  });

  test('should not call onClick when cell has X and is clicked', () => {
    render(<TicTacToeCell value={1} onClick={mockOnClick} disabled={false} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('should not call onClick when cell has O and is clicked', () => {
    render(<TicTacToeCell value={2} onClick={mockOnClick} disabled={false} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
