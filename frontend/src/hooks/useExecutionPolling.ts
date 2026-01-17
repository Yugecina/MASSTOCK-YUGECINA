/**
 * useExecutionPolling Hook
 * Manages auto-refresh polling for execution status updates
 */

import { useEffect, useRef, useCallback } from 'react';
import logger from '@/utils/logger';

interface UseExecutionPollingOptions<T> {
  /** Current execution data */
  execution: T | null;
  /** Function to check if execution is in a terminal state */
  isTerminalState: (execution: T) => boolean;
  /** Function to fetch updated execution data */
  fetchExecution: () => Promise<T>;
  /** Callback when execution is updated */
  onUpdate: (execution: T) => void;
  /** Polling interval in milliseconds (default: 3000) */
  interval?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
}

interface UseExecutionPollingReturn {
  /** Whether polling is currently active */
  isPolling: boolean;
}

/**
 * Hook for polling execution status until completion
 */
export function useExecutionPolling<T>({
  execution,
  isTerminalState,
  fetchExecution,
  onUpdate,
  interval = 3000,
  enabled = true
}: UseExecutionPollingOptions<T>): UseExecutionPollingReturn {
  const intervalRef = useRef<number | null>(null);
  const isPolling = useRef(false);

  // Check if we should be polling
  const shouldPoll = enabled && execution !== null && !isTerminalState(execution);

  // Polling function
  const poll = useCallback(async () => {
    try {
      const updatedExecution = await fetchExecution();
      onUpdate(updatedExecution);

      logger.debug('useExecutionPolling: Polling update received', {
        isTerminal: isTerminalState(updatedExecution)
      });
    } catch (err) {
      logger.error('useExecutionPolling: Polling failed', { error: err });
    }
  }, [fetchExecution, onUpdate, isTerminalState]);

  // Start/stop polling based on execution state
  useEffect(() => {
    if (shouldPoll) {
      logger.debug('useExecutionPolling: Starting polling', { interval });
      isPolling.current = true;

      intervalRef.current = window.setInterval(poll, interval);

      return () => {
        if (intervalRef.current !== null) {
          logger.debug('useExecutionPolling: Stopping polling');
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          isPolling.current = false;
        }
      };
    }

    return undefined;
  }, [shouldPoll, poll, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    isPolling: isPolling.current
  };
}

/**
 * Helper to check if an execution status is terminal
 * @param status - Execution status string
 * @returns True if the status is terminal (completed or failed)
 */
export function isTerminalExecutionStatus(status: string): boolean {
  return ['completed', 'failed'].includes(status);
}
