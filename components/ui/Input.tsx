/**
 * Input Component
 * Standardized form input with states and validation
 */

'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/constants/design-tokens';

// ========================================
// TYPES
// ========================================

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'error' | 'success';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Size of the input
   * @default 'md'
   */
  size?: InputSize;

  /**
   * Visual state of the input
   * @default 'default'
   */
  state?: InputState;

  /**
   * Label text
   */
  label?: string;

  /**
   * Error message (sets state to 'error')
   */
  error?: string;

  /**
   * Hint/help text
   */
  hint?: string;

  /**
   * Icon to display at the start of input
   */
  leftIcon?: ReactNode;

  /**
   * Icon to display at the end of input
   */
  rightIcon?: ReactNode;

  /**
   * Make the input full width
   */
  fullWidth?: boolean;

  /**
   * Custom className for the input element
   */
  className?: string;

  /**
   * Custom className for the container
   */
  containerClassName?: string;
}

// ========================================
// COMPONENT
// ========================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      state = 'default',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      required = false,
      className,
      containerClassName,
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
    // If error is provided, set state to error
    const inputState = error ? 'error' : state;

    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    // ========================================
    // STYLES
    // ========================================

    // Container styles
    const containerStyles = cn(
      'flex flex-col gap-1.5',
      fullWidth && 'w-full',
      containerClassName
    );

    // Label styles
    const labelStyles = cn(
      'text-sm font-medium text-gray-700',
      disabled && 'opacity-50',
      required && "after:content-['*'] after:ml-0.5 after:text-red-500"
    );

    // Input wrapper styles (for icons)
    const wrapperStyles = cn(
      'relative flex items-center',
      fullWidth && 'w-full'
    );

    // Base input styles
    const baseInputStyles = [
      'w-full',
      'rounded-lg',
      'border-2',
      'transition-all duration-200',
      'focus:outline-none focus:ring-4 focus:ring-offset-0',
      'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
      'placeholder:text-gray-400',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
    ];

    // Size-specific styles
    const sizeStyles: Record<InputSize, string[]> = {
      sm: ['px-3 py-1.5', 'text-sm', 'h-8'],
      md: ['px-4 py-2.5', 'text-base', 'h-10'],
      lg: ['px-5 py-3', 'text-lg', 'h-12'],
    };

    // State-specific styles
    const stateStyles: Record<InputState, string[]> = {
      default: [
        'border-gray-300',
        'focus:border-celo focus:ring-yellow-200',
        'hover:border-gray-400',
      ],
      error: [
        'border-red-500',
        'focus:border-red-500 focus:ring-red-200',
        'hover:border-red-600',
      ],
      success: [
        'border-green-500',
        'focus:border-green-500 focus:ring-green-200',
        'hover:border-green-600',
      ],
    };

    // Combine input styles
    const inputStyles = cn(
      baseInputStyles,
      sizeStyles[size],
      stateStyles[inputState],
      className
    );

    // Icon styles
    const iconContainerStyles = 'absolute flex items-center pointer-events-none';
    const leftIconStyles = cn(iconContainerStyles, 'left-3');
    const rightIconStyles = cn(iconContainerStyles, 'right-3');

    // Helper text styles
    const helperTextStyles = (type: 'error' | 'hint') => cn(
      'text-xs',
      type === 'error' ? 'text-red-600' : 'text-gray-500'
    );

    // ========================================
    // RENDER
    // ========================================

    return (
      <div className={containerStyles}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
          </label>
        )}

        {/* Input wrapper (for icons) */}
        <div className={wrapperStyles}>
          {/* Left Icon */}
          {leftIcon && (
            <span className={leftIconStyles} aria-hidden="true">
              {leftIcon}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            className={inputStyles}
            aria-invalid={inputState === 'error'}
            aria-describedby={cn(
              error && errorId,
              hint && hintId
            )}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <span className={rightIconStyles} aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <span
            id={errorId}
            className={helperTextStyles('error')}
            role="alert"
            aria-live="polite"
          >
            {error}
          </span>
        )}

        {/* Hint Text */}
        {hint && !error && (
          <span id={hintId} className={helperTextStyles('hint')}>
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ========================================
// EXPORT
// ========================================

export default Input;
