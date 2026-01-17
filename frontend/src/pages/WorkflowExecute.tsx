import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Spinner } from '../components/ui/Spinner'
import { workflowService } from '../services/workflows'
import { NanoBananaForm } from '../components/workflows/NanoBananaForm'
import { SmartResizerForm } from '../components/workflows/SmartResizerForm'
import { RoomRedesignerForm } from '../components/workflows/RoomRedesignerForm'
import { useActiveExecutionsStore } from '../store/activeExecutionsStore'
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

/**
 * WorkflowExecute Page - Dark Premium Style
 * Clean CSS classes, minimal inline styles
 */
export function WorkflowExecute(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [workflow, setWorkflow] = useState<WorkflowWithConfig | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPrefillData, setCurrentPrefillData] = useState<PrefillData | null>(null)

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
      // Check if it's Room Redesigner data
      if (prefillData.design_style || prefillData.budget_level || prefillData.room_images_base64) {
        logger.debug('📦 WorkflowExecute: Received Room Redesigner prefill data', {
          design_style: prefillData.design_style,
          budget_level: prefillData.budget_level,
          season: prefillData.season,
          hasRoomImages: !!prefillData.room_images_base64,
          roomImagesType: prefillData.room_images_base64 ? typeof prefillData.room_images_base64 : undefined,
          roomImagesIsArray: Array.isArray(prefillData.room_images_base64),
          roomImagesCount: prefillData.room_images_base64
            ? (Array.isArray(prefillData.room_images_base64)
                ? prefillData.room_images_base64.length
                : Object.keys(prefillData.room_images_base64).length)
            : 0,
          fromExecutionId: locationState?.fromExecutionId
        })
      } else {
        // Nano Banana data
        logger.debug('✅ WorkflowExecute: Received Nano Banana prefill data', {
          prompts_text_length: prefillData.prompts_text?.length,
          model: prefillData.model,
          aspect_ratio: prefillData.aspect_ratio,
          resolution: prefillData.resolution,
          has_images: !!prefillData.reference_images_base64,
          images_type: typeof prefillData.reference_images_base64,
          images_is_array: Array.isArray(prefillData.reference_images_base64),
          fromExecutionId: locationState?.fromExecutionId
        })
      }
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

  const isNanoBanana = workflow?.config?.workflow_type === 'nano_banana'
  const isSmartResizer = workflow?.config?.workflow_type === 'smart_resizer'
  const isRoomRedesigner = workflow?.config?.workflow_type === 'room_redesigner'

  const handleExecute = async (data: Record<string, any> | FormData): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      logger.debug('🚀 WorkflowExecute: Executing workflow:', id)
      const result = await workflowService.execute(id!, data)
      logger.debug('📦 WorkflowExecute: Execute result:', {
        success: result.data.success,
        hasData: !!result.data.data,
        dataKeys: result.data.data ? Object.keys(result.data.data) : []
      })

      const executionData = result.data.data || result.data
      const executionId = executionData.execution_id || executionData.id

      // Add to active executions store for global tracking
      useActiveExecutionsStore.getState().addExecution({
        id: executionId,
        workflow_id: id!,
        workflow_name: workflow?.name || 'Unknown Workflow',
        workflow_type: workflow?.config?.workflow_type || 'unknown',
        status: 'pending',
        progress: 0,
        started_at: new Date().toISOString()
      })

      logger.debug('✅ WorkflowExecute: Execution started, execution_id:', executionId)

      // Redirect to executions page (toast will be shown on completion by polling hook)
      navigate('/executions')
    } catch (err: any) {
      const errorMessage = getActionableErrorMessage(err)
      setError(errorMessage)
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

  const handleFormInputChange = (fieldName: string, value: string): void => {
    setFormData({ ...formData, [fieldName]: value })
  }

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

        {/* Configure Workflow */}
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
            ) : isRoomRedesigner ? (
              <>
                <h2 className="workflow-form-title">Configure Room Redesigner</h2>
                <RoomRedesignerForm
                  onSubmit={handleExecute}
                  loading={loading}
                  initialData={prefillData}
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
      </div>
    </ClientLayout>
  )
}
