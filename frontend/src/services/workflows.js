import api from './api'

export const workflowService = {
  list: () => api.get('/v1/workflows'),
  get: (id) => api.get(`/v1/workflows/${id}`),

  /**
   * Execute a workflow
   * @param {string} id - Workflow ID
   * @param {Object|FormData} data - Input data (JSON object or FormData for file uploads)
   */
  execute: (id, data) => {
    // If data is FormData (for workflows with file uploads like nano_banana), send it directly
    if (data instanceof FormData) {
      return api.post(`/v1/workflows/${id}/execute`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    // Otherwise, send as JSON with input_data wrapper
    return api.post(`/v1/workflows/${id}/execute`, { input_data: data });
  },

  getExecution: (id) => api.get(`/v1/executions/${id}`),
  getExecutions: (workflowId) => api.get(`/v1/workflows/${workflowId}/executions`),

  /**
   * Get all executions for the client with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of executions to fetch (default: 20)
   * @param {number} params.offset - Offset for pagination (default: 0)
   * @param {string} params.status - Filter by status (optional)
   * @param {string} params.workflow_id - Filter by workflow (optional)
   * @param {string} params.user_id - Filter by user (optional)
   */
  getAllExecutions: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.offset) queryParams.append('offset', params.offset)
    if (params.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params.workflow_id && params.workflow_id !== 'all') queryParams.append('workflow_id', params.workflow_id)
    if (params.user_id && params.user_id !== 'all') queryParams.append('user_id', params.user_id)
    return api.get(`/v1/workflows/executions/all?${queryParams.toString()}`)
  },

  /**
   * Get batch results for workflows with batch processing
   * @param {string} executionId - Execution ID
   */
  getBatchResults: (executionId) => api.get(`/v1/executions/${executionId}/batch-results`),

  /**
   * Get dashboard stats
   */
  getDashboardStats: () => api.get('/v1/workflows/stats/dashboard'),

  /**
   * Get client members (for filtering executions by collaborator)
   */
  getClientMembers: () => api.get('/v1/workflows/client/members'),
}
