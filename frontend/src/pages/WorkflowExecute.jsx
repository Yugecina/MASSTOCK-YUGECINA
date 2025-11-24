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

        {/* Enhanced Step Indicator with Mediterranean Flow */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {stepLabels.map((label, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: step > i ? 'var(--primary-500)' : step === i + 1 ? 'var(--primary-500)' : 'var(--neutral-200)',
                  boxShadow: step === i + 1 ? '0 0 20px rgba(42, 157, 143, 0.4)' : 'none',
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
                    color: step === i + 1 ? 'var(--primary-600)' : step > i ? 'var(--success-main)' : 'var(--neutral-400)'
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
                <NanoBananaForm onSubmit={handleExecute} loading={loading} workflow={workflow} />
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

        {/* Step 2: Processing with Mediterranean Flow */}
        {step === 2 && (
          <div className="card-bento" style={{
            background: 'var(--canvas-pure)',
            padding: '48px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Organic Background Glow */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(42, 157, 143, 0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
              animation: 'pulse-glow 3s ease-in-out infinite'
            }} />

            <div style={{ position: 'relative', textAlign: 'center' }}>
              {/* Elegant Spinner with Verdigris Glow */}
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 32px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle, rgba(42, 157, 143, 0.3) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(30px)',
                  animation: 'pulse-slow 2s ease-in-out infinite'
                }} />
                <Spinner size="lg" />
              </div>

              <h3 className="font-display" style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}>
                Processing Workflow
              </h3>

              <p className="font-body" style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                marginBottom: '32px'
              }}>
                Generating your results...
              </p>

              {/* Progress Stats Cards */}
              {isNanoBanana && progressStats.total > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '16px',
                  maxWidth: '500px',
                  margin: '0 auto 32px'
                }}>
                  <div style={{
                    background: 'var(--primary-50)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--primary-200)'
                  }}>
                    <div className="font-mono" style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--primary-600)',
                      marginBottom: '4px'
                    }}>
                      {progressStats.current}
                    </div>
                    <div className="font-body" style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Current
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--success-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--success-light)'
                  }}>
                    <div className="font-mono" style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--success-main)',
                      marginBottom: '4px'
                    }}>
                      {progressStats.succeeded}
                    </div>
                    <div className="font-body" style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Success
                    </div>
                  </div>

                  {progressStats.failed > 0 && (
                    <div style={{
                      background: 'var(--error-bg)',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid var(--error-light)'
                    }}>
                      <div className="font-mono" style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'var(--error-main)',
                        marginBottom: '4px'
                      }}>
                        {progressStats.failed}
                      </div>
                      <div className="font-body" style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Failed
                      </div>
                    </div>
                  )}

                  <div style={{
                    background: 'var(--neutral-100)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--neutral-200)'
                  }}>
                    <div className="font-mono" style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {progressStats.total}
                    </div>
                    <div className="font-body" style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Total
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar with Gradient */}
              {progress > 0 && (
                <div style={{ maxWidth: '500px', margin: '0 auto 24px' }}>
                  <div style={{
                    background: 'var(--neutral-200)',
                    borderRadius: '999px',
                    height: '12px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      background: 'var(--gradient-primary)',
                      height: '100%',
                      width: `${progress}%`,
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: '999px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Shimmer effect */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        animation: 'shimmer 2s infinite'
                      }} />
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '12px'
                  }}>
                    <span className="font-mono" style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {progress}%
                    </span>
                    {isNanoBanana && (
                      <span className="font-body" style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        {progressStats.current < progressStats.total
                          ? `Processing image ${progressStats.current + 1} of ${progressStats.total}`
                          : 'Finalizing...'
                        }
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Time Information */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '32px',
                marginBottom: '24px',
                paddingTop: '16px',
                borderTop: '1px solid var(--neutral-200)'
              }}>
                <div>
                  <div className="font-body" style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Elapsed
                  </div>
                  <div className="font-mono" style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    {formatElapsedTime(elapsedTime)}
                  </div>
                </div>
                {progressStats.current > 0 && estimateTimeRemaining() && (
                  <div>
                    <div className="font-body" style={{
                      fontSize: '12px',
                      color: 'var(--text-tertiary)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Remaining
                    </div>
                    <div className="font-mono" style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--primary-600)'
                    }}>
                      ~{estimateTimeRemaining()}
                    </div>
                  </div>
                )}
              </div>

              {/* Cancel Button */}
              {isNanoBanana && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="btn btn-secondary"
                  style={{ padding: '12px 28px', fontSize: '14px' }}
                >
                  Cancel Batch
                </button>
              )}
            </div>

            <style>{`
              @keyframes pulse-glow {
                0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
                50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
              }
              @keyframes pulse-slow {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.8; }
              }
              @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 200%; }
              }
            `}</style>
          </div>
        )}

        {/* Step 3: Results - Mediterranean Celebration */}
        {step === 3 && execution && (
          <>
            {execution.status === 'completed' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Success Banner with Verdigris Glow */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--success-bg) 0%, var(--primary-50) 100%)',
                  border: '2px solid var(--success-main)',
                  borderRadius: '16px',
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(42, 157, 143, 0.15)'
                }}>
                  {/* Decorative glow */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(42, 157, 143, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }} />

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--success-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 className="font-display" style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--success-dark)',
                        marginBottom: '4px',
                        letterSpacing: '-0.01em'
                      }}>
                        Workflow Completed Successfully!
                      </h3>
                      <p className="font-body" style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}>
                        All tasks finished • Runtime: {formatElapsedTime(elapsedTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Results Content */}
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
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '20px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid var(--neutral-200)'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--primary-100)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg style={{ width: '18px', height: '18px', color: 'var(--primary-600)' }} fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="font-display" style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}>
                        Workflow Output
                      </h3>
                    </div>
                    {execution.output_data ? (
                      <pre className="font-mono" style={{
                        fontSize: '13px',
                        color: 'var(--primary-600)',
                        background: 'var(--neutral-100)',
                        padding: '20px',
                        borderRadius: '12px',
                        overflow: 'auto',
                        maxHeight: '400px',
                        border: '1px solid var(--neutral-200)',
                        lineHeight: 1.6
                      }}>
                        {JSON.stringify(execution.output_data, null, 2)}
                      </pre>
                    ) : (
                      <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        background: 'var(--neutral-50)',
                        borderRadius: '12px',
                        border: '1px dashed var(--neutral-300)'
                      }}>
                        <p className="font-body" style={{
                          fontSize: '14px',
                          color: 'var(--text-secondary)'
                        }}>
                          No output data available
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  paddingTop: '8px'
                }}>
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px'
                    }}
                  >
                    <svg style={{ width: '16px', height: '16px' }} fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Run Again
                  </button>
                  <button
                    onClick={() => navigate('/workflows')}
                    className="btn btn-secondary"
                    style={{ padding: '12px 24px' }}
                  >
                    Back to Workflows
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Error Banner */}
                <div style={{
                  background: 'var(--error-light)',
                  border: '2px solid var(--error-main)',
                  borderRadius: '16px',
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'start', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--error-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 className="font-display" style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--error-dark)',
                        marginBottom: '8px',
                        letterSpacing: '-0.01em'
                      }}>
                        Workflow Failed
                      </h3>
                      <p className="font-body" style={{
                        fontSize: '14px',
                        color: 'var(--error-dark)',
                        lineHeight: 1.6
                      }}>
                        {execution.error_message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px'
                    }}
                  >
                    <svg style={{ width: '16px', height: '16px' }} fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/workflows')}
                    className="btn btn-secondary"
                    style={{ padding: '12px 24px' }}
                  >
                    Back to Workflows
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Confirmation Modal - Mediterranean Style */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
            animation: 'fadeIn 200ms ease-out'
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="card-glass"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              animation: 'scale-in 300ms var(--ease-spring)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Warning accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'var(--warning-main)'
            }} />

            {/* Header */}
            <div style={{
              padding: '28px 28px 20px',
              borderBottom: '1px solid var(--neutral-200)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--warning-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg style={{ width: '24px', height: '24px', color: 'var(--warning-main)' }} fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="font-display" style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                    marginBottom: '4px'
                  }}>
                    Cancel Batch Generation?
                  </h3>
                  <p className="font-body" style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                  }}>
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn-icon"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    flexShrink: 0
                  }}
                >
                  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '28px' }}>
              <p className="font-body" style={{
                fontSize: '15px',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                marginBottom: '20px'
              }}>
                Are you sure you want to stop this batch execution? All progress will be lost and you'll need to restart from the beginning.
              </p>

              {/* Warning Box */}
              <div style={{
                background: 'linear-gradient(135deg, var(--warning-bg) 0%, var(--secondary-50) 100%)',
                border: '1px solid var(--warning-main)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                gap: '12px'
              }}>
                <svg style={{ width: '20px', height: '20px', color: 'var(--warning-main)', flexShrink: 0, marginTop: '2px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div style={{ flex: 1 }}>
                  <p className="font-body" style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--warning-dark)',
                    marginBottom: '4px'
                  }}>
                    Warning
                  </p>
                  <p className="font-body" style={{
                    fontSize: '13px',
                    color: 'var(--warning-dark)',
                    lineHeight: 1.5
                  }}>
                    Images generated so far will be lost. You'll need to restart the entire batch generation process.
                  </p>
                </div>
              </div>

              {/* Stats if available */}
              {progressStats.total > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: 'var(--neutral-50)',
                  borderRadius: '8px',
                  border: '1px solid var(--neutral-200)'
                }}>
                  <div className="font-body" style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Current Progress
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
                    <span className="font-mono" style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}>
                      {progressStats.current} / {progressStats.total}
                    </span>
                    <span className="font-body" style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)'
                    }}>
                      ({progressStats.succeeded} successful, {progressStats.failed} failed)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 28px 28px',
              borderTop: '1px solid var(--neutral-200)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-secondary"
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Continue Processing
              </button>
              <button
                onClick={handleCancelExecution}
                className="btn btn-danger"
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Batch
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </ClientLayout>
  );
}
