/**
 * Shared types for the frontend application
 */

export type UserRole = 'admin' | 'client' | 'member';
export type WorkflowStatus = 'draft' | 'deployed' | 'archived';
export type ExecutionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  client_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  config: Record<string, any>;
  status: WorkflowStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Execution {
  id: string;
  workflow_id: string;
  client_id: string;
  user_id: string;
  status: ExecutionStatus;
  config: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  execution_id: string;
  client_id: string;
  type: string;
  url: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
