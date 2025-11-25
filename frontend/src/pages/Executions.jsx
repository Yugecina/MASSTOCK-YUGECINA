import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { workflowService } from '../services/workflows'
import { BatchResultsView } from '../components/workflows/BatchResultsView'
import logger from '@/utils/logger';

const ITEMS_PER_PAGE = 20

/**
 * Executions Page - "The Trusted Magician" - Electric Trust
 * Premium glassmorphism, Electric Indigo + Bright Cyan, rich animations
 * Now with lazy loading / infinite scroll
 */
export function Executions() {
  const navigate = useNavigate()
  const [executions, setExecutions] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [workflowsMap, setWorkflowsMap] = useState({})
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [workflowFilter, setWorkflowFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [copyFeedback, setCopyFeedback] = useState(null)

  // Pagination state
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)

  // Ref for infinite scroll
  const loadMoreRef = useRef(null)

  // Load initial data (workflows and members for filters, then executions)
  useEffect(() => {
    loadInitialData()
  }, [])

  // Reload executions when filters change
  useEffect(() => {
    if (!loading) {
      // Reset and reload when filters change
      setExecutions([])
      setOffset(0)
      setHasMore(true)
      loadExecutions(0, true)
    }
  }, [statusFilter, workflowFilter, userFilter])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, offset])

  async function loadInitialData() {
    logger.debug('🔍 Executions.loadInitialData: Starting...')

    try {
      setLoading(true)

      // Load workflows and members in parallel for filters
      const [workflowsRes, membersRes] = await Promise.all([
        workflowService.list().catch(err => {
          logger.warn('⚠️ Executions: Could not load workflows:', err.message)
          return { data: { workflows: [] } }
        }),
        workflowService.getClientMembers().catch(err => {
          logger.warn('⚠️ Executions: Could not load members:', err.message)
          return { data: { members: [] } }
        })
      ])

      // Process workflows
      const workflowsList = workflowsRes.data?.workflows || workflowsRes.workflows || []
      setWorkflows(workflowsList)

      const wfMap = {}
      workflowsList.forEach(wf => {
        wfMap[wf.id] = wf
      })
      setWorkflowsMap(wfMap)
      logger.debug('✅ Executions: Workflows loaded:', { count: workflowsList.length })

      // Process members
      const membersList = membersRes.data?.data?.members || membersRes.data?.members || []
      setMembers(membersList)
      logger.debug('✅ Executions: Members loaded:', { count: membersList.length })

      // Load first page of executions
      await loadExecutions(0, true)

    } catch (err) {
      logger.error('❌ Executions.loadInitialData: Error:', {
        error: err,
        message: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadExecutions(currentOffset = 0, isReset = false) {
    logger.debug('📡 Executions.loadExecutions:', { currentOffset, isReset, statusFilter, workflowFilter, userFilter })

    try {
      if (!isReset) {
        setLoadingMore(true)
      }

      const response = await workflowService.getAllExecutions({
        limit: ITEMS_PER_PAGE,
        offset: currentOffset,
        status: statusFilter,
        workflow_id: workflowFilter,
        user_id: userFilter
      })

      const data = response.data?.data || response.data
      const newExecutions = data.executions || []

      logger.debug('✅ Executions.loadExecutions: Received:', {
        count: newExecutions.length,
        total: data.total,
        hasMore: data.hasMore
      })

      if (isReset) {
        setExecutions(newExecutions)
      } else {
        setExecutions(prev => [...prev, ...newExecutions])
      }

      setTotal(data.total || 0)
      setHasMore(data.hasMore || false)
      setOffset(currentOffset + newExecutions.length)

    } catch (err) {
      logger.error('❌ Executions.loadExecutions: Error:', {
        error: err,
        message: err.message,
        response: err.response?.data
      })
    } finally {
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      logger.debug('🔄 Executions.loadMore: Loading more from offset:', offset)
      loadExecutions(offset, false)
    }
  }, [loadingMore, hasMore, offset, statusFilter, workflowFilter, userFilter])

  async function viewExecutionDetails(executionId) {
    logger.debug('🔍 Executions.viewExecutionDetails:', { executionId })

    try {
      const data = await workflowService.getExecution(executionId)
      const executionData = data.data.data || data.data

      logger.debug('✅ Executions.viewExecutionDetails: Loaded:', {
        id: executionData.id,
        status: executionData.status
      })

      setSelectedExecution(executionData)
    } catch (err) {
      logger.error('❌ Executions.viewExecutionDetails: Error:', {
        executionId,
        error: err,
        message: err.message
      })
    }
  }

  async function handleCopyInputData(data) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopyFeedback('input')
      setTimeout(() => setCopyFeedback(null), 2000)
    } catch (err) {
      logger.error('❌ Executions.handleCopyInputData: Failed to copy:', err)
    }
  }

  // Apply client-side sorting
  const sortedExecutions = [...executions].sort((a, b) => {
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

  const statusCounts = {
    all: total,
    completed: executions.filter(e => e.status === 'completed').length,
    pending: executions.filter(e => e.status === 'pending').length,
    processing: executions.filter(e => e.status === 'processing').length,
    failed: executions.filter(e => e.status === 'failed').length,
  }

  if (loading) {
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
              value: total,
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
                Triggered By
              </label>
              <select
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value)
                  logger.debug('🔍 Executions: User filter changed to:', e.target.value)
                }}
                className="filter-field-select"
              >
                <option value="all">All Collaborators</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.email}
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

            {(statusFilter !== 'all' || workflowFilter !== 'all' || userFilter !== 'all' || sortBy !== 'newest') && (
              <div className="filter-field-action">
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setWorkflowFilter('all')
                    setUserFilter('all')
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

        {/* Executions List - Premium Cards with Lazy Loading */}
        {sortedExecutions.length > 0 ? (
          <div className="executions-list">
            {sortedExecutions.map((execution, index) => {
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

                      {execution.triggered_by_email && (
                        <>
                          <span className="execution-item-separator">•</span>
                          <span className="execution-item-user">
                            {execution.triggered_by_email}
                          </span>
                        </>
                      )}

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

            {/* Load More Trigger / Infinite Scroll Sentinel */}
            <div
              ref={loadMoreRef}
              className="executions-load-more"
            >
              {loadingMore && (
                <div className="executions-load-more-spinner">
                  <Spinner size="md" />
                  <span>Loading more...</span>
                </div>
              )}
              {!loadingMore && hasMore && (
                <button
                  onClick={loadMore}
                  className="executions-load-more-btn"
                >
                  Load more ({executions.length} of {total})
                </button>
              )}
              {!hasMore && executions.length > 0 && (
                <div className="executions-load-more-end">
                  All {total} executions loaded
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="executions-empty">
            <div className="executions-empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </div>
            <h3 className="executions-empty-title">
              No executions found
            </h3>
            <p className="executions-empty-text">
              {statusFilter !== 'all' || workflowFilter !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'Execute a workflow to see results here'}
            </p>
            {(statusFilter !== 'all' || workflowFilter !== 'all' || userFilter !== 'all') && (
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setWorkflowFilter('all')
                  setUserFilter('all')
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
                  <div className="execution-modal-section-header">
                    <h3 className="execution-modal-section-title">Input Data</h3>
                    <button
                      onClick={() => handleCopyInputData(selectedExecution.input_data)}
                      className={`execution-modal-copy-btn ${copyFeedback === 'input' ? 'copied' : ''}`}
                      title="Copy Input Data"
                    >
                      {copyFeedback === 'input' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                      {copyFeedback === 'input' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
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
