import { useState, useEffect, MouseEvent } from 'react';
import { workflowService } from '@/services/workflows';
import JSZip from 'jszip';
import logger from '@/utils/logger';
import { OptimizedImage } from '../common/OptimizedImage';
import './BatchResultsView.css';

/**
 * Type definitions for BatchResultsView
 */

// Batch result status
type BatchResultStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Individual batch result
interface BatchResult {
  id: string;
  batch_index: number;
  status: BatchResultStatus;
  prompt_text: string;
  result_url?: string;
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
}

// Batch statistics
interface BatchStats {
  total_prompts: number;
  successful: number;
  failed: number;
  total_cost?: string;
}

// Batch results data structure
interface BatchResultsData {
  results: BatchResult[];
  stats: BatchStats;
}

// Filter options
type FilterType = 'all' | 'success' | 'failed';

// Sort options
type SortType = 'index' | 'time' | 'status';

// Download progress
interface DownloadProgress {
  current: number;
  total: number;
}

// Component props
interface BatchResultsViewProps {
  executionId: string;
}

/**
 * BatchResultsView Component - "Industrial Command Center"
 * Dark Premium design with Bleu Pétrole accent
 * Displays batch results for Image Factory workflow
 */
export function BatchResultsView({ executionId }: BatchResultsViewProps) {
  const [data, setData] = useState<BatchResultsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('index');
  const [gridColumns, setGridColumns] = useState<number>(2);
  const [copyFeedback, setCopyFeedback] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({ current: 0, total: 0 });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BatchResult | null>(null);
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadResults() {
      try {
        logger.debug('🔍 BatchResultsView: Loading results for execution:', {
          executionId,
          executionIdType: typeof executionId
        });

        const response = await workflowService.getBatchResults(executionId);

        logger.debug('📦 BatchResultsView: Raw response:', {
          status: response?.status,
          hasData: !!response?.data,
          dataKeys: Object.keys(response?.data || {}),
          dataStructure: response?.data
        });

        const resultsData = response?.data?.data || response?.data;

        if (!resultsData || !resultsData.results) {
          logger.error('❌ BatchResultsView: Invalid response format:', {
            hasResultsData: !!resultsData,
            resultsDataKeys: Object.keys(resultsData || {}),
            hasResults: !!resultsData?.results
          });
          setError('Invalid response format - no results found');
          return;
        }

        logger.debug('✅ BatchResultsView: Results loaded successfully:', {
          resultsCount: resultsData.results.length,
          stats: resultsData.stats
        });

        setData(resultsData);
      } catch (err) {
        const error = err as any;
        logger.error('❌ BatchResultsView: Error loading results:', {
          error,
          message: error?.message,
          response: error?.response,
          status: error?.response?.status,
          data: error?.response?.data,
          executionId
        });
        setError(error?.response?.data?.message || error?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [executionId]);

  const handleCopyUrl = async (url: string, index: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(index);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      logger.error('BatchResultsView: Failed to copy URL:', err);
    }
  };

  const handleDownload = async (url: string, filename: string): Promise<void> => {
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
      logger.error('BatchResultsView: Failed to download:', err);
    }
  };

  const handleDownloadAll = async (): Promise<void> => {
    if (!data) return;

    const successfulResults = data.results.filter(r => r.status === 'completed' && r.result_url);
    if (successfulResults.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();

      for (let i = 0; i < successfulResults.length; i++) {
        const result = successfulResults[i];
        try {
          const response = await fetch(result.result_url!);
          const blob = await response.blob();
          zip.file(`image_${result.batch_index}.png`, blob);
        } catch (err) {
          logger.error(`Failed to download image ${i + 1}:`, err);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `batch_results_${executionId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(zipUrl);
    } catch (err) {
      logger.error('BatchResultsView: Failed to create ZIP:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleSelection = (resultId: string): void => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const selectAll = (): void => {
    if (!data) return;

    const completedIds = data.results
      .filter(r => r.status === 'completed' && r.result_url)
      .map(r => r.id);
    setSelectedIds(new Set(completedIds));
  };

  const deselectAll = (): void => {
    setSelectedIds(new Set());
  };

  const handleDownloadSelectedIndividual = async (): Promise<void> => {
    if (!data) return;

    const selectedResults = data.results.filter(r => selectedIds.has(r.id) && r.result_url);
    if (selectedResults.length === 0) return;

    logger.debug('🔽 BatchResultsView.handleDownloadSelectedIndividual: Starting downloads', {
      count: selectedResults.length
    });

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: selectedResults.length });

    let successCount = 0;
    let failCount = 0;

    // Download each image with delay to avoid browser blocking
    for (let i = 0; i < selectedResults.length; i++) {
      const result = selectedResults[i];

      try {
        logger.debug('🔽 BatchResultsView: Downloading image', {
          index: i + 1,
          total: selectedResults.length,
          batch_index: result.batch_index
        });

        const response = await fetch(result.result_url!);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `image_${result.batch_index}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        successCount++;

        logger.debug('✅ BatchResultsView: Image downloaded', {
          batch_index: result.batch_index,
          progress: `${i + 1}/${selectedResults.length}`
        });

      } catch (err) {
        failCount++;
        logger.error('❌ BatchResultsView: Failed to download image', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          batch_index: result.batch_index,
          progress: `${i + 1}/${selectedResults.length}`
        });
      }

      // Update progress
      setDownloadProgress({ current: i + 1, total: selectedResults.length });

      // Add delay between downloads to avoid browser blocking (except for the last one)
      if (i < selectedResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    logger.debug('✅ BatchResultsView.handleDownloadSelectedIndividual: All downloads completed', {
      success: successCount,
      failed: failCount,
      total: selectedResults.length
    });

    // Reset state after a short delay to show completion
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }, 1000);
  };

  const handleDownloadSelected = async (): Promise<void> => {
    if (!data) return;

    const selectedResults = data.results.filter(r => selectedIds.has(r.id) && r.result_url);
    if (selectedResults.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();

      for (const result of selectedResults) {
        try {
          const response = await fetch(result.result_url!);
          const blob = await response.blob();
          zip.file(`image_${result.batch_index}.png`, blob);
        } catch (err) {
          logger.error(`Failed to download image ${result.batch_index}:`, err);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `batch_selection_${executionId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(zipUrl);
    } catch (err) {
      logger.error('BatchResultsView: Failed to create selection ZIP:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="br-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="br-error">
        <h3 className="br-error-title">Failed to Load Results</h3>
        <p className="br-error-text">{error}</p>
        <div className="br-error-details">
          <p>Execution ID: {executionId}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.results || data.results.length === 0) {
    return (
      <div className="br-empty">
        <div className="br-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <p className="br-empty-title">No results available</p>
        <p className="br-empty-text">Results will appear here once processing is complete.</p>
      </div>
    );
  }

  const { results, stats } = data;

  // Apply filtering
  let filteredResults = results;
  if (filter === 'success') {
    filteredResults = results.filter(r => r.status === 'completed');
  } else if (filter === 'failed') {
    filteredResults = results.filter(r => r.status === 'failed');
  }

  // Apply sorting
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'index') return a.batch_index - b.batch_index;
    if (sortBy === 'time') return (a.processing_time_ms || 0) - (b.processing_time_ms || 0);
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  const successCount = results.filter(r => r.status === 'completed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <div className="br-container">
      {/* Quick Look Preview Overlay */}
      {previewImage && (
        <div className="br-preview-overlay" onClick={() => {
          setPreviewImage(null);
          setPreviewData(null);
        }}>
          <div className="br-preview-content" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              className="br-preview-close"
              onClick={() => {
                setPreviewImage(null);
                setPreviewData(null);
              }}
              aria-label="Close preview"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Image Container */}
            <div className="br-preview-image-wrapper">
              <img src={previewImage} alt="Preview" />
            </div>

            {/* Info Footer */}
            {previewData && (
              <div className="br-preview-info">
                <div className="br-preview-info-row">
                  <span className="br-preview-index">#{previewData.batch_index}</span>
                  <span className="br-preview-status">{previewData.status}</span>
                </div>
                {previewData.prompt_text && (
                  <div className="br-preview-prompt">{previewData.prompt_text}</div>
                )}
                <div className="br-preview-meta">
                  {previewData.processing_time_ms && (
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {(previewData.processing_time_ms / 1000).toFixed(2)}s
                    </span>
                  )}
                  {previewData.created_at && (
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {new Date(previewData.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Panel */}
      {stats && (
        <div className="br-stats-panel">
          <div className="br-stats-header">
            <h3 className="br-stats-title">Production Statistics</h3>
            <span className="br-batch-id">BATCH #{executionId.slice(0, 8).toUpperCase()}</span>
          </div>

          <div className="br-stats-grid">
            {/* Total */}
            <div className="br-stat-card">
              <div className="br-stat-label">Total Output</div>
              <div className="br-stat-value">{stats.total_prompts || 0}</div>
              <div className="br-stat-hint">units produced</div>
            </div>

            {/* Success */}
            <div className="br-stat-card br-stat-card--success">
              <div className="br-stat-label">Completed</div>
              <div className="br-stat-value">{stats.successful || 0}</div>
              <div className="br-stat-hint">passed</div>
            </div>

            {/* Failed */}
            {stats.failed > 0 && (
              <div className="br-stat-card br-stat-card--error">
                <div className="br-stat-label">Failed</div>
                <div className="br-stat-value">{stats.failed || 0}</div>
                <div className="br-stat-hint">rejected</div>
              </div>
            )}

            {/* Production Cost - HIDDEN for now
            <div className="br-stat-card br-stat-card--accent">
              <div className="br-stat-label">Production Cost</div>
              <div className="br-stat-value">${stats.total_cost || '0.00'}</div>
              <div className="br-stat-hint">total batch cost</div>
            </div>
            */}
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="br-controls">
        {/* Single Row: Filter + Grid + Counter + Download */}
        <div className="br-controls-row">
          <div className="br-controls-group">
            <span className="br-controls-label">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`br-filter-btn ${filter === 'all' ? 'active' : ''}`}
            >
              ALL ({results.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`br-filter-btn ${filter === 'success' ? 'active active--success' : ''}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {successCount}
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`br-filter-btn ${filter === 'failed' ? 'active active--error' : ''}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {failedCount}
            </button>
          </div>

          <div className="br-controls-group">
            <span className="br-controls-label">Grid:</span>
            {[1, 2, 3, 4, 5].map(cols => (
              <button
                key={cols}
                onClick={() => setGridColumns(cols)}
                className={`br-grid-btn ${gridColumns === cols ? 'active' : ''}`}
              >
                {cols}
              </button>
            ))}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="br-select"
            >
              <option value="index">INDEX</option>
              <option value="time">TIME</option>
              <option value="status">STATUS</option>
            </select>
          </div>

          <div className="br-controls-group">
            <div className="br-results-counter">
              {sortedResults.length} / {results.length} UNITS
            </div>
            <button
              onClick={handleDownloadAll}
              disabled={successCount === 0 || isDownloading}
              className="br-download-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {isDownloading ? 'CREATING...' : 'DOWNLOAD ALL'}
            </button>
          </div>
        </div>

        {/* Selection Bar */}
        <div className="br-selection-bar">
          <div className="br-controls-group">
            <button onClick={selectAll} className="br-select-btn">
              Select All
            </button>
            <button onClick={deselectAll} className="br-select-btn">
              Deselect All
            </button>
          </div>

          {selectedIds.size > 0 && (
            <div className="br-controls-group">
              <span className="br-selection-count">{selectedIds.size} selected</span>

              {/* Download individuel */}
              <button
                onClick={handleDownloadSelectedIndividual}
                disabled={isDownloading}
                className="br-download-btn"
                title="Download selected images individually"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isDownloading && downloadProgress.total > 0
                  ? `DOWNLOADING ${downloadProgress.current}/${downloadProgress.total}...`
                  : 'DOWNLOAD'}
              </button>

              {/* Download ZIP */}
              <button
                onClick={handleDownloadSelected}
                disabled={isDownloading}
                className="br-download-btn br-download-btn--selection"
                title="Download selected images as ZIP archive"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isDownloading ? 'CREATING...' : 'DOWNLOAD ZIP'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className={`br-grid br-grid--${gridColumns}`}>
        {sortedResults.map((result, index) => (
          <div key={result.id || index} className={`br-card ${selectedIds.has(result.id) ? 'br-card--selected' : ''}`}>
            {/* Checkbox - uniquement pour les images completed */}
            {result.status === 'completed' && result.result_url && (
              <label className="br-card-checkbox" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(result.id)}
                  onChange={() => toggleSelection(result.id)}
                />
              </label>
            )}

            {/* Index Badge */}
            <div className="br-card-index">#{result.batch_index}</div>

            {/* Status Badge */}
            <div className={`br-card-status br-card-status--${result.status}`}>
              {result.status}
            </div>

            {/* Image or Placeholder */}
            {result.status === 'completed' && result.result_url ? (
              <div
                className="br-card-image"
                onMouseEnter={() => setHoveredImageIndex(result.batch_index)}
                onMouseLeave={() => setHoveredImageIndex(null)}
                onClick={() => {
                  setPreviewImage(result.result_url!);
                  setPreviewData(result);
                }}
              >
                <OptimizedImage
                  src={result.result_url}
                  alt={`Unit ${result.batch_index}`}
                  thumbnailSize={400}
                  aspectRatio="auto"
                />
                {/* Eye Icon on Hover */}
                {hoveredImageIndex === result.batch_index && (
                  <div className="br-card-eye-overlay">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyUrl(result.result_url!, result.batch_index);
                  }}
                  className={`br-copy-btn ${copyFeedback === result.batch_index ? 'copied' : ''}`}
                  title="Copy URL"
                >
                  {copyFeedback === result.batch_index ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <div className="br-card-placeholder">
                <div className="br-card-placeholder-content">
                  {result.status === 'failed' ? (
                    <>
                      <svg className="br-card-placeholder-icon br-card-placeholder-icon--error" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <div className="br-card-placeholder-text br-card-placeholder-text--error">
                        Failed
                      </div>
                    </>
                  ) : result.status === 'processing' ? (
                    <>
                      <div className="spinner" style={{ marginBottom: '12px' }}></div>
                      <div className="br-card-placeholder-text">Processing...</div>
                    </>
                  ) : (
                    <div className="br-card-placeholder-text">Pending</div>
                  )}
                </div>
              </div>
            )}

            {/* Details Panel */}
            <div className="br-card-details">
              <div className="br-card-prompt">{result.prompt_text}</div>

              {result.processing_time_ms && result.status === 'completed' && (
                <div className="br-card-time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {(result.processing_time_ms / 1000).toFixed(2)}s
                </div>
              )}

              {result.error_message && (
                <div className="br-card-error">
                  <div className="br-card-error-label">Error:</div>
                  <div className="br-card-error-text">{result.error_message}</div>
                </div>
              )}

              {result.result_url && (
                <div className="br-card-actions">
                  <a
                    href={result.result_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="br-view-btn"
                  >
                    View Full Size
                  </a>
                  <button
                    onClick={() => handleDownload(result.result_url!, `image_${result.batch_index}.png`)}
                    className="br-dl-btn"
                    title="Download"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State after Filtering */}
      {sortedResults.length === 0 && (
        <div className="br-empty">
          <svg className="br-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="br-empty-title">No results match your filter</p>
          <p className="br-empty-text">Try changing your filter options</p>
        </div>
      )}
    </div>
  );
}
