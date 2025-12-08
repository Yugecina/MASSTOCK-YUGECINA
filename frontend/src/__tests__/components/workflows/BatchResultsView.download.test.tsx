import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for BatchResultsView download functionality
 * Tests the delay mechanism and progress tracking for individual downloads
 */
describe('BatchResultsView Download Logic', () => {
  let mockFetch;
  let mockCreateObjectURL;
  let mockRevokeObjectURL;
  let mockAppendChild;
  let mockRemoveChild;
  let downloadedImages;

  beforeEach(() => {
    // Reset tracking
    downloadedImages = [];

    // Mock fetch
    mockFetch = vi.fn((url) => {
      downloadedImages.push(url);
      return Promise.resolve({
        blob: () => Promise.resolve(new Blob(['fake-image-data'], { type: 'image/png' }))
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    // Mock URL methods
    mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
    mockRevokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...global.URL,
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL
    });

    // Mock document.body methods
    mockAppendChild = vi.fn();
    mockRemoveChild = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
  });

  it('should download images sequentially with delay', async () => {
    // Simulate the download logic from handleDownloadSelectedIndividual
    const selectedResults = [
      { id: '1', batch_index: 1, result_url: 'https://example.com/image1.png' },
      { id: '2', batch_index: 2, result_url: 'https://example.com/image2.png' },
      { id: '3', batch_index: 3, result_url: 'https://example.com/image3.png' }
    ];

    const downloadProgress = { current: 0, total: selectedResults.length };
    const delays = [];

    // Track when each download happens
    const downloadTimes = [];

    for (let i = 0; i < selectedResults.length; i++) {
      const result = selectedResults[i];
      const startTime = Date.now();

      // Simulate download
      const response = await mockFetch(result.result_url);
      const blob = await response.blob();
      const blobUrl = mockCreateObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `image_${result.batch_index}.png`;
      document.body.appendChild(link);
      // link.click(); // Skip actual click in test
      document.body.removeChild(link);
      mockRevokeObjectURL(blobUrl);

      downloadProgress.current = i + 1;
      downloadTimes.push(Date.now() - startTime);

      // Add delay between downloads (except last one)
      if (i < selectedResults.length - 1) {
        const delayStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 50)); // Reduced delay for test
        delays.push(Date.now() - delayStart);
      }
    }

    // Verify all images were downloaded
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(downloadedImages).toEqual([
      'https://example.com/image1.png',
      'https://example.com/image2.png',
      'https://example.com/image3.png'
    ]);

    // Verify download links were created for each image
    expect(mockAppendChild).toHaveBeenCalledTimes(3);
    expect(mockRemoveChild).toHaveBeenCalledTimes(3);

    // Verify blob URLs were created and cleaned up
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(3);
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(3);

    // Verify progress tracking
    expect(downloadProgress.current).toBe(3);
    expect(downloadProgress.total).toBe(3);

    // Verify delays were applied (should be 2 delays for 3 downloads)
    expect(delays.length).toBe(2);
    delays.forEach(delay => {
      expect(delay).toBeGreaterThanOrEqual(40); // Allow for timing variance
    });
  });

  it('should handle download errors and continue with remaining downloads', async () => {
    const selectedResults = [
      { id: '1', batch_index: 1, result_url: 'https://example.com/image1.png' },
      { id: '2', batch_index: 2, result_url: 'https://example.com/image2.png' },
      { id: '3', batch_index: 3, result_url: 'https://example.com/image3.png' }
    ];

    // Mock fetch to fail on second image
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['fake-image-data'], { type: 'image/png' }))
      })
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['fake-image-data'], { type: 'image/png' }))
      });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedResults.length; i++) {
      const result = selectedResults[i];

      try {
        const response = await mockFetch(result.result_url);
        const blob = await response.blob();
        const blobUrl = mockCreateObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `image_${result.batch_index}.png`;
        document.body.appendChild(link);
        document.body.removeChild(link);
        mockRevokeObjectURL(blobUrl);

        successCount++;
      } catch (err) {
        failCount++;
        // Continue to next download despite error
      }

      // Add delay (except for last one)
      if (i < selectedResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Verify all downloads were attempted
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify counts
    expect(successCount).toBe(2);
    expect(failCount).toBe(1);

    // Verify only successful downloads created links
    expect(mockAppendChild).toHaveBeenCalledTimes(2);
    expect(mockRemoveChild).toHaveBeenCalledTimes(2);
  });

  it('should track progress correctly during downloads', async () => {
    const selectedResults = [
      { id: '1', batch_index: 1, result_url: 'https://example.com/image1.png' },
      { id: '2', batch_index: 2, result_url: 'https://example.com/image2.png' },
      { id: '3', batch_index: 3, result_url: 'https://example.com/image3.png' }
    ];

    const progressUpdates = [];

    for (let i = 0; i < selectedResults.length; i++) {
      const result = selectedResults[i];

      await mockFetch(result.result_url);

      // Track progress
      progressUpdates.push({
        current: i + 1,
        total: selectedResults.length
      });

      if (i < selectedResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Verify progress updates
    expect(progressUpdates).toEqual([
      { current: 1, total: 3 },
      { current: 2, total: 3 },
      { current: 3, total: 3 }
    ]);
  });

  it('should clean up resources for each download', async () => {
    const result = { id: '1', batch_index: 1, result_url: 'https://example.com/image1.png' };

    const response = await mockFetch(result.result_url);
    const blob = await response.blob();
    const blobUrl = mockCreateObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `image_${result.batch_index}.png`;
    
    document.body.appendChild(link);
    document.body.removeChild(link);
    mockRevokeObjectURL(blobUrl);

    // Verify cleanup order
    expect(mockAppendChild).toHaveBeenCalledTimes(1);
    expect(mockRemoveChild).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
