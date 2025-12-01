Debug workflow execution issues (Nano Banana or other workflows).

**Arguments:** $ARGUMENTS (execution ID or workflow name)

## Investigation Steps

### 1. Get Execution Details

If execution ID provided:
```bash
# Use Supabase MCP to query execution
mcp__supabase__execute_sql with query:
SELECT * FROM executions WHERE id = '$ARGUMENTS';
```

If workflow name provided:
```bash
# Find workflow first
mcp__supabase__execute_sql with query:
SELECT * FROM workflows WHERE name ILIKE '%$ARGUMENTS%';
```

### 2. Check Execution Status & Logs

Retrieve execution data:
- `status` - pending, in_progress, completed, failed, timeout
- `error_message` - Error details if failed
- `started_at` - When execution started
- `completed_at` - When execution finished/failed
- `results` - Output data (if completed)

### 3. Check Worker Logs

```bash
# Check backend logs for worker errors
tail -100 backend/logs/combined.log | grep -A 10 "workflow-worker"

# Or use Supabase logs
mcp__supabase__get_logs with service: "api"
```

### 4. Check Redis Queue

```bash
# Check if job is stuck in queue
redis-cli LLEN bull:workflow-queue:wait
redis-cli LLEN bull:workflow-queue:active
redis-cli LLEN bull:workflow-queue:failed

# View failed jobs
redis-cli LRANGE bull:workflow-queue:failed 0 -1
```

### 5. Common Issues & Solutions

**Issue: Execution stuck in "pending"**
- Worker not running
- Solution: `npm run worker` in backend/

**Issue: Execution timeout**
- Default timeout: 600s (10 minutes)
- Check worker timeout config
- Check Gemini API timeout
- Solution: Increase timeout in queue config or optimize workflow

**Issue: Execution failed with "rate limit"**
- Gemini API rate limit hit
- Solution: Check rate limiter config in `async_workers.md`
- Adjust `GEMINI_API_RATE_LIMIT_PER_MINUTE`

**Issue: Execution failed with "invalid API key"**
- GEMINI_API_KEY not set or invalid
- Solution: Check backend/.env for GEMINI_API_KEY

**Issue: No results returned**
- Check `results` field in execution
- Check if worker completed successfully
- Check Gemini API response logs

**Issue: Images not generated**
- Check Gemini API quota
- Check image format in config
- Check prompt validation

### 6. Test Workflow Manually

```bash
# Test Nano Banana workflow
node backend/scripts/test-nano-workflow.js

# Verify workflow exists and is accessible
node backend/scripts/verify-nano-banana.js
```

### 7. Check Workflow Configuration

Query workflow config:
```sql
SELECT id, name, config, type FROM workflows WHERE id = '[workflow_id]';
```

Validate config structure:
- `model` - Should be valid Gemini model (e.g., 'imagen-3.0-generate-001')
- `params` - Image generation parameters
- `timeout` - Execution timeout in seconds

### 8. Debugging Checklist

- [ ] Execution record exists in database
- [ ] Worker is running (`ps aux | grep workflow-worker`)
- [ ] Redis is running (`redis-cli ping`)
- [ ] GEMINI_API_KEY is set in backend/.env
- [ ] Workflow config is valid JSON
- [ ] User has permission to access workflow
- [ ] No rate limit errors in logs
- [ ] No timeout errors in logs
- [ ] Job exists in Redis queue

### 9. Report Format

**Execution Summary:**
- Execution ID: [id]
- Workflow: [name]
- Status: [status]
- Created: [created_at]
- Duration: [calculated from timestamps]

**Issue Identified:**
- [Specific issue found]

**Root Cause:**
- [Why it happened]

**Solution:**
- [How to fix it]

**Logs/Evidence:**
```
[Relevant log entries or query results]
```

Refer to:
- [.agent/tasks/image_factory_workflow.md](.agent/tasks/image_factory_workflow.md) - Nano Banana details
- [.agent/system/async_workers.md](.agent/system/async_workers.md) - Worker architecture
- [.agent/SOP/workflows_executions.md](.agent/SOP/workflows_executions.md) - Workflow system
