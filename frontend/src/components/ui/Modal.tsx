import { type ReactNode, useEffect } from 'react';

/**
 * Props for the Modal component
 */
interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Callback when modal is requested to close (backdrop click) */
  onClose: () => void;

  /** Optional modal title */
  title?: string;

  /** Modal content */
  children: ReactNode;
}

/**
 * Modal component for dialogs and overlays
 *
 * Features:
 * - Semi-transparent backdrop with click-to-close
 * - Centered modal with responsive sizing
 * - Optional title
 * - Prevents body scroll when open
 * - Accessible with semantic HTML
 *
 * @example
 * // Basic modal
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <p>Modal content</p>
 * </Modal>
 *
 * @example
 * // Modal with title
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 * >
 *   <p>Are you sure?</p>
 *   <button onClick={handleConfirm}>Confirm</button>
 * </Modal>
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render anything if modal is closed
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
        }}
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-xl)',
          maxWidth: '600px',
          width: '90%',
          zIndex: 50,
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <h2 id="modal-title" className="text-h2" style={{ marginBottom: 'var(--spacing-md)' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </>
  );
}
