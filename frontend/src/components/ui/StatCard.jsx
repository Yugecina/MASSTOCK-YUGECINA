/**
 * StatCard - Neumorphism (Soft UI) Design
 * Soft extruded cards with double shadows
 */

export function StatCard({
  label,
  value,
  change,
  trend = 'neutral',
  icon,
  glow = false,
  variant = 'default',
  delay = 0
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'highlight': return 'stat-card--highlight'
      case 'success': return 'stat-card--success'
      case 'accent': return 'stat-card--accent'
      default: return ''
    }
  }

  return (
    <div
      className={`stat-card ${getVariantClass()}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon in neumorphic container */}
      {icon && (
        <div className="stat-card__icon-wrap">
          <span className="stat-card__icon">{icon}</span>
        </div>
      )}

      {/* Label */}
      <div className="stat-card__label">{label}</div>

      {/* Value */}
      <div className="stat-card__value">{value}</div>

      {/* Trend with inset effect */}
      <div className={`stat-card__trend stat-card__trend--${trend}`}>
        {trend === 'up' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        )}
        {trend === 'down' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="17 18 23 18 23 12" />
          </svg>
        )}
        <span>{change}</span>
      </div>
    </div>
  )
}
