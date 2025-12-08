/**
 * Tests for Analytics Controller
 * Testing analytics and reporting endpoints for admin dashboard
 *
 * Tests follow TDD approach:
 * - Test overview KPI metrics
 * - Test executions trend with date filtering
 * - Test workflow performance metrics
 * - Test revenue breakdown
 * - Test failure analysis
 * - Test date range filtering (7d, 30d, 90d)
 * - Test error handling
 */

import * as analyticsController from '../../controllers/analyticsController';
import {  supabaseAdmin  } from '../../config/database';
import {  ApiError  } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logAuth: jest.fn(),
  logError: jest.fn(),
  logAudit: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('AnalyticsController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    req = {
      body: {},
      query: {},
      params: {},
      user: {
        id: 'admin-user-id',
        email: 'admin@masstock.com',
        role: 'admin'
      },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('GET /api/v1/admin/analytics/overview - getOverview', () => {
    it('should return analytics overview with all KPIs', async () => {
      req.query = {};

      let callCount = 0;
      supabaseAdmin.from = jest.fn((table) => {
        callCount++;

        // First call: total users
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { count: 45 },
              error: null
            })
          };
        }

        // Second call: active users
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { count: 38 },
              error: null
            })
          };
        }

        // Third call: execution stats
        if (callCount === 3) {
          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { total: 2450, successful: 2308, failed: 142 },
              error: null
            })
          };
        }

        // Fourth call: revenue this month
        if (callCount === 4) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { total_revenue: 12500 },
              error: null
            })
          };
        }

        // Fifth call: revenue last month
        if (callCount === 5) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { total_revenue: 11200 },
              error: null
            })
          };
        }

        // Remaining calls for executions trend
        return {
          select: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { count: 100 },
            error: null
          })
        };
      });

      await analyticsController.getOverview(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalUsers: 45,
            activeUsers: 38,
            totalExecutions: 2450,
            successRate: expect.any(Number),
            failureRate: expect.any(Number),
            revenueThisMonth: 12500,
            revenueLastMonth: 11200
          })
        })
      );
    });

    it('should calculate success rate correctly', async () => {
      req.query = {};

      let callCount = 0;
      supabaseAdmin.from = jest.fn((table) => {
        callCount++;

        if (callCount === 1 || callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { count: 10 },
              error: null
            })
          };
        }

        if (callCount === 3) {
          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { total: 100, successful: 94, failed: 6 },
              error: null
            })
          };
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { total_revenue: 1000, count: 50 },
            error: null
          })
        };
      });

      await analyticsController.getOverview(req, res);

      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.data.successRate).toBeCloseTo(94.0, 1);
      expect(callArgs.data.failureRate).toBeCloseTo(6.0, 1);
    });

    it('should handle zero executions gracefully', async () => {
      req.query = {};

      let callCount = 0;
      supabaseAdmin.from = jest.fn(() => {
        callCount++;

        if (callCount === 3) {
          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { total: 0, successful: 0, failed: 0 },
              error: null
            })
          };
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { count: 5, total_revenue: 0 },
            error: null
          })
        };
      });

      await analyticsController.getOverview(req, res);

      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.data.successRate).toBe(0);
      expect(callArgs.data.failureRate).toBe(0);
    });
  });

  describe('GET /api/v1/admin/analytics/executions-trend - getExecutionsTrend', () => {
    it('should return executions trend for last 7 days by default', async () => {
      req.query = {};

      const mockTrendData = [
        { date: '2025-11-17', total: 150, successful: 141, failed: 9 },
        { date: '2025-11-16', total: 145, successful: 138, failed: 7 },
        { date: '2025-11-15', total: 160, successful: 152, failed: 8 },
        { date: '2025-11-14', total: 155, successful: 147, failed: 8 },
        { date: '2025-11-13', total: 140, successful: 133, failed: 7 },
        { date: '2025-11-12', total: 135, successful: 128, failed: 7 },
        { date: '2025-11-11', total: 130, successful: 124, failed: 6 }
      ];

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: mockTrendData,
        error: null
      });

      await analyticsController.getExecutionsTrend(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_executions_trend', { days: 7 });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockTrendData,
          period: '7d'
        })
      );
    });

    it('should support period parameter - 30 days', async () => {
      req.query = { period: '30d' };

      const mockTrendData = Array(30).fill(null).map((_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total: 100 + i,
        successful: 95 + i,
        failed: 5
      }));

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: mockTrendData,
        error: null
      });

      await analyticsController.getExecutionsTrend(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_executions_trend', { days: 30 });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          period: '30d',
          data: mockTrendData
        })
      );
    });

    it('should support period parameter - 90 days', async () => {
      req.query = { period: '90d' };

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      await analyticsController.getExecutionsTrend(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_executions_trend', { days: 90 });
    });

    it('should reject invalid period parameter', async () => {
      req.query = { period: 'invalid' };

      await expect(analyticsController.getExecutionsTrend(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid period. Must be 7d, 30d, or 90d',
        code: 'INVALID_PERIOD'
      });
    });

    it('should handle database errors gracefully', async () => {
      req.query = { period: '7d' };

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(analyticsController.getExecutionsTrend(req, res)).rejects.toMatchObject({
        statusCode: 500,
        message: 'Failed to fetch executions trend',
        code: 'DATABASE_ERROR'
      });
    });
  });

  describe('GET /api/v1/admin/analytics/workflow-performance - getWorkflowPerformance', () => {
    it('should return top workflows by executions', async () => {
      req.query = {};

      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Content Generation',
          executions: 500,
          successful: 475,
          failed: 25,
          avg_duration: 45.2,
          total_revenue: 2500
        },
        {
          id: 'workflow-2',
          name: 'SEO Optimization',
          executions: 350,
          successful: 340,
          failed: 10,
          avg_duration: 32.5,
          total_revenue: 1750
        },
        {
          id: 'workflow-3',
          name: 'Social Media Posting',
          executions: 280,
          successful: 270,
          failed: 10,
          avg_duration: 18.7,
          total_revenue: 1400
        }
      ];

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: mockWorkflows,
        error: null
      });

      await analyticsController.getWorkflowPerformance(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 'workflow-1',
              name: 'Content Generation',
              executions: 500,
              successRate: expect.any(Number),
              avgDuration: 45.2,
              revenue: 2500
            })
          ])
        })
      );
    });

    it('should calculate success rate for each workflow', async () => {
      req.query = {};

      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Test Workflow',
          executions: 100,
          successful: 94,
          failed: 6,
          avg_duration: 30,
          total_revenue: 500
        }
      ];

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: mockWorkflows,
        error: null
      });

      await analyticsController.getWorkflowPerformance(req, res);

      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.data[0].successRate).toBeCloseTo(94.0, 1);
    });

    it('should support period filtering', async () => {
      req.query = { period: '30d' };

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      await analyticsController.getWorkflowPerformance(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_workflow_performance', { days: 30 });
    });

    it('should handle empty results', async () => {
      req.query = {};

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      await analyticsController.getWorkflowPerformance(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: []
        })
      );
    });
  });

  describe('GET /api/v1/admin/analytics/revenue-breakdown - getRevenueBreakdown', () => {
    it('should return revenue by client', async () => {
      req.query = { type: 'client' };

      const mockRevenueByClient = [
        { client_id: 'client-1', client_name: 'ACME Corp', total_revenue: 5000, executions: 500 },
        { client_id: 'client-2', client_name: 'TechCo', total_revenue: 3500, executions: 350 },
        { client_id: 'client-3', client_name: 'StartupXYZ', total_revenue: 2000, executions: 200 }
      ];

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: mockRevenueByClient,
        error: null
      });

      await analyticsController.getRevenueBreakdown(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_revenue_by_client', { days: 30 });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'client',
          data: mockRevenueByClient
        })
      );
    });

    it('should return revenue by workflow', async () => {
      req.query = { type: 'workflow' };

      const mockRevenueByWorkflow = [
        { workflow_id: 'wf-1', workflow_name: 'Content Gen', total_revenue: 4500, executions: 450 },
        { workflow_id: 'wf-2', workflow_name: 'SEO Opt', total_revenue: 3000, executions: 300 }
      ];

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: mockRevenueByWorkflow,
        error: null
      });

      await analyticsController.getRevenueBreakdown(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_revenue_by_workflow', { days: 30 });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'workflow',
          data: mockRevenueByWorkflow
        })
      );
    });

    it('should default to client breakdown if type not specified', async () => {
      req.query = {};

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      await analyticsController.getRevenueBreakdown(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_revenue_by_client', { days: 30 });
    });

    it('should support period filtering', async () => {
      req.query = { type: 'client', period: '90d' };

      supabaseAdmin.rpc = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      await analyticsController.getRevenueBreakdown(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_revenue_by_client', { days: 90 });
    });

    it('should reject invalid type parameter', async () => {
      req.query = { type: 'invalid' };

      await expect(analyticsController.getRevenueBreakdown(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid type. Must be "client" or "workflow"',
        code: 'INVALID_TYPE'
      });
    });
  });

  describe('GET /api/v1/admin/analytics/failures - getFailures', () => {
    it('should return recent failures with details', async () => {
      req.query = {};

      const mockFailures = [
        {
          id: 'exec-1',
          workflow_id: 'wf-1',
          workflows: { name: 'Content Gen' },
          client_id: 'client-1',
          clients: { name: 'ACME Corp' },
          error_message: 'API timeout',
          error_stack_trace: 'Error: timeout at ...',
          created_at: '2025-11-17T10:30:00Z',
          duration_seconds: 120,
          retry_count: 2
        },
        {
          id: 'exec-2',
          workflow_id: 'wf-2',
          workflows: { name: 'SEO Opt' },
          client_id: 'client-2',
          clients: { name: 'TechCo' },
          error_message: 'Invalid input data',
          error_stack_trace: null,
          created_at: '2025-11-17T09:15:00Z',
          duration_seconds: 5,
          retry_count: 0
        }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockFailures,
          error: null
        })
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await analyticsController.getFailures(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].workflow_name).toBe('Content Gen');
      expect(response.data[0].client_name).toBe('ACME Corp');
    });

    it('should support limit parameter', async () => {
      req.query = { limit: '50' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await analyticsController.getFailures(req, res);

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });

    it('should support period filtering', async () => {
      req.query = { period: '7d' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await analyticsController.getFailures(req, res);

      expect(mockQuery.gte).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      req.query = {};

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await expect(analyticsController.getFailures(req, res)).rejects.toMatchObject({
        statusCode: 500,
        message: 'Failed to fetch failures',
        code: 'DATABASE_ERROR'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors in overview', async () => {
      req.query = {};

      supabaseAdmin.from = jest.fn(() => {
        throw new Error('Connection failed');
      });

      await expect(analyticsController.getOverview(req, res)).rejects.toThrow();
    });

    it('should handle null data gracefully', async () => {
      req.query = {};

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }));

      await analyticsController.getOverview(req, res);

      // Should handle null values with defaults
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.totalUsers).toBe(0);
    });
  });
});
