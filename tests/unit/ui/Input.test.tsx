/**
 * Input Component Tests
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // RENDERING TESTS
  // ========================================

  describe('Rendering', () => {
    test('should render input element', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    test('should have correct default type', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    test('should render with custom type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    test('should render with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    test('should link label to input', () => {
      render(<Input label="Email" />);
      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', input.id);
    });
  });

  // ========================================
  // SIZE TESTS
  // ========================================

  describe('Sizes', () => {
    test('should render small size', () => {
      render(<Input size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('h-8');
      expect(input.className).toContain('text-sm');
    });

    test('should render medium size (default)', () => {
      render(<Input size="md" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('h-10');
      expect(input.className).toContain('text-base');
    });

    test('should render large size', () => {
      render(<Input size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('h-12');
      expect(input.className).toContain('text-lg');
    });
  });

  // ========================================
  // STATE TESTS
  // ========================================

  describe('States', () => {
    test('should render default state', () => {
      render(<Input state="default" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-gray-300');
    });

    test('should render error state', () => {
      render(<Input state="error" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-red-500');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('should render success state', () => {
      render(<Input state="success" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-green-500');
    });

    test('should render disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input.className).toContain('disabled:bg-gray-100');
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================

  describe('Error Handling', () => {
    test('should display error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('should set error state when error prop is provided', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('should link error message to input', () => {
      render(<Input label="Email" error="Invalid email" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toHaveTextContent('Invalid email');
    });

    test('should have error role', () => {
      render(<Input error="Error message" />);
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('Error message');
    });

    test('should have aria-live for error announcements', () => {
      render(<Input error="Error message" />);
      const error = screen.getByRole('alert');
      expect(error).toHaveAttribute('aria-live', 'polite');
    });
  });

  // ========================================
  // HINT TEXT TESTS
  // ========================================

  describe('Hint Text', () => {
    test('should display hint text', () => {
      render(<Input hint="Must be at least 8 characters" />);
      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    test('should link hint to input', () => {
      render(<Input label="Password" hint="Min 8 characters" />);
      const input = screen.getByRole('textbox');
      const hintId = input.getAttribute('aria-describedby');
      expect(hintId).toBeTruthy();
      expect(document.getElementById(hintId!)).toHaveTextContent('Min 8 characters');
    });

    test('should hide hint when error is shown', () => {
      render(<Input hint="Hint text" error="Error text" />);
      expect(screen.queryByText('Hint text')).not.toBeInTheDocument();
      expect(screen.getByText('Error text')).toBeInTheDocument();
    });
  });

  // ========================================
  // ICON TESTS
  // ========================================

  describe('Icons', () => {
    test('should render left icon', () => {
      render(<Input leftIcon={<span data-testid="left-icon">📧</span>} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    test('should render right icon', () => {
      render(<Input rightIcon={<span data-testid="right-icon">✓</span>} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    test('should render both icons', () => {
      render(
        <Input
          leftIcon={<span data-testid="left-icon">📧</span>}
          rightIcon={<span data-testid="right-icon">✓</span>}
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    test('should have aria-hidden on icons', () => {
      const { container } = render(
        <Input leftIcon={<span>📧</span>} rightIcon={<span>✓</span>} />
      );
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBe(2);
    });

    test('should adjust padding for left icon', () => {
      render(<Input leftIcon={<span>📧</span>} />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('pl-10');
    });

    test('should adjust padding for right icon', () => {
      render(<Input rightIcon={<span>✓</span>} />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('pr-10');
    });
  });

  // ========================================
  // REQUIRED FIELD TESTS
  // ========================================

  describe('Required Field', () => {
    test('should mark input as required', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    test('should show asterisk on label when required', () => {
      render(<Input label="Email" required />);
      const label = screen.getByText('Email');
      expect(label.className).toContain("after:content-['*']");
    });
  });

  // ========================================
  // FULL WIDTH TESTS
  // ========================================

  describe('Full Width', () => {
    test('should render full width', () => {
      const { container } = render(<Input fullWidth />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    test('should not be full width by default', () => {
      const { container } = render(<Input />);
      const inputContainer = container.firstChild as HTMLElement;
      expect(inputContainer.className).not.toContain('w-full');
    });
  });

  // ========================================
  // INTERACTION TESTS
  // ========================================

  describe('Interactions', () => {
    test('should call onChange when value changes', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'hello');

      expect(onChange).toHaveBeenCalled();
    });

    test('should update value', async () => {
      const user = userEvent.setup();

      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await user.type(input, 'test value');

      expect(input.value).toBe('test value');
    });

    test('should not call onChange when disabled', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={onChange} disabled />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'hello');

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // ACCESSIBILITY TESTS
  // ========================================

  describe('Accessibility', () => {
    test('should have proper label association', () => {
      render(<Input label="Username" />);
      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      expect(label.getAttribute('for')).toBe(input.id);
    });

    test('should have aria-describedby when hint is present', () => {
      render(<Input hint="Helper text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby');
    });

    test('should have aria-invalid when error is present', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('should link both error and hint to input', () => {
      render(<Input hint="Hint" error="Error" />);
      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('error');
    });
  });

  // ========================================
  // CUSTOM STYLING TESTS
  // ========================================

  describe('Custom Styling', () => {
    test('should accept custom className for input', () => {
      render(<Input className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-input');
    });

    test('should accept custom className for container', () => {
      const { container } = render(<Input containerClassName="custom-container" />);
      const inputContainer = container.firstChild as HTMLElement;
      expect(inputContainer.className).toContain('custom-container');
    });

    test('should merge custom className with defaults', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-class');
      expect(input.className).toContain('rounded-lg');
    });
  });

  // ========================================
  // COMBINATION TESTS
  // ========================================

  describe('Combinations', () => {
    test('should handle all props together', () => {
      const onChange = vi.fn();
      render(
        <Input
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          size="lg"
          state="error"
          error="Invalid email format"
          hint="We'll never share your email"
          leftIcon={<span data-testid="icon">📧</span>}
          required
          fullWidth
          onChange={onChange}
          className="custom-class"
        />
      );

      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email Address');
      const error = screen.getByText('Invalid email format');
      const icon = screen.getByTestId('icon');

      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('placeholder', 'your@email.com');
      expect(input.className).toContain('h-12');
      expect(input.className).toContain('border-red-500');
      expect(input.className).toContain('custom-class');
      expect(input).toBeRequired();
      expect(label).toBeInTheDocument();
      expect(error).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
    });
  });
});
