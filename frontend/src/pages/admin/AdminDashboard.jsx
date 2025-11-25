import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger'

/**
 * AdminDashboard - Dark Premium Style
 * Displays real-time platform metrics and activity
 */
export function AdminDashboard() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        logger.debug('📊 AdminDashboard: Loading dashboard data...')
        const response = await adminService.getDashboard()
        logger.debug('✅ AdminDashboard: Data loaded:', response)
        setDashboard(response.data || response)
      } catch (err) {
        logger.error('❌ AdminDashboard: Failed to fetch dashboard:', {
          error: err,
          message: err.message,
          response: err.response
        })
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  // Format currency
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(num)
  }

  // Format percentage
  const formatPercent = (value) => {
    const num = parseFloat(value) || 0
    return `${num.toFixed(1)}%`
  }

  // Get time ago string
  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    return `Il y a ${diffDays}j`
  }

  // Format full date
  const formatFullDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  }

  // Format activity for display
  const formatActivity = (activity) => {
    const actionMap = {
      'user_created_by_admin': { icon: '👤', label: 'Utilisateur créé', color: 'success' },
      'user_updated': { icon: '✏️', label: 'Utilisateur modifié', color: 'neutral' },
      'user_deleted': { icon: '🗑️', label: 'Utilisateur supprimé', color: 'error' },
      'user_login': { icon: '🔐', label: 'Connexion', color: 'neutral' },
      'user_logout': { icon: '🚪', label: 'Déconnexion', color: 'neutral' },
      'client_created': { icon: '🏢', label: 'Client créé', color: 'success' },
      'client_updated': { icon: '✏️', label: 'Client modifié', color: 'neutral' },
      'client_deleted': { icon: '🗑️', label: 'Client supprimé', color: 'error' },
      'client_suspended': { icon: '⛔', label: 'Client suspendu', color: 'warning' },
      'workflow_created': { icon: '⚡', label: 'Workflow créé', color: 'success' },
      'workflow_updated': { icon: '✏️', label: 'Workflow modifié', color: 'neutral' },
      'workflow_deleted': { icon: '🗑️', label: 'Workflow supprimé', color: 'error' },
      'workflow_executed': { icon: '▶️', label: 'Workflow exécuté', color: 'success' },
      'workflow_failed': { icon: '❌', label: 'Workflow échoué', color: 'error' },
      'workflow_request_created': { icon: '📝', label: 'Demande créée', color: 'success' },
      'workflow_request_approved': { icon: '✅', label: 'Demande approuvée', color: 'success' },
      'workflow_request_rejected': { icon: '❌', label: 'Demande rejetée', color: 'error' },
      'ticket_created': { icon: '🎫', label: 'Ticket créé', color: 'neutral' },
      'ticket_replied': { icon: '💬', label: 'Réponse ticket', color: 'neutral' },
      'ticket_closed': { icon: '✅', label: 'Ticket fermé', color: 'success' },
      'settings_updated': { icon: '⚙️', label: 'Paramètres modifiés', color: 'neutral' },
      'default': { icon: '📋', label: activity.action?.replace(/_/g, ' ') || 'Action', color: 'neutral' }
    }

    const config = actionMap[activity.action] || actionMap['default']

    // Build description
    let description = ''
    if (activity.user?.email) {
      description = `par ${activity.user.name || activity.user.email}`
    }
    if (activity.client?.name) {
      description += description ? ` • ${activity.client.name}` : activity.client.name
    }

    return { ...config, description }
  }

  // Navigate to resource
  const navigateToResource = (activity) => {
    const routes = {
      'user': `/admin/users`,
      'client': `/admin/clients`,
      'workflow': `/admin/workflows`,
      'ticket': `/admin/tickets`,
      'workflow_request': `/admin/workflows`
    }
    const route = routes[activity.resource_type]
    if (route) {
      navigate(route)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page admin-loading">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="admin-page">
          <div className="admin-empty">
            <div className="admin-empty-icon">⚠️</div>
            <p className="admin-empty-text">Erreur de chargement: {error}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const metrics = [
    {
      label: 'Uptime',
      value: formatPercent(dashboard?.uptime_percent),
      status: (dashboard?.uptime_percent || 0) >= 99 ? 'success' : (dashboard?.uptime_percent || 0) >= 95 ? 'neutral' : 'error'
    },
    {
      label: 'Erreurs (24h)',
      value: dashboard?.errors_24h?.toString() || '0',
      status: (dashboard?.errors_24h || 0) === 0 ? 'success' : (dashboard?.errors_24h || 0) <= 5 ? 'neutral' : 'error'
    },
    {
      label: 'Exécutions (24h)',
      value: dashboard?.total_executions_24h?.toString() || '0',
      status: 'neutral'
    },
    {
      label: 'Revenu (mois)',
      value: formatCurrency(dashboard?.total_revenue_month),
      status: 'neutral'
    },
    {
      label: 'Clients actifs',
      value: dashboard?.active_clients?.toString() || '0',
      status: 'neutral'
    },
  ]

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Dashboard</h1>
            <p className="admin-subtitle">Vue d'ensemble de la plateforme</p>
          </div>
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
          <h2 className="admin-section-title">Activité récente</h2>

          <div className="admin-card">
            {dashboard?.recent_activity && dashboard.recent_activity.length > 0 ? (
              <div className="admin-activity-list">
                {dashboard.recent_activity.map((activity, idx) => {
                  const formatted = formatActivity(activity)
                  return (
                    <div
                      key={activity.id || idx}
                      className={`admin-activity-item ${selectedActivity?.id === activity.id ? 'admin-activity-item--selected' : ''}`}
                      onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
                    >
                      <span className="admin-activity-icon">{formatted.icon}</span>
                      <div className="admin-activity-content">
                        <span className={`admin-activity-label admin-activity-label--${formatted.color}`}>
                          {formatted.label}
                        </span>
                        {formatted.description && (
                          <span className="admin-activity-desc">{formatted.description}</span>
                        )}
                      </div>
                      <span className="admin-activity-time">
                        {getTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="admin-empty">
                <div className="admin-empty-icon">📊</div>
                <p className="admin-empty-text">Aucune activité récente</p>
              </div>
            )}
          </div>
        </section>

        {/* Activity Detail Panel */}
        {selectedActivity && (
          <div className="admin-activity-detail">
            <div className="admin-activity-detail-header">
              <h3 className="admin-activity-detail-title">
                {formatActivity(selectedActivity).icon} Détails de l'activité
              </h3>
              <button
                className="admin-activity-detail-close"
                onClick={() => setSelectedActivity(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-activity-detail-body">
              <div className="admin-activity-detail-grid">
                <div className="admin-activity-detail-item">
                  <span className="admin-activity-detail-label">Action</span>
                  <span className="admin-activity-detail-value">
                    {formatActivity(selectedActivity).label}
                  </span>
                </div>

                <div className="admin-activity-detail-item">
                  <span className="admin-activity-detail-label">Date</span>
                  <span className="admin-activity-detail-value">
                    {formatFullDate(selectedActivity.created_at)}
                  </span>
                </div>

                {selectedActivity.user && (
                  <div className="admin-activity-detail-item">
                    <span className="admin-activity-detail-label">Utilisateur</span>
                    <span className="admin-activity-detail-value">
                      {selectedActivity.user.name || selectedActivity.user.email}
                      {selectedActivity.user.name && (
                        <span className="admin-activity-detail-sub">
                          {selectedActivity.user.email}
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {selectedActivity.client && (
                  <div className="admin-activity-detail-item">
                    <span className="admin-activity-detail-label">Client</span>
                    <span className="admin-activity-detail-value">
                      {selectedActivity.client.name}
                    </span>
                  </div>
                )}

                {selectedActivity.resource_type && (
                  <div className="admin-activity-detail-item">
                    <span className="admin-activity-detail-label">Ressource</span>
                    <span className="admin-activity-detail-value">
                      {selectedActivity.resource_type}
                      {selectedActivity.resource_id && (
                        <span className="admin-activity-detail-sub">
                          ID: {selectedActivity.resource_id.slice(0, 8)}...
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {selectedActivity.ip_address && (
                  <div className="admin-activity-detail-item">
                    <span className="admin-activity-detail-label">Adresse IP</span>
                    <span className="admin-activity-detail-value admin-activity-detail-mono">
                      {selectedActivity.ip_address}
                    </span>
                  </div>
                )}
              </div>

              {/* Changes */}
              {selectedActivity.changes && Object.keys(selectedActivity.changes).length > 0 && (
                <div className="admin-activity-detail-changes">
                  <span className="admin-activity-detail-label">Modifications</span>
                  <div className="admin-activity-detail-changes-list">
                    {Object.entries(selectedActivity.changes).map(([key, value]) => (
                      <div key={key} className="admin-activity-detail-change">
                        <span className="admin-activity-detail-change-key">{key}</span>
                        <span className="admin-activity-detail-change-value">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {selectedActivity.resource_type && (
                <button
                  className="btn btn-secondary"
                  onClick={() => navigateToResource(selectedActivity)}
                  style={{ marginTop: '16px', width: '100%' }}
                >
                  Voir {selectedActivity.resource_type === 'user' ? 'les utilisateurs' :
                        selectedActivity.resource_type === 'client' ? 'les clients' :
                        selectedActivity.resource_type === 'workflow' ? 'les workflows' :
                        selectedActivity.resource_type === 'ticket' ? 'les tickets' :
                        'la ressource'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
