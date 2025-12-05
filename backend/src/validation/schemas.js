/**
 * Centralized Zod Validation Schemas
 * All input validation schemas for MasStock API
 */

const { z } = require('zod');

// ============================================
// Common Schemas
// ============================================

const uuidSchema = z.string().uuid();
const emailSchema = z.string().email();
const passwordSchema = z.string().min(8);

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ============================================
// Auth Schemas
// ============================================

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// ============================================
// Admin Schemas
// ============================================

const createAdminSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().optional(),
});

const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().optional(),
  role: z.enum(['user', 'admin']).default('user'),
  client_id: uuidSchema.optional(),
  member_role: z.enum(['owner', 'collaborator']).default('collaborator'),
});

const createClientSchema = z.object({
  name: z.string().trim().min(2).max(255),
  plan: z.enum(['premium_custom', 'starter', 'pro']).default('premium_custom'),
  subscription_amount: z.coerce.number().min(0).default(0),
});

const updateClientSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  subscription_amount: z.coerce.number().min(0).optional(),
  plan: z.enum(['premium_custom', 'starter', 'pro']).optional(),
  metadata: z.record(z.unknown()).optional(),
  company_name: z.string().trim().optional(),
});

// ============================================
// Client Member Schemas
// ============================================

const memberRoleSchema = z.enum(['owner', 'collaborator']);

const addMemberSchema = z.object({
  user_id: uuidSchema,
  role: memberRoleSchema.default('collaborator'),
});

const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

// ============================================
// Workflow Schemas
// ============================================

const workflowStageSchema = z.enum([
  'draft',
  'submitted',
  'reviewing',
  'negotiation',
  'contract_signed',
  'development',
  'deployed',
  'rejected'
]);

const updateWorkflowStageSchema = z.object({
  stage: workflowStageSchema,
});

const assignWorkflowToClientSchema = z.object({
  template_id: uuidSchema,
  name: z.string().trim().min(1).max(255).optional(),
});

// ============================================
// Support Ticket Schemas
// ============================================

const ticketPrioritySchema = z.enum(['urgent', 'high', 'medium', 'low']);
const ticketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);

const createTicketSchema = z.object({
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(10),
  priority: ticketPrioritySchema.default('medium'),
  workflow_execution_id: uuidSchema.optional(),
});

const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  assigned_to: uuidSchema.optional(),
  response: z.string().trim().optional(),
});

// ============================================
// Workflow Request Schemas
// ============================================

const frequencySchema = z.enum(['daily', 'weekly', 'monthly', 'sporadic']);

const createWorkflowRequestSchema = z.object({
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(10),
  use_case: z.string().trim().optional(),
  frequency: frequencySchema.optional(),
  budget: z.coerce.number().min(0).optional(),
});

const updateWorkflowRequestSchema = z.object({
  status: workflowStageSchema.optional(),
  notes: z.string().trim().optional(),
  estimated_cost: z.coerce.number().min(0).optional(),
  estimated_dev_days: z.coerce.number().int().min(0).optional(),
});

// ============================================
// Settings Schemas
// ============================================

const inviteCollaboratorSchema = z.object({
  email: emailSchema,
  role: z.enum(['user', 'admin']).default('user'),
});

// ============================================
// Workflow Execution Schemas (nano_banana)
// ============================================

const executeWorkflowSchema = z.object({
  prompts_text: z.string().min(1).optional(),
  api_key: z.string().optional(),
  model: z.string().optional(),
  aspect_ratio: z.string().optional(),
  resolution: z.string().optional(),
});

// ============================================
// Query Schemas
// ============================================

const executionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.string().optional(),
  workflow_id: uuidSchema.optional(),
  user_id: uuidSchema.optional(),
  fields: z.string().optional(),
});

// ============================================
// Exports
// ============================================

module.exports = {
  // Common
  uuidSchema,
  emailSchema,
  passwordSchema,
  paginationSchema,

  // Auth
  loginSchema,

  // Admin
  createAdminSchema,
  createUserSchema,
  createClientSchema,
  updateClientSchema,

  // Members
  memberRoleSchema,
  addMemberSchema,
  updateMemberRoleSchema,

  // Workflows
  workflowStageSchema,
  updateWorkflowStageSchema,
  assignWorkflowToClientSchema,
  executeWorkflowSchema,

  // Tickets
  ticketPrioritySchema,
  ticketStatusSchema,
  createTicketSchema,
  updateTicketSchema,

  // Workflow requests
  frequencySchema,
  createWorkflowRequestSchema,
  updateWorkflowRequestSchema,

  // Settings
  inviteCollaboratorSchema,

  // Queries
  executionsQuerySchema,
};
