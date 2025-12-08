/**
 * Database Configuration
 * Supabase client setup and connection management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';
import 'dotenv/config';

// Validate required environment variables
const requiredEnvVars = [
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
const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  }
);

// Create Supabase admin client with service role key (for backend operations)
const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Get Supabase client for user context
 * @param accessToken - User's JWT access token
 * @returns Supabase client with user context
 */
function getSupabaseClient(accessToken: string): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
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
 * Create a fresh admin client for each query to avoid auth context contamination
 * Used in controllers that need a clean Supabase client without any session state
 * @returns Fresh Supabase admin client
 */
function getCleanAdmin(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Test database connection
 */
async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error as Error);
    return false;
  }
}

export {
  supabase,
  supabaseAdmin,
  getSupabaseClient,
  getCleanAdmin,
  testConnection
};
