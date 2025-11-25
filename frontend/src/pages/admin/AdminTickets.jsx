import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger'

/**
 * AdminTickets - Dark Premium Style
 */
export function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTickets() {
      try {
        logger.debug('💬 AdminTickets: Loading tickets...')
        const response = await adminService.getTickets()
        logger.debug('✅ AdminTickets: Response received:', response)
        setTickets(response.data?.tickets || [])
      } catch (err) {
        logger.error('❌ AdminTickets: Failed to fetch tickets:', err)
        toast.error('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }
    loadTickets()
  }, [])

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'admin-badge--danger'
      case 'high': return 'admin-badge--danger'
      case 'medium': return 'admin-badge--warning'
      case 'low': return 'admin-badge--success'
      default: return ''
    }
  }

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'admin-badge--primary'
      case 'in_progress': return 'admin-badge--warning'
      case 'resolved': return 'admin-badge--success'
      case 'closed': return ''
      default: return ''
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Support Tickets</h1>
            <p className="admin-subtitle">Manage customer support requests and issues</p>
          </div>
          <button className="btn btn-primary" onClick={() => toast.info('Add Ticket feature coming soon')}>
            + Add Ticket
          </button>
        </header>

        {loading ? (
          <div className="admin-loading">
            <Spinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">💬</div>
              <h3 className="admin-empty-title">No support tickets</h3>
              <p className="admin-empty-text">All tickets have been resolved. Great job!</p>
            </div>
          </div>
        ) : (
          <div className="admin-tickets-list">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="admin-ticket-card">
                <div className="admin-ticket-header">
                  <div className="admin-ticket-info">
                    <div className="admin-ticket-title-row">
                      <span className="admin-ticket-id">#{ticket.id.substring(0, 8)}</span>
                      <h3 className="admin-ticket-title">{ticket.title}</h3>
                    </div>
                    <p className="admin-ticket-description">{ticket.description}</p>
                    <div className="admin-ticket-meta">
                      <span>From: <strong>{ticket.client_name}</strong></span>
                      <span className="admin-ticket-date">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="admin-ticket-actions">
                    <span className={`admin-badge ${getStatusClass(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`admin-badge ${getPriorityClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                      <button className="btn btn-primary btn-sm" onClick={() => toast.success('Resolve feature coming soon')}>
                        {ticket.status === 'open' ? 'Start' : 'Resolve'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
