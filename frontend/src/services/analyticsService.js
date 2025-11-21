import api from './api';

/**
 * Analytics Service
 * Handles all analytics-related API calls
 */
export const analyticsService = {
  /**
   * Get analytics overview with KPIs
   * @param {string} period - Time period (7d, 30d, 90d)
   * @returns {Promise<Object>} Overview metrics
   */
  getOverview: (period) => api.get('/v1/admin/analytics/overview', { params: { period } }),

  /**
   * Get executions trend over time
   * @param {string} period - Time period (7d, 30d, 90d)
   * @returns {Promise<Array>} Trend data
   */
  getExecutionsTrend: (period) => api.get('/v1/admin/analytics/executions-trend', { params: { period } }),

  /**
   * Get workflow performance metrics
   * @param {string} period - Time period (7d, 30d, 90d)
   * @returns {Promise<Array>} Workflow performance data
   */
  async getWorkflowPerformance(period = '30d') {
    // Note: api.get already returns response.data due to interceptor
    return api.get('/v1/admin/analytics/workflow-performance', {
      params: { period }
    });
  },

  /**
   * Get revenue breakdown
   * @param {string} type - Breakdown type (client, workflow)
   * @param {string} period - Time period (7d, 30d, 90d)
   * @returns {Promise<Array>} Revenue breakdown data
   */
  async getRevenueBreakdown(type = 'client', period = '30d') {
    // Note: api.get already returns response.data due to interceptor
    return api.get('/v1/admin/analytics/revenue-breakdown', {
      params: { type, period }
    });
  },

  /**
   * Get recent failed executions
   * @param {string} period - Time period (7d, 30d, 90d)
   * @param {number} limit - Maximum number of failures to return
   * @returns {Promise<Array>} Failed executions data
   */
  async getFailures(period = '30d', limit = 100) {
    // Note: api.get already returns response.data due to interceptor
    return api.get('/v1/admin/analytics/failures', {
      params: { period, limit }
    });
  }
};
