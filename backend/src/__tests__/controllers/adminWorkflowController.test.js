/**
 * Admin Workflow Controller Tests
 * Test suite for workflow management endpoints (Phase 2)
 */

const { supabaseAdmin } = require('../../config/database');
const adminWorkflowController = require('../../controllers/adminWorkflowController');
const { ApiError } = require('../../middleware/errorHandler');

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logAudit: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('AdminWorkflowController', () => {
  let mockReq;
  let mockRes;
  let jsonMock;
  let statusMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      user: {
        id: 'admin-user-id',
        email: 'admin@masstock.com',
        role: 'admin'
      },
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };

    mockRes = {
      json: jsonMock,
      status: statusMock
    };

    jest.clearAllMocks();
  });

  describe('GET /api/v1/admin/workflows - getWorkflows', () => {
    it('should fetch all workflows with stats', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Content Generator',
          client_id: 'client-1',
          status: 'deployed',
          cost_per_execution: 5.00,
          revenue_per_execution: 50.00,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'workflow-2',
          name: 'SEO Optimizer',
          client_id: 'client-2',
          status: 'draft',
          cost_per_execution: 3.00,
          revenue_per_execution: 30.00,
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      const mockExecutions = [
        { workflow_id: 'workflow-1', status: 'completed' },
        { workflow_id: 'workflow-1', status: 'completed' },
        { workflow_id: 'workflow-1', status: 'failed' },
        { workflow_id: 'workflow-2', status: 'completed' }
      ];

      supabaseAdmin.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockWorkflows,
              error: null,
              count: 2
            })
          })
        })
      });

      // Mock executions query
      const selectMock = jest.fn();
      selectMock.mockReturnValueOnce({
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockWorkflows,
            error: null,
            count: 2
          })
        })
      });
      selectMock.mockReturnValueOnce({
        in: jest.fn().mockResolvedValue({
          data: mockExecutions,
          error: null
        })
      });

      supabaseAdmin.from = jest.fn((table) => ({
        select: selectMock
      }));

      await adminWorkflowController.getWorkflows(mockReq, mockRes);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          workflows: expect.any(Array),
          total: 2,
          page: 1
        })
      });
    });

    it('should support pagination', async () => {
      mockReq.query = { page: 2, limit: 10 };

      supabaseAdmin.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      });

      await adminWorkflowController.getWorkflows(mockReq, mockRes);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          page: 2,
          limit: 10
        })
      });
    });

    it('should filter by status', async () => {
      mockReq.query = { status: 'deployed' };

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      });

      supabaseAdmin.from = jest.fn(() => ({
        select: selectMock
      }));

      await adminWorkflowController.getWorkflows(mockReq, mockRes);

      expect(selectMock().eq).toHaveBeenCalledWith('status', 'deployed');
    });
  });

  describe('GET /api/v1/admin/workflows/:id - getWorkflow', () => {
    it('should fetch single workflow with details', async () => {
      mockReq.params.id = 'workflow-1';

      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Content Generator',
        client_id: 'client-1',
        status: 'deployed'
      };

      const mockClient = {
        id: 'client-1',
        name: 'Acme Corp',
        email: 'client@acme.com'
      };

      const mockExecutions = [
        { status: 'completed', duration_seconds: 30 },
        { status: 'completed', duration_seconds: 25 },
        { status: 'failed', duration_seconds: 10 }
      ];

      const singleMock = jest.fn().mockResolvedValue({
        data: mockWorkflow,
        error: null
      });

      const eqMock = jest.fn().mockReturnValue({ single: singleMock });
      const selectMock = jest.fn();

      selectMock.mockReturnValueOnce({ eq: eqMock });
      selectMock.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
        })
      });
      selectMock.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({ data: mockExecutions, error: null })
      });

      supabaseAdmin.from = jest.fn(() => ({ select: selectMock }));

      await adminWorkflowController.getWorkflow(mockReq, mockRes);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          workflow: mockWorkflow,
          client: mockClient,
          stats: expect.objectContaining({
            total_executions: 3,
            success_count: 2
          })
        })
      });
    });

    it('should return 404 if workflow not found', async () => {
      mockReq.params.id = 'non-existent-id';

      supabaseAdmin.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      await expect(
        adminWorkflowController.getWorkflow(mockReq, mockRes)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('GET /api/v1/admin/workflow-requests - getWorkflowRequests', () => {
    it('should fetch all workflow requests', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          title: 'New Content Workflow',
          status: 'submitted',
          client_id: 'client-1',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      supabaseAdmin.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockRequests,
              error: null,
              count: 1
            })
          })
        })
      });

      await adminWorkflowController.getWorkflowRequests(mockReq, mockRes);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          requests: mockRequests,
          total: 1
        })
      });
    });

    it('should filter by stage/status', async () => {
      mockReq.query = { status: 'reviewing' };

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      });

      supabaseAdmin.from = jest.fn(() => ({ select: selectMock }));

      await adminWorkflowController.getWorkflowRequests(mockReq, mockRes);

      expect(selectMock().eq).toHaveBeenCalledWith('status', 'reviewing');
    });

    it('should search by title', async () => {
      mockReq.query = { search: 'content' };

      const selectMock = jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      });

      supabaseAdmin.from = jest.fn(() => ({ select: selectMock }));

      await adminWorkflowController.getWorkflowRequests(mockReq, mockRes);

      expect(selectMock().ilike).toHaveBeenCalledWith('title', '%content%');
    });
  });

  describe('GET /api/v1/admin/workflow-requests/:id - getWorkflowRequest', () => {
    it('should fetch single workflow request', async () => {
      mockReq.params.id = 'request-1';

      const mockRequest = {
        id: 'request-1',
        title: 'New Workflow',
        client_id: 'client-1',
        status: 'submitted'
      };

      const mockClient = {
        id: 'client-1',
        name: 'Acme Corp'
      };

      const selectMock = jest.fn();
      selectMock.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockRequest, error: null })
        })
      });
      selectMock.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
        })
      });

      supabaseAdmin.from = jest.fn(() => ({ select: selectMock }));

      await adminWorkflowController.getWorkflowRequest(mockReq, mockRes);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          request: mockRequest,
          client: mockClient
        }
      });
    });

    it('should return 404 if request not found', async () => {
      mockReq.params.id = 'non-existent-id';

      supabaseAdmin.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      await expect(
        adminWorkflowController.getWorkflowRequest(mockReq, mockRes)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('PUT /api/v1/admin/workflow-requests/:id/stage - updateWorkflowRequestStage', () => {
    it('should update workflow request stage successfully', async () => {
      mockReq.params.id = 'request-1';
      mockReq.body = { stage: 'reviewing' };

      const mockRequest = {
        id: 'request-1',
        title: 'Test Request',
        status: 'submitted',
        client_id: 'client-1'
      };

      const updatedRequest = { ...mockRequest, status: 'reviewing' };

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockRequest,
            error: null
          })
        })
      });

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedRequest,
              error: null
            })
          })
        })
      });

      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'workflow_requests') {
          return {
            select: selectMock,
            update: updateMock
          };
        }
        return { insert: insertMock };
      });

      await adminWorkflowController.updateWorkflowRequestStage(mockReq, mockRes);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Workflow request stage updated successfully',
        data: updatedRequest
      });
    });

    it('should validate stage enum values', async () => {
      mockReq.params.id = 'request-1';
      mockReq.body = { stage: 'invalid_stage' };

      await expect(
        adminWorkflowController.updateWorkflowRequestStage(mockReq, mockRes)
      ).rejects.toThrow(ApiError);
    });

    it('should return 404 if request not found', async () => {
      mockReq.params.id = 'non-existent-id';
      mockReq.body = { stage: 'reviewing' };

      supabaseAdmin.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      await expect(
        adminWorkflowController.updateWorkflowRequestStage(mockReq, mockRes)
      ).rejects.toThrow(ApiError);
    });

    it('should log audit trail for stage change', async () => {
      mockReq.params.id = 'request-1';
      mockReq.body = { stage: 'contract_signed' };

      const mockRequest = {
        id: 'request-1',
        status: 'negotiation',
        client_id: 'client-1'
      };

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockRequest,
            error: null
          })
        })
      });

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockRequest, status: 'contract_signed' },
              error: null
            })
          })
        })
      });

      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'workflow_requests') {
          return { select: selectMock, update: updateMock };
        }
        return { insert: insertMock };
      });

      await adminWorkflowController.updateWorkflowRequestStage(mockReq, mockRes);

      expect(insertMock).toHaveBeenCalledWith([
        expect.objectContaining({
          action: 'workflow_request_stage_updated',
          resource_type: 'workflow_request',
          resource_id: 'request-1',
          changes: expect.objectContaining({
            before: { status: 'negotiation' },
            after: { status: 'contract_signed' }
          })
        })
      ]);
    });
  });

  describe('DELETE /api/v1/admin/workflows/:id - deleteWorkflow', () => {
    it('should archive workflow (soft delete)', async () => {
      mockReq.params.id = 'workflow-1';

      const mockWorkflow = {
        id: 'workflow-1',
        status: 'deployed',
        client_id: 'client-1'
      };

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockWorkflow,
            error: null
          })
        })
      });

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockWorkflow, status: 'archived' },
              error: null
            })
          })
        })
      });

      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'workflows') {
          return { select: selectMock, update: updateMock };
        }
        return { insert: insertMock };
      });

      await adminWorkflowController.deleteWorkflow(mockReq, mockRes);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Workflow archived successfully'
      });
    });

    it('should return 404 if workflow not found', async () => {
      mockReq.params.id = 'non-existent-id';

      supabaseAdmin.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      await expect(
        adminWorkflowController.deleteWorkflow(mockReq, mockRes)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('GET /api/v1/admin/workflows/:id/stats - getWorkflowStats', () => {
    it('should calculate workflow performance metrics', async () => {
      mockReq.params.id = 'workflow-1';

      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Content Generator',
        cost_per_execution: 5.00,
        revenue_per_execution: 50.00
      };

      const mockExecutions = [
        {
          status: 'completed',
          duration_seconds: 30,
          created_at: new Date().toISOString()
        },
        {
          status: 'completed',
          duration_seconds: 25,
          created_at: new Date().toISOString()
        },
        {
          status: 'failed',
          duration_seconds: 10,
          created_at: new Date().toISOString()
        }
      ];

      const selectMock = jest.fn();
      selectMock.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockWorkflow,
            error: null
          })
        })
      });
      selectMock.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({
          data: mockExecutions,
          error: null
        })
      });

      supabaseAdmin.from = jest.fn(() => ({ select: selectMock }));

      await adminWorkflowController.getWorkflowStats(mockReq, mockRes);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          workflow_id: 'workflow-1',
          workflow_name: 'Content Generator',
          total_executions: 3,
          success_count: 2,
          failure_count: 1,
          pending_count: 0,
          processing_count: 0,
          success_rate: '66.67',
          avg_duration_seconds: '27.50',
          total_revenue: '100.00',
          total_cost: '10.00',
          profit: '90.00',
          executions_this_month: 3,
          revenue_this_month: '100.00'
        }
      });
    });

    it('should return 404 if workflow not found', async () => {
      mockReq.params.id = 'non-existent-id';

      supabaseAdmin.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      await expect(
        adminWorkflowController.getWorkflowStats(mockReq, mockRes)
      ).rejects.toThrow(ApiError);
    });

    it('should handle workflows with no executions', async () => {
      mockReq.params.id = 'workflow-1';

      const mockWorkflow = {
        id: 'workflow-1',
        name: 'New Workflow',
        cost_per_execution: 5.00,
        revenue_per_execution: 50.00
      };

      const selectMock = jest.fn();
      selectMock.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockWorkflow,
            error: null
          })
        })
      });
      selectMock.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      supabaseAdmin.from = jest.fn(() => ({ select: selectMock }));

      await adminWorkflowController.getWorkflowStats(mockReq, mockRes);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          total_executions: 0,
          success_rate: '0'
        })
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      supabaseAdmin.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection error' }
            })
          })
        })
      });

      await expect(
        adminWorkflowController.getWorkflows(mockReq, mockRes)
      ).rejects.toThrow(ApiError);
    });
  });
});
