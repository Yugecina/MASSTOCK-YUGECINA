/**
 * useDownloadBatch Hook
 * Manages batch downloading of images as a ZIP file
 */

import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import logger from '@/utils/logger';
import { generateFileName, generateZipFileName } from '@/utils/formatters';

interface DownloadableItem {
  /** URL of the image to download */
  url: string | null | undefined;
}

interface UseDownloadBatchOptions {
  /** Prefix for generated file names */
  filePrefix?: string;
  /** Design style for file naming */
  style?: string;
  /** Season for file naming */
  season?: string;
  /** Compression level (0-9, default: 6) */
  compressionLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

interface UseDownloadBatchReturn {
  /** Whether a download is in progress */
  isDownloading: boolean;
  /** Download all items as a ZIP file */
  downloadAll: <T extends DownloadableItem>(
    items: T[],
    getUrl: (item: T) => string | null | undefined
  ) => Promise<void>;
  /** Download a single file */
  downloadSingle: (url: string, filename: string) => Promise<void>;
}

/**
 * Hook for batch downloading images as ZIP
 */
export function useDownloadBatch({
  filePrefix = 'image',
  style,
  season,
  compressionLevel = 6
}: UseDownloadBatchOptions = {}): UseDownloadBatchReturn {
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Download a single file from URL
   */
  const downloadSingle = useCallback(async (url: string, filename: string): Promise<void> => {
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

      logger.debug('useDownloadBatch: Single file downloaded', { filename });
    } catch (err) {
      logger.error('useDownloadBatch: Download failed', { error: err, url });
      throw err;
    }
  }, []);

  /**
   * Download all items as a ZIP file
   */
  const downloadAll = useCallback(async <T extends DownloadableItem>(
    items: T[],
    getUrl: (item: T) => string | null | undefined
  ): Promise<void> => {
    const validItems = items.filter(item => getUrl(item));
    if (validItems.length === 0) return;

    setIsDownloading(true);

    try {
      const zip = new JSZip();

      // Add each image to the ZIP
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const url = getUrl(item);
        if (!url) continue;

        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const fileName = generateFileName(filePrefix, style, season, i);
          zip.file(fileName, blob);

          logger.debug('useDownloadBatch: Image added to ZIP', {
            fileName,
            index: i
          });
        } catch (err) {
          logger.error(`useDownloadBatch: Failed to add image ${i + 1} to ZIP`, {
            error: err
          });
        }
      }

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel }
      });

      // Create download link
      const zipName = generateZipFileName(filePrefix, style, season);
      const zipUrl = window.URL.createObjectURL(zipBlob);

      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(zipUrl);

      logger.debug('useDownloadBatch: ZIP downloaded successfully', {
        zipName,
        imageCount: validItems.length
      });
    } catch (err) {
      logger.error('useDownloadBatch: Failed to create ZIP', { error: err });
      throw err;
    } finally {
      setIsDownloading(false);
    }
  }, [filePrefix, style, season, compressionLevel]);

  return {
    isDownloading,
    downloadAll,
    downloadSingle
  };
}
