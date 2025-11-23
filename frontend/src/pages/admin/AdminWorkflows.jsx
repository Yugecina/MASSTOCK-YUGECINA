import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminWorkflowService } from '../../services/adminWorkflowService'
import logger from '@/utils/logger';


/**
 * AdminWorkflows - "The Organic Factory" Design
 * Table with workflow name + type, Type badges with gradients
 * Create Workflow button in Lime (critical CTA)
 */
export function AdminWorkflows() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadWorkflows() {
      try {
        logger.debug('🔄 AdminWorkflows: Loading workflows...')
        const response = await adminWorkflowService.getWorkflows()
        logger.debug('✅ AdminWorkflows: Response received:', {
          response,
          data: response.data,
          workflows: response.data?.workflows
        })
        setWorkflows(response.data?.workflows || [])
      } catch (error) {
        logger.error('❌ AdminWorkflows: Failed to load workflows:', {
          error,
          message: error.message,
          response: error.response
        })
        toast.error('Failed to load workflows')
      } finally {
        setLoading(false)
      }
    }
    loadWorkflows()
  }, [])

  return (
    <AdminLayout>
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              className="font-display"
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                letterSpacing: '-0.02em'
              }}
            >
              Workflows Management
            </h1>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Manage global workflow templates and configurations
            </p>
          </div>
          <button
            className="btn btn-primary-lime"
            style={{ padding: '12px 24px' }}
            onClick={() => toast.info('Create Workflow feature coming soon')}
          >
            + Create Workflow
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
            <Spinner size="lg" />
          </div>
        ) : workflows.length === 0 ? (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔄</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              No workflows found
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Create your first workflow template
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <p
                className="font-mono"
                style={{
                  fontSize: '14px',
                  color: 'var(--neutral-500)',
                  fontWeight: 500
                }}
              >
                Total workflows: {workflows.length}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="card-bento card-interactive"
                  style={{
                    background: 'var(--canvas-pure)',
                    padding: '24px',
                    cursor: 'default'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3
                          className="font-display"
                          style={{
                            fontSize: '20px',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {workflow.name}
                        </h3>

                        {/* Type Badge */}
                        <span
                          className="badge"
                          style={{
                            padding: '6px 14px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            background: workflow.config?.workflow_type === 'nano_banana'
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : 'var(--neutral-100)',
                            color: workflow.config?.workflow_type === 'nano_banana'
                              ? 'white'
                              : 'var(--neutral-700)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {workflow.config?.workflow_type || 'standard'}
                        </span>
                      </div>

                      <p
                        className="font-body"
                        style={{
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5
                        }}
                      >
                        {workflow.description || 'No description available'}
                      </p>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                        onClick={() => toast.info('Edit feature coming soon')}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                        onClick={() => toast.error('Delete feature coming soon')}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Workflow Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    padding: '16px',
                    background: 'var(--neutral-50)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <p
                        className="font-body"
                        style={{
                          fontSize: '11px',
                          color: 'var(--neutral-500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px',
                          fontWeight: 600
                        }}
                      >
                        Executions
                      </p>
                      <p
                        className="font-mono"
                        style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {workflow.stats?.total_executions || 0}
                      </p>
                    </div>
                    <div>
                      <p
                        className="font-body"
                        style={{
                          fontSize: '11px',
                          color: 'var(--neutral-500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px',
                          fontWeight: 600
                        }}
                      >
                        Success Rate
                      </p>
                      <p
                        className="font-mono"
                        style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: 'var(--success-main)'
                        }}
                      >
                        {workflow.stats?.success_rate || 0}%
                      </p>
                    </div>
                    <div>
                      <p
                        className="font-body"
                        style={{
                          fontSize: '11px',
                          color: 'var(--neutral-500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '4px',
                          fontWeight: 600
                        }}
                      >
                        Revenue
                      </p>
                      <p
                        className="font-mono"
                        style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: 'var(--success-main)'
                        }}
                      >
                        ${workflow.stats?.revenue || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
