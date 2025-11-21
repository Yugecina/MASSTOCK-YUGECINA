import { create } from 'zustand'

export const useWorkflowStore = create((set) => ({
  workflows: [],
  selectedWorkflow: null,
  executions: [],
  
  setWorkflows: (workflows) => set({ workflows }),
  setSelectedWorkflow: (workflow) => set({ selectedWorkflow: workflow }),
  setExecutions: (executions) => set({ executions }),
}))
