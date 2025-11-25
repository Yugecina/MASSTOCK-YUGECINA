/**
 * Workflow Templates Controller
 * Handles workflow template operations
 */

const { supabaseAdmin } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * GET /api/v1/admin/workflow-templates
 * List all active workflow templates
 */
async function getTemplates(req, res) {
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
async function getTemplate(req, res) {
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
async function createTemplate(req, res) {
  const { name, description, workflow_type, config, cost_per_execution, revenue_per_execution, icon } = req.body;

  logger.debug('WorkflowTemplatesController.createTemplate:', { name, workflow_type });

  if (!name || !workflow_type) {
    throw new ApiError(400, 'Name and workflow_type are required', 'MISSING_REQUIRED_FIELDS');
  }

  const { data: template, error } = await supabaseAdmin
    .from('workflow_templates')
    .insert([{
      name,
      description,
      workflow_type,
      config: config || {},
      cost_per_execution: cost_per_execution || 0,
      revenue_per_execution: revenue_per_execution || 0,
      icon: icon || 'image',
      is_active: true,
      created_by: req.user.id
    }])
    .select()
    .single();

  if (error) {
    logger.error('WorkflowTemplatesController.createTemplate error:', { error });
    throw new ApiError(500, 'Failed to create template', 'DATABASE_ERROR');
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert([{
    user_id: req.user.id,
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
}

/**
 * PUT /api/v1/admin/workflow-templates/:id
 * Update a workflow template
 */
async function updateTemplate(req, res) {
  const { id } = req.params;
  const { name, description, workflow_type, config, cost_per_execution, revenue_per_execution, icon, is_active, display_order } = req.body;

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

  // Build update object
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (workflow_type !== undefined) updates.workflow_type = workflow_type;
  if (config !== undefined) updates.config = config;
  if (cost_per_execution !== undefined) updates.cost_per_execution = cost_per_execution;
  if (revenue_per_execution !== undefined) updates.revenue_per_execution = revenue_per_execution;
  if (icon !== undefined) updates.icon = icon;
  if (is_active !== undefined) updates.is_active = is_active;
  if (display_order !== undefined) updates.display_order = display_order;
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
}

/**
 * DELETE /api/v1/admin/workflow-templates/:id
 * Deactivate a workflow template
 */
async function deleteTemplate(req, res) {
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
    user_id: req.user.id,
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

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
