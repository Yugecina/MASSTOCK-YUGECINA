/**
 * Active Executions Store
 * Zustand store for tracking active (pending/processing) workflow executions
 * Used for global polling and sidebar progress indicator
 */

import { create } from 'zustand';
import { workflowService } from '../services/workflows';
import logger from '../utils/logger';

interface ProgressStats {
  current: number;
  total: number;
  succeeded: number;
  failed: number;
}

export interface ActiveExecution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  workflow_type: string;
  status: 'pending' | 'processing';
  progress: number;
  progressStats?: ProgressStats;
  started_at: string;
  error_message?: string;
}

interface RecentlyCompleted {
  id: string;
  workflow_name: string;
  status: 'completed' | 'failed';
  completedAt: number;
  seen: boolean;
}

interface ActiveExecutionsState {
  // Active executions (pending/processing only)
  executions: ActiveExecution[];
  loading: boolean;
  lastFetch: number | null;

  // Recently completed executions (for notifications)
  recentlyCompleted: RecentlyCompleted[];
}

interface ActiveExecutionsActions {
  fetchActive: () => Promise<void>;
  addExecution: (execution: ActiveExecution) => void;
  updateExecution: (id: string, updates: Partial<ActiveExecution>) => void;
  markCompleted: (id: string, status: 'completed' | 'failed') => void;
  markSeen: (id: string) => void;
  clearRecentlyCompleted: () => void;
  reset: () => void;
}

type ActiveExecutionsStore = ActiveExecutionsState & ActiveExecutionsActions;

export const useActiveExecutionsStore = create<ActiveExecutionsStore>((set, get) => ({
  // ============================================
  // STATE
  // ============================================

  executions: [],
  loading: false,
  lastFetch: null,
  recentlyCompleted: [],

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Fetch active executions (pending/processing only) from API
   */
  fetchActive: async () => {
    try {
      logger.debug('🔍 activeExecutionsStore.fetchActive: Fetching from API');
      set({ loading: true });

      const response = await workflowService.getActiveExecutions();
      // response is already unwrapped by Axios interceptor
      // response = { success: true, data: { executions: [...], total: ... } }
      const executions: ActiveExecution[] = response.data?.executions || [];

      // Check for completed executions (moved from active to completed)
      const currentExecutions = get().executions;
      const completedIds = new Set(executions.map((e: ActiveExecution) => e.id));

      currentExecutions.forEach((exec) => {
        // If an execution was active but is no longer in the list, it completed
        if (!completedIds.has(exec.id)) {
          logger.debug('✅ activeExecutionsStore.fetchActive: Execution completed', {
            id: exec.id,
            workflow_name: exec.workflow_name
          });

          // Move to recently completed
          const now = Date.now();
          set((state) => ({
            recentlyCompleted: [
              ...state.recentlyCompleted,
              {
                id: exec.id,
                workflow_name: exec.workflow_name,
                status: 'completed', // We'll assume success, failed will be caught by error_message
                completedAt: now,
                seen: false
              }
            ]
          }));
        }
      });

      set({
        executions,
        loading: false,
        lastFetch: Date.now()
      });

      logger.debug('✅ activeExecutionsStore.fetchActive: Success', {
        count: executions.length,
        executions: executions.map((e: ActiveExecution) => ({
          id: e.id,
          name: e.workflow_name,
          status: e.status,
          progress: e.progress
        }))
      });
    } catch (error: any) {
      logger.error('❌ activeExecutionsStore.fetchActive: Error', {
        error,
        message: error.message,
        response: error.response
      });
      set({ loading: false });
    }
  },

  /**
   * Add a new execution to the active list (called when user launches a workflow)
   */
  addExecution: (execution: ActiveExecution) => {
    logger.debug('➕ activeExecutionsStore.addExecution:', {
      id: execution.id,
      workflow_name: execution.workflow_name
    });

    set((state) => {
      // Prevent duplicates
      const exists = state.executions.some((e) => e.id === execution.id);
      if (exists) {
        logger.debug('⚠️ activeExecutionsStore.addExecution: Execution already exists', {
          id: execution.id
        });
        return state;
      }

      return {
        executions: [...state.executions, execution]
      };
    });
  },

  /**
   * Update an existing execution (called during polling)
   */
  updateExecution: (id: string, updates: Partial<ActiveExecution>) => {
    logger.debug('🔄 activeExecutionsStore.updateExecution:', {
      id,
      updates
    });

    set((state) => ({
      executions: state.executions.map((exec) =>
        exec.id === id ? { ...exec, ...updates } : exec
      )
    }));
  },

  /**
   * Mark an execution as completed/failed and move to recently completed
   */
  markCompleted: (id: string, status: 'completed' | 'failed') => {
    const execution = get().executions.find((e) => e.id === id);

    if (!execution) {
      logger.debug('⚠️ activeExecutionsStore.markCompleted: Execution not found', { id });
      return;
    }

    logger.debug('✅ activeExecutionsStore.markCompleted:', {
      id,
      workflow_name: execution.workflow_name,
      status
    });

    const now = Date.now();

    set((state) => ({
      // Remove from active executions
      executions: state.executions.filter((e) => e.id !== id),
      // Add to recently completed
      recentlyCompleted: [
        ...state.recentlyCompleted,
        {
          id: execution.id,
          workflow_name: execution.workflow_name,
          status,
          completedAt: now,
          seen: false
        }
      ]
    }));
  },

  /**
   * Mark a completed execution as seen (dismiss notification)
   */
  markSeen: (id: string) => {
    logger.debug('👁️ activeExecutionsStore.markSeen:', { id });

    set((state) => ({
      recentlyCompleted: state.recentlyCompleted.map((exec) =>
        exec.id === id ? { ...exec, seen: true } : exec
      )
    }));
  },

  /**
   * Clear all recently completed executions
   */
  clearRecentlyCompleted: () => {
    logger.debug('🗑️ activeExecutionsStore.clearRecentlyCompleted');

    set({ recentlyCompleted: [] });
  },

  /**
   * Reset store (called on logout)
   */
  reset: () => {
    logger.debug('🔄 activeExecutionsStore.reset: Clearing all data');

    set({
      executions: [],
      loading: false,
      lastFetch: null,
      recentlyCompleted: []
    });
  }
}));
