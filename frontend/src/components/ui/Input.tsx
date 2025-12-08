import React, { type InputHTMLAttributes } from 'react';

/**
 * Props for the Input component
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;

  /** Error message displayed below the input */
  error?: string;

  /** Disabled state */
  disabled?: boolean;
}

/**
 * Input component with optional label and error display
 *
 * Features:
 * - Optional label above input
 * - Error state styling and message display
 * - Supports all standard HTML input attributes
 * - Accessible form control with semantic HTML
 *
 * @example
 * // Basic input
 * <Input type="text" placeholder="Enter text" />
 *
 * @example
 * // Input with label
 * <Input label="Email" type="email" placeholder="user@example.com" />
 *
 * @example
 * // Input with error
 * <Input
 *   label="Password"
 *   type="password"
 *   error="Password must be at least 8 characters"
 * />
 *
 * @example
 * // Disabled input
 * <Input label="Username" disabled value="john_doe" />
 */
export function Input({
  label,
  error,
  disabled = false,
  ...props
}: InputProps): React.ReactElement {
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={props.id} className="form-label">
          {label}
        </label>
      )}
      <input
        className={error ? 'input-error' : 'form-input'}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${props.id}-error`}
          className="text-error text-body-sm"
          style={{ marginTop: 'var(--spacing-sm)' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
