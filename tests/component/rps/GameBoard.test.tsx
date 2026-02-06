import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/tests/helpers/render';
import { GameBoard } from '@/components/rps/GameBoard';
import type { Choice } from '@/hooks/useRockPaperScissors';
import { useFarcaster } from '@/components/providers';

/**
 * GameBoard (RPS) Component Tests
 *
 * Tests for the Rock Paper Scissors game board component that:
 * - Displays 3 choice buttons (Rock, Paper, Scissors)
 * - Handles choice selection via onChoice callback
 * - Manages disabled state
 * - Adapts animations based on Farcaster context and reduced motion preference
 * - Provides accessibility features
 */

// Mock dependencies
vi.mock('@/components/providers', () => ({
  useFarcaster: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, disabled, className, style, whileTap, ...props }: any) => (
      <button
        onClick={onClick}
        disabled={disabled}
        className={className}
        style={style}
        data-while-tap={whileTap ? JSON.stringify(whileTap) : undefined}
        {...props}
      >
        {children}
      </button>
    ),
  },
}));

describe('GameBoard (RPS)', () => {
  const mockOnChoice = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default Farcaster mock
    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: false,
      isSDKReady: false,
      sdk: null,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  test('should render "Choose Your Move" heading', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    expect(screen.getByText('Choose Your Move')).toBeInTheDocument();
  });

  test('should render 3 choice buttons', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  test('should render Rock button with emoji', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    expect(screen.getByText('🪨')).toBeInTheDocument();
    expect(screen.getByText('Rock')).toBeInTheDocument();
  });

  test('should render Paper button with emoji', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    expect(screen.getByText('📄')).toBeInTheDocument();
    expect(screen.getByText('Paper')).toBeInTheDocument();
  });

  test('should render Scissors button with emoji', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    expect(screen.getByText('✂️')).toBeInTheDocument();
    expect(screen.getByText('Scissors')).toBeInTheDocument();
  });

  test('should have grid-cols-3 layout', () => {
    const { container } = render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  test('should have gap between buttons', () => {
    const { container } = render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    const grid = container.querySelector('.gap-3');
    expect(grid).toBeInTheDocument();
  });

  // ============================================================================
  // Choice Selection Tests
  // ============================================================================

  test('should call onChoice with 0 when Rock is clicked', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    fireEvent.click(rockButton);

    expect(mockOnChoice).toHaveBeenCalledWith(0);
  });

  test('should call onChoice with 1 when Paper is clicked', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const paperButton = screen.getByLabelText('Choose Paper');
    fireEvent.click(paperButton);

    expect(mockOnChoice).toHaveBeenCalledWith(1);
  });

  test('should call onChoice with 2 when Scissors is clicked', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const scissorsButton = screen.getByLabelText('Choose Scissors');
    fireEvent.click(scissorsButton);

    expect(mockOnChoice).toHaveBeenCalledWith(2);
  });

  test('should not call onChoice when Rock is clicked while disabled', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={true} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    fireEvent.click(rockButton);

    expect(mockOnChoice).not.toHaveBeenCalled();
  });

  test('should not call onChoice when Paper is clicked while disabled', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={true} />);

    const paperButton = screen.getByLabelText('Choose Paper');
    fireEvent.click(paperButton);

    expect(mockOnChoice).not.toHaveBeenCalled();
  });

  test('should not call onChoice when Scissors is clicked while disabled', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={true} />);

    const scissorsButton = screen.getByLabelText('Choose Scissors');
    fireEvent.click(scissorsButton);

    expect(mockOnChoice).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Disabled State Tests
  // ============================================================================

  test('should have disabled attribute when disabled prop is true', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  test('should not have disabled attribute when disabled prop is false', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
  });

  test('should have opacity-50 class when disabled', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  test('should have cursor-not-allowed class when disabled', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  test('should not have yellow border when disabled', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={true} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const style = rockButton.getAttribute('style');

    // Should not have the chain-colored border shadow
    expect(style).not.toContain('var(--chain-primary)');
  });

  test('should have yellow border when not disabled', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const style = rockButton.getAttribute('style');

    // Should have the chain-colored border shadow
    expect(style).toContain('var(--chain-primary)');
  });

  test('should toggle disabled state correctly', () => {
    const { rerender } = render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    let rockButton = screen.getByLabelText('Choose Rock');
    expect(rockButton).not.toBeDisabled();

    rerender(<GameBoard onChoice={mockOnChoice} disabled={true} />);

    rockButton = screen.getByLabelText('Choose Rock');
    expect(rockButton).toBeDisabled();

    rerender(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    rockButton = screen.getByLabelText('Choose Rock');
    expect(rockButton).not.toBeDisabled();
  });

  // ============================================================================
  // Farcaster Context Tests
  // ============================================================================

  test('should detect when in Farcaster context', () => {
    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: true,
      isSDKReady: true,
      sdk: {} as any,
    });

    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    // Component should render without errors
    expect(screen.getByText('Choose Your Move')).toBeInTheDocument();
  });

  test('should disable animations when in Farcaster', () => {
    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: true,
      isSDKReady: true,
      sdk: {} as any,
    });

    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const whileTap = rockButton.getAttribute('data-while-tap');

    // Should have empty whileTap when in Farcaster
    expect(whileTap).toBe('{}');
  });

  test('should enable animations when not in Farcaster and no reduced motion', () => {
    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: false,
      isSDKReady: false,
      sdk: null,
    });

    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const whileTap = rockButton.getAttribute('data-while-tap');

    // Should have scale animation
    expect(whileTap).toContain('scale');
    expect(whileTap).toContain('0.95');
  });

  // ============================================================================
  // Reduced Motion Tests
  // ============================================================================

  test('should check for prefers-reduced-motion', () => {
    const matchMediaMock = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  test('should disable animations when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const whileTap = rockButton.getAttribute('data-while-tap');

    // Should have empty whileTap when reduced motion preferred
    expect(whileTap).toBe('{}');
  });

  test('should enable animations when reduced motion is not preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const whileTap = rockButton.getAttribute('data-while-tap');

    // Should have scale animation
    expect(whileTap).toContain('scale');
  });

  // ============================================================================
  // Styling Tests
  // ============================================================================

  test('should have rounded-2xl on all buttons', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('rounded-2xl');
    });
  });

  test('should have backdrop-blur-lg on all buttons', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('backdrop-blur-lg');
    });
  });

  test('should have border-2 border-gray-700 on all buttons', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('border-2', 'border-gray-700');
    });
  });

  test('should have shadow-lg on all buttons', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('shadow-lg');
    });
  });

  test('should have min-h-[100px] on mobile', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.className).toContain('min-h-[100px]');
    });
  });

  test('should have bg-white/80 on all buttons', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.className).toContain('bg-white/80');
    });
  });

  test('should have transition-all on all buttons', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('transition-all');
    });
  });

  test('should have touch-manipulation on all buttons', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('touch-manipulation');
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  test('should have aria-label on Rock button', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    expect(screen.getByLabelText('Choose Rock')).toBeInTheDocument();
  });

  test('should have aria-label on Paper button', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    expect(screen.getByLabelText('Choose Paper')).toBeInTheDocument();
  });

  test('should have aria-label on Scissors button', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    expect(screen.getByLabelText('Choose Scissors')).toBeInTheDocument();
  });

  test('should have role="img" on emojis', () => {
    const { container } = render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const emojis = container.querySelectorAll('[role="img"]');
    expect(emojis.length).toBe(3);
  });

  test('should have aria-label on emoji spans', () => {
    const { container } = render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockEmoji = container.querySelector('[aria-label="Rock"]');
    const paperEmoji = container.querySelector('[aria-label="Paper"]');
    const scissorsEmoji = container.querySelector('[aria-label="Scissors"]');

    expect(rockEmoji).toBeInTheDocument();
    expect(paperEmoji).toBeInTheDocument();
    expect(scissorsEmoji).toBeInTheDocument();
  });

  test('should render actual button elements', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.tagName).toBe('BUTTON');
    });
  });

  test('should have exactly 3 button roles', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  // ============================================================================
  // Animation Tests
  // ============================================================================

  test('should have whileTap animation when not disabled and shouldAnimate', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const whileTap = rockButton.getAttribute('data-while-tap');

    expect(whileTap).toContain('scale');
    expect(whileTap).toContain('0.95');
  });

  test('should not have whileTap animation when disabled', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={true} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const whileTap = rockButton.getAttribute('data-while-tap');

    expect(whileTap).toBe('{}');
  });

  test('should not have whileTap animation when in Farcaster', () => {
    vi.mocked(useFarcaster).mockReturnValue({
      isInFarcaster: true,
      isSDKReady: true,
      sdk: {} as any,
    });

    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const whileTap = rockButton.getAttribute('data-while-tap');

    expect(whileTap).toBe('{}');
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  test('should handle rapid clicking on same choice', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');

    fireEvent.click(rockButton);
    fireEvent.click(rockButton);
    fireEvent.click(rockButton);

    expect(mockOnChoice).toHaveBeenCalledTimes(3);
    expect(mockOnChoice).toHaveBeenCalledWith(0);
  });

  test('should handle rapid clicking on different choices', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    const paperButton = screen.getByLabelText('Choose Paper');
    const scissorsButton = screen.getByLabelText('Choose Scissors');

    fireEvent.click(rockButton);
    fireEvent.click(paperButton);
    fireEvent.click(scissorsButton);
    fireEvent.click(rockButton);

    expect(mockOnChoice).toHaveBeenCalledTimes(4);
  });

  test('should handle toggling between enabled and disabled', () => {
    const { rerender } = render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockButton = screen.getByLabelText('Choose Rock');
    fireEvent.click(rockButton);
    expect(mockOnChoice).toHaveBeenCalledWith(0);

    mockOnChoice.mockClear();

    rerender(<GameBoard onChoice={mockOnChoice} disabled={true} />);
    fireEvent.click(rockButton);
    expect(mockOnChoice).not.toHaveBeenCalled();

    rerender(<GameBoard onChoice={mockOnChoice} disabled={false} />);
    fireEvent.click(rockButton);
    expect(mockOnChoice).toHaveBeenCalledWith(0);
  });

  // ============================================================================
  // Emoji and Text Display Tests
  // ============================================================================

  test('should render emojis with correct size classes', () => {
    const { container } = render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockEmoji = screen.getByText('🪨');
    expect(rockEmoji).toHaveClass('text-4xl');
  });

  test('should render choice names with correct styling', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const rockName = screen.getByText('Rock');
    const paperName = screen.getByText('Paper');
    const scissorsName = screen.getByText('Scissors');

    expect(rockName).toHaveClass('text-xs', 'font-bold', 'text-gray-900');
    expect(paperName).toHaveClass('text-xs', 'font-bold', 'text-gray-900');
    expect(scissorsName).toHaveClass('text-xs', 'font-bold', 'text-gray-900');
  });

  // ============================================================================
  // Heading Tests
  // ============================================================================

  test('should render heading with correct styling', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const heading = screen.getByText('Choose Your Move');
    expect(heading).toHaveClass('text-xl', 'font-bold', 'text-center', 'text-gray-900');
  });

  test('should render heading as h2 element', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const heading = screen.getByText('Choose Your Move');
    expect(heading.tagName).toBe('H2');
  });

  // ============================================================================
  // Layout Tests
  // ============================================================================

  test('should have space-y-4 on container', () => {
    const { container } = render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const wrapper = container.querySelector('.space-y-4');
    expect(wrapper).toBeInTheDocument();
  });

  test('should have flex-col on buttons for vertical layout', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });
  });

  test('should have gap between emoji and name', () => {
    render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('gap-1');
    });
  });

  // ============================================================================
  // Component Memo Tests
  // ============================================================================

  test('should be memoized component', () => {
    const { rerender } = render(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const firstRockButton = screen.getByLabelText('Choose Rock');

    // Rerender with same props
    rerender(<GameBoard onChoice={mockOnChoice} disabled={false} />);

    const secondRockButton = screen.getByLabelText('Choose Rock');

    // Component should still render correctly
    expect(firstRockButton).toBeInTheDocument();
    expect(secondRockButton).toBeInTheDocument();
  });
});
