import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { workflowService } from '../services/workflows'
import logger from '@/utils/logger';


/**
 * WorkflowsList Page - "The Organic Factory" Design
 * Bento Grid cards avec search et filtres élégants
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

  // Filter workflows
  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(search.toLowerCase()))
  )

  // Sort workflows
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
            Workflows
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)'
            }}
          >
            Browse and execute automation workflows
          </p>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}>
          {/* Search */}
          <div style={{ flex: '0 1 400px', position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                color: 'var(--neutral-400)',
                pointerEvents: 'none',
                zIndex: 1
              }}
              fill="none"
              strokeWidth={2}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                paddingLeft: '48px',
                paddingRight: '16px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              width: '200px',
              flexShrink: 0
            }}
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Workflows Grid */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '64px 0'
          }}>
            <Spinner size="lg" />
          </div>
        ) : sortedWorkflows.length === 0 ? (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
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
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {sortedWorkflows.map((workflow, index) => (
              <div
                key={workflow.id}
                onClick={() => navigate(`/workflows/${workflow.id}/execute`)}
                className="card-bento card-interactive"
                style={{
                  background: 'var(--canvas-pure)',
                  padding: '24px',
                  cursor: 'pointer'
                }}
              >
                {/* Icon and Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      background: getWorkflowGradient(index)
                    }}
                  >
                    {getWorkflowIcon(workflow.name, index)}
                  </div>
                  <span
                    className="badge"
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: '6px',
                      background: workflow.status === 'deployed'
                        ? 'var(--success-light)'
                        : 'var(--neutral-100)',
                      color: workflow.status === 'deployed'
                        ? 'var(--success-dark)'
                        : 'var(--neutral-600)'
                    }}
                  >
                    {workflow.status === 'deployed' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Content */}
                <h3
                  className="font-display"
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {workflow.name}
                </h3>
                <p
                  className="font-body"
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    marginBottom: '16px',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {workflow.description || 'No description available'}
                </p>

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--neutral-100)'
                }}>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '12px',
                      color: 'var(--neutral-500)'
                    }}
                  >
                    {workflow.execution_count || 0} executions
                  </div>
                  <svg
                    style={{
                      width: '16px',
                      height: '16px',
                      color: 'var(--neutral-300)',
                      transition: 'color 0.2s'
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
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  )
}

function getWorkflowIcon(workflowName, index) {
  // Custom SVG icon for Image Factory - Apple style minimalist
  if (workflowName === 'Image Factory') {
    return (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Mountain/landscape icon */}
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    )
  }

  // Fallback to emoji icons for other workflows
  const icons = ['📊', '📈', '📉', '💼', '📋', '⚡', '🚀', '💰', '📄', '🔧']
  return icons[index % icons.length]
}

function getWorkflowColor(index) {
  const colors = [
    'workflow-icon-blue',
    'workflow-icon-green',
    'workflow-icon-purple',
    'workflow-icon-orange',
    'workflow-icon-cyan',
    'workflow-icon-indigo',
  ]
  return colors[index % colors.length]
}

function getWorkflowGradient(index) {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Orange
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Cyan
  ]
  return gradients[index % gradients.length]
}
