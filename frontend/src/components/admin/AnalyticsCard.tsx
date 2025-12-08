import type { AnalyticsCardProps } from '../../types/admin';

/**
 * AnalyticsCard Component
 * Displays a metric card with value, trend, and change percentage
 * PURE CSS ONLY - No Tailwind
 */

export default function AnalyticsCard({
  title,
  value,
  trend,
  trendValue,
  period,
  loading = false,
  suffix = ''
}: AnalyticsCardProps) {
  const getTrendColor = (): string => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-error';
    return 'text-neutral-500';
  };

  const getTrendArrow = (): string => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getTrendSign = (): string => {
    if (trend === 'up') return '+';
    if (trend === 'down') return '-';
    return '';
  };

  return (
    <article className="card" style={{ minHeight: '140px' }}>
      <div className="flex flex-col gap-2">
        {/* Title */}
        <h3 className="text-body-sm text-neutral-600 font-medium">
          {title}
        </h3>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          {loading ? (
            <span className="text-3xl font-bold text-neutral-400">--</span>
          ) : (
            <span className="text-3xl font-bold text-neutral-900">
              {value}{suffix}
            </span>
          )}
        </div>

        {/* Trend */}
        {!loading && trend && (
          <div className="flex items-center gap-2">
            <span className={`text-body-sm font-semibold ${getTrendColor()}`}>
              <span className="text-lg">{getTrendArrow()}</span>
              {' '}
              {getTrendSign()}{Math.abs(trendValue || 0).toFixed(1)}%
            </span>
            {period && (
              <span className="text-body-sm text-neutral-500">
                {period}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
