import { useState, useEffect } from 'react';
import logger from '@/utils/logger';


/**
 * NanoBananaForm Component
 * Form for Batch Nano Banana workflow (AI image generation)
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
    } else if (promptCount >= 1 && promptCount <= 100) {
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
    const examples = `a beautiful sunset over snow-capped mountains, cinematic lighting, 8k resolution

a futuristic cyberpunk city at night with neon lights reflecting on wet streets

a portrait of a cat wearing vintage sunglasses and a leather jacket, studio lighting

an underwater scene with colorful coral reefs and tropical fish, crystal clear water`;

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
    promptCount <= 100;

  const getSubmitDisabledReason = () => {
    if (promptCount === 0) return 'Add at least one prompt';
    if (promptCount > 100) return 'Maximum 100 prompts allowed';
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
      <form onSubmit={handleFormSubmit} className="space-y-lg">
        {/* Prompts Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-body-sm font-medium text-neutral-700">
              Image Prompts <span className="text-error-main">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowExampleModal(true)}
              className="btn-link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Load Example
            </button>
          </div>
          <textarea
            value={formData.prompts_text}
            onChange={(e) => setFormData({ ...formData, prompts_text: e.target.value })}
            placeholder="Enter your image prompts, separated by double line breaks.

Example:
a beautiful sunset over mountains

a futuristic city at night

a portrait of a cat wearing sunglasses"
            rows={12}
            required
            className="input-field"
            style={{ fontFamily: 'var(--font-mono)' }}
          />

          {/* Prompt Counter with Validation */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validationState.promptCountValid === true && (
                <span className="text-success-main">✓</span>
              )}
              {validationState.promptCountValid === false && (
                <span className="text-error-main">✗</span>
              )}
              <p className={`text-xs ${
                validationState.promptCountValid === false ? 'text-error-main font-medium' :
                validationState.promptCountValid === true ? 'text-success-dark font-medium' :
                'text-neutral-500'
              }`}>
                {promptCount} prompt{promptCount !== 1 ? 's' : ''} detected
                {promptCount > 0 && ` • Estimated cost: $${estimatedCost} USD`}
              </p>
            </div>
            {promptCount > 100 && (
              <p className="text-xs text-error-main font-medium">
                Maximum 100 prompts allowed
              </p>
            )}
          </div>

          {/* Format Helper */}
          <div className="mt-2 text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
            <strong>Format:</strong> Separate each prompt with a double line break (press Enter twice).
            Each prompt will generate one image.
          </div>
        </div>

        {/* API Key with Security UI */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-body-sm font-medium text-neutral-700">
              Google Gemini API Key <span className="text-error-main">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              className="btn-link"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Security Info
            </button>
          </div>

          <div className="relative">
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="AIza..."
              required
              className={`input-field ${
                validationState.apiKeyValid === false ? 'input-error' :
                validationState.apiKeyValid === true ? 'border-success-main bg-success-light' :
                ''
              }`}
            />
            {validationState.apiKeyValid === true && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-success-main">
                ✓
              </span>
            )}
            {validationState.apiKeyValid === false && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-error-main">
                ✗
              </span>
            )}
          </div>

          {/* Validation Error */}
          {validationState.errors.apiKey && (
            <p className="mt-1 text-xs text-error-main">{validationState.errors.apiKey}</p>
          )}

          {/* Security Info Expandable */}
          {showSecurityInfo && (
            <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-indigo-900">
                  <p className="font-semibold mb-1">How we protect your API key:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Encrypted in transit using HTTPS</li>
                    <li>Encrypted at rest with AES-256</li>
                    <li>Never stored in logs or databases</li>
                    <li>Only used for your image generation</li>
                    <li>Deleted immediately after execution</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <p className="mt-1 text-xs text-neutral-500 flex items-center gap-1">
            <svg className="w-3 h-3 text-success-main" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Encrypted and never stored permanently
          </p>
        </div>

        {/* Reference Images (Optional) */}
        <div>
          <label className="block text-body-sm font-medium text-neutral-700 mb-2">
            Reference Images (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100
              transition-colors cursor-pointer"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Upload up to 3 reference images (PNG, JPG, WEBP) • Max 10MB each
          </p>

          {/* File Validation Error */}
          {validationState.errors.files && (
            <p className="mt-1 text-xs text-error-main font-medium">{validationState.errors.files}</p>
          )}

          {formData.reference_images.length > 0 && validationState.fileSizeValid && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.reference_images.map((file, i) => (
                <div key={i} className="badge badge-success">
                  ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-900">
            <strong>How it works:</strong> This workflow uses Google Gemini 2.5 Flash Image to generate images from your prompts.
            Each prompt will be processed individually, and you'll receive a detailed report with all generated images.
          </p>
        </div>

        {/* CRITICAL: Generate Button - Lime Action Button with Glow Pulse */}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className={`btn btn-primary-lime btn-lg w-full ${!isFormValid || loading ? '' : 'glow-pulse'}`}
        >
          {loading ? (
            <>
              <span className="spinner-gradient-indigo-lime"></span>
              Generating...
            </>
          ) : (
            <>
              🚀 Generate {promptCount} Image{promptCount !== 1 ? 's' : ''}
            </>
          )}
        </button>

        {/* Disabled Reason */}
        {!isFormValid && !loading && (
          <p className="text-xs text-center text-neutral-500">
            {getSubmitDisabledReason()}
          </p>
        )}
      </form>

      {/* Cost Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content-glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="text-h3 font-bold">Confirm Batch Generation</h3>
              <button onClick={() => setShowConfirmModal(false)} className="btn btn-icon btn-ghost">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="bg-warning-light border-l-4 border-warning-main rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-warning-main flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
                  <strong>Pricing:</strong> Each image costs approximately $0.039 USD (Google Gemini API pricing).
                  Final costs may vary based on actual API usage and any promotional credits.
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <p className="text-sm text-neutral-600 mb-4">
                Load these example prompts to see how to format your batch. You can edit them after loading.
              </p>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                <pre className="whitespace-pre-wrap">
a beautiful sunset over snow-capped mountains, cinematic lighting, 8k resolution

a futuristic cyberpunk city at night with neon lights reflecting on wet streets

a portrait of a cat wearing vintage sunglasses and a leather jacket, studio lighting

an underwater scene with colorful coral reefs and tropical fish, crystal clear water
                </pre>
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
