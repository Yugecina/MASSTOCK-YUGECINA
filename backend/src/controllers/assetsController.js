const { supabaseAdmin, getCleanAdmin } = require('../config/database');
const { logger } = require('../config/logger');
const { z } = require('zod');

// Zod validation schema
const getAssetsSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  asset_type: z.enum(['all', 'image', 'video', 'lipsync', 'upscaled']).default('all'),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  load_all: z.coerce.boolean().default(false)
});

/**
 * Get all assets for the authenticated client with cursor-based pagination
 *
 * @route GET /api/v1/assets
 * @query {string} cursor - UUID of last item for pagination
 * @query {number} limit - Items per page (1-100, default 50)
 * @query {string} asset_type - Filter by type: 'all', 'image', 'video', etc.
 * @query {string} sort - Sort order: 'newest' or 'oldest'
 */
async function getAssets(req, res) {
  try {
    // 1. Validate query parameters
    const validatedQuery = getAssetsSchema.parse(req.query);
    const { cursor, limit, asset_type, sort, load_all } = validatedQuery;

    const clientId = req.client.id;

    logger.info('📡 getAssets called:', {
      clientId,
      userId: req.user?.id,
      filters: { cursor, limit, asset_type, sort, load_all }
    });

    // 2. Use clean admin client
    const admin = getCleanAdmin();

    // 3. Build query for assets with joined execution data
    // Calculate effective limit: if load_all=true, use 1000, otherwise use limit + 1 for pagination
    const effectiveLimit = load_all ? 1000 : limit + 1;

    let assetsQuery = admin
      .from('workflow_batch_results')
      .select(`
        id,
        execution_id,
        batch_index,
        prompt_text,
        status,
        result_url,
        result_storage_path,
        asset_type,
        processing_time_ms,
        api_cost,
        created_at,
        completed_at,
        workflow_executions!inner(
          id,
          workflow_id,
          client_id,
          status,
          created_at
        )
      `)
      .eq('workflow_executions.client_id', clientId)
      .eq('status', 'completed') // Only show completed assets
      .order('created_at', { ascending: sort === 'oldest' })
      .order('batch_index', { ascending: true }) // Group by execution with batch order
      .limit(effectiveLimit);

    // 4. Apply asset_type filter
    if (asset_type !== 'all') {
      assetsQuery = assetsQuery.eq('asset_type', asset_type);
    }

    // 5. Apply cursor pagination
    if (cursor) {
      // Get the created_at timestamp of the cursor item
      const { data: cursorItem, error: cursorError } = await admin
        .from('workflow_batch_results')
        .select('created_at')
        .eq('id', cursor)
        .single();

      if (cursorError) {
        logger.warn('❌ Invalid cursor provided:', { cursor, error: cursorError.message });
        return res.status(400).json({
          success: false,
          error: 'Invalid cursor',
          code: 'INVALID_CURSOR'
        });
      }

      // Continue from cursor position
      if (sort === 'newest') {
        assetsQuery = assetsQuery.lt('created_at', cursorItem.created_at);
      } else {
        assetsQuery = assetsQuery.gt('created_at', cursorItem.created_at);
      }
    }

    // 6. Execute query
    const { data: assets, error } = await assetsQuery;

    if (error) {
      logger.error('❌ getAssets: Database error:', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch assets',
        code: 'DATABASE_ERROR'
      });
    }

    logger.info('📦 getAssets: Query result:', {
      assetsCount: assets?.length || 0,
      loadAll: load_all,
      hasExtra: !load_all && assets?.length > limit
    });

    // 7. Check if there are more results (only if not load_all mode)
    let hasMore = false;
    let items = assets;
    let nextCursor = null;

    if (load_all) {
      // Load all mode: return all results, no pagination
      hasMore = false;
      items = assets;
      nextCursor = null;
    } else {
      // Pagination mode: check if there's a next page
      hasMore = assets.length > limit;
      items = hasMore ? assets.slice(0, limit) : assets;
      nextCursor = hasMore ? items[items.length - 1].id : null;
    }

    // 8. Get unique workflow IDs for fetching names
    const executionIds = [...new Set(items.map(a => a.workflow_executions.id))];
    const workflowIds = [...new Set(items.map(a => a.workflow_executions.workflow_id))];

    // 9. Fetch workflow names in parallel
    const { data: workflows } = await admin
      .from('workflows')
      .select('id, name')
      .in('id', workflowIds);

    // 10. Create workflow lookup map
    const workflowsMap = {};
    (workflows || []).forEach(w => {
      workflowsMap[w.id] = w;
    });

    // 11. Format assets with workflow names
    const formattedAssets = items.map(asset => {
      const workflow = workflowsMap[asset.workflow_executions.workflow_id];

      return {
        id: asset.id,
        execution_id: asset.execution_id,
        batch_index: asset.batch_index,
        prompt_text: asset.prompt_text,
        status: asset.status,
        result_url: asset.result_url,
        result_storage_path: asset.result_storage_path,
        asset_type: asset.asset_type,
        processing_time_ms: asset.processing_time_ms,
        api_cost: asset.api_cost,
        created_at: asset.created_at,
        completed_at: asset.completed_at,
        workflow_name: workflow?.name || 'Unknown Workflow',
        execution_status: asset.workflow_executions.status,
        execution_created_at: asset.workflow_executions.created_at
      };
    });

    // 12. Get stats (total count and by type) - separate query for performance
    const statsPromises = [
      // Total count - WITH JOIN to filter by client_id
      admin
        .from('workflow_batch_results')
        .select('id, workflow_executions!inner(client_id)', { count: 'exact', head: true })
        .eq('workflow_executions.client_id', clientId)
        .eq('status', 'completed'),

      // Count by type - WITH JOIN to filter by client_id
      admin
        .from('workflow_batch_results')
        .select('asset_type, workflow_executions!inner(client_id)')
        .eq('workflow_executions.client_id', clientId)
        .eq('status', 'completed')
    ];

    const [totalResult, typeCountsResult] = await Promise.all(statsPromises);

    const stats = {
      total: totalResult.count || 0,
      by_type: {
        image: 0,
        video: 0,
        lipsync: 0,
        upscaled: 0
      }
    };

    // Aggregate counts by type
    if (typeCountsResult.data) {
      const typeCounts = {};
      typeCountsResult.data.forEach(item => {
        typeCounts[item.asset_type] = (typeCounts[item.asset_type] || 0) + 1;
      });

      stats.by_type = {
        image: typeCounts.image || 0,
        video: typeCounts.video || 0,
        lipsync: typeCounts.lipsync || 0,
        upscaled: typeCounts.upscaled || 0
      };
    }

    // 13. Send response
    logger.info('✅ getAssets: Sending response:', {
      assetsCount: formattedAssets.length,
      hasMore,
      nextCursor,
      stats
    });

    res.json({
      success: true,
      data: {
        assets: formattedAssets,
        pagination: {
          next_cursor: nextCursor,
          has_more: hasMore,
          limit
        },
        stats
      }
    });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.warn('⚠️ getAssets: Validation error:', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Log unexpected errors
    logger.error('❌ getAssets: Unexpected error:', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

module.exports = {
  getAssets
};
