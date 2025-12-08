import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../../../components/ui/Modal';

describe('Modal (TypeScript)', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('My Modal')).toBeInTheDocument();
  });

  it('should not render title when not provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should call onClose when backdrop is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );

    // Find and click the backdrop (the first div with fixed positioning)
    const backdrop = container.querySelector('[role="presentation"]') as HTMLElement;
    await user.click(backdrop);
    expect(handleClose).toHaveBeenCalled();
  });

  it('should prevent body scroll when open', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('unset');

    rerender(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('unset');
  });

  it('should have role="dialog" attribute', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
  });

  it('should have aria-modal="true" attribute', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Content</p>
      </Modal>
    );

    const dialog = container.querySelector('[aria-modal="true"]');
    expect(dialog).toBeInTheDocument();
  });

  it('should support complex children', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Form Modal">
        <input type="text" placeholder="Enter name" />
        <button>Submit</button>
      </Modal>
    );

    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});
