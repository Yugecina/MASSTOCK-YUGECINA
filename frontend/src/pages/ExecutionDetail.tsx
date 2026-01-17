/**
 * ExecutionDetail Page
 * Detailed view of a single execution with input/output data and batch results
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientLayout } from '../components/layout/ClientLayout';
import { Spinner } from '../components/ui/Spinner';
import { BatchResultsView } from '../components/workflows/BatchResultsView';
import { RoomRedesignerResults } from '../components/workflows/RoomRedesignerResults';
import { workflowService } from '../services/workflows';
import { renderPrettyData } from '@/utils/renderHelpers';
import { isTerminalExecutionStatus } from '@/hooks/useExecutionPolling';
import logger from '@/utils/logger';
import './ExecutionDetail.css';

interface ExecutionData {
  id: string;
  workflow_id?: string;
  workflow_name?: string;
  workflow_type?: string;
  status: string;
  progress?: number;
  error_message?: string;
  output_data?: Record<string, unknown>;
  input_data?: Record<string, unknown>;
  started_at?: string;
  duration_seconds?: number;
  created_at: string;
}

type ViewMode = 'pretty' | 'raw';

/** Status badge CSS class mapping */
const STATUS_BADGE_CLASSES: Record<string, string> = {
  completed: 'execution-status-completed',
  failed: 'execution-status-failed',
  processing: 'execution-status-processing',
  pending: 'execution-status-pending'
};

function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status] || 'execution-status-pending';
}

/** Build prefill data for "Run Again" functionality */
function buildPrefillData(execution: ExecutionData): Record<string, unknown> {
  const workflowType = execution.workflow_type;

  if (workflowType === 'room_redesigner') {
    const prefillData = {
      design_style: execution.input_data?.design_style || 'modern',
      budget_level: execution.input_data?.budget_level || 'medium',
      season: execution.input_data?.season || null,
      room_images_base64: execution.input_data?.room_images || null
    };

    logger.debug('ExecutionDetail: Room Redesigner prefill data created', {
      design_style: prefillData.design_style,
      budget_level: prefillData.budget_level,
      season: prefillData.season,
      hasRoomImages: !!prefillData.room_images_base64
    });

    return prefillData;
  }

  // Nano Banana prefill data (default)
  const promptsArray = (execution.input_data?.prompts as string[]) || [];
  const promptsText = Array.isArray(promptsArray) ? promptsArray.join('\n\n') : '';
  const modelName = (execution.input_data?.model as string) || '';
  const modelShortName = modelName.toLowerCase().includes('flash') ? 'flash' : 'pro';

  const prefillData = {
    prompts_text: promptsText,
    model: modelShortName,
    aspect_ratio: execution.input_data?.aspect_ratio || '1:1',
    resolution: execution.input_data?.resolution || '1K',
    reference_images_base64: execution.input_data?.reference_images || null
  };

  logger.debug('ExecutionDetail: Nano Banana prefill data created', {
    promptsCount: promptsArray.length,
    model: prefillData.model,
    hasRefImages: !!prefillData.reference_images_base64
  });

  return prefillData;
}

