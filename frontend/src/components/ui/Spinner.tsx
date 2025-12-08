import { type HTMLAttributes, type CSSProperties } from 'react';

/**
 * Size variants for the Spinner component
 */
type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Spinner component
 */
interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Size of the spinner */
  size?: SpinnerSize;

  /** Additional CSS class names */
  className?: string;
}

/**
 * Spinner component for loading states
 *
 * A lightweight, accessible loading spinner with three size variants.
 * Uses CSS variables for theming support.
 *
 * @example
 * // Default spinner
 * <Spinner />
 *
 * @example
 * // Small spinner
 * <Spinner size="sm" />
 *
 * @example
 * // Large spinner with custom class
 * <Spinner size="lg" className="my-custom-class" />
 */
export function Spinner({
  size = 'md',
  className = '',
  ...props
}: SpinnerProps) {
  const sizes: Record<SpinnerSize, string> = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  const spinnerStyle: CSSProperties = {
    width: sizes[size],
    height: sizes[size],
    border: '2px solid var(--primary)',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div
      className={`spinner ${className}`}
      data-testid="loading-spinner"
      style={spinnerStyle}
      {...props}
      aria-busy="true"
      aria-label="Loading"
    />
  );
}
