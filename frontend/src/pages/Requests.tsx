import { useState, useEffect } from 'react'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { requestService } from '../services/requests'
import logger from '@/utils/logger'

interface WorkflowRequest {
  id: string
  title: string
  description?: string
  status?: string
  created_at: string
}

interface StatusConfig {
  color: string
  bg: string
}

/**
 * Requests Page - "The Organic Factory" Design
 * Liste de workflow requests avec badges colorés et Bento cards
 */
export function Requests(): JSX.Element {
  const [requests, setRequests] = useState<WorkflowRequest[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadRequests(): Promise<void> {
      try {
        logger.debug('🔍 Requests: Loading requests...')
        const data = await requestService.list()
        setRequests(data.requests || [])
        logger.debug('✅ Requests: Loaded', data.requests?.length || 0, 'requests')
      } catch (err) {
        logger.error('❌ Requests: Failed to fetch requests:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRequests()
  }, [])

  const getStatusConfig = (status?: string): StatusConfig => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { color: 'var(--success-dark)', bg: 'var(--success-light)' }
      case 'pending':
        return { color: 'var(--neutral-700)', bg: 'var(--neutral-100)' }
      case 'rejected':
        return { color: 'var(--error-dark)', bg: 'var(--error-light)' }
      default:
        return { color: 'var(--neutral-600)', bg: 'var(--neutral-100)' }
    }
  }

  return (
    <ClientLayout>
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
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
            Requests
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)'
            }}
          >
            Manage workflow execution requests
          </p>
        </div>

        {/* Requests List */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '64px 0'
          }}>
            <Spinner size="lg" />
          </div>
        ) : requests.length === 0 ? (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              No requests yet
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              You don't have any workflow requests at the moment
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requests.map((req) => {
              const statusConfig = getStatusConfig(req.status)

              return (
                <div
                  key={req.id}
                  className="card-bento card-interactive"
                  style={{
                    background: 'var(--canvas-pure)',
                    padding: '24px',
                    borderLeft: `4px solid ${statusConfig.color}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px' }}>
                    {/* Left: Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3
                          className="font-display"
                          style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {req.title}
                        </h3>
                        <span
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            background: statusConfig.bg,
                            color: statusConfig.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {req.status || 'Pending'}
                        </span>
                      </div>

                      <p
                        className="font-body"
                        style={{
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          marginBottom: '12px'
                        }}
                      >
                        {req.description || 'No description provided'}
                      </p>

                      <div
                        className="font-body"
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-tertiary)'
                        }}
                      >
                        Requested {new Date(req.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Right: Actions (if applicable) */}
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          className="btn btn-primary-lime"
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
