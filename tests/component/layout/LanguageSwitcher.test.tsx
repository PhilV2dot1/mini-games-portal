import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n/LanguageContext';

/**
 * LanguageSwitcher Component Tests
 *
 * Tests for the language switcher component that allows:
 * - Switching between English (EN) and French (FR)
 * - Visual indication of active language
 * - Smooth transitions between languages
 */

// Mock dependencies
vi.mock('@/lib/i18n/LanguageContext');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, layoutId, transition }: any) => (
      <div className={className} data-layout-id={layoutId}>
        {children}
      </div>
    ),
  },
}));

describe('LanguageSwitcher', () => {
  const mockSetLanguage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  test('should render both language buttons', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('FR')).toBeInTheDocument();
  });

  test('should render in a container with border', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    const { container } = render(<LanguageSwitcher />);

    const switcher = container.querySelector('.bg-white\\/80.border-2.border-gray-300');
    expect(switcher).toBeInTheDocument();
  });

  // ============================================================================
  // Active Language Tests - English
  // ============================================================================

  test('should highlight EN button when English is active', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const enButton = screen.getByText('EN').closest('button');
    expect(enButton).toHaveClass('text-gray-900');
  });

  test('should show gray background for EN when active (new design)', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    const { container } = render(<LanguageSwitcher />);

    // In new design, active background uses motion.div with layoutId
    const activeBg = container.querySelector('[data-layout-id="activeLanguage"]');
    expect(activeBg).toBeInTheDocument();
  });

  test('should not highlight FR button when English is active', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const frButton = screen.getByText('FR').closest('button');
    expect(frButton).toHaveClass('text-gray-500');
    expect(frButton).not.toHaveClass('text-gray-900');
  });

  // ============================================================================
  // Active Language Tests - French
  // ============================================================================

  test('should highlight FR button when French is active', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'fr',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const frButton = screen.getByText('FR').closest('button');
    expect(frButton).toHaveClass('text-white');
  });

  test('should show gray background for FR when active (new design)', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'fr',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    const { container } = render(<LanguageSwitcher />);

    // In new design, active background uses motion.div with layoutId
    const activeBg = container.querySelector('[data-layout-id="activeLanguage"]');
    expect(activeBg).toBeInTheDocument();
  });

  test('should not highlight EN button when French is active', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'fr',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const enButton = screen.getByText('EN').closest('button');
    expect(enButton).toHaveClass('text-gray-500');
    expect(enButton).not.toHaveClass('text-gray-900');
  });

  // ============================================================================
  // Language Switching Tests
  // ============================================================================

  test('should call setLanguage with "en" when EN button is clicked', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'fr',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const enButton = screen.getByText('EN');
    fireEvent.click(enButton);

    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  test('should call setLanguage with "fr" when FR button is clicked', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const frButton = screen.getByText('FR');
    fireEvent.click(frButton);

    expect(mockSetLanguage).toHaveBeenCalledWith('fr');
  });

  test('should allow clicking EN button when already active', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const enButton = screen.getByText('EN');
    fireEvent.click(enButton);

    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  test('should allow clicking FR button when already active', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'fr',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const frButton = screen.getByText('FR');
    fireEvent.click(frButton);

    expect(mockSetLanguage).toHaveBeenCalledWith('fr');
  });

  test('should allow switching back and forth', () => {
    const { rerender } = render(<LanguageSwitcher />);

    // Start with English
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });
    rerender(<LanguageSwitcher />);

    const frButton = screen.getByText('FR');
    fireEvent.click(frButton);
    expect(mockSetLanguage).toHaveBeenCalledWith('fr');

    // Switch to French
    vi.mocked(useLanguage).mockReturnValue({
      language: 'fr',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });
    rerender(<LanguageSwitcher />);

    const enButton = screen.getByText('EN');
    fireEvent.click(enButton);
    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  // ============================================================================
  // Animation Tests
  // ============================================================================

  test('should have layoutId on background animation', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    const { container } = render(<LanguageSwitcher />);

    const animatedBg = container.querySelector('[data-layout-id="activeLanguage"]');
    expect(animatedBg).toBeInTheDocument();
  });

  test('should only show one active background at a time (new design)', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    const { container } = render(<LanguageSwitcher />);

    // In new design, active background uses motion.div with layoutId (should be unique)
    const activeBackgrounds = container.querySelectorAll('[data-layout-id="activeLanguage"]');
    expect(activeBackgrounds.length).toBe(1);
  });

  // ============================================================================
  // Button Styling Tests
  // ============================================================================

  test('should have rounded styling on buttons', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const enButton = screen.getByText('EN').closest('button');
    const frButton = screen.getByText('FR').closest('button');

    expect(enButton).toHaveClass('rounded-lg');
    expect(frButton).toHaveClass('rounded-lg');
  });

  test('should have bold font on both buttons', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const enButton = screen.getByText('EN').closest('button');
    const frButton = screen.getByText('FR').closest('button');

    expect(enButton).toHaveClass('font-bold');
    expect(frButton).toHaveClass('font-bold');
  });

  test('should have hover styles on inactive button', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const frButton = screen.getByText('FR').closest('button');
    expect(frButton).toHaveClass('hover:text-gray-700');
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  test('should render buttons as actual button elements', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  test('should have distinct text for each button', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    expect(screen.getByText('EN')).not.toBe(screen.getByText('FR'));
  });

  // ============================================================================
  // Z-index Tests
  // ============================================================================

  test('should have z-10 on text to appear above background', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    const { container } = render(<LanguageSwitcher />);

    const textElements = container.querySelectorAll('.z-10');
    expect(textElements.length).toBeGreaterThanOrEqual(2); // Both EN and FR text
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  test('should handle rapid clicking on same button', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const enButton = screen.getByText('EN');

    fireEvent.click(enButton);
    fireEvent.click(enButton);
    fireEvent.click(enButton);

    expect(mockSetLanguage).toHaveBeenCalledTimes(3);
    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  test('should handle rapid switching between languages', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    render(<LanguageSwitcher />);

    const enButton = screen.getByText('EN');
    const frButton = screen.getByText('FR');

    fireEvent.click(frButton);
    fireEvent.click(enButton);
    fireEvent.click(frButton);
    fireEvent.click(enButton);

    expect(mockSetLanguage).toHaveBeenCalledTimes(4);
  });

  test('should handle missing language value', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: undefined as any,
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    const { container } = render(<LanguageSwitcher />);

    // Should still render without errors
    expect(container.querySelector('.bg-white\\/80')).toBeInTheDocument();
  });

  // ============================================================================
  // Re-render Tests
  // ============================================================================

  test('should update highlight when language changes externally', () => {
    const { rerender } = render(<LanguageSwitcher />);

    // Start with English
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });
    rerender(<LanguageSwitcher />);

    let enButton = screen.getByText('EN').closest('button');
    expect(enButton).toHaveClass('text-gray-900');

    // Change to French
    vi.mocked(useLanguage).mockReturnValue({
      language: 'fr',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });
    rerender(<LanguageSwitcher />);

    let frButton = screen.getByText('FR').closest('button');
    expect(frButton).toHaveClass('text-white');

    enButton = screen.getByText('EN').closest('button');
    expect(enButton).toHaveClass('text-gray-500');
  });

  test('should maintain position styling', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    const { container } = render(<LanguageSwitcher />);

    const switcher = container.firstChild;
    expect(switcher).toHaveClass('flex', 'items-center', 'gap-1');
  });

  test('should have backdrop blur effect', () => {
    vi.mocked(useLanguage).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
    });

    const { container } = render(<LanguageSwitcher />);

    const switcher = container.querySelector('.backdrop-blur-sm');
    expect(switcher).toBeInTheDocument();
  });
});
