/**
 * Admin Workflows Zustand Store
 * State management for admin workflows module
 */

import { create } from 'zustand';
import { adminWorkflowService } from '../services/adminWorkflowService';

export const useAdminWorkflowsStore = create((set, get) => ({
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
  fetchWorkflows: async (page = 1, filters = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await adminWorkflowService.getWorkflows(page, filters);

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
    } catch (error) {
      set({
        error: error.message || 'Failed to fetch workflows',
        loading: false,
      });
    }
  },

  fetchRequests: async (page = 1, filters = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await adminWorkflowService.getWorkflowRequests(page, filters);

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
    } catch (error) {
      set({
        error: error.message || 'Failed to fetch requests',
        loading: false,
      });
    }
  },

  updateRequestStage: async (id, stage) => {
    set({ loading: true, error: null });

    try {
      await adminWorkflowService.updateWorkflowRequestStage(id, stage);

      // Refresh requests after update
      const currentPage = get().pagination.page;
      const currentFilters = get().filters;
      await get().fetchRequests(currentPage, currentFilters);
    } catch (error) {
      set({
        error: error.message || 'Failed to update request stage',
        loading: false,
      });
    }
  },

  deleteWorkflow: async (id) => {
    set({ loading: true, error: null });

    try {
      await adminWorkflowService.deleteWorkflow(id);

      // Refresh workflows after deletion
      const currentPage = get().pagination.page;
      const currentFilters = get().filters;
      await get().fetchWorkflows(currentPage, currentFilters);
    } catch (error) {
      set({
        error: error.message || 'Failed to delete workflow',
        loading: false,
      });
    }
  },

  setFilters: (filters) => {
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
