/**
 * Badge Component
 * Status indicators, labels, and tags
 */

'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ========================================
// TYPES
// ========================================

export type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'celo';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {
  /**
   * Visual variant of the badge
   * @default 'default'
   */
  variant?: BadgeVariant;

  /**
   * Size of the badge
   * @default 'md'
   */
  size?: BadgeSize;

  /**
   * Icon to display before children
   */
  icon?: ReactNode;

  /**
   * Show status dot instead of icon
   */
  dot?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Content of the badge
   */
  children: ReactNode;
}

// ========================================
// COMPONENT
// ========================================

export function Badge({
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  // ========================================
  // STYLES
  // ========================================

  // Base styles
  const baseStyles = [
    'inline-flex items-center gap-1.5',
    'font-semibold',
    'rounded-full',
    'border',
    'whitespace-nowrap',
  ];

  // Variant-specific styles
  const variantStyles: Record<BadgeVariant, string[]> = {
    default: [
      'bg-gray-100 text-gray-800 border-gray-300',
    ],
    success: [
      'bg-green-100 text-green-800 border-green-300',
    ],
    error: [
      'bg-red-100 text-red-800 border-red-300',
    ],
    warning: [
      'bg-orange-100 text-orange-800 border-orange-300',
    ],
    info: [
      'bg-blue-100 text-blue-800 border-blue-300',
    ],
    celo: [
      'bg-yellow-100 text-gray-900 border-celo',
    ],
  };

  // Size-specific styles
  const sizeStyles: Record<BadgeSize, string[]> = {
    sm: ['px-2 py-0.5', 'text-xs', 'h-5'],
    md: ['px-2.5 py-1', 'text-sm', 'h-6'],
    lg: ['px-3 py-1.5', 'text-base', 'h-7'],
  };

  // Dot styles
  const dotSizeStyles: Record<BadgeSize, string> = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const dotVariantStyles: Record<BadgeVariant, string> = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-orange-500',
    info: 'bg-blue-500',
    celo: 'bg-celo',
  };

  // Combine styles
  const badgeClasses = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  const dotClasses = cn(
    'rounded-full',
    dotSizeStyles[size],
    dotVariantStyles[variant]
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <span className={badgeClasses} {...props}>
      {/* Dot or Icon */}
      {dot && <span className={dotClasses} aria-hidden="true" />}
      {!dot && icon && <span aria-hidden="true">{icon}</span>}

      {/* Content */}
      {children}
    </span>
  );
}

// ========================================
// EXPORT
// ========================================

export default Badge;
