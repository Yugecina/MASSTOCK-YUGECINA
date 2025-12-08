/**
 * Shared types for the backend application
 */

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export type UserRole = 'admin' | 'client' | 'member';
export type WorkflowStatus = 'draft' | 'deployed' | 'archived';
export type ExecutionStatus = 'pending' | 'processing' | 'completed' | 'failed';
