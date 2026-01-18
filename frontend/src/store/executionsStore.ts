/**
 * Executions Store - Refactored (NO Cache, AbortController, Single Source of Truth)
 * Zustand store for executions management
 */

import { create } from 'zustand';
import { workflowService } from '../services/workflows';
import logger from '@/utils/logger';
import { Workflow, Execution, User } from '../types/index';

const STATIC_CACHE_DURATION = 300000; // 5 minutes for workflows/members (static data)
const EXECUTIONS_CACHE_DURATION = 30000; // 30 seconds for executions (short-term cache)

interface Filters {
  status: string;
  workflow_id: string;
  user_id: string;
  sortBy: string;
}

interface StatusCounts {
  completed: number;
  pending: number;
  processing: number;
  failed: number;
}

interface ExecutionsState {
  // Static reference data (cached for 5 minutes)
  workflows: Workflow[];
  workflowsMap: Record<string, Workflow>;
  workflowsLoading: boolean;
  workflowsLastFetch: number | null;

  members: User[];
  membersLoading: boolean;
  membersLastFetch: number | null;

  // Dynamic data (with short-term cache)
  executions: Execution[];
  executionsLoading: boolean;        // Main loading (initial or filter change)
  executionsLoadingMore: boolean;    // Pagination loading
  executionsTotal: number;
  executionsHasMore: boolean;
  executionsOffset: number;
  executionsError: string | null;
  executionsLastFetch: number | null;
  statusCounts: StatusCounts;

  // AbortController for request cancellation
  _abortController: AbortController | null;

  // Filters (SINGLE source of truth)
  filters: Filters;
}

