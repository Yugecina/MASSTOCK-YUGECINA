import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { useExecutionsStore } from '../store/executionsStore'
import logger from '@/utils/logger'
import { Workflow, User } from '../types'
import './Executions.css'
import '../components/executions/ExecutionModal.css'

interface Execution {
  id: string
  workflow_name: string
  status: string
  created_at: string
  triggered_by_email?: string
  duration_seconds?: number
}

interface Filters {
  status: string
  workflow_id: string
  user_id: string
  sortBy: string
}

interface StatusCount {
  all: number
  completed: number
  pending: number
  processing: number
  failed: number
}

/**
 * Executions Page - "The Trusted Magician" - Electric Trust
 * Premium glassmorphism, Electric Indigo + Bright Cyan, rich animations
 * Now with Zustand caching and stale-while-revalidate for instant navigation
 */
export function Executions(): JSX.Element {
  const navigate = useNavigate()

  // Get data from Zustand store (persists across navigations)
  const {
    workflows,
    workflowsMap,
    members,
    executions,
    executionsLoading,
    executionsRefreshing,
    executionsTotal,
    executionsHasMore,
    filters,
    initialize,
    loadMore: storeLoadMore,
    setFilters: storeSetFilters,
    refresh
  } = useExecutionsStore()

  // Local UI state only (not data)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [justUpdated, setJustUpdated] = useState<boolean>(false)
  const [statusFilter, setStatusFilter] = useState<string>(filters.status)
  const [workflowFilter, setWorkflowFilter] = useState<string>(filters.workflow_id)
  const [userFilter, setUserFilter] = useState<string>(filters.user_id)
  const [sortBy, setSortBy] = useState<string>(filters.sortBy)

  // Ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Initialize store on mount (uses cache if available)
  useEffect(() => {
    logger.debug('🚀 Executions: Component mounted, initializing store')
    initialize()
  }, [initialize])

  // Update store filters when local filters change
  useEffect(() => {
    const newFilters: Filters = {
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
  }, [statusFilter, workflowFilter, userFilter, sortBy, filters, executionsLoading, storeSetFilters])

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

  // Track when data updates for smooth transition
  useEffect(() => {
    if (!executionsRefreshing && executions.length > 0) {
      setJustUpdated(true)
      const timer = setTimeout(() => setJustUpdated(false), 500)
      return () => clearTimeout(timer)
    }
  }, [executions, executionsRefreshing])

  const handleLoadMore = useCallback(async (): Promise<void> => {
    if (!loadingMore && executionsHasMore) {
      logger.debug('🔄 Executions.handleLoadMore: Loading more from store')
      setLoadingMore(true)
      await storeLoadMore()
      setLoadingMore(false)
    }
  }, [loadingMore, executionsHasMore, storeLoadMore])

  const handleRefresh = useCallback(async (): Promise<void> => {
    logger.debug('🔄 Executions.handleRefresh: Force refresh all data')
    await refresh()
  }, [refresh])

  // Memoize sorted executions to avoid re-sorting on every render
  const sortedExecutions = useMemo(() => {
    // Defensive guard: ensure executions is an array
    if (!Array.isArray(executions)) {
      console.warn('⚠️ Executions.sortedExecutions: executions is not an array', { executions })
      return []
    }

    // Clone executions deeply to avoid Zustand proxy issues with react-window
    const clonedExecutions = executions.map((ex: Execution) => ({ ...ex }))

    return clonedExecutions.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'duration':
          return (b.duration_seconds || 0) - (a.duration_seconds || 0)
        default:
          return 0
      }
    })
  }, [executions, sortBy])

  // Memoize status counts to avoid re-filtering on every render
  const statusCounts: StatusCount = useMemo(() => {
    return {
      all: executionsTotal,
      completed: executions.filter((e: Execution) => e.status === 'completed').length,
      pending: executions.filter((e: Execution) => e.status === 'pending').length,
      processing: executions.filter((e: Execution) => e.status === 'processing').length,
      failed: executions.filter((e: Execution) => e.status === 'failed').length,
    }
  }, [executions, executionsTotal])

  // Show loading state only on initial load (not on cache hit)
  const isInitialLoading = executionsLoading && executions.length === 0

  // Render execution card
  const renderExecutionCard = useCallback((execution: Execution) => {
    const statusConfig: Record<string, any> = {
      completed: { gradient: 'success', icon: '✓', glow: true },
      failed: { gradient: 'error', icon: '✗', glow: true },
      processing: { gradient: 'cyan', icon: '⚡', glow: true, pulse: true },
      pending: { gradient: 'muted', icon: '⏱', glow: false }
    }
    const config = statusConfig[execution.status] || statusConfig.pending

    return (
      <div
        key={execution.id}
        onClick={() => navigate(`/executions/${execution.id}`)}
        className={`execution-item ${config.glow ? 'has-glow' : ''} ${config.pulse ? 'has-pulse' : ''}`}
        data-gradient={config.gradient}
      >
        <div className="execution-item-icon">
          {config.icon}
        </div>

        <div className="execution-item-content">
          <div className="execution-item-header">
            <h3 className="execution-item-title">
              {execution.workflow_name}
            </h3>
            <span className="execution-item-badge" data-gradient={config.gradient}>
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
          <svg width="20" height="20" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    )
  }, [navigate])

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

        {/* Compact Header */}
        <div className="executions-header-compact">
          <div>
            <h1 className="executions-title-compact">Executions</h1>
            <p className="executions-subtitle-compact">Monitor and review all your workflow execution history</p>
          </div>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary btn-sm"
            disabled={executionsLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Compact Stats Pills */}
        <div className="executions-stats-pills">
          {[
            { label: 'Total', value: executionsTotal, gradient: 'indigo', filter: 'all' },
            { label: 'Completed', value: statusCounts.completed, gradient: 'success', filter: 'completed' },
            { label: 'Processing', value: statusCounts.processing, gradient: 'cyan', filter: 'processing', pulse: statusCounts.processing > 0 },
            { label: 'Pending', value: statusCounts.pending, gradient: 'muted', filter: 'pending' },
            { label: 'Failed', value: statusCounts.failed, gradient: 'error', filter: 'failed' }
          ].map((stat, index) => (
            <button
              key={index}
              onClick={() => {
                logger.debug('🔍 Executions: Status filter set to:', stat.filter)
                setStatusFilter(stat.filter)
              }}
              className={`execution-stat-pill ${statusFilter === stat.filter ? 'active' : ''} ${stat.pulse ? 'has-pulse' : ''}`}
              data-gradient={stat.gradient}
            >
              <span className="stat-pill-value">{stat.value}</span>
              <span className="stat-pill-label">{stat.label}</span>
            </button>
          ))}
        </div>

        {/* Compact Filters Bar */}
        <div className="executions-filters-compact">
          <div className="filter-group">
            <label className="filter-compact-label">Filter by Workflow</label>
            <select
              value={workflowFilter}
              onChange={(e) => {
                setWorkflowFilter(e.target.value)
                logger.debug('🔍 Executions: Workflow filter changed to:', e.target.value)
              }}
              className="filter-compact-select"
            >
              <option value="all">All Workflows</option>
              {workflows.map((workflow: Workflow) => (
                <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-compact-label">Triggered By</label>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value)
                logger.debug('🔍 Executions: User filter changed to:', e.target.value)
              }}
              className="filter-compact-select"
            >
              <option value="all">All Collaborators</option>
              {members.map((member: User) => (
                <option key={member.id} value={member.id}>{member.email}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-compact-label">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                logger.debug('🔍 Executions: Sort changed to:', e.target.value)
              }}
              className="filter-compact-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="duration">Longest Duration</option>
            </select>
          </div>

          {(statusFilter !== 'all' || workflowFilter !== 'all' || userFilter !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setWorkflowFilter('all')
                setUserFilter('all')
                setSortBy('newest')
                logger.debug('🔄 Executions: Filters cleared')
              }}
              className="filter-clear-compact"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* Executions List - Premium Cards + Blur Loading */}
        {sortedExecutions.length > 0 ? (
          <div className="executions-list-container">
            <div className={`executions-list-wrapper ${executionsRefreshing ? 'is-refreshing' : ''} ${justUpdated ? 'just-updated' : ''}`}>
              <div className="executions-list">
                {sortedExecutions.map((execution: Execution) => renderExecutionCard(execution))}
              </div>
            </div>

            {/* Refreshing indicator overlay */}
            {executionsRefreshing && (
              <div className="executions-refresh-indicator">
                <Spinner size="sm" />
                <span>Updating...</span>
              </div>
            )}

            {/* Load More Trigger / Infinite Scroll Sentinel */}
            <div ref={loadMoreRef} className="executions-load-more">
              {loadingMore && (
                <div className="executions-load-more-spinner">
                  <Spinner size="md" />
                  <span>Loading more...</span>
                </div>
              )}
              {!loadingMore && executionsHasMore && (
                <button onClick={handleLoadMore} className="executions-load-more-btn">
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
