/**
 * Room Redesigner Results Component
 *
 * Premium editorial presentation for interior design results
 * Dark theme with architectural portfolio aesthetic
 */

import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { workflowService } from '@/services/workflows';
import logger from '@/utils/logger';
import './RoomRedesignerResults.css';

/** Backend batch result structure */
interface BatchResult {
  execution_id: string;
  batch_index: number;
  prompt_text: string;
  status: 'completed' | 'failed' | 'pending' | 'processing';
  result_url: string | null;
  processing_time_ms: number;
  completed_at: string;
  error_message: string | null;
  width: number | null;
  height: number | null;
}

interface RoomResult extends BatchResult {
  success: boolean;
  redesigned_image_url?: string;
  original_image_url?: string;
  original_image_name?: string;
}

interface WorkflowOutputData {
  successful: number;
  failed: number;
  total: number;
  design_style: string;
  budget_level?: string;
  season?: string;
}

interface BatchResultsResponse {
  execution_id: string;
  results: BatchResult[];
  stats: {
    total_prompts: number;
    successful: number;
    failed: number;
    pending: number;
    processing: number;
    total_cost: number;
  };
  total_results: number;
}

interface RoomRedesignerResultsProps {
  executionId: string;
}

/** Generate filename for a single room image */
function generateRoomFileName(index: number, style?: string, season?: string): string {
  const styleSlug = style?.toLowerCase().replace(/\s+/g, '-') || 'redesigned';
  const paddedIndex = String(index + 1).padStart(2, '0');
  return season
    ? `room-${styleSlug}-${season.toLowerCase()}-${paddedIndex}.png`
    : `room-${styleSlug}-${paddedIndex}.png`;
}

/** Generate ZIP filename */
function generateZipFileName(style?: string, season?: string): string {
  const styleSlug = style?.toLowerCase().replace(/\s+/g, '-') || 'redesign';
  const timestamp = new Date().toISOString().slice(0, 10);
  return season
    ? `room-redesign-${styleSlug}-${season.toLowerCase()}-${timestamp}.zip`
    : `room-redesign-${styleSlug}-${timestamp}.zip`;
}

