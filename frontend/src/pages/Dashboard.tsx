import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { WorkflowCard } from '../components/workflows/WorkflowCard'
import { useAuth } from '../hooks/useAuth'
import { workflowService } from '../services/workflows'
import logger from '@/utils/logger'
import { Workflow } from '../types'
import './Dashboard.css'

interface DashboardStats {
  active_workflows: number
  total_executions: number
  success_rate: string
  time_saved: string
}

interface EmptyStateProps {
  onNavigate: () => void
}

/**
 * Dashboard Page - Electric Trust Design System
 * Clean, compact, proper glassmorphism with CSS classes
 */
export function Dashboard(): JSX.Element {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    active_workflows: 0,
    total_executions: 0,
    success_rate: '0%',
    time_saved: '0h'
  })
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadData(): Promise<void> {
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

  const recentWorkflows = workflows.slice(0, 6)

  const getGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <ClientLayout>
        <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Spinner size="lg" />
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="dashboard">
        {/* Header */}
        <header style={{ marginBottom: '32px' }}>
          <div className="dashboard__greeting-badge">
            <span>👋</span>
            {getGreeting()}
          </div>

          <h1 className="dashboard__title">
            Welcome back, <span className="dashboard__title-gradient">{user?.name || 'User'}</span>
          </h1>

          <p className="dashboard__subtitle">
            Your automation workflows are ready. Monitor your executions and transform your processes.
          </p>
        </header>

        {/* Stats Cards - Clean & Simple */}
        <div className="dashboard__stats-grid">
          <div className="dashboard__stat-card">
            <span className="dashboard__stat-label">Workflows</span>
            <span className="dashboard__stat-value">{stats.active_workflows}</span>
          </div>
          <div className="dashboard__stat-card">
            <span className="dashboard__stat-label">Executions</span>
            <span className="dashboard__stat-value">{stats.total_executions}</span>
          </div>
          <div className="dashboard__stat-card">
            <span className="dashboard__stat-label">Success Rate</span>
            <span className="dashboard__stat-value dashboard__stat-value--success">{stats.success_rate}</span>
          </div>
          <div className="dashboard__stat-card">
            <span className="dashboard__stat-label">Time Saved</span>
            <span className="dashboard__stat-value">{stats.time_saved}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard__actions">
          <button
            onClick={() => navigate('/workflows')}
            className="dashboard__action-btn dashboard__action-btn--primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Execution
          </button>

          <button
            onClick={() => navigate('/executions')}
            className="dashboard__action-btn dashboard__action-btn--secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            View History
          </button>
        </div>

        {/* Workflows Section */}
        <section>
          <div className="dashboard__section-header">
            <div>
              <h2 className="dashboard__section-title">Your Workflows</h2>
              <p className="dashboard__section-count">
                {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <button onClick={() => navigate('/workflows')} className="dashboard__view-all">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {recentWorkflows.length > 0 ? (
            <div className="workflows-grid">
              {recentWorkflows.map((workflow, index) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  index={index}
                  onClick={() => navigate(`/workflows/${workflow.id}/execute`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState onNavigate={() => navigate('/workflows')} />
          )}
        </section>
      </div>
    </ClientLayout>
  )
}

function EmptyState({ onNavigate }: EmptyStateProps): JSX.Element {
  return (
    <div className="dashboard__empty">
      <div className="dashboard__empty-icon">🎯</div>
      <h3 className="dashboard__empty-title">No workflows yet</h3>
      <p className="dashboard__empty-text">
        Create your first workflow to start automating your processes.
      </p>
      <button
        onClick={onNavigate}
        className="dashboard__action-btn dashboard__action-btn--primary"
      >
        Explore Workflows
      </button>
    </div>
  )
}

