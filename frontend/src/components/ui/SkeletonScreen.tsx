import React from 'react';

type SkeletonVariant = 'rect' | 'circle' | 'text';
type SkeletonWidth = 'full' | 'half' | 'quarter' | '3/4' | string;
type SkeletonSize = 'sm' | 'md' | 'lg';

interface SkeletonProps {
  width?: SkeletonWidth;
  height?: string;
  variant?: SkeletonVariant;
  className?: string;
}

/**
 * Skeleton Screen Components
 *
 * Loading placeholders that mimic the structure of actual content.
 * Uses pulse animation from global.css.
 *
 * Best practices:
 * - Show after 200ms delay to avoid flash for fast loads
 * - Match the layout of the actual content
 * - Use appropriate sizes and spacing
 */

/**
 * Base Skeleton component
 *
 * @param {SkeletonWidth} width - Width (e.g., '100%', '200px', 'full', 'half')
 * @param {string} height - Height (e.g., '16px', '20px', '200px')
 * @param {SkeletonVariant} variant - Shape variant: 'rect' | 'circle' | 'text'
 * @param {string} className - Additional CSS classes
 */
export function Skeleton({
  width = '100%',
  height = '16px',
  variant = 'rect',
  className = '',
}: SkeletonProps) {
  const widthMap: Record<string, string> = {
    full: '100%',
    half: '50%',
    quarter: '25%',
    '3/4': '75%',
  }

  const resolvedWidth = widthMap[width] || width

  const baseStyle: React.CSSProperties = {
    width: resolvedWidth,
    height: height,
    backgroundColor: 'var(--neutral-200)',
    borderRadius: variant === 'circle' ? '50%' : variant === 'text' ? '4px' : '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return <div className={`skeleton ${className}`} style={baseStyle} />
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/**
 * Skeleton Text Line
 */
export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => {
        // Last line is shorter for natural look
        const width = index === lines - 1 ? '70%' : '100%'
        return <Skeleton key={index} width={width} height="16px" variant="text" />
      })}
    </div>
  )
}

interface SkeletonCardProps {
  compact?: boolean;
  className?: string;
}

/**
 * Skeleton for Card component
 */
export function SkeletonCard({ compact = false, className = '' }: SkeletonCardProps) {
  const padding = compact ? 'var(--spacing-md)' : 'var(--spacing-lg)'

  return (
    <div
      className={`card ${className}`}
      style={{
        padding: padding,
        border: '1px solid var(--neutral-200)',
        backgroundColor: 'white',
      }}
    >
      {/* Title */}
      <Skeleton width="60%" height="24px" className="mb-4" />

      {/* Description lines */}
      <SkeletonText lines={2} className="mb-6" />

      {/* Footer with badge and button */}
      <div className="flex items-center justify-between">
        <Skeleton width="80px" height="24px" variant="rect" />
        <Skeleton width="100px" height="32px" variant="rect" />
      </div>
    </div>
  )
}

interface SkeletonBentoGridProps {
  columns?: number;
  count?: number;
  className?: string;
}

/**
 * Skeleton for Bento Grid of cards
 */
export function SkeletonBentoGrid({ columns = 4, count = 8, className = '' }: SkeletonBentoGridProps) {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: 'var(--spacing-md)',
  }

  return (
    <div style={gridStyle} className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}

interface SkeletonTableRowProps {
  columns?: number;
}

/**
 * Skeleton for Table Row
 */
export function SkeletonTableRow({ columns = 5 }: SkeletonTableRowProps) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} style={{ padding: 'var(--spacing-md)' }}>
          <Skeleton width="100%" height="16px" />
        </td>
      ))}
    </tr>
  )
}

interface SkeletonTableProps {
  columns?: number;
  rows?: number;
  className?: string;
}

/**
 * Skeleton for complete Table
 */
