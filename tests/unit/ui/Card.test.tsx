/**
 * Card Component Tests
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock motion utilities
vi.mock('@/lib/utils/motion', () => ({
  useShouldAnimate: () => false,
}));

describe('Card Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // RENDERING TESTS
  // ========================================

  describe('Rendering', () => {
    test('should render with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('should render as div element', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });
  });

  // ========================================
  // VARIANT TESTS
  // ========================================

  describe('Variants', () => {
    test('should render default variant', () => {
      const { container } = render(<Card variant="default">Default</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('border-gray-200');
    });

    test('should render elevated variant', () => {
      const { container } = render(<Card variant="elevated">Elevated</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('shadow-lg');
    });

    test('should render outlined variant', () => {
      const { container } = render(<Card variant="outlined">Outlined</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-gray-300');
    });

    test('should render glass variant', () => {
      const { container } = render(<Card variant="glass">Glass</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('backdrop-blur-lg');
      expect(card.className).toContain('bg-white/90');
    });
  });

  // ========================================
  // PADDING TESTS
  // ========================================

  describe('Padding', () => {
    test('should render with no padding', () => {
      const { container } = render(<Card padding="none">No padding</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-0');
    });

    test('should render with small padding', () => {
      const { container } = render(<Card padding="sm">Small</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-3');
    });

    test('should render with medium padding (default)', () => {
      const { container } = render(<Card padding="md">Medium</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-6');
    });

    test('should render with large padding', () => {
      const { container } = render(<Card padding="lg">Large</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-8');
    });
  });

  // ========================================
  // INTERACTION TESTS
  // ========================================

  describe('Interactions', () => {
    test('should call onClick when clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<Card onClick={onClick}>Click me</Card>);
      const card = container.firstChild as HTMLElement;

      await user.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('should be keyboard accessible when interactive', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<Card onClick={onClick}>Press me</Card>);
      const card = container.firstChild as HTMLElement;

      card.focus();
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('should handle space key press', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<Card onClick={onClick}>Press me</Card>);
      const card = container.firstChild as HTMLElement;

      card.focus();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('should have cursor pointer when interactive', () => {
      const { container } = render(<Card onClick={() => {}}>Interactive</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    test('should have tabIndex when interactive', () => {
      const { container } = render(<Card onClick={() => {}}>Interactive</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.getAttribute('tabIndex')).toBe('0');
    });
  });

  // ========================================
  // ACCESSIBILITY TESTS
  // ========================================

  describe('Accessibility', () => {
    test('should have button role when interactive', () => {
      const { container } = render(<Card onClick={() => {}}>Interactive</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.getAttribute('role')).toBe('button');
    });

    test('should have custom role when provided', () => {
      const { container } = render(<Card role="article">Article</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.getAttribute('role')).toBe('article');
    });

    test('should have aria-label when provided', () => {
      const { container } = render(<Card ariaLabel="Game card">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.getAttribute('aria-label')).toBe('Game card');
    });

    test('should not have role when not interactive', () => {
      const { container } = render(<Card>Not interactive</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.getAttribute('role')).toBeNull();
    });
  });

  // ========================================
  // CUSTOM STYLING TESTS
  // ========================================

  describe('Custom Styling', () => {
    test('should accept custom className', () => {
      const { container } = render(<Card className="custom-class">Custom</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
    });

    test('should merge custom className with defaults', () => {
      const { container } = render(<Card className="custom-class">Custom</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
      expect(card.className).toContain('rounded-2xl');
    });
  });

  // ========================================
  // SUB-COMPONENT TESTS
  // ========================================

  describe('CardHeader', () => {
    test('should render CardHeader', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    test('should have border-bottom', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('border-b');
    });

    test('should accept custom className', () => {
      const { container } = render(
        <CardHeader className="custom">Header</CardHeader>
      );
      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('custom');
    });
  });

  describe('CardBody', () => {
    test('should render CardBody', () => {
      render(
        <Card>
          <CardBody>Body content</CardBody>
        </Card>
      );
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    test('should have padding', () => {
      const { container } = render(<CardBody>Body</CardBody>);
      const body = container.firstChild as HTMLElement;
      expect(body.className).toContain('px-6');
      expect(body.className).toContain('py-4');
    });

    test('should accept custom className', () => {
      const { container } = render(
        <CardBody className="custom">Body</CardBody>
      );
      const body = container.firstChild as HTMLElement;
      expect(body.className).toContain('custom');
    });
  });

  describe('CardFooter', () => {
    test('should render CardFooter', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    test('should have border-top', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toContain('border-t');
    });

    test('should have background', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toContain('bg-gray-50');
    });

    test('should accept custom className', () => {
      const { container } = render(
        <CardFooter className="custom">Footer</CardFooter>
      );
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toContain('custom');
    });
  });

  // ========================================
  // COMBINATION TESTS
  // ========================================

  describe('Combinations', () => {
    test('should render complete card with all sub-components', () => {
      render(
        <Card variant="elevated" padding="lg">
          <CardHeader>Header</CardHeader>
          <CardBody>Body</CardBody>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    test('should handle all props together', () => {
      const onClick = vi.fn();
      const { container } = render(
        <Card
          variant="glass"
          padding="lg"
          hover
          onClick={onClick}
          ariaLabel="Game card"
          className="extra-class"
        >
          Content
        </Card>
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('backdrop-blur-lg');
      expect(card.className).toContain('p-8');
      expect(card.className).toContain('extra-class');
      expect(card.getAttribute('aria-label')).toBe('Game card');
      expect(card.getAttribute('role')).toBe('button');
    });
  });
});
