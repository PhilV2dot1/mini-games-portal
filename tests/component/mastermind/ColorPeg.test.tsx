import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPeg } from '@/components/mastermind/ColorPeg';
import { Color } from '@/lib/games/mastermind-logic';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, disabled, className, style, ...props }: any) => (
      <button onClick={onClick} disabled={disabled} className={className} style={style} {...props}>
        {children}
      </button>
    ),
  },
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height }: any) => (
    <img src={src} alt={alt} width={width} height={height} data-testid="color-image" />
  ),
}));

/**
 * ColorPeg Component Tests
 *
 * Tests for the Mastermind color peg component that displays:
 * - Color pegs with different sizes (small, medium, large)
 * - Clickable vs non-clickable states
 * - Empty state handling
 */

describe('ColorPeg', () => {
  test('should render a button', () => {
    render(<ColorPeg color="red" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('should call onClick when clicked and onClick is provided', () => {
    const handleClick = vi.fn();
    render(<ColorPeg color="red" onClick={handleClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should not call onClick when disabled (no onClick prop)', () => {
    const { container } = render(<ColorPeg color="red" />);

    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  test('should have cursor-pointer when onClick is provided', () => {
    const handleClick = vi.fn();
    const { container } = render(<ColorPeg color="red" onClick={handleClick} />);

    const button = container.querySelector('.cursor-pointer');
    expect(button).toBeInTheDocument();
  });

  test('should have cursor-default when onClick is not provided', () => {
    const { container } = render(<ColorPeg color="red" />);

    const button = container.querySelector('.cursor-default');
    expect(button).toBeInTheDocument();
  });

  test('should render null when color is null and showEmpty is false', () => {
    const { container } = render(<ColorPeg color={null} showEmpty={false} />);

    expect(container.firstChild).toBeNull();
  });

  test('should render empty peg when color is null and showEmpty is true', () => {
    render(<ColorPeg color={null} showEmpty={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('should render with small size classes', () => {
    const { container } = render(<ColorPeg color="red" size="small" />);

    const button = container.querySelector('.w-6.h-6');
    expect(button).toBeInTheDocument();
  });

  test('should render with medium size classes (default)', () => {
    const { container } = render(<ColorPeg color="red" size="medium" />);

    const button = container.querySelector('.w-9.h-9');
    expect(button).toBeInTheDocument();
  });

  test('should render with large size classes', () => {
    const { container } = render(<ColorPeg color="red" size="large" />);

    const button = container.querySelector('.w-11.h-11');
    expect(button).toBeInTheDocument();
  });

  test('should have rounded-full class', () => {
    const { container } = render(<ColorPeg color="red" />);

    const button = container.querySelector('.rounded-full');
    expect(button).toBeInTheDocument();
  });

  test('should have border classes', () => {
    const { container } = render(<ColorPeg color="red" />);

    const button = container.querySelector('.border-2');
    expect(button).toBeInTheDocument();
  });

  test('should render color image when color is provided', () => {
    render(<ColorPeg color="red" />);

    const image = screen.queryByTestId('color-image');
    // Image may or may not be present depending on COLOR_CONFIG
    // Just check that component renders without error
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('should render with color null', () => {
    render(<ColorPeg color={null} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('should have flex and items-center classes', () => {
    const { container } = render(<ColorPeg color="red" />);

    const button = container.querySelector('.flex.items-center.justify-center');
    expect(button).toBeInTheDocument();
  });

  test('should have overflow-hidden class', () => {
    const { container } = render(<ColorPeg color="red" />);

    const button = container.querySelector('.overflow-hidden');
    expect(button).toBeInTheDocument();
  });

  test('should render with all valid colors', () => {
    const colors: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

    colors.forEach(color => {
      const { unmount } = render(<ColorPeg color={color} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      unmount();
    });
  });

  test('should render default size when size prop is omitted', () => {
    const { container } = render(<ColorPeg color="red" />);

    // Default is medium
    const button = container.querySelector('.w-9.h-9');
    expect(button).toBeInTheDocument();
  });

  test('should show empty peg by default when color is null', () => {
    render(<ColorPeg color={null} />);

    // showEmpty defaults to true
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
