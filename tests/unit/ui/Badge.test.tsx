/**
 * Badge Component Tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge Component', () => {
  beforeEach(() => {});

  // ========================================
  // RENDERING TESTS
  // ========================================

  describe('Rendering', () => {
    test('should render with children', () => {
      render(<Badge>Badge text</Badge>);
      expect(screen.getByText('Badge text')).toBeInTheDocument();
    });

    test('should render as span element', () => {
      const { container } = render(<Badge>Badge</Badge>);
      expect(container.firstChild?.nodeName).toBe('SPAN');
    });
  });

  // ========================================
  // VARIANT TESTS
  // ========================================

  describe('Variants', () => {
    test('should render default variant', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-gray-100');
      expect(badge.className).toContain('text-gray-800');
    });

    test('should render success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-800');
    });

    test('should render error variant', () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-red-100');
      expect(badge.className).toContain('text-red-800');
    });

    test('should render warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-orange-100');
      expect(badge.className).toContain('text-orange-800');
    });

    test('should render info variant', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-blue-100');
      expect(badge.className).toContain('text-blue-800');
    });

    test('should render celo variant', () => {
      const { container } = render(<Badge variant="celo">Celo</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-yellow-100');
      expect(badge.className).toContain('border-celo');
    });
  });

  // ========================================
  // SIZE TESTS
  // ========================================

  describe('Sizes', () => {
    test('should render small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('h-5');
      expect(badge.className).toContain('text-xs');
    });

    test('should render medium size (default)', () => {
      const { container } = render(<Badge size="md">Medium</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('h-6');
      expect(badge.className).toContain('text-sm');
    });

    test('should render large size', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('h-7');
      expect(badge.className).toContain('text-base');
    });
  });

  // ========================================
  // ICON TESTS
  // ========================================

  describe('Icons', () => {
    test('should render with icon', () => {
      render(
        <Badge icon={<span data-testid="icon">⭐</span>}>
          With Icon
        </Badge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    test('should have aria-hidden on icon', () => {
      const { container } = render(
        <Badge icon={<span>⭐</span>}>
          Badge
        </Badge>
      );
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  // ========================================
  // DOT TESTS
  // ========================================

  describe('Status Dot', () => {
    test('should render with dot', () => {
      const { container } = render(<Badge dot>Online</Badge>);
      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
    });

    test('should not render icon when dot is true', () => {
      render(
        <Badge dot icon={<span data-testid="icon">⭐</span>}>
          Badge
        </Badge>
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    test('should render dot with correct variant color', () => {
      const { container } = render(
        <Badge variant="success" dot>
          Online
        </Badge>
      );
      const dot = container.querySelector('.bg-green-500');
      expect(dot).toBeInTheDocument();
    });

    test('should have aria-hidden on dot', () => {
      const { container } = render(<Badge dot>Badge</Badge>);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
    });
  });

  // ========================================
  // CUSTOM STYLING TESTS
  // ========================================

  describe('Custom Styling', () => {
    test('should accept custom className', () => {
      const { container } = render(
        <Badge className="custom-badge">
          Custom
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('custom-badge');
    });

    test('should merge custom className with defaults', () => {
      const { container } = render(
        <Badge className="custom-class">
          Badge
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('custom-class');
      expect(badge.className).toContain('rounded-full');
    });
  });

  // ========================================
  // COMBINATION TESTS
  // ========================================

  describe('Combinations', () => {
    test('should handle all props together', () => {
      const { container } = render(
        <Badge
          variant="celo"
          size="lg"
          icon={<span data-testid="icon">💰</span>}
          className="extra-class"
        >
          0.01 CELO
        </Badge>
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-yellow-100');
      expect(badge.className).toContain('h-7');
      expect(badge.className).toContain('extra-class');
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('0.01 CELO')).toBeInTheDocument();
    });

    test('should prefer dot over icon', () => {
      render(
        <Badge
          dot
          icon={<span data-testid="icon">⭐</span>}
        >
          Status
        </Badge>
      );

      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });

  // ========================================
  // ACCESSIBILITY TESTS
  // ========================================

  describe('Accessibility', () => {
    test('should have whitespace-nowrap for readability', () => {
      const { container } = render(<Badge>Long badge text</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('whitespace-nowrap');
    });
  });
});
