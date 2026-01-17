import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PROJECT_ID = 'masstock-484117';
const LOCATION = 'global'; // Comme demandé par l'utilisateur
const MODEL_FLASH = 'gemini-2.5-flash-image';
const MODEL_PRO = 'gemini-3-pro-image-preview';
const OUTPUT_DIR = path.join(__dirname, '..', 'test-outputs');
const TEST_IMAGE_PATH = '/Users/dorian/Downloads/1737554810749.jpeg';

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
  console.log('🚀 Initializing Vertex AI client...');
  console.log(`   Project: ${PROJECT_ID}`);
  console.log(`   Location: ${LOCATION}`);

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
 * Test 1: Simple image generation with different aspect ratios
 */
async function testAspectRatios(client: GoogleGenAI): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📐 TEST 1: Different Aspect Ratios');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const aspectRatios = [
    { ratio: '1:1', name: 'square' },
    { ratio: '16:9', name: 'widescreen' },
    { ratio: '9:16', name: 'portrait_story' },
    { ratio: '4:3', name: 'classic' },
    { ratio: '3:4', name: 'portrait_3_4' },
    { ratio: '2:3', name: 'portrait_photo' },
    { ratio: '3:2', name: 'landscape_photo' },
  ];

  const prompt = 'A professional product photo of a luxury watch on a minimalist white background, studio lighting, high-end commercial photography';

  for (const { ratio, name } of aspectRatios) {
    const testName = `Aspect Ratio ${ratio} (${name})`;
    const startTime = Date.now();

    try {
      console.log(`🔍 Testing ${ratio} (${name})...`);

      const response = await client.models.generateContent({
        model: MODEL_FLASH,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          imageConfig: {
            aspectRatio: ratio
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
      const filename = `test_ratio_${ratio.replace(':', '-')}_${name}.${extension}`;
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
 * Test 2: Different image sizes (Pro model only)
 */
async function testImageSizes(client: GoogleGenAI): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📏 TEST 2: Different Image Sizes (Pro Model)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const imageSizes = ['1K', '2K', '4K'];
  const prompt = 'A cinematic landscape photo of a mountain range at sunset, dramatic clouds, golden hour lighting, professional photography';
  const aspectRatio = '16:9';

  for (const imageSize of imageSizes) {
    const testName = `Image Size ${imageSize} (16:9)`;
    const startTime = Date.now();

    try {
      console.log(`🔍 Testing ${imageSize}...`);

      const response = await client.models.generateContent({
        model: MODEL_PRO,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          imageConfig: {
            aspectRatio,
            imageSize
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
      const filename = `test_size_${imageSize}_${aspectRatio.replace(':', '-')}.${extension}`;
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
 * Test 3: Smart Resizer with reference image
 */
async function testSmartResizer(client: GoogleGenAI): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 TEST 3: Smart Resizer with Reference Image');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check if reference image exists
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log(`❌ Reference image not found: ${TEST_IMAGE_PATH}\n`);
    results.push({
      name: 'Smart Resizer Test',
      success: false,
      duration: 0,
      error: 'Reference image not found'
    });
    return;
  }

  // Read and encode reference image
  const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
  const base64Image = imageBuffer.toString('base64');

  console.log(`📸 Using reference image: ${path.basename(TEST_IMAGE_PATH)}`);
  console.log(`   File size: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

  // Copy original to output for comparison
  fs.copyFileSync(TEST_IMAGE_PATH, path.join(OUTPUT_DIR, 'original.jpeg'));

  const targetRatios = [
    { ratio: '1:1', name: 'square' },
    { ratio: '16:9', name: 'widescreen' },
    { ratio: '9:16', name: 'portrait_story' }
  ];

  for (const { ratio, name } of targetRatios) {
    const testName = `Smart Resizer to ${ratio}`;
    const startTime = Date.now();

    try {
      console.log(`🔍 Resizing to ${ratio} (${name})...`);

      // Smart Resizer prompt (exact copy from smartResizerService.ts)
      const prompt = `Transform this image to a ${ratio} aspect ratio by intelligently reorganizing and expanding the composition.

CRITICAL REQUIREMENTS:
1. DO NOT add black borders or letterboxing
2. DO NOT simply crop or stretch the image
3. PRESERVE all text content exactly as written (same fonts, colors, sizes)
4. PRESERVE all logos and brand elements exactly
5. EXPAND the background/scene naturally to fill the new dimensions
6. RECOMPOSE the layout to fit ${ratio} while maintaining visual balance
7. The final image must be a complete, full-bleed ${ratio} composition

Think of this as creating a new ${ratio} version of the same creative, not just resizing it.`;

      const response = await client.models.generateContent({
        model: MODEL_PRO,
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
            aspectRatio: ratio
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
      const filename = `resized_${ratio.replace(':', '-')}_${name}.${extension}`;
      const fileSize = saveImage(imageData, filename);

      const duration = Date.now() - startTime;

      console.log(`   ✅ Resized in ${(duration / 1000).toFixed(2)}s`);
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
  console.log('📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = totalTests - successfulTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const totalSize = results.reduce((sum, r) => sum + (r.fileSize || 0), 0);

  console.log(`Total tests: ${totalTests}`);
  console.log(`✅ Successful: ${successfulTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⏱️  Total time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

  if (failedTests > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ❌ ${r.name}: ${r.error}`);
    });
    console.log();
  }

  console.log(`📁 All images saved to: ${OUTPUT_DIR}\n`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Vertex AI Comprehensive Test Suite  ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Verify environment
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not set');
    process.exit(1);
  }

  // Initialize
  ensureOutputDir();
  const client = initClient();

  // Run tests
  await testAspectRatios(client);
  await testImageSizes(client);
  await testSmartResizer(client);

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
