/**
 * Database Configuration
 * Supabase client setup and connection management
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
const { logger } = require('../config/logger');

  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Create Supabase client with anon key (for client-facing operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  }
);

// Create Supabase admin client with service role key (for backend operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Get Supabase client for user context
 * @param {string} accessToken - User's JWT access token
 * @returns {object} Supabase client with user context
 */
function getSupabaseClient(accessToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  getSupabaseClient,
  testConnection
};
