import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { workflowService } from '../services/workflows'
import { NanoBananaForm } from '../components/workflows/NanoBananaForm'
import { SmartResizerForm } from '../components/workflows/SmartResizerForm'
import { BatchResultsView } from '../components/workflows/BatchResultsView'
import logger from '@/utils/logger'
import { Workflow } from '../types'
import './WorkflowExecute.css'

interface WorkflowConfig {
  workflow_type?: string
  fields?: Array<{
    name: string
    label?: string
    type?: string
    placeholder?: string
    required?: boolean
  }>
}

interface WorkflowWithConfig extends Workflow {
  config?: WorkflowConfig
}

interface ProgressStats {
  current: number
  total: number
  succeeded: number
  failed: number
}

interface ExecutionData {
  execution_id: string
  id: string
  status: string
  progress?: number
  output_data?: {
    batch_results?: Array<{
      status: string
    }>
  }
  error_message?: string
  input_data?: {
    prompts?: string[]
    model?: string
    aspect_ratio?: string
    resolution?: string
    reference_images?: any
  }
}

interface PrefillData {
  prompts_text: string
  model: string
  aspect_ratio: string
  resolution: string
  reference_images_base64?: any
}

interface LocationState {
  prefillData?: PrefillData
  fromExecutionId?: string
}

interface StepLabel {
  name: string
  desc: string
}

/**
 * WorkflowExecute Page - Dark Premium Style
 * Clean CSS classes, minimal inline styles
 */
