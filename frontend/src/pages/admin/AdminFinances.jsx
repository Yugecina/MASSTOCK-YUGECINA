import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger'

/**
 * AdminFinances - Dark Premium Style
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
        logger.error('❌ AdminFinances: Failed to fetch finances:', err)
        toast.error('Failed to load finances')
      } finally {
        setLoading(false)
      }
    }
    loadFinances()
  }, [])

  const metrics = [
    { label: 'Revenue (Month)', value: `€${finances?.revenue_month || 0}`, status: 'success' },
    { label: 'Revenue (Year)', value: `€${finances?.revenue_year || 0}`, status: 'success' },
    { label: 'Costs', value: `€${finances?.costs || 0}`, status: 'neutral' },
    { label: 'Margin', value: `${finances?.margin || 0}%`, status: 'success' },
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
          <div>
            <h1 className="admin-title">Finances & Analytics</h1>
            <p className="admin-subtitle">Revenue tracking and financial analytics</p>
          </div>
          <button className="btn btn-primary" onClick={() => toast.info('Export feature coming soon')}>
            Export Data
          </button>
        </header>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          {metrics.map((metric, index) => (
            <div key={index} className="admin-stat-card">
              <span className="admin-stat-label">{metric.label}</span>
              <span className={`admin-stat-value ${metric.status === 'success' ? 'admin-stat-value--success' : ''}`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Revenue Breakdown */}
        <section className="admin-section">
          <h2 className="admin-section-title">Revenue Breakdown</h2>

          <div className="admin-card">
            {finances?.breakdown && finances.breakdown.length > 0 ? (
              <div className="admin-breakdown-list">
                {finances.breakdown.map((item, idx) => (
                  <div key={idx} className="admin-breakdown-item">
                    <span className="admin-breakdown-name">{item.name}</span>
                    <span className="admin-breakdown-value">€{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">
                <div className="admin-empty-icon">💰</div>
                <p className="admin-empty-text">No revenue data available</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
