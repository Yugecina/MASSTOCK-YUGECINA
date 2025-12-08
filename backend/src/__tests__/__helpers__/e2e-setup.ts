/**
 * E2E Test Setup
 * Provides utilities for end-to-end testing with real database
 *
 * IMPORTANT: E2E tests use EXISTING users in the database, not dynamically created ones.
 * This avoids slow Supabase Auth Admin API calls and rate limiting issues.
 */

import { supabaseAdmin } from '../../config/database';

export interface E2ETestContext {
  clientId: string;
  userId: string;
  userEmail: string;
  userPassword: string;
  cleanup?: () => Promise<void>;
}

/**
 * Setup E2E test - uses EXISTING test user from database
 * This avoids slow Auth API calls and focuses on testing the actual endpoints
 */
export async function setupE2ETest(): Promise<E2ETestContext> {
  // Use a known test user that should exist in your database
  // You should manually create this user once in your Supabase dashboard:
  // Email: e2e-test@masstock.fr
  // Password: E2eTest123!@#
  // Role: user

  const testEmail = 'e2e-test@masstock.fr';
  const testPassword = 'E2eTest123!@#';

  // Try to find the existing test user
  const { data: existingUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, client_id')
    .eq('email', testEmail)
    .single();

  if (userError || !existingUser) {
    throw new Error(
      `E2E test user not found: ${testEmail}\n\n` +
      `Please create this user manually in your Supabase dashboard:\n` +
      `1. Go to Authentication > Users\n` +
      `2. Create user with email: ${testEmail}\n` +
      `3. Set password: ${testPassword}\n` +
      `4. Confirm email\n` +
      `5. Ensure user record exists in 'users' table with role='user'\n\n` +
      `Error: ${userError?.message || 'User not found'}`
    );
  }

  // Return context (no cleanup needed for existing user)
  return {
    clientId: existingUser.client_id,
    userId: existingUser.id,
    userEmail: existingUser.email,
    userPassword: testPassword,
    cleanup: undefined, // No cleanup for existing users
  };
}

/**
 * Cleanup E2E test data
 */
export async function cleanupE2ETest(clientId: string, userId?: string): Promise<void> {
  try {
    // Delete in order to respect foreign keys

    // 1. Delete executions
    await supabaseAdmin
      .from('executions')
      .delete()
      .eq('client_id', clientId);

    // 2. Delete workflows
    await supabaseAdmin
      .from('workflows')
      .delete()
      .eq('client_id', clientId);

    // 3. Delete users
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('client_id', clientId);

    // 4. Delete auth user if provided
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }

    // 5. Delete client
    await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', clientId);

  } catch (error) {
    console.error('Error cleaning up E2E test data:', error);
    // Don't throw - cleanup errors shouldn't fail tests
  }
}

/**
 * Wait for async operation with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Sleep for specified milliseconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
