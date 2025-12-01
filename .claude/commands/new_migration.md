Create a new database migration with proper structure and RLS policies.

**Arguments:** $ARGUMENTS (migration description in snake_case, e.g., "add_user_preferences_table")

## Steps:

1. **Generate Migration Name:**
   - Format: `YYYYMMDDHHMMSS_$ARGUMENTS.sql`
   - Example: `20251130120000_add_user_preferences_table.sql`
   - Path: `backend/database/migrations/`

2. **Migration Template:**
```sql
-- Migration: $ARGUMENTS
-- Created: [current date]
-- Description: [What this migration does]

-- Enable RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Create table (if creating new table)
CREATE TABLE IF NOT EXISTS [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  [other_columns],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_[table_name]_[column] ON [table_name]([column]);

-- Create RLS policies
CREATE POLICY "[table_name]_select_policy"
  ON [table_name] FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "[table_name]_insert_policy"
  ON [table_name] FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "[table_name]_update_policy"
  ON [table_name] FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "[table_name]_delete_policy"
  ON [table_name] FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE [table_name] IS '[Description]';
```

3. **Create Migration File:**
   - Use Write tool to create file at path
   - Fill in template with user's requirements

4. **Remind User:**
   - Review SQL before applying
   - Test migration locally first
   - Apply migration: `npm run migrate` OR `mcp__supabase__apply_migration`
   - Verify with: `mcp__supabase__list_tables`

Refer to: [.agent/SOP/add_migration.md](.agent/SOP/add_migration.md)
