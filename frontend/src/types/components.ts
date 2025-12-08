/**
 * Component prop types
 */

import { ReactNode } from 'react';
import { User, Client, Workflow, Execution, UserRole } from './index';

// Common props
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

// Button props
export interface ButtonProps extends BaseComponentProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

// Modal props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
}

// Table props
export interface TableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
}

// Form props
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Workflow component props
export interface WorkflowTableProps {
  workflows: Workflow[];
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export interface ExecutionTableProps {
  executions: Execution[];
  onViewDetails?: (id: string) => void;
  loading?: boolean;
}

// Admin component props
export interface UserTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  loading?: boolean;
}

export interface ClientTableProps {
  clients: Client[];
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

// Protected route props
export interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  requiredRole?: UserRole;
}

// Layout component props
export interface LayoutProps {
  children: ReactNode;
}

// Dashboard component props
export interface SparklineDataPoint {
  value: number;
}

export interface SparklineProps {
  data?: SparklineDataPoint[];
  color?: string;
  height?: number;
}

export interface CardAssetProps {
  icon?: ReactNode;
  iconBg?: string;
  title?: string;
  subtitle?: string;
  price?: string;
  change?: string;
  sparklineData?: SparklineDataPoint[];
  isPositive?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

export interface FilterTabsProps {
  tabs?: FilterTab[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export type ViewType = 'grid' | 'list';

export interface ViewToggleProps {
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
  className?: string;
}

export interface Stat {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  subtitle?: string;
}

export interface StatsCarouselProps {
  stats?: Stat[];
  className?: string;
}
