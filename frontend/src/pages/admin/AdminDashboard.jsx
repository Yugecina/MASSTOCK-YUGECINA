import { useState, useEffect } from 'react'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger'

/**
 * AdminDashboard - Dark Premium Style
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

  const metrics = [
    { label: 'System Uptime', value: '99.8%', status: 'success' },
    { label: 'Errors (24h)', value: '2', status: 'error' },
    { label: 'API Latency', value: '250ms', status: 'neutral' },
    { label: 'Active Clients', value: dashboard?.active_clients?.toString() || '0', status: 'neutral' },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page admin-loading">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">System health, metrics, and platform activity</p>
        </header>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          {metrics.map((metric, index) => (
            <div key={index} className="admin-stat-card">
              <span className="admin-stat-label">{metric.label}</span>
              <span className={`admin-stat-value ${metric.status === 'success' ? 'admin-stat-value--success' : metric.status === 'error' ? 'admin-stat-value--error' : ''}`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <section className="admin-section">
          <h2 className="admin-section-title">Recent Activity</h2>

          <div className="admin-card">
            {dashboard?.recent_activity && dashboard.recent_activity.length > 0 ? (
              <div className="admin-activity-list">
                {dashboard.recent_activity.map((activity, idx) => (
                  <div key={idx} className="admin-activity-item">
                    <span className="admin-activity-text">{activity.action}</span>
                    <span className="admin-activity-time">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">
                <div className="admin-empty-icon">📊</div>
                <p className="admin-empty-text">No recent activity</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
