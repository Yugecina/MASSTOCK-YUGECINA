/**
 * Admin Workflow Service
 * API service for admin workflow management
 */

import api from './api';
import { Workflow } from '@/types';

interface WorkflowWithStats extends Workflow {
  cost_per_execution: string;
  revenue_per_execution: string;
}

interface WorkflowFilters {
  status?: string;
  client_id?: string;
  search?: string;
}

// Mock data from Supabase (temporary until backend is running)
const mockSupabaseWorkflows: WorkflowWithStats[] = [
  { id: 'fcc36a2a-8be5-402d-b907-bb2a4f90751f', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'Batch Image Generator', description: 'Generate multiple AI images from a list of prompts using Midjourney API', status: 'deployed', cost_per_execution: '15.00', revenue_per_execution: '250.00', created_at: '2025-11-16T12:13:12.523197Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:12.523197Z' },
  { id: '5a16b610-8863-47bf-85d5-dfe81358ada0', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'Style Transfer Pipeline', description: 'Apply artistic styles to client images automatically', status: 'deployed', cost_per_execution: '10.00', revenue_per_execution: '180.00', created_at: '2025-11-16T12:13:12.610913Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:12.610913Z' },
  { id: '6f6a5ab0-fc7e-43dd-a010-5b1d545e04d3', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'Product Photo Enhancer', description: 'AI-powered product photography enhancement and background removal', status: 'deployed', cost_per_execution: '8.00', revenue_per_execution: '150.00', created_at: '2025-11-16T12:13:12.688276Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:12.688276Z' },
  { id: 'c67dd443-ce81-4a05-87d7-50f817213fe7', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'Social Media Content Generator', description: 'Generate branded social media visuals with text overlays', status: 'deployed', cost_per_execution: '12.00', revenue_per_execution: '200.00', created_at: '2025-11-16T12:13:12.764249Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:12.764249Z' },
  { id: 'b0cf1772-b930-40c1-89a0-2458d5f92349', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'Logo Variation Creator', description: 'Generate multiple logo variations and color schemes', status: 'deployed', cost_per_execution: '20.00', revenue_per_execution: '350.00', created_at: '2025-11-16T12:13:12.853365Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:12.853365Z' },
  { id: '43adb353-66ed-49e6-9fdf-dbc424784c39', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'Moodboard Generator', description: 'Create visual moodboards from keyword inputs', status: 'deployed', cost_per_execution: '5.00', revenue_per_execution: '120.00', created_at: '2025-11-16T12:13:12.925688Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:12.925688Z' },
  { id: '3ae5a82b-6040-42d3-84b4-979492734ccf', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'Image Upscaler Pro', description: 'AI-powered image upscaling up to 4K resolution', status: 'deployed', cost_per_execution: '6.00', revenue_per_execution: '100.00', created_at: '2025-11-16T12:13:13.009338Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:13.009338Z' },
  { id: '595cc397-91d9-4eb7-beee-42d06e94e72b', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'Portrait Background Replacer', description: 'Replace portrait backgrounds with AI-generated scenes', status: 'deployed', cost_per_execution: '11.00', revenue_per_execution: '190.00', created_at: '2025-11-16T12:13:13.084126Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:13.084126Z' },
  { id: '77f37b50-7468-46dd-be45-a427b8d34a00', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'Batch Watermark Applier', description: 'Apply custom watermarks to large image batches', status: 'deployed', cost_per_execution: '2.00', revenue_per_execution: '50.00', created_at: '2025-11-16T12:13:13.165894Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:13.165894Z' },
  { id: '780d84d4-d7a2-425e-9142-0e5dc12cecf3', client_id: 'a76e631c-4dc4-4abc-b759-9f7c225c142b', name: 'AI Avatar Generator', description: 'Generate professional AI avatars from photos', status: 'deployed', cost_per_execution: '18.00', revenue_per_execution: '300.00', created_at: '2025-11-16T12:13:13.238136Z', config: {}, version: 1, updated_at: '2025-11-16T12:13:13.238136Z' }
];

const USE_MOCK = false; // Set to false when backend is ready

export const adminWorkflowService = {
  /**
   * Get all workflows with stats
   * @param {number} page - Page number
   * @param {object} filters - Filter options (status, client_id, search)
   * @returns {Promise}
   */
  getWorkflows: async (page: number = 1, filters: WorkflowFilters = {}): Promise<any> => {
    if (USE_MOCK) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let filtered = [...mockSupabaseWorkflows];

      // Apply filters
      if (filters.status) {
        filtered = filtered.filter(w => w.status === filters.status);
      }
      if (filters.client_id) {
        filtered = filtered.filter(w => w.client_id === filters.client_id);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(w =>
          w.name.toLowerCase().includes(search) ||
          w.description?.toLowerCase().includes(search)
        );
      }

      // Return mock data in the same format as backend
      // (axios interceptor already unwraps response.data)
      return {
        success: true,
        data: {
          workflows: filtered,
          pagination: {
            total: filtered.length,
            page: page,
            limit: 10,
            totalPages: Math.ceil(filtered.length / 10)
          }
        }
      };
    }

    return api.get('/v1/admin/workflows', {
      params: {
        page,
        limit: 10,
        ...filters,
      },
    });
  },

  /**
   * Get single workflow with details
   * @param {string} id - Workflow ID
   * @returns {Promise}
   */
  getWorkflow: (id: string): Promise<any> => {
    return api.get(`/v1/admin/workflows/${id}`);
  },

  /**
   * Get workflow statistics
   * @param {string} id - Workflow ID
   * @returns {Promise}
   */
  getWorkflowStats: (id: string): Promise<any> => {
    return api.get(`/v1/admin/workflows/${id}/stats`);
  },

  /**
   * Get all workflow requests
   * @param {number} page - Page number
   * @param {object} filters - Filter options (status, client_id, search)
   * @returns {Promise}
   */
  getWorkflowRequests: (page: number = 1, filters: WorkflowFilters = {}): Promise<any> => {
    return api.get('/v1/admin/workflow-requests', {
      params: {
        page,
        limit: 10,
        ...filters,
      },
    });
  },

  /**
   * Get single workflow request
   * @param {string} id - Request ID
   * @returns {Promise}
   */
  getWorkflowRequest: (id: string): Promise<any> => {
    return api.get(`/v1/admin/workflow-requests/${id}`);
  },

  /**
   * Update workflow request stage
   * @param {string} id - Request ID
   * @param {string} stage - New stage
   * @returns {Promise}
   */
  updateWorkflowRequestStage: (id: string, stage: string): Promise<any> => {
    return api.put(`/v1/admin/workflow-requests/${id}/stage`, { stage });
  },

  /**
   * Archive workflow (soft delete)
   * @param {string} id - Workflow ID
   * @returns {Promise}
   */
  deleteWorkflow: (id: string): Promise<any> => {
    return api.delete(`/v1/admin/workflows/${id}`);
  },
};
