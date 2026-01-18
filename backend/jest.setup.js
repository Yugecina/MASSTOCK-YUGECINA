// Load environment variables from .env.test for E2E tests, fallback to .env
const dotenv = require('dotenv');
const path = require('path');

// Try to load .env.test first (for E2E tests), then fallback to .env
const envTestPath = path.resolve(__dirname, '.env.test');
const envPath = path.resolve(__dirname, '.env');

const fs = require('fs');
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
  console.log('✅ Loaded .env.test for E2E tests');
} else {
  dotenv.config({ path: envPath });
  console.log('⚠️  .env.test not found, using .env');
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

// For unit tests with mocks, use fake Supabase credentials
// E2E tests will use the real credentials from .env
if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === '') {
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
}

// Redis test environment variables
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_PASSWORD = '';
process.env.REDIS_TLS = 'false';

// Mock console.log and console.error in tests if needed
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Increase timeout for E2E and integration tests
jest.setTimeout(300000); // 5 minutes for E2E tests with real API calls
