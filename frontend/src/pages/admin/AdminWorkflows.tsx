/**
 * AdminWorkflows Page - TypeScript
 * Workflow template management with statistics
 * PURE CSS ONLY - No Tailwind
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/Spinner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminWorkflowService } from '../../services/adminWorkflowService';
import logger from '@/utils/logger';
import './AdminWorkflows.css';

interface WorkflowStats {
  total_executions?: number;
  success_rate?: number;
  revenue?: number | string;
}

interface WorkflowConfig {
  workflow_type?: string;
  [key: string]: any;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  config?: WorkflowConfig;
  stats?: WorkflowStats;
}

interface WorkflowsResponse {
  workflows?: Workflow[];
}

/**
 * AdminWorkflows Component
 * Data Luxury Design - Premium workflow management with sophisticated card layouts
 */
export function AdminWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkflows() {
      try {
        logger.debug('🔄 AdminWorkflows: Loading workflows...');
        const response: { data?: WorkflowsResponse } = await adminWorkflowService.getWorkflows();
        logger.debug('✅ AdminWorkflows: Response received:', response);
        setWorkflows(response.data?.workflows || []);
      } catch (error: any) {
        logger.error('❌ AdminWorkflows: Failed to load workflows:', error);
        toast.error('Failed to load workflows');
      } finally {
        setLoading(false);
      }
    }
    loadWorkflows();
  }, []);

  const formatRevenue = (revenue?: number | string): string => {
    const val = parseFloat(String(revenue || 0));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val);
  };

  const totalExecutions = workflows.reduce((sum, w) => sum + (w.stats?.total_executions || 0), 0);
  const totalRevenue = workflows.reduce((sum, w) => sum + parseFloat(String(w.stats?.revenue || 0)), 0);

  return (
    <AdminLayout>
      <div className="admin-workflows-page">
        {/* Hero Header */}
        <header className="admin-workflows-hero">
          <div className="admin-workflows-hero-content">
            <h1 className="admin-workflows-title">Workflow Templates</h1>
            <p className="admin-workflows-subtitle">
              Manage and monitor all workflow configurations across your platform
            </p>
          </div>
          <button
            className="admin-workflows-create-btn"
            onClick={() => toast('Create Workflow feature coming soon', { icon: 'ℹ️' })}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Template
          </button>
        </header>

        {loading ? (
          <div className="admin-workflows-loading">
            <Spinner size="lg" />
            <p>Loading workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="admin-workflows-empty">
            <div className="admin-workflows-empty-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="12" y="12" width="40" height="40" rx="4" stroke="var(--border)" strokeWidth="2"/>
                <path d="M24 28H40M24 36H32" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="admin-workflows-empty-title">No workflows yet</h3>
            <p className="admin-workflows-empty-text">Create your first workflow template to get started</p>
            <button className="admin-workflows-empty-btn" onClick={() => toast.info('Create Workflow feature coming soon')}>
              Create Template
            </button>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="admin-workflows-stats-bar">
              <div className="admin-workflows-count">
                <span className="admin-workflows-count-value">{workflows.length}</span>
                <span className="admin-workflows-count-label">Active Templates</span>
              </div>
              <div className="admin-workflows-stats-divider"></div>
              <div className="admin-workflows-stat-pill">
                <span className="admin-workflows-stat-pill-value">
                  {totalExecutions.toLocaleString()}
                </span>
                <span className="admin-workflows-stat-pill-label">Total Executions</span>
              </div>
              <div className="admin-workflows-stat-pill">
                <span className="admin-workflows-stat-pill-value">
                  {formatRevenue(totalRevenue)}
                </span>
                <span className="admin-workflows-stat-pill-label">Total Revenue</span>
              </div>
            </div>

            {/* Workflow Grid */}
            <div className="admin-workflows-grid">
              {workflows.map((workflow, index) => (
                <article
                  key={workflow.id}
                  className="admin-workflow-luxury-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Card Header */}
                  <div className="admin-workflow-luxury-header">
                    <div className="admin-workflow-luxury-title-section">
                      <h3 className="admin-workflow-luxury-name">{workflow.name}</h3>
                      <span className={`admin-workflow-luxury-badge ${workflow.config?.workflow_type === 'nano_banana' ? 'admin-workflow-luxury-badge--primary' : ''}`}>
                        {workflow.config?.workflow_type || 'standard'}
                      </span>
                    </div>
                    <p className="admin-workflow-luxury-description">
                      {workflow.description || 'No description provided'}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="admin-workflow-luxury-stats">
                    <div className="admin-workflow-luxury-stat">
                      <span className="admin-workflow-luxury-stat-label">Executions</span>
                      <span className="admin-workflow-luxury-stat-value">
                        {(workflow.stats?.total_executions || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-workflow-luxury-stat">
                      <span className="admin-workflow-luxury-stat-label">Success</span>
                      <span className="admin-workflow-luxury-stat-value admin-workflow-luxury-stat-value--success">
                        {workflow.stats?.success_rate || 0}%
                      </span>
                    </div>
                    <div className="admin-workflow-luxury-stat">
                      <span className="admin-workflow-luxury-stat-label">Revenue</span>
                      <span className="admin-workflow-luxury-stat-value admin-workflow-luxury-stat-value--revenue">
                        {formatRevenue(workflow.stats?.revenue || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="admin-workflow-luxury-actions">
                    <button
                      className="admin-workflow-luxury-action-btn admin-workflow-luxury-action-btn--edit"
                      onClick={() => toast('Edit feature coming soon', { icon: 'ℹ️' })}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M10 1L13 4L5 12H2V9L10 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                      Edit
                    </button>
                    <button
                      className="admin-workflow-luxury-action-btn admin-workflow-luxury-action-btn--delete"
                      onClick={() => toast.error('Delete feature coming soon')}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5H12M5.5 6V10.5M8.5 6V10.5M3.5 3.5L4.5 12H9.5L10.5 3.5M5.5 3.5V2H8.5V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Delete
                    </button>
                  </div>

                  {/* Hover Overlay Effect */}
                  <div className="admin-workflow-luxury-hover-border"></div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
