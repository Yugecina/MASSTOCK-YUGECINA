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
   * Get batch results for workflows with batch processing
   * @param {string} executionId - Execution ID
   */
  getBatchResults: (executionId) => api.get(`/v1/executions/${executionId}/batch-results`),

  /**
   * Get dashboard stats
   */
  getDashboardStats: () => api.get('/v1/workflows/stats/dashboard'),
}
