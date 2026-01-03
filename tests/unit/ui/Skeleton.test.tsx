/**
 * Skeleton Component Tests
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
} from '@/components/ui/Skeleton';
import { SkeletonCard, SkeletonCardGrid } from '@/components/ui/SkeletonCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock motion utilities
vi.mock('@/lib/utils/motion', () => ({
  useShouldAnimate: () => false,
  skeletonPulseVariants: {},
}));

describe('Skeleton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // RENDERING TESTS
  // ========================================

  describe('Rendering', () => {
    test('should render skeleton element', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild;
      expect(skeleton).toBeInTheDocument();
    });

    test('should have loading aria attributes', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading...');
    });
  });

  // ========================================
  // SIZE TESTS
  // ========================================

  describe('Sizes', () => {
    test('should render with custom width', () => {
      const { container } = render(<Skeleton width={200} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('200px');
    });

    test('should render with custom height', () => {
      const { container } = render(<Skeleton height={50} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('50px');
    });

    test('should render with string width', () => {
      const { container } = render(<Skeleton width="50%" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('50%');
    });

    test('should have default width 100%', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('100%');
    });

    test('should have default height 1rem', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('1rem');
    });
  });

  // ========================================
  // SHAPE TESTS
  // ========================================

  describe('Shapes', () => {
    test('should render rounded by default', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('rounded-lg');
    });

    test('should render circle when specified', () => {
      const { container } = render(<Skeleton circle />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('rounded-full');
    });
  });

  // ========================================
  // CUSTOM STYLING TESTS
  // ========================================

  describe('Custom Styling', () => {
    test('should accept custom className', () => {
      const { container } = render(<Skeleton className="custom-skeleton" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('custom-skeleton');
    });

    test('should merge custom className with defaults', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('custom-class');
      expect(skeleton.className).toContain('bg-gray-300');
    });

    test('should accept custom style', () => {
      const { container } = render(
        <Skeleton style={{ marginTop: '10px' }} />
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.marginTop).toBe('10px');
    });
  });

  // ========================================
  // ANIMATION TESTS
  // ========================================

  describe('Animation', () => {
    test('should disable animation when specified', () => {
      const { container } = render(<Skeleton disableAnimation />);
      const skeleton = container.firstChild;
      expect(skeleton?.nodeName).toBe('DIV'); // Should be div, not motion.div
    });
  });
});

// ========================================
// SKELETON TEXT TESTS
// ========================================

describe('SkeletonText Component', () => {
  test('should render 3 lines by default', () => {
    const { container } = render(<SkeletonText />);
    const lines = container.querySelectorAll('.bg-gray-300');
    expect(lines.length).toBe(3);
  });

  test('should render custom number of lines', () => {
    const { container } = render(<SkeletonText lines={5} />);
    const lines = container.querySelectorAll('.bg-gray-300');
    expect(lines.length).toBe(5);
  });

  test('should render last line shorter', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll('.bg-gray-300');
    const lastLine = lines[lines.length - 1] as HTMLElement;
    expect(lastLine.style.width).toBe('80%');
  });

  test('should have space between lines', () => {
    const { container } = render(<SkeletonText />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('space-y-2');
  });

  test('should accept custom className', () => {
    const { container } = render(<SkeletonText className="custom" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom');
  });
});

// ========================================
// SKELETON AVATAR TESTS
// ========================================

describe('SkeletonAvatar Component', () => {
  test('should render circle', () => {
    const { container } = render(<SkeletonAvatar />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.className).toContain('rounded-full');
  });

  test('should have default size 40px', () => {
    const { container } = render(<SkeletonAvatar />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.style.width).toBe('40px');
    expect(avatar.style.height).toBe('40px');
  });

  test('should render custom size', () => {
    const { container } = render(<SkeletonAvatar size={64} />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.style.width).toBe('64px');
    expect(avatar.style.height).toBe('64px');
  });

  test('should accept custom className', () => {
    const { container } = render(<SkeletonAvatar className="custom" />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.className).toContain('custom');
  });
});

// ========================================
// SKELETON BUTTON TESTS
// ========================================

describe('SkeletonButton Component', () => {
  test('should have default width 100px', () => {
    const { container } = render(<SkeletonButton />);
    const button = container.firstChild as HTMLElement;
    expect(button.style.width).toBe('100px');
  });

  test('should have default height 40px', () => {
    const { container } = render(<SkeletonButton />);
    const button = container.firstChild as HTMLElement;
    expect(button.style.height).toBe('40px');
  });

  test('should render custom size', () => {
    const { container } = render(<SkeletonButton width={150} height={50} />);
    const button = container.firstChild as HTMLElement;
    expect(button.style.width).toBe('150px');
    expect(button.style.height).toBe('50px');
  });

  test('should have rounded corners', () => {
    const { container } = render(<SkeletonButton />);
    const button = container.firstChild as HTMLElement;
    expect(button.className).toContain('rounded-xl');
  });

  test('should accept custom className', () => {
    const { container } = render(<SkeletonButton className="custom" />);
    const button = container.firstChild as HTMLElement;
    expect(button.className).toContain('custom');
  });
});

// ========================================
// SKELETON CARD TESTS
// ========================================

describe('SkeletonCard Component', () => {
  // Mock Card component
  vi.mock('@/components/ui/Card', () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }));

  test('should render one card by default', () => {
    const { container } = render(<SkeletonCard />);
    const cards = container.querySelectorAll('.bg-gray-300');
    expect(cards.length).toBeGreaterThan(0);
  });

  test('should render multiple cards', () => {
    const { container } = render(<SkeletonCard count={3} />);
    // Each card has multiple skeleton elements
    const skeletons = container.querySelectorAll('.bg-gray-300');
    expect(skeletons.length).toBeGreaterThan(3);
  });

  test('should accept custom className', () => {
    const { container } = render(<SkeletonCard className="custom" />);
    expect(container.innerHTML).toContain('custom');
  });

  test('should pass disableAnimation prop', () => {
    const { container } = render(<SkeletonCard disableAnimation />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

// ========================================
// SKELETON CARD GRID TESTS
// ========================================

describe('SkeletonCardGrid Component', () => {
  test('should render grid layout', () => {
    const { container } = render(<SkeletonCardGrid />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid');
  });

  test('should have responsive grid columns', () => {
    const { container } = render(<SkeletonCardGrid />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
  });

  test('should render 6 cards by default', () => {
    const { container } = render(<SkeletonCardGrid />);
    const skeletons = container.querySelectorAll('.bg-gray-300');
    // Each of 6 cards has multiple skeleton elements
    expect(skeletons.length).toBeGreaterThan(6);
  });

  test('should render custom number of cards', () => {
    const { container } = render(<SkeletonCardGrid count={3} />);
    const skeletons = container.querySelectorAll('.bg-gray-300');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('should accept custom className', () => {
    const { container } = render(<SkeletonCardGrid className="custom" />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('custom');
  });
});
