/**
 * Test script for Vertex AI connection
 *
 * Verifies:
 * - Service Account authentication works
 * - Can connect to Vertex AI API
 * - Can generate a simple test image
 *
 * Usage: npx ts-node scripts/test-vertex-ai.ts
 */

import dotenv from 'dotenv';
import { VertexAIImageService } from '../src/services/vertexAIImageService';

// Load environment variables
dotenv.config();

async function testVertexAI() {
  console.log('🧪 Testing Vertex AI Connection...\n');

  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log(`   GOOGLE_CLOUD_PROJECT: ${process.env.GOOGLE_CLOUD_PROJECT || '❌ NOT SET'}`);
  console.log(`   GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ NOT SET'}`);
  console.log('');

  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    console.error('❌ GOOGLE_CLOUD_PROJECT environment variable is not set');
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
    process.exit(1);
  }

  try {
    // Initialize service
    console.log('🚀 Initializing Vertex AI Image Service...');
    const service = new VertexAIImageService();
    console.log('✅ Service initialized successfully\n');

    // Test with Pro model (high quality image generation)
    console.log('🎨 Testing image generation with Pro model...');
    service.setModel('gemini-3-pro-image-preview');

    const testPrompt = 'A simple minimalist icon of a green checkmark on white background';

    console.log(`   Prompt: "${testPrompt}"`);
    console.log('   Generating...\n');

    const startTime = Date.now();
    const result = await service.generateImage(testPrompt, {
      aspectRatio: '1:1'
    });
    const duration = Date.now() - startTime;

    if (result.success) {
      console.log('✅ Image generation SUCCESSFUL!');
      console.log(`   Processing time: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Image size: ${result.imageData?.length || 0} chars (base64)`);
      console.log(`   MIME type: ${result.mimeType}`);
      console.log(`   Model: ${result.model}`);
      console.log(`   Cost: $${result.cost}`);
      console.log('');
      console.log('🎉 Vertex AI connection test PASSED!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Update workflow-worker.ts to use Vertex AI service');
      console.log('  2. Update rate limiter with new Vertex AI quotas');
      console.log('  3. Test a real workflow execution');
      process.exit(0);
    } else {
      console.error('❌ Image generation FAILED');
      console.error(`   Error code: ${result.error?.code}`);
      console.error(`   Error message: ${result.error?.message}`);
      console.error(`   Original error: ${result.error?.originalError}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test FAILED with exception:');
    console.error(error);
    process.exit(1);
  }
}

// Run test
testVertexAI();
