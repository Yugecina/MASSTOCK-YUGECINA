import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { analyticsService } from '../../services/analyticsService';

vi.mock('../../services/api');

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should fetch overview metrics with default period', async () => {
      const mockData = {
        success: true,
        data: {
          totalUsers: 45,
          activeUsers: 32,
          totalExecutions: 1234,
          successRate: 94.5,
          failureRate: 5.5,
          revenueThisMonth: 15000,
          revenueLastMonth: 13500,
          successTrend: 11.6,
          executionsTrend: 8.2
        }
      };

      api.get.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getOverview();

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/overview', { params: { period: undefined } });
      expect(result).toEqual(mockData);
    });

    it('should fetch overview metrics with custom period', async () => {
      const mockData = {
        success: true,
        data: { totalUsers: 50 }
      };

      api.get.mockResolvedValueOnce(mockData);

      await analyticsService.getOverview('90d');

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/overview', { params: { period: '90d' } });
    });

    it('should throw error when API call fails', async () => {
      const error = new Error('Network error');
      api.get.mockRejectedValueOnce(error);

      await expect(analyticsService.getOverview()).rejects.toThrow('Network error');
    });
  });

  describe('getExecutionsTrend', () => {
    it('should fetch executions trend with default period', async () => {
      const mockData = {
        success: true,
        period: '7d',
        data: [
          { date: '2025-01-10', count: 45 },
          { date: '2025-01-11', count: 52 }
        ]
      };

      api.get.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getExecutionsTrend();

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/executions-trend', {
        params: { period: undefined }
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch executions trend with custom period', async () => {
      const mockData = {
        success: true,
        period: '90d',
        data: []
      };

      api.get.mockResolvedValueOnce(mockData);

      await analyticsService.getExecutionsTrend('90d');

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/executions-trend', {
        params: { period: '90d' }
      });
    });

    it('should handle empty trend data', async () => {
      const mockData = {
        success: true,
        data: []
      };

      api.get.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getExecutionsTrend();

      expect(result).toEqual(mockData);
    });
  });

  describe('getWorkflowPerformance', () => {
    it('should fetch workflow performance with default period', async () => {
      const mockData = {
        success: true,
        period: '30d',
        data: [
          {
            id: '1',
            name: 'Workflow A',
            executions: 100,
            successRate: 95.5,
            avgDuration: 120,
            revenue: 5000
          }
        ]
      };

      api.get.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getWorkflowPerformance();

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/workflow-performance', {
        params: { period: '30d' }
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch workflow performance with custom period', async () => {
      const mockData = {
        success: true,
        data: []
      };

      api.get.mockResolvedValueOnce(mockData);

      await analyticsService.getWorkflowPerformance('7d');

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/workflow-performance', {
        params: { period: '7d' }
      });
    });
  });

  describe('getRevenueBreakdown', () => {
    it('should fetch revenue breakdown by client with default period', async () => {
      const mockData = {
        success: true,
        type: 'client',
        period: '30d',
        data: [
          { id: '1', name: 'Client A', revenue: 5000 }
        ]
      };

      api.get.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getRevenueBreakdown('client');

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/revenue-breakdown', {
        params: { type: 'client', period: '30d' }
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch revenue breakdown by workflow', async () => {
      const mockData = {
        success: true,
        type: 'workflow',
        data: []
      };

      api.get.mockResolvedValueOnce(mockData);

      await analyticsService.getRevenueBreakdown('workflow', '90d');

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/revenue-breakdown', {
        params: { type: 'workflow', period: '90d' }
      });
    });
  });

  describe('getFailures', () => {
    it('should fetch failures with default period and limit', async () => {
      const mockData = {
        success: true,
        period: '30d',
        data: [
          {
            id: '1',
            workflow_name: 'Workflow A',
            client_name: 'Client A',
            error_message: 'Timeout error',
            created_at: '2025-01-15T10:00:00Z'
          }
        ],
        total: 1
      };

      api.get.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getFailures();

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/failures', {
        params: { period: '30d', limit: 100 }
      });
      expect(result).toEqual(mockData);
    });

    it('should fetch failures with custom period and limit', async () => {
      const mockData = {
        success: true,
        data: []
      };

      api.get.mockResolvedValueOnce(mockData);

      await analyticsService.getFailures('7d', 50);

      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/failures', {
        params: { period: '7d', limit: 50 }
      });
    });

    it('should handle empty failures data', async () => {
      const mockData = {
        success: true,
        data: []
      };

      api.get.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getFailures();

      expect(result).toEqual(mockData);
    });
  });
});
