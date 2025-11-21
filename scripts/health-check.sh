#!/bin/bash

# Health Check Script
# Monitors all services and alerts if something is down

set -e

# Configuration
API_URL="https://api.dorian-gonzalez.fr/health"
FRONTEND_URL="https://dorian-gonzalez.fr"
DEPLOY_PATH="/opt/masstock"
LOG_FILE="/var/log/masstock-health.log"
ALERT_EMAIL="your-email@example.com"  # Optional: set email for alerts

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check function
check() {
  local service=$1
  local check_command=$2

  if eval "$check_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $service: OK${NC}"
    log "$service: OK"
    return 0
  else
    echo -e "${RED}❌ $service: FAILED${NC}"
    log "ERROR: $service FAILED"
    return 1
  fi
}

# Initialize
echo "🏥 MasStock Health Check"
echo "========================"
echo ""

FAILED=0

# 1. Check API Health Endpoint
echo "Checking API..."
if ! check "API Health" "curl -f -s -o /dev/null -w '%{http_code}' $API_URL | grep -q 200"; then
  ((FAILED++))
fi

# 2. Check Frontend
echo "Checking Frontend..."
if ! check "Frontend" "curl -f -s -o /dev/null -w '%{http_code}' $FRONTEND_URL | grep -q 200"; then
  ((FAILED++))
fi

# 3. Check Docker Services
echo "Checking Docker Services..."

# Check if docker-compose is running
cd "$DEPLOY_PATH"

# API Container
if ! check "API Container" "docker-compose -f docker-compose.production.yml ps | grep masstock_api | grep -q Up"; then
  ((FAILED++))
fi

# Worker Container
if ! check "Worker Container" "docker-compose -f docker-compose.production.yml ps | grep masstock_worker | grep -q Up"; then
  ((FAILED++))
fi

# Redis Container
if ! check "Redis Container" "docker-compose -f docker-compose.production.yml ps | grep masstock_redis | grep -q Up"; then
  ((FAILED++))
fi

# Nginx Container
if ! check "Nginx Container" "docker-compose -f docker-compose.production.yml ps | grep masstock_nginx | grep -q Up"; then
  ((FAILED++))
fi

# 4. Check Redis Connection
echo "Checking Redis..."
if ! check "Redis Connection" "docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping | grep -q PONG"; then
  ((FAILED++))
fi

# 5. Check Disk Space
echo "Checking Disk Space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
  echo -e "${RED}❌ Disk Space: ${DISK_USAGE}% (Critical!)${NC}"
  log "ERROR: Disk space critical: ${DISK_USAGE}%"
  ((FAILED++))
elif [ "$DISK_USAGE" -gt 80 ]; then
  echo -e "${YELLOW}⚠️  Disk Space: ${DISK_USAGE}% (Warning)${NC}"
  log "WARNING: Disk space high: ${DISK_USAGE}%"
else
  echo -e "${GREEN}✅ Disk Space: ${DISK_USAGE}%${NC}"
fi

# 6. Check Memory Usage
echo "Checking Memory..."
MEMORY_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
  echo -e "${RED}❌ Memory Usage: ${MEMORY_USAGE}% (Critical!)${NC}"
  log "ERROR: Memory usage critical: ${MEMORY_USAGE}%"
  ((FAILED++))
elif [ "$MEMORY_USAGE" -gt 80 ]; then
  echo -e "${YELLOW}⚠️  Memory Usage: ${MEMORY_USAGE}% (Warning)${NC}"
  log "WARNING: Memory usage high: ${MEMORY_USAGE}%"
else
  echo -e "${GREEN}✅ Memory Usage: ${MEMORY_USAGE}%${NC}"
fi

# 7. Check SSL Certificates Expiry
echo "Checking SSL Certificates..."
CERT_EXPIRY_DAYS=$(echo | openssl s_client -servername dorian-gonzalez.fr -connect dorian-gonzalez.fr:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2 | xargs -I{} date -d {} +%s)
CURRENT_DATE=$(date +%s)
DAYS_LEFT=$(( ($CERT_EXPIRY_DAYS - $CURRENT_DATE) / 86400 ))

if [ "$DAYS_LEFT" -lt 7 ]; then
  echo -e "${RED}❌ SSL Certificate: Expires in $DAYS_LEFT days (Critical!)${NC}"
  log "ERROR: SSL certificate expires soon: $DAYS_LEFT days"
  ((FAILED++))
elif [ "$DAYS_LEFT" -lt 30 ]; then
  echo -e "${YELLOW}⚠️  SSL Certificate: Expires in $DAYS_LEFT days (Warning)${NC}"
  log "WARNING: SSL certificate expires in $DAYS_LEFT days"
else
  echo -e "${GREEN}✅ SSL Certificate: $DAYS_LEFT days remaining${NC}"
fi

# Summary
echo ""
echo "========================"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  log "Health check: All systems operational"
  exit 0
else
  echo -e "${RED}❌ $FAILED check(s) failed!${NC}"
  log "Health check: $FAILED failures detected"

  # Optional: Send email alert
  if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
    echo "Health check failed on $(hostname)" | mail -s "MasStock Health Check Failed" "$ALERT_EMAIL"
  fi

  exit 1
fi