export function ExecutionDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [execution, setExecution] = useState<ExecutionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inputDataViewMode, setInputDataViewMode] = useState<ViewMode>('pretty');
  const [inputDataExpanded, setInputDataExpanded] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Fetch execution data
  const fetchExecution = useCallback(async (): Promise<ExecutionData | null> => {
    try {
      const execData = await workflowService.getExecution(id!);
      return execData.data?.data || execData.data;
    } catch (err) {
      logger.error('ExecutionDetail.fetchExecution: Failed', { error: err, id });
      return null;
    }
  }, [id]);

  // Load execution on mount
  useEffect(() => {
    async function loadData(): Promise<void> {
      logger.debug('ExecutionDetail.loadData: Fetching execution', { id });
      const executionData = await fetchExecution();

      if (executionData) {
        logger.debug('ExecutionDetail.loadData: Execution loaded', {
          id: executionData.id,
          status: executionData.status,
          workflow_name: executionData.workflow_name
        });
        setExecution(executionData);
      } else {
        setError('Execution not found');
      }
      setLoading(false);
    }
    loadData();
  }, [id, fetchExecution]);

  // Auto-refresh polling for pending/processing executions
  useEffect(() => {
    if (!execution || isTerminalExecutionStatus(execution.status)) {
      return;
    }

    logger.debug('ExecutionDetail: Starting polling', { status: execution.status });

    const interval = setInterval(async () => {
      const updatedExecution = await fetchExecution();
      if (updatedExecution) {
        logger.debug('ExecutionDetail: Polling update', {
          status: updatedExecution.status,
          progress: updatedExecution.progress
        });
        setExecution(updatedExecution);
      }
    }, 3000);

    return () => {
      logger.debug('ExecutionDetail: Stopping polling');
      clearInterval(interval);
    };
  }, [execution?.status, fetchExecution]);

  // Copy input data to clipboard
  async function handleCopyInputData(): Promise<void> {
    if (!execution?.input_data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(execution.input_data, null, 2));
      setCopyFeedback('input');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      logger.error('ExecutionDetail.handleCopyInputData: Failed', { error: err });
    }
  }

  // Loading state
  if (loading) {
    return (
      <ClientLayout>
        <div className="execution-detail-page execution-detail-loading">
          <Spinner size="lg" />
        </div>
      </ClientLayout>
    );
  }

  // Error state
  if (error || !execution) {
    return (
      <ClientLayout>
        <div className="execution-detail-page">
          <BackButton onClick={() => navigate('/executions')} />
          <div className="execution-detail-error">
            <h2>Execution not found</h2>
            <p>The execution you're looking for doesn't exist or has been deleted.</p>
            <button onClick={() => navigate('/executions')} className="execution-modal-btn-primary">
              Back to Executions
            </button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const workflowType = execution.workflow_type;
  const isNanoBanana = workflowType === 'nano_banana';
  const isSmartResizer = workflowType === 'smart_resizer';
  const isRoomRedesigner = workflowType === 'room_redesigner';
  const isPolling = !isTerminalExecutionStatus(execution.status);

  return (
    <ClientLayout>
      <div className="execution-detail-page">
        <BackButton onClick={() => navigate('/executions')} />

        {/* Header */}
        <div className="execution-detail-header-compact">
          <div className="execution-detail-title-row">
            <h1>{execution.workflow_name || 'Unknown Workflow'}</h1>
            <span className={`execution-status-badge ${getStatusBadgeClass(execution.status)}`}>
              {execution.status}
            </span>
            {isPolling && <PollingIndicator />}
          </div>
          <ExecutionMeta execution={execution} />
        </div>

        {/* Error Section */}
        {execution.error_message && (
          <div className="execution-modal-section execution-modal-error">
            <h3 className="execution-modal-section-title">Error Details</h3>
            <pre className="execution-modal-code">{execution.error_message}</pre>
          </div>
        )}

        {/* Results Section */}
        {(isNanoBanana || isSmartResizer) && execution.status === 'completed' && (
          <div className="execution-modal-section">
            <h3 className="execution-detail-section-title">Batch Results</h3>
            <BatchResultsView executionId={execution.id} />
          </div>
        )}

        {isRoomRedesigner && execution.status === 'completed' && (
          <div className="execution-modal-section">
            <RoomRedesignerResults executionId={execution.id} />
          </div>
        )}

        {/* Fallback Output Data */}
        {!isNanoBanana && !isSmartResizer && !isRoomRedesigner && execution.output_data && Object.keys(execution.output_data).length > 0 && (
          <div className="execution-modal-section">
            <h3 className="execution-detail-section-title">Output Data</h3>
            <pre className="execution-modal-code">{JSON.stringify(execution.output_data, null, 2)}</pre>
          </div>
        )}

        {/* Technical Input Data */}
        {execution.input_data && Object.keys(execution.input_data).length > 0 && (
          <TechnicalDataSection
            inputData={execution.input_data}
            expanded={inputDataExpanded}
            onToggle={() => setInputDataExpanded(!inputDataExpanded)}
            viewMode={inputDataViewMode}
            onViewModeChange={setInputDataViewMode}
            onCopy={handleCopyInputData}
            copyFeedback={copyFeedback}
          />
        )}

        {/* Actions */}
        {execution.workflow_id && (
          <div className="execution-detail-actions">
            <button
              onClick={() => navigate(`/workflows/${execution.workflow_id}/execute`)}
              className="execution-modal-btn-primary"
            >
              View Workflow
            </button>
            <button
              onClick={() => {
                const prefillData = buildPrefillData(execution);
                navigate(`/workflows/${execution.workflow_id}/execute`, {
                  state: { prefillData, fromExecutionId: execution.id }
                });
              }}
              className="execution-modal-btn-secondary"
            >
              Run Again
            </button>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}

/** Back button component */
function BackButton({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button onClick={onClick} className="execution-detail-back">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      Back to Executions
    </button>
  );
}

/** Polling indicator icon */
function PollingIndicator(): JSX.Element {
  return (
    <span className="execution-polling-indicator" title="Auto-refreshing">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    </span>
  );
}

/** Execution metadata display */
function ExecutionMeta({ execution }: { execution: ExecutionData }): JSX.Element {
  return (
    <div className="execution-detail-meta-compact">
      <span>{execution.started_at ? new Date(execution.started_at).toLocaleString() : 'N/A'}</span>
      {execution.duration_seconds != null && (
        <>
          <span>•</span>
          <span>{execution.duration_seconds}s</span>
        </>
      )}
      {execution.progress != null && (
        <>
          <span>•</span>
          <span>{execution.progress}% complete</span>
        </>
      )}
    </div>
  );
}

/** Technical data section with expand/collapse */
interface TechnicalDataSectionProps {
  inputData: Record<string, unknown>;
  expanded: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCopy: () => void;
  copyFeedback: string | null;
}

function TechnicalDataSection({
  inputData,
  expanded,
  onToggle,
  viewMode,
  onViewModeChange,
  onCopy,
  copyFeedback
}: TechnicalDataSectionProps): JSX.Element {
  return (
    <div className={`execution-technical-section ${expanded ? 'expanded' : ''}`}>
      <button className="execution-technical-header" onClick={onToggle} type="button">
        <div className="execution-technical-header-left">
          <svg className="execution-technical-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <div className="execution-technical-header-text">
            <span className="execution-technical-title">Donnees techniques</span>
            <span className="execution-technical-subtitle">Parametres d'entree de l'execution</span>
          </div>
        </div>
        <span className="execution-technical-toggle-label">{expanded ? 'Masquer' : 'Afficher'}</span>
      </button>

      {expanded && (
        <div className="execution-technical-content">
          <div className="execution-technical-actions">
            <div className="execution-data-view-toggle">
              <button
                className={`execution-data-view-btn ${viewMode === 'pretty' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onViewModeChange('pretty'); }}
              >
                Pretty
              </button>
              <button
                className={`execution-data-view-btn ${viewMode === 'raw' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onViewModeChange('raw'); }}
              >
                Raw
              </button>
            </div>
            <CopyButton onClick={onCopy} copied={copyFeedback === 'input'} />
          </div>

          {viewMode === 'pretty'
            ? renderPrettyData(inputData)
            : <pre className="execution-modal-code">{JSON.stringify(inputData, null, 2)}</pre>
          }
        </div>
      )}
    </div>
  );
}

/** Copy button with feedback */
function CopyButton({ onClick, copied }: { onClick: () => void; copied: boolean }): JSX.Element {
  return (
    <button
      className={`execution-modal-copy-btn ${copied ? 'copied' : ''}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title="Copier les donnees"
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
