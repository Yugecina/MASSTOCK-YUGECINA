import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { workflowService } from '../services/workflows'
import logger from '@/utils/logger';
import './WorkflowsList.css'

/**
 * WorkflowsList Page - Dark Premium Style
 */
export function WorkflowsList() {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('popular')

  useEffect(() => {
    async function loadWorkflows() {
      try {
        const response = await workflowService.list()
        const workflowsData = response.data?.workflows || response.workflows || []
        setWorkflows(workflowsData)
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
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

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
              onChange={(e) => setSearch(e.target.value)}
              className="workflows-search-input"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
              <article
                key={workflow.id}
                onClick={() => navigate(`/workflows/${workflow.id}/execute`)}
                className="workflow-card"
              >
                <div className="workflow-card-header">
                  <div className="workflow-card-icon">
                    {getWorkflowIcon(workflow.name)}
                  </div>
                  <span className={`workflow-card-badge ${workflow.status === 'deployed' ? 'workflow-card-badge--active' : ''}`}>
                    {workflow.status === 'deployed' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="workflow-card-title">{workflow.name}</h3>
                <p className="workflow-card-description">
                  {workflow.description || 'No description available'}
                </p>

                <div className="workflow-card-footer">
                  <span className="workflow-card-runs">
                    {workflow.execution_count || 0} runs
                  </span>
                  <svg className="workflow-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  )
}

function getWorkflowIcon(workflowName) {
  if (workflowName === 'Image Factory') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    )
  }
  if (workflowName === 'Nano Banana') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}
