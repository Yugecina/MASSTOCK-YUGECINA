/**
 * AdminDashboard - Dark Premium Style
 * Displays real-time platform metrics and activity with modal details
 */

import { useState, useEffect, ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ActivityDetailModal, Activity } from '../../components/modals/ActivityDetailModal';
import { adminDashboardService } from '../../services/adminDashboardService';
import { getActivityIcon } from '../../components/icons/AdminIcons';
import { formatCurrency, formatPercent, getTimeAgoFR, formatFullDateFR } from '@/utils/formatters';
import logger from '@/utils/logger';

/** Dashboard Data Types */
interface DashboardMetric {
  label: string;
  value: string;
  status: 'success' | 'neutral' | 'error';
  icon: ReactElement;
}

interface DashboardData {
  uptime_percent?: number;
  errors_24h?: number;
  total_executions_24h?: number;
  total_revenue_month?: number;
  active_clients?: number;
  recent_activity?: Activity[];
}

interface FormattedActivity {
  label: string;
  color: 'success' | 'neutral' | 'error' | 'warning';
  icon: ReactElement;
  description: string;
}

/** Activity action configuration */
const ACTIVITY_CONFIG: Record<string, { label: string; color: 'success' | 'neutral' | 'error' | 'warning' }> = {
  'user_created_by_admin': { label: 'Utilisateur cree', color: 'success' },
  'user_updated': { label: 'Utilisateur modifie', color: 'neutral' },
  'user_deleted': { label: 'Utilisateur supprime', color: 'error' },
  'user_login': { label: 'Connexion', color: 'neutral' },
  'user_logout': { label: 'Deconnexion', color: 'neutral' },
  'client_created': { label: 'Client cree', color: 'success' },
  'client_updated': { label: 'Client modifie', color: 'neutral' },
  'client_deleted': { label: 'Client supprime', color: 'error' },
  'client_suspended': { label: 'Client suspendu', color: 'warning' },
  'workflow_created': { label: 'Workflow cree', color: 'success' },
  'workflow_updated': { label: 'Workflow modifie', color: 'neutral' },
  'workflow_deleted': { label: 'Workflow supprime', color: 'error' },
  'workflow_executed': { label: 'Workflow execute', color: 'success' },
  'workflow_failed': { label: 'Workflow echoue', color: 'error' },
  'workflow_request_created': { label: 'Demande creee', color: 'success' },
  'workflow_request_approved': { label: 'Demande approuvee', color: 'success' },
  'workflow_request_rejected': { label: 'Demande rejetee', color: 'error' },
  'ticket_created': { label: 'Ticket cree', color: 'neutral' },
  'ticket_replied': { label: 'Reponse ticket', color: 'neutral' },
  'ticket_closed': { label: 'Ticket ferme', color: 'success' },
  'settings_updated': { label: 'Parametres modifies', color: 'neutral' }
};

/** Resource navigation routes */
const RESOURCE_ROUTES: Record<string, string> = {
  'user': '/admin/users',
  'client': '/admin/clients',
  'workflow': '/admin/workflows',
  'ticket': '/admin/tickets',
  'workflow_request': '/admin/workflows'
};

/** Metric icons */
const UptimeIcon = (): ReactElement => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ErrorIcon = (): ReactElement => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const PlayIcon = (): ReactElement => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const DollarIcon = (): ReactElement => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const BuildingIcon = (): ReactElement => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9v.01" />
    <path d="M9 12v.01" />
    <path d="M9 15v.01" />
  </svg>
);

const EmptyIcon = (): ReactElement => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

/** Format activity for display */
function formatActivity(activity: Activity): FormattedActivity {
  const config = ACTIVITY_CONFIG[activity.action] || {
    label: activity.action?.replace(/_/g, ' ') || 'Action',
    color: 'neutral' as const
  };

  const icon = getActivityIcon(activity.action);

  let description = '';
  if (activity.user?.email) {
    description = `par ${activity.user.name || activity.user.email}`;
  }
  if (activity.client?.name) {
    description += description ? ` - ${activity.client.name}` : activity.client.name;
  }

  return { ...config, icon, description };
}