export function WorkflowExecute(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState<number>(1)
  const [workflow, setWorkflow] = useState<WorkflowWithConfig | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [execution, setExecution] = useState<ExecutionData | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [progressStats, setProgressStats] = useState<ProgressStats>({ current: 0, total: 0, succeeded: 0, failed: 0 })
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false)
  const [currentPrefillData, setCurrentPrefillData] = useState<PrefillData | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Extract prefill data from navigation state (for "Run Again" feature)
  const locationState = location.state as LocationState | null
  const prefillData = currentPrefillData || locationState?.prefillData || null

  // Log location state on every render (debugging)
  useEffect(() => {
    logger.debug('🔍 WorkflowExecute: Location state check', {
      has_location_state: !!locationState,
      location_state_keys: locationState ? Object.keys(locationState) : [],
      has_prefillData: !!prefillData,
      prefillData_keys: prefillData ? Object.keys(prefillData) : []
    })

    if (prefillData) {
      logger.debug('✅ WorkflowExecute: Received prefill data from Run Again', {
        prompts_text_length: prefillData.prompts_text?.length,
        model: prefillData.model,
        aspect_ratio: prefillData.aspect_ratio,
        resolution: prefillData.resolution,
        has_images: !!prefillData.reference_images_base64,
        images_type: typeof prefillData.reference_images_base64,
        images_is_array: Array.isArray(prefillData.reference_images_base64),
        fromExecutionId: locationState?.fromExecutionId
      })
    } else {
      logger.debug('⚠️ WorkflowExecute: No prefill data found')
    }
  }, [locationState, prefillData])

  useEffect(() => {
    async function loadWorkflow(): Promise<void> {
      try {
        logger.debug('🔍 WorkflowExecute: Loading workflow:', id)
        const response = await workflowService.get(id!)
        setWorkflow(response.data.workflow)
        logger.debug('✅ WorkflowExecute: Workflow loaded:', response.data.workflow.name)
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to load workflow'
        setError(errorMessage)
        logger.error('❌ WorkflowExecute: Failed to load workflow:', {
          error: err,
          message: err.message,
          response: err.response
        })
      }
    }
    loadWorkflow()
  }, [id])

  useEffect(() => {
    if (step === 2 && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, startTime])

  const isNanoBanana = workflow?.config?.workflow_type === 'nano_banana'
  const isSmartResizer = workflow?.config?.workflow_type === 'smart_resizer'

  const handleExecute = async (data: Record<string, any> | FormData): Promise<void> => {
    setLoading(true)
    setError(null)
    setStartTime(Date.now())
    setElapsedTime(0)

    try {
      logger.debug('🚀 WorkflowExecute: Executing workflow:', id)
      const result = await workflowService.execute(id!, data)
      logger.debug('📦 WorkflowExecute: Execute result:', {
        success: result.data.success,
        hasData: !!result.data.data,
        dataKeys: result.data.data ? Object.keys(result.data.data) : []
      })

      const executionData = result.data.data || result.data
      setExecution(executionData)
      setStep(2)
      logger.debug('✅ WorkflowExecute: Execution started, execution_id:', executionData.execution_id)
      pollExecutionStatus(executionData.execution_id)
    } catch (err: any) {
      const errorMessage = getActionableErrorMessage(err)
      setError(errorMessage)
      setStartTime(null)
      logger.error('❌ WorkflowExecute: Execution error:', {
        error: err,
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStandardExecute = (): void => {
    handleExecute(formData)
  }

  const pollExecutionStatus = (executionId: string): void => {
    logger.debug('🔄 WorkflowExecute: Starting to poll execution:', executionId)

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await workflowService.getExecution(executionId)
        logger.debug('📥 WorkflowExecute: Polling response:', {
          status: response.status,
          hasData: !!response.data
        })

        const status = response.data.data || response.data

        logger.debug('📊 WorkflowExecute: Execution status:', {
          id: status.id,
          status: status.status,
          progress: status.progress,
          hasOutputData: !!status.output_data
        })

        setExecution(status)
        setProgress(status.progress || 0)

        if (status.output_data?.batch_results) {
          const results = status.output_data.batch_results
          const succeeded = results.filter((r: any) => r.status === 'completed').length
          const failed = results.filter((r: any) => r.status === 'failed').length
          const current = succeeded + failed
          const total = results.length

          setProgressStats({ current, total, succeeded, failed })
          logger.debug('📊 WorkflowExecute: Progress stats:', { current, total, succeeded, failed })
        }

        if (status.status === 'completed' || status.status === 'failed') {
          logger.debug('✅ WorkflowExecute: Execution finished, moving to results')
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
          }
          setStep(3)
          setLoading(false)
        }
      } catch (err: any) {
        logger.error('❌ WorkflowExecute: Polling error:', {
          error: err,
          message: err.message,
          response: err.response
        })
      }
    }, 2000)
  }

  const handleCancelExecution = async (): Promise<void> => {
    logger.debug('🛑 WorkflowExecute: User requested cancellation')
    setShowCancelModal(false)

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    setStep(1)
    setFormData({})
    setExecution(null)
    setProgress(0)
    setError('Batch execution cancelled by user')
    setStartTime(null)
    setElapsedTime(0)
    setProgressStats({ current: 0, total: 0, succeeded: 0, failed: 0 })

    logger.debug('✅ WorkflowExecute: Cancellation complete')
  }

  const getActionableErrorMessage = (err: any): string => {
    const status = err.response?.status
    const message = err.response?.data?.message || err.message

    logger.debug('🔍 WorkflowExecute: Parsing error:', { status, message })

    if (message?.toLowerCase().includes('api key') || message?.toLowerCase().includes('authentication')) {
      return 'Invalid API key. Get a new key from Google AI Studio → https://aistudio.google.com/app/apikey'
    }

    if (status === 429 || message?.toLowerCase().includes('rate limit')) {
      return 'Rate limit exceeded. Please try again in 5 minutes.'
    }

    if (message?.toLowerCase().includes('network') || message?.toLowerCase().includes('timeout')) {
      return 'Network timeout. Check your internet connection and retry in 30 seconds.'
    }

    if (message?.toLowerCase().includes('file') && message?.toLowerCase().includes('size')) {
      return 'File size exceeds limit. Ensure each image is under 10MB.'
    }

    return `Error: ${message}`
  }

  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const estimateTimeRemaining = (): string | null => {
    if (progressStats.current === 0 || progressStats.total === 0) return null

    const avgTimePerItem = elapsedTime / progressStats.current
    const remainingItems = progressStats.total - progressStats.current
    const estimatedSeconds = Math.floor(avgTimePerItem * remainingItems)

    return formatElapsedTime(estimatedSeconds)
  }

  const resetExecution = (): void => {
    // Préparer les données de préfill à partir de l'exécution actuelle (pour "Run Again")
    if (execution?.input_data && isNanoBanana) {
      // Convertir "prompts" (array) en "prompts_text" (string)
      const promptsArray = execution.input_data.prompts || []
      const promptsText = Array.isArray(promptsArray)
        ? promptsArray.join('\n\n')
        : ''

      // Convertir le nom complet du modèle en 'flash' ou 'pro'
      const modelName = execution.input_data.model || ''
      const modelShortName = modelName.toLowerCase().includes('flash') ? 'flash' : 'pro'

      const newPrefillData: PrefillData = {
        prompts_text: promptsText,
        model: modelShortName,
        aspect_ratio: execution.input_data.aspect_ratio || '1:1',
        resolution: execution.input_data.resolution || '1K',
        reference_images_base64: execution.input_data.reference_images || null
      }

      logger.debug('🔄 WorkflowExecute: Preparing prefill data for Run Again', {
        prompts_count: promptsArray.length,
        model: modelShortName,
        aspect_ratio: newPrefillData.aspect_ratio,
        resolution: newPrefillData.resolution,
        has_images: !!newPrefillData.reference_images_base64
      })

      setCurrentPrefillData(newPrefillData)
    }

    // Réinitialiser les states
    setStep(1)
    setFormData({})
    setExecution(null)
    setProgress(0)
    setError(null)
    setStartTime(null)
    setElapsedTime(0)
    setProgressStats({ current: 0, total: 0, succeeded: 0, failed: 0 })
  }

  const handleFormInputChange = (fieldName: string, value: string): void => {
    setFormData({ ...formData, [fieldName]: value })
  }

  const stepLabels: StepLabel[] = [
    { name: 'Configure', desc: 'Set up your workflow' },
    { name: 'Processing', desc: 'Generating images' },
    { name: 'Results', desc: 'View your results' }
  ]

  if (!workflow) {
    return (
      <ClientLayout>
        <div className="workflow-execute" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Spinner size="lg" />
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="workflow-execute">
        {/* Back Button */}
        <button onClick={() => navigate('/workflows')} className="workflow-execute-back">
          <svg width="16" height="16" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Workflows
        </button>

        {/* Header */}
        <header className="workflow-execute-header">
          <h1 className="workflow-execute-title">{workflow.name}</h1>
          <p className="workflow-execute-description">{workflow.description}</p>
        </header>

        {/* Step Indicator */}
        <div className="workflow-steps">
          <div className="workflow-steps-bars">
            {stepLabels.map((_, i) => (
              <div
                key={i}
                className={`workflow-step-bar ${step > i ? 'workflow-step-bar--completed' : ''} ${step === i + 1 ? 'workflow-step-bar--active' : ''}`}
              />
            ))}
          </div>

          <div className="workflow-steps-labels">
            {stepLabels.map((label, i) => (
              <div
                key={i}
                className={`workflow-step-label ${step === i + 1 ? 'workflow-step-label--active' : ''} ${step > i ? 'workflow-step-label--completed' : ''}`}
              >
                <div className="workflow-step-label-name">
                  {step > i && '✓ '}
                  {label.name}
                </div>
                <div className="workflow-step-label-desc">{label.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="workflow-error">
            <svg className="workflow-error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="workflow-error-content">
              <p className="workflow-error-title">Error</p>
              <p className="workflow-error-message">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Configure */}
        {step === 1 && (
          <div className="workflow-form-card">
            {isNanoBanana ? (
              <>
                <h2 className="workflow-form-title">Configure Batch Image Generation</h2>
                <NanoBananaForm
                  onSubmit={handleExecute}
                  loading={loading}
                  workflow={workflow}
                  initialData={prefillData}
                />
              </>
            ) : isSmartResizer ? (
              <>
                <h2 className="workflow-form-title">Configure Smart Resizer</h2>
                <SmartResizerForm
                  onSubmit={handleExecute}
                  loading={loading}
                  workflow={workflow}
                />
              </>
            ) : (
              <>
                <h2 className="workflow-form-title">Configure Workflow</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {workflow.config?.fields && workflow.config.fields.length > 0 ? (
                    workflow.config.fields.map((field) => (
                      <div key={field.name}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'var(--foreground)',
                          marginBottom: '8px'
                        }}>
                          {field.label || field.name}
                        </label>
                        <input
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFormInputChange(field.name, e.target.value)}
                          required={field.required}
                          className="workflows-search-input"
                          style={{ paddingLeft: '14px' }}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="workflow-form-empty">No configuration required for this workflow</p>
                  )}
                  <button
                    onClick={handleStandardExecute}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px 24px' }}
                  >
                    {loading ? 'Executing...' : 'Execute Workflow'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Processing */}
        {step === 2 && (
          <div className="workflow-processing">
            <div className="workflow-processing-glow" />

            <div style={{ position: 'relative' }}>
              <div className="workflow-processing-spinner">
                <Spinner size="lg" />
              </div>

              <h3 className="workflow-processing-title">Processing Workflow</h3>
              <p className="workflow-processing-subtitle">Generating your results...</p>

              {/* Progress Stats */}
              {isNanoBanana && progressStats.total > 0 && (
                <div className="workflow-progress-stats">
                  <div className="workflow-progress-stat workflow-progress-stat--primary">
                    <div className="workflow-progress-stat-value">{progressStats.current}</div>
                    <div className="workflow-progress-stat-label">Current</div>
                  </div>

                  <div className="workflow-progress-stat workflow-progress-stat--success">
                    <div className="workflow-progress-stat-value">{progressStats.succeeded}</div>
                    <div className="workflow-progress-stat-label">Success</div>
                  </div>

                  {progressStats.failed > 0 && (
                    <div className="workflow-progress-stat workflow-progress-stat--error">
                      <div className="workflow-progress-stat-value">{progressStats.failed}</div>
                      <div className="workflow-progress-stat-label">Failed</div>
                    </div>
                  )}

                  <div className="workflow-progress-stat">
                    <div className="workflow-progress-stat-value">{progressStats.total}</div>
                    <div className="workflow-progress-stat-label">Total</div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {progress > 0 && (
                <div className="workflow-progress-bar">
                  <div className="workflow-progress-track">
                    <div className="workflow-progress-fill" style={{ width: `${progress}%` }}>
                      <div className="workflow-progress-shimmer" />
                    </div>
                  </div>
                  <div className="workflow-progress-info">
                    <span className="workflow-progress-percent">{progress}%</span>
                    {isNanoBanana && (
                      <span className="workflow-progress-text">
                        {progressStats.current < progressStats.total
                          ? `Processing image ${progressStats.current + 1} of ${progressStats.total}`
                          : 'Finalizing...'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Time Stats */}
              <div className="workflow-time-stats">
                <div className="workflow-time-stat">
                  <div className="workflow-time-label">Elapsed</div>
                  <div className="workflow-time-value">{formatElapsedTime(elapsedTime)}</div>
                </div>
                {progressStats.current > 0 && estimateTimeRemaining() && (
                  <div className="workflow-time-stat">
                    <div className="workflow-time-label">Remaining</div>
                    <div className="workflow-time-value workflow-time-value--accent">~{estimateTimeRemaining()}</div>
                  </div>
                )}
              </div>

              {/* Cancel Button */}
              {isNanoBanana && (
                <button onClick={() => setShowCancelModal(true)} className="btn btn-secondary">
                  Cancel Batch
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && execution && (
          <>
            {execution.status === 'completed' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Success Banner */}
                <div className="workflow-success-banner">
                  <div className="workflow-success-icon">
                    <svg width="28" height="28" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="workflow-success-content">
                    <h3 className="workflow-success-title">Workflow Completed Successfully!</h3>
                    <p className="workflow-success-subtitle">All tasks finished • Runtime: {formatElapsedTime(elapsedTime)}</p>
                  </div>
                </div>

                {/* Results Content */}
                {isNanoBanana ? (
                  <>
                    {logger.debug('🎨 WorkflowExecute: Rendering BatchResultsView for execution:', execution.id)}
                    <BatchResultsView executionId={execution.id} />
                  </>
                ) : isSmartResizer ? (
                  <>
                    {logger.debug('🎨 WorkflowExecute: Rendering BatchResultsView for Smart Resizer execution:', execution.id)}
                    <BatchResultsView executionId={execution.id} />
                  </>
                ) : (
                  <div className="workflow-results-card">
                    <div className="workflow-results-header">
                      <div className="workflow-results-icon">
                        <svg width="18" height="18" fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="workflow-results-title">Workflow Output</h3>
                    </div>
                    {execution.output_data ? (
                      <pre className="workflow-results-code">
                        {JSON.stringify(execution.output_data, null, 2)}
                      </pre>
                    ) : (
                      <div className="workflow-results-empty">
                        <p className="workflow-results-empty-text">No output data available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="workflow-actions">
                  <button onClick={resetExecution} className="btn btn-primary">
                    <svg width="16" height="16" fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Run Again
                  </button>
                  <button onClick={() => navigate('/workflows')} className="btn btn-secondary">
                    Back to Workflows
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Error Banner */}
                <div className="workflow-failed-banner">
                  <div className="workflow-failed-icon">
                    <svg width="28" height="28" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="workflow-failed-content">
                    <h3 className="workflow-failed-title">Workflow Failed</h3>
                    <p className="workflow-failed-message">{execution.error_message}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="workflow-actions">
                  <button onClick={resetExecution} className="btn btn-primary">
                    <svg width="16" height="16" fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                  <button onClick={() => navigate('/workflows')} className="btn btn-secondary">
                    Back to Workflows
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="workflow-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="workflow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workflow-modal-accent" />

            <div className="workflow-modal-header">
              <div className="workflow-modal-header-content">
                <div className="workflow-modal-icon">
                  <svg width="24" height="24" fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="workflow-modal-title">Cancel Batch Generation?</h3>
                  <p className="workflow-modal-subtitle">This action cannot be undone</p>
                </div>
                <button onClick={() => setShowCancelModal(false)} className="workflow-modal-close">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="workflow-modal-body">
              <p className="workflow-modal-text">
                Are you sure you want to stop this batch execution? All progress will be lost and you'll need to restart from the beginning.
              </p>

              <div className="workflow-modal-warning">
                <svg className="workflow-modal-warning-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="workflow-modal-warning-title">Warning</p>
                  <p className="workflow-modal-warning-text">
                    Images generated so far will be lost. You'll need to restart the entire batch generation process.
                  </p>
                </div>
              </div>

              {progressStats.total > 0 && (
                <div className="workflow-modal-progress">
                  <div className="workflow-modal-progress-label">Current Progress</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span className="workflow-modal-progress-value">
                      {progressStats.current} / {progressStats.total}
                    </span>
                    <span className="workflow-modal-progress-detail">
                      ({progressStats.succeeded} successful, {progressStats.failed} failed)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="workflow-modal-footer">
              <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary">
                Continue Processing
              </button>
              <button onClick={handleCancelExecution} className="btn btn-danger">
                <svg width="16" height="16" fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  )
}
