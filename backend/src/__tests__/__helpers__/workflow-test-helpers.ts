/**
 * Shared test utilities for workflow testing
 * Provides helpers for async job polling, cleanup, verification, and assertions
 *
 * Usage:
 * import {
 *   waitForJobCompletion,
 *   cleanupTestData,
 *   verifyImageStructure,
 *   verifyPricing
 * } from '../../__helpers__/workflow-test-helpers';
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// ASYNC JOB POLLING
// ============================================================================

/**
 * Wait for workflow job to complete with polling
 * Polls database every 500ms until job reaches terminal state (completed/failed)
 *
 * @param executionId - Workflow execution ID
 * @param timeout - Maximum wait time in ms (default: 30000)
 * @returns Final execution state
 * @throws Error if job doesn't complete within timeout
 *
 * @example
 * const completion = await waitForJobCompletion(executionId);
 * expect(completion.status).toBe('completed');
 */
export async function waitForJobCompletion(
  executionId: string,
  timeout = 30000
): Promise<{ status: string; error_message?: string }> {
  const startTime = Date.now();
  const pollInterval = 500; // 500ms

  while (Date.now() - startTime < timeout) {
    const { data, error } = await supabaseAdmin
      .from('workflow_executions')
      .select('status, error_message')
      .eq('id', executionId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch execution status: ${error.message}`);
    }

    // Terminal states
    if (data.status === 'completed' || data.status === 'failed') {
      return data;
    }

    // Continue polling
    await sleep(pollInterval);
  }

  throw new Error(`Job ${executionId} did not complete within ${timeout}ms`);
}

/**
 * Wait for multiple jobs to complete in parallel
 *
 * @param executionIds - Array of execution IDs
 * @param timeout - Maximum wait time per job
 * @returns Array of execution states
 */
export async function waitForMultipleJobs(
  executionIds: string[],
  timeout = 30000
): Promise<Array<{ status: string; error_message?: string }>> {
  return Promise.all(
    executionIds.map(id => waitForJobCompletion(id, timeout))
  );
}

// ============================================================================
// DATA CLEANUP
// ============================================================================

/**
 * Clean up test data from database
 * Deletes batch results and execution record
 *
 * @param executionId - Workflow execution ID to clean up
 *
 * @example
 * afterEach(async () => {
 *   if (executionId) {
 *     await cleanupTestData(executionId);
 *   }
 * });
 */
export async function cleanupTestData(executionId: string): Promise<void> {
  try {
    // Delete batch results first (foreign key constraint)
    await supabaseAdmin
      .from('workflow_batch_results')
      .delete()
      .eq('execution_id', executionId);

    // Delete execution record
    await supabaseAdmin
      .from('workflow_executions')
      .delete()
      .eq('id', executionId);
  } catch (error) {
    console.error(`Failed to cleanup test data for ${executionId}:`, error);
    // Don't throw - cleanup failures shouldn't fail tests
  }
}

/**
 * Clean up multiple executions
 */
export async function cleanupMultipleExecutions(executionIds: string[]): Promise<void> {
  await Promise.all(executionIds.map(id => cleanupTestData(id)));
}

/**
 * Clean up test data by user ID (for integration test teardown)
 */
export async function cleanupByUserId(userId: string): Promise<void> {
  try {
    // Get all execution IDs for this user
    const { data: executions } = await supabaseAdmin
      .from('workflow_executions')
      .select('id')
      .eq('user_id', userId);

    if (executions && executions.length > 0) {
      const executionIds = executions.map(e => e.id);
      await cleanupMultipleExecutions(executionIds);
    }
  } catch (error) {
    console.error(`Failed to cleanup test data for user ${userId}:`, error);
  }
}

// ============================================================================
// VERIFICATION HELPERS
// ============================================================================

/**
 * Verify image structure (not pixel content)
 * Checks that result has valid URL, status, and metadata
 *
 * @param result - Batch result record
 *
 * @example
 * const { data: batchResults } = await supabase
 *   .from('workflow_batch_results')
 *   .select('*')
 *   .eq('execution_id', executionId);
 *
 * batchResults.forEach(result => {
 *   verifyImageStructure(result);
 * });
 */
export function verifyImageStructure(result: any): void {
  expect(result).toHaveProperty('result_url');
  expect(result).toHaveProperty('status');
  expect(result.status).toBe('completed');

  if (result.result_url) {
    // Verify URL format (http or https)
    expect(result.result_url).toMatch(/^https?:\/\/.+/);
  }

  // Verify has metadata
  expect(result).toHaveProperty('batch_index');
  expect(result).toHaveProperty('execution_id');
  expect(result).toHaveProperty('created_at');
}

/**
 * Verify pricing calculations are correct
 *
 * @param execution - Workflow execution record
 * @param expectedImages - Expected number of images
 * @param costPerImage - Cost per image
 * @param revenuePerImage - Revenue per image
 *
 * @example
 * verifyPricing(execution, 10, 0.0025, 0.05); // Flash model pricing
 * verifyPricing(execution, 1, 0.04, 0.8);     // Pro 4K pricing
 */
export function verifyPricing(
  execution: any,
  expectedImages: number,
  costPerImage: number,
  revenuePerImage: number
): void {
  const expectedCost = expectedImages * costPerImage;
  const expectedRevenue = expectedImages * revenuePerImage;
  const expectedProfit = expectedRevenue - expectedCost;

  // Pricing is stored in input_data.pricing_details
  const pricing = execution.input_data?.pricing_details;
  expect(pricing).toBeDefined();

  // Use toBeCloseTo for floating point comparisons (4 decimal places)
  expect(pricing.total_cost_eur).toBeCloseTo(expectedCost, 4);
  expect(pricing.total_revenue_eur).toBeCloseTo(expectedRevenue, 4);
  expect(pricing.profit_eur).toBeCloseTo(expectedProfit, 4);
}

/**
 * Verify execution metadata fields
 *
 * @param execution - Workflow execution record
 * @param workflowType - Expected workflow type
 *
 * @example
 * verifyExecutionMetadata(execution, 'nano_banana');
 */
export function verifyExecutionMetadata(execution: any, workflowType: string): void {
  // Required fields
  expect(execution).toHaveProperty('id');
  expect(execution).toHaveProperty('workflow_id');
  expect(execution).toHaveProperty('triggered_by_user_id');
  expect(execution).toHaveProperty('client_id');
  expect(execution).toHaveProperty('status');

  // Timestamps
  expect(execution).toHaveProperty('created_at');
  expect(execution).toHaveProperty('started_at');

  // Ensure valid UUID format
  expect(execution.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  expect(execution.workflow_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  expect(execution.triggered_by_user_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  expect(execution.client_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
}

/**
 * Verify batch results have correct indices
 *
 * @param batchResults - Array of batch result records
 * @param expectedCount - Expected number of results
 *
 * @example
 * verifyBatchIndices(batchResults, 10);
 */
export function verifyBatchIndices(batchResults: any[], expectedCount: number): void {
  expect(batchResults).toHaveLength(expectedCount);

  // Verify each has unique index
  const indices = batchResults.map(r => r.batch_index);
  const uniqueIndices = new Set(indices);
  expect(uniqueIndices.size).toBe(expectedCount);

  // Verify indices are sequential starting from 0
  const sortedIndices = [...indices].sort((a, b) => a - b);
  for (let i = 0; i < expectedCount; i++) {
    expect(sortedIndices[i]).toBe(i);
  }
}

/**
 * Verify execution status transitions
 *
 * @param execution - Workflow execution record
 * @param expectedStatus - Expected current status
 *
 * @example
 * verifyExecutionStatus(execution, 'completed');
 */
export function verifyExecutionStatus(execution: any, expectedStatus: string): void {
  expect(execution.status).toBe(expectedStatus);

  // Verify timestamps based on status
  if (expectedStatus === 'pending') {
    expect(execution.started_at).toBeNull();
    expect(execution.completed_at).toBeNull();
  } else if (expectedStatus === 'processing') {
    expect(execution.started_at).not.toBeNull();
    expect(execution.completed_at).toBeNull();
  } else if (expectedStatus === 'completed' || expectedStatus === 'failed') {
    expect(execution.started_at).not.toBeNull();
    expect(execution.completed_at).not.toBeNull();

    // Verify timestamps are in correct order
    const startedAt = new Date(execution.started_at);
    const completedAt = new Date(execution.completed_at);
    expect(completedAt.getTime()).toBeGreaterThanOrEqual(startedAt.getTime());
  }
}

// ============================================================================
// DATABASE QUERIES
// ============================================================================

/**
 * Get execution by ID
 */
export async function getExecution(executionId: string): Promise<any> {
  const { data, error } = await supabaseAdmin
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch execution: ${error.message}`);
  }

  return data;
}

