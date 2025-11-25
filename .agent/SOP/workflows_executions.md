# SOP: Workflows & Executions Architecture

**Last Updated:** 2025-11-25

This document explains the Workflow and Execution system architecture in MasStock.

---

## Overview

MasStock uses a **Template Instantiation** pattern for workflows:

```
workflow_templates (global, admin-managed)
        │
        │ clone/assign
        ▼
    workflows (client-specific instances)
        │
        │ 1:N
        ▼
workflow_executions (per client + user)
        │
        │ 1:N
        ▼
workflow_batch_results (per prompt)
```

---

## Key Concepts

### 1. Workflow Templates (Admin)

**Table:** `workflow_templates`

- **Definition:** Predefined workflow configurations created by admins
- **Purpose:** Serve as "blueprints" that can be assigned to multiple clients
- **Examples:** "Image Factory - Flash", "Image Factory - Pro"
- **Key Fields:**
  - `name`, `description`, `workflow_type`
  - `config` (JSONB): Models, pricing, limits, aspect ratios
  - `is_active`: Whether available for assignment

**Admin Actions:**
- Create new templates
- Update template configurations
- Activate/deactivate templates

### 2. Workflows (Client Instances)

**Table:** `workflows`

- **Definition:** Client-specific workflow instance created from a template
- **Purpose:** Allow per-client customization (API keys, settings)
- **Key Fields:**
  - `client_id`: The owning client
  - `template_id`: Reference to source template (for traceability)
  - `config` (JSONB): May be customized per client
  - `status`: 'draft', 'deployed', 'archived'

**Relationship:**
```
One Template → Many Workflows (one per client assignment)
One Client → Many Workflows
```

### 3. Workflow Executions

**Table:** `workflow_executions`

- **Definition:** A single run of a workflow
- **Key Fields:**
  - `workflow_id`: Which workflow was run
  - `client_id`: Which client owns this execution
  - `triggered_by_user_id`: Which user (collaborator) triggered it
  - `status`: 'pending' → 'processing' → 'completed' / 'failed'
  - `input_data` (JSONB): Prompts, reference images, model, etc.
  - `output_data` (JSONB): Results summary

**Visibility Rules:**
- **Client view:** Only sees executions where `client_id` = their client
- **Collaborator filter:** Can filter by `triggered_by_user_id`
- **Admin view:** Sees all executions across all clients

### 4. Batch Results

**Table:** `workflow_batch_results`

- **Definition:** Individual result for each prompt in an execution
- **Key Fields:**
  - `execution_id`: Parent execution
  - `batch_index`: Position in batch (0, 1, 2, ...)
  - `prompt_text`: The prompt processed
  - `result_url`: Public URL to generated image
  - `status`: 'pending', 'processing', 'completed', 'failed'

---

## Data Flow

### Assigning a Workflow to a Client

```
1. Admin navigates to Client Detail page
2. Clicks "Assign Workflow"
3. Selects template from dropdown
4. System creates NEW workflow record:
   - client_id = selected client
   - template_id = selected template
   - config = template.config (cloned)
   - status = 'deployed'
5. Client can now see and execute this workflow
```

**Code Location:** `adminClientController.js:assignWorkflowToClient()`

### Executing a Workflow

```
1. Client fills execution form (prompts, API key, model, etc.)
2. POST /api/v1/workflows/:workflow_id/execute
3. Backend validates inputs
4. Creates execution record:
   - client_id = client's ID
   - triggered_by_user_id = req.user.id  ← WHO triggered it
   - status = 'pending'
   - input_data = { prompts, model, aspect_ratio, ... }
5. Job added to Bull queue
6. Returns 202 Accepted with execution_id
7. Worker processes job:
   - For each prompt → call Gemini API
   - Store result in workflow_batch_results
   - Update execution status to 'completed'
8. Client polls for status and retrieves results
```

**Code Location:** `workflowsController.js:executeWorkflow()`

---

## Database Schema

### workflow_templates

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Template name |
| description | TEXT | Description |
| workflow_type | VARCHAR | Type identifier (e.g., 'nano_banana') |
| config | JSONB | Full configuration |
| cost_per_execution | DECIMAL | Cost per run |
| revenue_per_execution | DECIMAL | Revenue per run |
| is_active | BOOLEAN | Available for assignment |
| display_order | INTEGER | UI ordering |
| icon | VARCHAR | Icon name |

### workflows

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK → clients |
| template_id | UUID | FK → workflow_templates (nullable) |
| name | VARCHAR | Workflow name |
| config | JSONB | Configuration (may differ from template) |
| status | VARCHAR | 'draft', 'deployed', 'archived' |

### workflow_executions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workflow_id | UUID | FK → workflows |
| client_id | UUID | FK → clients |
| triggered_by_user_id | UUID | FK → users (who ran it) |
| status | VARCHAR | 'pending', 'processing', 'completed', 'failed' |
| input_data | JSONB | Prompts, images, model, etc. |
| output_data | JSONB | Results summary |
| started_at | TIMESTAMPTZ | When started |
| completed_at | TIMESTAMPTZ | When finished |
| duration_seconds | INTEGER | Total duration |

---

## Visibility & Access Control

### RLS Policies

```sql
-- Clients can only see their own executions
CREATE POLICY "Users can view their client executions"
  ON workflow_executions FOR SELECT
  USING (
    -- Admins see all
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR
    -- Members see their client's executions
    client_id IN (
      SELECT cm.client_id FROM client_members cm
      WHERE cm.user_id = auth.uid() AND cm.status = 'active'
    )
  );
```

### Filter by Collaborator

```javascript
// In adminClientController.getClientExecutions()
if (triggered_by) {
  query = query.eq('triggered_by_user_id', triggered_by);
}
```

---

## Best Practices

### When Creating Workflows from Templates

Always store the `template_id`:

```javascript
const { data: workflow } = await supabase
  .from('workflows')
  .insert([{
    client_id,
    template_id,  // ← REQUIRED for traceability
    name: workflowName,
    config: template.config,
    status: 'deployed'
  }]);
```

### When Creating Executions

Always store the `triggered_by_user_id`:

```javascript
const { data: execution } = await supabase
  .from('workflow_executions')
  .insert([{
    workflow_id,
    client_id,
    triggered_by_user_id: req.user.id,  // ← REQUIRED for filtering
    status: 'pending',
    input_data
  }]);
```

### Flexible Input/Output

Use JSONB for flexibility:

```javascript
// Different workflows can have different input structures
input_data = {
  prompts: [...],           // Nano Banana
  reference_images: [...],  // Nano Banana
  model: 'gemini-2.5-flash-image',
  // ... any workflow-specific fields
};
```

---

## Common Queries

### Get All Executions for a Client (with User Filter)

```sql
SELECT
  we.*,
  u.email as triggered_by_email
FROM workflow_executions we
LEFT JOIN users u ON u.id = we.triggered_by_user_id
WHERE we.client_id = :client_id
  AND (:user_id IS NULL OR we.triggered_by_user_id = :user_id)
ORDER BY we.created_at DESC;
```

### Get Workflow with Template Info

```sql
SELECT
  w.*,
  wt.name as template_name,
  wt.workflow_type
FROM workflows w
LEFT JOIN workflow_templates wt ON wt.id = w.template_id
WHERE w.client_id = :client_id;
```

---

## Related Documentation

- [Database Schema](../system/database_schema.md) - Full schema details
- [Project Architecture](../system/project_architecture.md) - System overview
- [Async Workers](../system/async_workers.md) - Worker processing details
- [Image Factory Workflow](../tasks/image_factory_workflow.md) - Nano Banana specifics
