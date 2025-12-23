/**
 * Image Processing Service Tests
 *
 * Tests for Sharp wrapper functions:
 * - Smart crop
 * - Resize with padding
 * - Preview generation
 * - Metadata extraction
 * - Method determination
 */

import {
  smartCrop,
  resizeWithPadding,
  generatePreview,
  getImageMetadata,
  determineBestMethod,
  bufferToBase64,
  base64ToBuffer,
} from '../../services/imageProcessingService';
import sharp from 'sharp';

describe('ImageProcessingService', () => {
  // Test image: 800x600 white PNG
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();
  });

  describe('smartCrop', () => {
    it('should crop image to target dimensions using attention strategy', async () => {
      const result = await smartCrop(testImageBuffer, 400, 400, {
        strategy: 'attention',
      });

      expect(result).toHaveProperty('buffer');
      expect(result.width).toBe(400);
      expect(result.height).toBe(400);
      expect(result.format).toBe('png');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should crop image using entropy strategy', async () => {
      const result = await smartCrop(testImageBuffer, 300, 300, {
        strategy: 'entropy',
      });

      expect(result.width).toBe(300);
      expect(result.height).toBe(300);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should crop image using center strategy', async () => {
      const result = await smartCrop(testImageBuffer, 500, 500, {
        strategy: 'center',
      });

      expect(result.width).toBe(500);
      expect(result.height).toBe(500);
    });

    it('should throw error for invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('invalid');

      await expect(
        smartCrop(invalidBuffer, 400, 400, { strategy: 'attention' })
      ).rejects.toThrow();
    });

    it('should handle extreme dimensions', async () => {
      const result = await smartCrop(testImageBuffer, 100, 1000, {
        strategy: 'attention',
      });

      expect(result.width).toBe(100);
      expect(result.height).toBe(1000);
    });
  });

  describe('resizeWithPadding', () => {
    it('should resize with white padding by default', async () => {
      const result = await resizeWithPadding(testImageBuffer, 1000, 1000);

      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should resize with custom background color', async () => {
      const result = await resizeWithPadding(testImageBuffer, 600, 800, '#FF0000');

      expect(result.width).toBe(600);
      expect(result.height).toBe(800);
    });

    it('should maintain aspect ratio with contain mode', async () => {
      const result = await resizeWithPadding(testImageBuffer, 400, 600);

      // Original is 800x600 (4:3), target is 400x600
      // Should fit inside with padding
      expect(result.width).toBe(400);
      expect(result.height).toBe(600);
    });

    it('should throw error for invalid buffer', async () => {
      const invalidBuffer = Buffer.from('invalid');

      await expect(
        resizeWithPadding(invalidBuffer, 400, 400)
      ).rejects.toThrow();
    });
  });

  describe('generatePreview', () => {
    it('should generate preview with default options', async () => {
      const result = await generatePreview(testImageBuffer);

      expect(result.width).toBeLessThanOrEqual(400);
      expect(result.height).toBeLessThanOrEqual(400);
      expect(result.format).toBe('jpeg');
    });

    it('should generate preview with custom dimensions', async () => {
      const result = await generatePreview(testImageBuffer, {
        maxWidth: 200,
        maxHeight: 200,
      });

      expect(result.width).toBeLessThanOrEqual(200);
      expect(result.height).toBeLessThanOrEqual(200);
    });

    it('should generate preview with custom quality', async () => {
      const highQuality = await generatePreview(testImageBuffer, {
        quality: 100,
      });

      const lowQuality = await generatePreview(testImageBuffer, {
        quality: 50,
      });

      // For simple uniform images, compression might be similar
      expect(highQuality.size).toBeGreaterThanOrEqual(lowQuality.size);
    });

    it('should not enlarge images', async () => {
      const smallImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const result = await generatePreview(smallImage, {
        maxWidth: 400,
        maxHeight: 400,
      });

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
  });

  describe('getImageMetadata', () => {
    it('should extract correct metadata', async () => {
      const metadata = await getImageMetadata(testImageBuffer);

      expect(metadata.width).toBe(800);
      expect(metadata.height).toBe(600);
      expect(metadata.format).toBe('png');
      expect(metadata.aspectRatio).toBe('4:3');
      expect(metadata.size).toBeGreaterThan(0);
    });

    it('should calculate aspect ratio correctly for square image', async () => {
      const squareImage = await sharp({
        create: {
          width: 400,
          height: 400,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const metadata = await getImageMetadata(squareImage);

      expect(metadata.aspectRatio).toBe('1:1');
    });

    it('should calculate aspect ratio for portrait image', async () => {
      const portraitImage = await sharp({
        create: {
          width: 1080,
          height: 1920,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const metadata = await getImageMetadata(portraitImage);

      expect(metadata.aspectRatio).toBe('9:16');
    });

    it('should throw error for invalid buffer', async () => {
      const invalidBuffer = Buffer.from('invalid');

      await expect(getImageMetadata(invalidBuffer)).rejects.toThrow();
    });
  });

  describe('determineBestMethod', () => {
    it('should recommend crop for similar ratios', () => {
      // 16:9 → 16:10 (close)
      const method = determineBestMethod(1920, 1080, {
        width: 1920,
        height: 1200,
        ratio: '16:10',
        platform: 'google',
        safeZone: { all: 0 },
        description: 'Test',
        usage: 'Test',
      });

      expect(method).toBe('crop');
    });

    it('should recommend padding for moderate difference', () => {
      // 4:3 → 16:10 (moderate difference)
      // sourceRatio = 1.333, targetRatio = 1.6, diff = 0.267 (< 0.5)
      const method = determineBestMethod(1600, 1200, {
        width: 1920,
        height: 1200,
        ratio: '16:10',
        platform: 'google',
        safeZone: { all: 0 },
        description: 'Test',
        usage: 'Test',
      });

      expect(method).toBe('padding');
    });

    it('should recommend AI regenerate for very different ratios', () => {
      // 16:9 → 9:16 (complete flip)
      const method = determineBestMethod(1920, 1080, {
        width: 1080,
        height: 1920,
        ratio: '9:16',
        platform: 'meta',
        safeZone: { all: 0 },
        description: 'Test',
        usage: 'Test',
      });

      expect(method).toBe('ai_regenerate');
    });

    it('should handle square to landscape', () => {
      // 1:1 → 16:9 (large difference, AI recommended)
      // sourceRatio = 1.0, targetRatio = 1.778, diff = 0.778 (> 0.5)
      const method = determineBestMethod(1080, 1080, {
        width: 1920,
        height: 1080,
        ratio: '16:9',
        platform: 'dooh',
        safeZone: { all: 0.15 },
        description: 'Test',
        usage: 'Test',
      });

      expect(method).toBe('ai_regenerate');
    });
  });

  describe('bufferToBase64 / base64ToBuffer', () => {
    it('should convert buffer to base64', () => {
      const base64 = bufferToBase64(testImageBuffer);

      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
    });

    it('should convert base64 back to buffer', () => {
      const base64 = bufferToBase64(testImageBuffer);
      const buffer = base64ToBuffer(base64);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.equals(testImageBuffer)).toBe(true);
    });

    it('should handle round-trip conversion', () => {
      const original = Buffer.from('Hello World');
      const base64 = bufferToBase64(original);
      const restored = base64ToBuffer(base64);

      expect(restored.toString()).toBe('Hello World');
    });
  });
});
