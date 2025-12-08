/**
 * API types (DTOs - Data Transfer Objects)
 */

import { UserRole, WorkflowStatus, ExecutionStatus } from './index';

// Auth DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    client_id?: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

// Workflow DTOs
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

// Execution DTOs
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

// Admin DTOs
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
