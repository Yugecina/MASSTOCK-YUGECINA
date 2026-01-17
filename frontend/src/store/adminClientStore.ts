/**
 * Admin Client Store
 * Zustand store for admin client detail management
 */

import { create } from 'zustand';
import { adminResourceService } from '../services/adminResourceService';
import { Client, User, Workflow, Execution } from '../types/index';

interface ClientStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
}

interface ClientData {
  client?: Client;
  stats?: ClientStats;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface AdminClientState {
  // Client detail
  client: ClientData | null;
  clientLoading: boolean;
  clientError: string | null;

  // Members
  members: User[];
  membersLoading: boolean;
  membersError: string | null;

  // Workflows
  workflows: Workflow[];
  workflowsLoading: boolean;
  workflowsError: string | null;

  // Executions
  executions: Execution[];
  executionsLoading: boolean;
  executionsError: string | null;
  executionsPagination: Pagination;
  executionsFilters: Record<string, any>;
  executionsStats: ClientStats;

  // Activity
  activity: any[];
  activityLoading: boolean;
  activityError: string | null;
  activityTotal: number;

  // Workflow templates
  templates: any[];
  templatesLoading: boolean;
  templatesError: string | null;

  // User search (for adding members)
  searchResults: User[];
  searchLoading: boolean;

  // Active tab
  activeTab: string;
}

interface AdminClientActions {
  setActiveTab: (tab: string) => void;

  // Client detail
  fetchClientDetail: (clientId: string) => Promise<void>;

  // Members
  fetchMembers: (clientId: string) => Promise<void>;
  addMember: (clientId: string, userId: string, role: string) => Promise<{ success: boolean; error?: string }>;
  updateMemberRole: (clientId: string, memberId: string, role: string) => Promise<{ success: boolean; error?: string }>;
  removeMember: (clientId: string, memberId: string) => Promise<{ success: boolean; error?: string }>;
  searchUsers: (query: string, excludeClientId?: string) => Promise<void>;
  clearSearchResults: () => void;

  // Workflows
  fetchWorkflows: (clientId: string) => Promise<void>;
  assignWorkflow: (clientId: string, templateId: string, customName?: string) => Promise<{ success: boolean; error?: string }>;
  removeWorkflow: (clientId: string, workflowId: string) => Promise<{ success: boolean; error?: string }>;

  // Templates
  fetchTemplates: () => Promise<void>;

  // Executions
  fetchExecutions: (clientId: string, filters?: Record<string, any>) => Promise<void>;
  setExecutionsPage: (clientId: string, page: number) => Promise<void>;

  // Activity
  fetchActivity: (clientId: string, params?: Record<string, any>) => Promise<void>;

