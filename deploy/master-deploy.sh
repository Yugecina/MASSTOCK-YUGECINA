#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - MASTER ORCHESTRATOR
# Complete end-to-end deployment automation
#####################################################################

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source common functions
source "$SCRIPT_DIR/common.sh"

# Parse arguments
parse_common_args "$@"

usage() {
    cat << EOF
Usage: sudo $0 [OPTIONS]

Complete MasStock deployment orchestration - runs all setup steps in order.

OPTIONS:
    -v, --verbose        Enable verbose output
    --dry-run            Preview all steps without executing
    --skip-checks        Skip environment checks
    --skip-nginx         Skip nginx configuration
    --skip-ssl           Skip SSL setup
    --rebuild            Force rebuild (no cache)
    -h, --help           Show this help message

DEPLOYMENT STEPS:
    1. ✓ Environment check (Docker, ports, disk, memory)
    2. ✓ Environment configuration (if .env missing)
    3. ✓ Nginx VPS configuration
    4. ✓ SSL certificate setup (Let's Encrypt)
    5. ✓ Build frontend and Docker images
    6. ✓ Start all containers
    7. ✓ Health checks

REQUIREMENTS:
    - Run with sudo (for nginx and SSL setup)
    - VPS with Docker installed
    - Domains pointing to server IP
    - Ports 80/443 accessible

EXAMPLES:
    sudo $0                 # Full deployment
    sudo $0 --verbose       # With detailed output
    sudo $0 --skip-ssl      # Skip SSL (HTTP only)
    sudo $0 --rebuild       # Force full rebuild

EOF
}

# Options
SKIP_CHECKS=0
SKIP_NGINX=0
SKIP_SSL=0
REBUILD=0

#####################################################################
# PARSE ARGUMENTS
#####################################################################

parse_master_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-checks)
                SKIP_CHECKS=1
                log_warning "Skipping environment checks"
                shift
                ;;
            --skip-nginx)
                SKIP_NGINX=1
                log_warning "Skipping nginx setup"
                shift
                ;;
            --skip-ssl)
                SKIP_SSL=1
                log_warning "Skipping SSL setup"
                shift
                ;;
            --rebuild)
                REBUILD=1
                log_info "Force rebuild enabled"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
}

#####################################################################
# DEPLOYMENT STEPS
#####################################################################

step_1_check_environment() {
    if [[ $SKIP_CHECKS -eq 1 ]]; then
        log_info "⏭️  Skipping environment checks (--skip-checks)"
        return 0
    fi

    log_step "STEP 1/7: Checking environment prerequisites..."

    if [[ ! -f "$SCRIPT_DIR/check-environment.sh" ]]; then
        error_exit 100 "check-environment.sh not found"
    fi

    local args=""
    if [[ "${VERBOSE:-0}" == "1" ]]; then
        args+=" --verbose"
    fi
    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        args+=" --dry-run"
    fi

    if bash "$SCRIPT_DIR/check-environment.sh" $args; then
        log_success "✓ Environment check passed"
    else
        error_exit 101 "Environment check failed" "Fix issues above and try again"
    fi

    echo ""
}

step_2_generate_env() {
    log_step "STEP 2/7: Checking environment configuration..."

    # Check if .env.production exists
    if [[ -f "$PROJECT_ROOT/backend/.env.production" ]]; then
        log_info "backend/.env.production exists"

        if confirm "Regenerate environment files?"; then
            run_generate_env
        else
            log_success "✓ Using existing environment configuration"
        fi
    else
        log_info "backend/.env.production not found"
        run_generate_env
    fi

    echo ""
}

run_generate_env() {
    if [[ ! -f "$SCRIPT_DIR/generate-env.sh" ]]; then
        error_exit 102 "generate-env.sh not found"
    fi

    local args=""
    if [[ "${VERBOSE:-0}" == "1" ]]; then
        args+=" --verbose"
    fi
    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        args+=" --dry-run"
    fi

    if bash "$SCRIPT_DIR/generate-env.sh" $args; then
        log_success "✓ Environment configuration complete"
    else
        error_exit 103 "Environment configuration failed"
    fi
}

step_3_setup_nginx() {
    if [[ $SKIP_NGINX -eq 1 ]]; then
        log_info "⏭️  Skipping nginx setup (--skip-nginx)"
        return 0
    fi

    log_step "STEP 3/7: Configuring nginx reverse proxy..."

    if [[ ! -f "$SCRIPT_DIR/setup-nginx-vps.sh" ]]; then
        error_exit 104 "setup-nginx-vps.sh not found"
    fi

    local args=""
    if [[ "${VERBOSE:-0}" == "1" ]]; then
        args+=" --verbose"
    fi
    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        args+=" --dry-run"
    fi

    # Check if already configured
    if [[ -f /etc/nginx/sites-available/masstock.conf ]] || [[ -f /etc/nginx/conf.d/masstock.conf ]]; then
        log_info "nginx configuration exists"

        if confirm "Reconfigure nginx?"; then
            run_nginx_setup "$args"
        else
            log_success "✓ Using existing nginx configuration"
        fi
    else
        run_nginx_setup "$args"
    fi

    echo ""
}

