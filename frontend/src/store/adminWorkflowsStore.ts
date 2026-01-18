/**
 * Admin Workflows Zustand Store
 * State management for admin workflows module
 */

import { create } from 'zustand';
import { adminResourceService } from '../services/adminResourceService';
import { Workflow } from '../types/index';

interface WorkflowRequest {
  id: string;
  client_id: string;
  workflow_name: string;
  description?: string;
  stage: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  status: string;
  stage: string;
  search: string;
}

interface AdminWorkflowsState {
  workflows: Workflow[];
  requests: WorkflowRequest[];
  selectedWorkflow: Workflow | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  filters: Filters;
}

interface AdminWorkflowsActions {
  fetchWorkflows: (page?: number, filters?: Partial<Filters>) => Promise<void>;
  fetchRequests: (page?: number, filters?: Partial<Filters>) => Promise<void>;
  updateRequestStage: (id: string, stage: string) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  setFilters: (filters: Partial<Filters>) => void;
  clearError: () => void;
  reset: () => void;
}

type AdminWorkflowsStore = AdminWorkflowsState & AdminWorkflowsActions;

export const useAdminWorkflowsStore = create<AdminWorkflowsStore>((set, get) => ({
  // State
  workflows: [],
  requests: [],
  selectedWorkflow: null,
  loading: false,
  error: null,

  // Pagination
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  // Filters
  filters: {
    status: '',
    stage: '',
    search: '',
  },

  // Actions
  fetchWorkflows: async (page: number = 1, filters: Partial<Filters> = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await adminResourceService.getWorkflows(page, filters);

      // Note: response is already unwrapped by axios interceptor
      // Check for both response.success and response.data (for mock data compatibility)
      const workflows = response.data?.workflows || response.workflows || [];
      const pagination = response.data?.pagination || response.pagination || {};

      set({
        workflows,
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          total: pagination.total || 0,
          totalPages: pagination.totalPages || 0,
        },
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch workflows',
        loading: false,
      });
    }
  },

  fetchRequests: async (page: number = 1, filters: Partial<Filters> = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await adminResourceService.getWorkflowRequests(page, filters);

      // Note: response is already unwrapped by axios interceptor
      const requests = response.requests || [];
      const pagination = response.pagination || {};

      set({
        requests,
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          total: pagination.total || 0,
          totalPages: pagination.totalPages || 0,
        },
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch requests',
        loading: false,
      });
    }
  },

  updateRequestStage: async (id: string, stage: string) => {
    set({ loading: true, error: null });

    try {
      await adminResourceService.updateWorkflowRequestStage(id, stage);

      // Refresh requests after update
      const currentPage = get().pagination.page;
      const currentFilters = get().filters;
      await get().fetchRequests(currentPage, currentFilters);
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update request stage',
        loading: false,
      });
    }
  },

  deleteWorkflow: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await adminResourceService.deleteWorkflow(id);

      // Refresh workflows after deletion
      const currentPage = get().pagination.page;
      const currentFilters = get().filters;
      await get().fetchWorkflows(currentPage, currentFilters);
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete workflow',
        loading: false,
      });
    }
  },

  setFilters: (filters: Partial<Filters>) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      workflows: [],
      requests: [],
      selectedWorkflow: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      filters: {
        status: '',
        stage: '',
        search: '',
      },
    });
  },
}));
