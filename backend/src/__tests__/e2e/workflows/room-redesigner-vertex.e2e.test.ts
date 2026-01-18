/**
 * E2E Tests for Room Redesigner with Vertex AI
 *
 * Tests the complete Room Redesigner workflow with real Vertex AI API calls
 *
 * Requirements:
 * - GOOGLE_APPLICATION_CREDENTIALS must be set
 * - USE_VERTEX_AI=true in .env
 * - Test image at /Users/dorian/Downloads/1737554810749.jpeg
 *
 * Test Coverage:
 * - All 9 design styles
 * - All 4 budget levels
 * - All 5 seasons
 * - Empty room vs Furnished room scenarios
 * - Batch processing (multiple rooms)
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Room Redesigner - Vertex AI E2E Tests', () => {
  const TEST_OUTPUTS_DIR = path.join(__dirname, '../../../test-outputs/room-redesigner');
  const SOURCE_IMAGE_PATH = '/Users/dorian/Downloads/1737554810749.jpeg';

  const ALL_STYLES = [
    'modern',
    'minimalist',
    'industrial',
    'scandinavian',
    'contemporary',
    'coastal',
    'farmhouse',
    'midcentury',
    'traditional'
  ];

  const ALL_BUDGETS = ['low', 'medium', 'high', 'luxury'];
  const ALL_SEASONS = ['spring', 'summer', 'autumn', 'winter', 'noel'];

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

  // Helper to save redesigned room
  function saveImage(base64Data: string, filename: string): void {
    const buffer = Buffer.from(base64Data, 'base64');
    const filepath = path.join(TEST_OUTPUTS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    const sizeKB = (buffer.length / 1024).toFixed(2);
    console.log(`   💾 Saved: ${filename} (${sizeKB} KB)`);
  }

  // Helper to build Room Redesigner prompt
  function buildPrompt(style: string, budget: string, season: string | null = null): string {
    const budgetDescriptions: Record<string, string> = {
      low: 'affordable, functional furniture (IKEA-style)',
      medium: 'mid-range, quality furniture (West Elm / Crate & Barrel quality)',
      high: 'premium, designer furniture (Restoration Hardware level)',
      luxury: 'ultra-luxury, custom designer pieces'
    };

    const seasonalDecor: Record<string, string> = {
      spring: 'Add fresh spring flowers in vases, pastel accent pillows, light airy curtains',
      summer: 'Add tropical plants, bright light, beach-inspired accents',
      autumn: 'Add warm earth tones, cozy throw blankets, autumn leaves decoration',
      winter: 'Add layered textiles, warm lighting, winter cozy elements',
      noel: 'Add festive Christmas decorations, Christmas tree, wreaths, holiday lights'
    };

    let prompt = `Transform this room into a ${style} interior design style using ${budgetDescriptions[budget]}.

CRITICAL REQUIREMENTS FOR ARCHITECTURE:
1. PRESERVE EXACT ARCHITECTURE: Walls, windows, floors, ceilings MUST remain IDENTICAL
2. PRESERVE EXACT WINDOW DETAILS: Same number of panels, same frame color, same position
3. PRESERVE EXACT FLOORING: Keep exact same material and color
4. DO NOT modify built-in lighting fixtures, HVAC vents, or closet doors
5. DO NOT change wall colors or add architectural molding

FURNITURE PLACEMENT RULES:
- Replace ALL existing furniture with new ${style} style pieces
- You MAY change the furniture layout and arrangement
- Ensure proper spacing and functionality
- Match the budget level: ${budgetDescriptions[budget]}

DESIGN STYLE - ${style.toUpperCase()}:`;

    // Style-specific guidelines
    const styleGuidelines: Record<string, string> = {
      modern: 'Clean lines, neutral colors (white, gray, black), minimal ornamentation, sleek furniture',
      minimalist: 'Essential pieces only, monochrome palette, extreme simplicity, no clutter',
      industrial: 'Metal frames, leather upholstery, exposed materials, raw aesthetic',
      scandinavian: 'Light wood furniture, soft neutral tones, cozy textiles, natural light',
      contemporary: 'Current trends, mixed materials, bold accent pieces, artistic touches',
      coastal: 'Light and airy, natural textures, blue and white palette, beach-inspired',
      farmhouse: 'Rustic wood furniture, vintage pieces, warm neutral colors, country charm',
      midcentury: '1950s-60s iconic shapes, organic curves, wood and leather, retro vibes',
      traditional: 'Classic elegant furniture, rich wood tones, symmetry, timeless design'
    };

    prompt += `\n${styleGuidelines[style]}`;

    if (season) {
      prompt += `\n\nSEASONAL DECORATION:\n${seasonalDecor[season]}`;
    }

    return prompt;
  }

  describe('1. All Design Styles Test', () => {
    const stylesWithDescriptions = [
      { style: 'modern', desc: 'Clean lines, neutral colors' },
      { style: 'minimalist', desc: 'Essential pieces only' },
      { style: 'industrial', desc: 'Metal, leather, raw materials' },
      { style: 'scandinavian', desc: 'Light wood, soft neutrals' },
      { style: 'contemporary', desc: 'Current trends, mixed materials' },
      { style: 'coastal', desc: 'Light, airy, blue/white' },
      { style: 'farmhouse', desc: 'Rustic wood, vintage' },
      { style: 'midcentury', desc: '1950s-60s, organic curves' },
      { style: 'traditional', desc: 'Classic elegant, symmetry' },
    ];

    stylesWithDescriptions.forEach(({ style, desc }) => {
      it(`should redesign room in ${style} style (${desc})`, async () => {
        const { GoogleGenAI, Modality } = require('@google/genai');

        const client = new GoogleGenAI({
          vertexai: true,
          project: 'masstock-484117',
          location: 'global'
        });

        const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
        const base64Image = imageBuffer.toString('base64');

        const prompt = buildPrompt(style, 'medium', null);

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
              aspectRatio: '16:9'
            }
          }
        });

        const duration = Date.now() - startTime;

        const imagePart = response.candidates[0].content.parts.find(
          (part: any) => part.inlineData
        );

        expect(imagePart).toBeDefined();
        saveImage(imagePart.inlineData.data, `style_${style}.png`);

        console.log(`   ✅ ${style}: ${(duration / 1000).toFixed(2)}s - ${desc}`);
      }, 120000); // 2 minutes per style
    });
  });

  describe('2. All Budget Levels Test', () => {
    const budgetsWithDescriptions = [
      { budget: 'low', desc: 'IKEA-style functional' },
      { budget: 'medium', desc: 'West Elm quality' },
      { budget: 'high', desc: 'Restoration Hardware premium' },
      { budget: 'luxury', desc: 'Custom designer pieces' },
    ];

    budgetsWithDescriptions.forEach(({ budget, desc }) => {
      it(`should redesign with ${budget} budget (${desc})`, async () => {
        const { GoogleGenAI, Modality } = require('@google/genai');

        const client = new GoogleGenAI({
          vertexai: true,
          project: 'masstock-484117',
          location: 'global'
        });

        const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
        const base64Image = imageBuffer.toString('base64');

        const prompt = buildPrompt('modern', budget, null);

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
              aspectRatio: '16:9'
            }
          }
        });

        const duration = Date.now() - startTime;

        const imagePart = response.candidates[0].content.parts.find(
          (part: any) => part.inlineData
        );

        expect(imagePart).toBeDefined();
        saveImage(imagePart.inlineData.data, `budget_${budget}.png`);

        console.log(`   ✅ ${budget} budget: ${(duration / 1000).toFixed(2)}s - ${desc}`);
      }, 120000);
    });
  });

  describe('3. All Seasons Test', () => {
    const seasonsWithDescriptions = [
      { season: 'spring', desc: 'Fresh flowers, pastels' },
      { season: 'summer', desc: 'Tropical plants, bright' },
      { season: 'autumn', desc: 'Earth tones, cozy' },
      { season: 'winter', desc: 'Layered textiles, warm' },
      { season: 'noel', desc: 'Christmas decorations' },
    ];

    seasonsWithDescriptions.forEach(({ season, desc }) => {
      it(`should add ${season} seasonal decoration (${desc})`, async () => {
        const { GoogleGenAI, Modality } = require('@google/genai');

        const client = new GoogleGenAI({
          vertexai: true,
          project: 'masstock-484117',
          location: 'global'
        });

        const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
        const base64Image = imageBuffer.toString('base64');

        const prompt = buildPrompt('scandinavian', 'medium', season);

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
              aspectRatio: '16:9'
            }
          }
        });

        const duration = Date.now() - startTime;

        const imagePart = response.candidates[0].content.parts.find(
          (part: any) => part.inlineData
        );

        expect(imagePart).toBeDefined();
        saveImage(imagePart.inlineData.data, `season_${season}.png`);

        console.log(`   ✅ ${season}: ${(duration / 1000).toFixed(2)}s - ${desc}`);
      }, 120000);
    });
  });

  describe('4. Batch Processing Test', () => {
    it('should process 3 rooms in batch', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
      const base64Image = imageBuffer.toString('base64');

      const styles = ['modern', 'scandinavian', 'coastal'];
      const startTime = Date.now();

      for (let i = 0; i < styles.length; i++) {
        const style = styles[i];
        const prompt = buildPrompt(style, 'medium', null);

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
              aspectRatio: '16:9'
            }
          }
        });

        const imagePart = response.candidates[0].content.parts.find(
          (part: any) => part.inlineData
        );

        saveImage(imagePart.inlineData.data, `batch_room_${i + 1}_${style}.png`);
        console.log(`   📦 Processed room ${i + 1}/3 (${style})`);
      }

      const duration = Date.now() - startTime;

      console.log(`   ✅ 3 rooms batch: ${(duration / 1000).toFixed(2)}s total`);
      console.log(`   📊 Average: ${(duration / 3000).toFixed(2)}s per room`);
    }, 360000); // 6 minutes for 3 rooms
  });

  describe('5. Combined Scenarios Test', () => {
    it('should create luxury coastal room with summer decoration', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
      const base64Image = imageBuffer.toString('base64');

      const prompt = buildPrompt('coastal', 'luxury', 'summer');

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
            aspectRatio: '16:9'
          }
        }
      });

      const duration = Date.now() - startTime;

      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      saveImage(imagePart.inlineData.data, 'combined_luxury_coastal_summer.png');

      console.log(`   ✅ Luxury + Coastal + Summer: ${(duration / 1000).toFixed(2)}s`);
    }, 120000);

    it('should create traditional farmhouse room with Christmas decoration', async () => {
      const { GoogleGenAI, Modality } = require('@google/genai');

      const client = new GoogleGenAI({
        vertexai: true,
        project: 'masstock-484117',
        location: 'global'
      });

      const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
      const base64Image = imageBuffer.toString('base64');

      const prompt = buildPrompt('farmhouse', 'high', 'noel');

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
            aspectRatio: '16:9'
          }
        }
      });

      const duration = Date.now() - startTime;

      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      saveImage(imagePart.inlineData.data, 'combined_farmhouse_christmas.png');

      console.log(`   ✅ Farmhouse + Christmas: ${(duration / 1000).toFixed(2)}s`);
    }, 120000);
  });
});
