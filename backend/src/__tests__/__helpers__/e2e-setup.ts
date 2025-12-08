/**
 * E2E Test Setup
 * Provides utilities for end-to-end testing with real database
 */

import { supabaseAdmin } from '../../config/database';
import { generateTestId, generateTestEmail } from './fixtures';

export interface E2ETestContext {
  clientId: string;
  userId: string;
  userEmail: string;
  userPassword: string;
  cleanup: () => Promise<void>;
}

/**
 * Setup E2E test with isolated test data
 * Creates a test client and user, returns cleanup function
 */
export async function setupE2ETest(): Promise<E2ETestContext> {
  const clientId = generateTestId('test-client');
  const userEmail = generateTestEmail('e2e-user');
  const userPassword = 'Test123!@#';

  // Create test client
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .insert({
      id: clientId,
      name: `E2E Test Client ${clientId}`,
      status: 'active',
    })
    .select()
    .single();

  if (clientError) {
    throw new Error(`Failed to create test client: ${clientError.message}`);
  }

  // Create test user in auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userEmail,
    password: userPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`);
  }

  const userId = authData.user.id;

  // Create user record in database
  const { error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      id: userId,
      email: userEmail,
      client_id: clientId,
      role: 'user',
      status: 'active',
    });

  if (userError) {
    throw new Error(`Failed to create user record: ${userError.message}`);
  }

  // Return context with cleanup function
  return {
    clientId,
    userId,
    userEmail,
    userPassword,
    cleanup: async () => await cleanupE2ETest(clientId, userId),
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
