#!/bin/bash

#####################################################################
# MASSTOCK VPS - Quick Fix for Deployment Issues
# Run this on the VPS to fix environment variables and n8n
#####################################################################

set -e

echo "🔧 Fixing MasStock deployment issues..."
echo ""

cd /opt/masstock

# 1. Create .env file at project root (docker-compose reads this)
echo "📝 Step 1/5: Creating .env file at project root..."
cat > .env << 'ENVEOF'
# Docker Compose Environment Variables
REDIS_PASSWORD=3a00YQekOSZ4BR6WT2UYwCU8JxB13QX6
N8N_USER=admin
N8N_PASSWORD=46RLgikr60WJNfJjtenTKLatyJCIP0ob
N8N_ENCRYPTION_KEY=e84a572af21138e0c301b4f079b1af8a1c0154c8e210813f38b75576cab42737
ENVEOF

echo "✅ .env created at project root"
echo ""

# 2. Check n8n logs to see why it's crashing
echo "📋 Step 2/5: Checking n8n logs (last 50 lines)..."
docker logs masstock_n8n --tail 50 || echo "⚠️  n8n container not found or stopped"
echo ""

# 3. Stop all containers
echo "🛑 Step 3/5: Stopping all containers..."
docker compose -f docker-compose.production.yml down
echo "✅ Containers stopped"
echo ""

# 4. Restart with new env vars
echo "🚀 Step 4/5: Starting containers with new configuration..."
docker compose -f docker-compose.production.yml up -d
echo "✅ Containers started"
echo ""

# 5. Wait and check status
echo "⏳ Step 5/5: Waiting 30s for containers to start..."
sleep 30

docker compose -f docker-compose.production.yml ps
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Fix complete!"
echo ""
echo "Next steps:"
echo "  1. Check if all containers are healthy (see above)"
echo "  2. If n8n still restarting, run: docker logs masstock_n8n"
echo "  3. Test API: curl https://api.masstock.fr/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
