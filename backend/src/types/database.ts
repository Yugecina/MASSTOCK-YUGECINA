/**
 * Database types (Supabase schema)
 *
 * These types should match the actual database schema.
 * Can be generated using: npx supabase gen types typescript
 */

import { BaseEntity, UserRole, WorkflowStatus, ExecutionStatus } from './index';

export interface User extends BaseEntity {
  email: string;
  role: UserRole;
  client_id?: string;
  is_active: boolean;
}

export interface Client extends BaseEntity {
  name: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
}

export interface Workflow extends BaseEntity {
  name: string;
  description?: string;
  client_id: string;
  config: Record<string, any>;
  status: WorkflowStatus;
  version: number;
}

export interface Execution extends BaseEntity {
  workflow_id: string;
  client_id: string;
  user_id: string;
  status: ExecutionStatus;
  config: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

export interface Asset extends BaseEntity {
  execution_id: string;
  client_id: string;
  type: string;
  url: string;
  metadata?: Record<string, any>;
}

// Type for Supabase query builders
export type SupabaseTable = 'users' | 'clients' | 'workflows' | 'executions' | 'assets';
