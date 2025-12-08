/**
 * E2E Tests: Workflow Execution Flow
 * Tests the complete workflow execution flow with real database
 */

import request from 'supertest';
import app from '../../server';
import { setupE2ETest, E2ETestContext } from '../__helpers__/e2e-setup';
import { supabaseAdmin } from '../../config/database';

describe('Workflow Execution Flow E2E', () => {
  let context: E2ETestContext;
  let accessToken: string;
  let testWorkflowId: string;

  beforeAll(async () => {
    context = await setupE2ETest();

    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: context.userEmail,
        password: context.userPassword,
      });

    const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
    const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
    accessToken = accessTokenCookie?.split(';')[0].split('=')[1] || '';

    // Find an existing workflow (any status)
    const { data: existingWorkflows, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .select('id, name')
      .limit(1);

    if (workflowError || !existingWorkflows || existingWorkflows.length === 0) {
      throw new Error(`No active workflows found in database: ${workflowError?.message}`);
    }

    testWorkflowId = existingWorkflows[0].id;

    // Check if workflow is already assigned to test client
    const { data: existingAssignment } = await supabaseAdmin
      .from('client_workflows')
      .select('id')
      .eq('client_id', context.clientId)
      .eq('workflow_id', testWorkflowId)
      .single();

    // Assign workflow to test client if not already assigned
    if (!existingAssignment) {
      const { error: assignError } = await supabaseAdmin
        .from('client_workflows')
        .insert({
          client_id: context.clientId,
          workflow_id: testWorkflowId,
          is_active: true
        });

      if (assignError) {
        throw new Error(`Failed to assign workflow: ${assignError.message}`);
      }
    }
  });

  afterAll(async () => {
    // Cleanup: delete test executions (but keep workflow - it's shared)
    if (testWorkflowId && context.clientId) {
      await supabaseAdmin
        .from('workflow_executions')
        .delete()
        .eq('workflow_id', testWorkflowId)
        .eq('client_id', context.clientId);
    }

    if (context?.cleanup) {
      await context.cleanup();
    }
  });

  describe('GET /api/v1/workflows', () => {
    it('should list workflows for authenticated client', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('workflows');
      expect(Array.isArray(response.body.data.workflows)).toBe(true);

      // Should include our test workflow
      const testWorkflow = response.body.data.workflows.find(
        (w: any) => w.id === testWorkflowId
      );
      expect(testWorkflow).toBeDefined();
      expect(testWorkflow).toHaveProperty('name');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/workflows');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/workflows/:workflow_id', () => {
    it('should get workflow details', async () => {
      const response = await request(app)
        .get(`/api/v1/workflows/${testWorkflowId}`)
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testWorkflowId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should return 404 for non-existent workflow', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/workflows/${fakeId}`)
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/workflows/${testWorkflowId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/workflows/:workflow_id/execute', () => {
    it('should queue workflow execution with valid input', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Cookie', [`access_token=${accessToken}`])
        .send({
          prompts: ['Test prompt 1', 'Test prompt 2'],
          config: {
            temperature: 0.8
          }
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('execution_id');
      expect(response.body.data).toHaveProperty('status', 'pending');
      expect(response.body.data).toHaveProperty('message');

      // Store execution ID for later tests
      (global as any).testExecutionId = response.body.data.execution_id;
    });

    it('should return 400 with invalid input (missing prompts)', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Cookie', [`access_token=${accessToken}`])
        .send({
          config: { temperature: 0.8 }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 with empty prompts array', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Cookie', [`access_token=${accessToken}`])
        .send({
          prompts: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent workflow', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/v1/workflows/${fakeId}/execute`)
        .set('Cookie', [`access_token=${accessToken}`])
        .send({
          prompts: ['Test prompt']
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .send({
          prompts: ['Test prompt']
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/executions/:execution_id', () => {
    it('should get execution status and details', async () => {
      const executionId = (global as any).testExecutionId;

      if (!executionId) {
        // Skip if no execution was created
        console.warn('Skipping: No execution ID available from previous test');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/executions/${executionId}`)
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', executionId);
      expect(response.body.data).toHaveProperty('workflow_id', testWorkflowId);
      expect(response.body.data).toHaveProperty('status');
      expect(['pending', 'processing', 'completed', 'failed']).toContain(
        response.body.data.status
      );
      expect(response.body.data).toHaveProperty('progress');
      expect(response.body.data).toHaveProperty('input_data');
    });

    it('should return 404 for non-existent execution', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/executions/${fakeId}`)
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const executionId = (global as any).testExecutionId || '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/executions/${executionId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/workflows/:workflow_id/executions', () => {
    it('should list executions for a workflow', async () => {
      const response = await request(app)
        .get(`/api/v1/workflows/${testWorkflowId}/executions`)
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('executions');
      expect(Array.isArray(response.body.data.executions)).toBe(true);
      expect(response.body.data).toHaveProperty('total');

      // Should include our test execution
      if ((global as any).testExecutionId) {
        const testExecution = response.body.data.executions.find(
          (e: any) => e.id === (global as any).testExecutionId
        );
        expect(testExecution).toBeDefined();
      }
    });

    it('should support pagination with limit and offset', async () => {
      const response = await request(app)
        .get(`/api/v1/workflows/${testWorkflowId}/executions?limit=5&offset=0`)
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.data.executions.length).toBeLessThanOrEqual(5);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get(`/api/v1/workflows/${testWorkflowId}/executions?status=pending`)
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);

      // All returned executions should have 'pending' status
      response.body.data.executions.forEach((exec: any) => {
        expect(exec.status).toBe('pending');
      });
    });

    it('should return 404 for non-existent workflow', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/workflows/${fakeId}/executions`)
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/workflows/${testWorkflowId}/executions`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
