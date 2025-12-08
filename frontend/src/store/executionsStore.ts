/**
 * Executions Store
 * Zustand store for executions management
 */

import { create } from 'zustand';
import { workflowService } from '../services/workflows';
import logger from '@/utils/logger';
import { Workflow, Execution, User } from '../types/index';

const CACHE_DURATION = 30000; // 30 seconds for executions
const STATIC_CACHE_DURATION = 300000; // 5 minutes for workflows/members

interface Filters {
  status: string;
  workflow_id: string;
  user_id: string;
  sortBy: string;
}

interface FetchOptions {
  force?: boolean;
  append?: boolean;
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

  // Dynamic data (cached with 30s TTL)
  executions: Execution[];
  executionsLoading: boolean;
  executionsRefreshing: boolean;
  executionsLastFetch: number | null;
  executionsTotal: number;
  executionsHasMore: boolean;
  executionsOffset: number;

  // Filters
  filters: Filters;
}

interface ExecutionsActions {
  fetchWorkflows: (force?: boolean) => Promise<void>;
  fetchMembers: (force?: boolean) => Promise<void>;
  fetchExecutions: (params?: Record<string, any>, options?: FetchOptions) => Promise<void>;
  refreshExecutionsInBackground: (params?: Record<string, any>) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (newFilters: Partial<Filters>) => void;
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

  // Dynamic data (cached with 30s TTL)
  executions: [],
  executionsLoading: false,
  executionsRefreshing: false,
  executionsLastFetch: null,
  executionsTotal: 0,
  executionsHasMore: false,
  executionsOffset: 0,

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

  // Fetch workflows (with cache)
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

  // Fetch members (with cache)
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

  // Fetch executions (with stale-while-revalidate)
  fetchExecutions: async (params: Record<string, any> = {}, options: FetchOptions = { force: false, append: false }) => {
    const { executionsLastFetch, executions, filters } = get();
    const now = Date.now();

    const queryParams = { ...filters, ...params };
    const isInitialLoad = executions.length === 0;

    // Stale-while-revalidate: show cached, fetch in background
    if (!options.force && !isInitialLoad && executionsLastFetch && (now - executionsLastFetch < CACHE_DURATION)) {
      logger.debug('✅ executionsStore.fetchExecutions: Using cached data (stale-while-revalidate)', {
        age: Math.round((now - executionsLastFetch) / 1000) + 's'
      });
      // Return cached immediately, but fetch fresh in background
      get().refreshExecutionsInBackground(queryParams);
      return;
    }

    logger.debug('🔍 executionsStore.fetchExecutions: Fetching from API', { params: queryParams });

    // Use executionsRefreshing for updates, executionsLoading for initial load
    if (isInitialLoad) {
      set({ executionsLoading: true });
    } else {
      set({ executionsRefreshing: true });
    }

    try {
      const response = await workflowService.getAllExecutions({
        limit: 20,
        offset: options.append ? get().executionsOffset : 0,
        status: queryParams.status !== 'all' ? queryParams.status : undefined,
        workflow_id: queryParams.workflow_id !== 'all' ? queryParams.workflow_id : undefined,
        user_id: queryParams.user_id !== 'all' ? queryParams.user_id : undefined,
        fields: 'id,status,workflow_id,created_at,duration_seconds,triggered_by_user_id,error_message,started_at,completed_at,retry_count'
      });

      const executionsData = response.data?.data || response.data;
      const newExecutions = executionsData.executions || [];

      set({
        executions: options.append ? [...get().executions, ...newExecutions] : newExecutions,
        executionsTotal: executionsData.total || 0,
        executionsHasMore: executionsData.hasMore || false,
        executionsOffset: options.append ? get().executionsOffset + newExecutions.length : newExecutions.length,
        executionsLoading: false,
        executionsRefreshing: false,
        executionsLastFetch: Date.now()
      });

      logger.debug('✅ executionsStore.fetchExecutions: Success', {
        count: newExecutions.length,
        total: executionsData.total
      });
    } catch (error) {
      logger.error('❌ executionsStore.fetchExecutions: Error', { error });
      set({
        executionsLoading: false,
        executionsRefreshing: false,
        executions: [],
        executionsTotal: 0,
        executionsHasMore: false
      });
    }
  },

