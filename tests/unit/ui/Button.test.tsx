/**
 * Button Component Tests
 * Tests for all variants, sizes, states, and accessibility
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, ...props }: any) => (
      <button className={className} {...props}>
        {children}
      </button>
    ),
  },
}));

// Mock useShould Animate hook
vi.mock('@/lib/utils/motion', () => ({
  useShouldAnimate: () => false, // Disable animations in tests
}));

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // RENDERING TESTS
  // ========================================

  describe('Rendering', () => {
    test('should render with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    test('should render as button element', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    test('should have correct default type', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    test('should render with custom type', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  // ========================================
  // VARIANT TESTS
  // ========================================

  describe('Variants', () => {
    test('should render primary variant', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gray-900');
    });

    test('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-white');
    });

    test('should render celo variant', () => {
      render(<Button variant="celo">Celo</Button>);
      const button = screen.getByRole('button');
      // Celo variant has inline styles for background
      expect(button).toBeDefined();
    });

    test('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-transparent');
    });

    test('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-gray-300');
    });

    test('should render danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-500');
    });
  });

  // ========================================
  // SIZE TESTS
  // ========================================

  describe('Sizes', () => {
    test('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
      expect(button.className).toContain('text-sm');
    });

    test('should render medium size (default)', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('text-base');
    });

    test('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('text-lg');
    });
  });

  // ========================================
  // STATE TESTS
  // ========================================

  describe('States', () => {
    test('should render disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.className).toContain('disabled:opacity-50');
    });

    test('should render loading state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    test('should show spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    test('should hide icons when loading', () => {
      render(
        <Button loading leftIcon={<span>📧</span>} rightIcon={<span>→</span>}>
          Send
        </Button>
      );
      expect(screen.queryByText('📧')).not.toBeInTheDocument();
      expect(screen.queryByText('→')).not.toBeInTheDocument();
    });
  });

  // ========================================
  // LAYOUT TESTS
  // ========================================

  describe('Layout', () => {
    test('should render full width', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
    });

    test('should render left icon', () => {
      render(<Button leftIcon={<span data-testid="left-icon">📧</span>}>Email</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    test('should render right icon', () => {
      render(<Button rightIcon={<span data-testid="right-icon">→</span>}>Next</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    test('should render both icons', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">📧</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Send Email
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  // ========================================
  // INTERACTION TESTS
  // ========================================

  describe('Interactions', () => {
    test('should call onClick when clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={onClick}>Click me</Button>);
      const button = screen.getByRole('button');

      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('should not call onClick when disabled', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={onClick} disabled>Click me</Button>);
      const button = screen.getByRole('button');

      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    test('should not call onClick when loading', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={onClick} loading>Click me</Button>);
      const button = screen.getByRole('button');

      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // ACCESSIBILITY TESTS
  // ========================================

  describe('Accessibility', () => {
    test('should have aria-label when provided', () => {
      render(<Button ariaLabel="Close modal">×</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close modal');
    });

    test('should have aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    test('should have aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    test('should have aria-hidden on icons', () => {
      render(
        <Button leftIcon={<span>📧</span>} rightIcon={<span>→</span>}>
          Send
        </Button>
      );
      const icons = screen.getByRole('button').querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBe(2);
    });

    test('should have proper button role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // ========================================
  // CUSTOM CLASSNAME TESTS
  // ========================================

  describe('Custom Styling', () => {
    test('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    test('should merge custom className with default styles', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
      expect(button.className).toContain('rounded-xl');
    });
  });

  // ========================================
  // FORWARDED REF TESTS
  // ========================================

  describe('Ref Forwarding', () => {
    test('should forward ref to button element', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);
      expect(ref).toHaveBeenCalled();
    });
  });

  // ========================================
  // COMBINATION TESTS
  // ========================================

  describe('Combinations', () => {
    test('should handle all props together', () => {
      const onClick = vi.fn();
      render(
        <Button
          variant="celo"
          size="lg"
          fullWidth
          leftIcon={<span>⭐</span>}
          ariaLabel="Star button"
          onClick={onClick}
          className="extra-class"
        >
          Star
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('w-full');
      expect(button.className).toContain('extra-class');
      expect(button).toHaveAttribute('aria-label', 'Star button');
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    test('should prioritize loading state over disabled', () => {
      render(<Button loading disabled>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });
});
