import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminUserService } from '../../services/adminUserService'
import logger from '@/utils/logger';


/**
 * AdminUsers - "The Organic Factory" Design
 * Bento card rows, Avatar circles, Role badges
 * Create User button in Lime (critical CTA)
 */
export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        logger.debug('👥 AdminUsers: Loading users...')
        const response = await adminUserService.getUsers()
        logger.debug('✅ AdminUsers: Response received:', {
          response,
          data: response.data,
          users: response.data?.users
        })
        setUsers(response.data?.users || [])
      } catch (error) {
        logger.error('❌ AdminUsers: Failed to load users:', {
          error,
          message: error.message,
          response: error.response
        })
        toast.error('Impossible de charger les utilisateurs')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  // Get initials for avatar from email
  const getInitials = (email) => {
    if (!email) return '?'
    const name = email.split('@')[0]
    return name.slice(0, 2).toUpperCase()
  }

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return {
          background: 'var(--error-light)',
          color: 'var(--error-dark)'
        }
      case 'owner':
        return {
          background: 'var(--primary-light)',
          color: 'var(--primary-dark)'
        }
      case 'collaborator':
        return {
          background: 'var(--neutral-100)',
          color: 'var(--neutral-700)'
        }
      default:
        return {
          background: 'var(--neutral-100)',
          color: 'var(--neutral-700)'
        }
    }
  }

  // Get gradient for avatar
  const getAvatarGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    ]
    return gradients[index % gradients.length]
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
              Users Management
            </h1>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Manage user accounts and permissions
            </p>
          </div>
          <button
            className="btn btn-primary-lime"
            style={{ padding: '12px 24px' }}
            onClick={() => toast.info('Create User feature coming soon')}
          >
            + Create User
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              No users found
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              No users are registered in the system
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <p
                className="font-mono"
                style={{
                  fontSize: '14px',
                  color: 'var(--neutral-500)',
                  fontWeight: 500
                }}
              >
                Total users: {users.length}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className="card-bento card-interactive"
                  style={{
                    background: 'var(--canvas-pure)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'default'
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: getAvatarGradient(index),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'white',
                      flexShrink: 0
                    }}
                  >
                    {getInitials(user.email)}
                  </div>

                  {/* User Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      className="font-display"
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '4px'
                      }}
                    >
                      {user.email}
                    </h3>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: '12px',
                        color: 'var(--neutral-500)'
                      }}
                    >
                      {user.id}
                    </p>
                  </div>

                  {/* Client Company */}
                  <div style={{ minWidth: '150px' }}>
                    <p
                      className="font-body"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        fontWeight: 600
                      }}
                    >
                      {user.client?.company_name || '-'}
                    </p>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: '11px',
                        color: 'var(--neutral-500)'
                      }}
                    >
                      {user.client?.plan || '-'}
                    </p>
                  </div>

                  {/* Platform Role Badge */}
                  <span
                    className="badge"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      ...getRoleBadgeColor(user.role),
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {user.role}
                  </span>

                  {/* Client Role Badge */}
                  {user.client_role && (
                    <span
                      className="badge"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        ...getRoleBadgeColor(user.client_role)
                      }}
                    >
                      {user.client_role}
                    </span>
                  )}

                  {/* Status Badge */}
                  <span
                    className="badge"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      background: user.status === 'active'
                        ? 'var(--success-light)'
                        : 'var(--warning-light)',
                      color: user.status === 'active'
                        ? 'var(--success-dark)'
                        : 'var(--warning-dark)'
                    }}
                  >
                    {user.status}
                  </span>

                  {/* Created Date */}
                  <div style={{ minWidth: '100px', textAlign: 'right' }}>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: '12px',
                        color: 'var(--neutral-500)'
                      }}
                    >
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                      onClick={() => toast.info('Edit feature coming soon')}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                      onClick={() => toast.error('Delete feature coming soon')}
                    >
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
