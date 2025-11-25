import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../hooks/useAuth'
import { workflowService } from '../services/workflows'
import logger from '@/utils/logger'

/**
 * Dashboard Page - Electric Trust Design System
 * Clean, compact, proper glassmorphism with CSS classes
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

  const metrics = [
    {
      label: 'Active Workflows',
      value: stats.active_workflows.toString(),
      change: 'Total active',
      trend: 'neutral',
      icon: '⚡',
      variant: 'highlight',
      glow: true
    },
    {
      label: 'Total Executions',
      value: stats.total_executions.toString(),
      change: 'All time',
      trend: 'up',
      icon: '🚀',
      variant: 'accent'
    },
    {
      label: 'Success Rate',
      value: stats.success_rate,
      change: 'Average',
      trend: 'up',
      icon: '✨',
      variant: 'success',
      glow: true
    },
    {
      label: 'Time Saved',
      value: stats.time_saved,
      change: 'Estimated',
      trend: 'up',
      icon: '⏱️',
      variant: 'default'
    },
  ]

  const recentWorkflows = workflows.slice(0, 6)

  const getGreeting = () => {
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

        {/* Stats Grid */}
        <div className="dashboard__stats-grid">
          {metrics.map((metric, index) => (
            <StatCard
              key={index}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              icon={metric.icon}
              variant={metric.variant}
              glow={metric.glow || false}
              delay={index * 50}
            />
          ))}
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
            <div className="dashboard__workflows-grid">
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

function WorkflowCard({ workflow, index, onClick }) {
  return (
    <article
      className="workflow-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="workflow-card__accent" />

      <div className="workflow-card__header">
        <div
          className="workflow-card__icon"
          style={{ background: getWorkflowGradient(index) }}
        >
          {getWorkflowIcon(workflow.name, index)}
        </div>

        <span className={`workflow-card__badge ${workflow.status === 'deployed' ? 'workflow-card__badge--active' : 'workflow-card__badge--inactive'}`}>
          {workflow.status === 'deployed' ? 'Active' : 'Inactive'}
        </span>
      </div>

      <h3 className="workflow-card__title">{workflow.name}</h3>
      <p className="workflow-card__description">
        {workflow.description || 'No description available'}
      </p>

      <div className="workflow-card__footer">
        <div className="workflow-card__runs">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {workflow.execution_count || 0} runs
        </div>

        <div className="workflow-card__arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </article>
  )
}

function EmptyState({ onNavigate }) {
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

function getWorkflowIcon(workflowName, index) {
  if (workflowName === 'Image Factory') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    )
  }

  if (workflowName === 'Nano Banana') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    )
  }

  const icons = ['⚡', '🔮', '🎨', '📊', '🔧', '💫']
  return icons[index % icons.length]
}

function getWorkflowGradient(index) {
  const gradients = [
    'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #14B8A6 0%, #6366F1 100%)',
  ]
  return gradients[index % gradients.length]
}
