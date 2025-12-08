import api from './api';

interface GetExecutionsParams {
  limit?: number;
  offset?: number;
  status?: string;
  workflow_id?: string;
  user_id?: string;
  fields?: string;
}

export const workflowService = {
  list: (): Promise<any> => api.get('/v1/workflows'),

  get: (id: string): Promise<any> => api.get(`/v1/workflows/${id}`),

  /**
   * Execute a workflow
   * @param {string} id - Workflow ID
   * @param {Object|FormData} data - Input data (JSON object or FormData for file uploads)
   */
  execute: (id: string, data: Record<string, any> | FormData): Promise<any> => {
    // If data is FormData (for workflows with file uploads like nano_banana), send it directly
    if (data instanceof FormData) {
      return api.post(`/v1/workflows/${id}/execute`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    // Otherwise, send as JSON with input_data wrapper
    return api.post(`/v1/workflows/${id}/execute`, { input_data: data });
  },

  getExecution: (id: string): Promise<any> => api.get(`/v1/executions/${id}`),

  getExecutions: (workflowId: string): Promise<any> =>
    api.get(`/v1/workflows/${workflowId}/executions`),

  /**
   * Get all executions for the client with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of executions to fetch (default: 20)
   * @param {number} params.offset - Offset for pagination (default: 0)
   * @param {string} params.status - Filter by status (optional)
   * @param {string} params.workflow_id - Filter by workflow (optional)
   * @param {string} params.user_id - Filter by user (optional)
   * @param {string} params.fields - Comma-separated list of fields to return (optional)
   */
  getAllExecutions: (params: GetExecutionsParams = {}): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.workflow_id && params.workflow_id !== 'all') queryParams.append('workflow_id', params.workflow_id);
    if (params.user_id && params.user_id !== 'all') queryParams.append('user_id', params.user_id);
    if (params.fields) queryParams.append('fields', params.fields);
    return api.get(`/v1/workflows/executions/all?${queryParams.toString()}`);
  },

  /**
   * Get batch results for workflows with batch processing
   * @param {string} executionId - Execution ID
   */
  getBatchResults: (executionId: string): Promise<any> =>
    api.get(`/v1/executions/${executionId}/batch-results`),

  /**
   * Get dashboard stats
   */
  getDashboardStats: (): Promise<any> => api.get('/v1/workflows/stats/dashboard'),

  /**
   * Get client members (for filtering executions by collaborator)
   */
  getClientMembers: (): Promise<any> => api.get('/v1/workflows/client/members'),
};
