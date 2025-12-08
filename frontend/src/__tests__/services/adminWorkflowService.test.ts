/**
 * Admin Workflow Service Tests
 * Tests for all admin workflow API methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from '../../services/api';
import { adminWorkflowService } from '../../services/adminWorkflowService';

vi.mock('../../services/api');

describe('adminWorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getWorkflows', () => {
    it('should fetch workflows with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          workflows: [
            {
              id: '1',
              name: 'Test Workflow',
              client_id: 'client-1',
              status: 'deployed',
              stats: {
                total_executions: 100,
                success_rate: '95.00',
                revenue: '1000.00',
              },
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await adminWorkflowService.getWorkflows();

      expect(api.get).toHaveBeenCalledWith('/v1/admin/workflows', {
        params: { page: 1, limit: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch workflows with custom pagination and filters', async () => {
      const mockResponse = { success: true, data: { workflows: [] } };
      api.get.mockResolvedValue(mockResponse);

      const filters = { status: 'deployed', client_id: 'client-1', search: 'test' };
      await adminWorkflowService.getWorkflows(2, filters);

      expect(api.get).toHaveBeenCalledWith('/v1/admin/workflows', {
        params: { page: 2, limit: 10, ...filters },
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      api.get.mockRejectedValue(error);

      await expect(adminWorkflowService.getWorkflows()).rejects.toThrow('Network error');
    });
  });

  describe('getWorkflow', () => {
    it('should fetch single workflow by id', async () => {
      const mockResponse = {
        success: true,
        data: {
          workflow: { id: '1', name: 'Test Workflow' },
          client: { id: 'client-1', name: 'Test Client' },
          stats: { total_executions: 100 },
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await adminWorkflowService.getWorkflow('1');

      expect(api.get).toHaveBeenCalledWith('/v1/admin/workflows/1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle workflow not found error', async () => {
      const error = new Error('Workflow not found');
      api.get.mockRejectedValue(error);

      await expect(adminWorkflowService.getWorkflow('999')).rejects.toThrow(
        'Workflow not found'
      );
    });
  });

  describe('getWorkflowStats', () => {
    it('should fetch workflow statistics', async () => {
      const mockResponse = {
        success: true,
        data: {
          workflow_id: '1',
          total_executions: 100,
          success_rate: '95.00',
          avg_duration_seconds: '45.50',
          total_revenue: '5000.00',
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await adminWorkflowService.getWorkflowStats('1');

      expect(api.get).toHaveBeenCalledWith('/v1/admin/workflows/1/stats');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getWorkflowRequests', () => {
    it('should fetch workflow requests with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          requests: [
            {
              id: 'req-1',
              title: 'New Workflow Request',
              status: 'submitted',
              client_id: 'client-1',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await adminWorkflowService.getWorkflowRequests();

      expect(api.get).toHaveBeenCalledWith('/v1/admin/workflow-requests', {
        params: { page: 1, limit: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch workflow requests with filters', async () => {
      const mockResponse = { success: true, data: { requests: [] } };
      api.get.mockResolvedValue(mockResponse);

      const filters = { status: 'submitted', search: 'automation' };
      await adminWorkflowService.getWorkflowRequests(1, filters);

      expect(api.get).toHaveBeenCalledWith('/v1/admin/workflow-requests', {
        params: { page: 1, limit: 10, ...filters },
      });
    });
  });

  describe('getWorkflowRequest', () => {
    it('should fetch single workflow request by id', async () => {
      const mockResponse = {
        success: true,
        data: {
          request: { id: 'req-1', title: 'Test Request' },
          client: { id: 'client-1', name: 'Test Client' },
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await adminWorkflowService.getWorkflowRequest('req-1');

      expect(api.get).toHaveBeenCalledWith('/v1/admin/workflow-requests/req-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateWorkflowRequestStage', () => {
    it('should update workflow request stage', async () => {
      const mockResponse = {
        success: true,
        message: 'Workflow request stage updated successfully',
        data: { id: 'req-1', status: 'reviewing' },
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await adminWorkflowService.updateWorkflowRequestStage(
        'req-1',
        'reviewing'
      );

      expect(api.put).toHaveBeenCalledWith('/v1/admin/workflow-requests/req-1/stage', {
        stage: 'reviewing',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid stage error', async () => {
      const error = new Error('Invalid stage');
      api.put.mockRejectedValue(error);

      await expect(
        adminWorkflowService.updateWorkflowRequestStage('req-1', 'invalid')
      ).rejects.toThrow('Invalid stage');
    });
  });

  describe('deleteWorkflow', () => {
    it('should archive workflow (soft delete)', async () => {
      const mockResponse = {
        success: true,
        message: 'Workflow archived successfully',
      };

      api.delete.mockResolvedValue(mockResponse);

      const result = await adminWorkflowService.deleteWorkflow('1');

      expect(api.delete).toHaveBeenCalledWith('/v1/admin/workflows/1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle workflow not found error', async () => {
      const error = new Error('Workflow not found');
      api.delete.mockRejectedValue(error);

      await expect(adminWorkflowService.deleteWorkflow('999')).rejects.toThrow(
        'Workflow not found'
      );
    });
  });
});
