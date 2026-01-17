/**
 * ActivityDetailModal Component
 * Modal for displaying detailed activity information in admin dashboard
 */

import { ReactElement } from 'react';
import { formatFullDateFR } from '@/utils/formatters';
import './ActivityDetailModal.css';

/** Activity user data */
interface ActivityUser {
  email: string;
  name?: string;
}

/** Activity client data */
interface ActivityClient {
  name: string;
}

/** Activity data structure */
export interface Activity {
  id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  user?: ActivityUser;
  client?: ActivityClient;
  ip_address?: string;
  changes?: Record<string, unknown>;
  created_at: string;
}

/** Formatted activity display config */
interface FormattedActivity {
  label: string;
  color: 'success' | 'neutral' | 'error' | 'warning';
  icon: ReactElement;
}

export interface ActivityDetailModalProps {
  /** Activity to display */
  activity: Activity | null;
  /** Close handler */
  onClose: () => void;
  /** Navigate to resource handler */
  onNavigateToResource: (activity: Activity) => void;
  /** Format activity function */
  formatActivity: (activity: Activity) => FormattedActivity;
}

/**
 * Modal for displaying activity details
 */
export function ActivityDetailModal({
  activity,
  onClose,
  onNavigateToResource,
  formatActivity
}: ActivityDetailModalProps): JSX.Element | null {
  if (!activity) return null;

  const formatted = formatActivity(activity);

  return (
    <>
      {/* Backdrop */}
      <div className="admin-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="admin-activity-detail">
        <div className="admin-activity-detail-header">
          <div className="admin-activity-detail-icon">
            {formatted.icon}
          </div>
          <h3 className="admin-activity-detail-title">
            Details de l'activite
          </h3>
          <button
            className="admin-activity-detail-close"
            onClick={onClose}
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
                {formatted.label}
              </span>
            </div>

            <div className="admin-activity-detail-item">
              <span className="admin-activity-detail-label">Date</span>
              <span className="admin-activity-detail-value">
                {formatFullDateFR(activity.created_at)}
              </span>
            </div>

            {activity.user && (
              <div className="admin-activity-detail-item">
                <span className="admin-activity-detail-label">Utilisateur</span>
                <span className="admin-activity-detail-value">
                  {activity.user.name || activity.user.email}
                  {activity.user.name && (
                    <span className="admin-activity-detail-sub">
                      {activity.user.email}
                    </span>
                  )}
                </span>
              </div>
            )}

            {activity.client && (
              <div className="admin-activity-detail-item">
                <span className="admin-activity-detail-label">Client</span>
                <span className="admin-activity-detail-value">
                  {activity.client.name}
                </span>
              </div>
            )}

            {activity.resource_type && (
              <div className="admin-activity-detail-item">
                <span className="admin-activity-detail-label">Ressource</span>
                <span className="admin-activity-detail-value">
                  {activity.resource_type}
                  {activity.resource_id && (
                    <span className="admin-activity-detail-sub">
                      ID: {activity.resource_id.slice(0, 8)}...
                    </span>
                  )}
                </span>
              </div>
            )}

            {activity.ip_address && (
              <div className="admin-activity-detail-item">
                <span className="admin-activity-detail-label">Adresse IP</span>
                <span className="admin-activity-detail-value admin-activity-detail-mono">
                  {activity.ip_address}
                </span>
              </div>
            )}
          </div>

          {/* Changes */}
          {activity.changes && Object.keys(activity.changes).length > 0 && (
            <div className="admin-activity-detail-changes">
              <span className="admin-activity-detail-label">Modifications</span>
              <div className="admin-activity-detail-changes-list">
                {Object.entries(activity.changes).map(([key, value]) => (
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
          {activity.resource_type && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigateToResource(activity)}
              style={{ marginTop: '20px', width: '100%' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
              {getResourceNavigationLabel(activity.resource_type)}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Get navigation button label for resource type
 */
function getResourceNavigationLabel(resourceType: string): string {
  const labels: Record<string, string> = {
    user: 'Voir les utilisateurs',
    client: 'Voir les clients',
    workflow: 'Voir les workflows',
    ticket: 'Voir les tickets'
  };
  return labels[resourceType] || 'Voir la ressource';
}
