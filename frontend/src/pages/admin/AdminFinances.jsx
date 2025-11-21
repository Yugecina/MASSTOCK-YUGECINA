import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger';


/**
 * AdminFinances - "The Organic Factory" Design
 * Revenue stats with large mono font numbers
 * Export button in Lime (critical CTA)
 */
export function AdminFinances() {
  const [finances, setFinances] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFinances() {
      try {
        logger.debug('💰 AdminFinances: Loading finances...')
        const data = await adminService.getFinances()
        logger.debug('✅ AdminFinances: Data loaded:', data)
        setFinances(data)
      } catch (err) {
        logger.error('❌ AdminFinances: Failed to fetch finances:', {
          error: err,
          message: err.message,
          response: err.response
        })
        toast.error('Failed to load finances')
      } finally {
        setLoading(false)
      }
    }
    loadFinances()
  }, [])

  const metrics = [
    {
      label: 'Revenue (Month)',
      value: `€${finances?.revenue_month || 0}`,
      trend: 'up'
    },
    {
      label: 'Revenue (Year)',
      value: `€${finances?.revenue_year || 0}`,
      trend: 'up'
    },
    {
      label: 'Costs',
      value: `€${finances?.costs || 0}`,
      trend: 'neutral'
    },
    {
      label: 'Margin',
      value: `${finances?.margin || 0}%`,
      trend: 'up'
    },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              className="font-display"
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                letterSpacing: '-0.02em'
              }}
            >
              Finances & Analytics
            </h1>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Revenue tracking and financial analytics
            </p>
          </div>
          <button
            className="btn btn-primary-lime"
            style={{ padding: '12px 24px' }}
            onClick={() => toast.info('Export feature coming soon')}
          >
            Export Data
          </button>
        </div>

        {/* Metrics Grid - Bento Style */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="card-bento"
              style={{
                background: 'var(--canvas-pure)',
                padding: '32px',
                cursor: 'default',
                transition: 'all 0.2s ease-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              }}
            >
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
                  {metric.label}
                </p>
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: metric.trend === 'up' ? 'var(--success-main)' :
                         metric.trend === 'down' ? 'var(--error-main)' :
                         'var(--text-primary)',
                  lineHeight: 1.2
                }}
              >
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Breakdown */}
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em'
              }}
            >
              Revenue Breakdown
            </h2>
          </div>

          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '32px'
            }}
          >
            {finances?.breakdown && finances.breakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {finances.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'var(--neutral-50)',
                      borderRadius: '8px'
                    }}
                  >
                    <span
                      className="font-body"
                      style={{
                        fontSize: '16px',
                        fontWeight: 500,
                        color: 'var(--text-primary)'
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                      }}
                    >
                      €{item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
                <p
                  className="font-body"
                  style={{
                    fontSize: '16px',
                    color: 'var(--neutral-500)'
                  }}
                >
                  No revenue data available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