run_nginx_setup() {
    local args=$1

    if sudo bash "$SCRIPT_DIR/setup-nginx-vps.sh" $args; then
        log_success "✓ Nginx configuration complete"
    else
        error_exit 105 "Nginx configuration failed"
    fi
}

step_4_setup_ssl() {
    if [[ $SKIP_SSL -eq 1 ]]; then
        log_info "⏭️  Skipping SSL setup (--skip-ssl)"
        log_warning "⚠️  Site will run on HTTP only (not recommended for production)"
        return 0
    fi

    log_step "STEP 4/7: Setting up SSL certificates..."

    if [[ ! -f "$SCRIPT_DIR/setup-ssl.sh" ]]; then
        error_exit 106 "setup-ssl.sh not found"
    fi

    local args=""
    if [[ "${VERBOSE:-0}" == "1" ]]; then
        args+=" --verbose"
    fi
    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        args+=" --dry-run"
    fi

    # Check if SSL already configured
    if [[ -f /etc/letsencrypt/live/dorian-gonzalez.fr/fullchain.pem ]]; then
        log_info "SSL certificates exist"

        # Check expiry
        local expiry_date=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/dorian-gonzalez.fr/fullchain.pem | cut -d= -f2)
        log_info "Current certificate expires: $expiry_date"

        if confirm "Renew SSL certificates?"; then
            run_ssl_setup "$args"
        else
            log_success "✓ Using existing SSL certificates"
        fi
    else
        run_ssl_setup "$args"
    fi

    echo ""
}

run_ssl_setup() {
    local args=$1

    if sudo bash "$SCRIPT_DIR/setup-ssl.sh" $args; then
        log_success "✓ SSL configuration complete"
    else
        log_error "SSL setup failed"
        log_warning "Continuing without SSL (HTTP only)"
        log_info "You can run SSL setup later: sudo ./deploy/setup-ssl.sh"
    fi
}

step_5_update_docker_compose() {
    log_step "STEP 5/7: Updating docker-compose configuration..."

    local compose_file="$PROJECT_ROOT/docker-compose.production.yml"

    # Check if nginx ports need updating (80/443 → 8080)
    if grep -q '"80:80"' "$compose_file" || grep -q "'80:80'" "$compose_file"; then
        log_info "Updating nginx container ports (80:80 → 8080:80)"

        if [[ "${DRY_RUN:-0}" == "1" ]]; then
            log_warning "[DRY RUN] Would update docker-compose.production.yml"
        else
            # Backup
            backup_file "$compose_file"

            # Update ports: 80:80 → 8080:80, remove 443:443
            sed -i.bak 's/"80:80"/"8080:80"/g' "$compose_file"
            sed -i.bak 's/'\''80:80'\''/'\''8080:80'\''/g' "$compose_file"

            # Remove 443 port mapping
            sed -i.bak '/- "443:443"/d' "$compose_file"
            sed -i.bak '/- '\''443:443'\''/d' "$compose_file"

            log_success "✓ docker-compose.production.yml updated"
        fi
    else
        log_debug "docker-compose ports already configured"
    fi

    echo ""
}

step_6_build_and_start() {
    log_step "STEP 6/7: Building and starting containers..."

    if [[ ! -f "$SCRIPT_DIR/build-and-start.sh" ]]; then
        error_exit 107 "build-and-start.sh not found"
    fi

    local args=""
    if [[ "${VERBOSE:-0}" == "1" ]]; then
        args+=" --verbose"
    fi
    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        args+=" --dry-run"
    fi
    if [[ $REBUILD -eq 1 ]]; then
        args+=" --rebuild"
    fi

    if bash "$SCRIPT_DIR/build-and-start.sh" $args; then
        log_success "✓ Containers built and started"
    else
        error_exit 108 "Build and start failed" "Check logs above for details"
    fi

    echo ""
}

step_7_health_check() {
    log_step "STEP 7/7: Running health checks..."

    if [[ ! -f "$SCRIPT_DIR/health-check.sh" ]]; then
        log_warning "health-check.sh not found, skipping"
        return 0
    fi

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would run health checks"
        return 0
    fi

    # Wait a bit for services to fully start
    log_info "Waiting for services to stabilize..."
    sleep 10

    local args=""
    if [[ "${VERBOSE:-0}" == "1" ]]; then
        args+=" --verbose"
    fi

    if bash "$SCRIPT_DIR/health-check.sh" $args; then
        log_success "✓ Health checks passed"
    else
        log_warning "⚠️  Some health checks failed"
        log_info "Check details above. Services may still be starting."
        log_info "Run health check again: ./deploy/health-check.sh"
    fi

    echo ""
}

