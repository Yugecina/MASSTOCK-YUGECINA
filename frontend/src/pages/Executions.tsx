import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { useExecutionsStore } from '../store/executionsStore'
import { useActiveExecutionsPolling } from '../hooks/useActiveExecutionsPolling'
import logger from '@/utils/logger'
import { Workflow, User } from '../types'
import type { ExecutionBadgeConfig } from '../utils/adminHelpers'
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

interface StatusCount {
  all: number
  completed: number
  pending: number
  processing: number
  failed: number
}

/**
 * Executions Page - Refactored (NO local filter state, NO cache, AbortController)
 * Premium glassmorphism, Electric Indigo + Bright Cyan, rich animations
 * Single source of truth: all filters in Zustand store
 */
export function Executions(): JSX.Element {
  const navigate = useNavigate()

  // Get ALL data from Zustand store (single source of truth)
  const {
    workflows,
    members,
    executions,
    executionsLoading,
    executionsLoadingMore,
    executionsTotal,
    executionsHasMore,
    executionsError,
    statusCounts: storeStatusCounts,
    filters,
    initialize,
    loadMore: storeLoadMore,
    setFilter,
    resetFilters,
    refresh
  } = useExecutionsStore()

  // Local UI state ONLY (not data or filters)
  const [justUpdated, setJustUpdated] = useState<boolean>(false)
  const [previousActiveCount, setPreviousActiveCount] = useState<number>(0)
  const [loadingExecutionId, setLoadingExecutionId] = useState<string | null>(null)

  // Track active executions for auto-refresh
  const { activeCount } = useActiveExecutionsPolling()

  // Ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Initialize store on mount
  useEffect(() => {
    logger.debug('🚀 Executions: Component mounted, initializing store')
    initialize()
  }, [initialize])

  // Auto-refresh when active executions complete
  useEffect(() => {
    // Detect when active count decreases to 0 (execution completed)
    if (previousActiveCount > 0 && activeCount === 0) {
      logger.debug('✅ Executions: Active workflow completed, refreshing list')
      // Small delay to allow backend to update
      setTimeout(() => {
        refresh()
      }, 500)
    }
    setPreviousActiveCount(activeCount)
  }, [activeCount, previousActiveCount, refresh])

  // Auto-poll when there are active executions
  useEffect(() => {
    const hasActiveExecutions = storeStatusCounts.pending > 0 || storeStatusCounts.processing > 0

    if (!hasActiveExecutions) {
      return
    }

    const pollInterval = setInterval(() => {
      // Skip if page is hidden (Page Visibility API)
      if (document.hidden) {
        return
      }

      logger.debug('🔄 Executions: Auto-polling refresh for active executions')
      refresh()
    }, 5000) // 5 seconds

    return () => {
      clearInterval(pollInterval)
    }
  }, [storeStatusCounts.pending, storeStatusCounts.processing, refresh])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && executionsHasMore && !executionsLoadingMore && !executionsLoading) {
          logger.debug('🔄 Executions: Intersection triggered, loading more')
          storeLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [executionsHasMore, executionsLoadingMore, executionsLoading, storeLoadMore])

  // Track when data updates for smooth transition
  useEffect(() => {
    if (!executionsLoading && !executionsLoadingMore && executions.length > 0) {
      setJustUpdated(true)
      const timer = setTimeout(() => setJustUpdated(false), 500)
      return () => clearTimeout(timer)
    }
  }, [executions, executionsLoading, executionsLoadingMore])

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

    // Sorting is now done server-side, but keep this for defensive programming
    // In case we ever need client-side sorting as fallback
    return clonedExecutions.sort((a, b) => {
      switch (filters.sortBy) {
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
  }, [executions, filters.sortBy])

  // Use status counts from backend (always accurate, not calculated from loaded subset)
  const statusCounts: StatusCount = {
    all: executionsTotal,
    completed: storeStatusCounts.completed,
    pending: storeStatusCounts.pending,
    processing: storeStatusCounts.processing,
    failed: storeStatusCounts.failed,
  }

  // Show loading state only on initial load
  const isInitialLoading = executionsLoading && executions.length === 0

  // Render execution card
  const renderExecutionCard = useCallback((execution: Execution) => {
    const statusConfig: Record<string, ExecutionBadgeConfig> = {
      completed: { class: 'execution-status-completed', label: 'Completed', gradient: 'success', icon: '✓', glow: true },
      failed: { class: 'execution-status-failed', label: 'Failed', gradient: 'error', icon: '✗', glow: true },
      processing: { class: 'execution-status-processing', label: 'Processing', gradient: 'cyan', icon: 'spinner', glow: true, pulse: true },
      pending: { class: 'execution-status-pending', label: 'Pending', gradient: 'muted', icon: '⏱', glow: false }
    }
    const config = statusConfig[execution.status] || statusConfig.pending

    return (
      <div
        key={execution.id}
        onClick={() => {
          setLoadingExecutionId(execution.id)
          navigate(`/executions/${execution.id}`)
        }}
        className={`execution-item ${config.glow ? 'has-glow' : ''} ${config.pulse ? 'has-pulse' : ''} ${loadingExecutionId === execution.id ? 'is-loading-navigation' : ''}`}
        data-gradient={config.gradient}
      >
        <div className="execution-item-icon">
          {config.icon === 'spinner' ? (
            <svg className="execution-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            config.icon
          )}
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
                logger.debug('🔍 Executions: Status filter clicked:', stat.filter)
                setFilter('status', stat.filter)
              }}
              className={`execution-stat-pill ${filters.status === stat.filter ? 'active' : ''} ${stat.pulse ? 'has-pulse' : ''}`}
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
              value={filters.workflow_id}
              onChange={(e) => {
                logger.debug('🔍 Executions: Workflow filter changed to:', e.target.value)
                setFilter('workflow_id', e.target.value)
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
              value={filters.user_id}
              onChange={(e) => {
                logger.debug('🔍 Executions: User filter changed to:', e.target.value)
                setFilter('user_id', e.target.value)
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
              value={filters.sortBy}
              onChange={(e) => {
                logger.debug('🔍 Executions: Sort changed to:', e.target.value)
                setFilter('sortBy', e.target.value)
              }}
              className="filter-compact-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="duration">Longest Duration</option>
            </select>
          </div>

          {(filters.status !== 'all' || filters.workflow_id !== 'all' || filters.user_id !== 'all' || filters.sortBy !== 'newest') && (
            <button
              onClick={() => {
                logger.debug('🔄 Executions: Filters cleared')
                resetFilters()
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

        {/* Error State */}
        {executionsError && (
          <div className="executions-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{executionsError}</span>
            <button onClick={handleRefresh} className="btn btn-sm btn-secondary">
              Retry
            </button>
          </div>
        )}

        {/* Content Area - Loading, List, or Empty State */}
        {isInitialLoading ? (
          <div className="executions-loading">
            <div className="executions-loading-icon">
              <div className="executions-loading-orbit" />
              <div className="executions-loading-orbit-2" />
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </div>
            <h3 className="executions-loading-title">Loading executions</h3>
            <p className="executions-loading-text">
              Fetching your workflow history
              <span className="executions-loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </p>
          </div>
        ) : sortedExecutions.length > 0 ? (
          <div className="executions-list-container">
            <div className={`executions-list-wrapper ${executionsLoading ? 'is-loading' : ''} ${justUpdated ? 'just-updated' : ''}`}>
              <div className="executions-list">
                {sortedExecutions.map((execution: Execution) => renderExecutionCard(execution))}
              </div>
            </div>

            {/* Loading indicator overlay */}
            {executionsLoading && executions.length > 0 && (
              <div className="executions-loading-indicator">
                <Spinner size="sm" />
                <span>Updating...</span>
              </div>
            )}

            {/* Load More Trigger / Infinite Scroll Sentinel */}
            <div ref={loadMoreRef} className="executions-load-more">
              {executionsLoadingMore && (
                <div className="executions-load-more-spinner">
                  <Spinner size="md" />
                  <span>Loading more...</span>
                </div>
              )}
              {!executionsLoadingMore && executionsHasMore && (
                <button onClick={storeLoadMore} className="executions-load-more-btn">
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
              {filters.status !== 'all' || filters.workflow_id !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'Execute a workflow to see results here'}
            </p>
            {(filters.status !== 'all' || filters.workflow_id !== 'all' || filters.user_id !== 'all') && (
              <button
                onClick={() => {
                  logger.debug('🔄 Executions: Filters cleared from empty state')
                  resetFilters()
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
