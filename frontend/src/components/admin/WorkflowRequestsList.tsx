import React, { ChangeEvent } from 'react';
import type { WorkflowRequest, WorkflowRequestStatus } from '../../types/admin';

interface WorkflowRequestsListProps {
  requests?: WorkflowRequest[];
  onUpdateStage: (requestId: string, newStage: WorkflowRequestStatus) => void;
  loading?: boolean;
}

const STAGE_OPTIONS: WorkflowRequestStatus[] = [
  'draft',
  'submitted',
  'reviewing',
  'negotiation',
  'contract_signed',
  'development',
  'deployed',
  'rejected',
];

const TERMINAL_STAGES: WorkflowRequestStatus[] = ['deployed', 'rejected'];

/**
 * WorkflowRequestsList Component
 * Displays workflow requests as cards with stage management
 */
export function WorkflowRequestsList({ requests = [], onUpdateStage, loading = false }: WorkflowRequestsListProps) {
  const getStatusBadgeClass = (status: WorkflowRequestStatus): string => {
    switch (status) {
      case 'deployed':
        return 'badge-success';
      case 'rejected':
        return 'badge-error';
      case 'draft':
        return 'badge-neutral';
      case 'submitted':
      case 'reviewing':
        return 'badge-warning';
      case 'negotiation':
      case 'contract_signed':
      case 'development':
        return 'badge badge-success';
      default:
        return 'badge-neutral';
    }
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US')}`;
  };

  const handleStageChange = (requestId: string, newStage: WorkflowRequestStatus) => {
    try {
      onUpdateStage(requestId, newStage);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto', borderRadius: '50%', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary)' }}></div>
        <p className="text-neutral-600" style={{ marginTop: 'var(--spacing-md)' }}>Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <p className="text-neutral-600">No workflow requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const isTerminal = TERMINAL_STAGES.includes(request.status);

        return (
          <div
            key={request.id}
            data-testid="request-item"
            className="card"
            style={{
              padding: 'var(--spacing-lg)',
              transition: 'all 200ms ease',
            }}
          >
            <div className="flex flex-col gap-md">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-h3" style={{ marginBottom: 'var(--spacing-xs)' }}>
                    {request.title}
                  </h3>
                  {request.description && (
                    <p className="text-body-sm text-neutral-600">
                      {request.description}
                    </p>
                  )}
                </div>
                <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                  {request.status}
                </span>
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-lg">
                <div>
                  <p className="text-label text-neutral-500" style={{ marginBottom: 'var(--spacing-xs)' }}>
                    BUDGET
                  </p>
                  <p className="text-body font-semibold text-neutral-900">
                    {formatCurrency(request.budget)}
                  </p>
                </div>
                <div>
                  <p className="text-label text-neutral-500" style={{ marginBottom: 'var(--spacing-xs)' }}>
                    TIMELINE
                  </p>
                  <p className="text-body font-semibold text-neutral-900">
                    {request.timeline_days} days
                  </p>
                </div>
                <div>
                  <p className="text-label text-neutral-500" style={{ marginBottom: 'var(--spacing-xs)' }}>
                    CLIENT ID
                  </p>
                  <p className="text-body-sm text-neutral-600 font-mono">
                    {request.client_id}
                  </p>
                </div>
              </div>

              {/* Stage Advancement */}
              {!isTerminal && (
                <div className="border-t" style={{ paddingTop: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                  <div className="flex items-center gap-md">
                    <label
                      htmlFor={`stage-select-${request.id}`}
                      className="text-label text-neutral-700"
                    >
                      UPDATE STAGE:
                    </label>
                    <select
                      id={`stage-select-${request.id}`}
                      value={request.status}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => handleStageChange(request.id, e.target.value as WorkflowRequestStatus)}
                      disabled={loading}
                      style={{
                        padding: '8px 12px',
                        fontSize: 'var(--font-size-body-sm)',
                        border: '1px solid var(--neutral-200)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        minWidth: '200px',
                      }}
                    >
                      {STAGE_OPTIONS.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
