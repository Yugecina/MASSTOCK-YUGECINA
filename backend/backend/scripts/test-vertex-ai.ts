/**
 * Test Script: Vertex AI Image Generation
 * Tests both Flash and Pro models
 */

import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../.env') });

// Import service after env is loaded
import vertexAIService from '../src/services/vertexAIImageService';

async function testFlash() {
  console.log('\n🧪 Testing Nano Banana Flash (gemini-2.5-flash-image)...\n');

  try {
    // Set model to Flash
    (vertexAIService as any).setModel('gemini-2.5-flash-image');

    const result = await (vertexAIService as any).generateImage(
      'Generate a simple red circle on white background',
      { aspectRatio: '1:1' }
    );

    if (result.success) {
      console.log('✅ Flash Test SUCCESS:', {
        model: result.model,
        processingTimeMs: result.processingTimeMs,
        imageDataLength: result.imageData?.length,
        mimeType: result.mimeType
      });
    } else {
      console.error('❌ Flash Test FAILED:', result.error);
    }

    return result.success;
  } catch (error: any) {
    console.error('❌ Flash Test EXCEPTION:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

async function testPro() {
  console.log('\n🧪 Testing Nano Banana Pro (gemini-3-pro-image-preview)...\n');

  try {
    // Set model to Pro
    (vertexAIService as any).setModel('gemini-3-pro-image-preview');

    const result = await (vertexAIService as any).generateImage(
      'Generate a simple blue square on white background',
      { aspectRatio: '1:1' }
    );

    if (result.success) {
      console.log('✅ Pro Test SUCCESS:', {
        model: result.model,
        processingTimeMs: result.processingTimeMs,
        imageDataLength: result.imageData?.length,
        mimeType: result.mimeType
      });
    } else {
      console.error('❌ Pro Test FAILED:', result.error);
    }

    return result.success;
  } catch (error: any) {
    console.error('❌ Pro Test EXCEPTION:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

async function main() {
  console.log('🚀 Vertex AI Image Generation Test Suite\n');
  console.log('Project:', process.env.GOOGLE_CLOUD_PROJECT);
  console.log('Location:', process.env.GOOGLE_CLOUD_LOCATION);
  console.log('Credentials:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('---\n');

  const flashSuccess = await testFlash();
  const proSuccess = await testPro();

  console.log('\n📊 Test Summary:');
  console.log('  Flash:', flashSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('  Pro:', proSuccess ? '✅ PASS' : '❌ FAIL');

  process.exit(flashSuccess && proSuccess ? 0 : 1);
}

main().catch(console.error);
