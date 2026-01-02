import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TicTacToeBoard } from '@/components/tictactoe/TicTacToeBoard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} {...props}>{children}</div>
    ),
  },
}));

// Mock TicTacToeCell component
vi.mock('@/components/tictactoe/TicTacToeCell', () => ({
  TicTacToeCell: ({ value, onClick, disabled }: any) => (
    <button
      data-testid="tictactoe-cell"
      data-value={value}
      onClick={onClick}
      disabled={disabled}
    >
      {value === 1 ? 'X' : value === 2 ? 'O' : ''}
    </button>
  ),
}));

/**
 * TicTacToeBoard Component Tests
 *
 * Tests for the TicTacToe board component that displays:
 * - 3x3 grid of cells
 * - Board state
 * - Click handling
 * - Disabled state
 */

describe('TicTacToeBoard', () => {
  const mockOnCellClick = vi.fn();
  const emptyBoard: (0 | 1 | 2)[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const partialBoard: (0 | 1 | 2)[] = [1, 2, 0, 0, 1, 0, 0, 0, 2];
  const fullBoard: (0 | 1 | 2)[] = [1, 2, 1, 2, 1, 2, 2, 1, 2];

  beforeEach(() => {
    mockOnCellClick.mockClear();
  });

  test('should render 9 cells', () => {
    render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const cells = screen.getAllByTestId('tictactoe-cell');
    expect(cells).toHaveLength(9);
  });

  test('should render empty board correctly', () => {
    render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const cells = screen.getAllByTestId('tictactoe-cell');
    cells.forEach(cell => {
      expect(cell).toHaveAttribute('data-value', '0');
      expect(cell.textContent).toBe('');
    });
  });

  test('should render partial board correctly', () => {
    render(<TicTacToeBoard board={partialBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const cells = screen.getAllByTestId('tictactoe-cell');
    expect(cells[0]).toHaveAttribute('data-value', '1');
    expect(cells[0]).toHaveTextContent('X');
    expect(cells[1]).toHaveAttribute('data-value', '2');
    expect(cells[1]).toHaveTextContent('O');
    expect(cells[2]).toHaveAttribute('data-value', '0');
    expect(cells[2]).toHaveTextContent('');
  });

  test('should render full board correctly', () => {
    render(<TicTacToeBoard board={fullBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const cells = screen.getAllByTestId('tictactoe-cell');
    cells.forEach((cell, index) => {
      const expectedValue = fullBoard[index];
      expect(cell).toHaveAttribute('data-value', expectedValue.toString());
    });
  });

  test('should pass disabled prop to all cells', () => {
    render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={true} />);

    const cells = screen.getAllByTestId('tictactoe-cell');
    cells.forEach(cell => {
      expect(cell).toBeDisabled();
    });
  });

  test('should not disable cells when disabled is false', () => {
    render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const cells = screen.getAllByTestId('tictactoe-cell');
    cells.forEach(cell => {
      expect(cell).not.toBeDisabled();
    });
  });

  test('should have 3x3 grid layout', () => {
    const { container } = render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  test('should have gap between cells', () => {
    const { container } = render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const grid = container.querySelector('.gap-3');
    expect(grid).toBeInTheDocument();
  });

  test('should have background and border styling', () => {
    const { container } = render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const gridContainer = container.querySelector('.bg-white\\/95.backdrop-blur-lg');
    expect(gridContainer).toBeInTheDocument();

    const border = container.querySelector('.border-2.border-gray-700');
    expect(border).toBeInTheDocument();
  });

  test('should have rounded corners', () => {
    const { container } = render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const gridContainer = container.querySelector('.rounded-2xl');
    expect(gridContainer).toBeInTheDocument();
  });

  test('should have shadow styling', () => {
    const { container } = render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const gridContainer = container.querySelector('.shadow-xl');
    expect(gridContainer).toBeInTheDocument();
  });

  test('should have padding', () => {
    const { container } = render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const gridContainer = container.querySelector('.p-4');
    expect(gridContainer).toBeInTheDocument();
  });

  test('should render without errors', () => {
    const { container } = render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    // Just ensure the component renders successfully
    expect(container.firstChild).toBeInTheDocument();
  });

  test('should have full width', () => {
    const { container } = render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const boardContainer = container.querySelector('.w-full');
    expect(boardContainer).toBeInTheDocument();
  });

  test('should have centered layout', () => {
    const { container } = render(<TicTacToeBoard board={emptyBoard} onCellClick={mockOnCellClick} disabled={false} />);

    const boardContainer = container.querySelector('.mx-auto');
    expect(boardContainer).toBeInTheDocument();
  });
});
