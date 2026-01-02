import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackLegend } from '@/components/mastermind/FeedbackLegend';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
}));

/**
 * FeedbackLegend Component Tests
 *
 * Tests for the Mastermind feedback legend component that explains:
 * - Black pegs = Right color, right position
 * - White pegs = Right color, wrong position
 * - Mobile and desktop layouts
 */

describe('FeedbackLegend', () => {
  test('should render the legend container', () => {
    const { container } = render(<FeedbackLegend />);

    const legend = container.querySelector('.bg-white\\/90');
    expect(legend).toBeInTheDocument();
  });

  test('should have backdrop blur and border styling', () => {
    const { container } = render(<FeedbackLegend />);

    const legend = container.querySelector('.backdrop-blur-sm');
    expect(legend).toBeInTheDocument();

    const border = container.querySelector('.border-yellow-500\\/50');
    expect(border).toBeInTheDocument();
  });

  test('should show black peg explanation', () => {
    render(<FeedbackLegend />);

    // Desktop version
    expect(screen.getByText(/Right color, right position/i)).toBeInTheDocument();
  });

  test('should show white peg explanation', () => {
    render(<FeedbackLegend />);

    // Desktop version
    expect(screen.getByText(/Right color, wrong position/i)).toBeInTheDocument();
  });

  test('should show mobile layout with "Right position" text', () => {
    render(<FeedbackLegend />);

    // Mobile version
    expect(screen.getByText('Right position')).toBeInTheDocument();
  });

  test('should show mobile layout with "Wrong position" text', () => {
    render(<FeedbackLegend />);

    // Mobile version
    expect(screen.getByText('Wrong position')).toBeInTheDocument();
  });

  test('should render peg indicators', () => {
    const { container } = render(<FeedbackLegend />);

    const pegs = Array.from(container.querySelectorAll('.rounded-full'));

    // Should have pegs for both mobile and desktop layouts
    expect(pegs.length).toBeGreaterThanOrEqual(2);
  });

  test('should have "Feedback:" heading on desktop', () => {
    render(<FeedbackLegend />);

    expect(screen.getByText('Feedback:')).toBeInTheDocument();
  });

  test('should have separator on desktop layout', () => {
    render(<FeedbackLegend />);

    expect(screen.getByText('|')).toBeInTheDocument();
  });

  test('should have border styling on pegs', () => {
    const { container } = render(<FeedbackLegend />);

    const pegs = Array.from(container.querySelectorAll('.rounded-full'));
    expect(pegs.length).toBeGreaterThan(0);

    // All pegs should have border styling (border or border-2)
    pegs.forEach(peg => {
      const hasAnyBorder = peg.classList.contains('border') || peg.classList.contains('border-2');
      expect(hasAnyBorder).toBe(true);
    });
  });

  test('should have mobile-only layout with stacked items', () => {
    const { container } = render(<FeedbackLegend />);

    const mobileLayout = container.querySelector('.flex.sm\\:hidden.flex-col');
    expect(mobileLayout).toBeInTheDocument();
  });

  test('should have desktop-only horizontal layout', () => {
    const { container } = render(<FeedbackLegend />);

    const desktopLayout = container.querySelector('.hidden.sm\\:flex');
    expect(desktopLayout).toBeInTheDocument();
  });

  test('should have rounded corners', () => {
    const { container } = render(<FeedbackLegend />);

    const legend = container.querySelector('.rounded-lg');
    expect(legend).toBeInTheDocument();
  });

  test('should have shadow styling', () => {
    const { container } = render(<FeedbackLegend />);

    const legend = container.querySelector('.shadow-sm');
    expect(legend).toBeInTheDocument();
  });
});
