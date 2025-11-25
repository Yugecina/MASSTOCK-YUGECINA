/**
 * Admin Client Service
 * API calls for admin client management
 *
 * NOTE: api interceptor returns response.data directly, so:
 * - response = { success: true, data: {...} }
 * - response.data = the actual data we want
 */

import api from './api';

export const adminClientService = {
  // ============================================
  // CLIENT CRUD
  // ============================================

  /**
   * Create a new client (company)
   * @param {Object} data - { name, plan, subscription_amount }
   */
  createClient: async (data) => {
    console.log('📡 adminClientService.createClient: Starting', { data });
    try {
      const response = await api.post('/v1/admin/clients', data);
      console.log('✅ adminClientService.createClient: Success', {
        client: response?.data
      });
      return response;
    } catch (error) {
      console.error('❌ adminClientService.createClient: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Update a client
   * @param {string} clientId - Client UUID
   * @param {Object} data - { name, plan, subscription_amount, status }
   */
  updateClient: async (clientId, data) => {
    console.log('📡 adminClientService.updateClient: Starting', { clientId, data });
    try {
      const response = await api.put(`/v1/admin/clients/${clientId}`, data);
      console.log('✅ adminClientService.updateClient: Success', {
        client: response?.data
      });
      return response;
    } catch (error) {
      console.error('❌ adminClientService.updateClient: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Delete a client (soft delete - suspends)
   * @param {string} clientId - Client UUID
   */
  deleteClient: async (clientId) => {
    console.log('📡 adminClientService.deleteClient: Starting', { clientId });
    try {
      const response = await api.delete(`/v1/admin/clients/${clientId}`);
      console.log('✅ adminClientService.deleteClient: Success');
      return response;
    } catch (error) {
      console.error('❌ adminClientService.deleteClient: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // ============================================
  // CLIENT DETAIL
  // ============================================

  /**
   * Get client details with stats
   */
  getClientDetail: async (clientId) => {
    console.log('📡 adminClientService.getClientDetail: Starting', { clientId });
    try {
      const response = await api.get(`/v1/admin/clients/${clientId}`);
      console.log('✅ adminClientService.getClientDetail: Response', {
        response,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        client: response?.data?.client,
        stats: response?.data?.stats
      });
      return response;
    } catch (error) {
      console.error('❌ adminClientService.getClientDetail: Error', {
        error: error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // ============================================
  // CLIENT MEMBERS
  // ============================================

  /**
   * Get all members of a client
   * Returns: { members: [...], total: X, client_id, client_name, owners_count, collaborators_count }
   */
  getClientMembers: async (clientId) => {
    console.log('📡 adminClientService.getClientMembers: Starting', { clientId });
    try {
      const response = await api.get(`/v1/admin/clients/${clientId}/members`);
      console.log('✅ adminClientService.getClientMembers: Response', {
        response,
        members: response?.data?.members,
        total: response?.data?.total
      });
      // api interceptor returns response.data, so response = { success, data }
      return response?.data || { members: [], total: 0 };
    } catch (error) {
      console.error('❌ adminClientService.getClientMembers: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Add a user to a client
   */
  addClientMember: async (clientId, userId, role = 'collaborator') => {
    console.log('📡 adminClientService.addClientMember: Starting', { clientId, userId, role });
    try {
      const response = await api.post(`/v1/admin/clients/${clientId}/members`, {
        user_id: userId,
        role
      });
      console.log('✅ adminClientService.addClientMember: Success', { response });
      return response;
    } catch (error) {
      console.error('❌ adminClientService.addClientMember: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Update member role
   */
  updateMemberRole: async (clientId, memberId, role) => {
    console.log('📡 adminClientService.updateMemberRole: Starting', { clientId, memberId, role });
    try {
      const response = await api.put(`/v1/admin/clients/${clientId}/members/${memberId}`, {
        role
      });
      console.log('✅ adminClientService.updateMemberRole: Success');
      return response;
    } catch (error) {
      console.error('❌ adminClientService.updateMemberRole: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Remove member from client
   */
  removeMember: async (clientId, memberId) => {
    console.log('📡 adminClientService.removeMember: Starting', { clientId, memberId });
    try {
      const response = await api.delete(`/v1/admin/clients/${clientId}/members/${memberId}`);
      console.log('✅ adminClientService.removeMember: Success');
      return response;
    } catch (error) {
      console.error('❌ adminClientService.removeMember: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Search users for adding to clients
   * Returns: { users: [...], total: X }
   */
  searchUsers: async (query, excludeClientId = null) => {
    console.log('📡 adminClientService.searchUsers: Starting', { 
      query, 
      excludeClientId,
      queryLength: query?.length,
      queryType: typeof query
    });
    try {
      const params = { q: query };
      if (excludeClientId) {
        params.exclude_client_id = excludeClientId;
      }
      console.log('📡 adminClientService.searchUsers: Calling API', { 
        url: '/v1/admin/users/search',
        params 
      });
      
      const response = await api.get('/v1/admin/users/search', { params });
      
      console.log('✅ adminClientService.searchUsers: Raw response received', {
        response,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : [],
        responseSuccess: response?.success,
        responseData: response?.data,
        responseDataType: typeof response?.data,
        responseDataKeys: response?.data ? Object.keys(response.data) : [],
        users: response?.data?.users,
        usersLength: response?.data?.users?.length,
        total: response?.data?.total
      });
      
      // api interceptor returns response.data, so response = { success, data }
      // We need to return response.data which contains { users, total }
      const result = response?.data || { users: [], total: 0 };
      console.log('✅ adminClientService.searchUsers: Returning', {
        result,
        resultKeys: Object.keys(result),
        users: result.users,
        usersLength: result.users?.length,
        total: result.total
      });
      return result;
    } catch (error) {
      console.error('❌ adminClientService.searchUsers: Error', {
        error,
        errorMessage: error.message,
        errorResponse: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // ============================================
  // CLIENT WORKFLOWS
  // ============================================

  /**
   * Get all workflows of a client
   * Returns: { workflows: [...], total: X, client_id, client_name }
   */
  getClientWorkflows: async (clientId) => {
    console.log('📡 adminClientService.getClientWorkflows: Starting', { clientId });
    try {
      const response = await api.get(`/v1/admin/clients/${clientId}/workflows`);
      console.log('✅ adminClientService.getClientWorkflows: Response', {
        workflows: response?.data?.workflows,
        total: response?.data?.total
      });
      return response?.data || { workflows: [], total: 0 };
    } catch (error) {
      console.error('❌ adminClientService.getClientWorkflows: Error', {
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  },

  /**
   * Assign a workflow template to a client
   */
  assignWorkflow: async (clientId, templateId, customName = null) => {
    console.log('📡 adminClientService.assignWorkflow: Starting', { clientId, templateId, customName });
    try {
      const payload = { template_id: templateId };
      if (customName) {
        payload.name = customName;
      }
      const response = await api.post(`/v1/admin/clients/${clientId}/workflows`, payload);
      console.log('✅ adminClientService.assignWorkflow: Success');
      return response;
    } catch (error) {
      console.error('❌ adminClientService.assignWorkflow: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Remove workflow from client
   */
  removeWorkflow: async (clientId, workflowId) => {
    console.log('📡 adminClientService.removeWorkflow: Starting', { clientId, workflowId });
    try {
      const response = await api.delete(`/v1/admin/clients/${clientId}/workflows/${workflowId}`);
      console.log('✅ adminClientService.removeWorkflow: Success');
      return response;
    } catch (error) {
      console.error('❌ adminClientService.removeWorkflow: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // ============================================
  // CLIENT EXECUTIONS
  // ============================================

  /**
   * Get all executions of a client with filters
   * Returns: { executions: [...], pagination: {...}, stats: {...} }
   */
  getClientExecutions: async (clientId, filters = {}) => {
    console.log('📡 adminClientService.getClientExecutions: Starting', { clientId, filters });
    try {
      const response = await api.get(`/v1/admin/clients/${clientId}/executions`, {
        params: filters
      });
      console.log('✅ adminClientService.getClientExecutions: Response', {
        executions: response?.data?.executions,
        pagination: response?.data?.pagination,
        stats: response?.data?.stats
      });
      return response?.data || { executions: [], pagination: {}, stats: {} };
    } catch (error) {
      console.error('❌ adminClientService.getClientExecutions: Error', {
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  },

  // ============================================
  // CLIENT ACTIVITY
  // ============================================

  /**
   * Get audit logs for a client
   * Returns: { activity: [...], total: X }
   */
  getClientActivity: async (clientId, params = {}) => {
    console.log('📡 adminClientService.getClientActivity: Starting', { clientId, params });
    try {
      const response = await api.get(`/v1/admin/clients/${clientId}/activity`, {
        params
      });
      console.log('✅ adminClientService.getClientActivity: Response', {
        activity: response?.data?.activity,
        total: response?.data?.total
      });
      return response?.data || { activity: [], total: 0 };
    } catch (error) {
      console.error('❌ adminClientService.getClientActivity: Error', {
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  },

  // ============================================
  // WORKFLOW TEMPLATES
  // ============================================

  /**
   * Get all active workflow templates
   * Returns: { templates: [...], total: X }
   */
  getWorkflowTemplates: async () => {
    console.log('📡 adminClientService.getWorkflowTemplates: Starting');
    try {
      const response = await api.get('/v1/admin/workflow-templates');
      console.log('✅ adminClientService.getWorkflowTemplates: Response', {
        templates: response?.data?.templates,
        total: response?.data?.total
      });
      return response?.data || { templates: [], total: 0 };
    } catch (error) {
      console.error('❌ adminClientService.getWorkflowTemplates: Error', {
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  },

  /**
   * Get single workflow template
   */
  getWorkflowTemplate: async (templateId) => {
    console.log('📡 adminClientService.getWorkflowTemplate: Starting', { templateId });
    try {
      const response = await api.get(`/v1/admin/workflow-templates/${templateId}`);
      console.log('✅ adminClientService.getWorkflowTemplate: Response', { response });
      return response;
    } catch (error) {
      console.error('❌ adminClientService.getWorkflowTemplate: Error', {
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }
};

export default adminClientService;
