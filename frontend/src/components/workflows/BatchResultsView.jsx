import { useState, useEffect } from 'react';
import { workflowService } from '../../services/workflows';
import JSZip from 'jszip';
import logger from '@/utils/logger';
import './BatchResultsView.css';

/**
 * BatchResultsView Component - "Industrial Command Center"
 * Dark Premium design with Bleu Pétrole accent
 * Displays batch results for Image Factory workflow
 */
export function BatchResultsView({ executionId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('index');
  const [gridColumns, setGridColumns] = useState(2);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function loadResults() {
      try {
        logger.debug('BatchResultsView: Loading results for execution:', executionId);
        const response = await workflowService.getBatchResults(executionId);

        let resultsData = response.data?.data || response.data;

        if (!resultsData || !resultsData.results) {
          setError('Invalid response format');
          return;
        }

        setData(resultsData);
      } catch (err) {
        logger.error('BatchResultsView: Error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [executionId]);

  const handleCopyUrl = async (url, index) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(index);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      logger.error('BatchResultsView: Failed to copy URL:', err);
    }
  };

  const handleDownload = async (url, filename) => {
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

  const handleDownloadAll = async () => {
    const successfulResults = data.results.filter(r => r.status === 'completed' && r.result_url);
    if (successfulResults.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();

      for (let i = 0; i < successfulResults.length; i++) {
        const result = successfulResults[i];
        try {
          const response = await fetch(result.result_url);
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
        {/* Row 1: Filter + Counter */}
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

          <div className="br-results-counter">
            {sortedResults.length} / {results.length} UNITS
          </div>
        </div>

        {/* Row 2: Grid + Sort + Download */}
        <div className="br-controls-row">
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
              onChange={(e) => setSortBy(e.target.value)}
              className="br-select"
            >
              <option value="index">INDEX</option>
              <option value="time">TIME</option>
              <option value="status">STATUS</option>
            </select>
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

      {/* Results Grid */}
      <div className={`br-grid br-grid--${gridColumns}`}>
        {sortedResults.map((result, index) => (
          <div key={result.id || index} className="br-card">
            {/* Index Badge */}
            <div className="br-card-index">#{result.batch_index}</div>

            {/* Status Badge */}
            <div className={`br-card-status br-card-status--${result.status}`}>
              {result.status}
            </div>

            {/* Image or Placeholder */}
            {result.status === 'completed' && result.result_url ? (
              <div className="br-card-image">
                <img
                  src={result.result_url}
                  alt={`Unit ${result.batch_index}`}
                />
                <button
                  onClick={() => handleCopyUrl(result.result_url, result.batch_index)}
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
                    onClick={() => handleDownload(result.result_url, `image_${result.batch_index}.png`)}
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
