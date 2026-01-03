/**
 * Motion Utilities - Framer Motion Helpers
 * Provides utilities for handling reduced motion preferences and standardized animations
 */

'use client';

import { useState, useEffect } from 'react';
import type { Variants, Transition } from 'framer-motion';
import { animations, durations, easings } from '@/lib/constants/design-tokens';

// ========================================
// HOOKS
// ========================================

/**
 * Hook to detect user's reduced motion preference
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
    // Legacy browsers
    else {
      // @ts-ignore - legacy API
      mediaQuery.addListener(listener);
      // @ts-ignore - legacy API
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook that returns whether animations should be enabled
 * Considers both reduced motion preference and Farcaster context
 */
export function useShouldAnimate(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [isInFarcaster, setIsInFarcaster] = useState(false);

  useEffect(() => {
    // Check if running in Farcaster mini-app (disable animations for performance)
    if (typeof window !== 'undefined') {
      setIsInFarcaster(window.location.search.includes('farcaster'));
    }
  }, []);

  return !prefersReducedMotion && !isInFarcaster;
}

// ========================================
// ANIMATION HELPERS
// ========================================

/**
 * Get animation variants with reduced motion support
 * Returns empty variants if motion should be reduced
 */
export function getMotionProps(
  shouldAnimate: boolean,
  variants: Variants
): Variants {
  if (!shouldAnimate) {
    // Return static variants (no animation)
    return {
      initial: {},
      animate: {},
      exit: {},
    };
  }
  return variants;
}

/**
 * Get transition with reduced motion support
 * Returns instant transition if motion should be reduced
 */
export function getTransition(
  shouldAnimate: boolean,
  transition?: Transition
): Transition {
  if (!shouldAnimate) {
    return { duration: 0 };
  }
  return transition || { duration: durations.normal / 1000, ease: easings.easeOut };
}

// ========================================
// STANDARD VARIANTS
// ========================================

/**
 * Fade in/out animation
 */
export const fadeInVariants: Variants = animations.fadeIn;

/**
 * Slide up animation
 */
export const slideUpVariants: Variants = animations.slideUp;

/**
 * Slide down animation
 */
export const slideDownVariants: Variants = animations.slideDown;

/**
 * Slide left animation
 */
export const slideLeftVariants: Variants = animations.slideLeft;

/**
 * Slide right animation
 */
export const slideRightVariants: Variants = animations.slideRight;

/**
 * Scale in animation
 */
export const scaleInVariants: Variants = animations.scaleIn;

/**
 * Bounce in animation
 */
export const bounceInVariants: Variants = animations.bounceIn;

/**
 * Stagger container for children animations
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/**
 * Stagger item (to be used with stagger container)
 */
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal / 1000,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: durations.fast / 1000,
    },
  },
};

// ========================================
// GESTURE VARIANTS
// ========================================

/**
 * Hover scale effect
 */
export const hoverScaleVariant = {
  scale: 1.02,
  y: -4,
  transition: { duration: durations.fast / 1000 },
};

/**
 * Hover bounce effect
 */
export const hoverBounceVariant = {
  scale: 1.05,
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  },
};

/**
 * Tap scale effect
 */
export const tapScaleVariant = {
  scale: 0.95,
};

/**
 * Rotate on hover
 */
export const hoverRotateVariant = {
  rotate: 5,
  transition: { duration: durations.fast / 1000 },
};

// ========================================
// MODAL/OVERLAY VARIANTS
// ========================================

/**
 * Modal backdrop fade in
 */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Modal content slide up and fade in
 */
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.normal / 1000,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: durations.fast / 1000,
    },
  },
};

/**
 * Drawer slide in from side
 */
export const drawerVariants: Variants = {
  initial: { x: '100%' },
  animate: {
    x: 0,
    transition: {
      duration: durations.normal / 1000,
      ease: easings.easeOut,
    },
  },
  exit: {
    x: '100%',
    transition: {
      duration: durations.fast / 1000,
    },
  },
};

// ========================================
// GAME-SPECIFIC ANIMATIONS
// ========================================

/**
 * Card flip animation (for games like Blackjack)
 */
export const cardFlipVariants: Variants = {
  initial: { rotateY: 0 },
  animate: {
    rotateY: 180,
    transition: {
      duration: durations.slow / 1000,
      ease: easings.easeInOut,
    },
  },
};

/**
 * Tile spawn animation (for games like 2048)
 */
export const tileSpawnVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

/**
 * Tile merge animation
 */
export const tileMergeVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: durations.normal / 1000,
    },
  },
};

/**
 * Drop animation (for Connect Five pieces)
 */
export function getDropVariants(duration: number = 500): Variants {
  return {
    initial: { y: -100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 15,
        duration: duration / 1000,
      },
    },
  };
}

/**
 * Pulse animation (for notifications, badges)
 */
export const pulseVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: durations.slow / 1000,
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
};

/**
 * Shake animation (for errors)
 */
export const shakeVariants: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: durations.slow / 1000,
    },
  },
};

// ========================================
// LOADING ANIMATIONS
// ========================================

/**
 * Spinner rotation
 */
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Pulse for skeletons
 */
export const skeletonPulseVariants: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Create custom variants with reduced motion support
 */
export function createVariants(
  initial: object,
  animate: object,
  exit?: object
): Variants {
  return {
    initial,
    animate,
    exit: exit || initial,
  };
}

/**
 * Create spring transition
 */
export function createSpringTransition(
  stiffness: number = 300,
  damping: number = 20
): Transition {
  return {
    type: 'spring',
    stiffness,
    damping,
  };
}

/**
 * Create eased transition
 */
export function createEasedTransition(
  duration: number = durations.normal,
  easing: string = easings.easeOut
): Transition {
  return {
    duration: duration / 1000,
    ease: easing,
  };
}

/**
 * Combine multiple variants
 */
export function combineVariants(...variants: Variants[]): Variants {
  return variants.reduce((acc, variant) => ({
    initial: { ...acc.initial, ...variant.initial },
    animate: { ...acc.animate, ...variant.animate },
    exit: { ...acc.exit, ...variant.exit },
  }), { initial: {}, animate: {}, exit: {} });
}
