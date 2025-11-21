/**
 * Tests for Workflow Requests Controller
 */

const workflowRequestsController = require('../../controllers/workflowRequestsController');
const { supabaseAdmin } = require('../../config/database');
const { ApiError } = require('../../middleware/errorHandler');

jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logAudit: jest.fn(),
  logger: { info: jest.fn(), error: jest.fn() }
}));

describe('WorkflowRequestsController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      query: {},
      params: {},
      user: { id: 'user-id', email: 'user@test.com', role: 'user' },
      client: { id: 'client-id', name: 'Test Client' },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('POST /api/workflow-requests - createWorkflowRequest', () => {
    it('should create workflow request successfully', async () => {
      req.body = {
        title: 'New Content Workflow',
        description: 'Generate blog posts automatically',
        use_case: 'Content marketing',
        frequency: 'daily',
        budget: 1000
      };

      const mockRequest = {
        id: 'req-1',
        client_id: 'client-id',
        title: 'New Content Workflow',
        status: 'submitted'
      };

      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'workflow_requests') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockRequest, error: null })
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null })
          };
        }
      });

      await workflowRequestsController.createWorkflowRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            request_id: 'req-1',
            status: 'submitted'
          })
        })
      );
    });

    it('should require title and description', async () => {
      req.body = { title: 'Test' };

      await expect(workflowRequestsController.createWorkflowRequest(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'MISSING_REQUIRED_FIELDS'
      });
    });
  });

  describe('GET /api/workflow-requests - getWorkflowRequests', () => {
    it('should fetch all workflow requests for client', async () => {
      const mockRequests = [
        { id: 'req-1', title: 'Request 1', status: 'submitted' },
        { id: 'req-2', title: 'Request 2', status: 'reviewing' }
      ];

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRequests, error: null })
      }));

      await workflowRequestsController.getWorkflowRequests(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            requests: mockRequests,
            total: 2
          })
        })
      );
    });
  });

  describe('GET /api/workflow-requests/:request_id - getWorkflowRequest', () => {
    it('should fetch workflow request details', async () => {
      req.params = { request_id: 'req-1' };

      const mockRequest = {
        id: 'req-1',
        client_id: 'client-id',
        title: 'Test Request',
        status: 'submitted'
      };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRequest, error: null })
      }));

      await workflowRequestsController.getWorkflowRequest(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRequest
        })
      );
    });

    it('should return 404 if request not found', async () => {
      req.params = { request_id: 'non-existent' };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }));

      await expect(workflowRequestsController.getWorkflowRequest(req, res)).rejects.toMatchObject({
        statusCode: 404,
        code: 'REQUEST_NOT_FOUND'
      });
    });
  });
});
