/**
 * Admin Resource Service
 * Consolidated service for all admin resources: users, clients, workflows
 * Replaces: adminUserService.ts, adminClientService.ts, adminWorkflowService.ts
 */

import api from './api';
import logger from '@/utils/logger';

// ============================================
// TYPES
// ============================================

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface UserFilters {
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  plan?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  role: string;
  client_id?: string;
}

interface UpdateUserData {
  email?: string;
  role?: string;
  status?: string;
}

// ============================================
// USERS
// ============================================

export const adminResourceService = {
  // ------------------------------------------
  // USER OPERATIONS
  // ------------------------------------------

  /**
   * Get all users with pagination and filters
   */
  getUsers: async (page: number = 1, filters: UserFilters = {}): Promise<any> => {
    const params: Record<string, string | number> = {
      page,
      limit: filters.limit || 50,
      ...(filters.role && { role: filters.role }),
      ...(filters.status && { status: filters.status }),
      ...(filters.plan && { plan: filters.plan }),
      ...(filters.search && { search: filters.search }),
    };

    logger.debug('👥 getUsers', { params });

    try {
      const response = await api.get('/admin/users', { params });
      logger.debug('✅ getUsers: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ getUsers: Error', {
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Get user details
   */
  getUserDetails: async (userId: string): Promise<any> => {
    logger.debug('👤 getUserDetails', { userId });
    try {
      return await api.get(`/admin/clients/${userId}`);
    } catch (error: any) {
      logger.error('❌ getUserDetails: Error', error.message);
      throw error;
    }
  },

  /**
   * Create a new user
   */
  createUser: async (userData: CreateUserData): Promise<any> => {
    logger.debug('➕ createUser', { email: userData.email });
    try {
      return await api.post('/admin/users', userData);
    } catch (error: any) {
      logger.error('❌ createUser: Error', error.message);
      throw error;
    }
  },

  /**
   * Update user
   */
  updateUser: async (userId: string, updateData: UpdateUserData): Promise<any> => {
    logger.debug('✏️ updateUser', { userId });
    try {
      return await api.put(`/admin/clients/${userId}`, updateData);
    } catch (error: any) {
      logger.error('❌ updateUser: Error', error.message);
      throw error;
    }
  },

  /**
   * Delete user (soft delete)
   */
  deleteUser: async (userId: string): Promise<any> => {
    logger.debug('🗑️ deleteUser', { userId });
    try {
      return await api.delete(`/admin/clients/${userId}`);
    } catch (error: any) {
      logger.error('❌ deleteUser: Error', error.message);
      throw error;
    }
  },

  /**
   * Block user (suspend)
   */
  blockUser: async (userId: string): Promise<any> => {
    logger.debug('🚫 blockUser', { userId });
    return await adminResourceService.updateUser(userId, { status: 'suspended' });
  },

  /**
   * Unblock user (activate)
   */
  unblockUser: async (userId: string): Promise<any> => {
    logger.debug('✅ unblockUser', { userId });
    return await adminResourceService.updateUser(userId, { status: 'active' });
  },

  /**
   * Search users for adding to clients
   */
  searchUsers: async (query: string, excludeClientId: string | null = null): Promise<any> => {
    const params: Record<string, string> = { q: query };
    if (excludeClientId) {
      params.exclude_client_id = excludeClientId;
    }

    logger.debug('🔍 searchUsers', { query, excludeClientId });

    try {
      const response = await api.get('/admin/users/search', { params });
      logger.debug('✅ searchUsers: Success', {
        count: response?.data?.users?.length,
      });
      return response?.data || { users: [], total: 0 };
    } catch (error: any) {
      logger.error('❌ searchUsers: Error', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // CLIENT OPERATIONS
  // ------------------------------------------

  /**
   * Get all clients with pagination and filters
   */
  getClients: async (page: number = 1, filters: any = {}): Promise<any> => {
    const params: Record<string, string | number> = {
      page,
      limit: filters.limit || 50,
      ...(filters.status && { status: filters.status }),
      ...(filters.plan && { plan: filters.plan }),
      ...(filters.search && { search: filters.search }),
    };

    logger.debug('🏢 getClients', { params });

    try {
      const response = await api.get('/admin/clients', { params });
      logger.debug('✅ getClients: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ getClients: Error', error.message);
      throw error;
    }
  },

  /**
   * Get client details with stats
   */
  getClientDetail: async (clientId: string): Promise<any> => {
    logger.debug('🏢 getClientDetail', { clientId });
    try {
      const response = await api.get(`/admin/clients/${clientId}`);
      logger.debug('✅ getClientDetail: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ getClientDetail: Error', error.message);
      throw error;
    }
  },

  /**
   * Create a new client
   */
  createClient: async (data: any): Promise<any> => {
    logger.debug('➕ createClient', { name: data.name });
    try {
      const response = await api.post('/admin/clients', data);
      logger.debug('✅ createClient: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ createClient: Error', error.message);
      throw error;
    }
  },

  /**
   * Update a client
   */
  updateClient: async (clientId: string, data: any): Promise<any> => {
    logger.debug('✏️ updateClient', { clientId });
    try {
      const response = await api.put(`/admin/clients/${clientId}`, data);
      logger.debug('✅ updateClient: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ updateClient: Error', error.message);
      throw error;
    }
  },

  /**
   * Delete a client (soft delete - suspends)
   */
  deleteClient: async (clientId: string): Promise<any> => {
    logger.debug('🗑️ deleteClient', { clientId });
    try {
      const response = await api.delete(`/admin/clients/${clientId}`);
      logger.debug('✅ deleteClient: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ deleteClient: Error', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // CLIENT MEMBERS
  // ------------------------------------------

  /**
   * Get all members of a client
   */
  getClientMembers: async (clientId: string): Promise<any> => {
    logger.debug('👥 getClientMembers', { clientId });
    try {
      const response = await api.get(`/admin/clients/${clientId}/members`);
      logger.debug('✅ getClientMembers: Success');
      return (
        response?.data || {
          members: [],
          total: 0,
          client_id: clientId,
          client_name: '',
          owners_count: 0,
          collaborators_count: 0,
        }
      );
    } catch (error: any) {
      logger.error('❌ getClientMembers: Error', error.message);
      throw error;
    }
  },

  /**
   * Add a user to a client
   */
  addClientMember: async (
    clientId: string,
    userId: string,
    role: string = 'collaborator'
  ): Promise<any> => {
    logger.debug('➕ addClientMember', { clientId, userId, role });
    try {
      const response = await api.post(`/admin/clients/${clientId}/members`, {
        user_id: userId,
        role,
      });
      logger.debug('✅ addClientMember: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ addClientMember: Error', error.message);
      throw error;
    }
  },

  /**
   * Update member role
   */
  updateMemberRole: async (
    clientId: string,
    memberId: string,
    role: string
  ): Promise<any> => {
    logger.debug('✏️ updateMemberRole', { clientId, memberId, role });
    try {
      const response = await api.put(
        `/admin/clients/${clientId}/members/${memberId}`,
        { role }
      );
      logger.debug('✅ updateMemberRole: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ updateMemberRole: Error', error.message);
      throw error;
    }
  },

  /**
   * Remove member from client
   */
  removeMember: async (clientId: string, memberId: string): Promise<any> => {
    logger.debug('🗑️ removeMember', { clientId, memberId });
    try {
      const response = await api.delete(
        `/admin/clients/${clientId}/members/${memberId}`
      );
      logger.debug('✅ removeMember: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ removeMember: Error', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // CLIENT WORKFLOWS
  // ------------------------------------------

  /**
   * Get all workflows of a client
   */
  getClientWorkflows: async (clientId: string): Promise<any> => {
    logger.debug('📋 getClientWorkflows', { clientId });
    try {
      const response = await api.get(`/admin/clients/${clientId}/workflows`);
      logger.debug('✅ getClientWorkflows: Success');
      return (
        response?.data || {
          workflows: [],
          total: 0,
          client_id: clientId,
          client_name: '',
        }
      );
    } catch (error: any) {
      logger.error('❌ getClientWorkflows: Error', error.message);
      throw error;
    }
  },

  /**
   * Assign a workflow template to a client
   */
  assignWorkflow: async (
    clientId: string,
    templateId: string,
    customName: string | null = null
  ): Promise<any> => {
    logger.debug('➕ assignWorkflow', { clientId, templateId });
    try {
      const payload: Record<string, string> = { template_id: templateId };
      if (customName) {
        payload.name = customName;
      }
      const response = await api.post(
        `/admin/clients/${clientId}/workflows`,
        payload
      );
      logger.debug('✅ assignWorkflow: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ assignWorkflow: Error', error.message);
      throw error;
    }
  },

  /**
   * Remove workflow from client
   */
  removeWorkflow: async (clientId: string, workflowId: string): Promise<any> => {
    logger.debug('🗑️ removeWorkflow', { clientId, workflowId });
    try {
      const response = await api.delete(
        `/admin/clients/${clientId}/workflows/${workflowId}`
      );
      logger.debug('✅ removeWorkflow: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ removeWorkflow: Error', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // CLIENT EXECUTIONS
  // ------------------------------------------

  /**
   * Get all executions of a client with filters
   */
  getClientExecutions: async (clientId: string, filters: any = {}): Promise<any> => {
    logger.debug('🚀 getClientExecutions', { clientId, filters });
    try {
      const response = await api.get(`/admin/clients/${clientId}/executions`, {
        params: filters,
      });
      logger.debug('✅ getClientExecutions: Success');
      return (
        response?.data || {
          executions: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          stats: { total: 0, completed: 0, failed: 0, pending: 0 },
        }
      );
    } catch (error: any) {
      logger.error('❌ getClientExecutions: Error', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // CLIENT ACTIVITY
  // ------------------------------------------

  /**
   * Get audit logs for a client
   */
  getClientActivity: async (clientId: string, params: any = {}): Promise<any> => {
    logger.debug('📜 getClientActivity', { clientId });
    try {
      const response = await api.get(`/admin/clients/${clientId}/activity`, {
        params,
      });
      logger.debug('✅ getClientActivity: Success');
      return response?.data || { activity: [], total: 0 };
    } catch (error: any) {
      logger.error('❌ getClientActivity: Error', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // WORKFLOW OPERATIONS
  // ------------------------------------------

  /**
   * Get all workflows
   */
  getWorkflows: async (): Promise<any> => {
    logger.debug('📋 getWorkflows');
    try {
      const response = await api.get('/admin/workflows');
      logger.debug('✅ getWorkflows: Success');
      return response?.data?.workflows || [];
    } catch (error: any) {
      logger.error('❌ getWorkflows: Error', error.message);
      throw error;
    }
  },

  /**
   * Get single workflow
   */
  getWorkflow: async (workflowId: string): Promise<any> => {
    logger.debug('📋 getWorkflow', { workflowId });
    try {
      const response = await api.get(`/admin/workflows/${workflowId}`);
      logger.debug('✅ getWorkflow: Success');
      return response?.data;
    } catch (error: any) {
      logger.error('❌ getWorkflow: Error', error.message);
      throw error;
    }
  },

  /**
   * Get workflow stats
   */
  getWorkflowStats: async (workflowId: string): Promise<any> => {
    logger.debug('📊 getWorkflowStats', { workflowId });
    try {
      const response = await api.get(`/admin/workflows/${workflowId}/stats`);
      logger.debug('✅ getWorkflowStats: Success');
      return response?.data;
    } catch (error: any) {
      logger.error('❌ getWorkflowStats: Error', error.message);
      throw error;
    }
  },

  /**
   * Delete workflow (archive)
   */
  deleteWorkflow: async (workflowId: string): Promise<any> => {
    logger.debug('🗑️ deleteWorkflow', { workflowId });
    try {
      const response = await api.delete(`/admin/workflows/${workflowId}`);
      logger.debug('✅ deleteWorkflow: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ deleteWorkflow: Error', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // WORKFLOW TEMPLATES
  // ------------------------------------------

  /**
   * Get all active workflow templates
   */
  getWorkflowTemplates: async (): Promise<any> => {
    logger.debug('📋 getWorkflowTemplates');
    try {
      const response = await api.get('/admin/workflow-templates');
      logger.debug('✅ getWorkflowTemplates: Success');
      return response?.data || { templates: [], total: 0 };
    } catch (error: any) {
      logger.error('❌ getWorkflowTemplates: Error', error.message);
      throw error;
    }
  },

  /**
   * Get single workflow template
   */
  getWorkflowTemplate: async (templateId: string): Promise<any> => {
    logger.debug('📋 getWorkflowTemplate', { templateId });
    try {
      const response = await api.get(`/admin/workflow-templates/${templateId}`);
      logger.debug('✅ getWorkflowTemplate: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ getWorkflowTemplate: Error', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // WORKFLOW REQUESTS
  // ------------------------------------------

  /**
   * Get all workflow requests
   */
  getWorkflowRequests: async (): Promise<any> => {
    logger.debug('📋 getWorkflowRequests');
    try {
      const response = await api.get('/admin/workflow-requests');
      logger.debug('✅ getWorkflowRequests: Success');
      return response?.data?.requests || [];
    } catch (error: any) {
      logger.error('❌ getWorkflowRequests: Error', error.message);
      throw error;
    }
  },

  /**
   * Get single workflow request
   */
  getWorkflowRequest: async (requestId: string): Promise<any> => {
    logger.debug('📋 getWorkflowRequest', { requestId });
    try {
      const response = await api.get(`/admin/workflow-requests/${requestId}`);
      logger.debug('✅ getWorkflowRequest: Success');
      return response?.data;
    } catch (error: any) {
      logger.error('❌ getWorkflowRequest: Error', error.message);
      throw error;
    }
  },

  /**
   * Update workflow request stage
   */
  updateWorkflowRequestStage: async (
    requestId: string,
    stage: string
  ): Promise<any> => {
    logger.debug('✏️ updateWorkflowRequestStage', { requestId, stage });
    try {
      const response = await api.put(
        `/admin/workflow-requests/${requestId}/stage`,
        { stage }
      );
      logger.debug('✅ updateWorkflowRequestStage: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ updateWorkflowRequestStage: Error', error.message);
      throw error;
    }
  },
};
