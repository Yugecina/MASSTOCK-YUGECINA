/**
 * Image Processing Service
 *
 * Sharp wrapper for image manipulation operations:
 * - Smart cropping (attention/entropy-based)
 * - Resize with multiple fit modes
 * - Canvas extension (padding)
 * - Format conversion
 * - Preview generation
 */

import sharp from 'sharp';
import { FormatPreset } from '../utils/formatPresets';
import { logger } from '../config/logger';

export interface CropOptions {
  strategy: 'attention' | 'entropy' | 'center';
  position?: string; // sharp.gravity or sharp.strategy
}

export interface ResizeResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number; // bytes
}

export interface PreviewOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Smart crop image to target dimensions
 * Uses Sharp's built-in attention or entropy detection
 */
export async function smartCrop(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  options: CropOptions = { strategy: 'attention' }
): Promise<ResizeResult> {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('🎯 ImageProcessing: Smart crop started', {
      targetWidth,
      targetHeight,
      strategy: options.strategy,
    });
  }

  const startTime = Date.now();

  try {
    // Determine position strategy
    let position: any;
    if (options.strategy === 'attention') {
      position = sharp.strategy.attention;
    } else if (options.strategy === 'entropy') {
      position = sharp.strategy.entropy;
    } else {
      position = 'center';
    }

    const result = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position,
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer({ resolveWithObject: true });

    const processingTime = Date.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ ImageProcessing: Smart crop complete', {
        width: result.info.width,
        height: result.info.height,
        format: result.info.format,
        size: `${(result.info.size / 1024).toFixed(2)}KB`,
        processingTime: `${processingTime}ms`,
      });
    }

    return {
      buffer: result.data,
      width: result.info.width,
      height: result.info.height,
      format: result.info.format,
      size: result.info.size,
    };
  } catch (error: any) {
    logger.error('❌ ImageProcessing.smartCrop: Failed', {
      error: error.message,
      targetWidth,
      targetHeight,
      strategy: options.strategy,
    });
    throw new Error(`Smart crop failed: ${error.message}`);
  }
}

/**
 * Resize with padding (canvas extension)
 * Useful for formats with very different aspect ratios
 */
export async function resizeWithPadding(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  backgroundColor: string = '#FFFFFF'
): Promise<ResizeResult> {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('📐 ImageProcessing: Resize with padding started', {
      targetWidth,
      targetHeight,
      backgroundColor,
    });
  }

  const startTime = Date.now();

  try {
    // First, resize to fit inside target dimensions (contain mode)
    const resized = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: backgroundColor,
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer({ resolveWithObject: true });

    const processingTime = Date.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ ImageProcessing: Resize with padding complete', {
        width: resized.info.width,
        height: resized.info.height,
        size: `${(resized.info.size / 1024).toFixed(2)}KB`,
        processingTime: `${processingTime}ms`,
      });
    }

    return {
      buffer: resized.data,
      width: resized.info.width,
      height: resized.info.height,
      format: resized.info.format,
      size: resized.info.size,
    };
  } catch (error: any) {
    logger.error('❌ ImageProcessing.resizeWithPadding: Failed', {
      error: error.message,
      targetWidth,
      targetHeight,
    });
    throw new Error(`Resize with padding failed: ${error.message}`);
  }
}

/**
 * Generate preview/thumbnail
 * Fast preview generation for UI responsiveness
 */
export async function generatePreview(
  imageBuffer: Buffer,
  options: PreviewOptions = {}
): Promise<ResizeResult> {
  const { maxWidth = 400, maxHeight = 400, quality = 80 } = options;

  if (process.env.NODE_ENV === 'development') {
    logger.debug('🖼️  ImageProcessing: Generate preview started', {
      maxWidth,
      maxHeight,
      quality,
    });
  }

  try {
    const result = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toBuffer({ resolveWithObject: true });

    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ ImageProcessing: Preview generated', {
        width: result.info.width,
        height: result.info.height,
        size: `${(result.info.size / 1024).toFixed(2)}KB`,
      });
    }

    return {
      buffer: result.data,
      width: result.info.width,
      height: result.info.height,
      format: result.info.format,
      size: result.info.size,
    };
  } catch (error: any) {
    logger.error('❌ ImageProcessing.generatePreview: Failed', {
      error: error.message,
    });
    throw new Error(`Preview generation failed: ${error.message}`);
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: string;
}> {
  try {
    // Log buffer info for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🔍 ImageProcessing: Analyzing buffer', {
        bufferLength: imageBuffer.length,
        bufferType: imageBuffer.constructor.name,
        isBuffer: Buffer.isBuffer(imageBuffer),
        first10Bytes: imageBuffer.slice(0, 10).toString('hex'),
      });
    }

    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Calculate aspect ratio
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const aspectRatio = `${width / divisor}:${height / divisor}`;

    if (process.env.NODE_ENV === 'development') {
      logger.debug('📊 ImageProcessing: Metadata extracted', {
        width,
        height,
        format: metadata.format,
        aspectRatio,
        size: `${((metadata.size || 0) / 1024).toFixed(2)}KB`,
      });
    }

    return {
      width,
      height,
      format: metadata.format || 'unknown',
      size: metadata.size || 0,
      aspectRatio,
    };
  } catch (error: any) {
    logger.error('❌ ImageProcessing.getImageMetadata: Failed', {
      error: error.message,
      errorName: error.name,
      bufferLength: imageBuffer?.length || 0,
      isBuffer: Buffer.isBuffer(imageBuffer),
    });
    throw new Error(`Metadata extraction failed: ${error.message}`);
  }
}

/**
 * Determine best processing method based on aspect ratio similarity
 * Uses AI regeneration for aspect ratio changes (Nano Banana Pro handles text preservation)
 */
export function determineBestMethod(
  sourceWidth: number,
  sourceHeight: number,
  targetFormat: FormatPreset
): 'crop' | 'padding' | 'ai_regenerate' {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetFormat.width / targetFormat.height;
  const ratioDifference = Math.abs(sourceRatio - targetRatio);

  // Determine method based on aspect ratio difference
  const method = ratioDifference < 0.01 ? 'crop' : 'ai_regenerate';

  // CRITICAL LOGGING FOR DEBUGGING
  if (process.env.NODE_ENV === 'development') {
    logger.debug('🔍 ImageProcessing.determineBestMethod:', {
      source: `${sourceWidth}x${sourceHeight}`,
      target: `${targetFormat.width}x${targetFormat.height}`,
      sourceRatio: sourceRatio.toFixed(3),
      targetRatio: targetRatio.toFixed(3),
      ratioDifference: ratioDifference.toFixed(3),
      threshold: 0.01,
      decision: method,
      reason: ratioDifference < 0.01
        ? 'Same aspect ratio - simple resize'
        : 'Aspect ratio change - AI regeneration required'
    });
  }

  return method;
}

/**
 * Convert image buffer to base64
 * Utility for Gemini API calls
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

/**
 * Convert base64 to buffer
 * Utility for receiving Gemini results
 */
export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}
