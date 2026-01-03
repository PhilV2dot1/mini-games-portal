/**
 * Button Component
 * Standardized button with variants, sizes, and states
 */

'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useShouldAnimate } from '@/lib/utils/motion';
import { cn } from '@/lib/utils';
import { colors, shadows, buttonSizes, transitions } from '@/lib/constants/design-tokens';

// ========================================
// TYPES
// ========================================

export type ButtonVariant = 'primary' | 'secondary' | 'celo' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Size of the button
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Whether the button is in loading state
   * Shows spinner and disables interaction
   */
  loading?: boolean;

  /**
   * Whether the button should take full width of container
   */
  fullWidth?: boolean;

  /**
   * Disable animations (overrides reduced motion detection)
   */
  disableAnimation?: boolean;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Custom className for additional styling
   */
  className?: string;

  /**
   * Content of the button
   */
  children: React.ReactNode;

  /**
   * Icon to display before children
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display after children
   */
  rightIcon?: React.ReactNode;
}

// ========================================
// COMPONENT
// ========================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disableAnimation = false,
      disabled = false,
      ariaLabel,
      className,
      children,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const shouldAnimate = useShouldAnimate() && !disableAnimation;
    const isDisabled = disabled || loading;

    // ========================================
    // STYLES
    // ========================================

    // Base styles (shared across all variants)
    const baseStyles = [
      'inline-flex items-center justify-center',
      'font-semibold',
      'border-2',
      'rounded-xl',
      'transition-all',
      'focus:outline-none focus:ring-4 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      fullWidth && 'w-full',
    ];

    // Variant-specific styles
    const variantStyles: Record<ButtonVariant, string[]> = {
      primary: [
        'bg-gray-900 text-white border-gray-900',
        'hover:bg-gray-800 hover:border-gray-800',
        'focus:ring-gray-300',
        'shadow-md hover:shadow-lg',
      ],

      secondary: [
        'bg-white text-gray-900 border-gray-300',
        'hover:bg-gray-50 hover:border-gray-400',
        'focus:ring-gray-200',
        'shadow-sm hover:shadow-md',
      ],

      celo: [
        'text-gray-900 font-bold border-transparent',
        'hover:brightness-95',
        'focus:ring-yellow-200',
        'shadow-md hover:shadow-lg',
      ],

      ghost: [
        'bg-transparent text-gray-900 border-transparent',
        'hover:bg-gray-100',
        'focus:ring-gray-200',
      ],

      outline: [
        'bg-transparent text-gray-900 border-gray-300',
        'hover:bg-gray-50',
        'focus:ring-gray-200',
      ],

      danger: [
        'bg-red-500 text-white border-red-500',
        'hover:bg-red-600 hover:border-red-600',
        'focus:ring-red-200',
        'shadow-md hover:shadow-lg',
      ],
    };

    // Size-specific styles
    const sizeStyles: Record<ButtonSize, string[]> = {
      sm: ['px-4 py-2', 'text-sm', 'h-8'],
      md: ['px-6 py-3', 'text-base', 'h-10'],
      lg: ['px-8 py-4', 'text-lg', 'h-12'],
    };

    // Combine all styles
    const buttonClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    // Inline styles for Celo variant (gradient background)
    const inlineStyles = variant === 'celo'
      ? { backgroundColor: colors.celo }
      : undefined;

    // ========================================
    // ANIMATION
    // ========================================

    const motionProps: HTMLMotionProps<"button"> = shouldAnimate
      ? {
          whileHover: isDisabled ? undefined : { scale: 1.02, y: -2 },
          whileTap: isDisabled ? undefined : { scale: 0.98 },
          transition: { duration: 0.15 },
        }
      : {};

    // ========================================
    // LOADING SPINNER
    // ========================================

    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // ========================================
    // RENDER
    // ========================================

    const MotionButton = motion.button;

    return (
      <MotionButton
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={buttonClasses}
        style={inlineStyles}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...motionProps}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && <LoadingSpinner />}

        {/* Left Icon */}
        {!loading && leftIcon && (
          <span className="mr-2 flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Children */}
        {children}

        {/* Right Icon */}
        {!loading && rightIcon && (
          <span className="ml-2 flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </MotionButton>
    );
  }
);

Button.displayName = 'Button';

// ========================================
// EXPORT
// ========================================

export default Button;
