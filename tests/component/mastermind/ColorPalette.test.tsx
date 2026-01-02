import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPalette } from '@/components/mastermind/ColorPalette';
import { COLORS } from '@/lib/games/mastermind-logic';

// Mock ColorPeg component
vi.mock('@/components/mastermind/ColorPeg', () => ({
  ColorPeg: ({ color, size, onClick }: any) => (
    <button
      data-testid="color-peg"
      data-color={color}
      data-size={size}
      onClick={onClick}
    >
      {color}
    </button>
  ),
}));

/**
 * ColorPalette Component Tests
 *
 * Tests for the Mastermind color palette component that displays:
 * - All available colors (6 colors)
 * - Clickable color pegs
 * - Disabled state
 */

describe('ColorPalette', () => {
  const mockOnSelectColor = vi.fn();

  beforeEach(() => {
    mockOnSelectColor.mockClear();
  });

  test('should render all 6 colors', () => {
    render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const pegs = screen.getAllByTestId('color-peg');
    expect(pegs).toHaveLength(COLORS.length);
    expect(pegs).toHaveLength(6);
  });

  test('should render colors in correct order', () => {
    render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const pegs = screen.getAllByTestId('color-peg');
    COLORS.forEach((color, index) => {
      expect(pegs[index]).toHaveAttribute('data-color', color);
    });
  });

  test('should render pegs with large size', () => {
    render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const pegs = screen.getAllByTestId('color-peg');
    pegs.forEach(peg => {
      expect(peg).toHaveAttribute('data-size', 'large');
    });
  });

  test('should call onSelectColor when a color is clicked', () => {
    render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const pegs = screen.getAllByTestId('color-peg');
    fireEvent.click(pegs[0]);

    expect(mockOnSelectColor).toHaveBeenCalledTimes(1);
    expect(mockOnSelectColor).toHaveBeenCalledWith(COLORS[0]);
  });

  test('should not call onSelectColor when disabled', () => {
    render(<ColorPalette onSelectColor={mockOnSelectColor} disabled={true} />);

    const pegs = screen.getAllByTestId('color-peg');
    fireEvent.click(pegs[0]);

    expect(mockOnSelectColor).not.toHaveBeenCalled();
  });

  test('should call onSelectColor for each color', () => {
    render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const pegs = screen.getAllByTestId('color-peg');

    COLORS.forEach((color, index) => {
      mockOnSelectColor.mockClear();
      fireEvent.click(pegs[index]);
      expect(mockOnSelectColor).toHaveBeenCalledWith(color);
    });
  });

  test('should have flex-wrap layout', () => {
    const { container } = render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const palette = container.querySelector('.flex-wrap');
    expect(palette).toBeInTheDocument();
  });

  test('should have justify-center alignment', () => {
    const { container } = render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const palette = container.querySelector('.justify-center');
    expect(palette).toBeInTheDocument();
  });

  test('should have background and border styling', () => {
    const { container } = render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const palette = container.querySelector('.bg-white\\/90.backdrop-blur-sm');
    expect(palette).toBeInTheDocument();

    const border = container.querySelector('.border-yellow-500\\/50');
    expect(border).toBeInTheDocument();
  });

  test('should have rounded corners', () => {
    const { container } = render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const palette = container.querySelector('.rounded-lg');
    expect(palette).toBeInTheDocument();
  });

  test('should have shadow styling', () => {
    const { container } = render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const palette = container.querySelector('.shadow-sm');
    expect(palette).toBeInTheDocument();
  });

  test('should have gap between pegs', () => {
    const { container } = render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const palette = container.querySelector('.gap-2');
    expect(palette).toBeInTheDocument();
  });

  test('should have padding', () => {
    const { container } = render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const palette = container.querySelector('.p-2');
    expect(palette).toBeInTheDocument();
  });

  test('should work when disabled prop is false', () => {
    render(<ColorPalette onSelectColor={mockOnSelectColor} disabled={false} />);

    const pegs = screen.getAllByTestId('color-peg');
    fireEvent.click(pegs[0]);

    expect(mockOnSelectColor).toHaveBeenCalledTimes(1);
  });

  test('should work when disabled prop is omitted', () => {
    render(<ColorPalette onSelectColor={mockOnSelectColor} />);

    const pegs = screen.getAllByTestId('color-peg');
    fireEvent.click(pegs[0]);

    // disabled defaults to undefined/false
    expect(mockOnSelectColor).toHaveBeenCalledTimes(1);
  });
});
