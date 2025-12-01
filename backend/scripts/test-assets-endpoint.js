require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

// Use Estee's credentials (from check-estee-user.js)
const EMAIL = 'estee@masstock.com';
const PASSWORD = 'Password123!';

async function testAssetsEndpoint() {
  try {
    console.log('\n🔐 Step 1: Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    }, {
      withCredentials: true
    });

    console.log('✅ Login successful');
    console.log('User:', loginRes.data.user.email);
    console.log('Client:', loginRes.data.user.client_id);

    // Extract cookies
    const cookies = loginRes.headers['set-cookie'];
    const cookieHeader = cookies.join('; ');

    console.log('\n📡 Step 2: Testing GET /assets endpoint...');

    // Test 1: Default request (no filters)
    console.log('\n--- Test 1: No filters (default) ---');
    const res1 = await axios.get(`${API_URL}/assets`, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    console.log('Status:', res1.status);
    console.log('Assets count:', res1.data.data.assets.length);
    console.log('Stats:', res1.data.data.stats);
    console.log('Pagination:', res1.data.data.pagination);
    console.log('First asset:', res1.data.data.assets[0] ? {
      id: res1.data.data.assets[0].id,
      asset_type: res1.data.data.assets[0].asset_type,
      workflow_name: res1.data.data.assets[0].workflow_name,
      created_at: res1.data.data.assets[0].created_at
    } : null);

    // Test 2: With limit
    console.log('\n--- Test 2: With limit=5 ---');
    const res2 = await axios.get(`${API_URL}/assets?limit=5`, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    console.log('Assets count:', res2.data.data.assets.length);
    console.log('Has more:', res2.data.data.pagination.has_more);
    console.log('Next cursor:', res2.data.data.pagination.next_cursor);

    // Test 3: With asset_type filter
    console.log('\n--- Test 3: Filter by asset_type=image ---');
    const res3 = await axios.get(`${API_URL}/assets?asset_type=image`, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    console.log('Assets count:', res3.data.data.assets.length);
    console.log('All assets are images:', res3.data.data.assets.every(a => a.asset_type === 'image'));

    // Test 4: Sort oldest first
    console.log('\n--- Test 4: Sort=oldest ---');
    const res4 = await axios.get(`${API_URL}/assets?sort=oldest&limit=3`, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    console.log('First 3 assets (oldest):', res4.data.data.assets.map(a => ({
      created_at: a.created_at,
      workflow_name: a.workflow_name
    })));

    // Test 5: Cursor pagination
    if (res2.data.data.pagination.next_cursor) {
      console.log('\n--- Test 5: Cursor pagination (page 2) ---');
      const res5 = await axios.get(`${API_URL}/assets?limit=5&cursor=${res2.data.data.pagination.next_cursor}`, {
        headers: { Cookie: cookieHeader },
        withCredentials: true
      });
      console.log('Page 2 assets count:', res5.data.data.assets.length);
      console.log('First asset on page 2:', res5.data.data.assets[0] ? {
        id: res5.data.data.assets[0].id,
        created_at: res5.data.data.assets[0].created_at
      } : null);
    }

    console.log('\n✅ All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testAssetsEndpoint();