/**
 * Get batch results for execution
 */
export async function getBatchResults(executionId: string): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from('workflow_batch_results')
    .select('*')
    .eq('execution_id', executionId)
    .order('batch_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch batch results: ${error.message}`);
  }

  return data || [];
}

/**
 * Count batch results by status
 */
export async function countBatchResultsByStatus(
  executionId: string,
  status: string
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('workflow_batch_results')
    .select('*', { count: 'exact', head: true })
    .eq('execution_id', executionId)
    .eq('status', status);

  if (error) {
    throw new Error(`Failed to count batch results: ${error.message}`);
  }

  return count || 0;
}

// ============================================================================
// MOCK DATA HELPERS
// ============================================================================

/**
 * Create mock encrypted API key structure
 */
export function createMockEncryptedApiKey() {
  return {
    iv: Buffer.from('mock-iv-1234567890').toString('base64'),
    encryptedData: Buffer.from('mock-encrypted-api-key').toString('base64'),
    authTag: Buffer.from('mock-auth-tag-16b').toString('base64')
  };
}

/**
 * Create mock FormData for multipart requests
 */
export function createMockFormData(data: Record<string, any>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof Blob || item instanceof File) {
          formData.append(key, item);
        } else {
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        }
      });
    } else if (value instanceof Blob || value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  }

  return formData;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep helper for async operations
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry helper for flaky operations
 *
 * @param fn - Function to retry
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param delay - Delay between attempts in ms (default: 1000)
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Generate random test data
 */
export function randomString(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert array has unique elements
 */
export function expectUniqueElements<T>(array: T[]): void {
  const uniqueSet = new Set(array);
  expect(uniqueSet.size).toBe(array.length);
}

/**
 * Assert object has all required keys
 */
export function expectHasKeys(obj: any, keys: string[]): void {
  keys.forEach(key => {
    expect(obj).toHaveProperty(key);
  });
}

/**
 * Assert value is valid UUID
 */
export function expectValidUUID(value: string): void {
  expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
}

/**
 * Assert value is valid ISO timestamp
 */
export function expectValidTimestamp(value: string): void {
  const date = new Date(value);
  expect(date.toString()).not.toBe('Invalid Date');
  expect(date.toISOString()).toBe(value);
}

/**
 * Assert value is valid URL
 */
export function expectValidURL(value: string): void {
  expect(value).toMatch(/^https?:\/\/.+/);
  expect(() => new URL(value)).not.toThrow();
}
