import { useState, useEffect, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { WorkflowCard } from '../components/workflows/WorkflowCard'
import { workflowService } from '../services/workflows'
import logger from '@/utils/logger'
import { Workflow } from '../types'
import './WorkflowsList.css'

type SortOption = 'popular' | 'recent' | 'name'

/**
 * WorkflowsList Page - Dark Premium Style
 */
export function WorkflowsList(): JSX.Element {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('popular')

  useEffect(() => {
    async function loadWorkflows(): Promise<void> {
      try {
        const response = await workflowService.list()
        const workflowsData = response.data?.workflows || response.workflows || []

        // Filter out archived workflows
        const activeWorkflows = workflowsData.filter((w: Workflow) => w.status !== 'archived')

        setWorkflows(activeWorkflows)
      } catch (err) {
        logger.error('Failed to fetch workflows:', err)
      } finally {
        setLoading(false)
      }
    }
    loadWorkflows()
  }, [])

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(search.toLowerCase()))
  )

  const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.execution_count || 0) - (a.execution_count || 0)
      case 'recent':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value)
  }

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setSortBy(e.target.value as SortOption)
  }

  return (
    <ClientLayout>
      <div className="workflows-page">
        {/* Header */}
        <header className="workflows-header">
          <h1 className="workflows-title">Workflows</h1>
          <p className="workflows-subtitle">Browse and execute automation workflows</p>
        </header>

        {/* Controls */}
        <div className="workflows-controls">
          <div className="workflows-search">
            <svg className="workflows-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search workflows..."
              value={search}
              onChange={handleSearchChange}
              className="workflows-search-input"
            />
          </div>

          <select
            value={sortBy}
            onChange={handleSortChange}
            className="workflows-sort"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="workflows-loading">
            <Spinner size="lg" />
          </div>
        ) : sortedWorkflows.length === 0 ? (
          <div className="workflows-empty">
            <div className="workflows-empty-icon">🔍</div>
            <h3 className="workflows-empty-title">No workflows found</h3>
            <p className="workflows-empty-text">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="workflows-grid">
            {sortedWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onClick={() => navigate(`/workflows/${workflow.id}/execute`)}
              />
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  )
}

