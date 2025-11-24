import { useState, useEffect } from 'react';
import logger from '@/utils/logger';


/**
 * NanoBananaForm Component
 * Form for Image Factory workflow (AI image generation)
 *
 * UX Improvements (Iteration 2 + Organic Factory):
 * - Cost confirmation modal before execution
 * - Real-time prompt counting and validation
 * - API key format validation
 * - File size validation on upload
 * - Enhanced security messaging
 * - Example prompt loader
 * - Clear error messages with actionable guidance
 * - **NEW: Organic Factory design with Lime Action button (CRITICAL CTA)**
 */
export function NanoBananaForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    prompts_text: '',
    api_key: '',
    reference_images: []
  });

  const [validationState, setValidationState] = useState({
    apiKeyValid: null,
    promptCountValid: null,
    fileSizeValid: true,
    errors: {}
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  // Calculate prompt count and estimated cost
  const promptCount = formData.prompts_text
    .split('\n\n')
    .filter(p => p.trim())
    .length;
  const estimatedCost = (promptCount * 0.039).toFixed(2);

  // Real-time API key validation
  useEffect(() => {
    if (formData.api_key.length === 0) {
      setValidationState(prev => ({ ...prev, apiKeyValid: null, errors: { ...prev.errors, apiKey: null }}));
      return;
    }

    logger.debug('🔍 NanoBananaForm: Validating API key format');

    if (formData.api_key.startsWith('AIza') && formData.api_key.length > 30) {
      setValidationState(prev => ({ ...prev, apiKeyValid: true, errors: { ...prev.errors, apiKey: null }}));
      logger.debug('✅ NanoBananaForm: API key format valid');
    } else {
      setValidationState(prev => ({
        ...prev,
        apiKeyValid: false,
        errors: { ...prev.errors, apiKey: 'API key should start with "AIza" and be at least 30 characters' }
      }));
      logger.debug('❌ NanoBananaForm: Invalid API key format');
    }
  }, [formData.api_key]);

  // Real-time prompt count validation
  useEffect(() => {
    if (promptCount === 0) {
      setValidationState(prev => ({ ...prev, promptCountValid: null }));
    } else if (promptCount >= 1 && promptCount <= 10000) {
      setValidationState(prev => ({ ...prev, promptCountValid: true }));
      logger.debug(`✅ NanoBananaForm: ${promptCount} prompts valid`);
    } else {
      setValidationState(prev => ({ ...prev, promptCountValid: false }));
      logger.debug(`❌ NanoBananaForm: ${promptCount} prompts exceeds limit`);
    }
  }, [promptCount]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    logger.debug('📁 NanoBananaForm: Files selected:', files.length);

    // Validate file count
    if (files.length > 3) {
      setValidationState(prev => ({
        ...prev,
        fileSizeValid: false,
        errors: { ...prev.errors, files: 'Maximum 3 reference images allowed' }
      }));
      logger.debug('❌ NanoBananaForm: Too many files');
      e.target.value = '';
      return;
    }

    // Validate file sizes (10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(f => f.size > maxSize);

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      setValidationState(prev => ({
        ...prev,
        fileSizeValid: false,
        errors: { ...prev.errors, files: `Files exceed 10MB limit: ${fileNames}` }
      }));
      logger.debug('❌ NanoBananaForm: Files too large:', oversizedFiles);
      e.target.value = '';
      return;
    }

    // All validations passed
    setValidationState(prev => ({
      ...prev,
      fileSizeValid: true,
      errors: { ...prev.errors, files: null }
    }));
    setFormData({ ...formData, reference_images: files });
    logger.debug('✅ NanoBananaForm: Files valid and loaded');
  };

  const loadExamplePrompts = () => {
    const examples = `[product] on a rustic wooden table with natural morning light, surrounded by fresh herbs and organic ingredients, warm atmosphere, professional food photography

[product] floating in a minimalist zen garden setting with smooth stones, raked sand patterns, soft shadows, clean modern aesthetic, 8k resolution

[product] in a cozy hygge-inspired interior with candles, soft blankets, and warm bokeh lights in background, intimate atmosphere, Scandinavian design

[product] on a vibrant tropical beach scene with turquoise water, palm leaves, white sand, golden hour sunlight, vacation lifestyle photography`;

    setFormData({ ...formData, prompts_text: examples });
    setShowExampleModal(false);
    logger.debug('📝 NanoBananaForm: Example prompts loaded');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    logger.debug('🚀 NanoBananaForm: Form submitted, showing confirmation modal');
    setShowConfirmModal(true);
  };

  const handleConfirmExecution = () => {
    logger.debug('✅ NanoBananaForm: User confirmed execution');
    setShowConfirmModal(false);

    const formDataToSend = new FormData();
    formDataToSend.append('prompts_text', formData.prompts_text);
    formDataToSend.append('api_key', formData.api_key);

    formData.reference_images.forEach((file) => {
      formDataToSend.append('reference_images', file);
    });

    logger.debug('📤 NanoBananaForm: Sending execution request:', {
      promptCount,
      hasApiKey: !!formData.api_key,
      referenceImagesCount: formData.reference_images.length
    });

    onSubmit(formDataToSend);
  };

  // Check if form is valid for submission
  const isFormValid =
    formData.prompts_text.trim() &&
    formData.api_key.trim() &&
    validationState.apiKeyValid === true &&
    validationState.promptCountValid === true &&
    validationState.fileSizeValid === true &&
    promptCount > 0 &&
    promptCount <= 10000;

  const getSubmitDisabledReason = () => {
    if (promptCount === 0) return 'Add at least one prompt';
    if (promptCount > 10000) return 'Maximum 10 000 prompts allowed';
    if (!formData.api_key.trim()) return 'API key required';
    if (validationState.apiKeyValid === false) return 'Invalid API key format';
    if (!validationState.fileSizeValid) return 'Fix file validation errors';
    return null;
  };

  const maskedApiKey = formData.api_key.length > 4
    ? '••••••••' + formData.api_key.slice(-4)
    : '••••••••';

  return (
    <>
      <form onSubmit={handleFormSubmit}>
        {/* Production Line Header */}
        <div style={{
          marginBottom: '32px',
          padding: '24px',
          background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%)',
          borderRadius: '16px',
          border: '2px solid var(--primary-200)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(42, 157, 143, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--primary-700)',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}>
              Image Production Line
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--success-main)',
                animation: 'pulse 2s infinite'
              }} />
              Factory Status: Ready • $0.039/image
            </p>
          </div>
        </div>

        {/* Step 1: Raw Materials (Prompts) */}
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          background: 'white',
          borderRadius: '12px',
          border: '2px solid var(--neutral-200)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--secondary-500)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.05em'
          }}>
            STEP 1
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--secondary-500)' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Raw Materials: Image Prompts
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Input your production queue • Separate with double line breaks
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              value={formData.prompts_text}
              onChange={(e) => setFormData({ ...formData, prompts_text: e.target.value })}
              placeholder="Enter production queue:

