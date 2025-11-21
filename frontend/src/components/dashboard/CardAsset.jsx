import { Sparkline } from './Sparkline'

/**
 * CardAsset Component
 * Reusable card component for displaying assets with icon, title, price, and trend
 *
 * @param {Object} props
 * @param {string} props.icon - Icon character or emoji
 * @param {string} props.iconBg - Background color for icon (e.g., 'bg-blue-500')
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Card subtitle
 * @param {string} props.price - Price or value to display
 * @param {string} props.change - Percentage change (e.g., '+5.2%')
 * @param {Array} props.sparklineData - Data for sparkline chart
 * @param {boolean} props.isPositive - Whether the change is positive
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
export function CardAsset({
  icon = '📊',
  iconBg = 'bg-blue-500',
  title = 'Asset Name',
  subtitle = 'Description',
  price = '$0.00',
  change = '+0.0%',
  sparklineData = [],
  isPositive = true,
  onClick,
  className = '',
}) {
  const gradientClass = isPositive
    ? 'from-green-50 to-emerald-50'
    : 'from-red-50 to-rose-50'

  const changeColor = isPositive ? 'text-success-main' : 'text-error-main'
  const sparklineColor = isPositive ? '#34C759' : '#FF3B30'

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer
        border border-neutral-200 bg-gradient-to-br ${gradientClass}
        ${className}
      `}
    >
      {/* Icon and Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`${iconBg} w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-h3 font-semibold text-neutral-900 truncate">{title}</h3>
          <p className="text-body-sm text-neutral-600 truncate">{subtitle}</p>
        </div>
      </div>

      {/* Price and Change */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-neutral-900 mb-1">{price}</div>
        <div className={`text-sm font-medium ${changeColor}`}>{change}</div>
      </div>

      {/* Sparkline */}
      <div className="h-10">
        <Sparkline data={sparklineData} color={sparklineColor} height={40} />
      </div>
    </div>
  )
}
