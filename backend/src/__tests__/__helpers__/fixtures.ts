/**
 * Test Fixtures
 * Provides consistent test data across all tests
 */

import { randomUUID } from 'crypto';

/**
 * User Fixtures
 */
export const mockUser = {
  id: 'user-123',
  email: 'user@test.com',
  role: 'user',
  client_id: 'client-123',
  status: 'active',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@test.com',
  role: 'admin',
  status: 'active',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

/**
 * Client Fixtures
 */
export const mockClient = {
  id: 'client-123',
  name: 'Test Client',
  status: 'active',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

/**
 * Workflow Fixtures
 */
export const mockWorkflow = {
  id: 'workflow-123',
  name: 'Test Workflow',
  description: 'A test workflow for unit tests',
  client_id: 'client-123',
  status: 'active',
  definition: {
    steps: [
      {
        id: 'step-1',
        type: 'generate-image',
        config: {
          prompt: 'test prompt',
        },
      },
    ],
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

/**
 * Execution Fixtures
 */
export const mockExecution = {
  id: 'execution-123',
  workflow_id: 'workflow-123',
  client_id: 'client-123',
  user_id: 'user-123',
  status: 'pending',
  input_data: {
    prompts: ['test prompt 1', 'test prompt 2'],
  },
  output_data: null,
  started_at: '2025-01-01T00:00:00Z',
  completed_at: null,
  error: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockCompletedExecution = {
  ...mockExecution,
  status: 'completed',
  output_data: {
    results: [
      {
        prompt: 'test prompt 1',
        image_url: 'https://example.com/image1.png',
      },
      {
        prompt: 'test prompt 2',
        image_url: 'https://example.com/image2.png',
      },
    ],
  },
  completed_at: '2025-01-01T00:05:00Z',
};

/**
 * Auth Fixtures
 */
export const mockSession = {
  access_token: 'mock-access-token-123',
  refresh_token: 'mock-refresh-token-123',
  expires_in: 3600,
  expires_at: Date.now() + 3600 * 1000,
  token_type: 'bearer',
  user: mockUser,
};

/**
 * Generate test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}@test.com`;
}

/**
 * Generate test ID (UUID v4)
 */
export function generateTestId(prefix?: string): string {
  return randomUUID();
}

/**
 * Create workflow with custom overrides
 */
export function createMockWorkflow(overrides: Partial<typeof mockWorkflow> = {}) {
  return {
    ...mockWorkflow,
    ...overrides,
  };
}

/**
 * Create execution with custom overrides
 */
export function createMockExecution(overrides: Partial<typeof mockExecution> = {}) {
  return {
    ...mockExecution,
    ...overrides,
  };
}

/**
 * Create user with custom overrides
 */
export function createMockUser(overrides: Partial<typeof mockUser> = {}) {
  return {
    ...mockUser,
    ...overrides,
  };
}

/**
 * Create client with custom overrides
 */
export function createMockClient(overrides: Partial<typeof mockClient> = {}) {
  return {
    ...mockClient,
    ...overrides,
  };
}
