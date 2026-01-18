/**
 * Image Helper Utilities
 * Functions for handling image conversion, detection, and manipulation
 */

import logger from '@/utils/logger';

/**
 * Base64 image object structure (from database storage)
 */
export interface Base64ImageObject {
  data: string;
  mimeType: string;
  originalName?: string;
}

/**
 * Convert a base64 image object to a File object
 * Handles both structured objects and legacy base64 strings
 * @param imageObj - Base64 image object or data URL string
 * @param filename - Fallback filename if not provided in object
 * @returns File object or null on failure
 */
export function base64ToFile(
  imageObj: Base64ImageObject | string,
  filename: string
): File | null {
  try {
    let base64Data: string;
    let mimeType: string;
    let originalName = filename;

    if (typeof imageObj === 'object' && 'data' in imageObj) {
      // Format from DB: { data: 'base64', mimeType: 'image/png' }
      base64Data = imageObj.data;
      mimeType = imageObj.mimeType;
      originalName = imageObj.originalName || filename;
    } else if (typeof imageObj === 'string') {
      // Legacy format: 'data:image/png;base64,iVBORw0...'
      const arr = imageObj.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) {
        throw new Error('Invalid base64 string format');
      }
      mimeType = mimeMatch[1];
      base64Data = arr[1];
    } else {
      throw new Error('Unsupported image format');
    }

    // Decode base64
    const bstr = atob(base64Data);

    // Convert to Uint8Array
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    // Create and return File object
    return new File([u8arr], originalName, { type: mimeType });
  } catch (error) {
    logger.error('base64ToFile: Conversion failed', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      filename,
      imageObjType: typeof imageObj
    });
    return null;
  }
}

/**
 * Check if a string value is a base64 encoded image
 * @param value - String to check
 * @returns True if the string appears to be a base64 image
 */
export function isBase64Image(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  // Check for data URL format
  if (value.startsWith('data:image/')) return true;

  // Check for raw base64 pattern (length check + base64 character validation)
  if (value.length > 100 && /^[A-Za-z0-9+/]+={0,2}$/.test(value.substring(0, 100))) {
    return true;
  }

  return false;
}

/**
 * Convert a base64 string to a data URL for display
 * @param value - Base64 string (raw or with data URL prefix)
 * @param defaultMimeType - Default MIME type if not specified
 * @returns Data URL string
 */
export function base64ToDataUrl(
  value: string,
  defaultMimeType = 'image/jpeg'
): string {
  if (value.startsWith('data:image/')) {
    return value;
  }
  return `data:${defaultMimeType};base64,${value}`;
}

/**
 * Image preview object structure for UI display
 */
export interface ImagePreview {
  file: File;
  url: string;
  name: string;
  size: number;
}

/**
 * Create image previews from an array of File objects
 * @param files - Array of File objects
 * @returns Array of ImagePreview objects
 */
export function createImagePreviews(files: File[]): ImagePreview[] {
  return files.map(file => ({
    file,
    url: URL.createObjectURL(file),
    name: file.name,
    size: file.size
  }));
}

/**
 * Revoke all object URLs in an array of previews to free memory
 * @param previews - Array of ImagePreview objects
 */
export function revokeImagePreviews(previews: ImagePreview[]): void {
  previews.forEach(preview => URL.revokeObjectURL(preview.url));
}
