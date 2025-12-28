/**
 * Room Redesigner Results Component
 *
 * Premium editorial presentation for interior design results
 * Dark theme with architectural portfolio aesthetic
 */

import { useState, useEffect, useRef } from 'react';
import { workflowService } from '@/services/workflows';
import logger from '@/utils/logger';
import './RoomRedesignerResults.css';

// Backend returns this structure from workflow-worker.ts lines 823-859
interface RoomResult {
  success: boolean;
  image_name: string;
  original_image?: string; // Same as image_name
  redesigned_image_url?: string; // Present if success: true
  original_image_url?: string; // Added by frontend from input_data
  original_image_name?: string; // Added by frontend from input_data
  error?: string; // Present if success: false
  design_style?: string;
  seasonal_preference?: string;
  budget_level?: string;
  processing_time?: number;
  prompt_used?: string;
}

interface WorkflowOutputData {
  images: RoomResult[];
  design_style: string;
  seasonal_preference?: string;
  budget_level?: string;
  summary: {
    successCount: number;
    failCount: number;
    totalImages: number;
  };
  color_palette?: string;
  furniture_style?: string;
  room_type?: string;
}

interface RoomRedesignerResultsProps {
  executionId: string;
}

export function RoomRedesignerResults({ executionId }: RoomRedesignerResultsProps) {
  const [data, setData] = useState<WorkflowOutputData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<RoomResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showRedesigned, setShowRedesigned] = useState(true); // true = redesigned, false = original

  useEffect(() => {
    async function loadResults() {
      try {
        logger.debug('🔍 RoomRedesignerResults: Loading results', { executionId });

        // Room Redesigner stores results in workflow_executions.output_data, not batch_results
        const response = await workflowService.getExecution(executionId);
        const outputData = response?.data?.output_data;
        const inputData = response?.data?.input_data;

        if (!outputData?.images || outputData.images.length === 0) {
          setError('No results found');
          return;
        }

        logger.debug('✅ RoomRedesignerResults: Results loaded', {
          count: outputData.images.length,
          summary: outputData.summary,
          design_style: outputData.design_style,
          has_input_data: !!inputData
        });

        // Enrich results with original image URLs from input_data
        if (inputData?.images && Array.isArray(inputData.images)) {
          logger.debug('🔄 RoomRedesignerResults: Adding original images to results', {
            input_images_count: inputData.images.length,
            output_images_count: outputData.images.length
          });

          // Map original images to results by index
          outputData.images = outputData.images.map((result: RoomResult, index: number) => {
            const originalImage = inputData.images[index];
            if (originalImage?.image_base64) {
              // Create data URL from base64 for display
              const mimeType = originalImage.image_mime || 'image/png';
              const originalImageDataUrl = `data:${mimeType};base64,${originalImage.image_base64}`;

              return {
                ...result,
                original_image_url: originalImageDataUrl,
                original_image_name: originalImage.image_name
              };
            }
            return result;
          });

          logger.debug('✅ RoomRedesignerResults: Original images added', {
            enriched_count: outputData.images.filter((r: RoomResult & { original_image_url?: string }) => r.original_image_url).length
          });
        }

        setData(outputData);

        // Auto-select first successful result
        const firstSuccessIndex = outputData.images.findIndex((r: RoomResult) => r.success);
        if (firstSuccessIndex >= 0) {
          setSelectedResult(outputData.images[firstSuccessIndex]);
          setSelectedIndex(firstSuccessIndex);
        }
      } catch (err: any) {
        logger.error('❌ RoomRedesignerResults: Failed to load', { error: err });
        setError(err?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [executionId]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      logger.error('❌ Download failed', { error: err });
    }
  };

  if (loading) {
    return (
      <div className="room-results-loading">
        <div className="room-results-spinner"></div>
        <p>Loading your redesigned spaces...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="room-results-error">
        <svg className="room-results-error-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p>{error || 'Failed to load results'}</p>
      </div>
    );
  }

  const successfulResults = data.images.filter(r => r.success);
  const failedCount = data.summary.failCount;

  return (
    <div className="room-results">
      {/* Stats Header */}
      <div className="room-results-header">
        <div className="room-results-header-content">
          <h2 className="room-results-title">Your Redesigned Spaces</h2>
          <p className="room-results-subtitle">
            {successfulResults.length} {successfulResults.length === 1 ? 'room' : 'rooms'} transformed
            {failedCount > 0 && ` · ${failedCount} failed`}
          </p>
        </div>

        <div className="room-results-actions">
          {selectedResult && selectedResult.redesigned_image_url && (
            <>
              <button
                className="room-action-btn room-action-btn--secondary"
                onClick={() => handleDownload(
                  selectedResult.redesigned_image_url!,
                  `redesigned-${selectedResult.image_name || `room-${selectedIndex + 1}`}.png`
                )}
                aria-label="Download redesigned room image"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5m0 0l5-5m-5 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Comparison View */}
      {selectedResult && selectedResult.redesigned_image_url && (
        <div className="room-comparison-showcase">
          {/* Design Specifications - Moved above image */}
          <div className="room-specs">
            <div className="room-specs-grid">
              {(selectedResult.design_style || data.design_style) && (
                <div className="room-spec-card">
                  <div className="room-spec-label">Design Style</div>
                  <div className="room-spec-value">{selectedResult.design_style || data.design_style}</div>
                </div>
              )}

              {(selectedResult.seasonal_preference || data.seasonal_preference) && (
                <div className="room-spec-card">
                  <div className="room-spec-label">Seasonal Theme</div>
                  <div className="room-spec-value">
                    {selectedResult.seasonal_preference || data.seasonal_preference}
                  </div>
                </div>
              )}

              {(selectedResult.budget_level || data.budget_level) && (
                <div className="room-spec-card">
                  <div className="room-spec-label">Budget Level</div>
                  <div className="room-spec-value">
                    {(selectedResult.budget_level || data.budget_level)
                      .charAt(0).toUpperCase() +
                      (selectedResult.budget_level || data.budget_level).slice(1)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="room-comparison-container">
            <div className="room-comparison-image-wrapper">
              {showRedesigned ? (
                <>
                  <img
                    src={selectedResult.redesigned_image_url}
                    alt={`Redesigned room in ${selectedResult.design_style || data.design_style} style`}
                    className="room-comparison-image"
                  />
                  <div className="room-comparison-label">Redesigned</div>
                </>
              ) : (
                <>
                  {selectedResult.original_image_url ? (
                    <img
                      src={selectedResult.original_image_url}
                      alt={`Original ${selectedResult.original_image_name || selectedResult.image_name}`}
                      className="room-comparison-image"
                    />
                  ) : (
                    <div className="room-comparison-placeholder">
                      <p>Original image not available</p>
                    </div>
                  )}
                  <div className="room-comparison-label">Original</div>
                </>
              )}
            </div>

            {/* Bouton toggle */}
            <button
              className="room-comparison-toggle"
              onClick={() => setShowRedesigned(!showRedesigned)}
              aria-label={showRedesigned ? 'Show original image' : 'Show redesigned image'}
            >
              {showRedesigned ? 'View Original' : 'View Redesigned'}
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail Gallery */}
      {successfulResults.length > 1 && (
        <div className="room-gallery">
          <div className="room-gallery-label">All Redesigns</div>
          <div className="room-gallery-grid">
            {successfulResults.map((result, idx) => {
              const actualIndex = data.images.indexOf(result);
              return (
                <button
                  key={`room-${actualIndex}-${result.image_name}`}
                  className={`room-gallery-item ${selectedIndex === actualIndex ? 'room-gallery-item--active' : ''}`}
                  onClick={() => {
                    setSelectedResult(result);
                    setSelectedIndex(actualIndex);
                    setShowRedesigned(true);
                  }}
                  aria-label={`View ${result.image_name || `room ${idx + 1}`} redesigned in ${result.design_style || data.design_style} style`}
                >
                  <div className="room-gallery-thumbnail">
                    {result.redesigned_image_url && (
                      <img
                        src={result.redesigned_image_url}
                        alt={`${result.image_name || `Room ${idx + 1}`} redesigned`}
                      />
                    )}
                  </div>
                  <div className="room-gallery-info">
                    <div className="room-gallery-title">
                      {result.image_name || `Room ${idx + 1}`}
                    </div>
                    {(result.design_style || data.design_style) && (
                      <div className="room-gallery-style">{result.design_style || data.design_style}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Failed Results Warning */}
      {failedCount > 0 && (
        <div className="room-results-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>{failedCount} {failedCount === 1 ? 'image' : 'images'} failed to process. Please try again with different images.</span>
        </div>
      )}
    </div>
  );
}
