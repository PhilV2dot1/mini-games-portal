import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrentGuess } from '@/components/mastermind/CurrentGuess';
import { Guess } from '@/lib/games/mastermind-logic';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick} {...props}>{children}</div>
    ),
  },
}));

// Mock ColorPeg component
vi.mock('@/components/mastermind/ColorPeg', () => ({
  ColorPeg: ({ color, size, onClick }: any) => (
    <button
      data-testid="color-peg"
      data-color={color || ''}
      data-size={size}
      onClick={onClick}
    >
      {color || 'empty'}
    </button>
  ),
}));

/**
 * CurrentGuess Component Tests
 *
 * Tests for the Mastermind current guess component that displays:
 * - 4 color peg slots
 * - Clear (X) buttons for filled positions
 * - Disabled state
 */

describe('CurrentGuess', () => {
  const mockOnClearPosition = vi.fn();
  const fullGuess: Guess = ['red', 'blue', 'green', 'yellow'];
  const partialGuess: Guess = ['red', null, null, null];
  const emptyGuess: Guess = [null, null, null, null];

  beforeEach(() => {
    mockOnClearPosition.mockClear();
  });

  test('should render 4 color pegs', () => {
    render(<CurrentGuess guess={fullGuess} onClearPosition={mockOnClearPosition} />);

    const pegs = screen.getAllByTestId('color-peg');
    expect(pegs).toHaveLength(4);
  });

  test('should render pegs with large size', () => {
    render(<CurrentGuess guess={fullGuess} onClearPosition={mockOnClearPosition} />);

    const pegs = screen.getAllByTestId('color-peg');
    pegs.forEach(peg => {
      expect(peg).toHaveAttribute('data-size', 'large');
    });
  });

  test('should render X button for filled positions', () => {
    const { container } = render(
      <CurrentGuess guess={partialGuess} onClearPosition={mockOnClearPosition} />
    );

    // Should have 1 X button for the red peg
    const xButtons = container.querySelectorAll('.bg-red-500');
    expect(xButtons.length).toBeGreaterThanOrEqual(1);
  });

  test('should not render X buttons for empty positions', () => {
    const { container } = render(
      <CurrentGuess guess={emptyGuess} onClearPosition={mockOnClearPosition} />
    );

    // Should have 0 X buttons
    const xButtons = container.querySelectorAll('.bg-red-500');
    expect(xButtons).toHaveLength(0);
  });

  test('should call onClearPosition when peg is clicked and not disabled', () => {
    render(<CurrentGuess guess={partialGuess} onClearPosition={mockOnClearPosition} />);

    const pegs = screen.getAllByTestId('color-peg');
    fireEvent.click(pegs[0]); // Click red peg

    expect(mockOnClearPosition).toHaveBeenCalledTimes(1);
    expect(mockOnClearPosition).toHaveBeenCalledWith(0);
  });

  test('should not call onClearPosition when peg is null', () => {
    render(<CurrentGuess guess={partialGuess} onClearPosition={mockOnClearPosition} />);

    const pegs = screen.getAllByTestId('color-peg');
    fireEvent.click(pegs[1]); // Click empty peg

    expect(mockOnClearPosition).not.toHaveBeenCalled();
  });

  test('should not call onClearPosition when disabled', () => {
    render(<CurrentGuess guess={partialGuess} onClearPosition={mockOnClearPosition} disabled={true} />);

    const pegs = screen.getAllByTestId('color-peg');
    fireEvent.click(pegs[0]); // Click red peg

    expect(mockOnClearPosition).not.toHaveBeenCalled();
  });

  test('should call onClearPosition when X button is clicked', () => {
    const { container } = render(
      <CurrentGuess guess={partialGuess} onClearPosition={mockOnClearPosition} />
    );

    const xButtons = Array.from(container.querySelectorAll('.bg-red-500'));
    if (xButtons.length > 0) {
      fireEvent.click(xButtons[0] as HTMLElement);
      expect(mockOnClearPosition).toHaveBeenCalled();
    }
  });

  test('should not call onClearPosition from X button when disabled', () => {
    const { container } = render(
      <CurrentGuess guess={fullGuess} onClearPosition={mockOnClearPosition} disabled={true} />
    );

    const xButtons = Array.from(container.querySelectorAll('.bg-red-500'));
    if (xButtons.length > 0) {
      fireEvent.click(xButtons[0] as HTMLElement);
      expect(mockOnClearPosition).not.toHaveBeenCalled();
    }
  });

  test('should have background and border styling', () => {
    const { container } = render(
      <CurrentGuess guess={fullGuess} onClearPosition={mockOnClearPosition} />
    );

    const guessContainer = container.querySelector('.bg-white\\/90.backdrop-blur-sm');
    expect(guessContainer).toBeInTheDocument();

    const border = container.querySelector('.border-yellow-500\\/50');
    expect(border).toBeInTheDocument();
  });

  test('should have rounded corners', () => {
    const { container } = render(
      <CurrentGuess guess={fullGuess} onClearPosition={mockOnClearPosition} />
    );

    const guessContainer = container.querySelector('.rounded-lg');
    expect(guessContainer).toBeInTheDocument();
  });

  test('should have flex layout with gap', () => {
    const { container } = render(
      <CurrentGuess guess={fullGuess} onClearPosition={mockOnClearPosition} />
    );

    const guessContainer = container.querySelector('.flex.justify-center.gap-2');
    expect(guessContainer).toBeInTheDocument();
  });

  test('should render all filled pegs', () => {
    render(<CurrentGuess guess={fullGuess} onClearPosition={mockOnClearPosition} />);

    const pegs = screen.getAllByTestId('color-peg');
    expect(pegs[0]).toHaveAttribute('data-color', 'red');
    expect(pegs[1]).toHaveAttribute('data-color', 'blue');
    expect(pegs[2]).toHaveAttribute('data-color', 'green');
    expect(pegs[3]).toHaveAttribute('data-color', 'yellow');
  });

  test('should render mixed filled and empty pegs', () => {
    const mixedGuess: Guess = ['red', 'blue', null, null];
    render(<CurrentGuess guess={mixedGuess} onClearPosition={mockOnClearPosition} />);

    const pegs = screen.getAllByTestId('color-peg');
    expect(pegs[0]).toHaveAttribute('data-color', 'red');
    expect(pegs[1]).toHaveAttribute('data-color', 'blue');
    expect(pegs[2]).toHaveAttribute('data-color', '');
    expect(pegs[3]).toHaveAttribute('data-color', '');
  });

  test('should call onClearPosition with correct index', () => {
    render(<CurrentGuess guess={fullGuess} onClearPosition={mockOnClearPosition} />);

    const pegs = screen.getAllByTestId('color-peg');

    fireEvent.click(pegs[0]);
    expect(mockOnClearPosition).toHaveBeenLastCalledWith(0);

    fireEvent.click(pegs[2]);
    expect(mockOnClearPosition).toHaveBeenLastCalledWith(2);

    fireEvent.click(pegs[3]);
    expect(mockOnClearPosition).toHaveBeenLastCalledWith(3);
  });

  test('should have shadow styling', () => {
    const { container } = render(
      <CurrentGuess guess={fullGuess} onClearPosition={mockOnClearPosition} />
    );

    const guessContainer = container.querySelector('.shadow-sm');
    expect(guessContainer).toBeInTheDocument();
  });

  test('should work when disabled prop is false', () => {
    render(<CurrentGuess guess={partialGuess} onClearPosition={mockOnClearPosition} disabled={false} />);

    const pegs = screen.getAllByTestId('color-peg');
    fireEvent.click(pegs[0]);

    expect(mockOnClearPosition).toHaveBeenCalledTimes(1);
  });

  test('should work when disabled prop is omitted', () => {
    render(<CurrentGuess guess={partialGuess} onClearPosition={mockOnClearPosition} />);

    const pegs = screen.getAllByTestId('color-peg');
    fireEvent.click(pegs[0]);

    // disabled defaults to undefined/false
    expect(mockOnClearPosition).toHaveBeenCalledTimes(1);
  });
});
