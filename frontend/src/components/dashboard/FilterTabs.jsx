/**
 * FilterTabs Component
 * Horizontal category filter tabs
 *
 * @param {Object} props
 * @param {Array} props.tabs - Array of tab objects with { id, label, count }
 * @param {string} props.activeTab - Currently active tab id
 * @param {Function} props.onTabChange - Callback when tab changes
 * @param {string} props.className - Additional CSS classes
 */
export function FilterTabs({ tabs = [], activeTab, onTabChange, className = '' }) {
  if (tabs.length === 0) {
    tabs = getDefaultTabs()
  }

  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={`
              px-6 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all
              ${
                isActive
                  ? 'bg-primary-main text-white shadow-sm'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-white/20' : 'bg-neutral-100'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Get default tabs for demo
 */
function getDefaultTabs() {
  return [
    { id: 'all', label: 'All Assets', count: 42 },
    { id: 'stocks', label: 'Stocks', count: 18 },
    { id: 'crypto', label: 'Crypto', count: 12 },
    { id: 'bonds', label: 'Bonds', count: 8 },
    { id: 'real-estate', label: 'Real Estate', count: 4 },
  ]
}
