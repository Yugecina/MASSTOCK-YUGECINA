# SOP: Workflows & Executions Architecture

**Last Updated:** 2025-11-28 ⚡ (Shared Workflows Architecture)

This document explains the Workflow and Execution system architecture in MasStock.

---

## Overview

MasStock uses a **Shared Workflows** pattern with junction table access control:

```
workflow_templates (global, admin-managed)
        │
        │ create shared workflow (first time)
        │ or reuse existing shared workflow
        ▼
    workflows (is_shared=true, client_id=NULL)
        │
        │ N:N via client_workflows junction
        ▼
    client_workflows (who has access)
        │
        │ 1:N per client
        ▼
workflow_executions (per client + user)
        │
        │ 1:N
        ▼
workflow_batch_results (per prompt)
```

**Key Concept:** Workflows are shared across multiple clients. Access is controlled via the `client_workflows` junction table. Executions remain per-client.

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

### 2. Workflows (Shared Instances) ⚡ NEW

**Table:** `workflows`

- **Definition:** Shared workflow instance created from a template, accessible by multiple clients
- **Purpose:** Provide consistent workflow experience across clients while maintaining per-client executions
- **Key Fields:**
  - `client_id`: **NULLABLE** (NULL for shared workflows, DEPRECATED for legacy)
  - `is_shared`: **NEW** - Boolean indicating if workflow is shared (true for all new workflows)
  - `template_id`: Reference to source template (for traceability)
  - `config` (JSONB): Shared configuration for all clients
  - `status`: 'draft', 'deployed', 'archived'

**Relationship:**
```
One Template → One Shared Workflow (created on first assignment)
One Workflow ↔ Many Clients (N:N via client_workflows junction)
```

**Access Control:** Client access is managed via the `client_workflows` junction table, not by `client_id`.

### 2.1. Client Workflows Junction Table ⭐ NEW

**Table:** `client_workflows`

- **Definition:** Links clients to workflows they have access to (N:N relationship)
- **Purpose:** Control which clients can see and execute which workflows
- **Key Fields:**
  - `client_id`: FK → clients (which client)
  - `workflow_id`: FK → workflows (which workflow)
  - `is_active`: Boolean to revoke access without deleting history
  - `assigned_at`: When access was granted
  - `assigned_by`: Which admin granted access
  - UNIQUE constraint on (client_id, workflow_id)

**Key Operations:**
- **Grant Access:** Insert into `client_workflows` with `is_active = true`
- **Revoke Access:** Update `is_active = false` (soft delete, preserves history)
- **Check Access:** Query where `client_id = X AND workflow_id = Y AND is_active = true`

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

### Assigning a Workflow to a Client ⚡ UPDATED

```
1. Admin navigates to Client Detail page
2. Clicks "Assign Workflow"
3. Selects template from dropdown
4. System checks if shared workflow exists for this template:
   a. IF EXISTS:
      - Reuse existing shared workflow
   b. IF NOT EXISTS:
      - Create NEW shared workflow:
        - client_id = NULL (shared)
        - is_shared = true
        - template_id = selected template
        - config = template.config
        - status = 'deployed'
5. Grant access via junction table:
   - INSERT INTO client_workflows (client_id, workflow_id, is_active=true)
   - Or UPDATE is_active=true if previously revoked
6. Client can now see and execute this workflow
```

**Key Difference:** No longer creates duplicate workflows. Reuses shared workflows and manages access via `client_workflows`.

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

### workflows ⚡ UPDATED

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | **NULLABLE** - DEPRECATED (NULL for shared workflows) |
| is_shared | BOOLEAN | **NEW** - True if workflow is shared across clients |
| template_id | UUID | FK → workflow_templates (nullable) |
| name | VARCHAR | Workflow name |
| config | JSONB | Shared configuration |
| status | VARCHAR | 'draft', 'deployed', 'archived' |

