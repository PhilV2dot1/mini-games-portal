/**
 * SkeletonCard Component
 * Loading placeholder for game cards
 */

'use client';

import { Card } from './Card';
import { Skeleton, SkeletonText, SkeletonButton } from './Skeleton';
import { cn } from '@/lib/utils';

// ========================================
// TYPES
// ========================================

export interface SkeletonCardProps {
  /**
   * Number of skeleton cards to render
   * @default 1
   */
  count?: number;

  /**
   * Custom className for each card
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

export function SkeletonCard({
  count = 1,
  className,
  disableAnimation = false,
}: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          variant="default"
          padding="lg"
          className={className}
          disableAnimation={disableAnimation}
        >
          {/* Icon/Image Skeleton */}
          <div className="flex justify-center mb-4">
            <Skeleton
              width={80}
              height={80}
              className="rounded-xl"
              disableAnimation={disableAnimation}
            />
          </div>

          {/* Title Skeleton */}
          <Skeleton
            width="70%"
            height="1.5rem"
            className="mx-auto mb-3"
            disableAnimation={disableAnimation}
          />

          {/* Description Skeleton */}
          <SkeletonText
            lines={2}
            className="mb-4"
          />

          {/* Stats Skeleton */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Skeleton height="2.5rem" disableAnimation={disableAnimation} />
            <Skeleton height="2.5rem" disableAnimation={disableAnimation} />
            <Skeleton height="2.5rem" disableAnimation={disableAnimation} />
          </div>

          {/* Button Skeleton */}
          <SkeletonButton
            width="100%"
            height="2.5rem"
            className={className}
            disableAnimation={disableAnimation}
          />
        </Card>
      ))}
    </>
  );
}

// ========================================
// COMPACT VARIANT
// ========================================

/**
 * Compact skeleton card for smaller displays
 */
export function SkeletonCardCompact({
  count = 1,
  className,
  disableAnimation = false,
}: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          variant="default"
          padding="md"
          className={cn('flex items-center gap-4', className)}
          disableAnimation={disableAnimation}
        >
          {/* Icon Skeleton */}
          <Skeleton
            width={48}
            height={48}
            className="rounded-lg flex-shrink-0"
            disableAnimation={disableAnimation}
          />

          {/* Content */}
          <div className="flex-1">
            <Skeleton
              width="60%"
              height="1rem"
              className="mb-2"
              disableAnimation={disableAnimation}
            />
            <Skeleton
              width="40%"
              height="0.75rem"
              disableAnimation={disableAnimation}
            />
          </div>

          {/* Button */}
          <SkeletonButton
            width={80}
            height="2rem"
            disableAnimation={disableAnimation}
          />
        </Card>
      ))}
    </>
  );
}

// ========================================
// GRID WRAPPER
// ========================================

/**
 * Grid of skeleton cards (matching game grid layout)
 */
export function SkeletonCardGrid({
  count = 6,
  className,
  disableAnimation = false,
}: SkeletonCardProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
      className
    )}>
      <SkeletonCard count={count} disableAnimation={disableAnimation} />
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

export default SkeletonCard;
