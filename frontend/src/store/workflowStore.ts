/**
 * Workflow Store
 * Zustand store for workflow state management
 */

import { create } from 'zustand';
import { Workflow, Execution } from '../types/index';

interface WorkflowState {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  executions: Execution[];
}

interface WorkflowActions {
  setWorkflows: (workflows: Workflow[]) => void;
  setSelectedWorkflow: (workflow: Workflow | null) => void;
  setExecutions: (executions: Execution[]) => void;
}

type WorkflowStore = WorkflowState & WorkflowActions;

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  // State
  workflows: [],
  selectedWorkflow: null,
  executions: [],

  // Actions
  setWorkflows: (workflows: Workflow[]) => set({ workflows }),
  setSelectedWorkflow: (workflow: Workflow | null) => set({ selectedWorkflow: workflow }),
  setExecutions: (executions: Execution[]) => set({ executions }),
}));