#####################################################################
# DEPLOYMENT SUMMARY
#####################################################################

print_deployment_summary() {
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  🎉 MASSTOCK DEPLOYMENT COMPLETE!"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_success "Your MasStock instance is now live:"
    echo ""

    if [[ $SKIP_SSL -eq 0 ]]; then
        echo "  🌐 Frontend:  https://dorian-gonzalez.fr"
        echo "  🔌 API:       https://api.dorian-gonzalez.fr"
        echo "  📊 Health:    https://api.dorian-gonzalez.fr/health"
    else
        echo "  🌐 Frontend:  http://dorian-gonzalez.fr"
        echo "  🔌 API:       http://api.dorian-gonzalez.fr"
        echo "  📊 Health:    http://api.dorian-gonzalez.fr/health"
        echo ""
        log_warning "⚠️  Running on HTTP only. Setup SSL: sudo ./deploy/setup-ssl.sh"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_info "📋 Useful commands:"
    echo ""
    echo "  # View logs"
    echo "  docker compose -f docker-compose.production.yml logs -f"
    echo ""
    echo "  # Run health check"
    echo "  ./deploy/health-check.sh"
    echo ""
    echo "  # Restart services"
    echo "  docker compose -f docker-compose.production.yml restart"
    echo ""
    echo "  # Stop all services"
    echo "  docker compose -f docker-compose.production.yml down"
    echo ""
    echo "  # Rebuild and restart"
    echo "  ./deploy/build-and-start.sh --rebuild"
    echo ""
    echo "  # Rollback to previous version"
    echo "  ./deploy/rollback.sh"
    echo ""

    log_info "📁 Important files:"
    echo "  • Logs: /var/log/masstock/"
    echo "  • nginx: /etc/nginx/sites-available/masstock.conf"
    echo "  • SSL: /etc/letsencrypt/live/dorian-gonzalez.fr/"
    echo "  • Env: $PROJECT_ROOT/backend/.env.production"
    echo ""

    log_info "🔄 Automatic deployment:"
    echo "  Configure GitHub Secrets, then just push to main branch:"
    echo "  git push origin main"
    echo ""

    log_info "📚 Documentation:"
    echo "  See .agent/SOP/deployment.md for detailed procedures"
    echo ""
}

#####################################################################
# ERROR HANDLING
#####################################################################

handle_deployment_failure() {
    local exit_code=$?

    echo ""
    log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_error "  DEPLOYMENT FAILED (Exit code: $exit_code)"
    log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_info "📋 Full logs: $LOG_FILE"
    echo ""

    log_info "🔍 Troubleshooting:"
    echo "  1. Check error messages above"
    echo "  2. Copy/paste errors to Claude for debugging"
    echo "  3. Run individual scripts for specific steps:"
    echo "     • ./deploy/check-environment.sh"
    echo "     • ./deploy/generate-env.sh"
    echo "     • ./deploy/setup-nginx-vps.sh"
    echo "     • ./deploy/setup-ssl.sh"
    echo "     • ./deploy/build-and-start.sh"
    echo "     • ./deploy/health-check.sh"
    echo ""

    log_info "🔄 If system is partially deployed, you can:"
    echo "  • Fix the issue and re-run: sudo ./deploy/master-deploy.sh"
    echo "  • Rollback: ./deploy/rollback.sh"
    echo ""

    exit $exit_code
}

trap handle_deployment_failure ERR

#####################################################################
# MAIN EXECUTION
#####################################################################

main() {
    parse_master_args "$@"

    # Check if running as root
    if [[ $EUID -ne 0 ]] && [[ $SKIP_NGINX -eq 0 ]] || [[ $SKIP_SSL -eq 0 ]]; then
        log_warning "This script requires sudo for nginx and SSL setup"
        log_info "Please run with: sudo $0 $*"
        exit 1
    fi

    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  MASSTOCK PRODUCTION DEPLOYMENT"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    log_info "Project: $PROJECT_ROOT"
    log_info "Started: $(date)"
    echo ""

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "🏃 DRY RUN MODE - No changes will be made"
        echo ""
    fi

    # Confirm deployment
    if [[ "${DRY_RUN:-0}" != "1" ]]; then
        log_warning "This will deploy MasStock to production"
        if ! confirm "Continue with deployment?"; then
            log_info "Deployment cancelled by user"
            exit 0
        fi
        echo ""
    fi

    # Execute deployment steps
    step_1_check_environment
    step_2_generate_env
    step_3_setup_nginx
    step_4_setup_ssl
    step_5_update_docker_compose
    step_6_build_and_start
    step_7_health_check

    # Success!
    print_success_summary
    print_deployment_summary
}

# Run main function
main "$@"
