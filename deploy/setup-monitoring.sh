#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - MONITORING SETUP
# Configure monitoring cron job for automatic service health checks
#
# Usage: ./deploy/setup-monitoring.sh [--interval MINUTES]
# Example: ./deploy/setup-monitoring.sh --interval 5
#####################################################################

set -e

# Default interval (minutes)
INTERVAL=5

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --interval)
            INTERVAL="$2"
            shift 2
            ;;
        -h|--help)
            cat << EOF
Usage: $0 [OPTIONS]

Configure monitoring cron job for MasStock production services.

OPTIONS:
    --interval MINUTES    Monitoring check interval in minutes (default: 5)
    -h, --help            Show this help message

EXAMPLES:
    # Setup monitoring every 5 minutes (default)
    $0

    # Setup monitoring every 10 minutes
    $0 --interval 10

    # Remove monitoring
    $0 --remove

WHAT IT DOES:
    1. Makes monitoring.sh executable
    2. Creates log directory if needed
    3. Adds cron job to check services every N minutes
    4. Verifies cron job is active

EOF
            exit 0
            ;;
        --remove)
            echo "🗑️  Removing monitoring cron job..."
            crontab -l 2>/dev/null | grep -v "monitoring.sh" | crontab - || true
            echo "✅ Monitoring cron job removed"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_SCRIPT="$SCRIPT_DIR/monitoring.sh"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MASSTOCK MONITORING SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Validate monitoring script exists
if [[ ! -f "$MONITORING_SCRIPT" ]]; then
    echo "❌ Error: monitoring.sh not found at $MONITORING_SCRIPT"
    exit 1
fi

# Step 1: Make monitoring script executable
echo "📝 Step 1: Making monitoring script executable..."
chmod +x "$MONITORING_SCRIPT"
echo "✅ Done"
echo ""

# Step 2: Create log directory
echo "📝 Step 2: Creating log directory..."
sudo mkdir -p /var/log/masstock
sudo chown $(whoami):$(whoami) /var/log/masstock
echo "✅ Done"
echo ""

# Step 3: Test monitoring script
echo "📝 Step 3: Testing monitoring script..."
if "$MONITORING_SCRIPT" 2>&1 | head -10; then
    echo "✅ Monitoring script works"
else
    echo "⚠️  Warning: Monitoring script test failed (might be normal if services not running)"
fi
echo ""

# Step 4: Setup cron job
echo "📝 Step 4: Setting up cron job..."

# Create cron expression
CRON_EXPRESSION="*/$INTERVAL * * * *"
CRON_COMMAND="$MONITORING_SCRIPT --auto-restart --alert >> /var/log/masstock/cron.log 2>&1"
CRON_ENTRY="$CRON_EXPRESSION $CRON_COMMAND"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "monitoring.sh"; then
    echo "ℹ️  Monitoring cron job already exists. Updating..."
    # Remove existing monitoring cron jobs
    crontab -l 2>/dev/null | grep -v "monitoring.sh" | crontab - || true
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job added"
echo ""

# Step 5: Verify cron job
echo "📝 Step 5: Verifying cron job..."
if crontab -l 2>/dev/null | grep -q "monitoring.sh"; then
    echo "✅ Cron job verified"
    echo ""
    echo "📋 Current cron configuration:"
    crontab -l 2>/dev/null | grep "monitoring.sh"
else
    echo "❌ Error: Cron job not found after setup"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ MONITORING SETUP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Monitoring configuration:"
echo "   Interval: Every $INTERVAL minutes"
echo "   Script: $MONITORING_SCRIPT"
echo "   Logs: /var/log/masstock/monitoring.log"
echo "   Cron logs: /var/log/masstock/cron.log"
echo ""
echo "📊 Next steps:"
echo "   1. Monitor logs: tail -f /var/log/masstock/monitoring.log"
echo "   2. Check cron: tail -f /var/log/masstock/cron.log"
echo "   3. Test manually: $MONITORING_SCRIPT --auto-restart"
echo "   4. View cron: crontab -l"
echo ""
echo "🗑️  To remove monitoring: $0 --remove"
echo ""
