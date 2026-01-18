import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import logger from '@/utils/logger';
import { Workflow } from '@/types';
import {
  base64ToFile,
  Base64ImageObject,
  ImagePreview,
  createImagePreviews,
  revokeImagePreviews
} from '@/utils/imageHelpers';
import { ConfirmExecutionModal } from '@/components/modals/ConfirmExecutionModal';
import { ExamplePromptsModal, getExamplePromptsText } from '@/components/modals/ExamplePromptsModal';
import './NanoBananaForm.css';

/**
 * Type definitions for NanoBananaForm
 */
type ModelType = 'flash' | 'pro';
type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '9:16' | '16:9' | '21:9';
type ResolutionType = '1K' | '2K' | '4K';

interface NanoBananaFormData {
  prompts_text: string;
  api_key: string;
  reference_images: File[];
  model: ModelType;
  aspect_ratio: AspectRatio;
  resolution: ResolutionType;
}

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

interface PrefillData {
  prompts_text?: string;
  model?: ModelType;
  aspect_ratio?: AspectRatio;
  resolution?: ResolutionType;
  reference_images_base64?: Base64ImageObject[] | Record<string, Base64ImageObject | string>;
}

interface NanoBananaFormProps {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  workflow: Workflow | null;
  initialData?: PrefillData | null;
}

// Constants
const MAX_TEXT_LENGTH = 500000;
const MAX_IMAGES = 14;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PROMPTS = 10000;

/**
 * Calculate prompt count from text (aligned with backend parser)
 */
function countPrompts(text: string): number {
  return text.split(/\n\n+/).filter(p => p.trim()).length;
}

/**
 * Calculate pricing based on model and resolution
 */
function calculatePricing(model: ModelType, resolution: ResolutionType, promptCount: number): { costPerImage: number; totalCost: number } {
  let costPerImage: number;
  if (model === 'flash') {
    costPerImage = 0.039;
  } else {
    costPerImage = resolution === '4K' ? 0.06 : 0.03633;
  }
  return { costPerImage, totalCost: costPerImage * promptCount };
}

/**
 * Convert base64 images from prefill data to File objects with previews
 */
function convertPrefillImages(
  imagesData: Base64ImageObject[] | Record<string, Base64ImageObject | string> | undefined
): { files: File[]; previews: ImagePreview[] } {
  const files: File[] = [];
  const previews: ImagePreview[] = [];

  if (!imagesData) return { files, previews };

  const processImage = (imageObj: Base64ImageObject | string, index: number): void => {
    const file = base64ToFile(imageObj, `reference_${index}.png`);
    if (file) {
      files.push(file);
      previews.push({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      });
    }
  };

  if (Array.isArray(imagesData)) {
    imagesData.forEach((imageObj, index) => processImage(imageObj, index));
  } else {
    Object.entries(imagesData).forEach(([, imageData], index) => {
      processImage(imageData, index);
    });
  }

  return { files, previews };
}

/**
 * NanoBananaForm Component - "Industrial Command Center"
 * Dark Premium design with Bleu Petrole accent
 */
