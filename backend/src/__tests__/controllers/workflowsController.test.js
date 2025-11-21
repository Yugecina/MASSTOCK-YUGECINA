/**
 * Tests for Workflows Controller
 * Testing workflow management and execution
 */

const workflowsController = require('../../controllers/workflowsController');
const { supabaseAdmin } = require('../../config/database');
const { ApiError } = require('../../middleware/errorHandler');

jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logWorkflowExecution: jest.fn(),
  logAudit: jest.fn(),
  logger: { info: jest.fn(), error: jest.fn() }
}));
jest.mock('../../queues/workflowQueue', () => ({
  addWorkflowJob: jest.fn().mockResolvedValue({ id: 'job-123' })
}));
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}));

describe('WorkflowsController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      query: {},
      params: {},
      user: {
        id: 'user-id',
        email: 'user@test.com',
        role: 'user'
      },
      client: {
        id: 'client-id',
        name: 'Test Client'
      },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('GET /api/workflows - getWorkflows', () => {
    it('should fetch all workflows for client', async () => {
      const mockWorkflows = [
        { id: 'wf-1', name: 'Content Generator', status: 'deployed' },
        { id: 'wf-2', name: 'SEO Optimizer', status: 'draft' }
      ];

      const { createClient } = require('@supabase/supabase-js');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockWorkflows, error: null })
        }))
      });

      await workflowsController.getWorkflows(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            workflows: mockWorkflows,
            total: 2
          })
        })
      );
    });

    it('should handle database errors', async () => {
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        }))
      });

      await expect(workflowsController.getWorkflows(req, res)).rejects.toMatchObject({
        statusCode: 500,
        code: 'DATABASE_ERROR'
      });
    });
  });

  describe('GET /api/workflows/:workflow_id - getWorkflow', () => {
    it('should fetch workflow with stats and executions', async () => {
      req.params = { workflow_id: 'wf-1' };

      const mockWorkflow = {
        id: 'wf-1',
        name: 'Content Generator',
        client_id: 'client-id',
        status: 'deployed'
      };

      const mockExecutions = [
        { status: 'completed', duration_seconds: 30, created_at: new Date().toISOString() },
        { status: 'completed', duration_seconds: 40, created_at: new Date().toISOString() },
        { status: 'failed', duration_seconds: 10, created_at: new Date().toISOString() }
      ];

      let callCount = 0;
      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'workflows') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockWorkflow, error: null })
          };
        }
        if (table === 'workflow_executions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockExecutions, error: null })
          };
        }
      });

      await workflowsController.getWorkflow(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.workflow).toEqual(mockWorkflow);
      expect(response.data.stats.total_executions).toBe(3);
      expect(response.data.stats.success_count).toBe(2);
      expect(response.data.stats.failed_count).toBe(1);
    });

    it('should return 404 if workflow not found', async () => {
      req.params = { workflow_id: 'non-existent' };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }));

      await expect(workflowsController.getWorkflow(req, res)).rejects.toMatchObject({
        statusCode: 404,
        code: 'WORKFLOW_NOT_FOUND'
      });
    });
  });
});
