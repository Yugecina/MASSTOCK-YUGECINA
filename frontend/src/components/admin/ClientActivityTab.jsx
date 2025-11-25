import { useEffect } from 'react'
import useAdminClientStore from '../../store/adminClientStore'
import { Spinner } from '../ui/Spinner'
import logger from '@/utils/logger'

/**
 * ClientActivityTab - Audit log timeline
 */
export function ClientActivityTab({ clientId }) {
  const {
    activity,
    activityLoading,
    activityError,
    activityTotal,
    fetchActivity
  } = useAdminClientStore()

  useEffect(() => {
    fetchActivity(clientId, { limit: 50 })
  }, [clientId, fetchActivity])

  const getActionIcon = (action) => {
    if (action.includes('member')) return '👥'
    if (action.includes('workflow')) return '⚡'
    if (action.includes('execution')) return '🔄'
    if (action.includes('client')) return '🏢'
    if (action.includes('ticket')) return '🎫'
    return '📝'
  }

  const getActionColor = (action) => {
    if (action.includes('created') || action.includes('added') || action.includes('assigned')) return 'admin-activity--success'
    if (action.includes('deleted') || action.includes('removed') || action.includes('archived')) return 'admin-activity--danger'
    if (action.includes('updated') || action.includes('changed')) return 'admin-activity--warning'
    return ''
  }

  const formatAction = (action) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  if (activityLoading) {
    return (
      <div className="admin-loading">
        <Spinner size="md" />
      </div>
    )
  }

  if (activityError) {
    return (
      <div className="admin-card">
        <div className="admin-empty">
          <div className="admin-empty-icon">❌</div>
          <h3 className="admin-empty-title">Error loading activity</h3>
          <p className="admin-empty-text">{activityError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-tab-activity">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h3 className="admin-section-title">Activity Log</h3>
          <p className="admin-section-subtitle">
            {activityTotal} event{activityTotal !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </div>

      {/* Activity Timeline */}
      {activity.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <div className="admin-empty-icon">📜</div>
            <h3 className="admin-empty-title">No activity yet</h3>
            <p className="admin-empty-text">Actions on this client will appear here</p>
          </div>
        </div>
      ) : (
        <div className="admin-activity-timeline">
          {activity.map((item, index) => (
            <div key={item.id} className={`admin-activity-item ${getActionColor(item.action)}`}>
              <div className="admin-activity-icon">
                {getActionIcon(item.action)}
              </div>
              <div className="admin-activity-content">
                <div className="admin-activity-header">
                  <span className="admin-activity-action">{formatAction(item.action)}</span>
                  <span className="admin-activity-time">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="admin-activity-details">
                  {item.user?.email && (
                    <span className="admin-activity-user">By: {item.user.email}</span>
                  )}
                  {item.resource_type && (
                    <span className="admin-activity-resource">
                      {item.resource_type}: {item.resource_id?.slice(0, 8)}...
                    </span>
                  )}
                </div>
                {item.changes && Object.keys(item.changes).length > 0 && (
                  <div className="admin-activity-changes">
                    <pre>{JSON.stringify(item.changes, null, 2)}</pre>
                  </div>
                )}
                {item.ip_address && (
                  <span className="admin-activity-meta">IP: {item.ip_address}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
