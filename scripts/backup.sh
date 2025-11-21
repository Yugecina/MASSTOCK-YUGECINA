#!/bin/bash

# Backup Script
# Creates backups of configuration files and Redis data

set -e

# Configuration
DEPLOY_PATH="/opt/masstock"
BACKUP_ROOT="${DEPLOY_PATH}/backups"
BACKUP_DIR="${BACKUP_ROOT}/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=30
LOG_FILE="/var/log/masstock-backup.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

echo -e "${BLUE}📦 MasStock Backup${NC}"
echo "=================="
echo ""

log "Starting backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✅ Created backup directory: $BACKUP_DIR${NC}"
log "Backup directory created: $BACKUP_DIR"

# 1. Backup Environment Files
echo ""
echo "📋 Backing up environment files..."
if [ -f "${DEPLOY_PATH}/backend/.env.production" ]; then
  cp "${DEPLOY_PATH}/backend/.env.production" "${BACKUP_DIR}/backend.env"
  echo -e "${GREEN}✅ Backed up backend .env.production${NC}"
  log "Backed up backend .env.production"
fi

if [ -f "${DEPLOY_PATH}/frontend/.env.production" ]; then
  cp "${DEPLOY_PATH}/frontend/.env.production" "${BACKUP_DIR}/frontend.env"
  echo -e "${GREEN}✅ Backed up frontend .env.production${NC}"
  log "Backed up frontend .env.production"
fi

# 2. Backup Docker Compose Configuration
echo ""
echo "🐳 Backing up Docker configuration..."
if [ -f "${DEPLOY_PATH}/docker-compose.production.yml" ]; then
  cp "${DEPLOY_PATH}/docker-compose.production.yml" "${BACKUP_DIR}/"
  echo -e "${GREEN}✅ Backed up docker-compose.production.yml${NC}"
  log "Backed up docker-compose.production.yml"
fi

# 3. Backup Nginx Configuration
echo ""
echo "🌐 Backing up Nginx configuration..."
if [ -d "${DEPLOY_PATH}/nginx" ]; then
  tar -czf "${BACKUP_DIR}/nginx-config.tar.gz" -C "${DEPLOY_PATH}" nginx/
  echo -e "${GREEN}✅ Backed up Nginx configuration${NC}"
  log "Backed up Nginx configuration"
fi

# 4. Backup Redis Data (if using RDB)
echo ""
echo "💾 Backing up Redis data..."
cd "$DEPLOY_PATH"
if docker-compose -f docker-compose.production.yml exec -T redis redis-cli SAVE > /dev/null 2>&1; then
  # Copy RDB dump from container
  REDIS_CONTAINER=$(docker-compose -f docker-compose.production.yml ps -q redis)
  if [ -n "$REDIS_CONTAINER" ]; then
    docker cp "$REDIS_CONTAINER:/data/dump.rdb" "${BACKUP_DIR}/redis-dump.rdb" 2>/dev/null || true
    echo -e "${GREEN}✅ Backed up Redis data${NC}"
    log "Backed up Redis data"
  fi
else
  echo -e "${YELLOW}⚠️  Redis backup skipped (service not available)${NC}"
  log "WARNING: Redis backup skipped"
fi

# 5. Backup SSL Certificates
echo ""
echo "🔐 Backing up SSL certificates..."
if [ -d "${DEPLOY_PATH}/nginx/ssl" ]; then
  tar -czf "${BACKUP_DIR}/ssl-certs.tar.gz" -C "${DEPLOY_PATH}" nginx/ssl/
  echo -e "${GREEN}✅ Backed up SSL certificates${NC}"
  log "Backed up SSL certificates"
fi

# 6. Create backup manifest
echo ""
echo "📝 Creating backup manifest..."
cat > "${BACKUP_DIR}/MANIFEST.txt" << EOF
MasStock Backup Manifest
========================
Date: $(date '+%Y-%m-%d %H:%M:%S')
Hostname: $(hostname)
Backup Directory: $BACKUP_DIR

Files Backed Up:
EOF

ls -lh "$BACKUP_DIR" >> "${BACKUP_DIR}/MANIFEST.txt"

echo -e "${GREEN}✅ Created backup manifest${NC}"

# 7. Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo -e "${BLUE}📊 Backup size: $BACKUP_SIZE${NC}"
log "Backup completed. Size: $BACKUP_SIZE"

# 8. Cleanup old backups (keep last 30 days)
echo ""
echo "🧹 Cleaning up old backups..."
find "$BACKUP_ROOT" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
REMAINING_BACKUPS=$(ls -1 "$BACKUP_ROOT" | wc -l)
echo -e "${GREEN}✅ Cleanup complete. Keeping $REMAINING_BACKUPS backups (last $RETENTION_DAYS days)${NC}"
log "Cleanup complete. $REMAINING_BACKUPS backups retained"

# Summary
echo ""
echo "=================="
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "Backup size: $BACKUP_SIZE"
echo "Total backups: $REMAINING_BACKUPS"
echo ""
echo "To restore from this backup:"
echo "  cd $DEPLOY_PATH"
echo "  cp $BACKUP_DIR/backend.env backend/.env.production"
echo "  cp $BACKUP_DIR/frontend.env frontend/.env.production"
echo "  cp $BACKUP_DIR/docker-compose.production.yml ."
echo "  docker-compose -f docker-compose.production.yml restart"
echo ""

log "Backup process completed successfully"