### client_workflows ⭐ NEW

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK → clients (NOT NULL) |
| workflow_id | UUID | FK → workflows (NOT NULL) |
| is_active | BOOLEAN | Access status (true = active, false = revoked) |
| assigned_at | TIMESTAMPTZ | When access was granted |
| assigned_by | UUID | FK → users (admin who granted access) |
| created_at | TIMESTAMPTZ | Record creation |
| updated_at | TIMESTAMPTZ | Last update |
| UNIQUE(client_id, workflow_id) | CONSTRAINT | Prevents duplicate access records |

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

## Visibility & Access Control ⚡ UPDATED

### RLS Policies

**Workflows Access (via client_workflows junction):**
```sql
-- Clients can only see workflows they have access to
CREATE POLICY "Users can view accessible workflows"
  ON workflows FOR SELECT
  USING (
    -- Admins see all
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR
    -- Members see workflows accessible to their clients
    id IN (
      SELECT cw.workflow_id FROM client_workflows cw
      JOIN client_members cm ON cm.client_id = cw.client_id
      WHERE cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cw.is_active = true
    )
  );
```

**Workflow Executions:**
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

## Best Practices ⚡ UPDATED

### When Creating Shared Workflows from Templates

**Always check if workflow already exists first:**

```javascript
// 1. Check for existing shared workflow
const { data: existingWorkflow } = await supabase
  .from('workflows')
  .select('id, name')
  .eq('template_id', template_id)
  .is('client_id', null)
  .eq('is_shared', true)
  .eq('status', 'deployed')
  .maybeSingle();

let workflowId;
if (!existingWorkflow) {
  // 2. Create NEW shared workflow (first time)
  const { data: newWorkflow } = await supabase
    .from('workflows')
    .insert([{
      client_id: null,      // ← SHARED workflow
      is_shared: true,      // ← Mark as shared
      template_id,          // ← REQUIRED for traceability
      name: workflowName,
      config: template.config,
      status: 'deployed'
    }])
    .select()
    .single();
  workflowId = newWorkflow.id;
} else {
  // 3. Reuse existing shared workflow
  workflowId = existingWorkflow.id;
}

// 4. Grant access via junction table
await supabase
  .from('client_workflows')
  .insert([{
    client_id,
    workflow_id: workflowId,
    assigned_by: adminUserId,
    is_active: true
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

## Common Queries ⚡ UPDATED

### Get Workflows Accessible by Client (via junction)

```sql
SELECT
  w.*,
  wt.name as template_name,
  wt.workflow_type,
  cw.assigned_at,
  cw.is_active
FROM workflows w
JOIN client_workflows cw ON cw.workflow_id = w.id
LEFT JOIN workflow_templates wt ON wt.id = w.template_id
WHERE cw.client_id = :client_id
  AND cw.is_active = true
ORDER BY cw.assigned_at DESC;
```

### Get All Clients with Access to Workflow

```sql
SELECT
  c.name as client_name,
  c.email as client_email,
  cw.assigned_at,
  cw.is_active,
  u.name as assigned_by_name
FROM client_workflows cw
JOIN clients c ON c.id = cw.client_id
LEFT JOIN users u ON u.id = cw.assigned_by
WHERE cw.workflow_id = :workflow_id
ORDER BY cw.assigned_at DESC;
```

### Get All Executions for a Client (with User Filter)

```sql
SELECT
  we.*,
  u.email as triggered_by_email,
  w.name as workflow_name
FROM workflow_executions we
LEFT JOIN users u ON u.id = we.triggered_by_user_id
LEFT JOIN workflows w ON w.id = we.workflow_id
WHERE we.client_id = :client_id
  AND (:user_id IS NULL OR we.triggered_by_user_id = :user_id)
ORDER BY we.created_at DESC;
```

### Check if Client has Access to Workflow

```sql
SELECT EXISTS (
  SELECT 1
  FROM client_workflows
  WHERE client_id = :client_id
    AND workflow_id = :workflow_id
    AND is_active = true
) as has_access;
```

---

## Related Documentation

- [Database Schema](../system/database_schema.md) - Full schema details
- [Project Architecture](../system/project_architecture.md) - System overview
- [Async Workers](../system/async_workers.md) - Worker processing details
- [Image Factory Workflow](../tasks/image_factory_workflow.md) - Nano Banana specifics
