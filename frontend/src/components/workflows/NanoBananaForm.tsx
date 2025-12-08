import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import logger from '@/utils/logger';
import { Workflow } from '@/types';
import './NanoBananaForm.css';

/**
 * Type definitions for NanoBananaForm
 */

// Model types for Gemini API
type ModelType = 'flash' | 'pro';

// Aspect ratio options
type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '9:16' | '16:9' | '21:9';

// Resolution options (Pro only)
type ResolutionType = '1K' | '2K' | '4K';

// Form data structure
interface NanoBananaFormData {
  prompts_text: string;
  api_key: string;
  reference_images: File[];
  model: ModelType;
  aspect_ratio: AspectRatio;
  resolution: ResolutionType;
}

// Validation state structure
interface ValidationState {
  apiKeyValid: boolean | null;
  promptCountValid: boolean | null;
  textLengthValid: boolean;
  fileSizeValid: boolean;
  errors: {
    apiKey?: string | null;
    textLength?: string | null;
    files?: string | null;
  };
}

// Image preview structure
interface ImagePreview {
  file: File;
  url: string;
  name: string;
  size: number;
}

// Base64 image object structure (from database)
interface Base64ImageObject {
  data: string;
  mimeType: string;
  originalName?: string;
}

// Prefill data structure (for "Run Again" feature)
interface PrefillData {
  prompts_text?: string;
  model?: ModelType;
  aspect_ratio?: AspectRatio;
  resolution?: ResolutionType;
  reference_images_base64?: Base64ImageObject[] | Record<string, Base64ImageObject | string>;
}

// Component props
interface NanoBananaFormProps {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  workflow: Workflow | null;
  initialData?: PrefillData | null;
}

/**
 * NanoBananaForm Component - "Industrial Command Center"
 * Dark Premium design with Bleu Pétrole accent
 * Production pipeline aesthetic for AI image generation
 */
