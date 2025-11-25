import { useState } from 'react'
import useAdminClientStore from '../../store/adminClientStore'
import { Spinner } from '../ui/Spinner'
import { EditClientModal } from './EditClientModal'

/**
 * SVG Icons - Clean, minimal line icons
 */
const Icons = {
  workflow: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  executions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1.03 6.5 2.75" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  revenue: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  ticket: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  company: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  creditCard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

/**
 * ClientOverviewTab - Overview stats and info with compact design
 * Dark Premium Style - Bleu Pétrole accent
 */
export function ClientOverviewTab({ clientId }) {
  const { client, clientLoading, fetchClientDetail } = useAdminClientStore()
  const [showEditModal, setShowEditModal] = useState(false)

  console.log('📊 ClientOverviewTab: Render', {
    clientId,
    client,
    clientLoading
  })

  const clientData = client?.client || client
  const stats = client?.stats || {}

  console.log('📊 ClientOverviewTab: Data extracted', {
    clientData,
    stats,
    clientDataKeys: clientData ? Object.keys(clientData) : [],
    statsKeys: Object.keys(stats)
  })

  if (clientLoading) {
    return (
      <div className="admin-loading">
        <Spinner size="md" />
      </div>
    )
  }

  const handleEditSuccess = () => {
    fetchClientDetail(clientId)
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="client-overview">
      {/* Stats Pills - Compact inline display */}
      <div className="client-stats-pills">
        <div className="client-stat-pill">
          <span className="client-stat-pill-icon">{Icons.workflow}</span>
          <span className="client-stat-pill-value">{stats.total_workflows || 0}</span>
          <span className="client-stat-pill-label">Workflows</span>
        </div>

        <div className="client-stat-pill">
          <span className="client-stat-pill-icon">{Icons.executions}</span>
          <span className="client-stat-pill-value">{stats.total_executions || 0}</span>
          <span className="client-stat-pill-label">Total Executions</span>
        </div>

        <div className="client-stat-pill" data-type="success">
          <span className="client-stat-pill-icon">{Icons.success}</span>
          <span className="client-stat-pill-value">{stats.success_rate || 0}%</span>
          <span className="client-stat-pill-label">Success Rate</span>
        </div>

        <div className="client-stat-pill" data-type="revenue">
          <span className="client-stat-pill-icon">{Icons.revenue}</span>
          <span className="client-stat-pill-value">${stats.revenue_this_month || '0.00'}</span>
          <span className="client-stat-pill-label">Revenue/Month</span>
        </div>

        <div className="client-stat-pill">
          <span className="client-stat-pill-icon">{Icons.calendar}</span>
          <span className="client-stat-pill-value">{stats.executions_this_month || 0}</span>
          <span className="client-stat-pill-label">This Month</span>
        </div>

        <div className="client-stat-pill" data-type={stats.open_tickets > 0 ? 'warning' : ''}>
          <span className="client-stat-pill-icon">{Icons.ticket}</span>
          <span className="client-stat-pill-value">{stats.open_tickets || 0}</span>
          <span className="client-stat-pill-label">Open Tickets</span>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="client-info-card">
        <div className="client-info-header">
          <h3 className="client-info-title">Client Information</h3>
          <button
            className="btn btn-secondary btn-sm client-edit-btn"
            onClick={() => setShowEditModal(true)}
          >
            {Icons.edit}
            <span>Edit</span>
          </button>
        </div>

        <div className="client-info-grid">
          <div className="client-info-row">
            <div className="client-info-item">
              <span className="client-info-icon">{Icons.company}</span>
              <div className="client-info-content">
                <span className="client-info-label">Company Name</span>
                <span className="client-info-value">{clientData?.company_name || clientData?.name || '-'}</span>
              </div>
            </div>

            <div className="client-info-item">
              <span className="client-info-icon">{Icons.user}</span>
              <div className="client-info-content">
                <span className="client-info-label">Contact Name</span>
                <span className="client-info-value">{clientData?.name || '-'}</span>
              </div>
            </div>

            <div className="client-info-item">
              <span className="client-info-icon">{Icons.mail}</span>
              <div className="client-info-content">
                <span className="client-info-label">Email</span>
                <span className="client-info-value client-info-value--mono">{clientData?.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="client-info-row">
            <div className="client-info-item">
              <span className="client-info-icon">{Icons.creditCard}</span>
              <div className="client-info-content">
                <span className="client-info-label">Plan</span>
                <span className="client-info-value">
                  <span className="client-plan-badge">{clientData?.plan || '-'}</span>
                </span>
              </div>
            </div>

            <div className="client-info-item">
              <span className="client-info-icon">{Icons.revenue}</span>
              <div className="client-info-content">
                <span className="client-info-label">Subscription</span>
                <span className="client-info-value client-info-value--highlight">
                  ${clientData?.subscription_amount || '0'}/month
                </span>
              </div>
            </div>

            <div className="client-info-item">
              <span className="client-info-icon">{Icons.success}</span>
              <div className="client-info-content">
                <span className="client-info-label">Status</span>
                <span className="client-info-value">
                  <span className={`client-status-badge ${clientData?.status === 'active' ? 'client-status-badge--active' : 'client-status-badge--inactive'}`}>
                    {clientData?.status || '-'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="client-info-row">
            <div className="client-info-item">
              <span className="client-info-icon">{Icons.clock}</span>
              <div className="client-info-content">
                <span className="client-info-label">Created At</span>
                <span className="client-info-value client-info-value--muted">
                  {formatDate(clientData?.created_at)}
                </span>
              </div>
            </div>

            <div className="client-info-item">
              <span className="client-info-icon">{Icons.calendar}</span>
              <div className="client-info-content">
                <span className="client-info-label">Subscription Start</span>
                <span className="client-info-value client-info-value--muted">
                  {formatDate(clientData?.subscription_start_date)}
                </span>
              </div>
            </div>

            <div className="client-info-item client-info-item--empty"></div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditClientModal
          client={clientData}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
