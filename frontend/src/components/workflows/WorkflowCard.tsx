import { Workflow } from '../../types'
import './WorkflowCard.css'

interface WorkflowCardProps {
  workflow: Workflow
  index?: number
  onClick: () => void
}

export function WorkflowCard({ workflow, index = 0, onClick }: WorkflowCardProps): JSX.Element {
  return (
    <article
      className="workflow-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms` }}
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
  )
}

function getWorkflowIcon(workflowName: string): JSX.Element {
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
  if (workflowName === 'Smart Resizer') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <path d="M9 2v20M2 9h20M2 15h20M15 2v20" opacity="0.5" />
      </svg>
    )
  }
  if (workflowName === 'Room Redesigner') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
        <path d="M7 8h2M15 8h2" />
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}
