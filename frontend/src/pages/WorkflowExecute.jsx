import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientLayout } from '../components/layout/ClientLayout';
import { Spinner } from '../components/ui/Spinner';
import { workflowService } from '../services/workflows';
import { NanoBananaForm } from '../components/workflows/NanoBananaForm';
import { BatchResultsView } from '../components/workflows/BatchResultsView';
import logger from '@/utils/logger';


/**
 * WorkflowExecute Page - "The Organic Factory" Design
 * Steps indicator avec glows Indigo + Loading avec gradient Indigo→Lime animé
 * ⚠️ NanoBananaForm reste INCHANGÉ (déjà redesigné)
 */
export function WorkflowExecute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=configure, 2=processing, 3=results
  const [workflow, setWorkflow] = useState(null);
  const [formData, setFormData] = useState({});
  const [execution, setExecution] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressStats, setProgressStats] = useState({ current: 0, total: 0, succeeded: 0, failed: 0 });
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    async function loadWorkflow() {
      try {
        logger.debug('🔍 WorkflowExecute: Loading workflow:', id);
        const response = await workflowService.get(id);
        setWorkflow(response.data.workflow);
        logger.debug('✅ WorkflowExecute: Workflow loaded:', response.data.workflow.name);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load workflow';
        setError(errorMessage);
        logger.error('❌ WorkflowExecute: Failed to load workflow:', {
          error: err,
          message: err.message,
          response: err.response
        });
      }
    }
    loadWorkflow();
  }, [id]);

  // Elapsed time counter
  useEffect(() => {
    if (step === 2 && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, startTime]);

  const isNanoBanana = workflow?.config?.workflow_type === 'nano_banana';

  const handleExecute = async (data) => {
    setLoading(true);
    setError(null);
    setStartTime(Date.now());
    setElapsedTime(0);

    try {
      logger.debug('🚀 WorkflowExecute: Executing workflow:', id);
      const result = await workflowService.execute(id, data);
      logger.debug('📦 WorkflowExecute: Execute result:', {
        success: result.data.success,
        hasData: !!result.data.data,
        dataKeys: result.data.data ? Object.keys(result.data.data) : []
      });

      // Backend returns { success: true, data: { execution_id, status, message } }
      const executionData = result.data.data || result.data;

      setExecution(executionData);
      setStep(2);
      logger.debug('✅ WorkflowExecute: Execution started, execution_id:', executionData.execution_id);
      pollExecutionStatus(executionData.execution_id);
    } catch (err) {
      const errorMessage = getActionableErrorMessage(err);
      setError(errorMessage);
      setStartTime(null);
      logger.error('❌ WorkflowExecute: Execution error:', {
        error: err,
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStandardExecute = () => {
    handleExecute(formData);
  };

  const pollExecutionStatus = (executionId) => {
    logger.debug('🔄 WorkflowExecute: Starting to poll execution:', executionId);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await workflowService.getExecution(executionId);
        logger.debug('📥 WorkflowExecute: Polling response:', {
          status: response.status,
          hasData: !!response.data
        });

        // Backend returns { success: true, data: { id, status, progress, ... } }
        const status = response.data.data || response.data;

        logger.debug('📊 WorkflowExecute: Execution status:', {
          id: status.id,
          status: status.status,
          progress: status.progress,
          hasOutputData: !!status.output_data
        });

        setExecution(status);
        setProgress(status.progress || 0);

        // Parse batch stats from output_data if available
        if (status.output_data?.batch_results) {
          const results = status.output_data.batch_results;
          const succeeded = results.filter(r => r.status === 'completed').length;
          const failed = results.filter(r => r.status === 'failed').length;
          const current = succeeded + failed;
          const total = results.length;

          setProgressStats({ current, total, succeeded, failed });
          logger.debug('📊 WorkflowExecute: Progress stats:', { current, total, succeeded, failed });
        }

        if (status.status === 'completed' || status.status === 'failed') {
          logger.debug('✅ WorkflowExecute: Execution finished, moving to results');
          clearInterval(pollingIntervalRef.current);
          setStep(3);
          setLoading(false);
        }
      } catch (err) {
        logger.error('❌ WorkflowExecute: Polling error:', {
          error: err,
          message: err.message,
          response: err.response
        });
      }
    }, 2000);
  };

  const handleCancelExecution = async () => {
    logger.debug('🛑 WorkflowExecute: User requested cancellation');
    setShowCancelModal(false);

    // Clear polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Reset state
    setStep(1);
    setFormData({});
    setExecution(null);
    setProgress(0);
    setError('Batch execution cancelled by user');
    setStartTime(null);
    setElapsedTime(0);
    setProgressStats({ current: 0, total: 0, succeeded: 0, failed: 0 });

    logger.debug('✅ WorkflowExecute: Cancellation complete');
  };

  const getActionableErrorMessage = (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;

    logger.debug('🔍 WorkflowExecute: Parsing error:', { status, message });

    // API key errors
    if (message?.toLowerCase().includes('api key') || message?.toLowerCase().includes('authentication')) {
      return 'Invalid API key. Get a new key from Google AI Studio → https://aistudio.google.com/app/apikey';
    }

    // Rate limit errors
    if (status === 429 || message?.toLowerCase().includes('rate limit')) {
      return 'Rate limit exceeded. Please try again in 5 minutes.';
    }

    // Network errors
    if (message?.toLowerCase().includes('network') || message?.toLowerCase().includes('timeout')) {
      return 'Network timeout. Check your internet connection and retry in 30 seconds.';
    }

    // File size errors
    if (message?.toLowerCase().includes('file') && message?.toLowerCase().includes('size')) {
      return 'File size exceeds limit. Ensure each image is under 10MB.';
    }

    // Generic fallback
    return `Error: ${message}`;
  };

  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimateTimeRemaining = () => {
    if (progressStats.current === 0 || progressStats.total === 0) return null;

    const avgTimePerItem = elapsedTime / progressStats.current;
    const remainingItems = progressStats.total - progressStats.current;
    const estimatedSeconds = Math.floor(avgTimePerItem * remainingItems);

    return formatElapsedTime(estimatedSeconds);
  };

  if (!workflow) {
    return (
      <ClientLayout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <Spinner size="lg" />
        </div>
      </ClientLayout>
    );
  }

  const stepLabels = [
    { name: 'Configure', desc: 'Set up your workflow' },
    { name: 'Processing', desc: 'Generating images' },
    { name: 'Results', desc: 'View your results' }
  ];

  return (
    <ClientLayout>
      <div style={{ padding: '48px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/workflows')}
          className="btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '32px'
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Workflows
        </button>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1
            className="font-display"
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}
          >
            {workflow.name}
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)'
            }}
          >
            {workflow.description}
          </p>
        </div>

        {/* Enhanced Step Indicator with Indigo Glows */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {stepLabels.map((label, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: step > i ? 'var(--lime-500)' : step === i + 1 ? 'var(--indigo-600)' : 'var(--neutral-200)',
                  boxShadow: step === i + 1 ? '0 0 20px rgba(79, 70, 229, 0.5)' : 'none',
                  transition: 'all 0.3s ease-out'
                }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {stepLabels.map((label, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  className="font-body"
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: step === i + 1 ? 'var(--indigo-600)' : step > i ? 'var(--success-main)' : 'var(--neutral-400)'
                  }}
                >
                  {step > i && '✓ '}
                  {label.name}
                </div>
                <div
                  className="font-body"
                  style={{
                    fontSize: '12px',
                    color: 'var(--neutral-500)',
                    marginTop: '4px'
                  }}
                >
                  {label.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--error-light)',
            border: '2px solid var(--error-main)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--error-main)', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div style={{ flex: 1 }}>
                <p className="font-body" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--error-dark)', marginBottom: '4px' }}>Error</p>
                <p className="font-body" style={{ fontSize: '14px', color: 'var(--error-dark)' }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Configure - NanoBananaForm reste INCHANGÉ */}
        {step === 1 && (
          <div className="card-bento" style={{
            background: 'var(--canvas-pure)',
            padding: '32px'
          }}>
            {isNanoBanana ? (
              <>
                <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
                  Configure Batch Image Generation
                </h2>
                <NanoBananaForm onSubmit={handleExecute} loading={loading} />
              </>
            ) : (
              <>
                <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
                  Configure Workflow
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {workflow.config?.fields?.length > 0 ? (
                    workflow.config.fields.map((field) => (
                      <div key={field.name}>
                        <label className="font-body" style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          marginBottom: '8px'
                        }}>
                          {field.label || field.name}
                        </label>
                        <input
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, [field.name]: e.target.value });
                          }}
                          required={field.required}
                          className="input-field"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="font-body" style={{
                      fontSize: '16px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      padding: '32px 0'
                    }}>
                      No configuration required for this workflow
                    </p>
                  )}
                  <button
                    onClick={handleStandardExecute}
                    disabled={loading}
                    className="btn btn-primary-lime"
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      fontSize: '16px'
                    }}
                  >
                    {loading ? 'Executing...' : 'Execute Workflow'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Processing with Indigo→Lime Gradient Animation */}
        {step === 2 && (
          <div className="card-bento" style={{
            background: 'var(--canvas-pure)',
            padding: '48px',
            textAlign: 'center'
          }}>
            {/* Gradient Glow Loading (Indigo) */}
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 24px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(270deg, var(--indigo-600), var(--indigo-500), var(--indigo-400), var(--indigo-500), var(--indigo-600))',
                backgroundSize: '400% 400%',
                animation: 'gradient-rotate 3s ease infinite',
                borderRadius: '50%',
                filter: 'blur(40px)',
                opacity: 0.8
              }} />
              <Spinner size="lg" />
            </div>

            <p className="font-display" style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}>
              Processing your workflow...
            </p>

            {/* Live Progress Stats */}
            {isNanoBanana && progressStats.total > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div className="font-body" style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Processing prompt <strong>{progressStats.current}</strong> of <strong>{progressStats.total}</strong>
                  {' '}({progressStats.succeeded} succeeded, {progressStats.failed} failed)
                </div>

                <div className="font-body" style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)'
                }}>
                  {progressStats.current < progressStats.total ? (
                    <>Generating image {progressStats.current + 1}...</>
                  ) : (
                    <>Finalizing results...</>
                  )}
                </div>
              </div>
            )}

            {/* Time Stats */}
            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center',
              gap: '24px'
            }}>
              <div className="font-mono" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 500 }}>Elapsed:</span> {formatElapsedTime(elapsedTime)}
              </div>
              {progressStats.current > 0 && estimateTimeRemaining() && (
                <div className="font-mono" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 500 }}>Est. Remaining:</span> {estimateTimeRemaining()}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {progress > 0 && (
              <div style={{ maxWidth: '400px', margin: '24px auto 0' }}>
                <div style={{
                  background: 'var(--neutral-200)',
                  borderRadius: '999px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'var(--gradient-indigo)',
                    height: '100%',
                    width: `${progress}%`,
                    transition: 'width 0.3s ease-out',
                    borderRadius: '999px'
                  }} />
                </div>
                <p className="font-mono" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {progress}%
                </p>
              </div>
            )}

            {/* Cancel Button */}
            {isNanoBanana && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn btn-secondary"
                style={{ marginTop: '24px', padding: '10px 24px', fontSize: '14px' }}
              >
                Cancel Batch
              </button>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && execution && (
          <>
            {execution.status === 'completed' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  background: 'var(--success-light)',
                  border: '2px solid var(--success-main)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 0 20px rgba(204, 255, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg style={{ width: '20px', height: '20px', color: 'var(--success-dark)' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="font-body" style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--success-dark)'
                    }}>
                      Workflow completed successfully!
                    </p>
                  </div>
                </div>

                {isNanoBanana ? (
                  <>
                    {logger.debug('🎨 WorkflowExecute: Rendering BatchResultsView for execution:', execution.id)}
                    <BatchResultsView executionId={execution.id} />
                  </>
                ) : (
                  <div className="card-bento" style={{
                    background: 'var(--canvas-pure)',
                    padding: '32px'
                  }}>
                    <h3 className="font-display" style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      marginBottom: '16px'
                    }}>
                      Results
                    </h3>
                    {execution.output_data ? (
                      <pre className="font-mono" style={{
                        fontSize: '14px',
                        color: 'var(--lime-500)',
                        background: 'var(--neutral-900)',
                        padding: '16px',
                        borderRadius: '12px',
                        overflow: 'auto',
                        maxHeight: '400px'
                      }}>
                        {JSON.stringify(execution.output_data, null, 2)}
                      </pre>
                    ) : (
                      <p className="font-body" style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                        padding: '16px 0'
                      }}>
                        No output data available
                      </p>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setStep(1);
                      setFormData({});
                      setExecution(null);
                      setProgress(0);
                      setError(null);
                      setStartTime(null);
                      setElapsedTime(0);
                      setProgressStats({ current: 0, total: 0, succeeded: 0, failed: 0 });
                    }}
                    className="btn btn-primary"
                  >
                    Run Again
                  </button>
                  <button
                    onClick={() => navigate('/workflows')}
                    className="btn btn-secondary"
                  >
                    Back to Workflows
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  background: 'var(--error-light)',
                  border: '2px solid var(--error-main)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 0 20px rgba(255, 59, 48, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <svg style={{ width: '20px', height: '20px', color: 'var(--error-main)', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-body" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--error-dark)', marginBottom: '8px' }}>
                        Workflow failed
                      </p>
                      <p className="font-body" style={{ fontSize: '14px', color: 'var(--error-dark)' }}>
                        {execution.error_message}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setStep(1);
                      setFormData({});
                      setExecution(null);
                      setProgress(0);
                      setError(null);
                      setStartTime(null);
                      setElapsedTime(0);
                      setProgressStats({ current: 0, total: 0, succeeded: 0, failed: 0 });
                    }}
                    className="btn btn-primary"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/workflows')}
                    className="btn btn-secondary"
                  >
                    Back to Workflows
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Confirmation Modal - Glassmorphism */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px'
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="card-glass"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '100%',
              animation: 'scale-in 300ms var(--ease-spring)'
            }}
          >
            <div style={{
              padding: '24px',
              borderBottom: '1px solid var(--neutral-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 className="font-display" style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Cancel Batch?
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-icon"
                style={{ width: '32px', height: '32px' }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <p className="font-body" style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '16px'
              }}>
                Are you sure you want to cancel this batch execution? This action cannot be undone.
              </p>
              <div style={{
                background: 'var(--warning-light)',
                border: '1px solid var(--warning-main)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <p className="font-body" style={{
                  fontSize: '12px',
                  color: 'var(--warning-dark)'
                }}>
                  <strong>Note:</strong> Images generated so far may be lost. You'll need to restart the entire batch.
                </p>
              </div>
            </div>

            <div style={{
              padding: '24px',
              borderTop: '1px solid var(--neutral-200)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-secondary"
              >
                Continue Processing
              </button>
              <button
                onClick={handleCancelExecution}
                className="btn btn-danger"
              >
                Cancel Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
