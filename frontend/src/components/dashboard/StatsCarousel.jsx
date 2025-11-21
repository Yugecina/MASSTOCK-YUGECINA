import { useRef } from 'react'

/**
 * StatsCarousel Component
 * Horizontal scrolling carousel for displaying statistics
 *
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects with { label, value, icon, color }
 * @param {string} props.className - Additional CSS classes
 */
export function StatsCarousel({ stats = [], className = '' }) {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (stats.length === 0) {
    stats = getDefaultStats()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Scroll buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Scroll left"
      >
        ←
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Scroll right"
      >
        →
      </button>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-64 bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${stat.color || 'bg-primary-main'} text-white`}
              >
                {stat.icon || '📊'}
              </div>
              <div className="text-body-sm text-neutral-600 font-medium">{stat.label}</div>
            </div>
            <div className="text-3xl font-bold text-neutral-900">{stat.value}</div>
            {stat.subtitle && (
              <div className="text-xs text-neutral-500 mt-1">{stat.subtitle}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Get default stats for demo
 */
function getDefaultStats() {
  return [
    { label: 'Total Volume', value: '$2.4M', icon: '💰', color: 'bg-blue-500', subtitle: '+12% this week' },
    { label: 'Active Users', value: '1,234', icon: '👥', color: 'bg-green-500', subtitle: '+5% this week' },
    { label: 'Workflows', value: '42', icon: '⚡', color: 'bg-purple-500', subtitle: '8 new this week' },
    { label: 'Executions', value: '5.2K', icon: '🚀', color: 'bg-orange-500', subtitle: '+18% this week' },
    { label: 'Success Rate', value: '98.5%', icon: '✓', color: 'bg-emerald-500', subtitle: '+0.3% this week' },
    { label: 'Avg Response', value: '1.2s', icon: '⚡', color: 'bg-cyan-500', subtitle: '-0.1s this week' },
  ]
}
