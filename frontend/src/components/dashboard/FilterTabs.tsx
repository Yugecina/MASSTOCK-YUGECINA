/**
 * Tab item interface
 */
interface Tab {
  id: string;
  label: string;
  count?: number;
}

/**
 * FilterTabs Props
 */
interface FilterTabsProps {
  /** Array of tab objects with { id, label, count } */
  tabs?: Tab[];
  /** Currently active tab id */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FilterTabs Component
 * Horizontal category filter tabs
 */
export function FilterTabs({
  tabs = [],
  activeTab,
  onTabChange,
  className = ''
}: FilterTabsProps) {
  const tabsToRender = tabs.length === 0 ? getDefaultTabs() : tabs;

  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide ${className}`}>
      {tabsToRender.map((tab) => {
        const isActive = activeTab === tab.id;
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
        );
      })}
    </div>
  );
}

/**
 * Get default tabs for demo
 */
function getDefaultTabs(): Tab[] {
  return [
    { id: 'all', label: 'All Assets', count: 42 },
    { id: 'stocks', label: 'Stocks', count: 18 },
    { id: 'crypto', label: 'Crypto', count: 12 },
    { id: 'bonds', label: 'Bonds', count: 8 },
    { id: 'real-estate', label: 'Real Estate', count: 4 },
  ];
}
