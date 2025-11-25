import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminUserService } from '../../services/adminUserService'
import logger from '@/utils/logger'

/**
 * AdminUsers - Dark Premium Style
 */
export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        logger.debug('👥 AdminUsers: Loading users...')
        const response = await adminUserService.getUsers()
        logger.debug('✅ AdminUsers: Response received:', response)
        setUsers(response.data?.users || [])
      } catch (error) {
        logger.error('❌ AdminUsers: Failed to load users:', error)
        toast.error('Impossible de charger les utilisateurs')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const getInitials = (email) => {
    if (!email) return '?'
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Users Management</h1>
            <p className="admin-subtitle">Manage user accounts and permissions</p>
          </div>
          <button className="btn btn-primary" onClick={() => toast.info('Create User feature coming soon')}>
            + Create User
          </button>
        </header>

        {loading ? (
          <div className="admin-loading">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">👥</div>
              <h3 className="admin-empty-title">No users found</h3>
              <p className="admin-empty-text">No users are registered in the system</p>
            </div>
          </div>
        ) : (
          <>
            <p className="admin-count">Total users: {users.length}</p>

            <div className="admin-table-list">
              {users.map((user, index) => (
                <div key={user.id} className="admin-table-row">
                  {/* Avatar */}
                  <div className="admin-avatar">{getInitials(user.email)}</div>

                  {/* User Info */}
                  <div className="admin-table-cell admin-table-cell--grow">
                    <span className="admin-table-primary">{user.email}</span>
                    <span className="admin-table-secondary">{user.id.substring(0, 8)}...</span>
                  </div>

                  {/* Client */}
                  <div className="admin-table-cell">
                    <span className="admin-table-primary">{user.client?.company_name || '-'}</span>
                    <span className="admin-table-secondary">{user.client?.plan || '-'}</span>
                  </div>

                  {/* Badges */}
                  <span className={`admin-badge ${user.role === 'admin' ? 'admin-badge--danger' : 'admin-badge--primary'}`}>
                    {user.role}
                  </span>

                  {user.client_role && (
                    <span className="admin-badge">{user.client_role}</span>
                  )}

                  <span className={`admin-badge ${user.status === 'active' ? 'admin-badge--success' : 'admin-badge--warning'}`}>
                    {user.status}
                  </span>

                  {/* Date */}
                  <span className="admin-table-date">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>

                  {/* Actions */}
                  <div className="admin-table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => toast.info('Edit feature coming soon')}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => toast.error('Delete feature coming soon')}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
