import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import useAdminClientStore from '../../store/adminClientStore';
import { Spinner } from '../ui/Spinner';
import type { AssignWorkflowModalProps, WorkflowTemplate } from '../../types/admin';

/**
 * AssignWorkflowModal - Select template and assign to client
 */
export function AssignWorkflowModal({ clientId, onClose }: AssignWorkflowModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const {
    templates,
    templatesLoading,
    templatesError,
    fetchTemplates,
    assignWorkflow
  } = useAdminClientStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setCustomName('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedTemplate) {
      toast.error('Please select a workflow template');
      return;
    }

    setIsAssigning(true);
    const result = await assignWorkflow(
      clientId,
      selectedTemplate.id,
      customName || null
    );
    setIsAssigning(false);

    if (result.success) {
      toast.success('Workflow assigned successfully');
      onClose();
    } else {
      toast.error(result.error || 'Failed to assign workflow');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={handleBackdropClick}>
      <div className="admin-modal admin-modal--lg">
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">Assign Workflow</h3>
          <button className="admin-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            {templatesLoading ? (
              <div className="admin-loading">
                <Spinner size="md" />
              </div>
            ) : templatesError ? (
              <div className="admin-error-message">
                Failed to load templates: {templatesError}
              </div>
            ) : templates.length === 0 ? (
              <div className="admin-empty">
                <div className="admin-empty-icon">⚡</div>
                <h4 className="admin-empty-title">No templates available</h4>
                <p className="admin-empty-text">Create workflow templates first</p>
              </div>
            ) : (
              <>
                {/* Template Selection */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Select Template</label>
                  <div className="admin-template-grid">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className={`admin-template-card ${selectedTemplate?.id === template.id ? 'admin-template-card--selected' : ''}`}
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="admin-template-icon">
                          {template.icon === 'zap' ? '⚡' : template.icon === 'sparkles' ? '✨' : '📦'}
                        </div>
                        <h4 className="admin-template-name">{template.name}</h4>
                        <p className="admin-template-desc">{template.description}</p>
                        <div className="admin-template-pricing">
                          <span>Cost: ${template.cost_per_execution}/exec</span>
                          <span>Revenue: ${template.revenue_per_execution}/exec</span>
                        </div>
                        <span className="admin-badge admin-badge--sm">
                          {template.workflow_type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Name */}
                {selectedTemplate && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Custom Name (optional)</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder={`Default: ${selectedTemplate.name}`}
                      value={customName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomName(e.target.value)}
                    />
                    <p className="admin-form-hint">
                      Leave empty to use the template name with client name
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedTemplate || isAssigning || templatesLoading}
            >
              {isAssigning ? 'Assigning...' : 'Assign Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
