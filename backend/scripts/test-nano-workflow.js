/**
 * Test Nano Banana Workflow End-to-End
 *
 * This script tests the complete workflow from API request to image generation
 *
 * Usage: node scripts/test-nano-workflow.js
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testNanoBananaWorkflow() {
  console.log('🧪 Testing Nano Banana Workflow End-to-End\n');

  // Check for required environment variables
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('\nPlease set your Gemini API key:');
    console.log('export GEMINI_API_KEY="your-key-here"');
    process.exit(1);
  }

  // Test credentials - adjust these for your test user
  const TEST_EMAIL = 'estee@masstock.com';
  const TEST_PASSWORD = 'password123';

  try {
    // Step 1: Login
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_URL}/v1/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const { token } = loginResponse.data.data;
    console.log('✅ Logged in successfully\n');

    // Step 2: Get Nano Banana workflow
    console.log('📝 Step 2: Fetching workflows...');
    const workflowsResponse = await axios.get(`${API_URL}/workflows`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const nanoBananaWorkflow = workflowsResponse.data.data.workflows.find(
      w => w.config.workflow_type === 'nano_banana'
    );

    if (!nanoBananaWorkflow) {
      console.error('❌ Nano Banana workflow not found');
      process.exit(1);
    }

    console.log(`✅ Found workflow: ${nanoBananaWorkflow.name} (${nanoBananaWorkflow.id})\n`);

    // Step 3: Execute workflow
    console.log('📝 Step 3: Executing workflow...');

    const formData = new FormData();
    formData.append('prompts_text', 'A cute cat wearing sunglasses on a beach');
    formData.append('api_key', process.env.GEMINI_API_KEY);

    const executeResponse = await axios.post(
      `${API_URL}/workflows/${nanoBananaWorkflow.id}/execute`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('Execute Response:', JSON.stringify(executeResponse.data, null, 2));

    if (!executeResponse.data || !executeResponse.data.data) {
      console.error('❌ Invalid response from execute endpoint');
      console.error('Response:', executeResponse.data);
      process.exit(1);
    }

    const executionId = executeResponse.data.data.execution_id;

    if (!executionId) {
      console.error('❌ No execution_id in response');
      console.error('Response data:', executeResponse.data.data);
      process.exit(1);
    }

    console.log(`✅ Workflow execution queued: ${executionId}\n`);

    // Step 4: Poll for completion
    console.log('📝 Step 4: Waiting for completion...');
    let execution;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await axios.get(
        `${API_URL}/executions/${executionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      execution = statusResponse.data.data;
      console.log(`   Status: ${execution.status} (${execution.progress}%)`);

      if (execution.status === 'completed' || execution.status === 'failed') {
        break;
      }

      attempts++;
    }

    if (execution.status === 'completed') {
      console.log('\n✅ Workflow completed successfully!\n');

      // Step 5: Get batch results
      console.log('📝 Step 5: Fetching batch results...');
      const resultsResponse = await axios.get(
        `${API_URL}/executions/${executionId}/batch-results`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { results, stats } = resultsResponse.data.data;

      console.log('\n📊 Results:');
      console.log(`   Total prompts: ${stats.total_prompts}`);
      console.log(`   Successful: ${stats.successful}`);
      console.log(`   Failed: ${stats.failed}`);
      console.log(`   Total cost: $${stats.total_cost}`);

      if (results.length > 0) {
        console.log('\n🖼️ Generated Images:');
        results.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.status}: ${result.result_url || result.error_message}`);
        });
      }

    } else if (execution.status === 'failed') {
      console.error('\n❌ Workflow execution failed:');
      console.error(`   Error: ${execution.error_message}`);
      process.exit(1);
    } else {
      console.error('\n⏱️ Workflow timed out (still processing)');
      process.exit(1);
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   URL: ${error.config?.url}`);
      console.error(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('   No response received from server');
      console.error(`   URL: ${error.config?.url}`);
      console.error(`   Error: ${error.message}`);
    } else {
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run test
testNanoBananaWorkflow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
