/**
 * Modal Component
 * Accessible modal dialog with backdrop and animations
 */

'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useShouldAnimate } from '@/lib/utils/motion';
import { backdropVariants, modalVariants } from '@/lib/utils/motion';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/constants/design-tokens';

// ========================================
// TYPES
// ========================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Modal title
   */
  title?: string;

  /**
   * Modal description (below title)
   */
  description?: string;

  /**
   * Modal content
   */
  children: ReactNode;

  /**
   * Size of the modal
   * @default 'md'
   */
  size?: ModalSize;

  /**
   * Show close button (X)
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Close modal when clicking backdrop
   * @default true
   */
  closeOnBackdropClick?: boolean;

  /**
   * Disable animations
   */
  disableAnimation?: boolean;

  /**
   * ARIA label
   */
  ariaLabel?: string;

  /**
   * Custom className for modal content
   */
  className?: string;
}

// ========================================
// COMPONENT
// ========================================

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  disableAnimation = false,
  ariaLabel,
  className,
}: ModalProps) {
  const shouldAnimate = useShouldAnimate() && !disableAnimation;
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // ========================================
  // EFFECTS
  // ========================================

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focus modal after a short delay
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';

      // Restore focus to previous element
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  // ========================================
  // STYLES
  // ========================================

  const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const modalClasses = cn(
    'relative',
    'bg-white/95 backdrop-blur-lg',
    'rounded-2xl',
    'p-6',
    'w-full',
    sizeStyles[size],
    'border-2 border-gray-700',
    className
  );

  // Celo glow shadow
  const celoShadow = `0 0 0 6px ${colors.celo}, 0 20px 25px -5px rgba(0, 0, 0, 0.1)`;

  // ========================================
  // RENDER
  // ========================================

  if (typeof window === 'undefined') return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={shouldAnimate ? backdropVariants : undefined}
            initial={shouldAnimate ? 'initial' : false}
            animate={shouldAnimate ? 'animate' : false}
            exit={shouldAnimate ? 'exit' : false}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className={modalClasses}
            style={{ boxShadow: celoShadow }}
            variants={shouldAnimate ? modalVariants : undefined}
            initial={shouldAnimate ? 'initial' : false}
            animate={shouldAnimate ? 'animate' : false}
            exit={shouldAnimate ? 'exit' : false}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
            aria-label={ariaLabel}
            tabIndex={-1}
          >
            {/* Close Button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* Title */}
            {title && (
              <h2
                id="modal-title"
                className="text-2xl font-black text-gray-900 mb-2 pr-8"
              >
                {title}
              </h2>
            )}

            {/* Description */}
            {description && (
              <p
                id="modal-description"
                className="text-sm text-gray-600 mb-4"
              >
                {description}
              </p>
            )}

            {/* Content */}
            <div className="mt-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

// ========================================
// SUB-COMPONENTS
// ========================================

export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('py-4', className)}>
      {children}
    </div>
  );
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('mt-6 flex gap-3 justify-end', className)}>
      {children}
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

export default Modal;
