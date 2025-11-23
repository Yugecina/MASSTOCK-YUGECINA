# SOP: Add Database Migration

**Last Updated:** 2025-11-23

## Overview

This guide explains how to create and apply database migrations in MasStock.

---

## Prerequisites

- Supabase project configured in `.env`
- Database credentials in `backend/.env`

---

## Steps

### 1. Create Migration File

Create a new SQL file in `supabase/migrations/` with timestamp naming:

```bash
cd supabase/migrations/
touch $(date +%Y%m%d%H%M%S)_description_of_change.sql
```

**Naming Convention:**
```
YYYYMMDDHHMMSS_description.sql
```

**Example:**
```
20251123120000_add_user_preferences_table.sql
```

---

### 2. Write Migration SQL

**Template Structure:**

```sql
-- Migration: Description of what this migration does
-- Created: YYYY-MM-DD

-- ============================================
-- 1. CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS table_name (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  column1 text NOT NULL,
  column2 integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_table_name_column1
  ON table_name(column1);

CREATE INDEX IF NOT EXISTS idx_table_name_created_at
  ON table_name(created_at DESC);

-- ============================================
-- 4. ADD FOREIGN KEYS (if applicable)
-- ============================================

ALTER TABLE table_name
  ADD CONSTRAINT fk_table_name_user_id
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Admin access
CREATE POLICY "Admins can access all records"
  ON table_name FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Client access
CREATE POLICY "Clients can view their own data"
  ON table_name FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- ============================================
-- 6. CREATE TRIGGERS (if applicable)
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON table_name TO authenticated;
GRANT ALL ON table_name TO service_role;

-- ============================================
-- 8. INSERT SEED DATA (optional, dev only)
-- ============================================

-- INSERT INTO table_name (column1, column2) VALUES
--   ('value1', 100),
--   ('value2', 200);
```

---

### 3. Common Migration Patterns

#### Add Column to Existing Table

```sql
-- Add new column
ALTER TABLE users
  ADD COLUMN phone_number text;

-- Add column with default
ALTER TABLE users
  ADD COLUMN is_verified boolean DEFAULT false;

-- Add NOT NULL column (requires default or UPDATE first)
ALTER TABLE users
  ADD COLUMN company_size text DEFAULT 'small';
```

#### Modify Column

```sql
-- Change data type
ALTER TABLE users
  ALTER COLUMN email TYPE varchar(255);

-- Add/remove NOT NULL
ALTER TABLE users
  ALTER COLUMN phone_number SET NOT NULL;

ALTER TABLE users
  ALTER COLUMN phone_number DROP NOT NULL;

-- Change default
ALTER TABLE users
  ALTER COLUMN status SET DEFAULT 'pending';
```

#### Add Index

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_executions_client_date
  ON workflow_executions(client_id, created_at DESC);

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Partial index
CREATE INDEX idx_active_users
  ON users(id) WHERE status = 'active';
```

#### Add Foreign Key

```sql
-- Add foreign key constraint
ALTER TABLE workflow_executions
  ADD CONSTRAINT fk_workflow_executions_workflow_id
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
  ON DELETE CASCADE;

-- Add foreign key with custom action
ALTER TABLE workflow_executions
  ADD CONSTRAINT fk_workflow_executions_client_id
  FOREIGN KEY (client_id) REFERENCES clients(id)
  ON DELETE RESTRICT;
```

---

### 4. Apply Migration Locally

**Option A: Using Supabase CLI**

```bash
supabase migration up
```

**Option B: Using psql**

```bash
cd backend
npm run migrate
```

**Option C: Manual (via Supabase Dashboard)**

1. Go to Supabase Dashboard → SQL Editor
2. Copy migration SQL
3. Execute

---

### 5. Verify Migration

**Check table exists:**

```sql
SELECT * FROM information_schema.tables
WHERE table_name = 'your_table_name';
```

**Check RLS is enabled:**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'your_table_name';
```

**Check policies:**

```sql
SELECT * FROM pg_policies
WHERE tablename = 'your_table_name';
```

**Check indexes:**

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'your_table_name';
```

---

### 6. Update Database Schema Documentation

After applying migration, update `.agent/system/database_schema.md`:

1. Add new table section with schema
2. Update ERD if relationships changed
3. Add example row
4. Document RLS policies
5. Add common queries if applicable

---

## Best Practices

### ✅ DO

- **Always enable RLS** on new tables
- **Create indexes** for foreign keys and frequently queried columns
- **Use timestamps** (created_at, updated_at) on all tables
- **Add comments** in migration SQL explaining why
- **Test locally** before applying to production
- **Make migrations idempotent** (use IF NOT EXISTS, IF EXISTS)
- **Use transactions** for multi-step migrations
- **Document breaking changes** in migration comments

### ❌ DON'T

- **Don't modify existing migrations** - create new ones instead
- **Don't drop columns with data** - deprecate first, drop later
- **Don't forget RLS policies** - security first
- **Don't use hard-coded UUIDs** in production migrations
- **Don't skip indexes** on foreign keys
- **Don't forget to update documentation**

---

## Rollback Strategy

### Manual Rollback

Create a separate rollback migration:

```sql
-- File: 20251123120001_rollback_add_user_preferences.sql

DROP TABLE IF EXISTS user_preferences;
```

### Automated Rollback (Supabase CLI)

```bash
supabase migration down
```

---

## Common Issues

### Issue: RLS Blocks Admin Access

**Symptom:** Admin users can't see data

**Solution:** Ensure admin policy exists:

```sql
CREATE POLICY "Admins can access all records"
  ON table_name FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### Issue: Foreign Key Constraint Violation

**Symptom:** Can't insert rows due to FK constraint

**Solution:** Ensure referenced table/row exists first:

```sql
-- Check if referenced row exists
SELECT id FROM workflows WHERE id = 'your-workflow-id';
```

### Issue: Index Already Exists

**Symptom:** Migration fails with "index already exists"

**Solution:** Use IF NOT EXISTS:

```sql
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);
```

---

## Example: Complete Migration

```sql
-- Migration: Add workflow_templates table
-- Created: 2025-11-23
-- Purpose: Allow admins to create reusable workflow templates

-- ============================================
-- 1. CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  workflow_id uuid NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. ENABLE RLS
-- ============================================

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workflow_templates_workflow_id
  ON workflow_templates(workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_created_by
  ON workflow_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_active
  ON workflow_templates(is_active);

-- ============================================
-- 4. FOREIGN KEYS
-- ============================================

ALTER TABLE workflow_templates
  ADD CONSTRAINT fk_workflow_templates_workflow_id
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
  ON DELETE CASCADE;

ALTER TABLE workflow_templates
  ADD CONSTRAINT fk_workflow_templates_created_by
  FOREIGN KEY (created_by) REFERENCES users(id)
  ON DELETE RESTRICT;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Admins can manage all templates
CREATE POLICY "Admins can manage all templates"
  ON workflow_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- All authenticated users can view active templates
CREATE POLICY "Users can view active templates"
  ON workflow_templates FOR SELECT
  USING (is_active = true);

-- ============================================
-- 6. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. GRANTS
-- ============================================

GRANT SELECT ON workflow_templates TO authenticated;
GRANT ALL ON workflow_templates TO service_role;
```

---

## Related Documentation

- **[database_schema.md](../system/database_schema.md)** - Complete database schema
- **[project_architecture.md](../system/project_architecture.md)** - System architecture
- **[../../CLAUDE.md](../../CLAUDE.md)** - Development guide
