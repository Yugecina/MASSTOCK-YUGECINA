import { useEffect, useState, ChangeEvent } from 'react';
import useAdminClientStore from '../../store/adminClientStore';
import { Spinner } from '../ui/Spinner';
import type { ClientTabProps, ExecutionFilters, ExecutionWithDetails } from '../../types/admin';
import type { ExecutionStatus } from '../../types';

/**
 * ClientExecutionsTab - List and filter client executions
 */
export function ClientExecutionsTab({ clientId }: ClientTabProps) {
  const [filters, setFilters] = useState<ExecutionFilters>({
    status: '',
    workflow_id: '',
    page: 1,
    limit: 20
  });

  const {
    executions,
    executionsLoading,
    executionsError,
    executionsPagination,
    executionsStats,
    workflows,
    fetchExecutions,
    fetchWorkflows
  } = useAdminClientStore();

  useEffect(() => {
    fetchExecutions(clientId, filters);
    fetchWorkflows(clientId); // For filter dropdown
  }, [clientId, fetchExecutions, fetchWorkflows]);

  const handleFilterChange = (key: keyof ExecutionFilters, value: string | number) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    fetchExecutions(clientId, newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    fetchExecutions(clientId, newFilters);
  };

  const getStatusColor = (status: ExecutionStatus): string => {
    switch (status) {
      case 'completed': return 'admin-badge--success';
      case 'failed': return 'admin-badge--danger';
      case 'processing': return 'admin-badge--warning';
      case 'pending': return 'admin-badge--info';
      default: return '';
    }
  };

  if (executionsLoading && executions.length === 0) {
    return (
      <div className="admin-loading">
        <Spinner size="md" />
      </div>
    );
  }

  if (executionsError) {
    return (
      <div className="admin-card">
        <div className="admin-empty">
          <div className="admin-empty-icon">❌</div>
          <h3 className="admin-empty-title">Error loading executions</h3>
          <p className="admin-empty-text">{executionsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tab-executions">
      {/* Stats */}
      <div className="admin-execution-stats">
        <div className="admin-execution-stat admin-execution-stat--total">
          <span className="admin-execution-stat-value">{executionsStats.total}</span>
          <span className="admin-execution-stat-label">Total</span>
        </div>
        <div className="admin-execution-stat admin-execution-stat--success">
          <span className="admin-execution-stat-value">{executionsStats.completed}</span>
          <span className="admin-execution-stat-label">Completed</span>
        </div>
        <div className="admin-execution-stat admin-execution-stat--danger">
          <span className="admin-execution-stat-value">{executionsStats.failed}</span>
          <span className="admin-execution-stat-label">Failed</span>
        </div>
        <div className="admin-execution-stat admin-execution-stat--warning">
          <span className="admin-execution-stat-value">{executionsStats.processing}</span>
          <span className="admin-execution-stat-label">Processing</span>
        </div>
        <div className="admin-execution-stat admin-execution-stat--info">
          <span className="admin-execution-stat-value">{executionsStats.pending}</span>
          <span className="admin-execution-stat-label">Pending</span>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filter">
          <label className="admin-filter-label">Status</label>
          <select
            className="admin-select"
            value={filters.status}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="admin-filter">
          <label className="admin-filter-label">Workflow</label>
          <select
            className="admin-select"
            value={filters.workflow_id}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('workflow_id', e.target.value)}
          >
            <option value="">All Workflows</option>
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id}>{wf.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Executions List */}
      {executions.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <div className="admin-empty-icon">🔄</div>
            <h3 className="admin-empty-title">No executions found</h3>
            <p className="admin-empty-text">No executions match your current filters</p>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Workflow</th>
                  <th>Status</th>
                  <th>Triggered By</th>
                  <th>Started</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exec: ExecutionWithDetails) => (
                  <tr key={exec.id}>
                    <td className="admin-table-id">{exec.id.slice(0, 8)}...</td>
                    <td>{exec.workflow?.name || 'Unknown'}</td>
                    <td>
                      <span className={`admin-badge ${getStatusColor(exec.status)}`}>
                        {exec.status}
                      </span>
                    </td>
                    <td>{exec.triggered_by_user?.email || '-'}</td>
                    <td>
                      {exec.started_at
                        ? new Date(exec.started_at).toLocaleString()
                        : exec.created_at
                          ? new Date(exec.created_at).toLocaleString()
                          : '-'
                      }
                    </td>
                    <td>
                      {exec.duration_seconds
                        ? `${exec.duration_seconds}s`
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {executionsPagination.total_pages > 1 && (
            <div className="admin-pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={executionsPagination.page <= 1}
                onClick={() => handlePageChange(executionsPagination.page - 1)}
              >
                Previous
              </button>
              <span className="admin-pagination-info">
                Page {executionsPagination.page} of {executionsPagination.total_pages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={executionsPagination.page >= executionsPagination.total_pages}
                onClick={() => handlePageChange(executionsPagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
