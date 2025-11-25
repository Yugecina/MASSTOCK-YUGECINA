import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminWorkflowService } from '../../services/adminWorkflowService'
import logger from '@/utils/logger'

/**
 * AdminWorkflows - Dark Premium Style
 */
export function AdminWorkflows() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadWorkflows() {
      try {
        logger.debug('🔄 AdminWorkflows: Loading workflows...')
        const response = await adminWorkflowService.getWorkflows()
        logger.debug('✅ AdminWorkflows: Response received:', response)
        setWorkflows(response.data?.workflows || [])
      } catch (error) {
        logger.error('❌ AdminWorkflows: Failed to load workflows:', error)
        toast.error('Failed to load workflows')
      } finally {
        setLoading(false)
      }
    }
    loadWorkflows()
  }, [])

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Workflows Management</h1>
            <p className="admin-subtitle">Manage global workflow templates and configurations</p>
          </div>
          <button className="btn btn-primary" onClick={() => toast.info('Create Workflow feature coming soon')}>
            + Create Workflow
          </button>
        </header>

        {loading ? (
          <div className="admin-loading">
            <Spinner size="lg" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">🔄</div>
              <h3 className="admin-empty-title">No workflows found</h3>
              <p className="admin-empty-text">Create your first workflow template</p>
            </div>
          </div>
        ) : (
          <>
            <p className="admin-count">Total workflows: {workflows.length}</p>

            <div className="admin-workflow-list">
              {workflows.map((workflow) => (
                <article key={workflow.id} className="admin-workflow-card">
                  {/* Header */}
                  <div className="admin-workflow-header">
                    <div>
                      <div className="admin-workflow-title-row">
                        <h3 className="admin-workflow-name">{workflow.name}</h3>
                        <span className={`admin-badge ${workflow.config?.workflow_type === 'nano_banana' ? 'admin-badge--primary' : ''}`}>
                          {workflow.config?.workflow_type || 'standard'}
                        </span>
                      </div>
                      <p className="admin-workflow-description">
                        {workflow.description || 'No description available'}
                      </p>
                    </div>
                    <div className="admin-workflow-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => toast.info('Edit feature coming soon')}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => toast.error('Delete feature coming soon')}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="admin-workflow-stats">
                    <div className="admin-workflow-stat">
                      <span className="admin-workflow-stat-label">Executions</span>
                      <span className="admin-workflow-stat-value">{workflow.stats?.total_executions || 0}</span>
                    </div>
                    <div className="admin-workflow-stat">
                      <span className="admin-workflow-stat-label">Success Rate</span>
                      <span className="admin-workflow-stat-value admin-workflow-stat-value--success">
                        {workflow.stats?.success_rate || 0}%
                      </span>
                    </div>
                    <div className="admin-workflow-stat">
                      <span className="admin-workflow-stat-label">Revenue</span>
                      <span className="admin-workflow-stat-value admin-workflow-stat-value--success">
                        ${workflow.stats?.revenue || '0.00'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
