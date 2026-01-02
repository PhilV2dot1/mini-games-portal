import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuessRow } from '@/components/mastermind/GuessRow';
import { Code, Feedback } from '@/lib/games/mastermind-logic';

// Mock ColorPeg component
vi.mock('@/components/mastermind/ColorPeg', () => ({
  ColorPeg: ({ color, size }: any) => (
    <div data-testid="color-peg" data-color={color || ''} data-size={size}>
      {color || 'empty'}
    </div>
  ),
}));

// Mock FeedbackPegs component
vi.mock('@/components/mastermind/FeedbackPegs', () => ({
  FeedbackPegs: ({ feedback }: any) => (
    <div data-testid="feedback-pegs">
      {feedback.blackPegs}B-{feedback.whitePegs}W
    </div>
  ),
}));

/**
 * GuessRow Component Tests
 *
 * Tests for the Mastermind guess row component that displays:
 * - Guess pegs (4 ColorPeg components)
 * - Feedback pegs (black/white indicators)
 * - Active/inactive styling
 */

describe('GuessRow', () => {
  const fullGuess: Code = ['red', 'blue', 'green', 'yellow'];
  const partialGuess: Code = ['red', null, null, null];
  const emptyGuess: Code = [null, null, null, null];

  test('should render 4 color pegs', () => {
    render(<GuessRow guess={fullGuess} />);

    const pegs = screen.getAllByTestId('color-peg');
    expect(pegs).toHaveLength(4);
  });

  test('should render pegs with correct colors', () => {
    render(<GuessRow guess={fullGuess} />);

    const pegs = screen.getAllByTestId('color-peg');
    expect(pegs[0]).toHaveAttribute('data-color', 'red');
    expect(pegs[1]).toHaveAttribute('data-color', 'blue');
    expect(pegs[2]).toHaveAttribute('data-color', 'green');
    expect(pegs[3]).toHaveAttribute('data-color', 'yellow');
  });

  test('should render pegs with medium size', () => {
    render(<GuessRow guess={fullGuess} />);

    const pegs = screen.getAllByTestId('color-peg');
    pegs.forEach(peg => {
      expect(peg).toHaveAttribute('data-size', 'medium');
    });
  });

  test('should render feedback when provided', () => {
    const feedback: Feedback = { blackPegs: 2, whitePegs: 1 };
    render(<GuessRow guess={fullGuess} feedback={feedback} />);

    const feedbackPegs = screen.getByTestId('feedback-pegs');
    expect(feedbackPegs).toBeInTheDocument();
    expect(feedbackPegs).toHaveTextContent('2B-1W');
  });

  test('should not render feedback when not provided', () => {
    render(<GuessRow guess={fullGuess} />);

    const feedbackPegs = screen.queryByTestId('feedback-pegs');
    expect(feedbackPegs).not.toBeInTheDocument();
  });

  test('should have active styling when isActive is true', () => {
    const { container } = render(<GuessRow guess={fullGuess} isActive={true} />);

    const row = container.querySelector('.bg-white\\/90');
    expect(row).toBeInTheDocument();

    const border = container.querySelector('.border-yellow-500\\/50');
    expect(border).toBeInTheDocument();
  });

  test('should have inactive styling when isActive is false', () => {
    const { container } = render(<GuessRow guess={fullGuess} isActive={false} />);

    const row = container.querySelector('.bg-white\\/60');
    expect(row).toBeInTheDocument();

    const border = container.querySelector('.border-gray-200');
    expect(border).toBeInTheDocument();
  });

  test('should have inactive styling by default', () => {
    const { container } = render(<GuessRow guess={fullGuess} />);

    // isActive defaults to undefined/false
    const row = container.querySelector('.bg-white\\/60');
    expect(row).toBeInTheDocument();
  });

  test('should render partial guess correctly', () => {
    render(<GuessRow guess={partialGuess} />);

    const pegs = screen.getAllByTestId('color-peg');
    expect(pegs[0]).toHaveAttribute('data-color', 'red');
    expect(pegs[1]).toHaveAttribute('data-color', '');
    expect(pegs[2]).toHaveAttribute('data-color', '');
    expect(pegs[3]).toHaveAttribute('data-color', '');
  });

  test('should render empty guess correctly', () => {
    render(<GuessRow guess={emptyGuess} />);

    const pegs = screen.getAllByTestId('color-peg');
    pegs.forEach(peg => {
      expect(peg).toHaveAttribute('data-color', '');
    });
  });

  test('should have flex layout', () => {
    const { container } = render(<GuessRow guess={fullGuess} />);

    const row = container.querySelector('.flex.items-center.justify-between');
    expect(row).toBeInTheDocument();
  });

  test('should have gap between elements', () => {
    const { container } = render(<GuessRow guess={fullGuess} />);

    const row = container.querySelector('.gap-1');
    expect(row).toBeInTheDocument();
  });

  test('should have rounded corners', () => {
    const { container } = render(<GuessRow guess={fullGuess} />);

    const row = container.querySelector('.rounded-lg');
    expect(row).toBeInTheDocument();
  });

  test('should have padding', () => {
    const { container } = render(<GuessRow guess={fullGuess} />);

    const row = container.querySelector('.p-1\\.5');
    expect(row).toBeInTheDocument();
  });

  test('should render with all feedback combinations', () => {
    const feedbacks: Feedback[] = [
      { blackPegs: 0, whitePegs: 0 },
      { blackPegs: 1, whitePegs: 0 },
      { blackPegs: 0, whitePegs: 1 },
      { blackPegs: 2, whitePegs: 2 },
      { blackPegs: 4, whitePegs: 0 },
      { blackPegs: 0, whitePegs: 4 },
      { blackPegs: 3, whitePegs: 1 },
    ];

    feedbacks.forEach(feedback => {
      const { unmount } = render(<GuessRow guess={fullGuess} feedback={feedback} />);
      const feedbackPegs = screen.getByTestId('feedback-pegs');
      expect(feedbackPegs).toHaveTextContent(`${feedback.blackPegs}B-${feedback.whitePegs}W`);
      unmount();
    });
  });

  test('should have guess pegs in a flex container', () => {
    const { container } = render(<GuessRow guess={fullGuess} />);

    // Find the div containing the guess pegs
    const guessContainer = container.querySelector('.flex.gap-1');
    expect(guessContainer).toBeInTheDocument();
  });
});
