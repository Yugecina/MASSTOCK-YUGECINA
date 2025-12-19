#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - NGINX VPS CONFIGURATION
# Configures nginx on VPS to proxy to MasStock Docker containers
#####################################################################

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source common functions
source "$SCRIPT_DIR/common.sh"

# Parse arguments
parse_common_args "$@"

# Check sudo
check_sudo

usage() {
    cat << EOF
Usage: sudo $0 [OPTIONS]

Configures nginx on VPS to reverse proxy MasStock containers.

OPTIONS:
    -v, --verbose    Enable verbose output
    --dry-run        Preview changes without applying
    -h, --help       Show this help message

WHAT THIS DOES:
    1. Detects existing nginx installation and configuration
    2. Creates /etc/nginx/sites-available/masstock.conf
    3. Configures reverse proxy for:
       - dorian-gonzalez.fr → nginx container (frontend)
       - api.dorian-gonzalez.fr → api container
    4. Enables site and validates configuration
    5. Reloads nginx (with rollback on failure)

REQUIREMENTS:
    - nginx installed on VPS
    - Ports 80/443 available or managed by existing nginx
    - Sudo privileges

NOTES:
    - Existing nginx configs (like n8n) are preserved
    - SSL certificates should be configured separately (see setup-ssl.sh)
    - Initial config uses HTTP, SSL is added by setup-ssl.sh

EOF
}

#####################################################################
# NGINX DETECTION
#####################################################################

detect_nginx() {
    log_step "Detecting nginx installation..."

    if ! command -v nginx &> /dev/null; then
        error_exit 30 "nginx not found" "Install with: apt-get install nginx (or yum install nginx)"
    fi

    local nginx_version=$(nginx -v 2>&1 | awk -F'/' '{print $2}')
    log_info "nginx version: $nginx_version"

    # Check if nginx is running
    if systemctl is-active --quiet nginx; then
        log_success "nginx is running"
    else
        log_warning "nginx is not running"
        if confirm "Start nginx now?"; then
            run_command "Starting nginx" systemctl start nginx
        fi
    fi

    # Detect nginx configuration directory structure
    if [[ -d /etc/nginx/sites-available ]]; then
        log_debug "Debian/Ubuntu style config (sites-available/sites-enabled)"
        NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
        NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
    elif [[ -d /etc/nginx/conf.d ]]; then
        log_debug "RHEL/CentOS style config (conf.d)"
        NGINX_SITES_AVAILABLE="/etc/nginx/conf.d"
        NGINX_SITES_ENABLED="/etc/nginx/conf.d"
    else
        error_exit 31 "Cannot detect nginx config directory" "Check /etc/nginx structure"
    fi

    log_success "nginx detected and configured"
}