a beautiful sunset over mountains, cinematic 8k

a futuristic city at night with neon lights

a portrait of a cat wearing sunglasses, studio lighting"
              rows={10}
              required
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '14px',
                fontFamily: 'var(--font-mono)',
                border: `2px solid ${validationState.promptCountValid === true ? 'var(--success-main)' : 'var(--neutral-300)'}`,
                borderRadius: '8px',
                background: 'var(--canvas-base)',
                color: 'var(--text-primary)',
                resize: 'vertical',
                transition: 'all 0.2s ease'
              }}
            />

            {/* Live Counter Overlay */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: validationState.promptCountValid === true ? 'var(--success-main)' : validationState.promptCountValid === false ? 'var(--error-main)' : 'var(--neutral-400)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}>
              <span style={{ fontSize: '16px' }}>{promptCount}</span>
              <span style={{ fontSize: '11px', opacity: 0.9 }}>UNITS</span>
            </div>
          </div>

          {/* Production Stats */}
          <div style={{
            marginTop: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px'
          }}>
            <div style={{
              background: 'var(--secondary-50)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--secondary-200)'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--secondary-700)', fontWeight: 600, marginBottom: '4px', letterSpacing: '0.05em' }}>
                ESTIMATED COST
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--secondary-600)', fontFamily: 'var(--font-mono)' }}>
                ${estimatedCost}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExampleModal(true)}
              style={{
                background: 'var(--info-50)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--info-200)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg style={{ width: '16px', height: '16px', color: 'var(--info-dark)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--info-dark)' }}>Load Examples</span>
            </button>
          </div>

          {promptCount > 10000 && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'var(--error-light)',
              border: '1px solid var(--error-main)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--error-dark)',
              fontWeight: 500
            }}>
              ⚠️ Production limit exceeded: Maximum 10,000 units allowed
            </div>
          )}
        </div>

        {/* Step 2: Power Source (API Key) */}
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          background: 'white',
          borderRadius: '12px',
          border: '2px solid var(--neutral-200)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--primary-500)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.05em'
          }}>
            STEP 2
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--primary-500)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Power Source: API Credentials
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Secure authentication • AES-256 encrypted
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="AIza..."
              required
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                fontSize: '14px',
                fontFamily: 'var(--font-mono)',
                border: `2px solid ${
                  validationState.apiKeyValid === false ? 'var(--error-main)' :
                  validationState.apiKeyValid === true ? 'var(--success-main)' :
                  'var(--neutral-300)'
                }`,
                borderRadius: '8px',
                background: validationState.apiKeyValid === true ? 'var(--success-light)' : 'white',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease'
              }}
            />

            {/* Validation Badge */}
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: validationState.apiKeyValid === true ? 'var(--success-main)' : validationState.apiKeyValid === false ? 'var(--error-main)' : 'var(--neutral-300)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              transition: 'all 0.3s ease'
            }}>
              {validationState.apiKeyValid === true ? '✓' : validationState.apiKeyValid === false ? '✗' : '?'}
            </div>
          </div>

          {validationState.errors.apiKey && (
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--error-main)', fontWeight: 500 }}>
              {validationState.errors.apiKey}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowSecurityInfo(!showSecurityInfo)}
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--primary-600)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s ease'
            }}
          >
            <svg style={{ width: '14px', height: '14px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {showSecurityInfo ? 'Hide' : 'Show'} Security Details
          </button>

          {showSecurityInfo && (
            <div style={{
              marginTop: '12px',
              padding: '16px',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--primary-900)'
            }}>
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>🔒 Security Protocol:</p>
              <ul style={{ paddingLeft: '20px', margin: 0, lineHeight: 1.8 }}>
                <li>HTTPS-only transmission</li>
                <li>AES-256 encryption at rest</li>
                <li>Zero persistent storage</li>
                <li>Auto-deletion post-execution</li>
              </ul>
            </div>
          )}
        </div>

        {/* Step 3: Optional Enhancement (Reference Images) */}
        <div style={{
          marginBottom: '32px',
          padding: '24px',
          background: 'white',
          borderRadius: '12px',
          border: '2px dashed var(--neutral-300)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--neutral-400)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.05em'
          }}>
            OPTIONAL
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--neutral-500)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Quality Control: Reference Images
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Up to 3 images • 10MB max each • PNG, JPG, WEBP
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '13px',
              border: '2px solid var(--neutral-300)',
              borderRadius: '8px',
              background: 'var(--neutral-50)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          />

          {validationState.errors.files && (
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--error-main)', fontWeight: 500 }}>
              {validationState.errors.files}
            </p>
          )}

          {formData.reference_images.length > 0 && validationState.fileSizeValid && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.reference_images.map((file, i) => (
                <div key={i} style={{
                  padding: '6px 12px',
                  background: 'var(--success-light)',
                  border: '1px solid var(--success-main)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: 'var(--success-dark)',
                  fontWeight: 500
                }}>
                  ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Production Button */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, var(--success-main) 0%, var(--primary-600) 100%)',
          borderRadius: '12px',
          boxShadow: isFormValid && !loading ? '0 8px 24px rgba(42, 157, 143, 0.3)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <button
            type="submit"
            disabled={!isFormValid || loading}
            style={{
              width: '100%',
              padding: '18px 24px',
              background: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--success-dark)',
              cursor: isFormValid && !loading ? 'pointer' : 'not-allowed',
              opacity: isFormValid && !loading ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em'
            }}
          >
            {loading ? (
              <>
                <span className="spinner-gradient-indigo-lime"></span>
                <span>PRODUCTION IN PROGRESS...</span>
              </>
            ) : (
              <>
                <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>START PRODUCTION • {promptCount} UNITS</span>
              </>
            )}
          </button>

          {!isFormValid && !loading && (
            <p style={{
              marginTop: '12px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'white',
              opacity: 0.9
            }}>
              ⚠️ {getSubmitDisabledReason()}
            </p>
          )}
        </div>
      </form>

      {/* Cost Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content-glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="text-h3 font-bold">Confirm Batch Generation</h3>
              <button onClick={() => setShowConfirmModal(false)} className="btn btn-icon btn-ghost">
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="bg-warning-light border-l-4 border-warning-main rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg style={{ width: '24px', height: '24px' }} className="text-warning-main flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-warning-dark mb-1">Cost Warning</p>
                    <p className="text-sm text-warning-dark">
                      You are about to generate <strong>{promptCount} images</strong>. Please review the details below before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Grid - Bento Style */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                <div className="card card-compact">
                  <p className="text-xs text-neutral-500 mb-1">Total Prompts</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{promptCount}</p>
                </div>
                <div className="card card-compact card-indigo">
                  <p className="text-xs text-indigo-700 mb-1">Estimated Cost</p>
                  <p className="text-2xl font-bold text-indigo-600">${estimatedCost}</p>
                </div>
                <div className="card card-compact">
                  <p className="text-xs text-neutral-500 mb-1">Reference Images</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formData.reference_images.length}</p>
                </div>
                <div className="card card-compact">
                  <p className="text-xs text-neutral-500 mb-1">API Key</p>
                  <p className="text-lg font-mono" style={{ color: 'var(--text-primary)' }}>{maskedApiKey}</p>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-xs text-indigo-900">
                  <strong>Tarification:</strong> $0.039 par image générée. Les coûts finaux peuvent varier selon l'utilisation réelle.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExecution}
                className="btn btn-primary-lime glow-pulse"
              >
                Confirm & Generate {promptCount} Images
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Example Prompts Modal */}
      {showExampleModal && (
        <div className="modal-overlay" onClick={() => setShowExampleModal(false)}>
          <div className="modal-content-glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="text-h3 font-bold">Example Prompts</h3>
              <button onClick={() => setShowExampleModal(false)} className="btn btn-icon btn-ghost">
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <p className="text-sm text-neutral-600 mb-4">
                Ces exemples montrent comment mettre en valeur votre produit dans différents décors. Remplacez [product] par votre produit réel.
              </p>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-xs" style={{ fontFamily: 'var(--font-mono)', lineHeight: '1.8' }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: 'var(--primary-600)' }}>1. Rustique & Naturel:</strong><br />
                    [product] on a rustic wooden table with natural morning light, surrounded by fresh herbs and organic ingredients, warm atmosphere, professional food photography
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: 'var(--primary-600)' }}>2. Minimaliste Zen:</strong><br />
                    [product] floating in a minimalist zen garden setting with smooth stones, raked sand patterns, soft shadows, clean modern aesthetic, 8k resolution
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: 'var(--primary-600)' }}>3. Hygge Cosy:</strong><br />
                    [product] in a cozy hygge-inspired interior with candles, soft blankets, and warm bokeh lights in background, intimate atmosphere, Scandinavian design
                  </div>

                  <div>
                    <strong style={{ color: 'var(--primary-600)' }}>4. Tropical Vibrant:</strong><br />
                    [product] on a vibrant tropical beach scene with turquoise water, palm leaves, white sand, golden hour sunlight, vacation lifestyle photography
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowExampleModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={loadExamplePrompts}
                className="btn btn-primary"
              >
                Load Examples
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
