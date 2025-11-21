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
 * @param {string} width - Width (e.g., '100%', '200px', 'full', 'half')
 * @param {string} height - Height (e.g., '16px', '20px', '200px')
 * @param {string} variant - Shape variant: 'rect' | 'circle' | 'text'
 * @param {string} className - Additional CSS classes
 */
export function Skeleton({
  width = '100%',
  height = '16px',
  variant = 'rect',
  className = '',
}) {
  const widthMap = {
    full: '100%',
    half: '50%',
    quarter: '25%',
    '3/4': '75%',
  }

  const resolvedWidth = widthMap[width] || width

  const baseStyle = {
    width: resolvedWidth,
    height: height,
    backgroundColor: 'var(--neutral-200)',
    borderRadius: variant === 'circle' ? '50%' : variant === 'text' ? '4px' : '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return <div className={`skeleton ${className}`} style={baseStyle} />
}

/**
 * Skeleton Text Line
 */
export function SkeletonText({ lines = 3, className = '' }) {
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

/**
 * Skeleton for Card component
 */
export function SkeletonCard({ compact = false, className = '' }) {
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

/**
 * Skeleton for Bento Grid of cards
 */
export function SkeletonBentoGrid({ columns = 4, count = 8, className = '' }) {
  const gridStyle = {
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

/**
 * Skeleton for Table Row
 */
export function SkeletonTableRow({ columns = 5 }) {
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

/**
 * Skeleton for complete Table
 */
export function SkeletonTable({ columns = 5, rows = 5, className = '' }) {
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

/**
 * Skeleton for Dashboard Stats Card
 */
export function SkeletonStatsCard({ className = '' }) {
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

/**
 * Skeleton for Button
 */
export function SkeletonButton({ size = 'md', className = '' }) {
  const heights = {
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

/**
 * Skeleton for Avatar
 */
export function SkeletonAvatar({ size = 48, className = '' }) {
  return (
    <Skeleton
      width={`${size}px`}
      height={`${size}px`}
      variant="circle"
      className={className}
    />
  )
}

/**
 * Skeleton for User Profile (Avatar + Text)
 */
export function SkeletonUserProfile({ className = '' }) {
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

/**
 * Loading delay wrapper
 * Shows skeleton after delay to prevent flash
 *
 * @param {number} delay - Delay in ms before showing skeleton (default: 200)
 * @param {JSX.Element} children - Skeleton component to show
 */
export function SkeletonWithDelay({ delay = 200, children }) {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return show ? children : null
}
