/**
 * Skeleton Component
 * Loading placeholder with pulse animation
 */

'use client';

import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { useShouldAnimate } from '@/lib/utils/motion';
import { skeletonPulseVariants } from '@/lib/utils/motion';
import { cn } from '@/lib/utils';

// ========================================
// TYPES
// ========================================

export interface SkeletonProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
> {
  /**
   * Width of the skeleton (CSS value)
   */
  width?: string | number;

  /**
   * Height of the skeleton (CSS value)
   */
  height?: string | number;

  /**
   * Make the skeleton circular
   */
  circle?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Disable animation
   */
  disableAnimation?: boolean;
}

// ========================================
// COMPONENT
// ========================================

export function Skeleton({
  width,
  height,
  circle = false,
  className,
  disableAnimation = false,
  style,
  ...props
}: SkeletonProps) {
  const shouldAnimate = useShouldAnimate() && !disableAnimation;

  // ========================================
  // STYLES
  // ========================================

  const baseStyles = [
    'bg-gray-300',
    circle ? 'rounded-full' : 'rounded-lg',
  ];

  const skeletonClasses = cn(baseStyles, className);

  const skeletonStyle = {
    width: width || '100%',
    height: height || '1rem',
    ...style,
  };

  // ========================================
  // RENDER
  // ========================================

  if (shouldAnimate) {
    return (
      <motion.div
        className={skeletonClasses}
        style={skeletonStyle}
        variants={skeletonPulseVariants}
        initial="initial"
        animate="animate"
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading..."
        {...props}
      />
    );
  }

  return (
    <div
      className={skeletonClasses}
      style={skeletonStyle}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading..."
      {...props}
    />
  );
}

// ========================================
// PRESET SKELETONS
// ========================================

/**
 * Skeleton for text lines
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for avatar
 */
export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      circle
      width={size}
      height={size}
      className={className}
    />
  );
}

/**
 * Skeleton for button
 */
export function SkeletonButton({
  width = 100,
  height = 40,
  className,
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      className={cn('rounded-xl', className)}
    />
  );
}

// ========================================
// EXPORT
// ========================================

export default Skeleton;
