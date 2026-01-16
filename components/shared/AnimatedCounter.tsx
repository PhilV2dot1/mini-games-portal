'use client';

/**
 * Animated Counter Component
 * Smoothly animates number changes with optional prefix/suffix
 */

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useShouldAnimate } from '@/lib/utils/motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  className?: string;
  formatNumber?: boolean; // Add thousand separators
}

export function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className = '',
  formatNumber = true,
}: AnimatedCounterProps) {
  const shouldAnimate = useShouldAnimate();
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const [isChanging, setIsChanging] = useState(false);

  // Spring animation for the number
  const spring = useSpring(prevValue.current, {
    stiffness: 100,
    damping: 30,
    duration: duration / 1000,
  });

  // Transform spring value to integer
  const display = useTransform(spring, (latest) => Math.round(latest));

  useEffect(() => {
    if (shouldAnimate) {
      spring.set(value);
    } else {
      setDisplayValue(value);
    }
    prevValue.current = value;
  }, [value, shouldAnimate, spring]);

  // Subscribe to motion value changes
  useEffect(() => {
    if (!shouldAnimate) return;

    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return () => unsubscribe();
  }, [display, shouldAnimate]);

  // Scale animation on value change
  useEffect(() => {
    if (value !== prevValue.current) {
      setIsChanging(true);
      const timer = setTimeout(() => setIsChanging(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const formattedValue = formatNumber
    ? displayValue.toLocaleString()
    : displayValue.toString();

  if (!shouldAnimate) {
    return (
      <span className={className}>
        {prefix}
        {formattedValue}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      animate={isChanging ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </motion.span>
  );
}

/**
 * Simple animated number that counts up/down
 * Lighter alternative to AnimatedCounter
 */
export function CountUp({
  value,
  duration = 1000,
  className = '',
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const shouldAnimate = useShouldAnimate();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(value);
      return;
    }

    const startValue = displayValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, shouldAnimate]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
}
