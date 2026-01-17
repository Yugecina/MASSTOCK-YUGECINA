/**
 * Admin-specific types for admin components and stores
 */

import { User, Client, Workflow, Execution } from './index';

// Admin Client types
export interface ClientStats {
  total_workflows: number;
  total_executions: number;
  success_rate: number;
  revenue_this_month: number | string;
  executions_this_month: number;
  open_tickets: number;
}

export interface ClientDetailResponse {
  client: Client & {
    company_name?: string;
    email?: string;
    plan?: string;
    subscription_amount?: number;
    status?: 'active' | 'pending' | 'suspended';
    subscription_start_date?: string;
  };
  stats: ClientStats;
}

export interface ClientMember {
  id: string;
  client_id: string;
  user_id: string;
  role: 'owner' | 'collaborator';
  created_at: string;
  user?: User;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: 'zap' | 'sparkles' | 'box';
  workflow_type: string;
  cost_per_execution: number;
  revenue_per_execution: number;
  config?: Record<string, any>;
}

export interface WorkflowStats {
  total_executions: number;
  success_rate: number;
  total_revenue: number | string;
}

export interface WorkflowWithStats extends Workflow {
  stats?: WorkflowStats;
  revenue_per_execution?: number;
  deployed_at?: string;
}

export interface ActivityLog {
  id: string;
  client_id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  created_at: string;
  user?: Pick<User, 'email'>;
}

export interface ExecutionFilters {
  status?: string;
  workflow_id?: string;
  page?: number;
  limit?: number;
}

export interface ExecutionStats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
}

export interface ExecutionWithDetails extends Execution {
  workflow?: Pick<Workflow, 'name'>;
  triggered_by_user?: Pick<User, 'email'>;
  duration_seconds?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Admin User types
export interface AdminUser extends User {
  name?: string;
  company_name?: string;
  subscription_plan?: string;
  status: 'active' | 'suspended' | 'deleted' | 'pending';
  last_login?: string;
  subscription_amount?: number;
  plan?: string;
  _isBlocking?: boolean;
}

export interface CreateUserFormData {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  status?: 'active' | 'suspended' | 'pending';
  client_id?: string;
  member_role?: 'owner' | 'collaborator';
}

export interface EditUserFormData {
  email: string;
  password?: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'pending';
}

export interface CreateClientFormData {
  name: string;
  plan: string;
  subscription_amount: number;
}

export interface EditClientFormData {
  name: string;
  plan: string;
  status: 'active' | 'pending' | 'suspended';
  subscription_amount: number;
}

// Analytics types
export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  period?: string;
  loading?: boolean;
  suffix?: string;
}

export interface ChartDataPoint {
  date: string;
  count?: number;
  revenue?: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
}

export interface FailureData {
  id: string;
  workflow_name: string;
  client_name: string;
  error_message: string;
  created_at: string;
}

export interface TopClient {
  id: string;
  name: string;
  executions: number;
  successRate: number;
  revenue: number;
}

export interface TopWorkflow {
  id: string;
  name: string;
  executions: number;
  successRate: number;
  avgDuration?: number;
  revenue: number;
}

// Workflow Request types
export type WorkflowRequestStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'negotiation'
  | 'contract_signed'
  | 'development'
  | 'deployed'
  | 'rejected';

export interface WorkflowRequest {
  id: string;
  title: string;
  description?: string;
  status: WorkflowRequestStatus;
  budget: number;
  timeline_days: number;
  client_id: string;
  created_at: string;
  updated_at: string;
}

// Search types
export interface UserSearchResult {
  id: string;
  email: string;
  created_at: string;
}

// Modal props
export interface ModalBaseProps {
  onClose: () => void;
}

export interface AddClientModalProps extends ModalBaseProps {
  onSuccess?: () => void;
}

export interface EditClientModalProps extends ModalBaseProps {
  client: Client | ClientDetailResponse['client'];
  onSuccess?: () => void;
}

export interface AddMemberModalProps extends ModalBaseProps {
  clientId: string;
}

export interface AssignWorkflowModalProps extends ModalBaseProps {
  clientId: string;
}

export interface UserModalProps extends ModalBaseProps {
  mode: 'create' | 'edit';
  user?: AdminUser | null;
  onSubmit: (data: CreateUserFormData | EditUserFormData) => Promise<void>;
}

export interface UserFormProps {
  mode: 'create' | 'edit';
  user?: AdminUser | null;
  onSubmit: (data: CreateUserFormData | EditUserFormData) => Promise<void>;
  onCancel: () => void;
}

export interface ConfirmDialogProps {
  type?: 'warning' | 'danger';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Extended User Filters for AdminUsers page
export interface ExtendedUserFilters {
  status?: string;
  plan?: string;
  search?: string;
  clientId?: string;
  createdFrom?: string | null;
  createdTo?: string | null;
  lastLoginFrom?: string | null;
  lastLoginTo?: string | null;
}

// User Stats for AdminUsers dashboard
export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
  byPlan: {
    starter: number;
    pro: number;
    enterprise: number;
  };
}

// UserDetailPanel props
export interface UserDetailPanelProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: AdminUser) => void;
  onBlock: (user: AdminUser) => void;
  onDelete: (userId: string) => void;
}

// Tab props
export interface ClientTabProps {
  clientId: string;
}
