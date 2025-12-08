/**
 * Workflow-specific types
 */

import { ExecutionStatus } from './index';

export interface WorkflowConfig {
  type: 'nano-banana' | 'custom';
  settings: Record<string, any>;
}

export interface ExecutionConfig {
  prompts: string[];
  options?: {
    batch_size?: number;
    concurrent?: boolean;
    max_retries?: number;
  };
}

export interface WorkflowJobData {
  executionId: string;
  workflowId: string;
  clientId: string;
  userId: string;
  config: ExecutionConfig;
}

export interface WorkflowJobResult {
  executionId: string;
  status: ExecutionStatus;
  results?: any[];
  error?: string;
}

export interface GeminiImageOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}
