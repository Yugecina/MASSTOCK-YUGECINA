import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger';


/**
 * AdminTickets - "The Organic Factory" Design
 * Timeline style with priority badges (High=Red, Medium=Orange, Low=Green)
 * Quick Resolve button in Lime (critical CTA)
 */
export function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTickets() {
      try {
        logger.debug('💬 AdminTickets: Loading tickets...')
        const response = await adminService.getTickets()
        logger.debug('✅ AdminTickets: Response received:', {
          response,
          data: response.data,
          tickets: response.data?.tickets
        })
        setTickets(response.data?.tickets || [])
      } catch (err) {
        logger.error('❌ AdminTickets: Failed to fetch tickets:', {
          error: err,
          message: err.message,
          response: err.response
        })
        toast.error('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }
    loadTickets()
  }, [])

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return { bg: '#fee2e2', color: '#991b1b' } // Red 100/800
      case 'high':
        return { bg: 'var(--error-light)', color: 'var(--error-dark)' }
      case 'medium':
        return { bg: 'var(--warning-light)', color: 'var(--warning-dark)' }
      case 'low':
        return { bg: 'var(--success-light)', color: 'var(--success-dark)' }
      default:
        return { bg: 'var(--neutral-100)', color: 'var(--neutral-600)' }
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return { bg: 'var(--indigo-50)', color: 'var(--indigo-600)' }
      case 'in_progress':
        return { bg: 'var(--warning-light)', color: 'var(--warning-dark)' }
      case 'resolved':
        return { bg: 'var(--success-light)', color: 'var(--success-dark)' }
      case 'closed':
        return { bg: 'var(--neutral-100)', color: 'var(--neutral-600)' }
      default:
        return { bg: 'var(--neutral-100)', color: 'var(--neutral-600)' }
    }
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
              Support Tickets
            </h1>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Manage customer support requests and issues
            </p>
          </div>
          <button
            className="btn btn-primary-lime"
            style={{ padding: '12px 24px' }}
            onClick={() => toast.info('Add Ticket feature coming soon')}
          >
            + Add Ticket
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
            <Spinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              No support tickets
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              All tickets have been resolved. Great job!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tickets.map((ticket) => {
              const priorityStyle = getPriorityColor(ticket.priority)
              const statusStyle = getStatusColor(ticket.status)

              return (
                <div
                  key={ticket.id}
                  className="card-bento card-interactive"
                  style={{
                    background: 'var(--canvas-pure)',
                    padding: '24px',
                    cursor: 'default'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: '13px',
                            color: 'var(--neutral-500)',
                            fontWeight: 600
                          }}
                        >
                          #{ticket.id.substring(0, 8)}
                        </span>
                        <h3
                          className="font-display"
                          style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {ticket.title}
                        </h3>
                      </div>

                      <p
                        className="font-body"
                        style={{
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          marginBottom: '12px'
                        }}
                      >
                        {ticket.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span
                          className="font-body"
                          style={{
                            fontSize: '13px',
                            color: 'var(--neutral-600)'
                          }}
                        >
                          From: <strong>{ticket.client_name}</strong>
                        </span>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: '12px',
                            color: 'var(--neutral-500)'
                          }}
                        >
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginLeft: '24px', flexShrink: 0 }}>
                      {/* Status Badge */}
                      <span
                        className="badge"
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className="badge"
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          background: priorityStyle.bg,
                          color: priorityStyle.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {ticket.priority}
                      </span>

                      {/* Quick Resolve Button (Lime CTA) */}
                      {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                        <button
                          className="btn btn-primary-lime"
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                          onClick={() => toast.success('Resolve feature coming soon')}
                        >
                          {ticket.status === 'open' ? 'Start' : 'Resolve'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
