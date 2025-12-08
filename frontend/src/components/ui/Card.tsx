import { type HTMLAttributes, type ReactNode } from 'react';

/**
 * Props for the Card component
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card content */
  children: ReactNode;

  /** Additional CSS class names */
  className?: string;
}

/**
 * Card component for content containers
 *
 * A simple wrapper component that applies card styling through CSS classes.
 * Used throughout the application for consistent content containers.
 *
 * @example
 * // Basic card
 * <Card>
 *   <h2>Card Title</h2>
 *   <p>Card content</p>
 * </Card>
 *
 * @example
 * // Card with additional styling
 * <Card className="card-elevated">
 *   <h2>Special Card</h2>
 * </Card>
 */
export function Card({
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}