/** Capitalize first letter */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function RoomRedesignerResults({ executionId }: RoomRedesignerResultsProps): JSX.Element {
  const [outputData, setOutputData] = useState<WorkflowOutputData | null>(null);
  const [results, setResults] = useState<RoomResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<RoomResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showRedesigned, setShowRedesigned] = useState(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const successfulResults = results.filter(r => r.success);

  // Navigation helpers
  function scrollThumbnailIntoView(idx: number): void {
    setTimeout(() => {
      thumbnailRefs.current[idx]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }, 100);
  }

  function selectResult(result: RoomResult, thumbnailIdx: number): void {
    const actualIndex = results.indexOf(result);
    setSelectedResult(result);
    setSelectedIndex(actualIndex);
    setShowRedesigned(true);
    scrollThumbnailIntoView(thumbnailIdx);
  }

  function navigateToPrevious(): void {
    if (successfulResults.length <= 1) return;
    const currentIdx = successfulResults.findIndex(r => r === selectedResult);
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : successfulResults.length - 1;
    selectResult(successfulResults[prevIdx], prevIdx);
  }

  function navigateToNext(): void {
    if (successfulResults.length <= 1) return;
    const currentIdx = successfulResults.findIndex(r => r === selectedResult);
    const nextIdx = currentIdx < successfulResults.length - 1 ? currentIdx + 1 : 0;
    selectResult(successfulResults[nextIdx], nextIdx);
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (successfulResults.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToNext();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedResult, successfulResults]);

  // Load results
  useEffect(() => {
    async function loadResults(): Promise<void> {
      try {
        logger.debug('RoomRedesignerResults: Loading results', { executionId });

        const executionResponse = await workflowService.getExecution(executionId);
        const executionOutputData = executionResponse?.data?.output_data;
        const inputData = executionResponse?.data?.input_data;

        const batchResponse = await workflowService.getBatchResults(executionId);
        const batchData: BatchResultsResponse = batchResponse?.data;

        if (!batchData?.results || batchData.results.length === 0) {
          setError('No results found');
          return;
        }

        const transformedResults: RoomResult[] = batchData.results.map((batchResult, index) => {
          const success = batchResult.status === 'completed' && !!batchResult.result_url;
          const originalImageName = batchResult.prompt_text.split(' → ')[0] || `Room ${index + 1}`;

          let originalImageUrl: string | undefined;
          if (inputData?.room_images && Array.isArray(inputData.room_images)) {
            const originalImage = inputData.room_images[index];
            if (originalImage?.image_base64) {
              const mimeType = originalImage.image_mime || 'image/png';
              originalImageUrl = `data:${mimeType};base64,${originalImage.image_base64}`;
            }
          }

          return {
            ...batchResult,
            success,
            redesigned_image_url: batchResult.result_url || undefined,
            original_image_url: originalImageUrl,
            original_image_name: originalImageName
          };
        });

        setOutputData(executionOutputData);
        setResults(transformedResults);

        const firstSuccessIndex = transformedResults.findIndex(r => r.success);
        if (firstSuccessIndex >= 0) {
          setSelectedResult(transformedResults[firstSuccessIndex]);
          setSelectedIndex(firstSuccessIndex);
        }
      } catch (err: unknown) {
        const e = err as { message?: string; response?: { data?: { message?: string } } };
        logger.error('RoomRedesignerResults: Failed to load', { error: err, executionId });
        setError(e?.response?.data?.message || e?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [executionId]);

  // Download single image
  async function handleDownload(url: string, filename: string): Promise<void> {
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
      logger.error('Download failed', { error: err });
    }
  }

  // Download all as ZIP
  async function handleDownloadAll(): Promise<void> {
    if (successfulResults.length === 0) return;
    setIsDownloading(true);

    try {
      const zip = new JSZip();

      for (let i = 0; i < successfulResults.length; i++) {
        const result = successfulResults[i];
        if (!result.redesigned_image_url) continue;
        try {
          const response = await fetch(result.redesigned_image_url);
          const blob = await response.blob();
          zip.file(generateRoomFileName(i, outputData?.design_style, outputData?.season), blob);
        } catch (err) {
          logger.error(`Failed to add image ${i + 1} to ZIP`, { error: err });
        }
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const zipUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = generateZipFileName(outputData?.design_style, outputData?.season);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(zipUrl);
    } catch (err) {
      logger.error('Failed to create ZIP', { error: err });
    } finally {
      setIsDownloading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="room-results-loading">
        <div className="room-results-spinner"></div>
        <p>Loading your redesigned spaces...</p>
      </div>
    );
  }

  // Error state
  if (error || !outputData) {
    return (
      <div className="room-results-error">
        <ErrorIcon />
        <p>{error || 'Failed to load results'}</p>
      </div>
    );
  }

  const failedCount = outputData.failed || 0;

  return (
    <div className="room-results">
      {/* Header */}
      <div className="room-results-header">
        <div className="room-results-header-content">
          <h2 className="room-results-title">Your Redesigned Spaces</h2>
          <p className="room-results-subtitle">
            {successfulResults.length} {successfulResults.length === 1 ? 'room' : 'rooms'} transformed
            {failedCount > 0 && ` - ${failedCount} failed`}
          </p>
        </div>

        <div className="room-results-actions">
          {selectedResult?.redesigned_image_url && (
            <>
              <button
                className="room-action-btn room-action-btn--secondary"
                onClick={() => handleDownload(
                  selectedResult.redesigned_image_url!,
                  `redesigned-${selectedResult.original_image_name || `room-${selectedIndex + 1}`}.png`
                )}
              >
                <DownloadIcon />
                Download
              </button>
              <button
                className="room-action-btn room-action-btn--primary"
                onClick={handleDownloadAll}
                disabled={isDownloading || successfulResults.length === 0}
              >
                <DownloadIcon />
                {isDownloading ? 'Downloading...' : `Download All (${successfulResults.length})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Design Specs */}
      <div className="room-specs">
        <div className="room-specs-grid">
          {outputData.design_style && (
            <SpecCard label="Style" value={outputData.design_style} />
          )}
          {outputData.season && (
            <SpecCard label="Season" value={capitalize(outputData.season)} />
          )}
          {outputData.budget_level && (
            <SpecCard label="Budget" value={capitalize(outputData.budget_level)} />
          )}
        </div>
      </div>

      {/* Main Comparison View */}
      {selectedResult?.redesigned_image_url && (
        <div className="room-comparison-showcase">
          <div className="room-comparison-container">
            <div className="room-comparison-image-wrapper">
              {showRedesigned ? (
                <>
                  <img
                    src={selectedResult.redesigned_image_url}
                    alt={`Redesigned room in ${outputData.design_style} style`}
                    className="room-comparison-image"
                  />
                  <div className="room-comparison-label">Redesigned</div>
                </>
              ) : (
                <>
                  {selectedResult.original_image_url ? (
                    <img
                      src={selectedResult.original_image_url}
                      alt={`Original ${selectedResult.original_image_name}`}
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

              {/* Navigation arrows */}
              {successfulResults.length > 1 && (
                <>
                  <NavArrow direction="left" onClick={navigateToPrevious} />
                  <NavArrow direction="right" onClick={navigateToNext} />
                </>
              )}
            </div>

            <button
              className="room-comparison-toggle"
              onClick={() => setShowRedesigned(!showRedesigned)}
            >
              {showRedesigned ? 'View Original' : 'View Redesigned'}
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail Gallery */}
      {successfulResults.length > 1 && (
        <div className="room-gallery">
          <div className="room-gallery-label">All Redesigns ({successfulResults.length})</div>
          <div className="room-gallery-grid">
            {successfulResults.map((result, idx) => {
              const actualIndex = results.indexOf(result);
              return (
                <button
                  key={`room-${actualIndex}-${result.batch_index}`}
                  ref={el => { thumbnailRefs.current[idx] = el; }}
                  className={`room-gallery-item ${selectedIndex === actualIndex ? 'room-gallery-item--active' : ''}`}
                  onClick={() => selectResult(result, idx)}
                >
                  <div className="room-gallery-thumbnail">
                    {result.redesigned_image_url && (
                      <img src={result.redesigned_image_url} alt={`${result.original_image_name || `Room ${idx + 1}`} redesigned`} />
                    )}
                  </div>
                  <div className="room-gallery-info">
                    <div className="room-gallery-title">{result.original_image_name || `Room ${idx + 1}`}</div>
                    <div className="room-gallery-style">{outputData.design_style}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Failed Warning */}
      {failedCount > 0 && (
        <div className="room-results-warning">
          <WarningIcon />
          <span>{failedCount} {failedCount === 1 ? 'image' : 'images'} failed to process. Please try again with different images.</span>
        </div>
      )}
    </div>
  );
}

/** Spec card component */
function SpecCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="room-spec-card">
      <span className="room-spec-label">{label}</span>
      <span className="room-spec-value">{value}</span>
    </div>
  );
}

/** Navigation arrow component */
function NavArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }): JSX.Element {
  const path = direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6';
  return (
    <button className={`room-nav-arrow room-nav-arrow--${direction}`} onClick={onClick} aria-label={`${direction === 'left' ? 'Previous' : 'Next'} image`}>
      <svg viewBox="0 0 24 24" fill="none">
        <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Download icon */
function DownloadIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5m0 0l5-5m-5 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Error icon */
function ErrorIcon(): JSX.Element {
  return (
    <svg className="room-results-error-icon" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Warning icon */
function WarningIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
