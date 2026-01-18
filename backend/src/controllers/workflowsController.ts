/**
 * Workflows Controller
 * Handles workflow management and execution
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { createClient } from '@supabase/supabase-js';
import { logger, logWorkflowExecution, logAudit } from '../config/logger';
import { ApiError } from '../middleware/errorHandler';
import { addWorkflowJob } from '../queues/workflowQueue';
import { v4 as uuidv4 } from 'uuid';
import { parsePrompts, validatePrompts } from '../utils/promptParser';
import { filesToBase64 } from '../middleware/upload';
import { encryptApiKey } from '../utils/encryption';
import { z, ZodError } from 'zod';
import { executeWorkflowSchema, executionsQuerySchema } from '../validation/schemas';

// ============================================
// SECURITY: Log Injection Prevention
// ============================================

/**
 * Sanitize user input before logging to prevent log injection attacks
 *
 * Log injection occurs when user-controlled data containing newlines
 * or special characters is written to logs, allowing attackers to:
 * - Forge fake log entries
 * - Hide malicious activity
 * - Poison log analysis tools
 *
 * @param input - User-controlled string to sanitize
 * @returns Sanitized string safe for logging
 */
const sanitizeForLog = (input: unknown): string => {
  if (input === null || input === undefined) return '[null]';

  const str = String(input);

  // Remove newlines, carriage returns, tabs (log injection vectors)
  // Limit length to prevent log flooding
  return str
    .replace(/[\n\r\t]/g, ' ')
    .substring(0, 200);
};

// Create a fresh admin client for each query to avoid auth context contamination
function getCleanAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/workflows
 * Get all workflows for authenticated client
 * Fetches workflows via client_workflows junction table (NEW ARCHITECTURE)
 */
export async function getWorkflows(req: Request, res: Response): Promise<void> {
  const clientId = (req as any).client?.id;

  logger.debug('🔍 getWorkflows called:', {
    hasClient: !!(req as any).client,
    clientId: clientId,
    userId: (req as any).user?.id,
    userEmail: (req as any).user?.email
  });

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

  // Use a fresh admin client to avoid auth context issues
  const admin = getCleanAdmin();

  // Fetch workflows via client_workflows junction table
  const { data: accessList, error } = await admin
    .from('client_workflows')
    .select(`
      workflow_id,
      assigned_at,
      is_active,
      workflow:workflows (
        id, name, description, status, config,
        template_id, is_shared, created_at, updated_at
      )
    `)
    .eq('client_id', clientId)
    .eq('is_active', true);

  if (error) {
    logger.error('❌ Workflows query error:', error);
    throw new ApiError(500, `Failed to fetch workflows: ${error.message}`, 'DATABASE_ERROR');
  }

  // Get execution count for each workflow
  const workflows = await Promise.all(
    (accessList || [])
      .filter(a => a.workflow) // Filter out null workflows
      .map(async (access) => {
        const { count } = await admin
          .from('workflow_executions')
          .select('*', { count: 'exact', head: true })
          .eq('workflow_id', access.workflow_id)
          .eq('client_id', clientId);

        return {
          ...access.workflow,
          execution_count: count || 0,
          assigned_at: access.assigned_at
        };
      })
  );

  logger.debug(`✅ Found ${workflows.length} workflows for client ${clientId}`);

  res.json({
    success: true,
    data: {
      workflows: workflows || [],
      total: workflows.length
    }
  });
}

/**
 * GET /api/workflows/:workflow_id
 * Get workflow details with stats and recent executions
 * Verifies access via client_workflows junction table (NEW ARCHITECTURE)
 */
export async function getWorkflow(req: Request, res: Response): Promise<void> {
  const { workflow_id } = req.params;
  const clientId = (req as any).client?.id;

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

  // Use a fresh admin client to avoid auth context issues
  const admin = getCleanAdmin();

  // DEBUG: Log query parameters
  logger.info(`🔍 getWorkflow DEBUG:`, {
    workflow_id,
    clientId,
    clientIdType: typeof clientId,
    workflow_idType: typeof workflow_id
  });

  // Check access via client_workflows junction table
  const { data: access, error: accessError } = await admin
    .from('client_workflows')
    .select('*')
    .eq('client_id', clientId)
    .eq('workflow_id', workflow_id)
    .eq('is_active', true)
    .maybeSingle();

  // DEBUG: Log query result
  logger.info(`🔍 getWorkflow access query result:`, {
    accessFound: !!access,
    accessError: accessError,
    accessData: access
  });

  if (accessError) {
    logger.error('❌ Error checking workflow access:', accessError);
    throw new ApiError(500, 'Database error', 'DATABASE_ERROR');
  }

  if (!access) {
    logger.warn(`⚠️ No access found for client ${sanitizeForLog(clientId)} to workflow ${sanitizeForLog(workflow_id)}`);
    throw new ApiError(404, 'Workflow not found or access denied', 'WORKFLOW_NOT_FOUND');
  }

  // Fetch workflow (without client_id filter)
  const { data: workflow, error } = await admin
    .from('workflows')
    .select('*')
    .eq('id', workflow_id)
    .single();

  if (error || !workflow) {
    logger.error('❌ Error fetching workflow:', error);
    throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
  }

  // Fetch execution stats (filter by client_id to ensure isolation)
  const { data: executions, error: execError } = await admin
    .from('workflow_executions')
    .select('status, duration_seconds, created_at')
    .eq('workflow_id', workflow_id)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (execError) {
    logger.error('❌ Error fetching executions:', execError);
  }

  const totalExecutions = executions?.length || 0;
  const successCount = executions?.filter(e => e.status === 'completed').length || 0;
  const failedCount = executions?.filter(e => e.status === 'failed').length || 0;
  const avgDuration = executions?.length > 0
    ? executions.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / executions.length
    : 0;

  logger.info('✅ getWorkflow success:', {
    workflow_id,
    workflow_name: workflow.name,
    totalExecutions,
    successCount,
    failedCount
  });

  res.json({
    success: true,
    data: {
      workflow,
      stats: {
        total_executions: totalExecutions,
        success_count: successCount,
        failed_count: failedCount,
        success_rate: totalExecutions > 0 ? (successCount / totalExecutions * 100).toFixed(2) : 0,
        avg_duration_seconds: Math.round(avgDuration)
      },
      recent_executions: executions || []
    }
  });
}

