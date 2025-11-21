const axios = require('axios');

async function test() {
  try {
    // Login as Estee
    console.log('🔐 Logging in as Estee...\n');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'estee@masstock.com',
      password: 'estee123'
    });

    const token = loginRes.data.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Get workflows
    console.log('📦 Fetching workflows...\n');
    const workflowsRes = await axios.get('http://localhost:3000/api/workflows', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Workflows Response:');
    console.log('Status:', workflowsRes.status);
    console.log('Data structure:', JSON.stringify(workflowsRes.data, null, 2));

    const workflows = workflowsRes.data.workflows || workflowsRes.data.data?.workflows || [];
    console.log('\n✅ Found', workflows.length, 'workflow(s)');

    if (workflows.length > 0) {
      const workflow = workflows[0];
      console.log('\n📋 Testing workflow executions API...\n');

      const execRes = await axios.get(`http://localhost:3000/api/workflows/${workflow.id}/executions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Executions Response:');
      console.log('Status:', execRes.status);
      console.log('Data structure:', JSON.stringify(execRes.data, null, 2).substring(0, 500) + '...');

      const executions = execRes.data.data?.executions || execRes.data.executions || [];
      console.log('\n✅ Found', executions.length, 'execution(s)');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test();
