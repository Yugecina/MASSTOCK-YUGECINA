/**
 * Debug script to see the exact response from execute endpoint
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Create axios instance with credentials support
const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cookie storage
let cookies = '';

async function debugExecuteResponse() {
  console.log('🔍 Debugging Execute Endpoint Response\n');

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await client.post('/v1/auth/login', {
      email: 'estee@masstock.com',
      password: 'Estee123123'
    });

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    // Extract cookies from response
    if (loginResponse.headers['set-cookie']) {
      cookies = loginResponse.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
      console.log('Cookies extracted:', cookies.substring(0, 50) + '...');
    }

    if (!loginResponse.data.user) {
      console.error('❌ No user in login response');
      process.exit(1);
    }

    console.log(`✅ Logged in as ${loginResponse.data.user.email}\n`);

    // Step 2: Get workflows
    console.log('2. Getting workflows...');
    const workflowsResponse = await client.get('/workflows', {
      headers: { Cookie: cookies }
    });

    console.log('Workflows response structure:');
    console.log('- success:', workflowsResponse.data.success);
    console.log('- data keys:', Object.keys(workflowsResponse.data.data));
    console.log('- workflows count:', workflowsResponse.data.data.workflows?.length);

    const workflow = workflowsResponse.data.data.workflows.find(
      w => w.config.workflow_type === 'nano_banana'
    );

    if (!workflow) {
      console.log('\n❌ No nano_banana workflow found');
      console.log('Available workflows:');
      workflowsResponse.data.data.workflows.forEach(w => {
        console.log(`  - ${w.name} (type: ${w.config.workflow_type || 'standard'})`);
      });
      process.exit(1);
    }

    console.log(`✅ Found workflow: ${workflow.name}`);
    console.log(`   ID: ${workflow.id}\n`);

    // Step 3: Execute workflow
    console.log('3. Executing workflow...');
    console.log('   Using test API key from env...');

    const formData = new FormData();
    formData.append('prompts_text', 'Test prompt: A simple image');
    formData.append('api_key', process.env.GEMINI_API_KEY || 'test-key');

    console.log('\nSending request to:', `${API_URL}/workflows/${workflow.id}/execute`);
    console.log('Headers:', formData.getHeaders());

    const executeResponse = await client.post(
      `/workflows/${workflow.id}/execute`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Cookie: cookies
        },
        validateStatus: () => true // Accept any status code
      }
    );

    console.log('\n📋 EXECUTE RESPONSE:');
    console.log('Status:', executeResponse.status);
    console.log('Status Text:', executeResponse.statusText);
    console.log('\nFull Response Data:');
    console.log(JSON.stringify(executeResponse.data, null, 2));

    console.log('\n🔍 Response Structure Analysis:');
    console.log('- Type of response.data:', typeof executeResponse.data);
    console.log('- Is object?', typeof executeResponse.data === 'object');
    console.log('- Keys:', executeResponse.data ? Object.keys(executeResponse.data) : 'N/A');

    if (executeResponse.data?.success !== undefined) {
      console.log('- success:', executeResponse.data.success);
    }

    if (executeResponse.data?.data) {
      console.log('- data type:', typeof executeResponse.data.data);
      console.log('- data keys:', Object.keys(executeResponse.data.data));
      console.log('- execution_id:', executeResponse.data.data.execution_id);
    } else {
      console.log('- ❌ No "data" property in response');
    }

    if (executeResponse.data?.error) {
      console.log('- ❌ Error in response:', executeResponse.data.error);
    }

  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Message:', error.message);

    if (error.response) {
      console.error('\nResponse Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('\nNo response received');
      console.error('Request:', error.request);
    } else {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

debugExecuteResponse();
