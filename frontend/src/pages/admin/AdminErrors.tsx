/**
 * AdminErrors Page - TypeScript
 * Error tracking and monitoring page
 * PURE CSS ONLY - No Tailwind
 */

import { useState, useEffect } from 'react';
import { Spinner } from '../../components/ui/Spinner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminDashboardService } from '../../services/adminDashboardService';
import logger from '@/utils/logger';

interface ErrorLog {
  id?: string;
  type: string;
  message: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  count: number;
  last_seen: string;
  stack?: string;
}

interface ErrorsResponse {
  errors: ErrorLog[];
}

/**
 * AdminErrors Component
 * Dark Premium Style - System errors and performance monitoring
 */
export function AdminErrors() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadErrors() {
      try {
        logger.debug('🔥 AdminErrors: Loading errors...');
        const data: ErrorsResponse = await adminDashboardService.getErrors();
        logger.debug('✅ AdminErrors: Data loaded:', data);
        setErrors(data.errors || []);
      } catch (err: any) {
        logger.error('❌ AdminErrors: Failed to fetch errors:', err);
      } finally {
        setLoading(false);
      }
    }
    loadErrors();
  }, []);

  const getSeverityClass = (severity?: string): string => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'admin-badge--danger';
      case 'error':
        return 'admin-badge--danger';
      case 'warning':
        return 'admin-badge--warning';
      default:
        return '';
    }
  };

  const criticalCount = errors.filter(e => e.severity?.toLowerCase() === 'critical').length;
  const warningCount = errors.filter(e => e.severity?.toLowerCase() === 'warning').length;

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Errors & Logs</h1>
            <p className="admin-subtitle">System errors and performance monitoring</p>
          </div>
        </header>

        {loading ? (
          <div className="admin-loading">
            <Spinner size="lg" />
          </div>
        ) : errors.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">✅</div>
              <h3 className="admin-empty-title">No errors detected</h3>
              <p className="admin-empty-text">System is running smoothly with no logged errors</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="admin-errors-summary">
              <div className="admin-errors-total">
                <span className="admin-errors-total-label">Total Errors</span>
                <span className="admin-errors-total-value">{errors.length}</span>
              </div>
              <div className="admin-errors-breakdown">
                <div className="admin-errors-breakdown-item admin-errors-breakdown-item--critical">
                  <span className="admin-errors-breakdown-label">CRITICAL</span>
                  <span className="admin-errors-breakdown-value">{criticalCount}</span>
                </div>
                <div className="admin-errors-breakdown-item admin-errors-breakdown-item--warning">
                  <span className="admin-errors-breakdown-label">WARNING</span>
                  <span className="admin-errors-breakdown-value">{warningCount}</span>
                </div>
              </div>
            </div>

            {/* Error List */}
            <div className="admin-errors-list">
              {errors.map((error, idx) => (
                <article
                  key={error.id || idx}
                  className={`admin-error-card ${error.severity?.toLowerCase() === 'critical' ? 'admin-error-card--critical' : ''}`}
                >
                  <div className="admin-error-header">
                    <div>
                      <div className="admin-error-title-row">
                        <h3 className="admin-error-type">{error.type}</h3>
                        <span className={`admin-badge ${getSeverityClass(error.severity)}`}>
                          {error.severity}
                        </span>
                      </div>
                      <p className="admin-error-message">{error.message}</p>
                      <div className="admin-error-meta">
                        <span>Occurrences: <strong>{error.count}</strong></span>
                        <span>Last seen: {new Date(error.last_seen).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {error.stack && (
                    <pre className="admin-error-stack">{error.stack}</pre>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
