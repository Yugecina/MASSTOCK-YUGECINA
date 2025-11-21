/**
 * ViewToggle Component
 * Toggle between grid and list view
 *
 * @param {Object} props
 * @param {string} props.view - Current view ('grid' or 'list')
 * @param {Function} props.onViewChange - Callback when view changes
 * @param {string} props.className - Additional CSS classes
 */
export function ViewToggle({ view = 'grid', onViewChange, className = '' }) {
  return (
    <div className={`inline-flex rounded-lg border border-neutral-200 bg-white p-1 ${className}`}>
      <button
        onClick={() => onViewChange?.('grid')}
        className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all
          ${
            view === 'grid'
              ? 'bg-primary-main text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }
        `}
        aria-label="Grid view"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          strokeWidth={2}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      </button>
      <button
        onClick={() => onViewChange?.('list')}
        className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all
          ${
            view === 'list'
              ? 'bg-primary-main text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }
        `}
        aria-label="List view"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          strokeWidth={2}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>
    </div>
  )
}
