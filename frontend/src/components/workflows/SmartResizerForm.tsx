/**
 * Smart Resizer Form Component
 *
 * Multi-file uploader with per-image format customization
 */

import React, { useState, useRef } from 'react';
import { AspectRatioIcon } from './AspectRatioIcon';
import './SmartResizerForm.css';

interface ImageFile {
  file: File;
  preview: string;
  id: string;
  formats?: Set<string>; // Custom formats for this image (optional)
}

interface SmartResizerFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
  workflow: {
    id: string;
    name: string;
    config?: {
      available_formats?: Array<{
        id: string;
        name: string;
        width: number;
        height: number;
        platform: string;
      }>;
    };
  };
}

export function SmartResizerForm({ onSubmit, loading, workflow }: SmartResizerFormProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [globalFormats, setGlobalFormats] = useState<Set<string>>(new Set());
  const [customizingImage, setCustomizingImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableFormats = workflow.config?.available_formats || [];

  // Sort formats by ratio (vertical → horizontal)
  const sortedFormats = [...availableFormats].sort((a, b) => {
    const ratioA = a.width / a.height;
    const ratioB = b.width / b.height;
    return ratioA - ratioB; // Ascending: vertical first, horizontal last
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(Array.from(e.target.files));
    }
  };

  const handleFilesSelect = (files: File[]) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;
    const validFiles: ImageFile[] = [];

    for (const file of files) {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type for ${file.name}. Please upload JPG, PNG, or WebP images.`);
        continue;
      }

      // Validate file size (10MB max)
      if (file.size > maxSize) {
        alert(`File ${file.name} too large. Maximum size is 10MB.`);
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random()}`,
        formats: undefined // Will use global formats by default
      });
    }

    if (validFiles.length > 0) {
      setImages(prev => [...prev, ...validFiles]);
      console.log('✅ SmartResizerForm: Files added', {
        count: validFiles.length,
        total: images.length + validFiles.length
      });
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (customizingImage === id) {
      setCustomizingImage(null);
    }
  };

  const handleGlobalFormatToggle = (formatId: string) => {
    const newFormats = new Set(globalFormats);
    if (newFormats.has(formatId)) {
      newFormats.delete(formatId);
    } else {
      newFormats.add(formatId);
    }
    setGlobalFormats(newFormats);
  };

  const handleImageFormatToggle = (imageId: string, formatId: string) => {
    setImages(prev => prev.map(img => {
      if (img.id !== imageId) return img;

      const currentFormats = img.formats || new Set(globalFormats);
      const newFormats = new Set(currentFormats);

      if (newFormats.has(formatId)) {
        newFormats.delete(formatId);
      } else {
        newFormats.add(formatId);
      }

      return { ...img, formats: newFormats };
    }));
  };

  const selectAllFormats = () => {
    const allFormatIds = new Set(sortedFormats.map(f => f.id));
    setGlobalFormats(allFormatIds);
  };

  const deselectAllFormats = () => {
    setGlobalFormats(new Set());
  };

  const resetImageFormats = (imageId: string) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, formats: undefined } : img
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      alert('Please upload at least one image.');
      return;
    }

    if (globalFormats.size === 0) {
      alert('Please select at least one output format.');
      return;
    }

    // Build batch configuration
    const batch = images.map(img => {
      const formats = img.formats || globalFormats;
      return {
        file: img.file,
        formats: Array.from(formats)
      };
    });

    const formData = new FormData();

    // Append all images
    batch.forEach((item, index) => {
      formData.append(`images`, item.file);
      formData.append(`formats_${index}`, JSON.stringify(item.formats));
    });

    formData.append('ai_regeneration', 'false');
    formData.append('batch_count', batch.length.toString());

    console.log('📤 SmartResizerForm: Submitting batch', {
      imagesCount: batch.length,
      globalFormats: Array.from(globalFormats),
      customizedImages: images.filter(img => img.formats).length,
      batch: batch.map(b => ({
        name: b.file.name,
        formatsCount: b.formats.length
      }))
    });

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="smart-resizer-form">
      {/* Step Indicator */}
      <div className="smart-resizer-form__steps">
        <div className={`smart-resizer-form__step ${currentStep >= 1 ? 'smart-resizer-form__step--active' : ''}`}>
          <span className="smart-resizer-form__step-number">1</span>
          <span>Upload</span>
        </div>
        <div className="smart-resizer-form__step-divider"></div>
        <div className={`smart-resizer-form__step ${currentStep >= 2 ? 'smart-resizer-form__step--active' : ''}`}>
          <span className="smart-resizer-form__step-number">2</span>
          <span>Formats</span>
        </div>
      </div>

      <div className="smart-resizer-form__layout">
        {/* STEP 1: Upload Section */}
        {currentStep === 1 && (
          <div className="smart-resizer-form__upload-section">
          <h3 className="smart-resizer-form__section-title">
            1. Upload Images
            <span className="smart-resizer-form__selected-count">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </span>
          </h3>

          {/* Dropzone */}
          <div
            className={`smart-resizer-form__dropzone ${dragActive ? 'smart-resizer-form__dropzone--active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="smart-resizer-form__dropzone-content">
              <svg className="smart-resizer-form__dropzone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="smart-resizer-form__dropzone-text">Click or drag to upload</p>
              <p className="smart-resizer-form__dropzone-hint">JPG, PNG, WebP • Max 10MB • Multiple files</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>

          {/* Images Grid */}
          {images.length > 0 && (
            <div className="smart-resizer-form__images-grid">
              {images.map((img) => (
                <div key={img.id} className="smart-resizer-form__image-card">
                  <div className="smart-resizer-form__image-preview">
                    <img src={img.preview} alt={img.file.name} />
                    <button
                      type="button"
                      className="smart-resizer-form__image-remove"
                      onClick={() => removeImage(img.id)}
                      title="Remove image"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="smart-resizer-form__image-info">
                    <span className="smart-resizer-form__image-name" title={img.file.name}>
                      {img.file.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Step 1 */}
          <div className="smart-resizer-form__nav">
            <div></div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentStep(2)}
              disabled={images.length === 0}
            >
              Suivant →
            </button>
          </div>
        </div>
        )}

        {/* STEP 2: Formats Section */}
        {currentStep === 2 && (
          <div className="smart-resizer-form__formats-section">
          <div className="smart-resizer-form__formats-header">
            <h3 className="smart-resizer-form__section-title">
              2. Sélectionner les formats
              <span className="smart-resizer-form__selected-count">
                {globalFormats.size} selected
              </span>
            </h3>
            <div className="smart-resizer-form__formats-actions">
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={selectAllFormats}
              >
                Select All
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={deselectAllFormats}
              >
                Deselect All
              </button>
            </div>
          </div>

          {sortedFormats.length === 0 ? (
            <p className="text-neutral-600">No formats available</p>
          ) : (
            <div className="smart-resizer-form__formats-grid">
              {sortedFormats.map((format) => (
                <div
                  key={format.id}
                  className={`smart-resizer-form__format ${globalFormats.has(format.id) ? 'smart-resizer-form__format--selected' : ''}`}
                  onClick={() => handleGlobalFormatToggle(format.id)}
                >
                  <AspectRatioIcon
                    ratio={format.ratio}
                    width={40}
                    height={40}
                    className="smart-resizer-form__format-icon"
                  />
                  <div className="smart-resizer-form__format-content">
                    <span className="smart-resizer-form__format-name">{format.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Navigation Step 2 */}
          <div className="smart-resizer-form__nav">
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => setCurrentStep(1)}
            >
              ← Retour
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || images.length === 0 || globalFormats.size === 0}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                `Générer ${images.length} image${images.length !== 1 ? 's' : ''} × ${globalFormats.size} format${globalFormats.size !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
        )}
      </div>
    </form>
  );
}
