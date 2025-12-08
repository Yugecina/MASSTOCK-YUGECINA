/**
 * API response types
 */

import { User, UserRole, WorkflowStatus, ExecutionStatus } from './index';

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

// Workflow API types
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  client_id: string;
  config: Record<string, any>;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  status?: WorkflowStatus;
}

// Execution API types
export interface CreateExecutionRequest {
  workflow_id: string;
  config: Record<string, any>;
}

export interface ExecutionResponse {
  id: string;
  workflow_id: string;
  status: ExecutionStatus;
  result?: Record<string, any>;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// Admin API types
export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  client_id?: string;
}

export interface UpdateUserRequest {
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

// Generic API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
