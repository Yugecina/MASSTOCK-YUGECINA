import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../../../components/ui/Spinner';

describe('Spinner (TypeScript)', () => {
  it('should render spinner element', () => {
    render(<Spinner />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should have spinner class', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should have correct size styles', () => {
    const { container } = render(<Spinner size="md" />);
    const spinner = container.querySelector('[style*="24px"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should apply small size', () => {
    const { container } = render(<Spinner size="sm" />);
    const spinner = container.querySelector('.spinner') as HTMLElement;
    expect(spinner.style.width).toBe('16px');
    expect(spinner.style.height).toBe('16px');
  });

  it('should apply large size', () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.querySelector('.spinner') as HTMLElement;
    expect(spinner.style.width).toBe('32px');
    expect(spinner.style.height).toBe('32px');
  });

  it('should have default size md', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.spinner') as HTMLElement;
    expect(spinner.style.width).toBe('24px');
    expect(spinner.style.height).toBe('24px');
  });

  it('should apply custom className', () => {
    render(<Spinner className="custom-spinner" />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('spinner', 'custom-spinner');
  });

  it('should have aria-busy attribute', () => {
    render(<Spinner />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveAttribute('aria-busy', 'true');
  });

  it('should have aria-label', () => {
    render(<Spinner />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('should support custom data attributes', () => {
    render(<Spinner data-testid="custom-spinner" />);
    expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
  });

  it('should have inline display property', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.spinner') as HTMLElement;
    expect(spinner.style.display).toBe('inline-block');
  });

  it('should have animation property', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.spinner') as HTMLElement;
    expect(spinner.style.animation).toBe('spin 1s linear infinite');
  });

  it('should support all size variants', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      const { container } = render(<Spinner size={size} />);
      const spinner = container.querySelector('.spinner') as HTMLElement;
      expect(spinner).toBeInTheDocument();
    });
  });
});
