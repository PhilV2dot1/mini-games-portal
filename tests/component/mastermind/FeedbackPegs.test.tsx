import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackPegs } from '@/components/mastermind/FeedbackPegs';
import { Feedback } from '@/lib/games/mastermind-logic';

/**
 * FeedbackPegs Component Tests
 *
 * Tests for the Mastermind feedback display component that shows:
 * - Black pegs (correct color and position)
 * - White pegs (correct color, wrong position)
 * - Empty pegs (remaining slots)
 */

describe('FeedbackPegs', () => {
  test('should render 4 pegs in a 2x2 grid', () => {
    const feedback: Feedback = { blackPegs: 0, whitePegs: 0 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const grid = container.querySelector('.grid-cols-2');
    expect(grid).toBeInTheDocument();

    const pegs = container.querySelectorAll('.rounded-full');
    expect(pegs).toHaveLength(4);
  });

  test('should show all black pegs when all correct', () => {
    const feedback: Feedback = { blackPegs: 4, whitePegs: 0 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = container.querySelectorAll('.rounded-full');

    // All 4 pegs should have black background
    pegs.forEach(peg => {
      const style = (peg as HTMLElement).style;
      expect(style.backgroundColor).toMatch(/(rgb\(31, 41, 55\)|#1f2937)/); // #1f2937
    });
  });

  test('should show all white pegs when all wrong position', () => {
    const feedback: Feedback = { blackPegs: 0, whitePegs: 4 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = container.querySelectorAll('.rounded-full');

    // All 4 pegs should have white background
    pegs.forEach(peg => {
      const style = (peg as HTMLElement).style;
      expect(style.backgroundColor).toMatch(/(rgb\(243, 244, 246\)|#f3f4f6)/); // #f3f4f6
    });
  });

  test('should show all empty pegs when no feedback', () => {
    const feedback: Feedback = { blackPegs: 0, whitePegs: 0 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = container.querySelectorAll('.rounded-full');

    // All 4 pegs should have transparent background
    pegs.forEach(peg => {
      const style = (peg as HTMLElement).style;
      expect(style.backgroundColor).toBe('transparent');
    });
  });

  test('should show mixed feedback correctly', () => {
    const feedback: Feedback = { blackPegs: 2, whitePegs: 1 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = Array.from(container.querySelectorAll('.rounded-full'));

    // First 2 should be black
    expect((pegs[0] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(31, 41, 55\)|#1f2937)/);
    expect((pegs[1] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(31, 41, 55\)|#1f2937)/);

    // Third should be white
    expect((pegs[2] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(243, 244, 246\)|#f3f4f6)/);

    // Fourth should be empty
    expect((pegs[3] as HTMLElement).style.backgroundColor).toBe('transparent');
  });

  test('should handle 1 black and 3 white pegs', () => {
    const feedback: Feedback = { blackPegs: 1, whitePegs: 3 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = Array.from(container.querySelectorAll('.rounded-full'));

    // First should be black
    expect((pegs[0] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(31, 41, 55\)|#1f2937)/);

    // Remaining 3 should be white
    expect((pegs[1] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(243, 244, 246\)|#f3f4f6)/);
    expect((pegs[2] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(243, 244, 246\)|#f3f4f6)/);
    expect((pegs[3] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(243, 244, 246\)|#f3f4f6)/);
  });

  test('should handle 3 black and 1 empty peg', () => {
    const feedback: Feedback = { blackPegs: 3, whitePegs: 0 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = Array.from(container.querySelectorAll('.rounded-full'));

    // First 3 should be black
    expect((pegs[0] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(31, 41, 55\)|#1f2937)/);
    expect((pegs[1] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(31, 41, 55\)|#1f2937)/);
    expect((pegs[2] as HTMLElement).style.backgroundColor).toMatch(/(rgb\(31, 41, 55\)|#1f2937)/);

    // Last should be empty
    expect((pegs[3] as HTMLElement).style.backgroundColor).toBe('transparent');
  });

  test('should have correct border colors for black pegs', () => {
    const feedback: Feedback = { blackPegs: 1, whitePegs: 0 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = Array.from(container.querySelectorAll('.rounded-full'));
    const blackPeg = pegs[0] as HTMLElement;

    expect(blackPeg.style.borderColor).toMatch(/(rgb\(17, 24, 39\)|#111827)/); // #111827
  });

  test('should have correct border colors for white pegs', () => {
    const feedback: Feedback = { blackPegs: 0, whitePegs: 1 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = Array.from(container.querySelectorAll('.rounded-full'));
    const whitePeg = pegs[0] as HTMLElement;

    expect(whitePeg.style.borderColor).toMatch(/(rgb\(156, 163, 175\)|#9ca3af)/); // #9ca3af
  });

  test('should have correct border colors for empty pegs', () => {
    const feedback: Feedback = { blackPegs: 0, whitePegs: 0 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = Array.from(container.querySelectorAll('.rounded-full'));
    const emptyPeg = pegs[0] as HTMLElement;

    expect(emptyPeg.style.borderColor).toMatch(/(rgb\(209, 213, 219\)|#d1d5db)/); // #d1d5db
  });

  test('should have correct size classes', () => {
    const feedback: Feedback = { blackPegs: 0, whitePegs: 0 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const pegs = container.querySelectorAll('.w-3.h-3');
    expect(pegs.length).toBeGreaterThan(0);
  });

  test('should have ml-auto class on container', () => {
    const feedback: Feedback = { blackPegs: 0, whitePegs: 0 };
    const { container } = render(<FeedbackPegs feedback={feedback} />);

    const grid = container.querySelector('.ml-auto');
    expect(grid).toBeInTheDocument();
  });
});
