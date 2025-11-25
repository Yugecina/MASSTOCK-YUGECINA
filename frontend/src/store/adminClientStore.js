/**
 * Admin Client Store
 * Zustand store for admin client detail management
 */

import { create } from 'zustand';
import { adminClientService } from '../services/adminClientService';

const useAdminClientStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================

  // Client detail
  client: null,
  clientLoading: false,
  clientError: null,

  // Members
  members: [],
  membersLoading: false,
  membersError: null,

  // Workflows
  workflows: [],
  workflowsLoading: false,
  workflowsError: null,

  // Executions
  executions: [],
  executionsLoading: false,
  executionsError: null,
  executionsPagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
  executionsFilters: {},
  executionsStats: { total: 0, completed: 0, failed: 0, pending: 0, processing: 0 },

  // Activity
  activity: [],
  activityLoading: false,
  activityError: null,
  activityTotal: 0,

  // Workflow templates
  templates: [],
  templatesLoading: false,
  templatesError: null,

  // User search (for adding members)
  searchResults: [],
  searchLoading: false,

  // Active tab
  activeTab: 'overview',

  // ============================================
  // ACTIONS
  // ============================================

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Client detail
  fetchClientDetail: async (clientId) => {
    console.log('🏪 Store.fetchClientDetail: Starting', { clientId });
    set({ clientLoading: true, clientError: null });
    try {
      // Service returns: { success: true, data: { client: {...}, stats: {...} } }
      // We need to extract .data to get { client, stats }
      const response = await adminClientService.getClientDetail(clientId);
      console.log('✅ Store.fetchClientDetail: Response received', {
        response,
        responseKeys: response ? Object.keys(response) : [],
        data: response?.data,
        client: response?.data?.client,
        stats: response?.data?.stats
      });
      // Extract the nested data object: { client, stats }
      const clientData = response?.data || {};
      set({
        client: clientData,
        clientLoading: false
      });
      console.log('✅ Store.fetchClientDetail: State updated', { clientData });
    } catch (error) {
      console.error('❌ Store.fetchClientDetail: Error', {
        error: error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      set({
        clientError: error.response?.data?.message || error.message,
        clientLoading: false
      });
    }
  },

  // Members
  fetchMembers: async (clientId) => {
    console.log('🏪 Store.fetchMembers: Starting', { clientId });
    set({ membersLoading: true, membersError: null });
    try {
      // adminClientService returns data directly: { members: [...], total: X, ... }
      const data = await adminClientService.getClientMembers(clientId);
      console.log('✅ Store.fetchMembers: Response received', {
        data,
        members: data?.members,
        total: data?.total
      });
      set({
        members: data?.members || [],
        membersLoading: false
      });
    } catch (error) {
      console.error('❌ Store.fetchMembers: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      set({
        membersError: error.response?.data?.message || error.message,
        membersLoading: false
      });
    }
  },

  addMember: async (clientId, userId, role) => {
    console.log('🏪 Store.addMember: Starting', { clientId, userId, role });
    try {
      await adminClientService.addClientMember(clientId, userId, role);
      console.log('✅ Store.addMember: Success');
      await get().fetchMembers(clientId);
      return { success: true };
    } catch (error) {
      console.error('❌ Store.addMember: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  updateMemberRole: async (clientId, memberId, role) => {
    console.log('🏪 Store.updateMemberRole: Starting', { clientId, memberId, role });
    try {
      await adminClientService.updateMemberRole(clientId, memberId, role);
      console.log('✅ Store.updateMemberRole: Success');
      await get().fetchMembers(clientId);
      return { success: true };
    } catch (error) {
      console.error('❌ Store.updateMemberRole: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  removeMember: async (clientId, memberId) => {
    console.log('🏪 Store.removeMember: Starting', { clientId, memberId });
    try {
      await adminClientService.removeMember(clientId, memberId);
      console.log('✅ Store.removeMember: Success');
      await get().fetchMembers(clientId);
      return { success: true };
    } catch (error) {
      console.error('❌ Store.removeMember: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  searchUsers: async (query, excludeClientId) => {
    if (!query || query.length < 2) {
      set({ searchResults: [], searchLoading: false });
      return;
    }
    console.log('🏪 Store.searchUsers: Starting', { query, excludeClientId });
    set({ searchLoading: true });
    try {
      // adminClientService returns: { users: [...], total: X }
      const data = await adminClientService.searchUsers(query, excludeClientId);
      const users = data?.users || [];
      console.log('✅ Store.searchUsers: Response', {
        data,
        dataKeys: data ? Object.keys(data) : [],
        users,
        usersLength: users.length,
        total: data?.total
      });
      // Force new array reference for React re-render
      set({
        searchResults: [...users],
        searchLoading: false
      });
      console.log('✅ Store.searchUsers: State updated', {
        newSearchResults: get().searchResults,
        newLength: get().searchResults.length
      });
    } catch (error) {
      console.error('❌ Store.searchUsers: Error', { error: error.message });
      set({ searchResults: [], searchLoading: false });
    }
  },

  clearSearchResults: () => set({ searchResults: [], searchLoading: false }),

  // Workflows
  fetchWorkflows: async (clientId) => {
    console.log('🏪 Store.fetchWorkflows: Starting', { clientId });
    set({ workflowsLoading: true, workflowsError: null });
    try {
      // adminClientService returns data directly: { workflows: [...], total: X }
      const data = await adminClientService.getClientWorkflows(clientId);
      console.log('✅ Store.fetchWorkflows: Response received', {
        data,
        workflows: data?.workflows,
        total: data?.total
      });
      set({
        workflows: data?.workflows || [],
        workflowsLoading: false
      });
    } catch (error) {
      console.error('❌ Store.fetchWorkflows: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      set({
        workflowsError: error.response?.data?.message || error.message,
        workflowsLoading: false
      });
    }
  },

  assignWorkflow: async (clientId, templateId, customName) => {
    console.log('🏪 Store.assignWorkflow: Starting', { clientId, templateId, customName });
    try {
      await adminClientService.assignWorkflow(clientId, templateId, customName);
      console.log('✅ Store.assignWorkflow: Success');
      await get().fetchWorkflows(clientId);
      return { success: true };
    } catch (error) {
      console.error('❌ Store.assignWorkflow: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  removeWorkflow: async (clientId, workflowId) => {
    console.log('🏪 Store.removeWorkflow: Starting', { clientId, workflowId });
    try {
      await adminClientService.removeWorkflow(clientId, workflowId);
      console.log('✅ Store.removeWorkflow: Success');
      await get().fetchWorkflows(clientId);
      return { success: true };
    } catch (error) {
      console.error('❌ Store.removeWorkflow: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  // Templates
  fetchTemplates: async () => {
    console.log('🏪 Store.fetchTemplates: Starting');
    set({ templatesLoading: true, templatesError: null });
    try {
      // adminClientService returns data directly: { templates: [...], total: X }
      const data = await adminClientService.getWorkflowTemplates();
      console.log('✅ Store.fetchTemplates: Response received', {
        data,
        templates: data?.templates,
        total: data?.total
      });
      set({
        templates: data?.templates || [],
        templatesLoading: false
      });
    } catch (error) {
      console.error('❌ Store.fetchTemplates: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      set({
        templatesError: error.response?.data?.message || error.message,
        templatesLoading: false
      });
    }
  },

  // Executions
  fetchExecutions: async (clientId, filters = {}) => {
    console.log('🏪 Store.fetchExecutions: Starting', { clientId, filters });
    set({ executionsLoading: true, executionsError: null, executionsFilters: filters });
    try {
      // adminClientService returns data directly: { executions: [...], pagination: {...}, stats: {...} }
      const data = await adminClientService.getClientExecutions(clientId, filters);
      console.log('✅ Store.fetchExecutions: Response received', {
        data,
        executions: data?.executions,
        pagination: data?.pagination,
        stats: data?.stats
      });
      set({
        executions: data?.executions || [],
        executionsPagination: data?.pagination || { total: 0, page: 1, limit: 20, total_pages: 0 },
        executionsStats: data?.stats || { total: 0, completed: 0, failed: 0, pending: 0, processing: 0 },
        executionsLoading: false
      });
    } catch (error) {
      console.error('❌ Store.fetchExecutions: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      set({
        executionsError: error.response?.data?.message || error.message,
        executionsLoading: false
      });
    }
  },

  setExecutionsPage: async (clientId, page) => {
    const filters = { ...get().executionsFilters, page };
    await get().fetchExecutions(clientId, filters);
  },

  // Activity
  fetchActivity: async (clientId, params = {}) => {
    console.log('🏪 Store.fetchActivity: Starting', { clientId, params });
    set({ activityLoading: true, activityError: null });
    try {
      // adminClientService returns data directly: { activity: [...], total: X }
      const data = await adminClientService.getClientActivity(clientId, params);
      console.log('✅ Store.fetchActivity: Response received', {
        data,
        activity: data?.activity,
        total: data?.total
      });
      set({
        activity: data?.activity || [],
        activityTotal: data?.total || 0,
        activityLoading: false
      });
    } catch (error) {
      console.error('❌ Store.fetchActivity: Error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      set({
        activityError: error.response?.data?.message || error.message,
        activityLoading: false
      });
    }
  },

  // Reset store
  resetStore: () => set({
    client: null,
    clientLoading: false,
    clientError: null,
    members: [],
    membersLoading: false,
    membersError: null,
    workflows: [],
    workflowsLoading: false,
    workflowsError: null,
    executions: [],
    executionsLoading: false,
    executionsError: null,
    executionsPagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
    executionsFilters: {},
    executionsStats: { total: 0, completed: 0, failed: 0, pending: 0, processing: 0 },
    activity: [],
    activityLoading: false,
    activityError: null,
    activityTotal: 0,
    templates: [],
    templatesLoading: false,
    templatesError: null,
    searchResults: [],
    searchLoading: false,
    activeTab: 'overview'
  })
}));

export default useAdminClientStore;