interface ExecutionsActions {
  fetchWorkflows: (force?: boolean) => Promise<void>;
  fetchMembers: (force?: boolean) => Promise<void>;
  fetchExecutions: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilter: (key: keyof Filters, value: string) => void;
  resetFilters: () => void;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

type ExecutionsStore = ExecutionsState & ExecutionsActions;

export const useExecutionsStore = create<ExecutionsStore>((set, get) => ({
  // ============================================
  // STATE
  // ============================================

  // Static reference data (cached for 5 minutes)
  workflows: [],
  workflowsMap: {},
  workflowsLoading: false,
  workflowsLastFetch: null,

  members: [],
  membersLoading: false,
  membersLastFetch: null,

  // Dynamic data (with short-term cache)
  executions: [],
  executionsLoading: false,
  executionsLoadingMore: false,
  executionsTotal: 0,
  executionsHasMore: false,
  executionsOffset: 0,
  executionsError: null,
  executionsLastFetch: null,
  statusCounts: {
    completed: 0,
    pending: 0,
    processing: 0,
    failed: 0,
  },

  // AbortController
  _abortController: null,

  // Filters
  filters: {
    status: 'all',
    workflow_id: 'all',
    user_id: 'all',
    sortBy: 'newest'
  },

  // ============================================
  // ACTIONS
  // ============================================

  // Fetch workflows (with cache for static data)
  fetchWorkflows: async (force: boolean = false) => {
    const { workflowsLastFetch, workflows } = get();
    const now = Date.now();

    // Return cached if available and not force refresh
    if (!force && workflows.length > 0 && workflowsLastFetch && (now - workflowsLastFetch < STATIC_CACHE_DURATION)) {
      logger.debug('✅ executionsStore.fetchWorkflows: Using cached data', {
        age: Math.round((now - workflowsLastFetch) / 1000) + 's',
        count: workflows.length
      });
      return;
    }

    logger.debug('🔍 executionsStore.fetchWorkflows: Fetching from API');
    set({ workflowsLoading: true });

    try {
      const response = await workflowService.list();
      const workflowsList = response.data?.workflows || response.workflows || [];

      const wfMap: Record<string, Workflow> = {};
      workflowsList.forEach((wf: Workflow) => { wfMap[wf.id] = wf; });

      set({
        workflows: workflowsList,
        workflowsMap: wfMap,
        workflowsLoading: false,
        workflowsLastFetch: Date.now()
      });

      logger.debug('✅ executionsStore.fetchWorkflows: Success', { count: workflowsList.length });
    } catch (error) {
      logger.error('❌ executionsStore.fetchWorkflows: Error', { error });
      set({ workflowsLoading: false });
    }
  },

  // Fetch members (with cache for static data)
  fetchMembers: async (force: boolean = false) => {
    const { membersLastFetch, members } = get();
    const now = Date.now();

    // Return cached if available and not force refresh
    if (!force && members.length > 0 && membersLastFetch && (now - membersLastFetch < STATIC_CACHE_DURATION)) {
      logger.debug('✅ executionsStore.fetchMembers: Using cached data', {
        age: Math.round((now - membersLastFetch) / 1000) + 's',
        count: members.length
      });
      return;
    }

    logger.debug('🔍 executionsStore.fetchMembers: Fetching from API');
    set({ membersLoading: true });

    try {
      const response = await workflowService.getClientMembers();
      const membersList = response.data?.data?.members || response.data?.members || [];

      set({
        members: membersList,
        membersLoading: false,
        membersLastFetch: Date.now()
      });

      logger.debug('✅ executionsStore.fetchMembers: Success', { count: membersList.length });
    } catch (error) {
      logger.error('❌ executionsStore.fetchMembers: Error', { error });
      set({ membersLoading: false });
    }
  },

  // Fetch executions (NO cache, AbortController, optimistic UI)
  fetchExecutions: async (reset: boolean = true) => {
    const { filters, _abortController, executions, executionsOffset } = get();

    // Cancel previous request if exists
    if (_abortController) {
      logger.debug('🚫 executionsStore.fetchExecutions: Aborting previous request');
      _abortController.abort();
    }

    // Create new AbortController
    const newAbortController = new AbortController();
    set({ _abortController: newAbortController });

    // Set loading state (keep executions visible for optimistic UI)
    if (reset) {
      set({
        executionsLoading: true,
        executionsError: null,
        executionsOffset: 0
      });
    } else {
      set({
        executionsLoadingMore: true,
        executionsError: null
      });
    }

    logger.debug('🔍 executionsStore.fetchExecutions: Fetching from API', {
      filters,
      reset,
      offset: reset ? 0 : executionsOffset
    });

    try {
      const response = await workflowService.getAllExecutions({
        limit: 20,
        offset: reset ? 0 : executionsOffset,
        status: filters.status !== 'all' ? filters.status : undefined,
        workflow_id: filters.workflow_id !== 'all' ? filters.workflow_id : undefined,
        user_id: filters.user_id !== 'all' ? filters.user_id : undefined,
        sortBy: filters.sortBy,
        fields: 'id,status,workflow_id,created_at,duration_seconds,triggered_by_user_id,error_message,started_at,completed_at,retry_count'
      });

      // Check if request was aborted
      if (newAbortController.signal.aborted) {
        logger.debug('⚠️ executionsStore.fetchExecutions: Request was aborted');
        return;
      }

      const executionsData = response.data?.data || response.data;
      const newExecutions = executionsData.executions || [];

      set({
        executions: reset ? newExecutions : [...executions, ...newExecutions],
        executionsTotal: executionsData.total || 0,
        statusCounts: executionsData.statusCounts || {
          completed: 0,
          pending: 0,
          processing: 0,
          failed: 0,
        },
        executionsHasMore: executionsData.hasMore || false,
        executionsOffset: reset ? newExecutions.length : executionsOffset + newExecutions.length,
        executionsLoading: false,
        executionsLoadingMore: false,
        executionsError: null,
        executionsLastFetch: Date.now(),
        _abortController: null
      });

      logger.debug('✅ executionsStore.fetchExecutions: Success', {
        count: newExecutions.length,
        total: executionsData.total,
        offset: reset ? newExecutions.length : executionsOffset + newExecutions.length
      });
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        logger.debug('⚠️ executionsStore.fetchExecutions: Request aborted');
        return;
      }

      logger.error('❌ executionsStore.fetchExecutions: Error', { error });
      set({
        executionsLoading: false,
        executionsLoadingMore: false,
        executionsError: error.response?.data?.message || error.message || 'Failed to load executions',
        _abortController: null
      });
    }
  },

  // Load more executions (pagination)
  loadMore: async () => {
    const { executionsHasMore, executionsLoading, executionsLoadingMore } = get();

    if (!executionsHasMore || executionsLoading || executionsLoadingMore) {
      logger.debug('⚠️ executionsStore.loadMore: Cannot load more', {
        hasMore: executionsHasMore,
        loading: executionsLoading,
        loadingMore: executionsLoadingMore
      });
      return;
    }

    logger.debug('🔄 executionsStore.loadMore: Loading more executions');
    await get().fetchExecutions(false); // reset=false for append
  },

  // Set single filter (SINGLE source of truth, optimistic UI)
  setFilter: (key: keyof Filters, value: string) => {
    const currentFilters = get().filters;

    // Only update if value actually changed
    if (currentFilters[key] === value) {
      logger.debug('⚠️ executionsStore.setFilter: Value unchanged, skipping', { key, value });
      return;
    }

    logger.debug('🔍 executionsStore.setFilter:', { key, value });

    // Update filter and invalidate cache (keep executions visible for optimistic UI)
    set({
      filters: { ...currentFilters, [key]: value },
      executionsLastFetch: null  // Invalidate cache on filter change
    });

    // Fetch with new filters
    get().fetchExecutions(true); // reset=true for new filter
  },

  // Reset all filters to defaults
  resetFilters: () => {
    logger.debug('🔄 executionsStore.resetFilters: Resetting to defaults');

    const defaultFilters: Filters = {
      status: 'all',
      workflow_id: 'all',
      user_id: 'all',
      sortBy: 'newest'
    };

    set({
      filters: defaultFilters,
      executionsLastFetch: null  // Invalidate cache on reset
    });
    get().fetchExecutions(true);
  },

  // Initialize (called on page mount)
  initialize: async () => {
    logger.debug('🚀 executionsStore.initialize: Starting');
    const startTime = Date.now();
    const { executionsLastFetch, executions } = get();
    const now = Date.now();

    // Fetch workflows and members in parallel (use cache if available)
    await Promise.all([
      get().fetchWorkflows(),
      get().fetchMembers()
    ]);

    // Check if executions cache is valid (30 seconds)
    const cacheValid = executions.length > 0 &&
                       executionsLastFetch &&
                       (now - executionsLastFetch < EXECUTIONS_CACHE_DURATION);

    if (!cacheValid) {
      // Fetch executions if cache is stale or empty
      await get().fetchExecutions(true);
    } else {
      logger.debug('✅ executionsStore.initialize: Using cached executions', {
        age: Math.round((now - executionsLastFetch) / 1000) + 's',
        count: executions.length
      });
    }

    const duration = Date.now() - startTime;
    logger.debug('✅ executionsStore.initialize: Complete', { duration: duration + 'ms' });
  },

  // Force refresh all data
  refresh: async () => {
    logger.debug('🔄 executionsStore.refresh: Force refresh all data');
    const startTime = Date.now();

    // Force refresh static data + fetch fresh executions
    await Promise.all([
      get().fetchWorkflows(true),
      get().fetchMembers(true),
      get().fetchExecutions(true)
    ]);

    const duration = Date.now() - startTime;
    logger.debug('✅ executionsStore.refresh: Complete', { duration: duration + 'ms' });
  },

  // Reset store (on logout)
  reset: () => {
    logger.debug('🔄 executionsStore.reset: Clearing all data');

    // Cancel any pending request
    const { _abortController } = get();
    if (_abortController) {
      _abortController.abort();
    }

    set({
      workflows: [],
      workflowsMap: {},
      workflowsLoading: false,
      workflowsLastFetch: null,
      members: [],
      membersLoading: false,
      membersLastFetch: null,
      executions: [],
      executionsLoading: false,
      executionsLoadingMore: false,
      executionsTotal: 0,
      executionsHasMore: false,
      executionsOffset: 0,
      executionsError: null,
      executionsLastFetch: null,
      statusCounts: {
        completed: 0,
        pending: 0,
        processing: 0,
        failed: 0,
      },
      _abortController: null,
      filters: {
        status: 'all',
        workflow_id: 'all',
        user_id: 'all',
        sortBy: 'newest'
      }
    });
  }
}));
