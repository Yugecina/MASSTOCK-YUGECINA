#!/bin/bash

# ============================================================================
# Script to run migrations on Supabase PostgreSQL database
# ============================================================================
#
# Usage:
#   bash run-migration.sh
#   OR
#   bash run-migration.sh 004_auth_sync_trigger.sql
#
# This script connects to your Supabase database and runs migrations.
#
# REQUIRED ENVIRONMENT VARIABLES:
#   - SUPABASE_URL: Your Supabase project URL
#   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
#
# ============================================================================

set -e

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
  exit 1
fi

# Extract database URL from SUPABASE_URL
SUPABASE_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|/.*||')
DATABASE_URL="postgresql://postgres:[YOUR_POSTGRES_PASSWORD]@${SUPABASE_HOST}:5432/postgres"

# Alternatively, use psql to connect to Supabase
# For this, you need to use the database connection string

MIGRATION_FILE="${1:-migrations/004_auth_sync_trigger.sql}"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "🔄 Running migration: $MIGRATION_FILE"
echo "📍 Target: Supabase Database"
echo ""

# Option 1: Use psql if available (requires psql CLI installed)
# psql "$DATABASE_URL" -f "$MIGRATION_FILE"

# Option 2: Use Supabase CLI (recommended)
# This requires supabase CLI installed: npm install -g supabase
supabase db push

# Option 3: Manual SQL via API (for Bash environments without psql)
# curl -X POST \
#   "${SUPABASE_URL}/rest/v1/query" \
#   -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
#   -H "Content-Type: application/json" \
#   -d "$(cat "$MIGRATION_FILE")"

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Supabase Dashboard → SQL Editor"
echo "2. Create a new query"
echo "3. Copy the contents of $MIGRATION_FILE"
echo "4. Run the query"
echo "5. Verify in Table Editor that triggers were created"
