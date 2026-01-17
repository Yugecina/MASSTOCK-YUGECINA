import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PROJECT_ID = 'masstock-484117';
const LOCATION = 'global';
const MODEL = 'gemini-3-pro-image-preview';
const OUTPUT_DIR = path.join(__dirname, '..', 'test-outputs', 'room-redesigner');
const SOURCE_IMAGE_PATH = '/Users/dorian/Downloads/1737554810749.jpeg';

// Test results tracking
interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  fileSize?: number;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Initialize Google GenAI client
 */
function initClient(): GoogleGenAI {
  console.log('🚀 Initializing Vertex AI client for Room Redesigner...');
  console.log(`   Project: ${PROJECT_ID}`);
  console.log(`   Location: ${LOCATION}`);
  console.log(`   Model: ${MODEL}\n`);

  const client = new GoogleGenAI({
    vertexai: true,
    project: PROJECT_ID,
    location: LOCATION,
  });

  console.log('✅ Client initialized\n');
  return client;
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
  }
}

/**
 * Save base64 image to file
 */
function saveImage(base64Data: string, filename: string): number {
  const buffer = Buffer.from(base64Data, 'base64');
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return buffer.length;
}

/**
 * Build Room Redesigner prompt
 */
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

/**
 * Test all design styles
 */
