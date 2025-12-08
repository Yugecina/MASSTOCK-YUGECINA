import { type HTMLAttributes, type ReactNode } from 'react';

/**
 * Badge variant options
 */
type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

/**
 * Props for the Badge component
 */
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge content */
  children: ReactNode;

  /** Badge variant/style */
  variant?: BadgeVariant;
}

/**
 * Badge component for status indicators and labels
 *
 * A lightweight component for displaying status badges, labels, and tags.
 * Supports multiple color variants for different semantic meanings.
 *
 * @example
 * // Success badge
 * <Badge variant="success">Active</Badge>
 *
 * @example
 * // Warning badge
 * <Badge variant="warning">Pending</Badge>
 *
 * @example
 * // Danger badge
 * <Badge variant="danger">Failed</Badge>
 */
export function Badge({
  children,
  variant = 'neutral',
  ...props
}: BadgeProps) {
  const className = `badge badge-${variant}`;

  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
}
