import { useState, useEffect } from 'react';
import { workflowService } from '../../services/workflows';
import JSZip from 'jszip';
import logger from '@/utils/logger';


/**
 * BatchResultsView Component
 * Displays batch results for workflows with batch processing (e.g., nano_banana)
 *
 * UX Improvements (Iteration 2):
 * - Results filtering (All/Success/Failed)
 * - Results sorting (By Index/Time/Status)
 * - Batch download actions
 * - Individual download buttons
 * - Copy URL functionality
 * - Mobile responsive stats grid
 */
export function BatchResultsView({ executionId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, success, failed
  const [sortBy, setSortBy] = useState('index'); // index, time, status
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function loadResults() {
      try {
        logger.debug('🔍 BatchResultsView: Loading results for execution:', executionId);

        const response = await workflowService.getBatchResults(executionId);

        logger.debug('📦 BatchResultsView: Raw API response:', {
          status: response.status,
          data: response.data,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
        });

        // Handle different response structures
        let resultsData = null;
        if (response.data?.data) {
          resultsData = response.data.data;
          logger.debug('✅ BatchResultsView: Using response.data.data');
        } else if (response.data) {
          resultsData = response.data;
          logger.debug('✅ BatchResultsView: Using response.data');
        }

        logger.debug('📊 BatchResultsView: Processed data:', {
          hasResultsData: !!resultsData,
          resultsDataKeys: resultsData ? Object.keys(resultsData) : [],
          hasResults: !!(resultsData?.results),
          resultsCount: resultsData?.results?.length || 0,
          hasStats: !!(resultsData?.stats),
          stats: resultsData?.stats,
        });

        if (!resultsData) {
          logger.error('❌ BatchResultsView: No data in response');
          setError('No data received from server');
          return;
        }

        if (!resultsData.results) {
          logger.error('❌ BatchResultsView: No results array in data:', resultsData);
          setError('Invalid response format: missing results');
          return;
        }

        setData(resultsData);
        logger.debug('✅ BatchResultsView: Data set successfully:', {
          totalResults: resultsData.results.length,
          stats: resultsData.stats,
        });

      } catch (err) {
        logger.error('❌ BatchResultsView: Error loading batch results:', {
          error: err,
          message: err.message,
          response: err.response,
          responseData: err.response?.data,
          status: err.response?.status,
        });

        const errorMessage = err.response?.data?.message
          || err.response?.data?.error
          || err.message
          || 'Failed to load results';

        setError(`Error: ${errorMessage}`);
      } finally {
        setLoading(false);
        logger.debug('🏁 BatchResultsView: Loading complete');
      }
    }
    loadResults();
  }, [executionId]);

  const handleCopyUrl = async (url, index) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(index);
      logger.debug('✅ BatchResultsView: URL copied to clipboard:', url);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      logger.error('❌ BatchResultsView: Failed to copy URL:', err);
      alert('Failed to copy URL to clipboard');
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      logger.debug('📥 BatchResultsView: Downloading single image:', filename);

      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // Convert to blob
      const blob = await response.blob();

      // Create download link
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(blobUrl);

      logger.debug('✅ BatchResultsView: Image downloaded successfully');
    } catch (err) {
      logger.error('❌ BatchResultsView: Failed to download image:', err);
      alert(`Failed to download image: ${err.message}`);
    }
  };

  const handleDownloadAll = async () => {
    logger.debug('📥 BatchResultsView: Download All requested');

    const successfulResults = data.results.filter(r => r.status === 'completed' && r.result_url);

    if (successfulResults.length === 0) {
      alert('No images available to download');
      return;
    }

    setIsDownloading(true);

    try {
      logger.debug(`📦 BatchResultsView: Creating ZIP with ${successfulResults.length} images...`);

      const zip = new JSZip();

      // Download all images and add to ZIP
      for (let i = 0; i < successfulResults.length; i++) {
        const result = successfulResults[i];
        logger.debug(`📥 Downloading image ${i + 1}/${successfulResults.length}...`);

        try {
          const response = await fetch(result.result_url);
          if (!response.ok) {
            logger.warn(`⚠️ Failed to fetch image ${i + 1}: ${response.statusText}`);
            continue;
          }

          const blob = await response.blob();
          const filename = `image_${result.batch_index}.png`;
          zip.file(filename, blob);

          logger.debug(`✅ Added to ZIP: ${filename}`);
        } catch (err) {
          logger.error(`❌ Failed to download image ${i + 1}:`, err);
        }
      }

      logger.debug('🗜️ Generating ZIP file...');

      // Generate ZIP
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Create download link
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `batch_results_${executionId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(zipUrl);

      logger.debug('✅ BatchResultsView: ZIP downloaded successfully');
    } catch (err) {
      logger.error('❌ BatchResultsView: Failed to create ZIP:', err);
      alert(`Failed to create ZIP file: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRegenerateFailures = () => {
    logger.debug('🔄 BatchResultsView: Regenerate Failures requested');
    alert('Regenerate failures feature coming soon! This will allow you to retry only failed prompts.');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    logger.error('🔴 BatchResultsView: Rendering error state:', error);
    return (
      <div className="bg-error-light border border-error-main rounded-lg p-6">
        <h3 className="font-bold text-error-dark mb-2">Failed to Load Results</h3>
        <p className="text-error-dark text-sm">{error}</p>
        <div className="mt-4 text-xs text-neutral-600">
          <p>Execution ID: {executionId}</p>
          <p>Check browser console for detailed error information.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    logger.warn('⚠️ BatchResultsView: No data available');
    return (
      <div className="text-center py-12 text-neutral-500">
        <div className="text-5xl mb-3">📭</div>
        <p className="font-medium mb-2">No data available</p>
        <p className="text-sm">The execution may not have batch results.</p>
      </div>
    );
  }

  if (!data.results || data.results.length === 0) {
    logger.warn('⚠️ BatchResultsView: No results in data:', data);
    return (
      <div className="text-center py-12 text-neutral-500">
        <div className="text-5xl mb-3">📊</div>
        <p className="font-medium mb-2">No batch results available</p>
        <p className="text-sm">Results will appear here once processing is complete.</p>
      </div>
    );
  }

  logger.debug('✅ BatchResultsView: Rendering results grid:', {
    resultsCount: data.results.length,
    stats: data.stats,
  });

  let { results, stats } = data;

  // Apply filtering
  let filteredResults = results;
  if (filter === 'success') {
    filteredResults = results.filter(r => r.status === 'completed');
  } else if (filter === 'failed') {
    filteredResults = results.filter(r => r.status === 'failed');
  }

  // Apply sorting
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'index') {
      return a.batch_index - b.batch_index;
    } else if (sortBy === 'time') {
      return (a.processing_time_ms || 0) - (b.processing_time_ms || 0);
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  logger.debug('📊 BatchResultsView: Rendering with:', {
    totalResults: results.length,
    filteredResults: sortedResults.length,
    filter,
    sortBy,
    stats,
  });

  const successCount = results.filter(r => r.status === 'completed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <div className="space-y-lg">
      {/* Stats Summary - Mobile Responsive */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="text-sm text-neutral-500 mb-1">Total</div>
            <div className="text-h2 font-bold text-neutral-900">{stats.total_prompts || 0}</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="text-sm text-neutral-500 mb-1">Successful</div>
            <div className="text-h2 font-bold text-success-dark">{stats.successful || 0}</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="text-sm text-neutral-500 mb-1">Failed</div>
            <div className="text-h2 font-bold text-error-dark">{stats.failed || 0}</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="text-sm text-neutral-500 mb-1">Total Cost</div>
            <div className="text-h2 font-bold text-primary-main">${stats.total_cost || '0.00'}</div>
          </div>
        </div>
      )}

      {/* Filters and Actions Bar */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary-main text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === 'success'
                  ? 'bg-success-main text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Success ({successCount})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === 'failed'
                  ? 'bg-error-main text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Failed ({failedCount})
            </button>
          </div>

          {/* Sort Dropdown and Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-main"
            >
              <option value="index">Sort by Index</option>
              <option value="time">Sort by Time</option>
              <option value="status">Sort by Status</option>
            </select>

            <button
              onClick={handleDownloadAll}
              disabled={successCount === 0 || isDownloading}
              className="px-3 py-1 text-sm bg-primary-main text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Download all successful images as ZIP"
            >
              {isDownloading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating ZIP...
                </>
              ) : (
                'Download All'
              )}
            </button>

            {failedCount > 0 && (
              <button
                onClick={handleRegenerateFailures}
                className="px-3 py-1 text-sm bg-warning-main text-white rounded-lg hover:bg-warning-dark transition-colors"
                title="Regenerate only failed images"
              >
                Regenerate Failures
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-2 text-xs text-neutral-500">
          Showing {sortedResults.length} of {results.length} results
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {sortedResults.map((result, index) => {
          logger.debug(`🖼️ BatchResultsView: Rendering result ${index}:`, {
            id: result.id,
            batch_index: result.batch_index,
            status: result.status,
            has_result_url: !!result.result_url,
            result_url: result.result_url,
          });

          return (
            <div
              key={result.id || index}
              className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              {result.status === 'completed' && result.result_url ? (
                <div className="relative">
                  <img
                    src={result.result_url}
                    alt={`Result ${result.batch_index}`}
                    className="w-full h-48 object-cover"
                    onLoad={() => logger.debug(`✅ Image loaded: ${result.result_url}`)}
                    onError={(e) => logger.error(`❌ Image failed to load: ${result.result_url}`, e)}
                  />
                  {/* Quick Actions Overlay */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleCopyUrl(result.result_url, result.batch_index)}
                      className="bg-white/90 hover:bg-white p-2 rounded-lg shadow-md transition-colors"
                      title="Copy image URL"
                    >
                      {copyFeedback === result.batch_index ? (
                        <svg className="w-4 h-4 text-success-main" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 bg-neutral-100 flex items-center justify-center">
                  {result.status === 'failed' ? (
                    <div className="text-center">
                      <svg className="w-12 h-12 text-error-main mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-error-main text-sm">Failed</span>
                    </div>
                  ) : result.status === 'processing' ? (
                    <div className="text-center">
                      <div className="spinner mb-2"></div>
                      <span className="text-neutral-500 text-sm">Processing...</span>
                    </div>
                  ) : (
                    <span className="text-neutral-400">Pending</span>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-500">
                    #{result.batch_index}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      result.status === 'completed'
                        ? 'bg-success-light text-success-dark'
                        : result.status === 'failed'
                        ? 'bg-error-light text-error-dark'
                        : result.status === 'processing'
                        ? 'bg-warning-light text-warning-dark'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                {/* Prompt */}
                <p className="text-xs text-neutral-600 line-clamp-2 mb-2">
                  {result.prompt_text}
                </p>

                {/* Error Message */}
                {result.error_message && (
                  <div className="text-xs text-error-main mt-2 bg-error-light p-2 rounded">
                    <p className="font-semibold mb-1">Error:</p>
                    <p>{result.error_message}</p>
                  </div>
                )}

                {/* Processing Time */}
                {result.processing_time_ms && (
                  <p className="text-xs text-neutral-400 mt-2">
                    Processing time: {(result.processing_time_ms / 1000).toFixed(2)}s
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  {result.result_url && (
                    <>
                      <a
                        href={result.result_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 btn btn-sm btn-primary text-center"
                      >
                        View Full Size
                      </a>
                      <button
                        onClick={() => handleDownload(result.result_url, `image_${result.batch_index}.png`)}
                        className="btn btn-sm btn-secondary"
                        title="Download image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State after Filtering */}
      {sortedResults.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-medium mb-2">No results match your filter</p>
          <p className="text-sm">Try changing your filter or sort options</p>
        </div>
      )}
    </div>
  );
}
