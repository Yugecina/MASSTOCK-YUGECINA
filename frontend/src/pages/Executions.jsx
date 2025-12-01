import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { useExecutionsStore } from '../store/executionsStore'
import logger from '@/utils/logger';

/**
 * Executions Page - "The Trusted Magician" - Electric Trust
 * Premium glassmorphism, Electric Indigo + Bright Cyan, rich animations
 * Now with Zustand caching and stale-while-revalidate for instant navigation
 */
export function Executions() {
  const navigate = useNavigate()

  // Get data from Zustand store (persists across navigations)
  const {
    workflows,
    workflowsMap,
    members,
    executions,
    executionsLoading,
    executionsTotal,
    executionsHasMore,
    filters,
    initialize,
    loadMore: storeLoadMore,
    setFilters: storeSetFilters,
    refresh
  } = useExecutionsStore()

  // Local UI state only (not data)
  const [loadingMore, setLoadingMore] = useState(false)
  const [statusFilter, setStatusFilter] = useState(filters.status)
  const [workflowFilter, setWorkflowFilter] = useState(filters.workflow_id)
  const [userFilter, setUserFilter] = useState(filters.user_id)
  const [sortBy, setSortBy] = useState(filters.sortBy)

  // Ref for infinite scroll
  const loadMoreRef = useRef(null)

  // Initialize store on mount (uses cache if available)
  useEffect(() => {
    logger.debug('🚀 Executions: Component mounted, initializing store')
    initialize()
  }, [])

  // Update store filters when local filters change
  useEffect(() => {
    const newFilters = {
      status: statusFilter,
      workflow_id: workflowFilter,
      user_id: userFilter,
      sortBy
    }

    // Only update store if filters actually changed
    const filtersChanged = (
      filters.status !== statusFilter ||
      filters.workflow_id !== workflowFilter ||
      filters.user_id !== userFilter ||
      filters.sortBy !== sortBy
    )

    if (filtersChanged && !executionsLoading) {
      logger.debug('🔍 Executions: Filters changed, updating store', newFilters)
      storeSetFilters(newFilters)
    }
  }, [statusFilter, workflowFilter, userFilter, sortBy])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && executionsHasMore && !loadingMore && !executionsLoading) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [executionsHasMore, loadingMore, executionsLoading])

  const handleLoadMore = useCallback(async () => {
    if (!loadingMore && executionsHasMore) {
      logger.debug('🔄 Executions.handleLoadMore: Loading more from store')
      setLoadingMore(true)
      await storeLoadMore()
      setLoadingMore(false)
    }
  }, [loadingMore, executionsHasMore, storeLoadMore])

  const handleRefresh = useCallback(async () => {
    logger.debug('🔄 Executions.handleRefresh: Force refresh all data')
    await refresh()
  }, [refresh])

  // Memoize sorted executions to avoid re-sorting on every render
  const sortedExecutions = useMemo(() => {
    return [...executions].sort((a, b) => {
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
  }, [executions, sortBy])

  // Memoize status counts to avoid re-filtering on every render
  const statusCounts = useMemo(() => {
    return {
      all: executionsTotal,
      completed: executions.filter(e => e.status === 'completed').length,
      pending: executions.filter(e => e.status === 'pending').length,
      processing: executions.filter(e => e.status === 'processing').length,
      failed: executions.filter(e => e.status === 'failed').length,
    }
  }, [executions, executionsTotal])

  // Show loading state only on initial load (not on cache hit)
  const isInitialLoading = executionsLoading && executions.length === 0

  if (isInitialLoading) {
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

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            disabled={executionsLoading}
            style={{ marginLeft: 'var(--spacing-md)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ marginRight: 'var(--spacing-xs)' }}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Bento Grid - Glassmorphism with Glow Effects */}
        <div className="executions-stats-bento">
          {[
            {
              label: 'Total',
              value: executionsTotal,
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
                  onClick={() => navigate(`/executions/${execution.id}`)}
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
              {!loadingMore && executionsHasMore && (
                <button
                  onClick={handleLoadMore}
                  className="executions-load-more-btn"
                >
                  Load more ({executions.length} of {executionsTotal})
                </button>
              )}
              {!executionsHasMore && executions.length > 0 && (
                <div className="executions-load-more-end">
                  All {executionsTotal} executions loaded
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
    </ClientLayout>
  )
}
