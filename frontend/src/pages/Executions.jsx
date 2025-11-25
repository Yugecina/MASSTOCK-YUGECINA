import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { workflowService } from '../services/workflows'
import { BatchResultsView } from '../components/workflows/BatchResultsView'
import logger from '@/utils/logger';

/**
 * Executions Page - "The Trusted Magician" - Electric Trust
 * Premium glassmorphism, Electric Indigo + Bright Cyan, rich animations
 * Inspirations: Linear, Vercel, Stripe - Confident, sophisticated, magic through motion
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
        <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
          <Spinner size="lg" />
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      {/* Main Container */}
      <div className="executions-page">

        {/* Hero Header - Space Grotesk Display */}
        <div className="executions-hero">
          <div className="executions-hero-content">
            <h1 className="executions-hero-title">
              Executions
            </h1>
            <p className="executions-hero-subtitle">
              Monitor and review all your workflow execution history
            </p>
          </div>
        </div>

        {/* Stats Bento Grid - Glassmorphism with Glow Effects */}
        <div className="executions-stats-bento">
          {[
            {
              label: 'Total',
              value: statusCounts.all,
              icon: '📊',
              gradient: 'indigo',
              filter: 'all',
              delay: '0ms'
            },
            {
              label: 'Completed',
              value: statusCounts.completed,
              icon: '✓',
              gradient: 'success',
              filter: 'completed',
              delay: '75ms',
              glow: statusCounts.completed > 0
            },
            {
              label: 'Processing',
              value: statusCounts.processing,
              icon: '⚡',
              gradient: 'cyan',
              filter: 'processing',
              delay: '150ms',
              glow: statusCounts.processing > 0,
              pulse: statusCounts.processing > 0
            },
            {
              label: 'Pending',
              value: statusCounts.pending,
              icon: '⏱',
              gradient: 'muted',
              filter: 'pending',
              delay: '225ms'
            },
            {
              label: 'Failed',
              value: statusCounts.failed,
              icon: '✗',
              gradient: 'error',
              filter: 'failed',
              delay: '300ms',
              glow: statusCounts.failed > 0
            }
          ].map((stat, index) => (
            <div
              key={index}
              onClick={() => {
                logger.debug('🔍 Executions: Status filter set to:', stat.filter)
                setStatusFilter(stat.filter)
              }}
              className={`execution-stat-bento ${statusFilter === stat.filter ? 'active' : ''} ${stat.glow ? 'has-glow' : ''} ${stat.pulse ? 'has-pulse' : ''}`}
              data-gradient={stat.gradient}
              style={{ animationDelay: stat.delay }}
            >
              <div className="execution-stat-icon">{stat.icon}</div>
              <div className="execution-stat-value">{stat.value}</div>
              <div className="execution-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters Card - Premium Glassmorphism */}
        <div className="executions-filters-card">
          <div className="executions-filters-grid">
            <div className="filter-field">
              <label className="filter-field-label">
                Filter by Workflow
              </label>
              <select
                value={workflowFilter}
                onChange={(e) => {
                  setWorkflowFilter(e.target.value)
                  logger.debug('🔍 Executions: Workflow filter changed to:', e.target.value)
                }}
                className="filter-field-select"
              >
                <option value="all">All Workflows</option>
                {workflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-field-label">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  logger.debug('🔍 Executions: Sort changed to:', e.target.value)
                }}
                className="filter-field-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="duration">Longest Duration</option>
              </select>
            </div>

            {(statusFilter !== 'all' || workflowFilter !== 'all' || sortBy !== 'newest') && (
              <div className="filter-field-action">
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setWorkflowFilter('all')
                    setSortBy('newest')
                    logger.debug('🔄 Executions: Filters cleared')
                  }}
                  className="filter-clear-btn"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Executions List - Premium Cards */}
        {filteredExecutions.length > 0 ? (
          <div className="executions-list">
            {filteredExecutions.map((execution, index) => {
              const statusConfig = {
                completed: {
                  gradient: 'success',
                  icon: '✓',
                  glow: true
                },
                failed: {
                  gradient: 'error',
                  icon: '✗',
                  glow: true
                },
                processing: {
                  gradient: 'cyan',
                  icon: '⚡',
                  glow: true,
                  pulse: true
                },
                pending: {
                  gradient: 'muted',
                  icon: '⏱',
                  glow: false
                }
              }
              const config = statusConfig[execution.status] || statusConfig.pending

              return (
                <div
                  key={execution.id}
                  onClick={() => viewExecutionDetails(execution.id)}
                  className={`execution-item ${config.glow ? 'has-glow' : ''} ${config.pulse ? 'has-pulse' : ''}`}
                  data-gradient={config.gradient}
                  style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                >
                  <div className="execution-item-icon">
                    {config.icon}
                  </div>

                  <div className="execution-item-content">
                    <div className="execution-item-header">
                      <h3 className="execution-item-title">
                        {execution.workflow_name}
                      </h3>
                      <span
                        className="execution-item-badge"
                        data-gradient={config.gradient}
                      >
                        {execution.status}
                      </span>
                    </div>

                    <div className="execution-item-meta">
                      <span className="execution-item-date">
                        {new Date(execution.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      {execution.duration_seconds && (
                        <>
                          <span className="execution-item-separator">•</span>
                          <span className="execution-item-duration">
                            {execution.duration_seconds}s
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="execution-item-arrow">
                    <svg
                      width="20"
                      height="20"
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
          <div className="executions-empty">
            <div className="executions-empty-icon">📭</div>
            <h3 className="executions-empty-title">
              No executions found
            </h3>
            <p className="executions-empty-text">
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
                className="executions-empty-btn"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Execution Detail Modal - Premium Glassmorphism */}
      {selectedExecution && (
        <div
          className="execution-modal-overlay"
          onClick={() => {
            setSelectedExecution(null)
            logger.debug('🔒 Executions: Modal closed')
          }}
        >
          <div
            className="execution-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="execution-modal-header">
              <h2 className="execution-modal-title">
                Execution Details
              </h2>
              <button
                onClick={() => {
                  setSelectedExecution(null)
                  logger.debug('🔒 Executions: Modal closed via button')
                }}
                className="execution-modal-close"
              >
                <svg width={20} height={20} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="execution-modal-body">
              {/* Quick Stats */}
              <div className="execution-modal-stats">
                <div className="execution-modal-stat">
                  <div className="execution-modal-stat-label">Status</div>
                  <div className="execution-modal-stat-value">{selectedExecution.status}</div>
                </div>

                {selectedExecution.duration_seconds && (
                  <div className="execution-modal-stat">
                    <div className="execution-modal-stat-label">Duration</div>
                    <div className="execution-modal-stat-value">{selectedExecution.duration_seconds}s</div>
                  </div>
                )}

                {selectedExecution.progress !== undefined && selectedExecution.progress !== null && (
                  <div className="execution-modal-stat">
                    <div className="execution-modal-stat-label">Progress</div>
                    <div className="execution-modal-stat-value">{selectedExecution.progress}%</div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {selectedExecution.error_message && (
                <div className="execution-modal-section execution-modal-error">
                  <h3 className="execution-modal-section-title">Error Details</h3>
                  <pre className="execution-modal-code">
                    {selectedExecution.error_message}
                  </pre>
                </div>
              )}

              {/* Batch Results for nano_banana workflows */}
              {selectedExecution.workflow_id &&
               workflowsMap[selectedExecution.workflow_id]?.config?.workflow_type === 'nano_banana' &&
               selectedExecution.status === 'completed' && (
                <div className="execution-modal-section">
                  <h3 className="execution-modal-section-title">Batch Results</h3>
                  <BatchResultsView executionId={selectedExecution.id} />
                </div>
              )}

              {/* Output Data for standard workflows */}
              {selectedExecution.output_data &&
               Object.keys(selectedExecution.output_data).length > 0 &&
               (!workflowsMap[selectedExecution.workflow_id] ||
                workflowsMap[selectedExecution.workflow_id]?.config?.workflow_type !== 'nano_banana') && (
                <div className="execution-modal-section">
                  <h3 className="execution-modal-section-title">Output Data</h3>
                  <pre className="execution-modal-code">
                    {JSON.stringify(selectedExecution.output_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Input Data */}
              {selectedExecution.input_data && Object.keys(selectedExecution.input_data).length > 0 && (
                <div className="execution-modal-section">
                  <h3 className="execution-modal-section-title">Input Data</h3>
                  <pre className="execution-modal-code">
                    {JSON.stringify(selectedExecution.input_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="execution-modal-footer">
              <button
                onClick={() => {
                  setSelectedExecution(null)
                  logger.debug('🔒 Executions: Modal closed from footer')
                }}
                className="execution-modal-btn-secondary"
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
                  className="execution-modal-btn-primary"
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
