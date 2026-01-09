/**
 * Toast Component - Elegant notifications for user feedback
 * Supports badge unlocks, game results, and general notifications
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ========================================
// TYPES
// ========================================

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'badge';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  icon?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  showBadgeToast: (badgeName: string, badgeIcon: string, points: number) => void;
}

// ========================================
// CONTEXT
// ========================================

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// ========================================
// PROVIDER
// ========================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  const showBadgeToast = useCallback((badgeName: string, badgeIcon: string, points: number) => {
    addToast({
      type: 'badge',
      title: 'Badge Unlocked!',
      description: `${badgeIcon} ${badgeName} (+${points} points)`,
      icon: '🎉',
      duration: 6000,
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showBadgeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ========================================
// TOAST CONTAINER
// ========================================

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:bottom-6 sm:right-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ========================================
// TOAST ITEM
// ========================================

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const interval = 50; // Update every 50ms
    const decrement = (interval / toast.duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'badge':
        return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'badge':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getIcon = () => {
    if (toast.icon) return toast.icon;

    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'badge':
        return '🎉';
      default:
        return 'ℹ';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border-2 shadow-lg backdrop-blur-sm',
        getToastStyles()
      )}
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/30">
          <motion.div
            className={cn('h-full', getProgressColor())}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl leading-none">
          {getIcon()}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight mb-1">
            {toast.title}
          </h3>
          {toast.description && (
            <p className="text-sm opacity-90 leading-snug">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.action!.onClick();
                onClose();
              }}
              className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20"
          aria-label="Close notification"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Convenience functions for common toast types
 */
export const toast = {
  success: (title: string, description?: string) => {
    // This will be called via useToast hook
    return { type: 'success' as ToastType, title, description };
  },
  error: (title: string, description?: string) => {
    return { type: 'error' as ToastType, title, description };
  },
  info: (title: string, description?: string) => {
    return { type: 'info' as ToastType, title, description };
  },
  warning: (title: string, description?: string) => {
    return { type: 'warning' as ToastType, title, description };
  },
  badge: (badgeName: string, badgeIcon: string, points: number) => {
    return {
      type: 'badge' as ToastType,
      title: 'Badge Unlocked!',
      description: `${badgeIcon} ${badgeName} (+${points} points)`,
      icon: '🎉',
    };
  },
};
