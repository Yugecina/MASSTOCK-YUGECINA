import React, { MouseEvent } from 'react';
import type { WorkflowWithStats } from '../../types/admin';
import type { WorkflowStatus } from '../../types';

interface WorkflowTableProps {
  workflows?: WorkflowWithStats[];
  onViewDetails: (id: string) => void;
  onArchive: (id: string) => void;
  loading?: boolean;
}

/**
 * WorkflowTable Component
 * Displays workflows in a table format with actions
 */
export function WorkflowTable({ workflows = [], onViewDetails, onArchive, loading = false }: WorkflowTableProps) {
  const getStatusBadgeClass = (status: WorkflowStatus): string => {
    switch (status) {
      case 'deployed':
        return 'badge-success';
      case 'draft':
        return 'badge-warning';
      case 'archived':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  };

  const formatCurrency = (value: number | string): string => {
    const num = parseFloat(String(value));
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSuccessRate = (rate: number | string): string => {
    const rateStr = String(rate);
    return rateStr === '0' ? '0%' : `${rateStr}%`;
  };

  const truncateId = (id: string): string => {
    if (!id) return '';
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto', borderRadius: '50%', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary)' }}></div>
        <p className="text-neutral-600" style={{ marginTop: 'var(--spacing-md)' }}>Loading workflows...</p>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <p className="text-neutral-600">No workflows found</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ID
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Name
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Client
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Status
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Executions
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Success Rate
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Revenue
              </th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((workflow) => (
              <tr
                key={workflow.id}
                style={{
                  borderBottom: '1px solid var(--neutral-200)',
                  transition: 'background-color 200ms ease',
                }}
                onMouseEnter={(e: MouseEvent<HTMLTableRowElement>) => (e.currentTarget.style.backgroundColor = 'var(--neutral-50)')}
                onMouseLeave={(e: MouseEvent<HTMLTableRowElement>) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-600)', fontFamily: 'monospace' }}>
                  {truncateId(workflow.id)}
                </td>
                <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-900)', fontWeight: '500' }}>
                  {workflow.name}
                </td>
                <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-600)' }}>
                  {workflow.client_id}
                </td>
                <td style={{ padding: 'var(--spacing-md)' }}>
                  <span className={`badge ${getStatusBadgeClass(workflow.status)}`}>
                    {workflow.status}
                  </span>
                </td>
                <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-900)' }}>
                  {workflow.stats?.total_executions || 0}
                </td>
                <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-900)' }}>
                  {formatSuccessRate(workflow.stats?.success_rate || 0)}
                </td>
                <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--font-size-body-sm)', color: 'var(--neutral-900)', fontWeight: '500' }}>
                  {formatCurrency(workflow.stats?.total_revenue || 0)}
                </td>
                <td style={{ padding: 'var(--spacing-md)' }}>
                  <div className="flex gap-sm">
                    <button
                      className="btn-sm btn-secondary"
                      onClick={() => onViewDetails(workflow.id)}
                      disabled={loading}
                    >
                      View
                    </button>
                    {workflow.status !== 'archived' && (
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => onArchive(workflow.id)}
                        disabled={loading}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