export function NanoBananaForm({ onSubmit, loading, workflow, initialData = null }: NanoBananaFormProps) {
  const [formData, setFormData] = useState<NanoBananaFormData>({
    prompts_text: '',
    api_key: import.meta.env.VITE_DEFAULT_GEMINI_API_KEY || '',
    reference_images: [],
    model: 'flash',
    aspect_ratio: '1:1',
    resolution: '1K'
  });

  const [validationState, setValidationState] = useState<ValidationState>({
    apiKeyValid: null,
    promptCountValid: null,
    textLengthValid: true,
    fileSizeValid: true,
    errors: {}
  });

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showExampleModal, setShowExampleModal] = useState<boolean>(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState<boolean>(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

  // Helper: Convert base64 object to File object
  const base64ToFile = (imageObj: Base64ImageObject | string, filename: string): File | null => {
    try {
      // Handle two formats:
      // 1. Object with { data, mimeType } (stored in DB)
      // 2. String with data:image/...;base64,... (legacy)
      let base64Data: string;
      let mimeType: string;
      let originalName = filename;

      if (typeof imageObj === 'object' && 'data' in imageObj) {
        // Format from DB: { data: 'base64', mimeType: 'image/png' }
        base64Data = imageObj.data;
        mimeType = imageObj.mimeType;
        originalName = imageObj.originalName || filename;
      } else if (typeof imageObj === 'string') {
        // Legacy format: 'data:image/png;base64,iVBORw0...'
        const arr = imageObj.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) {
          throw new Error('Invalid base64 string format');
        }
        mimeType = mimeMatch[1];
        base64Data = arr[1];
      } else {
        throw new Error('Unsupported image format');
      }

      // Decode base64
      const bstr = atob(base64Data);

      // Convert to Uint8Array
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      // Create and return File object
      return new File([u8arr], originalName, { type: mimeType });
    } catch (error) {
      logger.error('❌ NanoBananaForm.base64ToFile: Conversion failed', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        filename,
        imageObj: typeof imageObj
      });
      return null;
    }
  };

  // Load defaults from workflow config (only if no prefill data)
  useEffect(() => {
    // Skip defaults if we have prefill data (for "Run Again" feature)
    if (initialData) {
      logger.debug('⚠️ NanoBananaForm: Skipping workflow defaults (prefill data exists)');
      return;
    }

    if (workflow?.config) {
      logger.debug('🔄 NanoBananaForm: Loading workflow defaults', {
        default_model: workflow.config.default_model,
        default_aspect_ratio: workflow.config.default_aspect_ratio,
        default_resolution: workflow.config.default_resolution?.pro
      });

      setFormData(prev => ({
        ...prev,
        model: workflow.config.default_model === 'gemini-3-pro-image-preview' ? 'pro' : 'flash',
        aspect_ratio: workflow.config.default_aspect_ratio || '1:1',
        resolution: workflow.config.default_resolution?.pro || '1K'
      }));
    }
  }, [workflow, initialData]);

  // Initialize form with prefill data (for "Run Again" feature)
  useEffect(() => {
    if (!initialData) return;

    logger.debug('🔄 NanoBananaForm: Initializing with prefill data', {
      prompts_text_length: initialData.prompts_text?.length,
      model: initialData.model,
      aspect_ratio: initialData.aspect_ratio,
      resolution: initialData.resolution,
      has_images: !!initialData.reference_images_base64
    });

    // Convert base64 images to File objects
    const convertedImages: File[] = [];
    const newPreviews: ImagePreview[] = [];

    if (initialData.reference_images_base64) {
      const imagesData = initialData.reference_images_base64;

      // Handle both array and object formats
      if (Array.isArray(imagesData)) {
        // Array format: [{ data, mimeType, originalName }, ...]
        imagesData.forEach((imageObj, index) => {
          const file = base64ToFile(imageObj, `reference_${index}.png`);
          if (file) {
            convertedImages.push(file);
            newPreviews.push({
              file,
              url: URL.createObjectURL(file),
              name: file.name,
              size: file.size
            });
          }
        });
      } else if (typeof imagesData === 'object') {
        // Object format: { img_0: '...', img_1: '...' }
        Object.entries(imagesData).forEach(([, imageData], index) => {
          const file = base64ToFile(imageData, `reference_${index}.png`);
          if (file) {
            convertedImages.push(file);
            newPreviews.push({
              file,
              url: URL.createObjectURL(file),
              name: file.name,
              size: file.size
            });
          }
        });
      }

      logger.debug('✅ NanoBananaForm: Converted images', {
        original_count: Array.isArray(imagesData) ? imagesData.length : Object.keys(imagesData).length,
        converted_count: convertedImages.length
      });
    }

    // Update form data
    setFormData({
      prompts_text: initialData.prompts_text || '',
      api_key: import.meta.env.VITE_DEFAULT_GEMINI_API_KEY || '', // Use environment variable for security
      reference_images: convertedImages,
      model: initialData.model || 'flash',
      aspect_ratio: initialData.aspect_ratio || '1:1',
      resolution: initialData.resolution || '1K'
    });

    // Update image previews
    setImagePreviews(newPreviews);

    logger.debug('✅ NanoBananaForm: Form initialized with prefill data');
  }, [initialData]);

  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  // Calculate prompt count (aligned with backend parser logic)
  const promptCount = formData.prompts_text
    .split(/\n\n+/)  // Split by 2 or more newlines (same as backend)
    .filter(p => p.trim())
    .length;

  // Calculate dynamic pricing
  const calculatePricing = (): { costPerImage: number; totalCost: number } => {
    let costPerImage: number;
    if (formData.model === 'flash') {
      costPerImage = 0.039;
    } else {
      costPerImage = formData.resolution === '4K' ? 0.06 : 0.03633;
    }
    return { costPerImage, totalCost: costPerImage * promptCount };
  };

  const { costPerImage, totalCost } = calculatePricing();
  const estimatedCost = totalCost.toFixed(3);

  // Real-time API key validation
  useEffect(() => {
    if (formData.api_key.length === 0) {
      setValidationState(prev => ({ ...prev, apiKeyValid: null, errors: { ...prev.errors, apiKey: null }}));
      return;
    }
    if (formData.api_key.startsWith('AIza') && formData.api_key.length > 30) {
      setValidationState(prev => ({ ...prev, apiKeyValid: true, errors: { ...prev.errors, apiKey: null }}));
    } else {
      setValidationState(prev => ({
        ...prev,
        apiKeyValid: false,
        errors: { ...prev.errors, apiKey: 'API key should start with "AIza" and be at least 30 characters' }
      }));
    }
  }, [formData.api_key]);

  // Real-time prompt count validation
  useEffect(() => {
    if (promptCount === 0) {
      setValidationState(prev => ({ ...prev, promptCountValid: null }));
    } else if (promptCount >= 1 && promptCount <= 10000) {
      setValidationState(prev => ({ ...prev, promptCountValid: true }));
    } else {
      setValidationState(prev => ({ ...prev, promptCountValid: false }));
    }
  }, [promptCount]);

  // Real-time text length validation (500,000 characters max)
  useEffect(() => {
    const textLength = formData.prompts_text.length;
    const MAX_TEXT_LENGTH = 500000;

    if (textLength > MAX_TEXT_LENGTH) {
      setValidationState(prev => ({
        ...prev,
        textLengthValid: false,
        errors: {
          ...prev.errors,
          textLength: `Text too long: ${textLength.toLocaleString()} / ${MAX_TEXT_LENGTH.toLocaleString()} characters`
        }
      }));
    } else {
      setValidationState(prev => ({
        ...prev,
        textLengthValid: true,
        errors: { ...prev.errors, textLength: null }
      }));
    }
  }, [formData.prompts_text]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    const currentCount = formData.reference_images.length;
    const totalCount = currentCount + files.length;

    if (totalCount > 14) {
      setValidationState(prev => ({
        ...prev,
        fileSizeValid: false,
        errors: { ...prev.errors, files: `Maximum 14 reference images allowed (currently ${currentCount})` }
      }));
      e.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      setValidationState(prev => ({
        ...prev,
        fileSizeValid: false,
        errors: { ...prev.errors, files: `Files exceed 10MB limit` }
      }));
      e.target.value = '';
      return;
    }

    // Create preview URLs for new images
    const newPreviews: ImagePreview[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setValidationState(prev => ({
      ...prev,
      fileSizeValid: true,
      errors: { ...prev.errors, files: null }
    }));

    setFormData(prev => ({
      ...prev,
      reference_images: [...prev.reference_images, ...files]
    }));

    setImagePreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeImage = (index: number): void => {
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index].url);

    setFormData(prev => ({
      ...prev,
      reference_images: prev.reference_images.filter((_, i) => i !== index)
    }));

    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const loadExamplePrompts = (): void => {
    const examples = `[product] on a rustic wooden table with natural morning light, surrounded by fresh herbs and organic ingredients, warm atmosphere, professional food photography


[product] floating in a minimalist zen garden setting with smooth stones, raked sand patterns, soft shadows, clean modern aesthetic, 8k resolution


[product] in a cozy hygge-inspired interior with candles, soft blankets, and warm bokeh lights in background, intimate atmosphere, Scandinavian design


[product] on a vibrant tropical beach scene with turquoise water, palm leaves, white sand, golden hour sunlight, vacation lifestyle photography`;

    setFormData({ ...formData, prompts_text: examples });
    setShowExampleModal(false);
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmExecution = (): void => {
    setShowConfirmModal(false);
    const formDataToSend = new FormData();
    formDataToSend.append('prompts_text', formData.prompts_text);
    formDataToSend.append('api_key', formData.api_key);
    const modelValue = formData.model === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    formDataToSend.append('model', modelValue);
    formDataToSend.append('aspect_ratio', formData.aspect_ratio);
    formDataToSend.append('resolution', formData.resolution);
    formData.reference_images.forEach((file) => {
      formDataToSend.append('reference_images', file);
    });

    // DEBUG: Log FormData contents (only in development)
    logger.debug('🔍 NanoBananaForm: FormData before sending', {
      prompts_text_length: formData.prompts_text.length,
      api_key_present: !!formData.api_key,
      model: modelValue,
      aspect_ratio: formData.aspect_ratio,
      resolution: formData.resolution,
      reference_images_count: formData.reference_images.length,
      reference_images_files: formData.reference_images.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    });

    // DEBUG: Log actual FormData entries (only in development)
    if (logger.isEnabled()) {
      for (const [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          logger.debug(`  📎 FormData entry: ${key} = File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          logger.debug(`  📝 FormData entry: ${key} = ${value}`);
        }
      }
    }

    onSubmit(formDataToSend);
  };

  const isFormValid =
    formData.prompts_text.trim() &&
    formData.api_key.trim() &&
    validationState.apiKeyValid === true &&
    validationState.promptCountValid === true &&
    validationState.textLengthValid === true &&
    validationState.fileSizeValid === true &&
    promptCount > 0 &&
    promptCount <= 10000;

  const getSubmitDisabledReason = (): string | null => {
    if (promptCount === 0) return 'Add at least one prompt';
    if (promptCount > 10000) return 'Maximum 10,000 prompts allowed';
    if (!validationState.textLengthValid) return 'Text too long (max 500,000 characters)';
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
      <form onSubmit={handleFormSubmit} className="nb-form">
        {/* Pipeline Header */}
        <div className="nb-header">
          <div className="nb-header-content">
            <div className="nb-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div>
              <h2 className="nb-header-title">Image Production Pipeline</h2>
              <p className="nb-header-subtitle">
                <span className="nb-status-dot"></span>
                System Ready
                {/* Prix masqué temporairement
                <span className="nb-header-separator">|</span>
                <span className="nb-header-rate">${costPerImage.toFixed(3)}/image</span>
                */}
              </p>
            </div>
          </div>
          <div className="nb-header-stats">
            <div className="nb-stat nb-stat-accent">
              <span className="nb-stat-value">{promptCount}</span>
              <span className="nb-stat-label">Images</span>
            </div>
            {/* Prix masqué temporairement
            <div className="nb-stat nb-stat-accent">
              <span className="nb-stat-value">${estimatedCost}</span>
              <span className="nb-stat-label">Est. Cost</span>
            </div>
            */}
          </div>
        </div>

        {/* Step 1: Reference Images (Optional) */}
        <div className="nb-step nb-step-optional">
          <div className="nb-step-header">
            <div className="nb-step-badge">01</div>
            <div className="nb-step-title">
              <h3>Reference Images</h3>
              <p>Up to 14 images, 10MB max each</p>
            </div>
          </div>

          <div className="nb-upload-zone">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="nb-upload-input"
              id="reference-upload"
            />
            <label htmlFor="reference-upload" className="nb-upload-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Drop images or click to browse</span>
            </label>
          </div>

          {validationState.errors.files && (
            <div className="nb-error-msg">{validationState.errors.files}</div>
          )}

          {imagePreviews.length > 0 && validationState.fileSizeValid && (
            <div className="nb-file-list">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="nb-file-item">
                  {/* Image Preview */}
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="nb-file-preview"
                  />

                  {/* Success Indicator */}
                  <div className="nb-file-success">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="nb-file-remove"
                    aria-label="Remove image"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  {/* Info Overlay */}
                  <div className="nb-file-info">
                    <span className="nb-file-name">{preview.name}</span>
                    <span className="nb-file-size">{(preview.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Prompts */}
        <div className="nb-step">
          <div className="nb-step-header">
            <div className="nb-step-badge">02</div>
            <div className="nb-step-title">
              <h3>Input Queue</h3>
              <p>Separate prompts with 2+ blank lines (keeps your spacing)</p>
            </div>
            <button
              type="button"
              onClick={() => setShowExampleModal(true)}
              className="nb-btn-ghost"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Load Examples
            </button>
          </div>

          <div className="nb-textarea-wrapper">
            <textarea
              value={formData.prompts_text}
              onChange={(e) => setFormData({ ...formData, prompts_text: e.target.value })}
              placeholder="First prompt goes here
You can use multiple lines for a single prompt


Second prompt after 2+ blank lines


Third prompt, and so on..."
              rows={8}
              required
              className={`nb-textarea ${validationState.promptCountValid === true ? 'valid' : ''}`}
            />
            <div className={`nb-counter ${validationState.promptCountValid === true ? 'valid' : validationState.promptCountValid === false ? 'error' : ''}`}>
              {promptCount} <span>units</span>
            </div>
          </div>

          {!validationState.textLengthValid && validationState.errors.textLength && (
            <div className="nb-error-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {validationState.errors.textLength}
            </div>
          )}

          {promptCount > 10000 && (
            <div className="nb-error-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Limit exceeded: Maximum 10,000 units allowed
            </div>
          )}
        </div>

        {/* Step 3: API Key */}
        <div className="nb-step">
          <div className="nb-step-header">
            <div className="nb-step-badge">03</div>
            <div className="nb-step-title">
              <h3>Authentication</h3>
              <p>Gemini API credentials</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              className="nb-btn-ghost"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {showSecurityInfo ? 'Hide' : 'Security'}
            </button>
          </div>

          <div className="nb-input-wrapper">
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="AIza..."
              required
              className={`nb-input ${
                validationState.apiKeyValid === false ? 'error' :
                validationState.apiKeyValid === true ? 'valid' : ''
              }`}
            />
            <div className={`nb-input-status ${
              validationState.apiKeyValid === true ? 'valid' :
              validationState.apiKeyValid === false ? 'error' : ''
            }`}>
              {validationState.apiKeyValid === true ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : validationState.apiKeyValid === false ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : null}
            </div>
          </div>

          {validationState.errors.apiKey && (
            <div className="nb-error-msg">{validationState.errors.apiKey}</div>
          )}

          {showSecurityInfo && (
            <div className="nb-security-info">
              <div className="nb-security-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                HTTPS-only transmission
              </div>
              <div className="nb-security-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                AES-256 encryption at rest
              </div>
              <div className="nb-security-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Auto-deletion post-execution
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Configuration */}
        <div className="nb-step">
          <div className="nb-step-header">
            <div className="nb-step-badge">04</div>
            <div className="nb-step-title">
              <h3>Configuration</h3>
              <p>Model, format, and quality settings</p>
            </div>
          </div>

          <div className="nb-config-grid">
            {/* Model */}
            <div className="nb-field">
              <label className="nb-label">Model</label>
              <select
                value={formData.model}
                onChange={(e) => {
                  const newModel = e.target.value as ModelType;
                  setFormData(prev => ({
                    ...prev,
                    model: newModel,
                    resolution: newModel === 'flash' ? '1K' : prev.resolution
                  }));
                }}
                className="nb-select"
              >
                <option value="flash">Flash - Rapide</option>
                <option value="pro">Pro - Qualité maximale</option>
              </select>
            </div>

            {/* Aspect Ratio */}
            <div className="nb-field">
              <label className="nb-label">Aspect Ratio</label>
              <select
                value={formData.aspect_ratio}
                onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value as AspectRatio })}
                className="nb-select"
              >
                <optgroup label="Square">
                  <option value="1:1">1:1 Square</option>
                </optgroup>
                <optgroup label="Portrait">
                  <option value="2:3">2:3 Portrait</option>
                  <option value="3:4">3:4 Classic</option>
                  <option value="4:5">4:5 Instagram</option>
                  <option value="9:16">9:16 Mobile</option>
                </optgroup>
                <optgroup label="Landscape">
                  <option value="3:2">3:2 Photo</option>
                  <option value="4:3">4:3 Classic</option>
                  <option value="16:9">16:9 Video</option>
                  <option value="21:9">21:9 Ultra Wide</option>
                </optgroup>
              </select>
            </div>

            {/* Resolution (Pro only) */}
            {formData.model === 'pro' && (
              <div className="nb-field nb-field-full">
                <label className="nb-label">Resolution</label>
                <div className="nb-radio-group">
                  {[
                    { value: '1K', label: '1K Standard' },
                    { value: '2K', label: '2K Haute définition' },
                    { value: '4K', label: '4K Ultra' }
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`nb-radio-card ${formData.resolution === opt.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="resolution"
                        value={opt.value}
                        checked={formData.resolution === opt.value}
                        onChange={(e) => setFormData({ ...formData, resolution: e.target.value as ResolutionType })}
                      />
                      <span className="nb-radio-label">{opt.label}</span>
                      {/* Prix masqué temporairement
                      <span className="nb-radio-price">{opt.price}</span>
                      */}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cost Summary - masqué temporairement
          <div className="nb-cost-summary">
            <div className="nb-cost-row">
              <span>Model</span>
              <span>{formData.model === 'flash' ? 'Flash' : 'Pro'}</span>
            </div>
            <div className="nb-cost-row">
              <span>Format</span>
              <span>{formData.aspect_ratio}</span>
            </div>
            {formData.model === 'pro' && (
              <div className="nb-cost-row">
                <span>Resolution</span>
                <span>{formData.resolution}</span>
              </div>
            )}
            <div className="nb-cost-row">
              <span>Images</span>
              <span>{promptCount}</span>
            </div>
            <div className="nb-cost-divider"></div>
            <div className="nb-cost-row nb-cost-total">
              <span>Estimated Total</span>
              <span>${estimatedCost}</span>
            </div>
          </div>
          */}
        </div>

        {/* Submit Button */}
        <div className="nb-submit-section">
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`nb-submit-btn ${isFormValid && !loading ? 'ready' : ''}`}
          >
            {loading ? (
              <>
                <span className="nb-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Production
                <span className="nb-submit-count">{promptCount} units</span>
              </>
            )}
          </button>

          {!isFormValid && !loading && (
            <p className="nb-submit-hint">{getSubmitDisabledReason()}</p>
          )}
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="nb-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="nb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nb-modal-header">
              <h3>Confirm Generation</h3>
              <button onClick={() => setShowConfirmModal(false)} className="nb-modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="nb-modal-body">
              <div className="nb-modal-stats">
                <div className="nb-modal-stat nb-modal-stat-accent">
                  <span className="nb-modal-stat-label">Total Images</span>
                  <span className="nb-modal-stat-value">{promptCount}</span>
                </div>
                {/* Prix masqué temporairement
                <div className="nb-modal-stat nb-modal-stat-accent">
                  <span className="nb-modal-stat-label">Est. Cost</span>
                  <span className="nb-modal-stat-value">${estimatedCost}</span>
                </div>
                */}
                <div className="nb-modal-stat">
                  <span className="nb-modal-stat-label">Modèle</span>
                  <span className="nb-modal-stat-value">{formData.model === 'flash' ? 'Flash' : 'Pro'}</span>
                </div>
                <div className="nb-modal-stat">
                  <span className="nb-modal-stat-label">Format</span>
                  <span className="nb-modal-stat-value">{formData.aspect_ratio}</span>
                </div>
                <div className="nb-modal-stat">
                  <span className="nb-modal-stat-label">Références</span>
                  <span className="nb-modal-stat-value">{formData.reference_images.length}</span>
                </div>
              </div>
            </div>

            <div className="nb-modal-footer">
              <button onClick={() => setShowConfirmModal(false)} className="nb-btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmExecution} className="nb-btn-primary">
                Confirm & Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Example Modal */}
      {showExampleModal && (
        <div className="nb-modal-overlay" onClick={() => setShowExampleModal(false)}>
          <div className="nb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nb-modal-header">
              <h3>Example Prompts</h3>
              <button onClick={() => setShowExampleModal(false)} className="nb-modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="nb-modal-body">
              <p className="nb-modal-desc">Replace [product] with your actual product description.</p>

              <div className="nb-examples">
                <div className="nb-example">
                  <span className="nb-example-num">01</span>
                  <p>[product] on a rustic wooden table with natural morning light, warm atmosphere</p>
                </div>
                <div className="nb-example">
                  <span className="nb-example-num">02</span>
                  <p>[product] in a minimalist zen garden with smooth stones, clean aesthetic</p>
                </div>
                <div className="nb-example">
                  <span className="nb-example-num">03</span>
                  <p>[product] in a cozy hygge interior with candles and warm bokeh lights</p>
                </div>
                <div className="nb-example">
                  <span className="nb-example-num">04</span>
                  <p>[product] on tropical beach with turquoise water, golden hour sunlight</p>
                </div>
              </div>
            </div>

            <div className="nb-modal-footer">
              <button onClick={() => setShowExampleModal(false)} className="nb-btn-secondary">
                Cancel
              </button>
              <button onClick={loadExamplePrompts} className="nb-btn-primary">
                Load Examples
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
