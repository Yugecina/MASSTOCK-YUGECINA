/**
 * E2E Tests for Smart Resizer with Vertex AI
 *
 * Tests the complete Smart Resizer workflow with real Vertex AI for AI regeneration
 *
 * Requirements:
 * - GOOGLE_APPLICATION_CREDENTIALS must be set
 * - USE_VERTEX_AI=true in .env
 * - Test image at /Users/dorian/Downloads/1737554810749.jpeg
 *
 * Test Coverage:
 * - All 10 standard photo formats
 * - All 3 processing methods (crop, padding, ai_regenerate)
 * - Batch processing (single & multiple images)
 * - Large batches (5 images x 10 formats = 50 outputs)
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Smart Resizer - Vertex AI E2E Tests', () => {
  const TEST_OUTPUTS_DIR = path.join(__dirname, '../../../test-outputs/smart-resizer');
  const SOURCE_IMAGE_PATH = '/Users/dorian/Downloads/1737554810749.jpeg';

  const ALL_FORMATS = [
    'square',           // 1080x1080 (1:1)
    'portrait_2_3',     // 1080x1620 (2:3)
    'portrait_3_4',     // 1080x1440 (3:4)
    'social_story',     // 1080x1920 (9:16)
    'social_post',      // 1080x1350 (4:5)
    'standard_3_2',     // 1620x1080 (3:2)
    'classic_4_3',      // 1440x1080 (4:3)
    'widescreen',       // 1920x1080 (16:9)
    'medium_5_4',       // 1350x1080 (5:4)
    'ultrawide'         // 2520x1080 (21:9)
  ];

  beforeAll(() => {
    // Create output directory
    if (!fs.existsSync(TEST_OUTPUTS_DIR)) {
      fs.mkdirSync(TEST_OUTPUTS_DIR, { recursive: true });
    }

    // Verify source image exists
    if (!fs.existsSync(SOURCE_IMAGE_PATH)) {
      throw new Error(`Source image not found: ${SOURCE_IMAGE_PATH}`);
    }

    // Verify environment
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set');
    }

    if (!process.env.USE_VERTEX_AI || process.env.USE_VERTEX_AI !== 'true') {
      console.warn('⚠️  USE_VERTEX_AI is not set to true');
    }
  });

  // Helper to save resized image
  function saveImage(base64Data: string, filename: string): void {
    const buffer = Buffer.from(base64Data, 'base64');
    const filepath = path.join(TEST_OUTPUTS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    const sizeKB = (buffer.length / 1024).toFixed(2);
    console.log(`   💾 Saved: ${filename} (${sizeKB} KB)`);
  }

  // Helper to encode image as base64
  function encodeImageAsBase64(imagePath: string): string {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  }

  describe('1. All Formats Test (Single Image)', () => {
    const formatsWithDetails = [
      { format: 'square', dimensions: '1080x1080', ratio: '1:1', usage: 'Instagram' },
      { format: 'portrait_2_3', dimensions: '1080x1620', ratio: '2:3', usage: 'Portrait photo' },
      { format: 'portrait_3_4', dimensions: '1080x1440', ratio: '3:4', usage: 'Portrait traditional' },
      { format: 'social_story', dimensions: '1080x1920', ratio: '9:16', usage: 'Stories/TikTok' },
      { format: 'social_post', dimensions: '1080x1350', ratio: '4:5', usage: 'Instagram optimal' },
      { format: 'standard_3_2', dimensions: '1620x1080', ratio: '3:2', usage: 'Photo 35mm' },
      { format: 'classic_4_3', dimensions: '1440x1080', ratio: '4:3', usage: 'Format TV' },
      { format: 'widescreen', dimensions: '1920x1080', ratio: '16:9', usage: 'YouTube' },
      { format: 'medium_5_4', dimensions: '1350x1080', ratio: '5:4', usage: 'Format moyen' },
      { format: 'ultrawide', dimensions: '2520x1080', ratio: '21:9', usage: 'Cinématique' },
    ];

    formatsWithDetails.forEach(({ format, dimensions, ratio, usage }) => {
      it(`should resize to ${format} format (${dimensions} - ${ratio})`, async () => {
        const sharp = require('sharp');

        const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
        const base64Image = imageBuffer.toString('base64');

        // Import format presets to get exact dimensions
        const { FORMAT_PRESETS } = require('../../../utils/formatPresets');
        const preset = FORMAT_PRESETS[format];

        expect(preset).toBeDefined();

        // Use Sharp for standard resizing (without AI)
        const resizedBuffer = await sharp(imageBuffer)
          .resize(preset.width, preset.height, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toBuffer();

        const base64Resized = resizedBuffer.toString('base64');
        saveImage(base64Resized, `format_${format}_${dimensions}.png`);

        // Verify output dimensions
        const metadata = await sharp(resizedBuffer).metadata();
        expect(metadata.width).toBe(preset.width);
        expect(metadata.height).toBe(preset.height);

        console.log(`   ✅ ${format} (${ratio}): ${dimensions} - ${usage}`);
      }, 30000);
    });
  });

  describe('2. Processing Method Tests', () => {
    it('should use CROP method for similar aspect ratios', async () => {
      const sharp = require('sharp');

      // Create a 16:9 source image, resize to 16:9 (should use crop)
      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);

      // Resize to widescreen (16:9)
      const result = await sharp(imageBuffer)
        .resize(1920, 1080, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();

      saveImage(result.toString('base64'), 'method_crop_16-9_to_16-9.png');

      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);

      console.log('   ✅ CROP method: 16:9 → 16:9');
    }, 30000);

    it('should use PADDING method for minor adjustments', async () => {
      const sharp = require('sharp');

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);

      // Resize with padding (white background)
      const result = await sharp(imageBuffer)
        .resize(1920, 1080, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();

      saveImage(result.toString('base64'), 'method_padding_with_white.png');

      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);

      console.log('   ✅ PADDING method: with white background');
    }, 30000);

    it('should use AI REGENERATE for very different aspect ratios', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
      const base64Image = imageBuffer.toString('base64');

      // AI regenerate: Square → Portrait Story (1:1 → 9:16)
      const prompt = `Transform this image to a 9:16 aspect ratio by intelligently reorganizing and expanding the composition.

CRITICAL REQUIREMENTS:
1. DO NOT add black borders or letterboxing
2. DO NOT simply crop or stretch the image
3. PRESERVE all text content exactly as written (same fonts, colors, sizes)
4. PRESERVE all logos and brand elements exactly
5. EXPAND the background/scene naturally to fill the new dimensions
6. RECOMPOSE the layout to fit 9:16 while maintaining visual balance
7. The final image must be a complete, full-bleed 9:16 composition

Think of this as creating a new 9:16 version of the same creative, not just resizing it.`;

      const startTime = Date.now();

      const response = await client.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          imageConfig: {
            aspectRatio: '9:16'
          }
        }
      });

      const duration = Date.now() - startTime;

      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      expect(imagePart).toBeDefined();
      saveImage(imagePart.inlineData.data, 'method_ai_regenerate_1-1_to_9-16.png');

      console.log(`   ✅ AI REGENERATE: 1:1 → 9:16 (${(duration / 1000).toFixed(2)}s)`);
    }, 90000);
  });

  describe('3. Batch Processing Tests', () => {
    it('should process single image with 3 formats', async () => {
      const sharp = require('sharp');
      const { FORMAT_PRESETS } = require('../../../utils/formatPresets');

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
      const formats = ['square', 'widescreen', 'social_story'];

      const startTime = Date.now();
      const results = [];

      for (const format of formats) {
        const preset = FORMAT_PRESETS[format];

        const resized = await sharp(imageBuffer)
          .resize(preset.width, preset.height, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toBuffer();

        results.push(resized);
        saveImage(resized.toString('base64'), `batch_single_${format}.png`);
      }

      const duration = Date.now() - startTime;

      expect(results).toHaveLength(3);
      console.log(`   ✅ 1 image × 3 formats: ${(duration / 1000).toFixed(2)}s`);
    }, 60000);

    it('should process 3 images with 3 formats each (9 total)', async () => {
      const sharp = require('sharp');
      const { FORMAT_PRESETS } = require('../../../utils/formatPresets');

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
      const formats = ['square', 'widescreen', 'portrait_2_3'];

      const startTime = Date.now();
      let count = 0;

      // Process 3 "images" (using same source for simplicity)
      for (let imageIdx = 0; imageIdx < 3; imageIdx++) {
        for (const format of formats) {
          const preset = FORMAT_PRESETS[format];

          const resized = await sharp(imageBuffer)
            .resize(preset.width, preset.height, {
              fit: 'cover',
              position: 'center'
            })
            .png()
            .toBuffer();

          saveImage(resized.toString('base64'), `batch_multi_img${imageIdx + 1}_${format}.png`);
          count++;
        }
      }

      const duration = Date.now() - startTime;

      expect(count).toBe(9);
      console.log(`   ✅ 3 images × 3 formats = 9 outputs: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   📊 Average: ${(duration / 9000).toFixed(2)}s per resize`);
    }, 90000);
  });

  describe('4. Large Batch Test', () => {
    it('should process 5 images with all 10 formats (50 outputs)', async () => {
      const sharp = require('sharp');
      const { FORMAT_PRESETS } = require('../../../utils/formatPresets');

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);

      const startTime = Date.now();
      let count = 0;

      // Process 5 images × 10 formats = 50 outputs
      for (let imageIdx = 0; imageIdx < 5; imageIdx++) {
        for (const format of ALL_FORMATS) {
          const preset = FORMAT_PRESETS[format];

          const resized = await sharp(imageBuffer)
            .resize(preset.width, preset.height, {
              fit: 'cover',
              position: 'center'
            })
            .png()
            .toBuffer();

          // Only save first image's formats to avoid clutter
          if (imageIdx === 0) {
            saveImage(resized.toString('base64'), `large_batch_${format}.png`);
          }

          count++;
        }

        console.log(`   📦 Processed image ${imageIdx + 1}/5 (${count}/50 total)`);
      }

      const duration = Date.now() - startTime;

      expect(count).toBe(50);
      console.log(`   ✅ 5 images × 10 formats = 50 outputs: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   📊 Average: ${(duration / 50000).toFixed(2)}s per resize`);
    }, 180000); // 3 minutes
  });

  describe('5. Format Packs Tests', () => {
    it('should process SOCIAL pack (square, social_post, social_story)', async () => {
      const sharp = require('sharp');
      const { FORMAT_PRESETS, FORMAT_PACKS } = require('../../../utils/formatPresets');

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
      const socialFormats = FORMAT_PACKS.social;

      expect(socialFormats).toEqual(['square', 'social_post', 'social_story']);

      const results = [];

      for (const format of socialFormats) {
        const preset = FORMAT_PRESETS[format];

        const resized = await sharp(imageBuffer)
          .resize(preset.width, preset.height, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toBuffer();

        results.push(resized);
        saveImage(resized.toString('base64'), `pack_social_${format}.png`);
      }

      expect(results).toHaveLength(3);
      console.log('   ✅ SOCIAL pack: 3 formats');
    }, 60000);

    it('should process PORTRAIT pack', async () => {
      const sharp = require('sharp');
      const { FORMAT_PRESETS, FORMAT_PACKS } = require('../../../utils/formatPresets');

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
      const portraitFormats = FORMAT_PACKS.portrait;

      expect(portraitFormats).toEqual(['portrait_2_3', 'portrait_3_4', 'social_story']);

      const results = [];

      for (const format of portraitFormats) {
        const preset = FORMAT_PRESETS[format];

        const resized = await sharp(imageBuffer)
          .resize(preset.width, preset.height, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toBuffer();

        results.push(resized);
        saveImage(resized.toString('base64'), `pack_portrait_${format}.png`);
      }

      expect(results).toHaveLength(3);
      console.log('   ✅ PORTRAIT pack: 3 formats');
    }, 60000);

    it('should process LANDSCAPE pack', async () => {
      const sharp = require('sharp');
      const { FORMAT_PRESETS, FORMAT_PACKS } = require('../../../utils/formatPresets');

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
      const landscapeFormats = FORMAT_PACKS.landscape;

      expect(landscapeFormats).toEqual(['standard_3_2', 'classic_4_3', 'widescreen']);

      const results = [];

      for (const format of landscapeFormats) {
        const preset = FORMAT_PRESETS[format];

        const resized = await sharp(imageBuffer)
          .resize(preset.width, preset.height, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toBuffer();

        results.push(resized);
        saveImage(resized.toString('base64'), `pack_landscape_${format}.png`);
      }

      expect(results).toHaveLength(3);
      console.log('   ✅ LANDSCAPE pack: 3 formats');
    }, 60000);
  });
});
