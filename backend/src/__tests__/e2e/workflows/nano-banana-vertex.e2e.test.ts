/**
 * E2E Tests for Nano Banana with Vertex AI
 *
 * Tests the complete Nano Banana workflow with real Vertex AI API calls
 *
 * Requirements:
 * - GOOGLE_APPLICATION_CREDENTIALS must be set
 * - USE_VERTEX_AI=true in .env
 * - Real Gemini API key for pricing calculations
 *
 * Test Coverage:
 * - All 7 aspect ratios
 * - All 3 resolutions (Pro model)
 * - Reference images (1, 5, 14 max)
 * - Both Flash and Pro models
 * - Batch processing
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Nano Banana - Vertex AI E2E Tests', () => {
  const TEST_OUTPUTS_DIR = path.join(__dirname, '../../../test-outputs/nano-banana');
  const REFERENCE_IMAGE_PATH = '/Users/dorian/Downloads/1737554810749.jpeg';

  beforeAll(() => {
    // Create output directory
    if (!fs.existsSync(TEST_OUTPUTS_DIR)) {
      fs.mkdirSync(TEST_OUTPUTS_DIR, { recursive: true });
    }

    // Verify environment
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set');
    }

    if (!process.env.USE_VERTEX_AI || process.env.USE_VERTEX_AI !== 'true') {
      console.warn('⚠️  USE_VERTEX_AI is not set to true - tests may use Google AI Studio instead');
    }
  });

  // Helper to save generated image
  function saveImage(base64Data: string, filename: string): void {
    const buffer = Buffer.from(base64Data, 'base64');
    const filepath = path.join(TEST_OUTPUTS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`   💾 Saved: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);
  }

  describe('1. Aspect Ratio Tests (Flash Model)', () => {
    const testPrompt = 'A professional product photo of a luxury watch on a minimalist white background';

    const aspectRatios = [
      { ratio: '1:1', name: 'square', description: 'Instagram square' },
      { ratio: '16:9', name: 'widescreen', description: 'YouTube landscape' },
      { ratio: '9:16', name: 'portrait_story', description: 'Instagram Stories' },
      { ratio: '4:3', name: 'classic', description: 'Classic TV' },
      { ratio: '3:4', name: 'portrait_3_4', description: 'Portrait traditional' },
      { ratio: '2:3', name: 'portrait_photo', description: 'Portrait photo' },
      { ratio: '3:2', name: 'landscape_photo', description: 'Landscape photo' },
    ];

    aspectRatios.forEach(({ ratio, name, description }) => {
      it(`should generate image with ${ratio} aspect ratio (${description})`, async () => {
        const { GoogleGenAI, Modality } = require('@google/genai');

        const client = new GoogleGenAI({
          vertexai: true,
          project: 'masstock-484117',
          location: 'global'
        });

        const startTime = Date.now();

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{
            role: 'user',
            parts: [{ text: testPrompt }]
          }],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
            imageConfig: {
              aspectRatio: ratio
            }
          }
        });

        const duration = Date.now() - startTime;

        // Verify response
        expect(response).toBeDefined();
        expect(response.candidates).toBeDefined();
        expect(response.candidates.length).toBeGreaterThan(0);

        // Extract image
        const imagePart = response.candidates[0].content.parts.find(
          (part: any) => part.inlineData
        );

        expect(imagePart).toBeDefined();
        expect(imagePart.inlineData.data).toBeDefined();
        expect(imagePart.inlineData.mimeType).toMatch(/image\/(png|jpeg)/);

        // Save image
        saveImage(
          imagePart.inlineData.data,
          `ratio_${ratio.replace(':', '-')}_${name}.png`
        );

        console.log(`   ✅ ${ratio} - ${description}: ${(duration / 1000).toFixed(2)}s`);

        // Verify reasonable generation time
        expect(duration).toBeLessThan(30000); // Max 30s for Flash model
      }, 60000); // 60s timeout
    });
  });

  describe('2. Resolution Tests (Pro Model)', () => {
    const testPrompt = 'A cinematic landscape photo of mountains at sunset, dramatic clouds, golden hour';

    const resolutions = [
      { size: '1K', description: '1024px', expectedTime: 20000 },
      { size: '2K', description: '2048px', expectedTime: 60000 },
      { size: '4K', description: '4096px', expectedTime: 120000 },
    ];

    resolutions.forEach(({ size, description, expectedTime }) => {
      it(`should generate ${size} resolution image (${description})`, async () => {
        const { GoogleGenAI, Modality } = require('@google/genai');

        const client = new GoogleGenAI({
          vertexai: true,
          project: 'masstock-484117',
          location: 'global'
        });

        const startTime = Date.now();

        const response = await client.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: [{
            role: 'user',
            parts: [{ text: testPrompt }]
          }],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
            imageConfig: {
              aspectRatio: '16:9',
              imageSize: size
            }
          }
        });

        const duration = Date.now() - startTime;

        // Verify response
        expect(response).toBeDefined();
        expect(response.candidates).toBeDefined();

        // Extract image
        const imagePart = response.candidates[0].content.parts.find(
          (part: any) => part.inlineData
        );

        expect(imagePart).toBeDefined();

        // Save image
        const filename = `resolution_${size}_16-9.png`;
        saveImage(imagePart.inlineData.data, filename);

        const filePath = path.join(TEST_OUTPUTS_DIR, filename);
        const fileStats = fs.statSync(filePath);

        console.log(`   ✅ ${size}: ${(duration / 1000).toFixed(2)}s, ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

        // Verify generation time is reasonable
        expect(duration).toBeLessThan(expectedTime);

        // Verify larger resolutions produce larger files
        if (size === '4K') {
          expect(fileStats.size).toBeGreaterThan(5 * 1024 * 1024); // >5MB
        } else if (size === '2K') {
          expect(fileStats.size).toBeGreaterThan(2 * 1024 * 1024); // >2MB
        }
      }, 180000); // 3 minutes timeout for 4K
    });
  });

  describe('3. Reference Image Tests', () => {
    const testPrompt = 'Create a variation of this image with vibrant colors and modern style';

    beforeAll(() => {
      // Verify reference image exists
      if (!fs.existsSync(REFERENCE_IMAGE_PATH)) {
        throw new Error(`Reference image not found: ${REFERENCE_IMAGE_PATH}`);
      }
    });

    it('should generate image with 1 reference image', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      // Read reference image
      const imageBuffer = fs.readFileSync(REFERENCE_IMAGE_PATH);
      const base64Image = imageBuffer.toString('base64');

      const startTime = Date.now();

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          role: 'user',
          parts: [
            { text: testPrompt },
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
            aspectRatio: '1:1'
          }
        }
      });

      const duration = Date.now() - startTime;

      // Verify response
      expect(response).toBeDefined();
      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      expect(imagePart).toBeDefined();
      saveImage(imagePart.inlineData.data, 'with_1_reference.png');

      console.log(`   ✅ 1 reference image: ${(duration / 1000).toFixed(2)}s`);
    }, 60000);

    it('should generate image with 5 reference images', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      // Use same image 5 times (for testing)
      const imageBuffer = fs.readFileSync(REFERENCE_IMAGE_PATH);
      const base64Image = imageBuffer.toString('base64');

      const parts: any[] = [{ text: testPrompt }];
      for (let i = 0; i < 5; i++) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        });
      }

      const startTime = Date.now();

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          role: 'user',
          parts
        }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          imageConfig: {
            aspectRatio: '1:1'
          }
        }
      });

      const duration = Date.now() - startTime;

      // Verify response
      expect(response).toBeDefined();
      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      expect(imagePart).toBeDefined();
      saveImage(imagePart.inlineData.data, 'with_5_references.png');

      console.log(`   ✅ 5 reference images: ${(duration / 1000).toFixed(2)}s`);
    }, 60000);

    it('should generate image with 14 reference images (max)', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      // Use same image 14 times (max limit)
      const imageBuffer = fs.readFileSync(REFERENCE_IMAGE_PATH);
      const base64Image = imageBuffer.toString('base64');

      const parts: any[] = [{ text: testPrompt }];
      for (let i = 0; i < 14; i++) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        });
      }

      const startTime = Date.now();

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          role: 'user',
          parts
        }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          imageConfig: {
            aspectRatio: '1:1'
          }
        }
      });

      const duration = Date.now() - startTime;

      // Verify response
      expect(response).toBeDefined();
      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      expect(imagePart).toBeDefined();
      saveImage(imagePart.inlineData.data, 'with_14_references.png');

      console.log(`   ✅ 14 reference images (max): ${(duration / 1000).toFixed(2)}s`);
    }, 60000);
  });

  describe('4. Model Comparison Tests', () => {
    const testPrompt = 'A futuristic city at night with neon lights and flying cars';

    it('should generate with Flash model (fast)', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      const startTime = Date.now();

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          role: 'user',
          parts: [{ text: testPrompt }]
        }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          imageConfig: {
            aspectRatio: '16:9'
          }
        }
      });

      const duration = Date.now() - startTime;

      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      saveImage(imagePart.inlineData.data, 'model_flash.png');
      console.log(`   ✅ Flash model: ${(duration / 1000).toFixed(2)}s`);

      // Flash should be fast
      expect(duration).toBeLessThan(15000);
    }, 30000);

    it('should generate with Pro model (high quality)', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      const startTime = Date.now();

      const response = await client.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: [{
          role: 'user',
          parts: [{ text: testPrompt }]
        }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          imageConfig: {
            aspectRatio: '16:9',
            imageSize: '1K'
          }
        }
      });

      const duration = Date.now() - startTime;

      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      saveImage(imagePart.inlineData.data, 'model_pro.png');
      console.log(`   ✅ Pro model: ${(duration / 1000).toFixed(2)}s`);

      // Pro is slower but still reasonable
      expect(duration).toBeLessThan(30000);
    }, 60000);
  });

  describe('5. Batch Processing Tests', () => {
    it('should generate 3 images in sequence', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      const prompts = [
        'A red sports car on a mountain road',
        'A blue ocean wave crashing on the beach',
        'A green forest with sunlight filtering through trees'
      ];

      const startTime = Date.now();
      const results = [];

      for (let i = 0; i < prompts.length; i++) {
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{
            role: 'user',
            parts: [{ text: prompts[i] }]
          }],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
            imageConfig: {
              aspectRatio: '1:1'
            }
          }
        });

        const imagePart = response.candidates[0].content.parts.find(
          (part: any) => part.inlineData
        );

        results.push(imagePart.inlineData.data);
        saveImage(imagePart.inlineData.data, `batch_${i + 1}_of_3.png`);
      }

      const duration = Date.now() - startTime;

      expect(results).toHaveLength(3);
      console.log(`   ✅ 3 images batch: ${(duration / 1000).toFixed(2)}s total`);
      console.log(`   📊 Average: ${(duration / 3000).toFixed(2)}s per image`);
    }, 90000);
  });
});
