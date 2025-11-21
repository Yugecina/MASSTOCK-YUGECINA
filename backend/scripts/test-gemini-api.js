/**
 * Test Gemini Image API directly
 *
 * Usage: node scripts/test-gemini-api.js
 */

require('dotenv').config();
const { createGeminiImageService } = require('../src/services/geminiImageService');
const { logger } = require('../src/config/logger');

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini Image API...\n');

  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('\nPlease set your Gemini API key:');
    console.log('export GEMINI_API_KEY="your-key-here"');
    console.log('\nOr add it to your .env file:');
    console.log('GEMINI_API_KEY=your-key-here');
    process.exit(1);
  }

  console.log(`✅ API Key found (length: ${apiKey.length})\n`);

  // Create service instance
  const geminiService = createGeminiImageService(apiKey);

  // Test prompt
  const testPrompt = "A cute cat wearing sunglasses";

  console.log(`📝 Test Prompt: "${testPrompt}"\n`);
  console.log('⏳ Generating image...\n');

  try {
    const result = await geminiService.generateImage(testPrompt, {
      aspectRatio: '1:1'
    });

    if (result.success) {
      console.log('✅ Image generated successfully!\n');
      console.log('📊 Result details:');
      console.log(`   - Processing time: ${result.processingTimeMs}ms`);
      console.log(`   - MIME type: ${result.mimeType}`);
      console.log(`   - Cost: $${result.cost}`);
      console.log(`   - Model: ${result.model}`);
      console.log(`   - Image size: ${result.imageData?.length || 0} bytes`);

      if (result.imageData) {
        const fs = require('fs');
        const testImagePath = '/tmp/gemini-test-image.png';
        fs.writeFileSync(testImagePath, Buffer.from(result.imageData, 'base64'));
        console.log(`\n💾 Test image saved to: ${testImagePath}`);
      }
    } else {
      console.error('❌ Image generation failed:\n');
      console.error(result.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:\n');
    console.error(error);
    process.exit(1);
  }
}

// Run test
testGeminiAPI()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
