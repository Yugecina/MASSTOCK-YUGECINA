import { useState, useEffect } from 'react';
import { workflowService } from '../../services/workflows';
import JSZip from 'jszip';
import logger from '@/utils/logger';


/**
 * BatchResultsView Component
 * Displays batch results for workflows with batch processing (e.g., nano_banana)
 *
 * UX Improvements (Iteration 3):
 * - Success banner
 * - Compact inline stats cards
 * - Styled filter buttons
 * - Grid size control (1-5 columns)
 * - Responsive image grid (2 columns default)
 * - Fixed image buttons layout
 * - Fixed status badge display
 */
export function BatchResultsView({ executionId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, success, failed
  const [sortBy, setSortBy] = useState('index'); // index, time, status
  const [gridColumns, setGridColumns] = useState(2); // 1-5 columns
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Production Statistics Panel */}
      {stats && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '2px solid var(--neutral-200)',
          padding: '24px',
          position: 'relative'
        }}>
          {/* Corner Accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, transparent 50%, var(--primary-50) 50%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
            position: 'relative',
            zIndex: 1
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Production Batch Statistics
            </h3>
            <div style={{
              padding: '4px 12px',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--primary-700)',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap'
            }}>
              BATCH #{executionId.slice(0, 8).toUpperCase()}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px'
          }}>
            {/* Total Output */}
            <div style={{
              padding: '16px',
              background: 'var(--neutral-50)',
              borderLeft: '4px solid var(--neutral-400)',
              borderRadius: '4px'
            }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--neutral-600)',
                fontWeight: 600,
                marginBottom: '8px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Total Output
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1
              }}>
                {stats.total_prompts || 0}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--neutral-600)',
                marginTop: '4px'
              }}>
                units produced
              </div>
            </div>

            {/* Quality Approved */}
            <div style={{
              padding: '16px',
              background: 'var(--success-bg)',
              borderLeft: '4px solid var(--success-main)',
              borderRadius: '4px'
            }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--success-dark)',
                fontWeight: 600,
                marginBottom: '8px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Quality Approved
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--success-main)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1
              }}>
                {stats.successful || 0}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--success-dark)',
                marginTop: '4px'
              }}>
                ✓ passed inspection
              </div>
            </div>

            {/* Defects */}
            {stats.failed > 0 && (
              <div style={{
                padding: '16px',
                background: 'var(--error-bg)',
                borderLeft: '4px solid var(--error-main)',
                borderRadius: '4px'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--error-dark)',
                  fontWeight: 600,
                  marginBottom: '8px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  Defects
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--error-main)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1
                }}>
                  {stats.failed || 0}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--error-dark)',
                  marginTop: '4px'
                }}>
                  ✗ rejected
                </div>
              </div>
            )}

            {/* Production Cost */}
            <div style={{
              padding: '16px',
              background: 'var(--secondary-50)',
              borderLeft: '4px solid var(--secondary-500)',
              borderRadius: '4px'
            }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--secondary-700)',
                fontWeight: 600,
                marginBottom: '8px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Production Cost
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--secondary-600)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1
              }}>
                ${stats.total_cost || '0.00'}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--secondary-700)',
                marginTop: '4px'
              }}>
                total batch cost
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel - Mediterranean Light */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px 24px',
        border: '2px solid var(--neutral-200)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              FILTER:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '8px 16px',
                  background: filter === 'all' ? 'var(--primary-500)' : 'white',
                  border: `2px solid ${filter === 'all' ? 'var(--primary-500)' : 'var(--neutral-300)'}`,
                  borderRadius: '6px',
                  color: filter === 'all' ? 'white' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-mono)'
                }}
                onMouseEnter={(e) => {
                  if (filter !== 'all') {
                    e.currentTarget.style.borderColor = 'var(--primary-500)';
                    e.currentTarget.style.color = 'var(--primary-500)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== 'all') {
                    e.currentTarget.style.borderColor = 'var(--neutral-300)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                ALL ({results.length})
              </button>
              <button
                onClick={() => setFilter('success')}
                style={{
                  padding: '8px 16px',
                  background: filter === 'success' ? 'var(--success-main)' : 'white',
                  border: `2px solid ${filter === 'success' ? 'var(--success-main)' : 'var(--neutral-300)'}`,
                  borderRadius: '6px',
                  color: filter === 'success' ? 'white' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (filter !== 'success') {
                    e.currentTarget.style.borderColor = 'var(--success-main)';
                    e.currentTarget.style.color = 'var(--success-main)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== 'success') {
                    e.currentTarget.style.borderColor = 'var(--neutral-300)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span>✓</span> {successCount}
              </button>
              <button
                onClick={() => setFilter('failed')}
                style={{
                  padding: '8px 16px',
                  background: filter === 'failed' ? 'var(--error-main)' : 'white',
                  border: `2px solid ${filter === 'failed' ? 'var(--error-main)' : 'var(--neutral-300)'}`,
                  borderRadius: '6px',
                  color: filter === 'failed' ? 'white' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (filter !== 'failed') {
                    e.currentTarget.style.borderColor = 'var(--error-main)';
                    e.currentTarget.style.color = 'var(--error-main)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== 'failed') {
                    e.currentTarget.style.borderColor = 'var(--neutral-300)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span>✗</span> {failedCount}
              </button>
            </div>
          </div>

          {/* View Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Grid Size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                fontWeight: 600,
                letterSpacing: '0.05em'
              }}>
                GRID:
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(cols => (
                  <button
                    key={cols}
                    onClick={() => setGridColumns(cols)}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: gridColumns === cols ? 'var(--primary-500)' : 'white',
                      border: `2px solid ${gridColumns === cols ? 'var(--primary-500)' : 'var(--neutral-300)'}`,
                      borderRadius: '6px',
                      color: gridColumns === cols ? 'white' : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'var(--font-mono)'
                    }}
                    title={`${cols} column${cols !== 1 ? 's' : ''}`}
                    onMouseEnter={(e) => {
                      if (gridColumns !== cols) {
                        e.currentTarget.style.borderColor = 'var(--primary-500)';
                        e.currentTarget.style.color = 'var(--primary-500)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (gridColumns !== cols) {
                        e.currentTarget.style.borderColor = 'var(--neutral-300)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    {cols}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'white',
                border: '2px solid var(--neutral-300)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-500)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--neutral-300)';
              }}
            >
              <option value="index">INDEX</option>
              <option value="time">TIME</option>
              <option value="status">STATUS</option>
            </select>

            {/* Download All */}
            <button
              onClick={handleDownloadAll}
              disabled={successCount === 0 || isDownloading}
              style={{
                padding: '10px 20px',
                background: successCount === 0 || isDownloading ? 'var(--neutral-300)' : 'var(--primary-500)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 600,
                cursor: successCount === 0 || isDownloading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: successCount === 0 || isDownloading ? 'none' : '0 2px 8px rgba(42, 157, 143, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (successCount > 0 && !isDownloading) {
                  e.currentTarget.style.background = 'var(--primary-600)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(42, 157, 143, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (successCount > 0 && !isDownloading) {
                  e.currentTarget.style.background = 'var(--primary-500)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(42, 157, 143, 0.2)';
                }
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {isDownloading ? 'CREATING ZIP...' : 'DOWNLOAD ALL'}
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--neutral-200)',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em'
        }}>
          SHOWING {sortedResults.length} OF {results.length} UNITS
        </div>
      </div>

      {/* Production Output Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
          gap: '20px'
        }}
      >
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
              style={{
                background: 'white',
                border: '2px solid var(--neutral-200)',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              {/* Unit Number Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'var(--neutral-900)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                #{result.batch_index}
              </div>

              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: result.status === 'completed' ? 'var(--success-main)' : result.status === 'failed' ? 'var(--error-main)' : 'var(--warning-main)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {result.status === 'completed' ? 'completed' : result.status === 'failed' ? 'failed' : 'processing'}
              </div>

              {/* Image Container */}
              {result.status === 'completed' && result.result_url ? (
                <div style={{
                  position: 'relative',
                  aspectRatio: '1',
                  background: 'var(--neutral-100)'
                }}>
                  <img
                    src={result.result_url}
                    alt={`Unit ${result.batch_index}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onLoad={() => logger.debug(`✅ Image loaded: ${result.result_url}`)}
                    onError={(e) => logger.error(`❌ Image failed to load: ${result.result_url}`, e)}
                  />

                  {/* Copy URL Overlay */}
                  <button
                    onClick={() => handleCopyUrl(result.result_url, result.batch_index)}
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      width: '36px',
                      height: '36px',
                      background: copyFeedback === result.batch_index ? 'var(--success-main)' : 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      zIndex: 5
                    }}
                    title="Copy URL"
                  >
                    {copyFeedback === result.batch_index ? (
                      <svg style={{ width: '18px', height: '18px' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <div style={{
                  aspectRatio: '1',
                  background: 'var(--neutral-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {result.status === 'failed' ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <svg style={{ width: '48px', height: '48px', color: 'var(--error-main)', marginBottom: '12px' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--error-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Production Failed
                      </div>
                    </div>
                  ) : result.status === 'processing' ? (
                    <div style={{ textAlign: 'center' }}>
                      <div className="spinner" style={{ marginBottom: '12px' }}></div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--neutral-600)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Processing...
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--neutral-400)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Pending
                    </div>
                  )}
                </div>
              )}

              {/* Details Panel */}
              <div style={{
                padding: '16px',
                background: 'var(--neutral-50)',
                borderTop: '1px solid var(--neutral-200)'
              }}>
                {/* Prompt Text */}
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: '36px'
                }}>
                  {result.prompt_text}
                </div>

                {/* Technical Specs */}
                {result.processing_time_ms && result.status === 'completed' && (
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--neutral-500)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    CYCLE TIME: {(result.processing_time_ms / 1000).toFixed(2)}s
                  </div>
                )}

                {/* Error Details */}
                {result.error_message && (
                  <div style={{
                    padding: '10px',
                    background: 'var(--error-light)',
                    border: '1px solid var(--error-main)',
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--error-dark)',
                      marginBottom: '4px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      Error Log:
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--error-dark)',
                      lineHeight: 1.4
                    }}>
                      {result.error_message}
                    </div>
                  </div>
                )}

                {/* Action Controls */}
                {result.result_url && (
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <a
                      href={result.result_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: 'var(--primary-500)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textAlign: 'center',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.02em',
                        display: 'block'
                      }}
                    >
                      View Full Size
                    </a>
                    <button
                      onClick={() => handleDownload(result.result_url, `image_${result.batch_index}.png`)}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: 'white',
                        border: '2px solid var(--neutral-300)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: 'var(--text-secondary)'
                      }}
                      title="Download"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-500)';
                        e.currentTarget.style.color = 'var(--primary-500)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--neutral-300)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                )}
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
