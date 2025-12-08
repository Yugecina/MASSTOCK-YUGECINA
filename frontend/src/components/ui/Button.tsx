import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';

/**
 * Button variant options
 */
type ButtonVariant = 'primary' | 'secondary' | 'danger';

/**
 * Button size options
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Button component
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children: ReactNode;

  /** Button variant/style */
  variant?: ButtonVariant;

  /** Button size */
  size?: ButtonSize;

  /** Loading state - disables button and shows spinner */
  loading?: boolean;

  /** Disabled state */
  disabled?: boolean;
}

/**
 * Button component with multiple variants and sizes
 *
 * Features:
 * - Multiple variants (primary, secondary, danger)
 * - Multiple sizes (sm, md, lg)
 * - Loading state with built-in spinner
 * - Accessible button element
 *
 * @example
 * // Primary button
 * <Button onClick={handleClick}>Click Me</Button>
 *
 * @example
 * // Loading state
 * <Button loading={isLoading} onClick={handleSubmit}>
 *   Submit
 * </Button>
 *
 * @example
 * // Danger button, small size
 * <Button variant="danger" size="sm">
 *   Delete
 * </Button>
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  ...props
}: ButtonProps): React.ReactElement {
  const className = `btn btn-${variant} btn-${size}`;

  return (
    <button
      className={className}
      disabled={loading || disabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span
          className="spinner"
          data-testid="loading-spinner"
          style={{ width: '16px', height: '16px' }}
          aria-hidden="true"
        />
      ) : (
        children
      )}
    </button>
  );
}
