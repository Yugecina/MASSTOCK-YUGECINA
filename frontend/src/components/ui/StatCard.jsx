/**
 * StatCard - Reusable Statistics Card Component
 * Used for displaying metrics on Dashboard and AdminDashboard
 *
 * Mediterranean Design System with Bento Grid style
 */

export function StatCard({ label, value, change, trend = 'neutral', glow = false }) {
  return (
    <div
      className="card-bento"
      style={{
        background: 'var(--canvas-pure)',
        padding: '32px',
        cursor: 'default',
        transition: 'all 0.2s ease-out',
        boxShadow: glow
          ? '0 0 20px rgba(42, 157, 143, 0.3)' // Verdigris glow
          : 'var(--shadow-md)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = glow
          ? '0 0 30px rgba(42, 157, 143, 0.5)'
          : 'var(--shadow-lg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = glow
          ? '0 0 20px rgba(42, 157, 143, 0.3)'
          : 'var(--shadow-md)'
      }}
    >
      {/* Label */}
      <div style={{ marginBottom: '16px' }}>
        <p
          className="font-body"
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {label}
        </p>
      </div>

      {/* Value and Change */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        {/* Main Value */}
        <div
          className="font-mono"
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}
        >
          {value}
        </div>

        {/* Change / Trend Indicator */}
        <div
          className="font-body"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: trend === 'up' ? 'var(--success-main)' :
                   trend === 'down' ? 'var(--error-main)' :
                   'var(--neutral-500)'
          }}
        >
          {change}
        </div>
      </div>
    </div>
  )
}
