import { useEffect, useState } from 'react';
import { useAssetsStore } from '../store/assetsStore';
import { ClientLayout } from '../components/layout/ClientLayout';
import { OptimizedImage } from '../components/common/OptimizedImage';

export default function Assets() {
  const {
    assets,
    loading,
    stats,
    pagination,
    filters,
    setFilters,
    fetchAssets,
    loadMore,
    getGroupedAssets
  } = useAssetsStore();

  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [gridColumns, setGridColumns] = useState(4); // 2-6 columns
  const [collapsedGroups, setCollapsedGroups] = useState({}); // Track collapsed state per group

  // Get grouped assets
  const groupedAssets = getGroupedAssets();

  // Toggle group collapse
  const toggleGroup = (executionId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [executionId]: !prev[executionId]
    }));
  };

  // Initial fetch on mount only - load ALL assets
  useEffect(() => {
    fetchAssets({}, { loadAll: true }).catch(err => {
      console.error('❌ Assets: Failed to load', { err });
      setError('Failed to load assets');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTypeFilter = async (type) => {
    try {
      setError(null);
      await setFilters({ asset_type: type });
    } catch (err) {
      console.error('❌ Assets: Failed to filter', { err, type });
      setError('Failed to apply filter');
    }
  };

  const handleSortChange = async (sort) => {
    try {
      setError(null);
      await setFilters({ sort });
    } catch (err) {
      console.error('❌ Assets: Failed to sort', { err, sort });
      setError('Failed to apply sort');
    }
  };

  const handleLoadMore = async () => {
    try {
      await loadMore();
    } catch (err) {
      console.error('❌ Assets: Failed to load more', { err });
      setError('Failed to load more assets');
    }
  };

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
  };

  const handleCloseModal = () => {
    setSelectedAsset(null);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 11L7 9L9 11L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="5.5" cy="5.5" r="1" fill="currentColor"/>
          </svg>
        );
      case 'video':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6.5 5.5L10 8L6.5 10.5V5.5Z" fill="currentColor"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
    }
  };

  return (
    <ClientLayout>
      <div className="assets-page">
        {/* Elegant Header */}
        <div className="assets-header">
          <div className="assets-header-content">
            <div className="assets-header-top">
              <h1 className="assets-title">Gallery</h1>
              <div className="assets-count">{stats.total}</div>
            </div>
            <p className="assets-subtitle">
              Your AI-generated collection
            </p>
          </div>

          {/* Toolbar */}
          <div className="assets-toolbar">
            {/* Type Filter Pills */}
            <div className="assets-filter-pills">
              <button
                className={`assets-filter-pill ${filters.asset_type === 'all' ? 'active' : ''}`}
                onClick={() => handleTypeFilter('all')}
              >
                All
                <span className="pill-count">{stats.total}</span>
              </button>
              {Object.entries(stats.by_type || {})
                .filter(([type]) => !['lipsync', 'upscaled'].includes(type))
                .map(([type, count]) => (
                  <button
                    key={type}
                    className={`assets-filter-pill ${filters.asset_type === type ? 'active' : ''}`}
                    onClick={() => handleTypeFilter(type)}
                  >
                    {getTypeIcon(type)}
                    {type}
                    <span className="pill-count">{count}</span>
                  </button>
                ))}
            </div>

            {/* View Controls */}
            <div className="assets-view-controls">
              {/* Grid Size Slider */}
              <div className="grid-size-control">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="6" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="11" y="1" width="2" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={gridColumns}
                    onChange={(e) => setGridColumns(Number(e.target.value))}
                    className="grid-slider"
                  />
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="2" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="4" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </div>

              {/* Sort Dropdown */}
              <select
                className="assets-sort-select"
                value={filters.sort}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="assets-error">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="12" r="0.5" fill="currentColor"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && assets.length === 0 && (
          <div className="assets-loading">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading gallery...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && assets.length === 0 && (
          <div className="assets-empty">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 32L22 26L28 32L32 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="18" r="2" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="empty-title">No assets yet</h3>
            <p className="empty-text">Your generated images and videos will appear here</p>
          </div>
        )}

        {/* Gallery Grid */}
        {groupedAssets.length > 0 && (
          <div className="assets-gallery masonry-view">
            {groupedAssets.map((group, groupIndex) => {
              const isCollapsed = collapsedGroups[group.execution_id] || false;

              return (
                <div key={group.execution_id} className="assets-group">
                  {/* Group Label - Clickable */}
                  <div
                    className="group-label"
                    onClick={() => toggleGroup(group.execution_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="group-label-left">
                      {/* Toggle Icon */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="group-toggle-icon"
                        style={{
                          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                          transition: 'transform 200ms ease-out'
                        }}
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="group-workflow">{group.workflow_name}</span>
                      <span className="group-divider">•</span>
                      <span className="group-date">
                        {new Date(group.execution_created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <span className="group-count">{group.asset_count}</span>
                  </div>

                  {/* Assets in this group - Collapsible */}
                  {!isCollapsed && (
                    <div
                      className="assets-container masonry"
                      style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
                    >
                  {group.assets.map((asset, assetIndex) => (
                    <div
                      key={asset.id}
                      className="asset-item"
                      style={{ animationDelay: `${(groupIndex * 0.05) + (assetIndex * 0.03)}s` }}
                      onClick={() => handleAssetClick(asset)}
                    >
                      <div className="asset-image-wrapper">
                        <OptimizedImage
                          src={asset.result_url}
                          alt={asset.prompt_text}
                          thumbnailSize={600}
                          aspectRatio={null}
                        />
                        <div className="asset-overlay">
                          <div className="overlay-top">
                            <span className="asset-type">
                              {getTypeIcon(asset.asset_type)}
                              {asset.asset_type}
                            </span>
                          </div>
                          <div className="overlay-bottom">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="expand-icon">
                              <path d="M4 4H8M4 4V8M4 4L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 4H12M16 4V8M16 4L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 16H12M16 16V12M16 16L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M4 16H8M4 16V12M4 16L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load More */}
            {pagination.has_more && (
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Load More</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 3V11M7 11L10 8M7 11L4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedAsset && (
          <div className="lightbox" onClick={handleCloseModal}>
            <div className="lightbox-backdrop" />

            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-close" onClick={handleCloseModal} title="Close (Esc)">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              <div className="lightbox-image">
                <img src={selectedAsset.result_url} alt={selectedAsset.prompt_text} />
              </div>

              <div className="lightbox-sidebar">
                <div className="lightbox-header">
                  <div className="lightbox-type">
                    {getTypeIcon(selectedAsset.asset_type)}
                    <span>{selectedAsset.asset_type}</span>
                  </div>
                  <span className="lightbox-date">
                    {new Date(selectedAsset.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="lightbox-body">
                  <div className="lightbox-section">
                    <label className="lightbox-label">Prompt</label>
                    <p className="lightbox-prompt">{selectedAsset.prompt_text}</p>
                  </div>

                  <div className="lightbox-section">
                    <label className="lightbox-label">Workflow</label>
                    <p className="lightbox-value">{selectedAsset.workflow_name}</p>
                  </div>

                  {selectedAsset.execution_id && (
                    <div className="lightbox-section">
                      <label className="lightbox-label">Execution ID</label>
                      <p className="lightbox-value lightbox-mono">{selectedAsset.execution_id}</p>
                    </div>
                  )}
                </div>

                <div className="lightbox-footer">
                  <a
                    href={selectedAsset.result_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lightbox-download-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 14H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
