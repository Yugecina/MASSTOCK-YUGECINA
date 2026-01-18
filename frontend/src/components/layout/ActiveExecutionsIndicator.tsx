import { useNavigate } from 'react-router-dom';
import { useActiveExecutionsStore } from '../../store/activeExecutionsStore';
import './ActiveExecutionsIndicator.css';

interface ActiveExecutionsIndicatorProps {
  isCollapsed: boolean;
}

/**
 * ActiveExecutionsIndicator - Sidebar component for tracking active workflow executions
 *
 * Features:
 * - Shows progress of active (pending/processing) executions
 * - Badge count for multiple executions
 * - Clickable to navigate to execution details
 * - Pulse animation for processing state
 * - Collapsed/expanded states
 */
export function ActiveExecutionsIndicator({ isCollapsed }: ActiveExecutionsIndicatorProps) {
  const navigate = useNavigate();
  const { executions } = useActiveExecutionsStore();

  // Don't render if no active executions
  if (executions.length === 0) {
    return null;
  }

  // Primary execution (most recent)
  const primaryExecution = executions[0];
  const hasMultiple = executions.length > 1;
  const isProcessing = primaryExecution.status === 'processing';

  const handleClick = () => {
    navigate(`/executions/${primaryExecution.id}`);
  };

  return (
    <div
      className={`active-executions-indicator ${isProcessing ? 'active-executions-indicator--processing' : ''}`}
      onClick={handleClick}
      title={isCollapsed ? primaryExecution.workflow_name : undefined}
    >
      {/* Icon + Badge */}
      <div className="active-executions-icon">
        {/* Spinner icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isProcessing ? 'active-executions-spinner' : ''}
        >
          <path d="M9 1.5v3" />
          <path d="M9 13.5v3" />
          <path d="M3.7 3.7l2.1 2.1" />
          <path d="M12.2 12.2l2.1 2.1" />
          <path d="M1.5 9h3" />
          <path d="M13.5 9h3" />
          <path d="M3.7 14.3l2.1-2.1" />
          <path d="M12.2 5.8l2.1-2.1" />
        </svg>

        {/* Badge count for multiple executions */}
        {hasMultiple && (
          <span className="active-executions-badge">{executions.length}</span>
        )}
      </div>

      {/* Content (hidden when collapsed) */}
      {!isCollapsed && (
        <div className="active-executions-content">
          <div className="active-executions-info">
            <span className="active-executions-name">{primaryExecution.workflow_name}</span>
            <span className="active-executions-percentage">{primaryExecution.progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="active-executions-progress">
            <div
              className="active-executions-progress-fill"
              style={{ width: `${primaryExecution.progress}%` }}
            />
          </div>

          {/* Status text */}
          <span className="active-executions-status">
            {primaryExecution.status === 'pending' ? 'In queue...' : 'Processing...'}
          </span>
        </div>
      )}
    </div>
  );
}
