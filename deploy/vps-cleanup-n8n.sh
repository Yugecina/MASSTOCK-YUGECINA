#!/bin/bash

#####################################################################
# MASSTOCK VPS - Clean Removal of n8n
# Removes n8n container, volume, and environment variables
#####################################################################

set -e

echo "🧹 MasStock n8n Cleanup Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /opt/masstock

# Step 1: Stop and remove n8n container
echo "🛑 STEP 1/5: Stopping and removing n8n container..."
if docker ps -a --format '{{.Names}}' | grep -q '^masstock_n8n$'; then
    docker stop masstock_n8n || true
    docker rm masstock_n8n || true
    echo "✅ n8n container removed"
else
    echo "ℹ️  n8n container not found (already removed)"
fi
echo ""

# Step 2: Remove n8n volume
echo "🗑️  STEP 2/5: Removing n8n data volume..."
if docker volume ls --format '{{.Name}}' | grep -q '^masstock_n8n_data$' || docker volume ls --format '{{.Name}}' | grep -q '^n8n_data$'; then
    docker volume rm masstock_n8n_data 2>/dev/null || true
    docker volume rm n8n_data 2>/dev/null || true
    echo "✅ n8n volume removed"
else
    echo "ℹ️  n8n volume not found (already removed)"
fi
echo ""

# Step 3: Clean environment variables from .env
echo "📝 STEP 3/5: Removing n8n variables from .env files..."

# Clean root .env
if [ -f .env ]; then
    sed -i.backup '/^N8N_/d' .env
    echo "✅ Cleaned .env"
else
    echo "ℹ️  .env not found"
fi

# Clean backend/.env.production
if [ -f backend/.env.production ]; then
    # Create backup
    cp backend/.env.production backend/.env.production.backup

    # Remove N8N_ variables and their comment section
    sed -i '/^# n8n Configuration$/,/^N8N_ENCRYPTION_KEY=/d' backend/.env.production

    echo "✅ Cleaned backend/.env.production"
    echo "   Backup saved: backend/.env.production.backup"
else
    echo "ℹ️  backend/.env.production not found"
fi
echo ""

# Step 4: Restart containers (n8n will be excluded automatically)
echo "🔄 STEP 4/5: Restarting remaining containers..."
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
echo "✅ Containers restarted without n8n"
echo ""

# Step 5: Verify cleanup
echo "⏳ STEP 5/5: Waiting 15s for containers to stabilize..."
sleep 15
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Final Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f docker-compose.production.yml ps
echo ""

echo "🔍 Verifying n8n removal..."
if docker ps -a --format '{{.Names}}' | grep -q '^masstock_n8n$'; then
    echo "⚠️  WARNING: n8n container still exists!"
else
    echo "✅ n8n container: REMOVED"
fi

if docker volume ls --format '{{.Name}}' | grep -q 'n8n'; then
    echo "⚠️  WARNING: n8n volume still exists!"
else
    echo "✅ n8n volume: REMOVED"
fi

if grep -q '^N8N_' .env 2>/dev/null || grep -q '^N8N_' backend/.env.production 2>/dev/null; then
    echo "⚠️  WARNING: N8N_ variables still in .env files!"
else
    echo "✅ n8n env vars: REMOVED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 n8n Cleanup Complete!"
echo ""
echo "✅ What was removed:"
echo "   1. n8n Docker container (masstock_n8n)"
echo "   2. n8n data volume (n8n_data)"
echo "   3. n8n environment variables (N8N_*)"
echo ""
echo "📦 Backups created:"
echo "   - .env.backup (if .env existed)"
echo "   - backend/.env.production.backup"
echo ""
echo "🚀 Running services:"
echo "   - masstock_redis"
echo "   - masstock_api"
echo "   - masstock_worker"
echo "   - masstock_app (frontend)"
echo "   - masstock_vitrine (landing page)"
echo ""
echo "🌐 Active domains:"
echo "   - https://app.masstock.fr (application)"
echo "   - https://api.masstock.fr (API)"
echo "   - https://masstock.fr (landing page)"
echo "   - https://n8n.masstock.fr (nginx config still present, but no backend)"
echo ""
echo "⚠️  NOTE: VPS nginx still has n8n.masstock.fr config."
echo "   If you want to remove it completely, edit:"
echo "   /etc/nginx/sites-available/masstock.conf"
echo "   And remove the n8n.masstock.fr server block."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