  // Reset
  resetStore: () => void;
}

type AdminClientStore = AdminClientState & AdminClientActions;

const useAdminClientStore = create<AdminClientStore>((set, get) => ({
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

  setActiveTab: (tab: string) => set({ activeTab: tab }),

  // Client detail
  fetchClientDetail: async (clientId: string) => {
    console.log('🏪 Store.fetchClientDetail: Starting', { clientId });
    set({ clientLoading: true, clientError: null });
    try {
      const response = await adminResourceService.getClientDetail(clientId);
      console.log('✅ Store.fetchClientDetail: Response received', {
        response,
        responseKeys: response ? Object.keys(response) : [],
        data: response?.data,
        client: response?.data?.client,
        stats: response?.data?.stats
      });
      const clientData = response?.data || {};
      set({
        client: clientData,
        clientLoading: false
      });
      console.log('✅ Store.fetchClientDetail: State updated', { clientData });
    } catch (error: any) {
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
  fetchMembers: async (clientId: string) => {
    console.log('🏪 Store.fetchMembers: Starting', { clientId });
    set({ membersLoading: true, membersError: null });
    try {
      const data = await adminResourceService.getClientMembers(clientId);
      console.log('✅ Store.fetchMembers: Response received', {
        data,
        members: data?.members,
        total: data?.total
      });
      set({
        members: data?.members || [],
        membersLoading: false
      });
    } catch (error: any) {
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

  addMember: async (clientId: string, userId: string, role: string) => {
    console.log('🏪 Store.addMember: Starting', { clientId, userId, role });
    try {
      await adminResourceService.addClientMember(clientId, userId, role);
      console.log('✅ Store.addMember: Success');
      await get().fetchMembers(clientId);
      return { success: true };
    } catch (error: any) {
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

  updateMemberRole: async (clientId: string, memberId: string, role: string) => {
    console.log('🏪 Store.updateMemberRole: Starting', { clientId, memberId, role });
    try {
      await adminResourceService.updateMemberRole(clientId, memberId, role);
      console.log('✅ Store.updateMemberRole: Success');
      await get().fetchMembers(clientId);
      return { success: true };
    } catch (error: any) {
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

  removeMember: async (clientId: string, memberId: string) => {
    console.log('🏪 Store.removeMember: Starting', { clientId, memberId });
    try {
      await adminResourceService.removeMember(clientId, memberId);
      console.log('✅ Store.removeMember: Success');
      await get().fetchMembers(clientId);
      return { success: true };
    } catch (error: any) {
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

  searchUsers: async (query: string, excludeClientId?: string) => {
    if (!query || query.length < 2) {
      set({ searchResults: [], searchLoading: false });
      return;
    }
    console.log('🏪 Store.searchUsers: Starting', { query, excludeClientId });
    set({ searchLoading: true });
    try {
      const data = await adminResourceService.searchUsers(query, excludeClientId);
      const users = data?.users || [];
      console.log('✅ Store.searchUsers: Response', {
        data,
        dataKeys: data ? Object.keys(data) : [],
        users,
        usersLength: users.length,
        total: data?.total
      });
      set({
        searchResults: [...users],
        searchLoading: false
      });
      console.log('✅ Store.searchUsers: State updated', {
        newSearchResults: get().searchResults,
        newLength: get().searchResults.length
      });
    } catch (error: any) {
      console.error('❌ Store.searchUsers: Error', { error: error.message });
      set({ searchResults: [], searchLoading: false });
    }
  },

  clearSearchResults: () => set({ searchResults: [], searchLoading: false }),

  // Workflows
  fetchWorkflows: async (clientId: string) => {
    console.log('🏪 Store.fetchWorkflows: Starting', { clientId });
    set({ workflowsLoading: true, workflowsError: null });
    try {
      const data = await adminResourceService.getClientWorkflows(clientId);
      console.log('✅ Store.fetchWorkflows: Response received', {
        data,
        workflows: data?.workflows,
        total: data?.total
      });
      set({
        workflows: data?.workflows || [],
        workflowsLoading: false
      });
    } catch (error: any) {
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

  assignWorkflow: async (clientId: string, templateId: string, customName?: string) => {
    console.log('🏪 Store.assignWorkflow: Starting', { clientId, templateId, customName });
    try {
      await adminResourceService.assignWorkflow(clientId, templateId, customName);
      console.log('✅ Store.assignWorkflow: Success');
      await get().fetchWorkflows(clientId);
      return { success: true };
    } catch (error: any) {
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

  removeWorkflow: async (clientId: string, workflowId: string) => {
    console.log('🏪 Store.removeWorkflow: Starting', { clientId, workflowId });
    try {
      await adminResourceService.removeWorkflow(clientId, workflowId);
      console.log('✅ Store.removeWorkflow: Success');
      await get().fetchWorkflows(clientId);
      return { success: true };
    } catch (error: any) {
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
      const data = await adminResourceService.getWorkflowTemplates();
      console.log('✅ Store.fetchTemplates: Response received', {
        data,
        templates: data?.templates,
        total: data?.total
      });
      set({
        templates: data?.templates || [],
        templatesLoading: false
      });
    } catch (error: any) {
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
  fetchExecutions: async (clientId: string, filters: Record<string, any> = {}) => {
    console.log('🏪 Store.fetchExecutions: Starting', { clientId, filters });
    set({ executionsLoading: true, executionsError: null, executionsFilters: filters });
    try {
      const data = await adminResourceService.getClientExecutions(clientId, filters);
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
    } catch (error: any) {
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

  setExecutionsPage: async (clientId: string, page: number) => {
    const filters = { ...get().executionsFilters, page };
    await get().fetchExecutions(clientId, filters);
  },

  // Activity
  fetchActivity: async (clientId: string, params: Record<string, any> = {}) => {
    console.log('🏪 Store.fetchActivity: Starting', { clientId, params });
    set({ activityLoading: true, activityError: null });
    try {
      const data = await adminResourceService.getClientActivity(clientId, params);
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
    } catch (error: any) {
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
