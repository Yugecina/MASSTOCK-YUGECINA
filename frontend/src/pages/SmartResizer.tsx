/**
 * Smart Resizer Page
 *
 * Main page for Smart Resizer workflow
 * Multi-step wizard: Upload → Select Formats → Generate → Results
 */

import React, { useState, useEffect } from 'react';
import { useSmartResizerStore } from '../store/smartResizerStore';
import { createJob, getJobStatus, getFormats } from '../services/smartResizer';
import './SmartResizer.css';

const SmartResizer: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    uploadedImages,
    addImage,
    removeImage,
    globalFormats,
    toggleGlobalFormat,
    jobs,
    isGenerating,
    startGeneration,
    addJob,
    updateJobProgress,
    completeGeneration,
    reset,
  } = useSmartResizerStore();

  const [availableFormats, setAvailableFormats] = useState<any[]>([]);
  const [formatPacks, setFormatPacks] = useState<any>({});
  const [dragActive, setDragActive] = useState(false);

  // Load available formats on mount
  useEffect(() => {
    loadFormats();
  }, []);

  const loadFormats = async () => {
    try {
      const response = await getFormats();
      setAvailableFormats(response.data.formats);
      setFormatPacks(response.data.packs);
    } catch (error) {
      console.error('❌ Failed to load formats', error);
    }
  };

  // File upload handlers
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          addImage(file);
        }
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        addImage(file);
      });
    }
  };

  // Format pack selection
  const selectPack = (packName: string) => {
    const pack = formatPacks[packName];
    if (pack) {
      pack.forEach((format: string) => {
        if (!globalFormats.includes(format)) {
          toggleGlobalFormat(format);
        }
      });
    }
  };

  // Generation
  const handleStartGeneration = async () => {
    if (uploadedImages.length === 0 || globalFormats.length === 0) {
      alert('Please upload at least one image and select formats');
      return;
    }

    startGeneration();
    setCurrentStep(3);

    // Process each image
    for (const image of uploadedImages) {
      try {
        console.log('🚀 Starting generation for', image.file.name);

        const response = await createJob({
          masterImage: image.file,
          formats: globalFormats,
          quality: 'balanced',
        });

        console.log('✅ Job created', response.data);

        // Add job to store
        addJob({
          jobId: response.data.jobId,
          imageId: image.id,
          status: 'processing',
          progress: 0,
          results: [],
        });

        // Poll for status
        pollJobStatus(response.data.jobId);
      } catch (error: any) {
        console.error('❌ Generation failed', error);
        alert(`Failed to generate: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 120; // 10 minutes max (5s interval)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await getJobStatus(jobId);
        const { job, progress, results } = response.data;

        console.log('📊 Job status', { jobId, status: job.status, progress });

        updateJobProgress(jobId, {
          status: job.status as any,
          progress: progress.percent,
          results: results.map((r: any) => ({
            id: r.id,
            formatName: r.format_name,
            platform: r.platform,
            width: r.width,
            height: r.height,
            resultUrl: r.result_url,
            status: r.status,
            errorMessage: r.error_message,
          })),
        });

        if (job.status === 'completed' || job.status === 'failed') {
          console.log('✅ Job finished', { jobId, status: job.status });
          checkAllJobsComplete();
          return;
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          console.error('⏱️ Job polling timeout', { jobId });
          updateJobProgress(jobId, { status: 'failed' });
          checkAllJobsComplete();
        }
      } catch (error) {
        console.error('❌ Polling error', error);
        setTimeout(poll, 5000); // Retry
      }
    };

    poll();
  };

  const checkAllJobsComplete = () => {
    const allComplete = jobs.every(job =>
      job.status === 'completed' || job.status === 'failed'
    );

    if (allComplete) {
      console.log('🎉 All jobs complete');
      completeGeneration();
    }
  };

  // Download result
  const downloadResult = (resultUrl: string, formatName: string) => {
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${formatName}.png`;
    link.click();
  };

  // Download all results as ZIP (simplified - individual downloads)
  const downloadAllResults = () => {
    jobs.forEach(job => {
      job.results.forEach(result => {
        if (result.resultUrl && result.status === 'completed') {
          setTimeout(() => {
            downloadResult(result.resultUrl!, result.formatName);
          }, 100);
        }
      });
    });
  };

  // Render steps
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderUploadStep();
      case 1:
        return renderFormatSelectionStep();
      case 2:
        return renderRecapStep();
      case 3:
        return renderResultsStep();
      default:
        return null;
    }
  };

  const renderUploadStep = () => (
    <div className="step-container">
      <h2>Upload Master Creatives</h2>
      <p className="step-description">
        Upload your master creative images. Supports JPG, PNG, WebP (max 10MB each)
      </p>

      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="upload-icon">📁</div>
        <p>Drag & drop your images here</p>
        <p className="upload-hint">or click to browse</p>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {uploadedImages.length > 0 && (
        <div className="uploaded-images">
          <div className="images-header">
            <h3>Uploaded: {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''}</h3>
            <button onClick={() => uploadedImages.forEach(img => removeImage(img.id))} className="btn-secondary">
              Remove All
            </button>
          </div>
          <div className="images-grid">
            {uploadedImages.map((image) => (
              <div key={image.id} className="image-card">
                <img src={image.preview} alt={image.file.name} />
                <div className="image-info">
                  <p className="image-name">{image.file.name}</p>
                  <p className="image-size">{(image.file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="btn-remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="step-actions">
        <button
          onClick={() => setCurrentStep(1)}
          disabled={uploadedImages.length === 0}
          className="btn-primary"
        >
          Next: Select Formats →
        </button>
      </div>
    </div>
  );

  const renderFormatSelectionStep = () => (
    <div className="step-container">
      <h2>Select Output Formats</h2>
      <p className="step-description">
        Choose the formats you want to generate for each image
      </p>

      <div className="format-packs">
        <button onClick={() => selectPack('meta')} className="pack-button">
          📱 Meta Pack (5 formats)
        </button>
        <button onClick={() => selectPack('google')} className="pack-button">
          🌐 Google Pack (11 formats)
        </button>
        <button onClick={() => selectPack('dooh')} className="pack-button">
          📺 DOOH Pack (4 formats)
        </button>
        <button onClick={() => selectPack('full')} className="pack-button">
          ⭐ Full Pack (All 22 formats)
        </button>
      </div>

      <div className="formats-grid">
        {availableFormats.map((format) => (
          <div
            key={format.key}
            className={`format-card ${globalFormats.includes(format.key) ? 'selected' : ''}`}
            onClick={() => toggleGlobalFormat(format.key)}
          >
            <div className="format-header">
              <input
                type="checkbox"
                checked={globalFormats.includes(format.key)}
                onChange={() => {}}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="format-platform">{format.platform}</span>
            </div>
            <h4>{format.description}</h4>
            <p className="format-dimensions">{format.width} × {format.height}</p>
            <p className="format-ratio">{format.ratio}</p>
            <p className="format-usage">{format.usage}</p>
          </div>
        ))}
      </div>

      <div className="selection-summary">
        <p>Selected: <strong>{globalFormats.length}</strong> formats</p>
        <p>Total images to generate: <strong>{uploadedImages.length × globalFormats.length}</strong></p>
      </div>

      <div className="step-actions">
        <button onClick={() => setCurrentStep(0)} className="btn-secondary">
          ← Back
        </button>
        <button
          onClick={() => setCurrentStep(2)}
          disabled={globalFormats.length === 0}
          className="btn-primary"
        >
          Next: Review →
        </button>
      </div>
    </div>
  );

  const renderRecapStep = () => {
    const totalImages = uploadedImages.length * globalFormats.length;
    const estimatedCost = totalImages * 0.04; // $0.04 per image
    const estimatedTime = Math.ceil(totalImages * 3 / 60); // ~3s per image

    return (
      <div className="step-container">
        <h2>Review & Generate</h2>
        <p className="step-description">
          Review your generation settings before starting
        </p>

        <div className="recap-summary">
          <div className="recap-item">
            <span className="recap-label">Master Images:</span>
            <span className="recap-value">{uploadedImages.length}</span>
          </div>
          <div className="recap-item">
            <span className="recap-label">Formats per Image:</span>
            <span className="recap-value">{globalFormats.length}</span>
          </div>
          <div className="recap-item">
            <span className="recap-label">Total Images:</span>
            <span className="recap-value">{totalImages}</span>
          </div>
          <div className="recap-item">
            <span className="recap-label">Estimated Cost:</span>
            <span className="recap-value">${estimatedCost.toFixed(2)}</span>
          </div>
          <div className="recap-item">
            <span className="recap-label">Estimated Time:</span>
            <span className="recap-value">~{estimatedTime} min</span>
          </div>
        </div>

        <div className="recap-details">
          <h3>Images to Process</h3>
          <ul>
            {uploadedImages.map((image) => (
              <li key={image.id}>
                {image.file.name} → {globalFormats.length} formats
              </li>
            ))}
          </ul>
        </div>

        <div className="step-actions">
          <button onClick={() => setCurrentStep(1)} className="btn-secondary">
            ← Back
          </button>
          <button onClick={handleStartGeneration} className="btn-primary btn-generate">
            🚀 Start Generation
          </button>
        </div>
      </div>
    );
  };

  const renderResultsStep = () => {
    const allComplete = jobs.every(j => j.status === 'completed' || j.status === 'failed');
    const totalCompleted = jobs.reduce((sum, j) => sum + j.results.filter(r => r.status === 'completed').length, 0);
    const totalFailed = jobs.reduce((sum, j) => sum + j.results.filter(r => r.status === 'failed').length, 0);

    return (
      <div className="step-container">
        <h2>{allComplete ? 'Results' : 'Generation in Progress...'}</h2>

        {jobs.map((job) => {
          const image = uploadedImages.find(img => img.id === job.imageId);
          if (!image) return null;

          return (
            <div key={job.jobId} className="job-card">
              <div className="job-header">
                <img src={image.preview} alt={image.file.name} className="job-thumbnail" />
                <div className="job-info">
                  <h3>{image.file.name}</h3>
                  <div className="job-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <span className="progress-text">{job.progress}%</span>
                  </div>
                  <p className="job-status">
                    Status: <strong>{job.status}</strong> |
                    Completed: {job.results.filter(r => r.status === 'completed').length}/{job.results.length}
                  </p>
                </div>
              </div>

              <div className="results-grid">
                {job.results.map((result) => (
                  <div key={result.id} className={`result-card ${result.status}`}>
                    {result.resultUrl && result.status === 'completed' ? (
                      <>
                        <img src={result.resultUrl} alt={result.formatName} />
                        <div className="result-info">
                          <p className="result-name">{result.formatName}</p>
                          <p className="result-dimensions">{result.width}×{result.height}</p>
                          <button
                            onClick={() => downloadResult(result.resultUrl!, result.formatName)}
                            className="btn-download"
                          >
                            📥 Download
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="result-placeholder">
                        <p>{result.formatName}</p>
                        <p className="result-status">{result.status}</p>
                        {result.errorMessage && (
                          <p className="result-error">{result.errorMessage}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {allComplete && (
          <div className="results-summary">
            <p>✅ Completed: {totalCompleted} | ❌ Failed: {totalFailed}</p>
            <div className="step-actions">
              <button onClick={downloadAllResults} className="btn-primary">
                📦 Download All
              </button>
              <button onClick={() => { reset(); setCurrentStep(0); }} className="btn-secondary">
                🔄 Start New
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="smart-resizer-page">
      <div className="page-header">
        <h1>Smart Resizer</h1>
        <p>Transform your master creative into 20+ advertising formats with AI</p>
      </div>

      <div className="stepper">
        <div className={`step ${currentStep >= 0 ? 'active' : ''} ${currentStep > 0 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Upload</div>
        </div>
        <div className="step-line" />
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Formats</div>
        </div>
        <div className="step-line" />
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Review</div>
        </div>
        <div className="step-line" />
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Results</div>
        </div>
      </div>

      <div className="page-content">
        {renderStep()}
      </div>
    </div>
  );
};

export default SmartResizer;
