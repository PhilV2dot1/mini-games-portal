import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSelector from '@/components/profile/ThemeSelector';
import { ThemeColor, THEME_OPTIONS } from '@/lib/constants/themes';

/**
 * ThemeSelector Component Tests
 *
 * Tests for the theme selector component that allows:
 * - Selecting from 7 color themes (yellow, blue, purple, green, red, orange, pink)
 * - Visual preview of each theme color
 * - Visual indication of selected theme with ring and checkmark
 * - Clicking to change theme
 */

describe('ThemeSelector', () => {
  const mockOnThemeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  test('should render label "Couleur du profil"', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);
    expect(screen.getByText('Couleur du profil')).toBeInTheDocument();
  });

  test('should render helper text', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);
    expect(screen.getByText(/Cette couleur s'affichera sur votre carte de profil/)).toBeInTheDocument();
  });

  test('should render all 7 theme buttons', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);
  });

  test('should render all theme names in French', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    expect(screen.getByText('Jaune')).toBeInTheDocument();
    expect(screen.getByText('Bleu')).toBeInTheDocument();
    expect(screen.getByText('Violet')).toBeInTheDocument();
    expect(screen.getByText('Vert')).toBeInTheDocument();
    expect(screen.getByText('Rouge')).toBeInTheDocument();
    expect(screen.getByText('Orange')).toBeInTheDocument();
    expect(screen.getByText('Rose')).toBeInTheDocument();
  });

  test('should have grid-cols-7 layout', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);
    const grid = container.querySelector('.grid-cols-7');
    expect(grid).toBeInTheDocument();
  });

  test('should have gap-3 spacing', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);
    const grid = container.querySelector('.gap-3');
    expect(grid).toBeInTheDocument();
  });

  // ============================================================================
  // Selected Theme Tests - Yellow
  // ============================================================================

  test('should highlight yellow theme when selected', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);
    const yellowButton = screen.getByText('Jaune').closest('button');

    expect(yellowButton).toHaveClass('ring-2');
    expect(yellowButton).toHaveClass('ring-offset-2');
    expect(yellowButton).toHaveClass('ring-gray-900');
    expect(yellowButton).toHaveClass('bg-gray-50');
  });

  test('should show checkmark icon on selected yellow theme', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);
    const yellowButton = screen.getByText('Jaune').closest('button');
    const checkmark = yellowButton?.querySelector('svg');

    expect(checkmark).toBeInTheDocument();
    expect(checkmark).toHaveClass('w-3', 'h-3', 'text-white');
  });

  test('should scale selected yellow theme', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);
    const yellowButton = screen.getByText('Jaune').closest('button');
    const colorCircle = yellowButton?.querySelector('.w-10');

    expect(colorCircle).toHaveClass('scale-110');
  });

  test('should have yellow preview color', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);
    const yellowButton = screen.getByText('Jaune').closest('button');
    const colorCircle = yellowButton?.querySelector('div');

    expect(colorCircle).toHaveClass('bg-yellow-400');
  });

  // ============================================================================
  // Selected Theme Tests - Blue
  // ============================================================================

  test('should highlight blue theme when selected', () => {
    render(<ThemeSelector selectedTheme="blue" onThemeChange={mockOnThemeChange} />);
    const blueButton = screen.getByText('Bleu').closest('button');

    expect(blueButton).toHaveClass('ring-2', 'ring-offset-2', 'ring-gray-900');
  });

  test('should show checkmark icon on selected blue theme', () => {
    render(<ThemeSelector selectedTheme="blue" onThemeChange={mockOnThemeChange} />);
    const blueButton = screen.getByText('Bleu').closest('button');
    const checkmark = blueButton?.querySelector('svg');

    expect(checkmark).toBeInTheDocument();
  });

  test('should have blue preview color', () => {
    render(<ThemeSelector selectedTheme="blue" onThemeChange={mockOnThemeChange} />);
    const blueButton = screen.getByText('Bleu').closest('button');
    const colorCircle = blueButton?.querySelector('div');

    expect(colorCircle).toHaveClass('bg-blue-500');
  });

  // ============================================================================
  // Selected Theme Tests - Purple
  // ============================================================================

  test('should highlight purple theme when selected', () => {
    render(<ThemeSelector selectedTheme="purple" onThemeChange={mockOnThemeChange} />);
    const purpleButton = screen.getByText('Violet').closest('button');

    expect(purpleButton).toHaveClass('ring-2', 'ring-offset-2', 'ring-gray-900');
  });

  test('should show checkmark icon on selected purple theme', () => {
    render(<ThemeSelector selectedTheme="purple" onThemeChange={mockOnThemeChange} />);
    const purpleButton = screen.getByText('Violet').closest('button');
    const checkmark = purpleButton?.querySelector('svg');

    expect(checkmark).toBeInTheDocument();
  });

  test('should have purple preview color', () => {
    render(<ThemeSelector selectedTheme="purple" onThemeChange={mockOnThemeChange} />);
    const purpleButton = screen.getByText('Violet').closest('button');
    const colorCircle = purpleButton?.querySelector('div');

    expect(colorCircle).toHaveClass('bg-purple-500');
  });

  // ============================================================================
  // Selected Theme Tests - Green
  // ============================================================================

  test('should highlight green theme when selected', () => {
    render(<ThemeSelector selectedTheme="green" onThemeChange={mockOnThemeChange} />);
    const greenButton = screen.getByText('Vert').closest('button');

    expect(greenButton).toHaveClass('ring-2', 'ring-offset-2', 'ring-gray-900');
  });

  test('should show checkmark icon on selected green theme', () => {
    render(<ThemeSelector selectedTheme="green" onThemeChange={mockOnThemeChange} />);
    const greenButton = screen.getByText('Vert').closest('button');
    const checkmark = greenButton?.querySelector('svg');

    expect(checkmark).toBeInTheDocument();
  });

  test('should have green preview color', () => {
    render(<ThemeSelector selectedTheme="green" onThemeChange={mockOnThemeChange} />);
    const greenButton = screen.getByText('Vert').closest('button');
    const colorCircle = greenButton?.querySelector('div');

    expect(colorCircle).toHaveClass('bg-green-500');
  });

  // ============================================================================
  // Selected Theme Tests - Red
  // ============================================================================

  test('should highlight red theme when selected', () => {
    render(<ThemeSelector selectedTheme="red" onThemeChange={mockOnThemeChange} />);
    const redButton = screen.getByText('Rouge').closest('button');

    expect(redButton).toHaveClass('ring-2', 'ring-offset-2', 'ring-gray-900');
  });

  test('should show checkmark icon on selected red theme', () => {
    render(<ThemeSelector selectedTheme="red" onThemeChange={mockOnThemeChange} />);
    const redButton = screen.getByText('Rouge').closest('button');
    const checkmark = redButton?.querySelector('svg');

    expect(checkmark).toBeInTheDocument();
  });

  test('should have red preview color', () => {
    render(<ThemeSelector selectedTheme="red" onThemeChange={mockOnThemeChange} />);
    const redButton = screen.getByText('Rouge').closest('button');
    const colorCircle = redButton?.querySelector('div');

    expect(colorCircle).toHaveClass('bg-red-500');
  });

  // ============================================================================
  // Selected Theme Tests - Orange
  // ============================================================================

  test('should highlight orange theme when selected', () => {
    render(<ThemeSelector selectedTheme="orange" onThemeChange={mockOnThemeChange} />);
    const orangeButton = screen.getByText('Orange').closest('button');

    expect(orangeButton).toHaveClass('ring-2', 'ring-offset-2', 'ring-gray-900');
  });

  test('should show checkmark icon on selected orange theme', () => {
    render(<ThemeSelector selectedTheme="orange" onThemeChange={mockOnThemeChange} />);
    const orangeButton = screen.getByText('Orange').closest('button');
    const checkmark = orangeButton?.querySelector('svg');

    expect(checkmark).toBeInTheDocument();
  });

  test('should have orange preview color', () => {
    render(<ThemeSelector selectedTheme="orange" onThemeChange={mockOnThemeChange} />);
    const orangeButton = screen.getByText('Orange').closest('button');
    const colorCircle = orangeButton?.querySelector('div');

    expect(colorCircle).toHaveClass('bg-orange-500');
  });

  // ============================================================================
  // Selected Theme Tests - Pink
  // ============================================================================

  test('should highlight pink theme when selected', () => {
    render(<ThemeSelector selectedTheme="pink" onThemeChange={mockOnThemeChange} />);
    const pinkButton = screen.getByText('Rose').closest('button');

    expect(pinkButton).toHaveClass('ring-2', 'ring-offset-2', 'ring-gray-900');
  });

  test('should show checkmark icon on selected pink theme', () => {
    render(<ThemeSelector selectedTheme="pink" onThemeChange={mockOnThemeChange} />);
    const pinkButton = screen.getByText('Rose').closest('button');
    const checkmark = pinkButton?.querySelector('svg');

    expect(checkmark).toBeInTheDocument();
  });

  test('should have pink preview color', () => {
    render(<ThemeSelector selectedTheme="pink" onThemeChange={mockOnThemeChange} />);
    const pinkButton = screen.getByText('Rose').closest('button');
    const colorCircle = pinkButton?.querySelector('div');

    expect(colorCircle).toHaveClass('bg-pink-500');
  });

  // ============================================================================
  // Unselected Theme Tests
  // ============================================================================

  test('should not show checkmark on unselected themes', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    // Blue should not have checkmark when yellow is selected
    const blueButton = screen.getByText('Bleu').closest('button');
    const blueCheckmark = blueButton?.querySelector('svg');
    expect(blueCheckmark).not.toBeInTheDocument();
  });

  test('should not have ring classes on unselected themes', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const blueButton = screen.getByText('Bleu').closest('button');
    expect(blueButton).not.toHaveClass('ring-2');
    expect(blueButton).not.toHaveClass('ring-offset-2');
  });

  test('should have hover classes on unselected themes', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const blueButton = screen.getByText('Bleu').closest('button');
    expect(blueButton).toHaveClass('hover:bg-gray-50');
  });

  test('should not have scale-110 on unselected themes', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const blueButton = screen.getByText('Bleu').closest('button');
    const colorCircle = blueButton?.querySelector('.w-10');

    expect(colorCircle).not.toHaveClass('scale-110');
    expect(colorCircle).toHaveClass('hover:scale-105');
  });

  // ============================================================================
  // Theme Selection Tests
  // ============================================================================

  test('should call onThemeChange when clicking yellow theme', () => {
    render(<ThemeSelector selectedTheme="blue" onThemeChange={mockOnThemeChange} />);

    const yellowButton = screen.getByText('Jaune');
    fireEvent.click(yellowButton);

    expect(mockOnThemeChange).toHaveBeenCalledWith('yellow');
  });

  test('should call onThemeChange when clicking blue theme', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const blueButton = screen.getByText('Bleu');
    fireEvent.click(blueButton);

    expect(mockOnThemeChange).toHaveBeenCalledWith('blue');
  });

  test('should call onThemeChange when clicking purple theme', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const purpleButton = screen.getByText('Violet');
    fireEvent.click(purpleButton);

    expect(mockOnThemeChange).toHaveBeenCalledWith('purple');
  });

  test('should call onThemeChange when clicking green theme', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const greenButton = screen.getByText('Vert');
    fireEvent.click(greenButton);

    expect(mockOnThemeChange).toHaveBeenCalledWith('green');
  });

  test('should call onThemeChange when clicking red theme', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const redButton = screen.getByText('Rouge');
    fireEvent.click(redButton);

    expect(mockOnThemeChange).toHaveBeenCalledWith('red');
  });

  test('should call onThemeChange when clicking orange theme', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const orangeButton = screen.getByText('Orange');
    fireEvent.click(orangeButton);

    expect(mockOnThemeChange).toHaveBeenCalledWith('orange');
  });

  test('should call onThemeChange when clicking pink theme', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const pinkButton = screen.getByText('Rose');
    fireEvent.click(pinkButton);

    expect(mockOnThemeChange).toHaveBeenCalledWith('pink');
  });

  test('should allow clicking already selected theme', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const yellowButton = screen.getByText('Jaune');
    fireEvent.click(yellowButton);

    expect(mockOnThemeChange).toHaveBeenCalledWith('yellow');
  });

  // ============================================================================
  // Styling Tests
  // ============================================================================

  test('should have rounded-lg on all buttons', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('rounded-lg');
    });
  });

  test('should have w-10 h-10 on all color circles', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const circles = container.querySelectorAll('.w-10.h-10');
    expect(circles.length).toBe(7);
  });

  test('should have rounded-full on all color circles', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const circles = container.querySelectorAll('.rounded-full');
    expect(circles.length).toBeGreaterThanOrEqual(7); // At least 7 circles
  });

  test('should have shadow-md on all color circles', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const circles = container.querySelectorAll('.shadow-md');
    expect(circles.length).toBe(7);
  });

  test('should have transition classes', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('transition-all');
    });
  });

  test('should have text-xs on theme names', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const themeNames = container.querySelectorAll('.text-xs');
    expect(themeNames.length).toBeGreaterThanOrEqual(7);
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  test('should render actual button elements', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);
    buttons.forEach(button => {
      expect(button.tagName).toBe('BUTTON');
    });
  });

  test('should have type="button" on all buttons', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  test('should have title attribute on all buttons', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    expect(screen.getByTitle('Jaune')).toBeInTheDocument();
    expect(screen.getByTitle('Bleu')).toBeInTheDocument();
    expect(screen.getByTitle('Violet')).toBeInTheDocument();
    expect(screen.getByTitle('Vert')).toBeInTheDocument();
    expect(screen.getByTitle('Rouge')).toBeInTheDocument();
    expect(screen.getByTitle('Orange')).toBeInTheDocument();
    expect(screen.getByTitle('Rose')).toBeInTheDocument();
  });

  test('should have label element for form semantics', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const label = container.querySelector('label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass('font-medium', 'text-gray-700');
  });

  // ============================================================================
  // Visual Feedback Tests
  // ============================================================================

  test('should show only one checkmark at a time', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const checkmarks = container.querySelectorAll('svg');
    expect(checkmarks.length).toBe(1);
  });

  test('should show only one ring at a time', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const ringedButtons = container.querySelectorAll('.ring-2.ring-offset-2.ring-gray-900');
    expect(ringedButtons.length).toBe(1);
  });

  test('should show only one scaled circle at a time', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const yellowButton = screen.getByText('Jaune').closest('button');
    const yellowCircle = yellowButton?.querySelector('div');
    expect(yellowCircle).toHaveClass('scale-110');

    // Check that other theme circles don't have scale-110
    const blueButton = screen.getByText('Bleu').closest('button');
    const blueCircle = blueButton?.querySelector('div');
    expect(blueCircle).not.toHaveClass('scale-110');
  });

  test('checkmark should have absolute positioning', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const yellowButton = screen.getByText('Jaune').closest('button');
    const checkmarkContainer = yellowButton?.querySelector('.absolute');

    expect(checkmarkContainer).toBeInTheDocument();
    expect(checkmarkContainer).toHaveClass('-top-1', '-right-1', 'bg-gray-900', 'rounded-full');
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  test('should handle rapid clicking on same theme', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const yellowButton = screen.getByText('Jaune');

    fireEvent.click(yellowButton);
    fireEvent.click(yellowButton);
    fireEvent.click(yellowButton);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(3);
    expect(mockOnThemeChange).toHaveBeenCalledWith('yellow');
  });

  test('should handle rapid switching between themes', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const yellowButton = screen.getByText('Jaune');
    const blueButton = screen.getByText('Bleu');
    const redButton = screen.getByText('Rouge');

    fireEvent.click(blueButton);
    fireEvent.click(redButton);
    fireEvent.click(yellowButton);
    fireEvent.click(blueButton);

    expect(mockOnThemeChange).toHaveBeenCalledTimes(4);
  });

  test('should update visual state when selectedTheme prop changes', () => {
    const { rerender } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    // Yellow should be selected
    let yellowButton = screen.getByText('Jaune').closest('button');
    expect(yellowButton).toHaveClass('ring-2');

    // Change to blue
    rerender(<ThemeSelector selectedTheme="blue" onThemeChange={mockOnThemeChange} />);

    // Blue should now be selected
    const blueButton = screen.getByText('Bleu').closest('button');
    expect(blueButton).toHaveClass('ring-2');

    // Yellow should no longer be selected
    yellowButton = screen.getByText('Jaune').closest('button');
    expect(yellowButton).not.toHaveClass('ring-2');
  });

  // ============================================================================
  // All Themes Cycle Test
  // ============================================================================

  test('should cycle through all 7 themes', () => {
    const { rerender } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const allThemes: ThemeColor[] = ['yellow', 'blue', 'purple', 'green', 'red', 'orange', 'pink'];
    const themeNames = ['Jaune', 'Bleu', 'Violet', 'Vert', 'Rouge', 'Orange', 'Rose'];

    allThemes.forEach((theme, index) => {
      rerender(<ThemeSelector selectedTheme={theme} onThemeChange={mockOnThemeChange} />);

      const button = screen.getByText(themeNames[index]).closest('button');
      expect(button).toHaveClass('ring-2', 'ring-offset-2', 'ring-gray-900');

      const checkmark = button?.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Label and Helper Text Tests
  // ============================================================================

  test('should have correct label classes', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const label = container.querySelector('label');
    expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700', 'mb-2');
  });

  test('should have correct helper text classes', () => {
    const { container } = render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    const helperText = screen.getByText(/Cette couleur s'affichera sur votre carte de profil/).closest('p');
    expect(helperText).toHaveClass('text-gray-500', 'text-xs', 'mt-2');
  });

  test('should render exactly 7 themes from THEME_OPTIONS', () => {
    render(<ThemeSelector selectedTheme="yellow" onThemeChange={mockOnThemeChange} />);

    expect(THEME_OPTIONS).toHaveLength(7);

    THEME_OPTIONS.forEach(theme => {
      expect(screen.getByText(theme.name)).toBeInTheDocument();
    });
  });
});
