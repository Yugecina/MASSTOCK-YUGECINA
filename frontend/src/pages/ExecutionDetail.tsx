import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { BatchResultsView } from '../components/workflows/BatchResultsView'
import { workflowService } from '../services/workflows'
import logger from '@/utils/logger'

interface ExecutionData {
  id: string
  workflow_id?: string
  workflow_name?: string
  workflow_type?: string
  status: string
  progress?: number
  error_message?: string
  output_data?: Record<string, any>
  input_data?: Record<string, any>
  started_at?: string
  duration_seconds?: number
  created_at: string
}

interface WorkflowInfo {
  config: {
    workflow_type: string
  }
}

type ViewMode = 'pretty' | 'raw'

/**
 * ExecutionDetail Page
 * Detailed view of a single execution with input/output data and batch results
 */
export function ExecutionDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // State
  const [execution, setExecution] = useState<ExecutionData | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [inputDataViewMode, setInputDataViewMode] = useState<ViewMode>('pretty')
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  // Load execution and workflow data on mount
  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        logger.debug('🔍 ExecutionDetail.loadData: Fetching execution', { id })

        const execData = await workflowService.getExecution(id!)
        const executionData = execData.data?.data || execData.data

        logger.debug('✅ ExecutionDetail.loadData: Execution loaded', {
          id: executionData.id,
          status: executionData.status,
          workflow_name: executionData.workflow_name,
          workflow_type: executionData.workflow_type,
          started_at: executionData.started_at
        })

        setExecution(executionData)

        // Set workflow info from execution data (backend now includes workflow name and type)
        if (executionData.workflow_type) {
          setWorkflow({
            config: {
              workflow_type: executionData.workflow_type
            }
          })
        }
      } catch (err: any) {
        logger.error('❌ ExecutionDetail.loadData: Failed to load execution', {
          error: err,
          message: err.message,
          response: err.response,
          status: err.response?.status,
          id
        })
        setError('Execution not found')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  // Auto-refresh polling for pending/processing executions
  useEffect(() => {
    if (!execution || ['completed', 'failed'].includes(execution.status)) {
      return
    }

    logger.debug('🔄 ExecutionDetail: Starting polling', {
      execution_id: execution.id,
      status: execution.status
    })

    const interval = setInterval(async () => {
      try {
        const data = await workflowService.getExecution(id!)
        const updatedExecution = data.data?.data || data.data

        logger.debug('🔄 ExecutionDetail: Polling update', {
          execution_id: updatedExecution.id,
          status: updatedExecution.status,
          progress: updatedExecution.progress
        })

        setExecution(updatedExecution)
      } catch (err: any) {
        logger.error('❌ ExecutionDetail: Polling failed', {
          error: err,
          message: err.message,
          execution_id: id
        })
      }
    }, 3000)

    return () => {
      logger.debug('🛑 ExecutionDetail: Stopping polling')
      clearInterval(interval)
    }
  }, [id, execution?.status])

  // Copy input data to clipboard
  async function handleCopyInputData(data: Record<string, any>): Promise<void> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopyFeedback('input')
      setTimeout(() => setCopyFeedback(null), 2000)
      logger.debug('✅ ExecutionDetail.handleCopyInputData: Copied to clipboard')
    } catch (err) {
      logger.error('❌ ExecutionDetail.handleCopyInputData: Failed to copy', {
        error: err
      })
    }
  }

  // Detect base64 images
  function isBase64Image(str: any): boolean {
    if (typeof str !== 'string') return false
    return str.startsWith('data:image/') ||
           (str.length > 100 && /^[A-Za-z0-9+/]+={0,2}$/.test(str.substring(0, 100)))
  }

  // Render image value
  function renderImageValue(value: string): JSX.Element {
    const imageSrc = value.startsWith('data:image/')
      ? value
      : `data:image/jpeg;base64,${value}`

    return (
      <div className="execution-data-image-container">
        <img
          src={imageSrc}
          alt="Reference"
          className="execution-data-image"
          onClick={(e) => {
            e.stopPropagation()
            window.open(imageSrc, '_blank')
          }}
        />
        <div className="execution-data-image-hint">
          Click to view full size
        </div>
      </div>
    )
  }

  // Render object value
  function renderObjectValue(obj: Record<string, any>): JSX.Element {
    try {
      // Check if ALL values in object are base64 images
      const entries = Object.entries(obj)
      const allValuesAreImages = entries.length > 0 && entries.every(([key, val]) => {
        return typeof val === 'string' && isBase64Image(val)
      })

      if (allValuesAreImages) {
        return (
          <div className="execution-data-images-grid">
            {entries.map(([objKey, objValue]) => (
              <div key={objKey} className="execution-data-image-item">
                <div className="execution-data-object-key">{objKey}:</div>
                {renderImageValue(objValue)}
              </div>
            ))}
          </div>
        )
      }

      // Fallback: render as JSON
      return (
        <pre className="execution-data-object-preview">
          {JSON.stringify(obj, null, 2)}
        </pre>
      )
    } catch (err) {
      logger.error('❌ ExecutionDetail.renderObjectValue: Error rendering object', {
        error: err
      })
      return (
        <pre className="execution-data-object-preview">
          {JSON.stringify(obj, null, 2)}
        </pre>
      )
    }
  }

  // Render pretty input data
  function renderPrettyInputData(data: Record<string, any>): JSX.Element {
    if (!data || typeof data !== 'object') {
      return <div className="execution-data-value">{String(data)}</div>
    }

    try {
      return (
        <div className="execution-data-pretty">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="execution-data-row">
              <div className="execution-data-key">{key}</div>
              <div className="execution-data-value">
                {typeof value === 'object' && value !== null ? (
                  Array.isArray(value) ? (
                    <div className="execution-data-array">
                      {value.length === 0 ? (
                        <span className="execution-data-empty">Empty array</span>
                      ) : (
                        value.map((item, index) => (
                          <div key={index} className="execution-data-array-item">
                            {typeof item === 'object' && item !== null ? (
                              <pre className="execution-data-object-preview">
                                {JSON.stringify(item, null, 2)}
                              </pre>
                            ) : isBase64Image(item) ? (
                              renderImageValue(item)
                            ) : (
                              <span>{String(item)}</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    renderObjectValue(value)
                  )
                ) : isBase64Image(value) ? (
                  renderImageValue(value)
                ) : (
                  <span>{String(value)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    } catch (err) {
      logger.error('❌ ExecutionDetail.renderPrettyInputData: Error rendering data', {
        error: err
      })
      return (
        <div className="execution-data-value">
          Error rendering data. Check console for details.
        </div>
      )
    }
  }

  // Check if workflow is nano_banana type
  const isNanoBanana = workflow?.config?.workflow_type === 'nano_banana'

  // Loading state
  if (loading) {
    return (
      <ClientLayout>
        <div className="execution-detail-page">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh'
          }}>
            <Spinner size="lg" />
          </div>
        </div>
      </ClientLayout>
    )
  }

  // Error state
  if (error || !execution) {
    return (
      <ClientLayout>
        <div className="execution-detail-page">
          <button onClick={() => navigate('/executions')} className="execution-detail-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Executions
          </button>
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-12)'
          }}>
            <h2 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              marginBottom: 'var(--spacing-2)',
              color: 'var(--foreground)'
            }}>
              Execution not found
            </h2>
            <p style={{
              color: 'var(--muted-foreground)',
              marginBottom: 'var(--spacing-6)'
            }}>
              The execution you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => navigate('/executions')}
              className="execution-modal-btn-primary"
            >
              Back to Executions
            </button>
          </div>
        </div>
      </ClientLayout>
    )
  }

  // Get status badge class
  const getStatusBadgeClass = (): string => {
    switch (execution.status) {
      case 'completed':
        return 'execution-status-completed'
      case 'failed':
        return 'execution-status-failed'
      case 'processing':
        return 'execution-status-processing'
      case 'pending':
        return 'execution-status-pending'
      default:
        return 'execution-status-pending'
    }
  }

  // Main render
  return (
    <ClientLayout>
      <div className="execution-detail-page">
        {/* Back Button */}
        <button onClick={() => navigate('/executions')} className="execution-detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Executions
        </button>

        {/* Compact Header */}
        <div className="execution-detail-header-compact">
          <div className="execution-detail-title-row">
            <h1>{execution.workflow_name || 'Unknown Workflow'}</h1>
            <span className={`execution-status-badge ${getStatusBadgeClass()}`}>
              {execution.status}
            </span>
            {!['completed', 'failed'].includes(execution.status) && (
              <span className="execution-polling-indicator" title="Auto-refreshing">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </span>
            )}
          </div>
          <div className="execution-detail-meta-compact">
            <span>{execution.started_at ? new Date(execution.started_at).toLocaleString() : 'N/A'}</span>
            {execution.duration_seconds !== undefined && execution.duration_seconds !== null && (
              <>
                <span>•</span>
                <span>{execution.duration_seconds}s</span>
              </>
            )}
            {execution.progress !== undefined && execution.progress !== null && (
              <>
                <span>•</span>
                <span>{execution.progress}% complete</span>
              </>
            )}
          </div>
        </div>

        {/* Error Section */}
        {execution.error_message && (
          <div className="execution-modal-section execution-modal-error">
            <h3 className="execution-modal-section-title">Error Details</h3>
            <pre className="execution-modal-code">{execution.error_message}</pre>
          </div>
        )}

        {/* Batch Results (nano_banana) */}
        {isNanoBanana && execution.status === 'completed' && (
          <div className="execution-modal-section">
            <h3 className="execution-detail-section-title">Batch Results</h3>
            <BatchResultsView executionId={execution.id} />
          </div>
        )}

        {/* Output Data (standard workflows) */}
        {!isNanoBanana && execution.output_data && Object.keys(execution.output_data).length > 0 && (
          <div className="execution-modal-section">
            <h3 className="execution-detail-section-title">Output Data</h3>
            <pre className="execution-modal-code">
              {JSON.stringify(execution.output_data, null, 2)}
            </pre>
          </div>
        )}

        {/* Input Data Section */}
        {execution.input_data && Object.keys(execution.input_data).length > 0 && (
          <div className="execution-modal-section">
            <div className="execution-modal-section-header">
              <h3 className="execution-detail-section-title">Input Data</h3>
              <div className="execution-modal-section-actions">
                {/* Pretty/Raw Toggle */}
                <div className="execution-data-view-toggle">
                  <button
                    onClick={() => setInputDataViewMode('pretty')}
                    className={`execution-data-view-btn ${inputDataViewMode === 'pretty' ? 'active' : ''}`}
                  >
                    Pretty
                  </button>
                  <button
                    onClick={() => setInputDataViewMode('raw')}
                    className={`execution-data-view-btn ${inputDataViewMode === 'raw' ? 'active' : ''}`}
                  >
                    Raw
                  </button>
                </div>
                {/* Copy Button */}
                <button
                  onClick={() => handleCopyInputData(execution.input_data!)}
                  className={`execution-modal-copy-btn ${copyFeedback === 'input' ? 'copied' : ''}`}
                  title="Copy Input Data"
                >
                  {copyFeedback === 'input' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                  {copyFeedback === 'input' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            {inputDataViewMode === 'pretty'
              ? renderPrettyInputData(execution.input_data)
              : <pre className="execution-modal-code">{JSON.stringify(execution.input_data, null, 2)}</pre>
            }
          </div>
        )}

        {/* Actions Footer */}
        {execution.workflow_id && (
          <div className="execution-detail-actions">
            <button
              onClick={() => {
                logger.debug('🔍 ExecutionDetail: Navigating to workflow', {
                  workflow_id: execution.workflow_id
                })
                navigate(`/workflows/${execution.workflow_id}/execute`)
              }}
              className="execution-modal-btn-primary"
            >
              View Workflow
            </button>
            <button
              onClick={() => {
                // Préparer les données pour pré-remplissage
                // ⚠️ IMPORTANT: Backend stocke "prompts" (array), on doit le convertir en "prompts_text" (string)
                const promptsArray = execution.input_data?.prompts || []
                const promptsText = Array.isArray(promptsArray)
                  ? promptsArray.join('\n\n')  // Joindre avec double newline (format backend)
                  : ''

                // Convertir le nom complet du modèle en 'flash' ou 'pro'
                const modelName = execution.input_data?.model || ''
                const modelShortName = modelName.toLowerCase().includes('flash') ? 'flash' : 'pro'

                const prefillData = {
                  prompts_text: promptsText,
                  model: modelShortName,
                  aspect_ratio: execution.input_data?.aspect_ratio || '1:1',
                  resolution: execution.input_data?.resolution || '1K',
                  reference_images_base64: execution.input_data?.reference_images || null
                }
                logger.debug('🔄 ExecutionDetail: Run Again with prefill data', {
                  workflow_id: execution.workflow_id,
                  execution_input_data_keys: execution.input_data ? Object.keys(execution.input_data) : [],
                  prompts_array_length: promptsArray.length,
                  prefillData: {
                    prompts_text_length: prefillData.prompts_text.length,
                    prompts_count: promptsArray.length,
                    model: prefillData.model,
                    aspect_ratio: prefillData.aspect_ratio,
                    resolution: prefillData.resolution,
                    has_images: !!prefillData.reference_images_base64,
                    images_type: typeof prefillData.reference_images_base64,
                    images_keys: prefillData.reference_images_base64 ? Object.keys(prefillData.reference_images_base64) : []
                  }
                })
                navigate(`/workflows/${execution.workflow_id}/execute`, {
                  state: { prefillData, fromExecutionId: execution.id }
                })
              }}
              className="execution-modal-btn-secondary"
            >
              Run Again
            </button>
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
