import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../../components/ui/Badge';

describe('Badge (TypeScript)', () => {
  it('should render badge with text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should have badge class', () => {
    const { container } = render(<Badge>Status</Badge>);
    const badge = container.querySelector('.badge');
    expect(badge).toBeInTheDocument();
  });

  it('should apply variant class', () => {
    const { container } = render(<Badge variant="success">Active</Badge>);
    const badge = container.querySelector('.badge-success');
    expect(badge).toBeInTheDocument();
  });

  it('should have default variant neutral', () => {
    const { container } = render(<Badge>Tag</Badge>);
    const badge = container.querySelector('.badge-neutral');
    expect(badge).toBeInTheDocument();
  });

  it('should support all variants', () => {
    const variants = ['success', 'warning', 'danger', 'neutral'] as const;

    variants.forEach((variant) => {
      const { container } = render(<Badge variant={variant}>Badge</Badge>);
      expect(container.querySelector(`.badge-${variant}`)).toBeInTheDocument();
    });
  });

  it('should support custom className via spread props', () => {
    const { container } = render(
      <Badge data-testid="test-badge">Badge</Badge>
    );
    expect(container.querySelector('[data-testid="test-badge"]')).toBeInTheDocument();
  });

  it('should render as span element', () => {
    const { container } = render(<Badge>Tag</Badge>);
    const span = container.querySelector('span.badge');
    expect(span).toBeInTheDocument();
  });
});
