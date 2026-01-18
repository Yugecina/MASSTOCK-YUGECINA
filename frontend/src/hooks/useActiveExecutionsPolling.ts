/**
 * Active Executions Polling Hook
 * Global polling hook for tracking active workflow executions
 * Runs independently of current page
 */

import { useEffect, useRef, useState } from 'react';
import { useActiveExecutionsStore } from '../store/activeExecutionsStore';
import type { ActiveExecution } from '../store/activeExecutionsStore';
import logger from '../utils/logger';
import toast from 'react-hot-toast';

interface UseActiveExecutionsPollingOptions {
  enabled?: boolean;
  onComplete?: (execution: ActiveExecution, status: 'completed' | 'failed') => void;
}

interface UseActiveExecutionsPollingReturn {
  activeCount: number;
  hasActiveExecutions: boolean;
  primaryExecution: ActiveExecution | null;
}

/**
 * Hook for polling active executions
 *
 * Polling strategy:
 * - Processing executions: 2 seconds (fast updates)
 * - Pending executions: 5 seconds (moderate updates)
 * - No active executions: 30 seconds (periodic check)
 */
export function useActiveExecutionsPolling(
  options: UseActiveExecutionsPollingOptions = {}
): UseActiveExecutionsPollingReturn {
  const { enabled = true, onComplete } = options;

  const { executions, recentlyCompleted, fetchActive } = useActiveExecutionsStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [previousCount, setPreviousCount] = useState<number>(0);

  // Calculate active count and primary execution
  const activeCount = executions.length;
  const hasActiveExecutions = activeCount > 0;
  const primaryExecution = executions.length > 0 ? executions[0] : null;

  // Determine optimal polling interval based on execution states
  const getPollingInterval = (): number => {
    if (activeCount === 0) {
      return 30000; // 30 seconds when idle (periodic check)
    }

    const hasProcessing = executions.some((e) => e.status === 'processing');
    if (hasProcessing) {
      return 2000; // 2 seconds when actively processing
    }

    return 5000; // 5 seconds when pending
  };

  // Handle completion notifications
  useEffect(() => {
    const unseen = recentlyCompleted.filter((exec) => !exec.seen);

    unseen.forEach((exec) => {
      if (exec.status === 'completed') {
        toast.success(
          `${exec.workflow_name} completed successfully!`,
          {
            duration: 5000,
            icon: '✅',
            id: exec.id // Prevent duplicate toasts
          }
        );
      } else if (exec.status === 'failed') {
        toast.error(
          `${exec.workflow_name} failed. Click to view details.`,
          {
            duration: 7000,
            icon: '❌',
            id: exec.id
          }
        );
      }

      // Mark as seen
      useActiveExecutionsStore.getState().markSeen(exec.id);

      // Call onComplete callback if provided
      if (onComplete) {
        const execution = executions.find((e) => e.id === exec.id);
        if (execution) {
          onComplete(execution, exec.status);
        }
      }
    });
  }, [recentlyCompleted, executions, onComplete]);

  // Polling effect
  useEffect(() => {
    if (!enabled) {
      logger.debug('⚠️ useActiveExecutionsPolling: Polling disabled');
      return;
    }

    logger.debug('🚀 useActiveExecutionsPolling: Starting polling', {
      activeCount,
      interval: getPollingInterval()
    });

    // Initial fetch
    fetchActive();

    // Set up polling interval
    const interval = getPollingInterval();
    intervalRef.current = setInterval(() => {
      logger.debug('🔄 useActiveExecutionsPolling: Polling tick', {
        activeCount,
        interval
      });
      fetchActive();
    }, interval);

    // Cleanup on unmount or when interval changes
    return () => {
      if (intervalRef.current) {
        logger.debug('🛑 useActiveExecutionsPolling: Stopping polling');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, activeCount, fetchActive]);

  // Restart interval when polling interval changes (e.g., pending -> processing)
  useEffect(() => {
    if (!enabled || !intervalRef.current) return;

    const newInterval = getPollingInterval();

    // Clear old interval and start new one with updated interval
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      logger.debug('🔄 useActiveExecutionsPolling: Polling tick (interval updated)', {
        activeCount,
        interval: newInterval
      });
      fetchActive();
    }, newInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeCount, executions, enabled, fetchActive]);

  // Track count changes for external effects
  useEffect(() => {
    if (activeCount !== previousCount) {
      logger.debug('📊 useActiveExecutionsPolling: Active count changed', {
        previous: previousCount,
        current: activeCount
      });
      setPreviousCount(activeCount);
    }
  }, [activeCount, previousCount]);

  return {
    activeCount,
    hasActiveExecutions,
    primaryExecution
  };
}