/** Build metrics from dashboard data */
function buildMetrics(dashboard: DashboardData | null): DashboardMetric[] {
  const uptimePercent = dashboard?.uptime_percent || 0;
  const errors24h = dashboard?.errors_24h || 0;

  return [
    {
      label: 'Uptime',
      value: formatPercent(dashboard?.uptime_percent),
      status: uptimePercent >= 99 ? 'success' : uptimePercent >= 95 ? 'neutral' : 'error',
      icon: <UptimeIcon />
    },
    {
      label: 'Erreurs (24h)',
      value: dashboard?.errors_24h?.toString() || '0',
      status: errors24h === 0 ? 'success' : errors24h <= 5 ? 'neutral' : 'error',
      icon: <ErrorIcon />
    },
    {
      label: 'Executions (24h)',
      value: dashboard?.total_executions_24h?.toString() || '0',
      status: 'neutral',
      icon: <PlayIcon />
    },
    {
      label: 'Revenu (mois)',
      value: formatCurrency(dashboard?.total_revenue_month),
      status: 'neutral',
      icon: <DollarIcon />
    },
    {
      label: 'Clients actifs',
      value: dashboard?.active_clients?.toString() || '0',
      status: 'neutral',
      icon: <BuildingIcon />
    }
  ];
}

export function AdminDashboard(): JSX.Element {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    async function loadDashboard(): Promise<void> {
      try {
        logger.debug('AdminDashboard: Loading dashboard data...');
        const response = await adminDashboardService.getDashboard();
        logger.debug('AdminDashboard: Data loaded', response);
        setDashboard(response.data || response);
      } catch (err) {
        const e = err as Error;
        logger.error('AdminDashboard: Failed to fetch dashboard', {
          error: e,
          message: e.message,
          response: (e as Record<string, unknown>).response
        });
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  function handleNavigateToResource(activity: Activity): void {
    const route = activity.resource_type ? RESOURCE_ROUTES[activity.resource_type] : null;
    if (route) {
      navigate(route);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page admin-loading">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="admin-page">
          <div className="admin-empty">
            <div className="admin-empty-icon">Warning</div>
            <p className="admin-empty-text">Erreur de chargement: {error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const metrics = buildMetrics(dashboard);
  const activities = dashboard?.recent_activity || [];

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Dashboard</h1>
            <p className="admin-subtitle">Vue d'ensemble de la plateforme</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          {metrics.map((metric, index) => (
            <div key={index} className="admin-stat-card">
              <div className="admin-stat-card-header">
                <span className="admin-stat-icon">{metric.icon}</span>
                <span className="admin-stat-label">{metric.label}</span>
              </div>
              <span className={`admin-stat-value ${metric.status === 'success' ? 'admin-stat-value--success' : metric.status === 'error' ? 'admin-stat-value--error' : ''}`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <section className="admin-section">
          <h2 className="admin-section-title">Activite recente</h2>

          {activities.length > 0 ? (
            <div className="admin-activity-list">
              {activities.map((activity, idx) => {
                const formatted = formatActivity(activity);
                return (
                  <div
                    key={activity.id || idx}
                    className={`admin-activity-item ${selectedActivity?.id === activity.id ? 'admin-activity-item--selected' : ''}`}
                    onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
                  >
                    <div className={`admin-activity-icon admin-activity-icon--${formatted.color}`}>
                      {formatted.icon}
                    </div>
                    <div className="admin-activity-content">
                      <span className="admin-activity-label">{formatted.label}</span>
                      {formatted.description && (
                        <span className="admin-activity-desc">{formatted.description}</span>
                      )}
                    </div>
                    <span className="admin-activity-time">{getTimeAgoFR(activity.created_at)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty">
              <div className="admin-empty-icon"><EmptyIcon /></div>
              <p className="admin-empty-text">Aucune activite recente</p>
            </div>
          )}
        </section>

        {/* Activity Detail Modal */}
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onNavigateToResource={handleNavigateToResource}
          formatActivity={formatActivity}
        />
      </div>
    </AdminLayout>
  );
}
