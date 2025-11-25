import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminUserService } from '../../services/adminUserService'
import logger from '@/utils/logger'

/**
 * AdminClients - Dark Premium Style
 */
export function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClients() {
      try {
        logger.debug('🏢 AdminClients: Loading clients...')
        const response = await adminUserService.getClients()
        logger.debug('✅ AdminClients: Response received:', response)
        setClients(response.data?.clients || [])
      } catch (err) {
        logger.error('❌ AdminClients: Failed to fetch clients:', err)
        toast.error('Failed to load clients')
      } finally {
        setLoading(false)
      }
    }
    loadClients()
  }, [])

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Clients Management</h1>
            <p className="admin-subtitle">Monitor and manage all client accounts</p>
          </div>
          <button className="btn btn-primary" onClick={() => toast.info('Add Client feature coming soon')}>
            + Add Client
          </button>
        </header>

        {loading ? (
          <div className="admin-loading">
            <Spinner size="lg" />
          </div>
        ) : clients.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">🏢</div>
              <h3 className="admin-empty-title">No clients yet</h3>
              <p className="admin-empty-text">Add your first client to get started</p>
            </div>
          </div>
        ) : (
          <>
            <p className="admin-count">Total clients: {clients.length}</p>

            <div className="admin-cards-grid">
              {clients.map((client) => (
                <article key={client.id} className="admin-client-card">
                  {/* Header */}
                  <div className="admin-client-header">
                    <div>
                      <h3 className="admin-client-name">{client.company_name || client.name}</h3>
                      <p className="admin-client-email">{client.email}</p>
                      {client.owner && (
                        <p className="admin-client-owner">Owner: {client.owner.email}</p>
                      )}
                    </div>
                    <span className={`admin-badge ${client.status === 'active' ? 'admin-badge--success' : ''}`}>
                      {client.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="admin-client-stats">
                    <div className="admin-client-stat">
                      <span className="admin-client-stat-label">Users</span>
                      <span className="admin-client-stat-value">{client.users_count || 0}</span>
                    </div>
                    <div className="admin-client-stat">
                      <span className="admin-client-stat-label">Workflows</span>
                      <span className="admin-client-stat-value">{client.workflows_count || 0}</span>
                    </div>
                    <div className="admin-client-stat">
                      <span className="admin-client-stat-label">Executions</span>
                      <span className="admin-client-stat-value">{client.executions_count || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="admin-client-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => toast.info('View details coming soon')}>
                      View Details
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => toast.info('Edit coming soon')}>
                      Edit
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