/**
 * POST /api/workflows/:workflow_id/execute
 * Execute workflow asynchronously
 * Supports both JSON (standard workflows) and multipart/form-data (nano_banana)
 * Verifies access via client_workflows junction table (NEW ARCHITECTURE)
 */
export async function executeWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const { workflow_id } = req.params;
    const clientId = (req as any).client?.id;

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }
    const userId = (req as any).user.id;

    // Use a fresh admin client to avoid auth context issues
    const admin = getCleanAdmin();

    // Check access via client_workflows junction table
    const { data: access, error: accessError } = await admin
      .from('client_workflows')
      .select('*')
      .eq('client_id', clientId)
      .eq('workflow_id', workflow_id)
      .eq('is_active', true)
      .maybeSingle();

    if (accessError) {
      logger.error('❌ Error checking workflow access:', accessError);
      throw new ApiError(500, 'Database error', 'DATABASE_ERROR');
    }

    if (!access) {
      logger.warn(`⚠️ No access found for client ${sanitizeForLog(clientId)} to workflow ${sanitizeForLog(workflow_id)}`);
      throw new ApiError(404, 'Workflow not found or access denied', 'WORKFLOW_NOT_FOUND');
    }

    // Fetch workflow (without client_id filter)
    const { data: workflow, error } = await admin
      .from('workflows')
      .select('*')
      .eq('id', workflow_id)
      .single();

    if (error || !workflow) {
      throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
    }

    // Check if workflow is deployed
    if (workflow.status !== 'deployed') {
      throw new ApiError(400, 'Workflow is not deployed', 'WORKFLOW_NOT_DEPLOYED');
    }

    // Validate input with Zod (for nano_banana workflows)
    let validatedData;
    if (workflow.config.workflow_type === 'nano_banana') {
      validatedData = executeWorkflowSchema.parse(req.body);
    }

    // Prepare input_data based on workflow type
    let input_data;
    let updatedConfig = workflow.config;

    if (workflow.config.workflow_type === 'nano_banana') {
      // Nano Banana workflow: multipart form data with prompts and images
      // Validate required fields first (before falling back to defaults)
      const prompts_text_input = validatedData?.prompts_text || req.body.prompts_text;
      const prompts_input = req.body.prompts;

      // Check if ANY prompt input is provided
      if (!prompts_text_input && !prompts_input) {
        throw new ApiError(400, 'prompts_text or prompts is required', 'MISSING_PROMPTS');
      }

      // Check if prompts array is empty
      if (Array.isArray(prompts_input) && prompts_input.length === 0) {
        throw new ApiError(400, 'prompts array cannot be empty', 'EMPTY_PROMPTS');
      }

      // Use provided values or fall back to defaults only after validation
      const prompts_text = prompts_text_input || process.env.DEFAULT_NANO_BANANA_PROMPT;
      const api_key = validatedData?.api_key || req.body.api_key || process.env.DEFAULT_GEMINI_API_KEY;

      // Ensure files is always an array (Multer can return undefined or {} when no files)
      let files = (req as any).files?.['reference_images'] || (req as any).files || [];
      if (!Array.isArray(files)) {
        files = [];
      }

      // DEBUG: Log received files from Multer
      logger.debug('🔍 MULTER FILES RECEIVED:', {
        filesCount: files.length,
        files: files.map(f => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          buffer_length: f.buffer?.length
        })),
        req_body_keys: Object.keys(req.body),
        req_files_type: typeof (req as any).files,
        req_files_is_array: Array.isArray((req as any).files)
      });

      // Helper: Ensure parameter is a string (prevent type confusion attacks)
      const ensureString = (value: unknown): string | undefined => {
        if (typeof value === 'string') return value;
        if (Array.isArray(value) && value.length > 0) return String(value[0]);
        return undefined;
      };

      // NEW: Get model, aspect_ratio, and resolution with defaults
      // CodeQL Fix: Prevent type confusion by ensuring values are strings
      const model = ensureString(validatedData.model) || ensureString(req.body.model) || workflow.config.default_model || 'gemini-2.5-flash-image';
      const aspect_ratio = ensureString(validatedData.aspect_ratio) || ensureString(req.body.aspect_ratio) || workflow.config.default_aspect_ratio || '1:1';

      // Determine resolution default based on model type
      const isProModel = model === 'gemini-3-pro-image-preview';
      const defaultResolution = isProModel
        ? (workflow.config.default_resolution?.pro || '1K')
        : (workflow.config.default_resolution?.flash || '1K');
      const resolution = ensureString(validatedData.resolution) || ensureString(req.body.resolution) || defaultResolution;

      logger.debug('📥 Received workflow execution request:', {
        hasPromptsText: !!prompts_text,
        hasApiKey: !!api_key,
        filesCount: files.length,
        model,
        aspectRatio: aspect_ratio,
        resolution,
        usingDefaultPrompt: !req.body.prompts_text && !!process.env.DEFAULT_NANO_BANANA_PROMPT,
        usingDefaultApiKey: !req.body.api_key && !!process.env.DEFAULT_GEMINI_API_KEY
      });

      // Validate required fields (after applying defaults)
      if (!prompts_text) {
        throw new ApiError(400, 'prompts_text is required and no default is configured', 'MISSING_PROMPTS_TEXT');
      }

      if (!api_key) {
        throw new ApiError(400, 'api_key is required and no default is configured', 'MISSING_API_KEY');
      }

      // NEW: Validate model
      const validModels = workflow.config.available_models || ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'];
      if (!validModels.includes(model)) {
        throw new ApiError(400, `Invalid model. Must be one of: ${validModels.join(', ')}`, 'INVALID_MODEL');
      }

      // NEW: Validate aspect ratio
      const validRatios = workflow.config.aspect_ratios || ['1:1', '16:9', '9:16', '4:3', '3:4'];
      if (!validRatios.includes(aspect_ratio)) {
        throw new ApiError(400, `Invalid aspect ratio. Must be one of: ${validRatios.join(', ')}`, 'INVALID_ASPECT_RATIO');
      }

      // NEW: Validate resolution for Pro model
      if (isProModel) {
        const validResolutions = workflow.config.available_resolutions?.pro || ['1K', '2K', '4K'];
        if (!validResolutions.includes(resolution)) {
          throw new ApiError(400, `Invalid resolution for Pro model. Must be one of: ${validResolutions.join(', ')}`, 'INVALID_RESOLUTION');
        }
      }

      // Parse and validate prompts
      const prompts = parsePrompts(prompts_text);
      const validation = validatePrompts(prompts, {
        maxPrompts: workflow.config.max_prompts || 100,
        maxLength: 10000 // Allow detailed prompts with add/negative sections (was 1000)
      });

      if (!validation.valid) {
        throw new ApiError(400, 'Invalid prompts', 'INVALID_PROMPTS', validation.errors);
      }

      // Convert files to base64
      const referenceImages = filesToBase64(files);

      if (referenceImages.length > (workflow.config.max_reference_images || 14)) {
        throw new ApiError(400, `Maximum ${workflow.config.max_reference_images || 14} reference images allowed`, 'TOO_MANY_FILES');
      }

      // NEW: Calculate dynamic pricing based on model and resolution
      const calculateDynamicPricing = (model, resolution, imageCount, pricingConfig) => {
        let costPerImage, revenuePerImage;

        if (model === 'gemini-2.5-flash-image') {
          costPerImage = pricingConfig.flash.cost_per_image;
          revenuePerImage = pricingConfig.flash.revenue_per_image;
        } else {
          // gemini-3-pro-image-preview
          costPerImage = pricingConfig.pro[resolution].cost_per_image;
          revenuePerImage = pricingConfig.pro[resolution].revenue_per_image;
        }

        const totalCost = costPerImage * imageCount;
        const totalRevenue = revenuePerImage * imageCount;
        const profit = totalRevenue - totalCost;

        return {
          cost_per_image_eur: costPerImage,
          total_cost_eur: totalCost,
          total_revenue_eur: totalRevenue,
          profit_eur: profit,
          image_count: imageCount
        };
      };

      const pricing = calculateDynamicPricing(model, resolution, prompts.length, workflow.config.pricing);

      logger.info('💰 Dynamic pricing calculated:', pricing);

      // Encrypt API key
      const encryptedApiKey = encryptApiKey(api_key);

      // Update workflow config with encrypted API key and new params (ephemeral for this execution)
      updatedConfig = {
        ...workflow.config,
        api_key_encrypted: encryptedApiKey,
        model: model,
        aspect_ratio: aspect_ratio,
        resolution: resolution,
        pricing_details: pricing
      };

      // Update workflow with encrypted key
      await admin
        .from('workflows')
        .update({ config: updatedConfig })
        .eq('id', workflow_id);

      // Prepare input data
      input_data = {
        prompts,
        reference_images: referenceImages,
        total_prompts: prompts.length,
        model: model,
        aspect_ratio: aspect_ratio,
        resolution: resolution,
        pricing_details: pricing
      };
    } else if (workflow.config.workflow_type === 'smart_resizer') {
      // Smart Resizer workflow: multipart form with images and formats
      const filesObj = (req as any).files || {};
      const imageFiles = filesObj['images'] || [];
      const batch_count = parseInt(req.body.batch_count || '0');
      const ai_regeneration = req.body.ai_regeneration === 'true';

      // Validate required fields
      if (imageFiles.length === 0) {
        throw new ApiError(400, 'At least one image is required', 'MISSING_IMAGES');
      }

      // Validate workflow config
      if (!workflow.config.available_formats || !Array.isArray(workflow.config.available_formats)) {
        throw new ApiError(500, 'Workflow configuration missing available_formats', 'INVALID_WORKFLOW_CONFIG');
      }


      // Build batch with per-image formats
      const batch = imageFiles.map((file: any, index: number) => {
        const formatsKey = `formats_${index}`;
        let formats: string[];
        try {
          formats = req.body[formatsKey] ? JSON.parse(req.body[formatsKey]) : [];
        } catch (parseError: any) {
          throw new ApiError(400, `Invalid JSON for ${formatsKey}: ${parseError.message}`, 'INVALID_FORMATS_JSON');
        }

        if (formats.length === 0) {
          throw new ApiError(400, `Image ${index} has no formats selected`, 'MISSING_FORMATS');
        }

        // Validate formats against available_formats
        const validFormats = workflow.config.available_formats.map((f: any) => f.id);
        const invalidFormats = formats.filter((f: string) => !validFormats.includes(f));
        if (invalidFormats.length > 0) {
          throw new ApiError(400, `Invalid formats for image ${index}: ${invalidFormats.join(', ')}`, 'INVALID_FORMATS');
        }

        return {
          image_base64: file.buffer.toString('base64'),
          image_mime: file.mimetype,
          image_name: file.originalname,
          formats
        };
      });

      // Calculate pricing (total formats across all images)
      const totalFormats = batch.reduce((sum, item) => sum + item.formats.length, 0);
      const pricingConfig = workflow.config.pricing?.per_format || { cost_per_format: 0.001, revenue_per_format: 0.01 };
      const pricing = {
        cost_per_format: pricingConfig.cost_per_format,
        total_cost: totalFormats * pricingConfig.cost_per_format,
        total_revenue: totalFormats * pricingConfig.revenue_per_format,
        format_count: totalFormats,
        image_count: batch.length
      };

      logger.info('💰 Smart Resizer pricing calculated:', pricing);

      // Prepare input data
      input_data = {
        batch,
        ai_regeneration,
        pricing_details: pricing
      };

      updatedConfig = {
        ...workflow.config,
        pricing_details: pricing
      };
    } else if (workflow.config.workflow_type === 'room_redesigner') {
      // Room Redesigner workflow: multipart form with room images
      const filesObj = (req as any).files || {};
      const roomImageFiles = filesObj['room_images'] || [];
      const design_style = req.body.design_style;
      const budget_level = req.body.budget_level || 'medium';
      const season = req.body.season || null;
      const api_key = req.body.api_key;

      // Validate required fields
      if (roomImageFiles.length === 0) {
        throw new ApiError(400, 'At least one room image is required', 'MISSING_IMAGES');
      }

      if (!design_style) {
        throw new ApiError(400, 'design_style is required', 'MISSING_DESIGN_STYLE');
      }

      if (!api_key) {
        throw new ApiError(400, 'api_key is required', 'MISSING_API_KEY');
      }

      // Encrypt API key
      const encryptedApiKey = encryptApiKey(api_key);

      // Convert room images to base64
      const roomImages = roomImageFiles.map((file: any) => ({
        image_base64: file.buffer.toString('base64'),
        image_mime: file.mimetype,
        image_name: file.originalname,
        design_style,
        budget_level,
        season
      }));

      // Calculate pricing (cost per image)
      const pricingConfig = workflow.config.pricing?.per_image || { cost_per_image: 0.01, revenue_per_image: 0.05 };
      const pricing = {
        cost_per_image: pricingConfig.cost_per_image,
        total_cost: roomImages.length * pricingConfig.cost_per_image,
        total_revenue: roomImages.length * pricingConfig.revenue_per_image,
        profit: (roomImages.length * pricingConfig.revenue_per_image) - (roomImages.length * pricingConfig.cost_per_image),
        image_count: roomImages.length
      };

      logger.info('💰 Room Redesigner pricing calculated:', pricing);

      // Prepare input data
      input_data = {
        room_images: roomImages,
        design_style,
        budget_level,
        season,
        api_key_encrypted: encryptedApiKey,
        pricing_details: pricing
      };

      updatedConfig = {
        ...workflow.config,
        pricing_details: pricing
      };
    } else {
      // Standard workflow: JSON input
      input_data = req.body.input_data;

      if (!input_data) {
        throw new ApiError(400, 'input_data is required', 'MISSING_INPUT_DATA');
      }
    }

    // Create execution record
    const executionId = uuidv4();
    const { data: execution, error: execError } = await admin
      .from('workflow_executions')
      .insert([{
        id: executionId,
        workflow_id: workflow_id,
        client_id: clientId,
        triggered_by_user_id: userId,
        status: 'pending',
        input_data,
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (execError) {
      throw new ApiError(500, 'Failed to create execution', 'EXECUTION_CREATION_FAILED');
    }

    // Add job to queue - NOW WITH userId
    try {
      await addWorkflowJob({
        executionId,
        workflowId: workflow_id,
        clientId,
        userId, // ADD THIS FIELD
        inputData: input_data,
        config: updatedConfig
      });

      logWorkflowExecution(executionId, workflow_id, clientId, 'queued');
    } catch (queueError) {
      // Update execution status to failed
      await admin
        .from('workflow_executions')
        .update({
          status: 'failed',
          error_message: 'Failed to queue job',
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      throw new ApiError(500, 'Failed to queue workflow execution', 'QUEUE_ERROR');
    }

    // Create audit log
    await admin.from('audit_logs').insert([{
      client_id: clientId,
      user_id: userId,
      action: 'workflow_executed',
      resource_type: 'workflow_execution',
      resource_id: executionId,
      changes: { workflow_id, status: 'pending' },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    res.status(202).json({
      success: true,
      data: {
        execution_id: executionId,
        status: 'pending',
        message: 'Workflow execution queued successfully'
      }
    });

  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to execute workflow: ${error.message}`, 'EXECUTION_ERROR');
  }
}

/**
 * GET /api/executions/:execution_id
 * Get execution status and results
 */
export async function getExecution(req: Request, res: Response): Promise<void> {
  const { execution_id } = req.params;
  const clientId = (req as any).client?.id;

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

  // Use a fresh admin client to avoid auth context issues
  const admin = getCleanAdmin();

  // Fetch execution with workflow name
  const { data: execution, error } = await admin
    .from('workflow_executions')
    .select(`
      *,
      workflow:workflows (
        name,
        config
      )
    `)
    .eq('id', execution_id)
    .eq('client_id', clientId)
    .single();

  if (error || !execution) {
    throw new ApiError(404, 'Execution not found', 'EXECUTION_NOT_FOUND');
  }

  // Calculate progress based on status
  let progress = 0;
  switch (execution.status) {
    case 'pending':
      progress = 10;
      break;
    case 'processing':
      progress = 50;
      break;
    case 'completed':
      progress = 100;
      break;
    case 'failed':
      progress = 0;
      break;
  }

  res.json({
    success: true,
    data: {
      id: execution.id,
      workflow_id: execution.workflow_id,
      workflow_name: execution.workflow?.name || 'Unknown Workflow',
      workflow_type: execution.workflow?.config?.workflow_type || 'standard',
      status: execution.status,
      progress,
      input_data: execution.input_data,
      output_data: execution.output_data,
      error_message: execution.error_message,
      started_at: execution.started_at,
      completed_at: execution.completed_at,
      duration_seconds: execution.duration_seconds,
      retry_count: execution.retry_count
    }
  });
}

/**
 * GET /api/workflows/:workflow_id/executions
 * Get execution history for a workflow
 */
export async function getWorkflowExecutions(req: Request, res: Response): Promise<void> {
  try {
    const { workflow_id } = req.params;
    const clientId = (req as any).client?.id;

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

    // Validate query parameters with Zod
    const validatedQuery = executionsQuerySchema.parse(req.query);
    const { limit, offset, status } = validatedQuery;

    // Use a fresh admin client to avoid auth context issues
    const admin = getCleanAdmin();

    // Check access via client_workflows junction table
    const { data: access, error: accessError } = await admin
      .from('client_workflows')
      .select('workflow_id')
      .eq('client_id', clientId)
      .eq('workflow_id', workflow_id)
      .eq('is_active', true)
      .maybeSingle();

    if (accessError) {
      logger.error('❌ Error checking workflow access:', accessError);
      throw new ApiError(500, 'Database error', 'DATABASE_ERROR');
    }

    if (!access) {
      logger.warn(`⚠️ No access found for client ${sanitizeForLog(clientId)} to workflow ${sanitizeForLog(workflow_id)}`);
      throw new ApiError(404, 'Workflow not found or access denied', 'WORKFLOW_NOT_FOUND');
    }

    // Build query with triggered_by user info
    let query = admin
      .from('workflow_executions')
      .select(`
        *,
        triggered_by:triggered_by_user_id (
          id,
          email
        )
      `, { count: 'exact' })
      .eq('workflow_id', workflow_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: executions, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'Failed to fetch executions', 'DATABASE_ERROR');
    }

    res.json({
      success: true,
      data: {
        executions,
        total: count,
        limit,
        offset
      }
    });

  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to fetch workflow executions: ${error.message}`, 'FETCH_ERROR');
  }
}

/**
 * GET /api/workflows/:workflow_id/stats
 * Get workflow statistics
 */
export async function getWorkflowStats(req: Request, res: Response): Promise<void> {
  const { workflow_id } = req.params;
  const clientId = (req as any).client?.id;

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

  // Check access via client_workflows junction table
  const { data: access, error: accessError } = await supabaseAdmin
    .from('client_workflows')
    .select('workflow_id')
    .eq('client_id', clientId)
    .eq('workflow_id', workflow_id)
    .eq('is_active', true)
    .maybeSingle();

  if (accessError) {
    logger.error('❌ Error checking workflow access:', accessError);
    throw new ApiError(500, 'Database error', 'DATABASE_ERROR');
  }

  if (!access) {
    logger.warn(`⚠️ No access found for client ${sanitizeForLog(clientId)} to workflow ${sanitizeForLog(workflow_id)}`);
    throw new ApiError(404, 'Workflow not found or access denied', 'WORKFLOW_NOT_FOUND');
  }

  // Fetch workflow (without client_id filter)
  const { data: workflow } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('id', workflow_id)
    .single();

  if (!workflow) {
    throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
  }

  // Get all executions
  const { data: allExecutions } = await supabaseAdmin
    .from('workflow_executions')
    .select('status, duration_seconds, created_at')
    .eq('workflow_id', workflow_id);

  // Get executions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthExecutions } = await supabaseAdmin
    .from('workflow_executions')
    .select('status')
    .eq('workflow_id', workflow_id)
    .gte('created_at', startOfMonth.toISOString());

  const totalExecutions = allExecutions?.length || 0;
  const successCount = allExecutions?.filter(e => e.status === 'completed').length || 0;
  const failedCount = allExecutions?.filter(e => e.status === 'failed').length || 0;
  const avgDuration = allExecutions?.length > 0
    ? allExecutions.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / allExecutions.length
    : 0;

  const monthlyExecutions = monthExecutions?.length || 0;
  const monthlyRevenue = monthlyExecutions * (workflow.revenue_per_execution || 0);

  res.json({
    success: true,
    data: {
      total_executions: totalExecutions,
      success_count: successCount,
      failed_count: failedCount,
      success_rate: totalExecutions > 0 ? ((successCount / totalExecutions) * 100).toFixed(2) : 0,
      avg_duration_seconds: Math.round(avgDuration),
      executions_this_month: monthlyExecutions,
      revenue_this_month: monthlyRevenue.toFixed(2)
    }
  });
}

/**
 * GET /api/executions/:execution_id/batch-results
 * Get batch results for an execution (for workflows like nano_banana)
 */
export async function getExecutionBatchResults(req: Request, res: Response): Promise<void> {
  const { execution_id } = req.params;

  // Check if client exists
  if (!(req as any).client) {
    logger.error('❌ getExecutionBatchResults: No client found', {
      execution_id,
      hasUser: !!(req as any).user,
      userId: (req as any).user?.id
    });
    throw new ApiError(403, 'No client account', 'NO_CLIENT_ACCOUNT');
  }

  const clientId = (req as any).client?.id;

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

  logger.info('🔍 getExecutionBatchResults: Starting', {
    execution_id,
    clientId,
    hasClient: !!(req as any).client,
    clientKeys: Object.keys((req as any).client || {})
  });

  // Use a fresh admin client to avoid auth context issues
  const admin = getCleanAdmin();

  // Verify execution belongs to client
  const { data: execution, error: execError } = await admin
    .from('workflow_executions')
    .select('id, workflow_id, client_id, status')
    .eq('id', execution_id)
    .maybeSingle();

  logger.info('🔍 getExecutionBatchResults: Execution lookup result', {
    execution_id,
    found: !!execution,
    executionData: execution,
    expectedClientId: clientId,
    actualClientId: execution?.client_id,
    clientIdMatch: execution?.client_id === clientId,
    execError: execError?.message,
    execErrorDetails: execError
  });

  if (execError) {
    logger.error('❌ getExecutionBatchResults: Query error', {
      execution_id,
      error: execError
    });
    throw new ApiError(500, 'Failed to query execution', 'QUERY_ERROR');
  }

  if (!execution) {
    throw new ApiError(404, 'Execution not found', 'EXECUTION_NOT_FOUND');
  }

  // Verify execution belongs to this client
  if (execution.client_id !== clientId) {
    logger.error('❌ getExecutionBatchResults: Client mismatch', {
      execution_id,
      executionClientId: execution.client_id,
      requestClientId: clientId
    });
    throw new ApiError(403, 'Access denied to this execution', 'EXECUTION_ACCESS_DENIED');
  }

  // Fetch batch results
  const { data: batchResults, error } = await admin
    .from('workflow_batch_results')
    .select('*')
    .eq('execution_id', execution_id)
    .order('batch_index', { ascending: true });

  logger.info('🔍 getExecutionBatchResults: Batch results lookup', {
    execution_id,
    count: batchResults?.length || 0,
    error: error?.message,
    errorDetails: error
  });

  if (error) {
    logger.error('❌ getExecutionBatchResults: Database error fetching batch results', {
      execution_id,
      error: error.message,
      errorDetails: error
    });
    throw new ApiError(500, 'Failed to fetch batch results', 'DATABASE_ERROR');
  }

  // Fetch stats using the database function
  const { data: stats, error: statsError } = await admin
    .rpc('get_batch_execution_stats', { p_execution_id: execution_id });

  logger.info('🔍 getExecutionBatchResults: Stats RPC call result', {
    execution_id,
    stats,
    statsError: statsError?.message,
    statsErrorDetails: statsError
  });

  if (statsError) {
    logger.error('❌ getExecutionBatchResults: RPC error fetching stats', {
      execution_id,
      error: statsError.message,
      errorDetails: statsError
    });
  }

  res.json({
    success: true,
    data: {
      execution_id,
      results: batchResults || [],
      stats: stats?.[0] || {
        total_prompts: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        processing: 0,
        total_cost: 0
      },
      total_results: batchResults?.length || 0
    }
  });
}

/**
 * GET /api/workflows/client/members
 * Get all members of the current client (for filtering executions by collaborator)
 */
export async function getClientMembers(req: Request, res: Response): Promise<void> {
  const clientId = (req as any).client?.id;

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

  const { data: members, error } = await supabaseAdmin
    .from('client_members')
    .select(`
      id,
      role,
      user:user_id (
        id,
        email
      )
    `)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('role', { ascending: true });

  if (error) {
    throw new ApiError(500, 'Failed to fetch client members', 'DATABASE_ERROR');
  }

  // Flatten the user data - Fix type inference
  const formattedMembers = (members || []).map(m => {
    // Type guard: m.user could be an array or object depending on Supabase query result
    const user = Array.isArray(m.user) ? m.user[0] : m.user;
    return {
      id: user?.id,
      email: user?.email,
      role: m.role
    };
  }).filter(m => m.id);

  res.json({
    success: true,
    data: {
      members: formattedMembers,
      total: formattedMembers.length
    }
  });
}

/**
 * GET /api/executions
 * Get all executions for the client with pagination
 */
export async function getAllClientExecutions(req: Request, res: Response): Promise<void> {
  try {
    const clientId = (req as any).client?.id;

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

    // Validate query parameters with Zod
    const validatedQuery = executionsQuerySchema.parse(req.query);
    const { limit, offset, status, workflow_id, user_id, fields, sortBy } = validatedQuery;

    logger.info('📡 getAllClientExecutions called:', {
      clientId,
      userId: (req as any).user?.id,
      filters: { limit, offset, status, workflow_id, user_id, fields, sortBy }
    });

    // Use a fresh admin client to avoid auth context issues
    const admin = getCleanAdmin();

    // Define allowed fields (whitelist for security)
    const ALLOWED_FIELDS = [
      'id', 'workflow_id', 'client_id', 'status', 'input_data', 'output_data',
      'error_message', 'started_at', 'completed_at', 'duration_seconds',
      'triggered_by_user_id', 'created_at', 'updated_at', 'retry_count'
    ];

    // Default lightweight fields for list view (excludes heavy input_data/output_data)
    const DEFAULT_LIST_FIELDS = [
      'id', 'status', 'workflow_id', 'created_at', 'duration_seconds',
      'triggered_by_user_id', 'error_message', 'started_at', 'completed_at', 'retry_count'
    ];

    // Parse requested fields or use defaults
    let selectFields = DEFAULT_LIST_FIELDS;
    if (fields) {
      const requestedFields = fields.split(',').map(f => f.trim());
      selectFields = requestedFields.filter(f => ALLOWED_FIELDS.includes(f));
      if (selectFields.length === 0) {
        selectFields = DEFAULT_LIST_FIELDS;
      }
    }

    const selectString = selectFields.join(', ');

    logger.debug('Field selection:', {
      requested: fields,
      selected: selectString,
      fieldCount: selectFields.length
    });

    // Calculate status counts (always on ALL client executions, unfiltered)
    const { data: allExecutions } = await admin
      .from('workflow_executions')
      .select('status')
      .eq('client_id', clientId);

    const statusCounts = {
      completed: allExecutions?.filter((e: any) => e.status === 'completed').length || 0,
      pending: allExecutions?.filter((e: any) => e.status === 'pending').length || 0,
      processing: allExecutions?.filter((e: any) => e.status === 'processing').length || 0,
      failed: allExecutions?.filter((e: any) => e.status === 'failed').length || 0,
    };

    logger.debug('Status counts calculated:', statusCounts);

    // Determine sort order based on sortBy parameter
    let orderBy: string;
    let ascending: boolean;

    switch (sortBy) {
      case 'oldest':
        orderBy = 'created_at';
        ascending = true;
        break;
      case 'duration':
        orderBy = 'duration_seconds';
        ascending = false; // Longest first
        break;
      case 'newest':
      default:
        orderBy = 'created_at';
        ascending = false;
        break;
    }

    // Fetch executions first
    let executionsQuery = admin
      .from('workflow_executions')
      .select(selectString, { count: 'exact' })
      .eq('client_id', clientId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    // Apply optional filters
    if (status && status !== 'all') {
      executionsQuery = executionsQuery.eq('status', status);
    }
    if (workflow_id && workflow_id !== 'all') {
      executionsQuery = executionsQuery.eq('workflow_id', workflow_id);
    }
    if (user_id && user_id !== 'all') {
      executionsQuery = executionsQuery.eq('triggered_by_user_id', user_id);
    }

    const { data: executions, error, count } = await executionsQuery;

    logger.info('📦 getAllClientExecutions: Query result:', {
      executionsCount: executions?.length || 0,
      totalCount: count,
      error: error?.message || null,
      firstExecution: executions?.[0] ? {
        id: (executions[0] as any).id,
        workflow_id: (executions[0] as any).workflow_id,
        client_id: (executions[0] as any).client_id
      } : null
    });

    if (error) {
      logger.error('❌ getAllClientExecutions: Database error:', { error });
      throw new ApiError(500, 'Failed to fetch executions', 'DATABASE_ERROR');
    }

    // Get unique workflow_ids and user_ids - Fix type inference
    const workflowIds = [...new Set(
      (executions || []).map(e => (e as any).workflow_id).filter(Boolean)
    )];
    const userIds = [...new Set(
      (executions || []).map(e => (e as any).triggered_by_user_id).filter(Boolean)
    )];

    // Fetch workflows in separate query (bypasses RLS issues)
    const { data: workflows } = await admin
      .from('workflows')
      .select('id, name, config')
      .in('id', workflowIds);

    // Fetch users in separate query
    const { data: users } = await admin
      .from('users')
      .select('id, email')
      .in('id', userIds);

    // Create lookup maps
    const workflowsMap: Record<string, any> = {};
    (workflows || []).forEach(w => {
      workflowsMap[w.id] = w;
    });

    const usersMap: Record<string, any> = {};
    (users || []).forEach(u => {
      usersMap[u.id] = u;
    });

    // Format executions with workflow info - Fix spread type error
    const formattedExecutions = (executions || []).map(exec => {
      const execAny = exec as any;
      const workflow = workflowsMap[execAny.workflow_id];
      const user = usersMap[execAny.triggered_by_user_id];

      return {
        ...execAny,
        workflow_name: workflow?.name || 'Unknown Workflow',
        workflow_type: workflow?.config?.workflow_type || 'standard',
        triggered_by_email: user?.email || null
      };
    });

    logger.info('✅ getAllClientExecutions: Sending response:', {
      executionsCount: formattedExecutions.length,
      total: count,
      hasMore: offset + formattedExecutions.length < count
    });

    res.json({
      success: true,
      data: {
        executions: formattedExecutions,
        total: count,
        statusCounts,
        limit,
        offset,
        hasMore: offset + formattedExecutions.length < count
      }
    });

  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to fetch client executions: ${error.message}`, 'FETCH_ERROR');
  }
}

/**
 * GET /api/workflows/stats/dashboard
 * Get aggregated stats for client dashboard
 */
export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const clientId = (req as any).client?.id;

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

  // Use a fresh admin client to avoid auth context issues
  const admin = getCleanAdmin();

  // 1. Get Active Workflows Count via client_workflows junction table
  const { data: accessList, error: workflowError } = await admin
    .from('client_workflows')
    .select('workflow:workflows!inner(status)')
    .eq('client_id', clientId)
    .eq('is_active', true);

  if (workflowError) {
    throw new ApiError(500, `Failed to fetch workflow stats: ${workflowError.message}`, 'DATABASE_ERROR');
  }

  // Fix type inference for array access
  const activeWorkflowsCount = (accessList || []).filter(a => {
    const workflow = Array.isArray(a.workflow) ? a.workflow[0] : a.workflow;
    return workflow?.status === 'deployed';
  }).length || 0;

  // 2. Get Total Executions Count
  const { count: totalExecutionsCount, error: executionError } = await admin
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  if (executionError) {
    throw new ApiError(500, `Failed to fetch execution stats: ${executionError.message}`, 'DATABASE_ERROR');
  }

  // 3. Calculate Success Rate
  const { count: successCount } = await admin
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'completed');

  const successRate = totalExecutionsCount > 0
    ? ((successCount / totalExecutionsCount) * 100).toFixed(1)
    : 0;

  // 4. Calculate Time Saved (Estimate: e.g., 5 mins per execution)
  // This is a placeholder logic, can be refined based on actual business logic
  const estimatedMinutesSavedPerExecution = 5;
  const totalMinutesSaved = (successCount || 0) * estimatedMinutesSavedPerExecution;
  const hoursSaved = Math.floor(totalMinutesSaved / 60);

  res.json({
    success: true,
    data: {
      active_workflows: activeWorkflowsCount || 0,
      total_executions: totalExecutionsCount || 0,
      success_rate: `${successRate}%`,
      time_saved: `${hoursSaved}h`
    }
  });
}

export {};