export function NanoBananaForm({
  onSubmit,
  loading,
  workflow,
  initialData = null
}: NanoBananaFormProps): JSX.Element {
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

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

  // Calculate derived values
  const promptCount = countPrompts(formData.prompts_text);
  const { totalCost } = calculatePricing(formData.model, formData.resolution, promptCount);
  const estimatedCost = totalCost.toFixed(3);

  // Load defaults from workflow config (only if no prefill data)
  useEffect(() => {
    if (initialData) {
      logger.debug('NanoBananaForm: Skipping workflow defaults (prefill data exists)');
      return;
    }

    if (workflow?.config) {
      logger.debug('NanoBananaForm: Loading workflow defaults', {
        default_model: workflow.config.default_model,
        default_aspect_ratio: workflow.config.default_aspect_ratio
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

    logger.debug('NanoBananaForm: Initializing with prefill data', {
      prompts_text_length: initialData.prompts_text?.length,
      model: initialData.model,
      has_images: !!initialData.reference_images_base64
    });

    const { files, previews } = convertPrefillImages(initialData.reference_images_base64);

    setFormData({
      prompts_text: initialData.prompts_text || '',
      api_key: import.meta.env.VITE_DEFAULT_GEMINI_API_KEY || '',
      reference_images: files,
      model: initialData.model || 'flash',
      aspect_ratio: initialData.aspect_ratio || '1:1',
      resolution: initialData.resolution || '1K'
    });

    setImagePreviews(previews);
    logger.debug('NanoBananaForm: Form initialized with prefill data');
  }, [initialData]);

  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => revokeImagePreviews(imagePreviews);
  }, [imagePreviews]);

  // Real-time API key validation
  useEffect(() => {
    if (formData.api_key.length === 0) {
      setValidationState(prev => ({ ...prev, apiKeyValid: null, errors: { ...prev.errors, apiKey: null } }));
      return;
    }
    if (formData.api_key.startsWith('AIza') && formData.api_key.length > 30) {
      setValidationState(prev => ({ ...prev, apiKeyValid: true, errors: { ...prev.errors, apiKey: null } }));
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
    } else if (promptCount >= 1 && promptCount <= MAX_PROMPTS) {
      setValidationState(prev => ({ ...prev, promptCountValid: true }));
    } else {
      setValidationState(prev => ({ ...prev, promptCountValid: false }));
    }
  }, [promptCount]);

  // Real-time text length validation
  useEffect(() => {
    const textLength = formData.prompts_text.length;
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

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(e.target.files || []);
    const currentCount = formData.reference_images.length;
    const totalCount = currentCount + files.length;

    if (totalCount > MAX_IMAGES) {
      setValidationState(prev => ({
        ...prev,
        fileSizeValid: false,
        errors: { ...prev.errors, files: `Maximum ${MAX_IMAGES} reference images allowed (currently ${currentCount})` }
      }));
      e.target.value = '';
      return;
    }

    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setValidationState(prev => ({
        ...prev,
        fileSizeValid: false,
        errors: { ...prev.errors, files: 'Files exceed 10MB limit' }
      }));
      e.target.value = '';
      return;
    }

    const newPreviews = createImagePreviews(files);

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
  }

  function removeImage(index: number): void {
    URL.revokeObjectURL(imagePreviews[index].url);
    setFormData(prev => ({
      ...prev,
      reference_images: prev.reference_images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  function handleLoadExamples(): void {
    setFormData({ ...formData, prompts_text: getExamplePromptsText() });
    setShowExampleModal(false);
  }

  function handleFormSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setShowConfirmModal(true);
  }

  function handleConfirmExecution(): void {
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

    logger.debug('NanoBananaForm: FormData before sending', {
      prompts_text_length: formData.prompts_text.length,
      model: modelValue,
      reference_images_count: formData.reference_images.length
    });

    onSubmit(formDataToSend);
  }

  const isFormValid =
    formData.prompts_text.trim() &&
    formData.api_key.trim() &&
    validationState.apiKeyValid === true &&
    validationState.promptCountValid === true &&
    validationState.textLengthValid === true &&
    validationState.fileSizeValid === true &&
    promptCount > 0 &&
    promptCount <= MAX_PROMPTS;

  function getSubmitDisabledReason(): string | null {
    if (promptCount === 0) return 'Add at least one prompt';
    if (promptCount > MAX_PROMPTS) return `Maximum ${MAX_PROMPTS} prompts allowed`;
    if (!validationState.textLengthValid) return 'Text too long (max 500,000 characters)';
    if (!formData.api_key.trim()) return 'API key required';
    if (validationState.apiKeyValid === false) return 'Invalid API key format';
    if (!validationState.fileSizeValid) return 'Fix file validation errors';
    return null;
  }

  return (
    <>
      <form onSubmit={handleFormSubmit} className="nb-form">
        {/* Step 1: Reference Images (Optional) */}
        <div className="nb-step nb-step-optional nb-step-compact">
          <div className="nb-step-header-compact">
            <div className="nb-step-badge-compact">01</div>
            <div className="nb-step-title-compact">
              <h3>Reference Images</h3>
              <p>{MAX_IMAGES} max - 10MB each</p>
            </div>
          </div>

          <div className="nb-upload-zone-compact">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="nb-upload-input"
              id="reference-upload"
            />
            <label htmlFor="reference-upload" className="nb-upload-label-compact">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Upload images</span>
            </label>
          </div>

          {validationState.errors.files && (
            <div className="nb-error-msg">{validationState.errors.files}</div>
          )}

          {imagePreviews.length > 0 && validationState.fileSizeValid && (
            <div className="nb-file-list-compact">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="nb-file-item-compact">
                  <img src={preview.url} alt={preview.name} className="nb-file-preview-compact" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="nb-file-remove-compact"
                    aria-label="Remove"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
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
            <button type="button" onClick={() => setShowExampleModal(true)} className="nb-btn-ghost">
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

          {promptCount > MAX_PROMPTS && (
            <div className="nb-error-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Limit exceeded: Maximum {MAX_PROMPTS} units allowed
            </div>
          )}
        </div>

        {/* Step 3: Configuration */}
        <div className="nb-step">
          <div className="nb-step-header">
            <div className="nb-step-badge">03</div>
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
                <option value="pro">Pro - Qualite maximale</option>
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
                    { value: '2K', label: '2K Haute definition' },
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
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
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
      <ConfirmExecutionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmExecution}
        itemCount={promptCount}
        model={formData.model}
        aspectRatio={formData.aspect_ratio}
        resolution={formData.resolution}
        referenceImagesCount={formData.reference_images.length}
        estimatedCost={estimatedCost}
        showCost={false}
      />

      {/* Example Modal */}
      <ExamplePromptsModal
        isOpen={showExampleModal}
        onClose={() => setShowExampleModal(false)}
        onLoadExamples={handleLoadExamples}
      />
    </>
  );
}
