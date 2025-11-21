/**
 * Empty State Component
 *
 * Displays a friendly message when there's no data to show.
 * Follows "Organic Factory" design system with centered layout.
 *
 * @param {string} icon - Emoji or icon to display
 * @param {string} title - Main title text
 * @param {string} description - Explanatory text
 * @param {JSX.Element} action - Optional CTA button
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg' (default: 'md')
 */
export function EmptyState({
  icon = '📭',
  title = 'No data yet',
  description = 'Get started by creating your first item',
  action = null,
  size = 'md',
  className = '',
}) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'text-4xl mb-3',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'text-6xl mb-4',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'text-8xl mb-6',
      title: 'text-2xl',
      description: 'text-lg',
    },
  }

  const sizes = sizeClasses[size]

  return (
    <div className={`empty-state text-center ${sizes.container} ${className}`}>
      {/* Icon */}
      <div className={`empty-state-icon ${sizes.icon}`} style={{ fontSize: sizes.icon.includes('4xl') ? '3rem' : sizes.icon.includes('6xl') ? '4rem' : '5rem' }}>
        {icon}
      </div>

      {/* Title */}
      <h3 className={`font-semibold mb-2 ${sizes.title}`} style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>

      {/* Description */}
      <p className={`mb-6 ${sizes.description}`} style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', marginBottom: '24px' }}>
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  )
}

/**
 * Empty State variants for common scenarios
 */

// No workflows
export function EmptyWorkflows({ onCreate }) {
  return (
    <EmptyState
      icon="⚙️"
      title="No workflows yet"
      description="Create your first workflow to start automating your content production"
      action={
        onCreate && (
          <button onClick={onCreate} className="btn btn-primary-lime">
            Create Workflow
          </button>
        )
      }
    />
  )
}

// No executions
export function EmptyExecutions() {
  return (
    <EmptyState
      icon="🚀"
      title="No executions yet"
      description="Run a workflow to see results here. Your execution history will appear once you start generating content."
      size="md"
    />
  )
}

// No requests
export function EmptyRequests() {
  return (
    <EmptyState
      icon="📋"
      title="No requests submitted"
      description="You haven't submitted any workflow requests yet. Start by executing a workflow."
      size="md"
    />
  )
}

// No search results
export function EmptySearchResults({ query, onClear }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={`We couldn't find any results for "${query}". Try adjusting your search terms.`}
      size="sm"
      action={
        onClear && (
          <button onClick={onClear} className="btn btn-secondary">
            Clear Search
          </button>
        )
      }
    />
  )
}

// Error state
export function EmptyError({ message = 'Something went wrong', onRetry }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Unable to load data"
      description={message}
      size="md"
      action={
        onRetry && (
          <button onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>
        )
      }
    />
  )
}
