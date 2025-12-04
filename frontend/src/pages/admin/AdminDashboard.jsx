import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger'

/**
 * AdminDashboard - Dark Premium Style
 * Displays real-time platform metrics and activity with modal details
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

  // Get icon SVG for activity
  const getActivityIcon = (action) => {
    const iconMap = {
      'user_created_by_admin': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
      'user_updated': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      'user_deleted': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
      'user_login': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      ),
      'client_created': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l8-4v18" />
          <path d="M19 21V11l-6-4" />
          <path d="M9 9v.01" />
          <path d="M9 12v.01" />
          <path d="M9 15v.01" />
        </svg>
      ),
      'workflow_executed': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
      'workflow_created': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="6" height="6" rx="1" />
          <rect x="15" y="15" width="6" height="6" rx="1" />
          <path d="M9 6h6v3a3 3 0 0 0 3 3h3" />
          <path d="M6 9v6l3 3" />
        </svg>
      ),
      'workflow_failed': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      'ticket_created': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      'default': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
    }
    return iconMap[action] || iconMap['default']
  }

  // Format activity for display
  const formatActivity = (activity) => {
    const actionMap = {
      'user_created_by_admin': { label: 'Utilisateur créé', color: 'success' },
      'user_updated': { label: 'Utilisateur modifié', color: 'neutral' },
      'user_deleted': { label: 'Utilisateur supprimé', color: 'error' },
      'user_login': { label: 'Connexion', color: 'neutral' },
      'user_logout': { label: 'Déconnexion', color: 'neutral' },
      'client_created': { label: 'Client créé', color: 'success' },
      'client_updated': { label: 'Client modifié', color: 'neutral' },
      'client_deleted': { label: 'Client supprimé', color: 'error' },
      'client_suspended': { label: 'Client suspendu', color: 'warning' },
      'workflow_created': { label: 'Workflow créé', color: 'success' },
      'workflow_updated': { label: 'Workflow modifié', color: 'neutral' },
      'workflow_deleted': { label: 'Workflow supprimé', color: 'error' },
      'workflow_executed': { label: 'Workflow exécuté', color: 'success' },
      'workflow_failed': { label: 'Workflow échoué', color: 'error' },
      'workflow_request_created': { label: 'Demande créée', color: 'success' },
      'workflow_request_approved': { label: 'Demande approuvée', color: 'success' },
      'workflow_request_rejected': { label: 'Demande rejetée', color: 'error' },
      'ticket_created': { label: 'Ticket créé', color: 'neutral' },
      'ticket_replied': { label: 'Réponse ticket', color: 'neutral' },
      'ticket_closed': { label: 'Ticket fermé', color: 'success' },
      'settings_updated': { label: 'Paramètres modifiés', color: 'neutral' },
      'default': { label: activity.action?.replace(/_/g, ' ') || 'Action', color: 'neutral' }
    }

    const config = actionMap[activity.action] || actionMap['default']
    const icon = getActivityIcon(activity.action)

    // Build description
    let description = ''
    if (activity.user?.email) {
      description = `par ${activity.user.name || activity.user.email}`
    }
    if (activity.client?.name) {
      description += description ? ` • ${activity.client.name}` : activity.client.name
    }

    return { ...config, icon, description }
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
      status: (dashboard?.uptime_percent || 0) >= 99 ? 'success' : (dashboard?.uptime_percent || 0) >= 95 ? 'neutral' : 'error',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    },
    {
      label: 'Erreurs (24h)',
      value: dashboard?.errors_24h?.toString() || '0',
      status: (dashboard?.errors_24h || 0) === 0 ? 'success' : (dashboard?.errors_24h || 0) <= 5 ? 'neutral' : 'error',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    },
    {
      label: 'Exécutions (24h)',
      value: dashboard?.total_executions_24h?.toString() || '0',
      status: 'neutral',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      )
    },
    {
      label: 'Revenu (mois)',
      value: formatCurrency(dashboard?.total_revenue_month),
      status: 'neutral',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      label: 'Clients actifs',
      value: dashboard?.active_clients?.toString() || '0',
      status: 'neutral',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l8-4v18" />
          <path d="M19 21V11l-6-4" />
          <path d="M9 9v.01" />
          <path d="M9 12v.01" />
          <path d="M9 15v.01" />
        </svg>
      )
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
              <div className="admin-stat-card-header">
                <span className="admin-stat-icon">{metric.icon}</span>
                <span className="admin-stat-label">{metric.label}</span>
              </div>
              <span className={`admin-stat-value ${metric.status === 'success' ? 'admin-stat-value--success' : metric.status === 'error' ? 'admin-stat-value--error' : ''}`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <section className="admin-section">
          <h2 className="admin-section-title">Activité récente</h2>

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
                      <div className={`admin-activity-icon admin-activity-icon--${formatted.color}`}>
                        {formatted.icon}
                      </div>
                      <div className="admin-activity-content">
                        <span className="admin-activity-label">
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
              <div className="admin-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <p className="admin-empty-text">Aucune activité récente</p>
            </div>
          )}
        </section>

        {/* Activity Detail Modal */}
        {selectedActivity && (
          <>
            {/* Backdrop */}
            <div
              className="admin-modal-backdrop"
              onClick={() => setSelectedActivity(null)}
            />

            {/* Modal */}
            <div className="admin-activity-detail">
              <div className="admin-activity-detail-header">
                <div className="admin-activity-detail-icon">
                  {formatActivity(selectedActivity).icon}
                </div>
                <h3 className="admin-activity-detail-title">
                  Détails de l'activité
                </h3>
                <button
                  className="admin-activity-detail-close"
                  onClick={() => setSelectedActivity(null)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
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
                    className="btn btn-primary"
                    onClick={() => navigateToResource(selectedActivity)}
                    style={{ marginTop: '20px', width: '100%' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    Voir {selectedActivity.resource_type === 'user' ? 'les utilisateurs' :
                          selectedActivity.resource_type === 'client' ? 'les clients' :
                          selectedActivity.resource_type === 'workflow' ? 'les workflows' :
                          selectedActivity.resource_type === 'ticket' ? 'les tickets' :
                          'la ressource'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
