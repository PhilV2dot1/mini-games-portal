/**
 * Card Component
 * Versatile container component with multiple variants
 */

'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useShouldAnimate } from '@/lib/utils/motion';
import { cn } from '@/lib/utils';
import { shadows } from '@/lib/constants/design-tokens';

// ========================================
// TYPES
// ========================================

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /**
   * Visual variant of the card
   * @default 'default'
   */
  variant?: CardVariant;

  /**
   * Padding inside the card
   * @default 'md'
   */
  padding?: CardPadding;

  /**
   * Enable hover effects (scale and shadow)
   */
  hover?: boolean;

  /**
   * Disable animations (overrides reduced motion detection)
   */
  disableAnimation?: boolean;

  /**
   * Custom className for additional styling
   */
  className?: string;

  /**
   * ARIA role
   */
  role?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Content of the card
   */
  children: React.ReactNode;

  /**
   * Click handler (makes card interactive)
   */
  onClick?: () => void;
}

// ========================================
// SUB-COMPONENTS
// ========================================

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-gray-200', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardBody.displayName = 'CardBody';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';

// ========================================
// MAIN COMPONENT
// ========================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      disableAnimation = false,
      className,
      role,
      ariaLabel,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const shouldAnimate = useShouldAnimate() && !disableAnimation;
    const isInteractive = !!onClick;

    // ========================================
    // STYLES
    // ========================================

    // Base styles
    const baseStyles = [
      'rounded-2xl',
      'transition-all duration-200',
      isInteractive && 'cursor-pointer',
    ];

    // Variant-specific styles
    const variantStyles: Record<CardVariant, string[]> = {
      default: [
        'bg-white',
        'border-2 border-gray-200',
        'shadow-md',
        hover && 'hover:shadow-lg',
      ],

      elevated: [
        'bg-white',
        'border-2 border-gray-300',
        'shadow-lg',
        hover && 'hover:shadow-xl',
      ],

      outlined: [
        'bg-white',
        'border-2 border-gray-300',
        hover && 'hover:border-gray-400',
      ],

      glass: [
        'bg-white/90',
        'backdrop-blur-lg',
        'border-2 border-gray-300',
        'shadow-md',
        hover && 'hover:shadow-lg hover:bg-white/95',
      ],
    };

    // Padding styles
    const paddingStyles: Record<CardPadding, string> = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    // Combine all styles
    const cardClasses = cn(
      baseStyles,
      variantStyles[variant],
      paddingStyles[padding],
      className
    );

    // ========================================
    // ANIMATION
    // ========================================

    const motionProps: HTMLMotionProps<"div"> = shouldAnimate && hover
      ? {
          whileHover: {
            scale: 1.02,
            y: -4,
            transition: { duration: 0.2 },
          },
        }
      : {};

    // ========================================
    // RENDER
    // ========================================

    const MotionDiv = motion.div;

    return (
      <MotionDiv
        ref={ref}
        className={cardClasses}
        role={role || (isInteractive ? 'button' : undefined)}
        aria-label={ariaLabel}
        onClick={onClick}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyPress={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        {...motionProps}
        {...props}
      >
        {children}
      </MotionDiv>
    );
  }
);

Card.displayName = 'Card';

// ========================================
// EXPORT
// ========================================

export default Card;
