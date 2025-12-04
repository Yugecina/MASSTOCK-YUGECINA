#!/bin/bash

#####################################################################
# MASSTOCK - Generate Missing Environment Variables
# Creates secure credentials for production deployment
#####################################################################

set -e

echo "🔐 Generating missing environment variables..."
echo ""

# Generate secure passwords and keys
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
N8N_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)

echo "✅ Generated secure credentials"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 ADD THESE TO backend/.env.production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# Redis Configuration"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Copy the variables above"
echo "   2. SSH to VPS: ssh root@<vps-ip>"
echo "   3. Edit: nano /opt/masstock/backend/.env.production"
echo "   4. Paste the variables at the end of the file"
echo "   5. Save (Ctrl+O, Enter, Ctrl+X)"
echo "   6. Rebuild: cd /opt/masstock && ./deploy/build-and-start.sh --rebuild"
echo ""
