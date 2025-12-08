/**
 * Workflow Templates Controller
 * Handles workflow template operations
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { z } from 'zod';

// ============================================
// Zod Validation Schemas
// ============================================

const createTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().optional(),
  workflow_type: z.string().trim().min(1, 'Workflow type is required'),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  cost_per_execution: z.coerce.number().min(0).optional().default(0),
  revenue_per_execution: z.coerce.number().min(0).optional().default(0),
  icon: z.string().trim().optional().default('image'),
});

const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional(),
  workflow_type: z.string().trim().min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  cost_per_execution: z.coerce.number().min(0).optional(),
  revenue_per_execution: z.coerce.number().min(0).optional(),
  icon: z.string().trim().optional(),
  is_active: z.boolean().optional(),
  display_order: z.coerce.number().int().min(0).optional(),
});

/**
 * GET /api/v1/admin/workflow-templates
 * List all active workflow templates
 */
export async function getTemplates(req: Request, res: Response): Promise<void> {
  logger.debug('WorkflowTemplatesController.getTemplates');

  const { data: templates, error } = await supabaseAdmin
    .from('workflow_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('WorkflowTemplatesController.getTemplates error:', { error });
    throw new ApiError(500, 'Failed to fetch workflow templates', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      templates: templates || [],
      total: templates?.length || 0
    }
  });
}

/**
 * GET /api/v1/admin/workflow-templates/:id
 * Get single workflow template
 */
export async function getTemplate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  logger.debug('WorkflowTemplatesController.getTemplate:', { id });

  const { data: template, error } = await supabaseAdmin
    .from('workflow_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !template) {
    throw new ApiError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
  }

  res.json({
    success: true,
    data: template
  });
}

/**
 * POST /api/v1/admin/workflow-templates
 * Create a new workflow template (admin only)
 */
export async function createTemplate(req: Request, res: Response): Promise<void> {
  try {
    // Validate input with Zod
    const validatedData = createTemplateSchema.parse(req.body);
    const { name, description, workflow_type, config, cost_per_execution, revenue_per_execution, icon } = validatedData;

    logger.debug('WorkflowTemplatesController.createTemplate:', { name, workflow_type });

    const { data: template, error } = await supabaseAdmin
      .from('workflow_templates')
      .insert([{
        name,
        description,
        workflow_type,
        config,
        cost_per_execution,
        revenue_per_execution,
        icon,
        is_active: true,
        created_by: (req as any).user.id
      }])
      .select()
      .single();

    if (error) {
      logger.error('WorkflowTemplatesController.createTemplate error:', { error });
      throw new ApiError(500, 'Failed to create template', 'DATABASE_ERROR');
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert([{
      user_id: (req as any).user.id,
      action: 'template_created',
      resource_type: 'workflow_template',
      resource_id: template.id,
      changes: { name, workflow_type },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });

  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.warn('WorkflowTemplatesController.createTemplate validation error:', {
        errors: error.issues
      });
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    // Re-throw ApiError for global error handler
    if (error instanceof ApiError) {
      throw error;
    }

    // Log unexpected errors
    logger.error('WorkflowTemplatesController.createTemplate unexpected error:', {
      error: error.message,
      stack: error.stack
    });
    throw new ApiError(500, 'Internal server error', 'INTERNAL_ERROR');
  }
}

/**
 * PUT /api/v1/admin/workflow-templates/:id
 * Update a workflow template
 */
export async function updateTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Validate input with Zod
    const validatedData = updateTemplateSchema.parse(req.body);

    logger.debug('WorkflowTemplatesController.updateTemplate:', { id });

    // Fetch existing template
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('workflow_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      throw new ApiError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
    }

    // Build update object from validated data
    const updates: any = { ...validatedData };
    updates.updated_at = new Date().toISOString();

    const { data: template, error } = await supabaseAdmin
      .from('workflow_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('WorkflowTemplatesController.updateTemplate error:', { error });
      throw new ApiError(500, 'Failed to update template', 'DATABASE_ERROR');
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });

  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.warn('WorkflowTemplatesController.updateTemplate validation error:', {
        errors: error.issues
      });
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    // Re-throw ApiError for global error handler
    if (error instanceof ApiError) {
      throw error;
    }

    // Log unexpected errors
    logger.error('WorkflowTemplatesController.updateTemplate unexpected error:', {
      error: error.message,
      stack: error.stack
    });
    throw new ApiError(500, 'Internal server error', 'INTERNAL_ERROR');
  }
}

/**
 * DELETE /api/v1/admin/workflow-templates/:id
 * Deactivate a workflow template
 */
export async function deleteTemplate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  logger.debug('WorkflowTemplatesController.deleteTemplate:', { id });

  const { data: template, error } = await supabaseAdmin
    .from('workflow_templates')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !template) {
    throw new ApiError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert([{
    user_id: (req as any).user.id,
    action: 'template_deactivated',
    resource_type: 'workflow_template',
    resource_id: id,
    changes: { name: template.name },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.json({
    success: true,
    message: 'Template deactivated successfully'
  });
}
