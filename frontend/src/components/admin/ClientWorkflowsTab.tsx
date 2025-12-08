import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAdminClientStore from '../../store/adminClientStore';
import { Spinner } from '../ui/Spinner';
import { AssignWorkflowModal } from './AssignWorkflowModal';
import type { ClientTabProps, WorkflowWithStats } from '../../types/admin';

/**
 * ClientWorkflowsTab - List and manage client workflows
 */
export function ClientWorkflowsTab({ clientId }: ClientTabProps) {
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);

  const {
    workflows,
    workflowsLoading,
    workflowsError,
    fetchWorkflows,
    removeWorkflow
  } = useAdminClientStore();

  console.log('⚡ ClientWorkflowsTab: Render', {
    clientId,
    workflows,
    workflowsLoading,
    workflowsError
  });

  useEffect(() => {
    console.log('⚡ ClientWorkflowsTab: useEffect - fetching workflows', { clientId });
    fetchWorkflows(clientId);
  }, [clientId, fetchWorkflows]);

  const handleRemove = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Archive workflow "${workflowName}"? It will no longer be accessible.`)) return;

    const result = await removeWorkflow(clientId, workflowId);
    if (result.success) {
      toast.success('Workflow archived successfully');
    } else {
      toast.error(result.error || 'Failed to archive workflow');
    }
  };

  if (workflowsLoading) {
    return (
      <div className="admin-loading">
        <Spinner size="md" />
      </div>
    );
  }

  if (workflowsError) {
    return (
      <div className="admin-card">
        <div className="admin-empty">
          <div className="admin-empty-icon">❌</div>
          <h3 className="admin-empty-title">Error loading workflows</h3>
          <p className="admin-empty-text">{workflowsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tab-workflows">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h3 className="admin-section-title">Workflows</h3>
          <p className="admin-section-subtitle">
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} assigned to this client
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
          + Assign Workflow
        </button>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <div className="admin-empty-icon">⚡</div>
            <h3 className="admin-empty-title">No workflows assigned</h3>
            <p className="admin-empty-text">Assign a workflow template to get started</p>
          </div>
        </div>
      ) : (
        <div className="admin-workflows-list">
          {workflows.map((workflow: WorkflowWithStats) => (
            <div key={workflow.id} className="admin-workflow-card">
              <div className="admin-workflow-header">
                <div>
                  <h4 className="admin-workflow-name">{workflow.name}</h4>
                  <p className="admin-workflow-desc">{workflow.description || 'No description'}</p>
                </div>
                <span className={`admin-badge ${workflow.status === 'deployed' ? 'admin-badge--success' : 'admin-badge--warning'}`}>
                  {workflow.status}
                </span>
              </div>

              <div className="admin-workflow-stats">
                <div className="admin-workflow-stat">
                  <span className="admin-workflow-stat-value">{workflow.stats?.total_executions || 0}</span>
                  <span className="admin-workflow-stat-label">Executions</span>
                </div>
                <div className="admin-workflow-stat">
                  <span className="admin-workflow-stat-value">{workflow.stats?.success_rate || 0}%</span>
                  <span className="admin-workflow-stat-label">Success</span>
                </div>
                <div className="admin-workflow-stat">
                  <span className="admin-workflow-stat-value">${workflow.stats?.total_revenue || '0.00'}</span>
                  <span className="admin-workflow-stat-label">Revenue</span>
                </div>
                <div className="admin-workflow-stat">
                  <span className="admin-workflow-stat-value">${workflow.revenue_per_execution || '0.00'}</span>
                  <span className="admin-workflow-stat-label">Per Exec</span>
                </div>
              </div>

              <div className="admin-workflow-meta">
                <span>Type: {workflow.config?.workflow_type || 'Unknown'}</span>
                <span>Created: {workflow.created_at ? new Date(workflow.created_at).toLocaleDateString() : '-'}</span>
                {workflow.deployed_at && (
                  <span>Deployed: {new Date(workflow.deployed_at).toLocaleDateString()}</span>
                )}
              </div>

              <div className="admin-workflow-actions">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(workflow.id, workflow.name)}
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Workflow Modal */}
      {showAssignModal && (
        <AssignWorkflowModal
          clientId={clientId}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}