export function SkeletonTable({ columns = 5, rows = 5, className = '' }: SkeletonTableProps) {
  return (
    <div className={`card ${className}`}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>
                <Skeleton width="80%" height="16px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonTableRow key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface SkeletonStatsCardProps {
  className?: string;
}

/**
 * Skeleton for Dashboard Stats Card
 */
export function SkeletonStatsCard({ className = '' }: SkeletonStatsCardProps) {
  return (
    <div className={`card ${className}`} style={{ padding: 'var(--spacing-lg)' }}>
      {/* Label */}
      <Skeleton width="50%" height="14px" className="mb-3" />

      {/* Large number */}
      <Skeleton width="70%" height="36px" className="mb-2" />

      {/* Trend indicator */}
      <Skeleton width="40%" height="12px" />
    </div>
  )
}

interface SkeletonButtonProps {
  size?: SkeletonSize;
  className?: string;
}

/**
 * Skeleton for Button
 */
export function SkeletonButton({ size = 'md', className = '' }: SkeletonButtonProps) {
  const heights: Record<SkeletonSize, string> = {
    sm: '32px',
    md: '40px',
    lg: '48px',
  }

  return (
    <Skeleton
      width="120px"
      height={heights[size] || heights.md}
      variant="rect"
      className={className}
    />
  )
}

interface SkeletonAvatarProps {
  size?: number;
  className?: string;
}

/**
 * Skeleton for Avatar
 */
export function SkeletonAvatar({ size = 48, className = '' }: SkeletonAvatarProps) {
  return (
    <Skeleton
      width={`${size}px`}
      height={`${size}px`}
      variant="circle"
      className={className}
    />
  )
}

interface SkeletonUserProfileProps {
  className?: string;
}

/**
 * Skeleton for User Profile (Avatar + Text)
 */
export function SkeletonUserProfile({ className = '' }: SkeletonUserProfileProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SkeletonAvatar size={48} />
      <div className="flex-1">
        <Skeleton width="120px" height="16px" className="mb-2" />
        <Skeleton width="180px" height="14px" />
      </div>
    </div>
  )
}

/**
 * Skeleton for complete Dashboard Page
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Hero Stats - 4 cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--spacing-md)',
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatsCard key={index} />
        ))}
      </div>

      {/* Recent workflows section */}
      <div>
        <Skeleton width="200px" height="24px" className="mb-6" />
        <SkeletonBentoGrid columns={3} count={6} />
      </div>
    </div>
  )
}

/**
 * Skeleton for Workflow Detail Page
 */
export function SkeletonWorkflowDetail() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton width="300px" height="36px" className="mb-3" />
        <SkeletonText lines={2} />
      </div>

      {/* Metadata cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-md)',
        }}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} compact />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <SkeletonButton size="lg" />
        <SkeletonButton size="lg" />
      </div>
    </div>
  )
}

interface SkeletonWithDelayProps {
  delay?: number;
  children: React.ReactNode;
}

/**
 * Loading delay wrapper
 * Shows skeleton after delay to prevent flash
 *
 * @param {number} delay - Delay in ms before showing skeleton (default: 200)
 * @param {React.ReactNode} children - Skeleton component to show
 */
export function SkeletonWithDelay({ delay = 200, children }: SkeletonWithDelayProps) {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return show ? <>{children}</> : null
}

/**
 * Skeleton for single Execution item
 */
export function SkeletonExecutionItem() {
  return (
    <div
      className="card"
      style={{
        padding: 'var(--spacing-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
      }}
    >
      <Skeleton width="40px" height="40px" variant="circle" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height="16px" className="mb-2" />
        <Skeleton width="40%" height="14px" />
      </div>
      <Skeleton width="80px" height="24px" />
      <Skeleton width="24px" height="24px" />
    </div>
  )
}

/**
 * Skeleton for Executions list page
 */
export function SkeletonExecutions() {
  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <Skeleton width="200px" height="32px" />
        <Skeleton width="120px" height="40px" />
      </div>

      {/* Stats pills */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width="80px" height="32px" />
        ))}
      </div>

      {/* Filtres */}
      <div
        className="card"
        style={{
          padding: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="150px" height="40px" />
          ))}
        </div>
      </div>

      {/* Liste */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonExecutionItem key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for Execution detail page
 */
export function SkeletonExecutionDetail() {
  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      {/* Header avec bouton retour */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <Skeleton width="40px" height="40px" />
        <Skeleton width="300px" height="32px" />
      </div>

      {/* Info cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} compact />
        ))}
      </div>

      {/* Paramètres */}
      <Skeleton width="150px" height="24px" className="mb-4" />
      <SkeletonCard />

      {/* Résultats */}
      <Skeleton
        width="150px"
        height="24px"
        className="mb-4"
        style={{ marginTop: 'var(--spacing-xl)' }}
      />
      <Skeleton width="100%" height="300px" />
    </div>
  )
}
