import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminUserService } from '../../services/adminUserService'
import logger from '@/utils/logger';


/**
 * AdminClients - "The Organic Factory" Design
 * Bento cards grid (3 columns), Client stats in mono font
 * Add Client button in Lime (critical CTA)
 */
export function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClients() {
      try {
        logger.debug('🏢 AdminClients: Loading clients...')
        const response = await adminUserService.getClients()
        logger.debug('✅ AdminClients: Response received:', {
          response,
          data: response.data,
          clients: response.data?.clients
        })
        setClients(response.data?.clients || [])
      } catch (err) {
        logger.error('❌ AdminClients: Failed to fetch clients:', {
          error: err,
          message: err.message,
          response: err.response
        })
        toast.error('Failed to load clients')
      } finally {
        setLoading(false)
      }
    }
    loadClients()
  }, [])

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
              Clients Management
            </h1>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Monitor and manage all client accounts
            </p>
          </div>
          <button
            className="btn btn-primary-lime"
            style={{ padding: '12px 24px' }}
            onClick={() => toast.info('Add Client feature coming soon')}
          >
            + Add Client
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
            <Spinner size="lg" />
          </div>
        ) : clients.length === 0 ? (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏢</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              No clients yet
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Add your first client to get started
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <p
                className="font-mono"
                style={{
                  fontSize: '14px',
                  color: 'var(--neutral-500)',
                  fontWeight: 500
                }}
              >
                Total clients: {clients.length}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {clients.map((client, index) => (
                <div
                  key={client.id}
                  className="card-bento card-interactive"
                  style={{
                    background: 'var(--canvas-pure)',
                    padding: '24px',
                    cursor: 'default'
                  }}
                >
                  {/* Client Header */}
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <h3
                        className="font-display"
                        style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: '4px'
                        }}
                      >
                        {client.company_name || client.name}
                      </h3>
                      <p
                        className="font-mono"
                        style={{
                          fontSize: '12px',
                          color: 'var(--neutral-500)',
                          marginBottom: '4px'
                        }}
                      >
                        {client.email}
                      </p>
                      {client.owner && (
                        <p
                          className="font-body"
                          style={{
                            fontSize: '11px',
                            color: 'var(--neutral-400)'
                          }}
                        >
                          Owner: {client.owner.email}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className="badge"
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        background: client.status === 'active'
                          ? 'var(--success-light)'
                          : 'var(--neutral-100)',
                        color: client.status === 'active'
                          ? 'var(--success-dark)'
                          : 'var(--neutral-600)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {client.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Client Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    padding: '16px',
                    background: 'var(--neutral-50)',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <p
                        className="font-body"
                        style={{
                          fontSize: '11px',
                          color: 'var(--neutral-500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px',
                          fontWeight: 600
                        }}
                      >
                        Users
                      </p>
                      <p
                        className="font-mono"
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {client.users_count || 0}
                      </p>
                    </div>
                    <div>
                      <p
                        className="font-body"
                        style={{
                          fontSize: '11px',
                          color: 'var(--neutral-500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px',
                          fontWeight: 600
                        }}
                      >
                        Workflows
                      </p>
                      <p
                        className="font-mono"
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {client.workflows_count || 0}
                      </p>
                    </div>
                    <div>
                      <p
                        className="font-body"
                        style={{
                          fontSize: '11px',
                          color: 'var(--neutral-500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px',
                          fontWeight: 600
                        }}
                      >
                        Executions
                      </p>
                      <p
                        className="font-mono"
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {client.executions_count || 0}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px', fontSize: '14px' }}
                      onClick={() => toast.info('View details coming soon')}
                    >
                      View Details
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '10px 16px', fontSize: '14px' }}
                      onClick={() => toast.info('Edit coming soon')}
                    >
                      Edit
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
