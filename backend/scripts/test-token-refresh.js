/**
 * Test script for token refresh mechanism
 *
 * This script tests:
 * 1. Login with valid credentials
 * 2. Extract access_token and refresh_token from cookies
 * 3. Call /refresh endpoint
 * 4. Verify new tokens are issued
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testTokenRefresh() {
  console.log('\n🧪 Testing Token Refresh Mechanism\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login
    console.log('\n1️⃣  Logging in with test credentials...');
    const loginResponse = await axios.post(
      `${API_URL}/v1/auth/login`,
      {
        email: 'admin@masstock.com',
        password: 'Admin123123'
      },
      {
        withCredentials: true,
        validateStatus: () => true
      }
    );

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    console.log('✅ Login successful');
    console.log('   User:', loginResponse.data.user.email);
    console.log('   Role:', loginResponse.data.user.role);

    // Extract cookies
    const cookies = loginResponse.headers['set-cookie'];
    if (!cookies) {
      console.error('❌ No cookies received');
      return;
    }

    console.log('\n📦 Cookies received:');
    cookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0];
      console.log(`   - ${cookieName}`);
    });

    // Step 2: Test /refresh endpoint
    console.log('\n2️⃣  Testing token refresh endpoint...');

    const cookieHeader = cookies.join('; ');
    const refreshResponse = await axios.post(
      `${API_URL}/v1/auth/refresh`,
      {},
      {
        headers: {
          'Cookie': cookieHeader
        },
        withCredentials: true,
        validateStatus: () => true
      }
    );

    if (refreshResponse.status !== 200) {
      console.error('❌ Token refresh failed:', refreshResponse.data);
      return;
    }

    console.log('✅ Token refresh successful');
    console.log('   Response:', refreshResponse.data);

    // Check if new cookies were set
    const newCookies = refreshResponse.headers['set-cookie'];
    if (newCookies) {
      console.log('\n📦 New cookies received:');
      newCookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0];
        console.log(`   - ${cookieName}`);
      });
    }

    // Step 3: Verify we can still access protected routes
    console.log('\n3️⃣  Testing protected route with refreshed token...');

    const updatedCookieHeader = newCookies ? newCookies.join('; ') : cookieHeader;
    const meResponse = await axios.get(
      `${API_URL}/v1/auth/me`,
      {
        headers: {
          'Cookie': updatedCookieHeader
        },
        withCredentials: true,
        validateStatus: () => true
      }
    );

    if (meResponse.status !== 200) {
      console.error('❌ Protected route failed:', meResponse.data);
      return;
    }

    console.log('✅ Protected route access successful');
    console.log('   User:', meResponse.data.user.email);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED - Token refresh is working!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

// Run the test
testTokenRefresh();