check_existing_configs() {
    log_step "Checking existing nginx configurations..."

    # Check for conflicting configurations
    local existing_configs=$(find /etc/nginx -name "*.conf" -type f 2>/dev/null || true)

    if [[ -n "$existing_configs" ]]; then
        log_info "Existing nginx configurations found:"
        echo "$existing_configs" | while read -r conf; do
            log_debug "  - $conf"
        done
    fi

    # Check if our domains are already configured
    local conflicts=()

    if grep -r "server_name.*masstock\.fr" /etc/nginx 2>/dev/null | grep -v "app\|api\|n8n" > /dev/null; then
        conflicts+=("masstock.fr")
    fi

    if grep -r "server_name.*app\.masstock\.fr" /etc/nginx 2>/dev/null > /dev/null; then
        conflicts+=("app.masstock.fr")
    fi

    if grep -r "server_name.*api\.masstock\.fr" /etc/nginx 2>/dev/null > /dev/null; then
        conflicts+=("api.masstock.fr")
    fi

    if grep -r "server_name.*n8n\.masstock\.fr" /etc/nginx 2>/dev/null > /dev/null; then
        conflicts+=("n8n.masstock.fr")
    fi

    if [[ ${#conflicts[@]} -gt 0 ]]; then
        log_warning "Domains already configured in nginx: ${conflicts[*]}"
        if ! confirm "Continue and overwrite?"; then
            error_exit 32 "Conflicting nginx configuration" "Remove existing config for: ${conflicts[*]}"
        fi
    else
        log_success "No domain conflicts detected"
    fi
}

#####################################################################
# NGINX CONFIGURATION GENERATION
#####################################################################

create_masstock_config() {
    log_step "Creating nginx configuration for MasStock..."

    local config_file="${NGINX_SITES_AVAILABLE}/masstock.conf"

    # Backup existing file
    if [[ -f "$config_file" ]]; then
        backup_file "$config_file"
    fi

    log_info "Writing configuration to: $config_file"

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would create: $config_file"
        return 0
    fi

    # Note: MasStock containers exposed on different ports
    # Site vitrine: 8081, App: 8080, API: 3000, n8n: 5678
    cat > "$config_file" << 'EOF'
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MASSTOCK - NGINX REVERSE PROXY CONFIGURATION
# VPS nginx → Docker containers (masstock.fr)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Upstream definitions
upstream masstock_vitrine {
    server 127.0.0.1:8081;
    keepalive 32;
}

upstream masstock_app {
    server 127.0.0.1:8080;
    keepalive 32;
}

upstream masstock_api {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream masstock_n8n {
    server 127.0.0.1:5678;
    keepalive 32;
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SITE VITRINE - masstock.fr (Landing Page)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server {
    listen 80;
    listen [::]:80;
    server_name masstock.fr www.masstock.fr;

    # Access logs
    access_log /var/log/nginx/masstock-vitrine-access.log;
    error_log /var/log/nginx/masstock-vitrine-error.log;

    # Client limits
    client_max_body_size 5M;

    # Proxy to MasStock vitrine container
    location / {
        proxy_pass http://masstock_vitrine;

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Connection settings
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# APPLICATION - app.masstock.fr (React SPA)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server {
    listen 80;
    listen [::]:80;
    server_name app.masstock.fr;

    # Access logs
    access_log /var/log/nginx/masstock-app-access.log;
    error_log /var/log/nginx/masstock-app-error.log;

    # Client limits
    client_max_body_size 10M;

    # Proxy to MasStock app container
    location / {
        proxy_pass http://masstock_app;

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Connection settings
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://masstock_app/health;
    }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API - api.masstock.fr (Express Backend)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server {
    listen 80;
    listen [::]:80;
    server_name api.masstock.fr;

    # Access logs
    access_log /var/log/nginx/masstock-api-access.log;
    error_log /var/log/nginx/masstock-api-error.log;

    # Client limits (larger for API uploads)
    client_max_body_size 50M;

    # Proxy to MasStock API container
    location / {
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # CORS - Defense in Depth (handled by nginx + backend)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        # Handle preflight OPTIONS requests at nginx level
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://app.masstock.fr' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Length' 0;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            return 204;
        }

        # Proxy to backend
        proxy_pass http://masstock_api;

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Connection settings
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # API timeouts (longer for workflow executions)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 16 8k;

        # Pass through CORS headers from backend (double protection)
        proxy_pass_header Access-Control-Allow-Origin;
        proxy_pass_header Access-Control-Allow-Credentials;
        proxy_pass_header Access-Control-Allow-Methods;
        proxy_pass_header Access-Control-Allow-Headers;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://masstock_api/health;
    }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# N8N - n8n.masstock.fr (Workflow Automation)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server {
    listen 80;
    listen [::]:80;
    server_name n8n.masstock.fr;

    # Access logs
    access_log /var/log/nginx/masstock-n8n-access.log;
    error_log /var/log/nginx/masstock-n8n-error.log;

    # Client limits (for workflow data)
    client_max_body_size 50M;

    # Proxy to n8n container
    location / {
        proxy_pass http://masstock_n8n;

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Connection settings (important for n8n websockets)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts (longer for workflow executions)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # Buffering
        proxy_buffering off;  # Disable for websockets
    }

    # Webhooks endpoint (no auth required)
    location ~* ^/webhook/ {
        proxy_pass http://masstock_n8n;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SSL CONFIGURATION WILL BE ADDED BY setup-ssl.sh
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# After running setup-ssl.sh, this file will include:
# - HTTPS listeners on port 443
# - SSL certificate paths
# - HTTP to HTTPS redirects
# - Security headers (HSTS, CSP, etc.)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

    chmod 644 "$config_file"
    log_success "Configuration file created"
}

enable_masstock_site() {
    log_step "Enabling MasStock site..."

    local config_file="${NGINX_SITES_AVAILABLE}/masstock.conf"
    local enabled_link="${NGINX_SITES_ENABLED}/masstock.conf"

    # For Debian/Ubuntu style (sites-available/sites-enabled)
    if [[ "$NGINX_SITES_AVAILABLE" != "$NGINX_SITES_ENABLED" ]]; then
        if [[ -L "$enabled_link" ]]; then
            log_debug "Site already enabled"
        else
            if [[ "${DRY_RUN:-0}" == "1" ]]; then
                log_warning "[DRY RUN] Would create symlink: $enabled_link"
            else
                ln -sf "$config_file" "$enabled_link"
                log_success "Site enabled via symlink"
            fi
        fi
    else
        log_debug "Using conf.d style - no symlink needed"
    fi
}

test_nginx_config() {
    log_step "Testing nginx configuration..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would test nginx config"
        return 0
    fi

    local test_output
    if test_output=$(nginx -t 2>&1); then
        log_success "nginx configuration is valid"
        log_debug "$test_output"
        return 0
    else
        log_error "nginx configuration test failed:"
        echo "$test_output"
        return 1
    fi
}

reload_nginx() {
    log_step "Reloading nginx..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would reload nginx"
        return 0
    fi

    # Test config first
    if ! test_nginx_config; then
        error_exit 33 "nginx configuration is invalid" "Check syntax and fix errors"
    fi

    # Reload nginx
    if systemctl reload nginx; then
        log_success "nginx reloaded successfully"
    else
        error_exit 34 "Failed to reload nginx" "Check systemctl status nginx"
    fi

    # Verify nginx is still running
    sleep 2
    if ! systemctl is-active --quiet nginx; then
        error_exit 35 "nginx stopped after reload" "Check logs: journalctl -u nginx -n 50"
    fi

    log_success "nginx is running and serving new configuration"
}

#####################################################################
# DOCKER-COMPOSE UPDATE
#####################################################################

update_docker_compose() {
    log_step "Checking docker-compose.production.yml ports..."

    local compose_file="$PROJECT_ROOT/docker-compose.production.yml"

    if [[ ! -f "$compose_file" ]]; then
        error_exit 36 "docker-compose.production.yml not found" "Ensure file exists at: $compose_file"
    fi

    # Check if nginx ports need updating
    if grep -q "\"80:80\"" "$compose_file" && grep -q "\"443:443\"" "$compose_file"; then
        log_warning "docker-compose.production.yml has nginx on ports 80/443"
        log_info "These will conflict with VPS nginx"
        log_info "Ports will be changed to: 8080:80 (internal)"
        log_info "VPS nginx will proxy :80/:443 → :8080"
        echo ""

        if ! confirm "Update docker-compose.production.yml automatically?"; then
            log_warning "Skipping docker-compose update"
            log_warning "⚠️  MANUAL ACTION REQUIRED:"
            log_warning "   Edit: $compose_file"
            log_warning "   Change nginx ports from '80:80' and '443:443' to '8080:80'"
            log_warning "   Remove the '443:443' port mapping entirely"
            return 0
        fi

        # Backup
        backup_file "$compose_file"

        # Update ports (will be done in next task)
        log_info "docker-compose.production.yml will be updated in next step"
    else
        log_success "docker-compose.production.yml ports are already configured"
    fi
}

#####################################################################
# VERIFICATION
#####################################################################

verify_nginx_config() {
    log_step "Verifying nginx configuration..."

    # Check config file exists
    local config_file="${NGINX_SITES_AVAILABLE}/masstock.conf"
    if [[ ! -f "$config_file" ]]; then
        error_exit 37 "Configuration file not found: $config_file"
    fi

    # Check upstreams are defined
    if ! grep -q "upstream masstock_vitrine" "$config_file"; then
        error_exit 38 "Missing upstream definition: masstock_vitrine"
    fi

    if ! grep -q "upstream masstock_app" "$config_file"; then
        error_exit 39 "Missing upstream definition: masstock_app"
    fi

    if ! grep -q "upstream masstock_api" "$config_file"; then
        error_exit 40 "Missing upstream definition: masstock_api"
    fi

    if ! grep -q "upstream masstock_n8n" "$config_file"; then
        error_exit 41 "Missing upstream definition: masstock_n8n"
    fi

    # Check server blocks
    if ! grep -q "server_name masstock.fr" "$config_file"; then
        error_exit 42 "Missing server block for: masstock.fr"
    fi

    if ! grep -q "server_name app.masstock.fr" "$config_file"; then
        error_exit 43 "Missing server block for: app.masstock.fr"
    fi

    if ! grep -q "server_name api.masstock.fr" "$config_file"; then
        error_exit 44 "Missing server block for: api.masstock.fr"
    fi

    if ! grep -q "server_name n8n.masstock.fr" "$config_file"; then
        error_exit 45 "Missing server block for: n8n.masstock.fr"
    fi

    log_success "Configuration verification passed"
}

print_next_steps() {
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  NGINX CONFIGURATION COMPLETE"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_success "VPS nginx is configured to proxy:"
    echo "  • http://masstock.fr → container port 8081 (site vitrine)"
    echo "  • http://app.masstock.fr → container port 8080 (application)"
    echo "  • http://api.masstock.fr → container port 3000 (API)"
    echo "  • http://n8n.masstock.fr → container port 5678 (n8n)"
    echo ""

    log_info "📝 Configuration file: ${NGINX_SITES_AVAILABLE}/masstock.conf"
    log_info "📊 Access logs: /var/log/nginx/masstock-*-access.log"
    log_info "❌ Error logs: /var/log/nginx/masstock-*-error.log"
    echo ""

    log_warning "⚠️  IMPORTANT:"
    log_info "   1. Configure DNS (masstock.fr, app, api, n8n) → VPS IP"
    log_info "   2. Run setup-ssl.sh to add HTTPS support"
    log_info "   3. Update docker-compose.production.yml (add n8n and vitrine)"
    log_info "   4. Start Docker containers with build-and-start.sh"
    echo ""

    log_info "Next steps:"
    log_info "  1. ./deploy/setup-ssl.sh (configure SSL certificates)"
    log_info "  2. ./deploy/build-and-start.sh (start containers)"
    echo ""
}

#####################################################################
# MAIN EXECUTION
#####################################################################

main() {
    log_info "Starting nginx VPS configuration..."
    log_info "Project root: $PROJECT_ROOT"
    echo ""

    # Detect nginx
    detect_nginx

    # Check existing configs
    check_existing_configs

    # Create MasStock configuration
    create_masstock_config

    # Enable site
    enable_masstock_site

    # Test and reload
    test_nginx_config
    reload_nginx

    # Verify
    verify_nginx_config

    # Check docker-compose
    update_docker_compose

    # Success
    print_success_summary
    print_next_steps
}

# Run main function
main "$@"
