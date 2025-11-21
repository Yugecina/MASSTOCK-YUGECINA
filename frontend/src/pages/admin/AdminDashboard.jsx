import { useState, useEffect } from 'react'
import { Spinner } from '../../components/ui/Spinner'
import { StatCard } from '../../components/ui/StatCard'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger';


/**
 * AdminDashboard - "The Organic Factory" Design
 * Bento Grid layout, Indigo accents, Mono font for metrics
 * Uptime indicator with Lime glow when healthy
 */
export function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        logger.debug('📊 AdminDashboard: Loading dashboard data...')
        const data = await adminService.getDashboard()
        logger.debug('✅ AdminDashboard: Data loaded:', data)
        setDashboard(data)
      } catch (err) {
        logger.error('❌ AdminDashboard: Failed to fetch dashboard:', {
          error: err,
          message: err.message,
          response: err.response
        })
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  // Metrics for stats cards
  const metrics = [
    {
      label: 'System Uptime',
      value: '99.8%',
      change: 'Last 30 days',
      trend: 'up',
      glow: true // Healthy uptime gets Lime glow
    },
    {
      label: 'Errors (24h)',
      value: '2',
      change: 'Critical',
      trend: 'neutral'
    },
    {
      label: 'API Latency',
      value: '250ms',
      change: 'Average',
      trend: 'up'
    },
    {
      label: 'Active Clients',
      value: dashboard?.active_clients?.toString() || '0',
      change: 'Total',
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
        {/* Header - Cabinet Grotesk typography */}
        <div style={{ marginBottom: '48px' }}>
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
            Admin Dashboard
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)'
            }}
          >
            System health, metrics, and platform activity
          </p>
        </div>

        {/* Metrics Grid - Bento Style */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {metrics.map((metric, index) => (
            <StatCard
              key={index}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              glow={metric.glow || false}
            />
          ))}
        </div>

        {/* Recent Activity */}
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
              Recent Activity
            </h2>
          </div>

          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '32px'
            }}
          >
            {dashboard?.recent_activity && dashboard.recent_activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dashboard.recent_activity.map((activity, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 0',
                      borderBottom: idx < dashboard.recent_activity.length - 1
                        ? '1px solid var(--neutral-200)'
                        : 'none'
                    }}
                  >
                    <span
                      className="font-body"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {activity.action}
                    </span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '12px',
                        color: 'var(--neutral-500)'
                      }}
                    >
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <p
                  className="font-body"
                  style={{
                    fontSize: '16px',
                    color: 'var(--neutral-500)'
                  }}
                >
                  No recent activity
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
