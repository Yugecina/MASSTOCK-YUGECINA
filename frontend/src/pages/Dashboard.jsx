import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../hooks/useAuth'
import { workflowService } from '../services/workflows'
import logger from '@/utils/logger';


/**
 * Dashboard Page - "The Organic Factory" Design
 * Bento Grid layout with glassmorphism subtle effects
 * Ghost White background, Indigo accents, Cabinet Grotesk typography
 */
export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    active_workflows: 0,
    total_executions: 0,
    success_rate: '0%',
    time_saved: '0h'
  })
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [workflowsRes, statsRes] = await Promise.all([
          workflowService.list(),
          workflowService.getDashboardStats()
        ])

        const workflowsData = workflowsRes.data?.workflows || workflowsRes.workflows || []
        setWorkflows(workflowsData)

        if (statsRes.data) {
          setStats(statsRes.data)
        }
      } catch (error) {
        logger.error('Failed to load dashboard data:', error)
        setWorkflows([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Metrics
  const metrics = [
    {
      label: 'Active Workflows',
      value: stats.active_workflows.toString(),
      change: 'Total',
      trend: 'neutral'
    },
    {
      label: 'Total Executions',
      value: stats.total_executions.toString(),
      change: 'All time',
      trend: 'up'
    },
    {
      label: 'Success Rate',
      value: stats.success_rate,
      change: 'Average',
      trend: 'up'
    },
    {
      label: 'Time Saved',
      value: stats.time_saved,
      change: 'Estimated',
      trend: 'up'
    },
  ]

  const recentWorkflows = workflows.slice(0, 6)

  if (loading) {
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
        {/* Header - Cabinet Grotesk typography */}
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
            Welcome back, {user?.name || 'User'}
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)'
            }}
          >
            Manage and execute your automation workflows
          </p>
        </div>

        {/* Metrics Grid - Bento Style */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {metrics.map((metric, index) => (
            <StatCard
              key={index}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              glow={metric.glow || false}
            />
          ))}
        </div>

        {/* Recent Workflows */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em'
              }}
            >
              Recent Workflows
            </h2>
            <button
              onClick={() => navigate('/workflows')}
              className="btn-ghost"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              View all →
            </button>
          </div>

          {recentWorkflows.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {recentWorkflows.map((workflow, index) => (
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
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
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
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '12px',
                      color: 'var(--neutral-500)'
                    }}
                  >
                    {workflow.execution_count || 0} executions
                  </div>
                </div>
              ))}
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
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
              <h3
                className="font-display"
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}
              >
                No workflows yet
              </h3>
              <p
                className="font-body"
                style={{
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  marginBottom: '24px'
                }}
              >
                Create your first workflow to get started
              </p>
              <button
                onClick={() => navigate('/workflows')}
                className="btn btn-primary"
                style={{ padding: '12px 32px', fontSize: '16px' }}
              >
                Explore Workflows
              </button>
            </div>
          )}
        </div>
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
