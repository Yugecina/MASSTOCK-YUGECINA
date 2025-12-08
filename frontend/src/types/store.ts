/**
 * Zustand store types
 */

import { User, Client, Workflow, Execution } from './index';

// Auth store
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
}

// Theme store
export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

// Admin Client store
export interface AdminClientState {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  fetchClientById: (id: string) => Promise<void>;
  createClient: (data: Partial<Client>) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

// Workflow store
export interface WorkflowState {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
  fetchWorkflows: (clientId?: string) => Promise<void>;
  fetchWorkflowById: (id: string) => Promise<void>;
  createWorkflow: (data: Partial<Workflow>) => Promise<void>;
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
}

// Execution store
export interface ExecutionState {
  executions: Execution[];
  selectedExecution: Execution | null;
  isLoading: boolean;
  error: string | null;
  fetchExecutions: (filters?: Record<string, any>) => Promise<void>;
  fetchExecutionById: (id: string) => Promise<void>;
  createExecution: (data: Partial<Execution>) => Promise<void>;
}
