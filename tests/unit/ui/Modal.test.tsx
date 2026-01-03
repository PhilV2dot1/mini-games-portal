/**
 * Modal Component Tests
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock motion utilities
vi.mock('@/lib/utils/motion', () => ({
  useShouldAnimate: () => false,
  backdropVariants: {},
  modalVariants: {},
}));

describe('Modal Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a container for portal
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    // Reset body overflow
    document.body.style.overflow = '';
  });

  // ========================================
  // RENDERING TESTS
  // ========================================

  describe('Rendering', () => {
    test('should render when open', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Modal content
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('should not render when closed', () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          Modal content
        </Modal>
      );
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    test('should render title', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal Title">
          Content
        </Modal>
      );
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
    });

    test('should render description', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} description="Modal description">
          Content
        </Modal>
      );
      expect(screen.getByText('Modal description')).toBeInTheDocument();
    });

    test('should render close button by default', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    test('should hide close button when disabled', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
          Content
        </Modal>
      );
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });
  });

  // ========================================
  // SIZE TESTS
  // ========================================

  describe('Sizes', () => {
    test('should render small size', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} size="sm">
          Content
        </Modal>
      );
      const modal = container.querySelector('[role="dialog"]');
      expect(modal?.className).toContain('max-w-sm');
    });

    test('should render medium size (default)', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} size="md">
          Content
        </Modal>
      );
      const modal = container.querySelector('[role="dialog"]');
      expect(modal?.className).toContain('max-w-md');
    });

    test('should render large size', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} size="lg">
          Content
        </Modal>
      );
      const modal = container.querySelector('[role="dialog"]');
      expect(modal?.className).toContain('max-w-lg');
    });

    test('should render extra large size', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} size="xl">
          Content
        </Modal>
      );
      const modal = container.querySelector('[role="dialog"]');
      expect(modal?.className).toContain('max-w-xl');
    });
  });

  // ========================================
  // INTERACTION TESTS
  // ========================================

  describe('Interactions', () => {
    test('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={onClose}>
          Content
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('should call onClose when backdrop is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Modal isOpen={true} onClose={onClose}>
          Content
        </Modal>
      );

      const backdrop = container.querySelector('.bg-black\\/60');
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(onClose).toHaveBeenCalled();
    });

    test('should not close when backdrop clicked if disabled', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Modal isOpen={true} onClose={onClose} closeOnBackdropClick={false}>
          Content
        </Modal>
      );

      const backdrop = container.querySelector('.bg-black\\/60');
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(onClose).not.toHaveBeenCalled();
    });

    test('should call onClose when Escape key is pressed', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={onClose}>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('should not close when clicking modal content', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={onClose}>
          <div data-testid="modal-content">Content</div>
        </Modal>
      );

      const content = screen.getByTestId('modal-content');
      await user.click(content);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // BODY SCROLL LOCK TESTS
  // ========================================

  describe('Body Scroll Lock', () => {
    test('should lock body scroll when open', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    test('should unlock body scroll when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('');
    });

    test('should unlock body scroll on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  // ========================================
  // ACCESSIBILITY TESTS
  // ========================================

  describe('Accessibility', () => {
    test('should have dialog role', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    test('should have aria-modal', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    test('should have aria-labelledby when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal Title">
          Content
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();
      expect(document.getElementById(titleId!)).toHaveTextContent('Modal Title');
    });

    test('should have aria-describedby when description is provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} description="Modal description">
          Content
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      const descriptionId = dialog.getAttribute('aria-describedby');
      expect(descriptionId).toBeTruthy();
      expect(document.getElementById(descriptionId!)).toHaveTextContent('Modal description');
    });

    test('should have aria-label when provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} ariaLabel="Custom modal">
          Content
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Custom modal');
    });

    test('should have aria-hidden on backdrop SVG', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      const closeIcon = screen.getByLabelText('Close modal').querySelector('svg');
      expect(closeIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // ========================================
  // SUB-COMPONENT TESTS
  // ========================================

  describe('Sub-Components', () => {
    test('should render ModalHeader', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <ModalHeader>Header content</ModalHeader>
        </Modal>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    test('should render ModalBody', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <ModalBody>Body content</ModalBody>
        </Modal>
      );
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    test('should render ModalFooter', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <ModalFooter>Footer content</ModalFooter>
        </Modal>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    test('should render all sub-components together', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <ModalHeader>Header</ModalHeader>
          <ModalBody>Body</ModalBody>
          <ModalFooter>Footer</ModalFooter>
        </Modal>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    test('ModalFooter should have flexbox layout', () => {
      const { container } = render(<ModalFooter>Content</ModalFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toContain('flex');
      expect(footer.className).toContain('justify-end');
    });
  });

  // ========================================
  // CUSTOM STYLING TESTS
  // ========================================

  describe('Custom Styling', () => {
    test('should accept custom className', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} className="custom-modal">
          Content
        </Modal>
      );

      const modal = container.querySelector('[role="dialog"]');
      expect(modal?.className).toContain('custom-modal');
    });

    test('should merge custom className with defaults', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} className="custom-class">
          Content
        </Modal>
      );

      const modal = container.querySelector('[role="dialog"]');
      expect(modal?.className).toContain('custom-class');
      expect(modal?.className).toContain('rounded-2xl');
    });
  });

  // ========================================
  // PORTAL RENDERING TESTS
  // ========================================

  describe('Portal Rendering', () => {
    test('should render modal in document.body', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Portal content
        </Modal>
      );

      // Modal should be in body, not in the container where we rendered it
      const modalInBody = document.body.querySelector('[role="dialog"]');
      expect(modalInBody).toBeInTheDocument();
    });

    test('should not render anything when SSR', () => {
      // Temporarily remove window to simulate SSR
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const { container } = render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      expect(container.innerHTML).toBe('');

      // Restore window
      global.window = originalWindow;
    });
  });

  // ========================================
  // COMBINATION TESTS
  // ========================================

  describe('Combinations', () => {
    test('should handle all props together', () => {
      const onClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          title="Complete Modal"
          description="With all features"
          size="lg"
          showCloseButton={true}
          closeOnBackdropClick={true}
          ariaLabel="Test modal"
          className="extra-class"
        >
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(screen.getByText('Complete Modal')).toBeInTheDocument();
      expect(screen.getByText('With all features')).toBeInTheDocument();
      expect(dialog.className).toContain('max-w-lg');
      expect(dialog.className).toContain('extra-class');
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });
});