  // Background refresh (stale-while-revalidate)
  refreshExecutionsInBackground: async (params: Record<string, any> = {}) => {
    logger.debug('🔄 executionsStore.refreshExecutionsInBackground: Starting silent update');
    set({ executionsRefreshing: true });

    try {
      const response = await workflowService.getAllExecutions({
        limit: 20,
        offset: 0,
        status: params.status !== 'all' ? params.status : undefined,
        workflow_id: params.workflow_id !== 'all' ? params.workflow_id : undefined,
        user_id: params.user_id !== 'all' ? params.user_id : undefined,
        fields: 'id,status,workflow_id,created_at,duration_seconds,triggered_by_user_id,error_message,started_at,completed_at,retry_count'
      });

      const executionsData = response.data?.data || response.data;
      const newExecutions = executionsData.executions || [];

      set({
        executions: newExecutions,
        executionsTotal: executionsData.total || 0,
        executionsHasMore: executionsData.hasMore || false,
        executionsOffset: newExecutions.length,
        executionsRefreshing: false,
        executionsLastFetch: Date.now()
      });

      logger.debug('✅ executionsStore.refreshExecutionsInBackground: Success (silent update)', {
        count: newExecutions.length
      });
    } catch (error) {
      logger.error('❌ executionsStore.refreshExecutionsInBackground: Error (silent)', { error });
      set({ executionsRefreshing: false });
    }
  },

  // Load more executions (pagination)
  loadMore: async () => {
    const { executionsHasMore, executionsLoading, filters } = get();

    if (!executionsHasMore || executionsLoading) {
      logger.debug('⚠️ executionsStore.loadMore: Cannot load more', {
        hasMore: executionsHasMore,
        loading: executionsLoading
      });
      return;
    }

    logger.debug('🔄 executionsStore.loadMore: Loading more executions');
    await get().fetchExecutions(filters, { append: true });
  },

  // Update filters
  setFilters: (newFilters: Partial<Filters>) => {
    logger.debug('🔍 executionsStore.setFilters:', newFilters);

    set({
      filters: { ...get().filters, ...newFilters },
      executions: [],
      executionsOffset: 0,
      executionsHasMore: true,
      executionsLastFetch: null // Invalidate cache on filter change
    });

    // Fetch with new filters
    get().fetchExecutions({ ...get().filters, ...newFilters });
  },

  // Initialize (called on page mount)
  initialize: async () => {
    logger.debug('🚀 executionsStore.initialize: Starting');
    const startTime = Date.now();

    // Fetch workflows and members in parallel (cached if available)
    await Promise.all([
      get().fetchWorkflows(),
      get().fetchMembers()
    ]);

    // Fetch executions (stale-while-revalidate if cached)
    await get().fetchExecutions();

    const duration = Date.now() - startTime;
    logger.debug('✅ executionsStore.initialize: Complete', { duration: duration + 'ms' });
  },

  // Force refresh all data
  refresh: async () => {
    logger.debug('🔄 executionsStore.refresh: Force refresh all data');
    const startTime = Date.now();

    await Promise.all([
      get().fetchWorkflows(true),
      get().fetchMembers(true),
      get().fetchExecutions({}, { force: true })
    ]);

    const duration = Date.now() - startTime;
    logger.debug('✅ executionsStore.refresh: Complete', { duration: duration + 'ms' });
  },

  // Reset store (on logout)
  reset: () => {
    logger.debug('🔄 executionsStore.reset: Clearing all data');
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
      executionsRefreshing: false,
      executionsLastFetch: null,
      executionsTotal: 0,
      executionsHasMore: false,
      executionsOffset: 0,
      filters: {
        status: 'all',
        workflow_id: 'all',
        user_id: 'all',
        sortBy: 'newest'
      }
    });
  }
}));
