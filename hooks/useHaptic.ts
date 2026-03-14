'use client';

import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 30,
  medium: 60,
  heavy: 100,
  success: [40, 30, 80],
  error: [80, 60, 80],
  warning: [40, 40, 40],
};

/**
 * Provides haptic feedback via the Web Vibration API (mobile only).
 * Silently no-ops on desktop or unsupported browsers.
 */
export function useHaptic() {
  const vibrate = useCallback((pattern: HapticPattern = 'medium') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    navigator.vibrate(PATTERNS[pattern]);
  }, []);

  return { vibrate };
}