async function testDesignStyles(client: GoogleGenAI): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 TEST 1: All Design Styles (9 styles)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const styles = [
    { name: 'modern', desc: 'Clean lines, neutral colors' },
    { name: 'minimalist', desc: 'Essential pieces only' },
    { name: 'industrial', desc: 'Metal, leather, raw materials' },
    { name: 'scandinavian', desc: 'Light wood, soft neutrals' },
    { name: 'contemporary', desc: 'Current trends, mixed materials' },
    { name: 'coastal', desc: 'Light, airy, blue/white' },
    { name: 'farmhouse', desc: 'Rustic wood, vintage' },
    { name: 'midcentury', desc: '1950s-60s, organic curves' },
    { name: 'traditional', desc: 'Classic elegant, symmetry' },
  ];

  // Read source image
  const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
  const base64Image = imageBuffer.toString('base64');

  for (const { name, desc } of styles) {
    const testName = `Style: ${name}`;
    const startTime = Date.now();

    try {
      console.log(`🔍 Testing ${name} style (${desc})...`);

      const prompt = buildPrompt(name, 'medium', null);

      const response = await client.models.generateContent({
        model: MODEL,
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

      // Extract image from response
      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (part: any) => part.inlineData
      );

      if (!imagePart) {
        throw new Error('No image found in response');
      }

      const imageData = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;

      // Save image
      const extension = mimeType?.includes('png') ? 'png' : 'jpeg';
      const filename = `style_${name}.${extension}`;
      const fileSize = saveImage(imageData, filename);

      const duration = Date.now() - startTime;

      console.log(`   ✅ Generated in ${(duration / 1000).toFixed(2)}s`);
      console.log(`   📦 File size: ${(fileSize / 1024).toFixed(2)} KB`);
      console.log(`   💾 Saved as: ${filename}\n`);

      results.push({
        name: testName,
        success: true,
        duration,
        fileSize
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.log(`   ❌ Failed: ${errorMessage}\n`);

      results.push({
        name: testName,
        success: false,
        duration,
        error: errorMessage
      });
    }
  }
}

/**
 * Test all budget levels
 */
async function testBudgetLevels(client: GoogleGenAI): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 TEST 2: All Budget Levels (4 levels)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const budgets = [
    { name: 'low', desc: 'IKEA-style functional' },
    { name: 'medium', desc: 'West Elm quality' },
    { name: 'high', desc: 'Restoration Hardware premium' },
    { name: 'luxury', desc: 'Custom designer pieces' },
  ];

  // Read source image
  const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
  const base64Image = imageBuffer.toString('base64');

  for (const { name, desc } of budgets) {
    const testName = `Budget: ${name}`;
    const startTime = Date.now();

    try {
      console.log(`🔍 Testing ${name} budget (${desc})...`);

      const prompt = buildPrompt('modern', name, null);

      const response = await client.models.generateContent({
        model: MODEL,
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

      // Extract image from response
      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (part: any) => part.inlineData
      );

      if (!imagePart) {
        throw new Error('No image found in response');
      }

      const imageData = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;

      // Save image
      const extension = mimeType?.includes('png') ? 'png' : 'jpeg';
      const filename = `budget_${name}.${extension}`;
      const fileSize = saveImage(imageData, filename);

      const duration = Date.now() - startTime;

      console.log(`   ✅ Generated in ${(duration / 1000).toFixed(2)}s`);
      console.log(`   📦 File size: ${(fileSize / 1024).toFixed(2)} KB`);
      console.log(`   💾 Saved as: ${filename}\n`);

      results.push({
        name: testName,
        success: true,
        duration,
        fileSize
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.log(`   ❌ Failed: ${errorMessage}\n`);

      results.push({
        name: testName,
        success: false,
        duration,
        error: errorMessage
      });
    }
  }
}

/**
 * Test all seasons
 */
async function testSeasons(client: GoogleGenAI): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌸 TEST 3: All Seasons (5 seasons)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const seasons = [
    { name: 'spring', desc: 'Fresh flowers, pastels' },
    { name: 'summer', desc: 'Tropical plants, bright' },
    { name: 'autumn', desc: 'Earth tones, cozy' },
    { name: 'winter', desc: 'Layered textiles, warm' },
    { name: 'noel', desc: 'Christmas decorations' },
  ];

  // Read source image
  const imageBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
  const base64Image = imageBuffer.toString('base64');

  for (const { name, desc } of seasons) {
    const testName = `Season: ${name}`;
    const startTime = Date.now();

    try {
      console.log(`🔍 Testing ${name} season (${desc})...`);

      const prompt = buildPrompt('scandinavian', 'medium', name);

      const response = await client.models.generateContent({
        model: MODEL,
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

      // Extract image from response
      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (part: any) => part.inlineData
      );

      if (!imagePart) {
        throw new Error('No image found in response');
      }

      const imageData = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;

      // Save image
      const extension = mimeType?.includes('png') ? 'png' : 'jpeg';
      const filename = `season_${name}.${extension}`;
      const fileSize = saveImage(imageData, filename);

      const duration = Date.now() - startTime;

      console.log(`   ✅ Generated in ${(duration / 1000).toFixed(2)}s`);
      console.log(`   📦 File size: ${(fileSize / 1024).toFixed(2)} KB`);
      console.log(`   💾 Saved as: ${filename}\n`);

      results.push({
        name: testName,
        success: true,
        duration,
        fileSize
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.log(`   ❌ Failed: ${errorMessage}\n`);

      results.push({
        name: testName,
        success: false,
        duration,
        error: errorMessage
      });
    }
  }
}

/**
 * Print final summary
 */
function printSummary(): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ROOM REDESIGNER TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = totalTests - successfulTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const totalSize = results.reduce((sum, r) => sum + (r.fileSize || 0), 0);

  console.log(`Total tests: ${totalTests}`);
  console.log(`✅ Successful: ${successfulTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⏱️  Total time: ${(totalDuration / 1000).toFixed(2)}s (${(totalDuration / 60000).toFixed(2)} minutes)`);
  console.log(`💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

  if (failedTests > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ❌ ${r.name}: ${r.error}`);
    });
    console.log();
  }

  console.log(`📁 All images saved to: ${OUTPUT_DIR}\n`);

  // Average time per test
  if (successfulTests > 0) {
    const avgTime = totalDuration / successfulTests;
    console.log(`📊 Average time per test: ${(avgTime / 1000).toFixed(2)}s`);
  }

  // Estimated cost
  const costPerImage = 0.039; // Pro model
  const estimatedCost = successfulTests * costPerImage;
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(2)} (${successfulTests} images × $${costPerImage})\n`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Room Redesigner - Vertex AI Tests   ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Verify environment
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not set');
    process.exit(1);
  }

  // Verify source image exists
  if (!fs.existsSync(SOURCE_IMAGE_PATH)) {
    console.error(`❌ Source image not found: ${SOURCE_IMAGE_PATH}`);
    process.exit(1);
  }

  console.log(`📸 Using source image: ${path.basename(SOURCE_IMAGE_PATH)}\n`);

  // Initialize
  ensureOutputDir();
  const client = initClient();

  // Run tests
  await testDesignStyles(client);
  await testBudgetLevels(client);
  await testSeasons(client);

  // Print summary
  printSummary();

  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
