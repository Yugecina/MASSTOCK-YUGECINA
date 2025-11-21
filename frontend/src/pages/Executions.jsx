import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { workflowService } from '../services/workflows'
import { BatchResultsView } from '../components/workflows/BatchResultsView'
import logger from '@/utils/logger';


/**
 * Executions Page - "The Organic Factory" Design
 * Timeline verticale avec status glows et Bento cards
 */
export function Executions() {
  const navigate = useNavigate()
  const [executions, setExecutions] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [workflowsMap, setWorkflowsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedExecution, setSelectedExecution] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [workflowFilter, setWorkflowFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    logger.debug('🔍 Executions.loadData: Starting data load...')

    try {
      setLoading(true)

      // Get all workflows first
      logger.debug('📡 Executions.loadData: Fetching workflows...')
      const workflowsData = await workflowService.list()
      const workflowsList = workflowsData.data?.workflows || workflowsData.workflows || []
      setWorkflows(workflowsList)

      // Create a map of workflow_id -> workflow for quick lookup
      const wfMap = {}
      workflowsList.forEach(wf => {
        wfMap[wf.id] = wf
      })
      setWorkflowsMap(wfMap)

      logger.debug('✅ Executions.loadData: Workflows loaded successfully', {
        count: workflowsList.length,
        workflows: workflowsList.map(w => ({
          id: w.id,
          name: w.name,
          type: w.config?.workflow_type
        }))
      })

      // Get executions for each workflow
      logger.debug('📡 Executions.loadData: Fetching executions for all workflows...')
      const allExecutions = []

      for (const workflow of workflowsList) {
        try {
          logger.debug(`🔍 Executions.loadData: Fetching executions for workflow: ${workflow.name} (${workflow.id})`)
          const response = await workflowService.getExecutions(workflow.id)

          logger.debug(`📦 Executions.loadData: Response received for ${workflow.name}:`, {
            status: response.status,
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
            dataStructure: response.data
          })

          // Backend returns: { success: true, data: { executions, total, limit, offset } }
          const execData = response.data.data || response.data
          const executions = execData.executions || []

          logger.debug(`✅ Executions.loadData: Found ${executions.length} execution(s) for ${workflow.name}`, {
            executionIds: executions.map(e => e.id),
            statuses: executions.map(e => e.status)
          })

          if (executions.length > 0) {
            allExecutions.push(...executions.map(exec => ({
              ...exec,
              workflow_name: workflow.name,
              workflow_type: workflow.config?.workflow_type || 'standard'
            })))
          }
        } catch (err) {
          logger.error(`❌ Executions.loadData: Failed to fetch executions for ${workflow.name}:`, {
            workflowId: workflow.id,
            workflowName: workflow.name,
            error: err,
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
          })
        }
      }

      // Sort by created_at descending (newest first)
      allExecutions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setExecutions(allExecutions)

      logger.debug('✅ Executions.loadData: All data loaded successfully', {
        totalExecutions: allExecutions.length,
        totalWorkflows: workflowsList.length,
        statusBreakdown: {
          completed: allExecutions.filter(e => e.status === 'completed').length,
          pending: allExecutions.filter(e => e.status === 'pending').length,
          processing: allExecutions.filter(e => e.status === 'processing').length,
          failed: allExecutions.filter(e => e.status === 'failed').length
        }
      })
    } catch (err) {
      logger.error('❌ Executions.loadData: Critical error loading data:', {
        error: err,
        message: err.message,
        stack: err.stack,
        response: err.response?.data
      })
    } finally {
      setLoading(false)
      logger.debug('🏁 Executions.loadData: Data load complete')
    }
  }

  async function viewExecutionDetails(executionId) {
    logger.debug('🔍 Executions.viewExecutionDetails: Opening execution details', { executionId })

    try {
      logger.debug('📡 Executions.viewExecutionDetails: Fetching execution data...')
      const data = await workflowService.getExecution(executionId)

      logger.debug('📦 Executions.viewExecutionDetails: Execution details received:', {
        status: data.status,
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : [],
        dataStructure: data.data
      })

      const executionData = data.data.data || data.data

      logger.debug('✅ Executions.viewExecutionDetails: Setting selected execution:', {
        id: executionData.id,
        workflowId: executionData.workflow_id,
        status: executionData.status,
        hasInputData: !!executionData.input_data,
        hasOutputData: !!executionData.output_data,
        hasError: !!executionData.error_message,
        progress: executionData.progress,
        duration: executionData.duration_seconds
      })

      setSelectedExecution(executionData)
    } catch (err) {
      logger.error('❌ Executions.viewExecutionDetails: Failed to load execution details:', {
        executionId,
        error: err,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
    }
  }

  // Apply filters and sorting
  const filteredExecutions = executions
    .filter(exec => {
      if (statusFilter !== 'all' && exec.status !== statusFilter) return false
      if (workflowFilter !== 'all' && exec.workflow_id !== workflowFilter) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'duration':
          return (b.duration_seconds || 0) - (a.duration_seconds || 0)
        default:
          return 0
      }
    })

  logger.debug('🔍 Executions.render: Current filters and results:', {
    statusFilter,
    workflowFilter,
    sortBy,
    totalExecutions: executions.length,
    filteredCount: filteredExecutions.length
  })

  const statusCounts = {
    all: executions.length,
    completed: executions.filter(e => e.status === 'completed').length,
    pending: executions.filter(e => e.status === 'pending').length,
    processing: executions.filter(e => e.status === 'processing').length,
    failed: executions.filter(e => e.status === 'failed').length,
  }

  if (loading) {
    logger.debug('⏳ Executions.render: Showing loading state')
    return (
      <ClientLayout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <Spinner size="lg" />
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
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
            Executions
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)'
            }}
          >
            Monitor and review all your workflow execution history
          </p>
        </div>

        {/* Stats Cards - Bento Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            { label: 'Total', value: statusCounts.all, color: 'var(--primary-600)', filter: 'all' },
            { label: 'Completed', value: statusCounts.completed, color: 'var(--success-main)', glow: 'var(--shadow-glow-primary)', filter: 'completed' },
            { label: 'Processing', value: statusCounts.processing, color: 'var(--primary-600)', glow: 'var(--shadow-glow-primary)', filter: 'processing' },
            { label: 'Pending', value: statusCounts.pending, color: 'var(--neutral-500)', filter: 'pending' },
            { label: 'Failed', value: statusCounts.failed, color: 'var(--error-main)', glow: '0 0 20px rgba(216, 74, 42, 0.3)', filter: 'failed' }
          ].map((stat, index) => (
            <div
              key={index}
              onClick={() => {
                logger.debug('🔍 Executions: Status filter set to:', stat.filter)
                setStatusFilter(stat.filter)
              }}
              className="card-bento"
              style={{
                background: statusFilter === stat.filter ? 'var(--primary-50)' : 'var(--canvas-pure)',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                borderLeft: statusFilter === stat.filter ? '4px solid var(--primary-500)' : 'none',
                boxShadow: stat.glow && stat.value > 0 ? stat.glow : 'var(--shadow-md)'
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== stat.filter) {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                }
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== stat.filter) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = stat.glow && stat.value > 0 ? stat.glow : 'var(--shadow-md)'
                }
              }}
            >
              <div
                className="font-body"
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px'
                }}
              >
                {stat.label}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: stat.color,
                  lineHeight: 1
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters - Bento Card */}
        <div className="card-bento" style={{
          background: 'var(--canvas-pure)',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label
                className="font-body"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}
              >
                Filter by Workflow
              </label>
              <select
                value={workflowFilter}
                onChange={(e) => {
                  setWorkflowFilter(e.target.value)
                  logger.debug('🔍 Executions: Workflow filter changed to:', e.target.value)
                }}
                className="input-field"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Workflows</option>
                {workflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="font-body"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}
              >
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  logger.debug('🔍 Executions: Sort changed to:', e.target.value)
                }}
                className="input-field"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="duration">Longest Duration</option>
              </select>
            </div>

            {(statusFilter !== 'all' || workflowFilter !== 'all' || sortBy !== 'newest') && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setWorkflowFilter('all')
                    setSortBy('newest')
                    logger.debug('🔄 Executions: Filters cleared')
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Executions Timeline */}
        {filteredExecutions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredExecutions.map((execution) => {
              const statusConfig = {
                completed: { color: 'var(--success-main)', bg: 'var(--success-light)', glow: 'var(--shadow-glow-primary)' },
                failed: { color: 'var(--error-main)', bg: 'var(--error-light)', glow: '0 0 20px rgba(216, 74, 42, 0.3)' },
                processing: { color: 'var(--primary-600)', bg: 'var(--primary-50)', glow: 'var(--shadow-glow-primary)' },
                pending: { color: 'var(--neutral-500)', bg: 'var(--neutral-100)', glow: 'none' }
              }
              const config = statusConfig[execution.status] || statusConfig.pending

              return (
                <div
                  key={execution.id}
                  onClick={() => viewExecutionDetails(execution.id)}
                  className="card-bento card-interactive"
                  style={{
                    background: 'var(--canvas-pure)',
                    padding: '24px',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${config.color}`,
                    boxShadow: config.glow !== 'none' ? config.glow : 'var(--shadow-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px' }}>
                    {/* Left: Icon + Info */}
                    <div style={{ display: 'flex', alignItems: 'start', gap: '16px', flex: 1 }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          background: config.bg,
                          color: config.color,
                          flexShrink: 0
                        }}
                      >
                        {execution.status === 'completed' && '✓'}
                        {execution.status === 'failed' && '✗'}
                        {execution.status === 'processing' && '⚡'}
                        {execution.status === 'pending' && '⏱'}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3
                            className="font-display"
                            style={{
                              fontSize: '18px',
                              fontWeight: 600,
                              color: 'var(--text-primary)'
                            }}
                          >
                            {execution.workflow_name}
                          </h3>
                          <span
                            style={{
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              borderRadius: '6px',
                              background: config.bg,
                              color: config.color
                            }}
                          >
                            {execution.status}
                          </span>
                        </div>

                        <div
                          className="font-body"
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            marginBottom: '8px'
                          }}
                        >
                          {new Date(execution.created_at).toLocaleString()}
                        </div>

                        {execution.duration_seconds && (
                          <div
                            className="font-mono"
                            style={{
                              fontSize: '12px',
                              color: 'var(--neutral-500)'
                            }}
                          >
                            Duration: {execution.duration_seconds}s
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Arrow */}
                    <svg
                      style={{
                        width: '24px',
                        height: '24px',
                        color: 'var(--neutral-300)',
                        flexShrink: 0
                      }}
                      fill="none"
                      strokeWidth={2}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              No executions found
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                marginBottom: '24px'
              }}
            >
              {statusFilter !== 'all' || workflowFilter !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'Execute a workflow to see results here'}
            </p>
            {(statusFilter !== 'all' || workflowFilter !== 'all') && (
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setWorkflowFilter('all')
                  logger.debug('🔄 Executions: Filters cleared from empty state')
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Execution Detail Modal - Glassmorphism */}
      {selectedExecution && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedExecution(null)
            logger.debug('🔒 Executions: Modal closed')
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px'
          }}
        >
          <div
            className="card-glass"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'scale-in 300ms var(--ease-spring)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid var(--neutral-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2
                className="font-display"
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}
              >
                Execution Details
              </h2>
              <button
                onClick={() => {
                  setSelectedExecution(null)
                  logger.debug('🔒 Executions: Modal closed via button')
                }}
                className="btn-icon"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px'
                }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Status Overview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px'
                }}>
                  <div className="card-bento" style={{ padding: '16px' }}>
                    <div className="font-body" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Status</div>
                    <div className="font-display" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedExecution.status}
                    </div>
                  </div>

                  {selectedExecution.duration_seconds && (
                    <div className="card-bento" style={{ padding: '16px' }}>
                      <div className="font-body" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Duration</div>
                      <div className="font-mono" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedExecution.duration_seconds}s
                      </div>
                    </div>
                  )}

                  {selectedExecution.progress !== undefined && selectedExecution.progress !== null && (
                    <div className="card-bento" style={{ padding: '16px' }}>
                      <div className="font-body" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Progress</div>
                      <div className="font-mono" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedExecution.progress}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {selectedExecution.error_message && (
                  <div style={{
                    background: 'var(--error-light)',
                    border: '2px solid var(--error-main)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--error-dark)', marginBottom: '8px' }}>
                      Error Details
                    </h3>
                    <pre className="font-mono" style={{
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      background: 'var(--canvas-pure)',
                      padding: '16px',
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {selectedExecution.error_message}
                    </pre>
                  </div>
                )}

                {/* Batch Results for nano_banana workflows */}
                {selectedExecution.workflow_id &&
                 workflowsMap[selectedExecution.workflow_id]?.config?.workflow_type === 'nano_banana' &&
                 selectedExecution.status === 'completed' && (
                  <div>
                    <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                      Batch Results
                    </h3>
                    <BatchResultsView executionId={selectedExecution.id} />
                  </div>
                )}

                {/* Output Data for standard workflows */}
                {selectedExecution.output_data &&
                 Object.keys(selectedExecution.output_data).length > 0 &&
                 (!workflowsMap[selectedExecution.workflow_id] ||
                  workflowsMap[selectedExecution.workflow_id]?.config?.workflow_type !== 'nano_banana') && (
                  <div>
                    <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                      Output Data
                    </h3>
                    <pre className="font-mono" style={{
                      fontSize: '14px',
                      color: 'var(--primary-300)',
                      background: 'var(--neutral-900)',
                      padding: '16px',
                      borderRadius: '12px',
                      overflow: 'auto',
                      maxHeight: '400px'
                    }}>
                      {JSON.stringify(selectedExecution.output_data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Input Data */}
                {selectedExecution.input_data && Object.keys(selectedExecution.input_data).length > 0 && (
                  <div>
                    <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                      Input Data
                    </h3>
                    <pre className="font-mono" style={{
                      fontSize: '14px',
                      color: 'var(--primary-300)',
                      background: 'var(--neutral-900)',
                      padding: '16px',
                      borderRadius: '12px',
                      overflow: 'auto',
                      maxHeight: '300px'
                    }}>
                      {JSON.stringify(selectedExecution.input_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '24px',
              borderTop: '1px solid var(--neutral-200)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setSelectedExecution(null)
                  logger.debug('🔒 Executions: Modal closed from footer')
                }}
                className="btn btn-secondary"
              >
                Close
              </button>
              {selectedExecution.workflow_id && (
                <button
                  onClick={() => {
                    logger.debug('🔍 Executions: Navigating to workflow:', selectedExecution.workflow_id)
                    setSelectedExecution(null)
                    navigate(`/workflows/${selectedExecution.workflow_id}/execute`)
                  }}
                  className="btn btn-primary"
                >
                  View Workflow
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  )
}
