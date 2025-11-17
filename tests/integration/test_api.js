const http = require('http');

function makeRequest(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testAPI() {
  console.log('=== Testing API Flow ===\n');

  // Login
  console.log('1. POST /api/v1/auth/login');
  const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'estee@masstock.com',
    password: 'EsteePassword123!'
  });
  
  if (!loginRes.data.success) {
    console.error('Login failed:', loginRes.data);
    return;
  }
  
  console.log('✓ Login successful');
  const token = loginRes.data.data.access_token;
  const user = loginRes.data.data.user;
  const client = loginRes.data.data.client;
  
  console.log('  User:', user.email);
  console.log('  Client:', client ? client.name : 'NO CLIENT');
  
  // Get workflows
  console.log('\n2. GET /api/v1/workflows');
  const workflowsRes = await makeRequest('GET', '/api/v1/workflows', null, {
    'Authorization': 'Bearer ' + token
  });
  
  console.log('  Status:', workflowsRes.status);
  
  if (!workflowsRes.data.success) {
    console.error('  Error:', workflowsRes.data);
    return;
  }
  
  const workflows = workflowsRes.data.data.workflows;
  console.log('✓ Workflows loaded:', workflows.length);
  
  workflows.slice(0, 5).forEach((w, idx) => {
    console.log('  ' + (idx + 1) + '. ' + w.name);
  });
  
  console.log('\n=== API TEST PASSED ===');
}

testAPI().then(() => process.exit(0)).catch(e => {
  console.error('Test failed:', e.message);
  process.exit(1);
});
