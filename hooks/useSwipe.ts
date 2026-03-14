'use client';

import { useEffect, useRef } from 'react';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface UseSwipeOptions {
  onSwipe: (direction: SwipeDirection) => void;
  minDistance?: number;  // px required to register as swipe
  maxTime?: number;      // ms max for a swipe gesture
  enabled?: boolean;
}

/**
 * Attaches touch-swipe detection to a DOM element ref.
 * Returns the ref to attach to the element.
 */
export function useSwipe<T extends HTMLElement = HTMLDivElement>({
  onSwipe,
  minDistance = 40,
  maxTime = 500,
  enabled = true,
}: UseSwipeOptions) {
  const ref = useRef<T>(null);
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      const dt = Date.now() - touchStart.current.t;
      touchStart.current = null;

      if (dt > maxTime) return;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx < minDistance && absDy < minDistance) return;

      if (absDx > absDy) {
        onSwipe(dx > 0 ? 'right' : 'left');
      } else {
        onSwipe(dy > 0 ? 'down' : 'up');
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onSwipe, minDistance, maxTime]);

  return ref;
}
