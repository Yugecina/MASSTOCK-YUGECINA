#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - SSL CONFIGURATION
# Obtains and configures Let's Encrypt SSL certificates
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

Configures Let's Encrypt SSL certificates for MasStock domains.

OPTIONS:
    -v, --verbose    Enable verbose output
    --dry-run        Preview changes without applying
    -h, --help       Show this help message

WHAT THIS DOES:
    1. Installs certbot if not present
    2. Obtains SSL certificates for:
       - masstock.fr (site vitrine)
       - app.masstock.fr (application)
       - api.masstock.fr (API)
       - n8n.masstock.fr (n8n)
    3. Updates nginx configuration with SSL
    4. Configures automatic renewal
    5. Sets up HTTPS redirects and security headers

REQUIREMENTS:
    - nginx configured (run setup-nginx-vps.sh first)
    - Domains pointing to VPS IP
    - Ports 80/443 accessible from internet
    - Valid email address for Let's Encrypt

NOTES:
    - Uses Let's Encrypt free SSL certificates
    - Certificates auto-renew every 90 days
    - Staging mode available for testing (--staging)

EOF
}

# Email for Let's Encrypt
LETSENCRYPT_EMAIL=""

# Domains to certify
DOMAINS=("masstock.fr" "www.masstock.fr" "app.masstock.fr" "api.masstock.fr" "n8n.masstock.fr")

# Staging mode for testing
STAGING_MODE=0

#####################################################################
# PARSE ARGUMENTS
#####################################################################

parse_ssl_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --staging)
                STAGING_MODE=1
                log_warning "STAGING MODE enabled - certificates will NOT be valid"
                shift
                ;;
            --email)
                LETSENCRYPT_EMAIL="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
}

#####################################################################
# CERTBOT INSTALLATION
#####################################################################

install_certbot() {
    log_step "Checking certbot installation..."

    if command -v certbot &> /dev/null; then
        local certbot_version=$(certbot --version 2>&1 | awk '{print $2}')
        log_info "certbot version: $certbot_version"
        log_success "certbot is installed"
        return 0
    fi

    log_warning "certbot not found"

    if ! confirm "Install certbot now?"; then
        error_exit 50 "certbot is required for SSL" "Install manually: apt-get install certbot python3-certbot-nginx"
    fi

    log_step "Installing certbot..."

    # Detect OS
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        case "$ID" in
            ubuntu|debian)
                run_command "Installing certbot" apt-get update
                run_command "Installing certbot packages" apt-get install -y certbot python3-certbot-nginx
                ;;
            centos|rhel|fedora)
                run_command "Installing certbot" yum install -y certbot python3-certbot-nginx
                ;;
            *)
                error_exit 51 "Unsupported OS for automatic certbot installation: $ID" "Install certbot manually"
                ;;
        esac
    else
        error_exit 52 "Cannot detect OS" "Install certbot manually"
    fi

    log_success "certbot installed successfully"
}

#####################################################################
# EMAIL CONFIGURATION
#####################################################################

get_letsencrypt_email() {
    log_step "Configuring Let's Encrypt email..."

    if [[ -n "$LETSENCRYPT_EMAIL" ]]; then
        log_info "Using provided email: $LETSENCRYPT_EMAIL"
        return 0
    fi

    echo ""
    log_info "Let's Encrypt requires an email address for:"
    log_info "  • Certificate expiration notices"
    log_info "  • Important security updates"
    log_info "  • Account recovery"
    echo ""

    while true; do
        read -p "$(echo -e ${CYAN}Enter your email address: ${NC})" email

        if [[ "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            LETSENCRYPT_EMAIL="$email"
            log_success "Email configured: $LETSENCRYPT_EMAIL"
            break
        else
            log_error "Invalid email format. Please try again."
        fi
    done
}

#####################################################################
# DNS VERIFICATION
#####################################################################

verify_dns() {
    log_step "Verifying DNS configuration..."

    local server_ip=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "UNKNOWN")
    log_info "Server IP: $server_ip"

    local dns_errors=0

    for domain in "${DOMAINS[@]}"; do
        log_debug "Checking DNS for: $domain"

        local resolved_ip=$(dig +short "$domain" | tail -n1)

        if [[ -z "$resolved_ip" ]]; then
            log_error "DNS not configured for: $domain"
            dns_errors=$((dns_errors + 1))
        elif [[ "$resolved_ip" != "$server_ip" ]]; then
            log_warning "DNS mismatch for $domain: $resolved_ip (expected: $server_ip)"
            dns_errors=$((dns_errors + 1))
        else
            log_success "DNS OK for $domain → $resolved_ip"
        fi
    done

    if [[ $dns_errors -gt 0 ]]; then
        echo ""
        log_error "DNS verification failed for $dns_errors domain(s)"
        log_info "Ensure your domains point to this server's IP: $server_ip"
        echo ""

        if ! confirm "Continue anyway? (May fail during certificate issuance)"; then
            error_exit 53 "DNS verification failed" "Configure DNS records before proceeding"
        fi
    else
        log_success "All domains resolve correctly"
    fi
}

#####################################################################
# CERTIFICATE ISSUANCE
#####################################################################

obtain_certificates() {
    log_step "Obtaining SSL certificates..."

    # Build certbot command
    local certbot_cmd="certbot certonly --nginx"

    # Email
    certbot_cmd+=" --email $LETSENCRYPT_EMAIL --agree-tos --no-eff-email"

    # Domains
    for domain in "${DOMAINS[@]}"; do
        certbot_cmd+=" -d $domain"
    done

    # Staging mode
    if [[ $STAGING_MODE -eq 1 ]]; then
        certbot_cmd+=" --staging"
        log_warning "Using Let's Encrypt STAGING environment (test certificates)"
    fi

    # Expand existing certificate if needed
    certbot_cmd+=" --expand"

    # Non-interactive
    certbot_cmd+=" --non-interactive"

    log_info "Running certbot..."
    log_debug "Command: $certbot_cmd"

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would execute: $certbot_cmd"
        return 0
    fi

    # Execute certbot
    if eval "$certbot_cmd"; then
        log_success "SSL certificates obtained successfully"
    else
        error_exit 54 "Failed to obtain SSL certificates" "Check logs above for details. Common issues: DNS not propagated, port 80 blocked, nginx misconfigured"
    fi

    # Show certificate info
    log_info "Certificate details:"
    certbot certificates | grep -A 5 "masstock.fr" || true
}

#####################################################################
# NGINX SSL CONFIGURATION
#####################################################################

update_nginx_with_ssl() {
    log_step "Updating nginx configuration with SSL..."

    local config_file="/etc/nginx/sites-available/masstock.conf"
    if [[ ! -f "$config_file" ]]; then
        config_file="/etc/nginx/conf.d/masstock.conf"
    fi

    if [[ ! -f "$config_file" ]]; then
        error_exit 55 "MasStock nginx config not found" "Run setup-nginx-vps.sh first"
    fi

    # Backup
    backup_file "$config_file"

    # Certificate paths
    local cert_path="/etc/letsencrypt/live/masstock.fr"

    log_info "Writing SSL configuration..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would update: $config_file"
        return 0
    fi

    # Create new config with SSL
    cat > "$config_file" << EOF
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MASSTOCK - NGINX REVERSE PROXY CONFIGURATION WITH SSL
# VPS nginx → Docker containers (HTTPS enabled)
# Generated: $(date)
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
# SITE VITRINE - masstock.fr (HTTP → HTTPS redirect)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server {
    listen 80;
    listen [::]:80;
    server_name masstock.fr www.masstock.fr;

    # ACME challenge for certificate renewal
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name masstock.fr www.masstock.fr;

    # SSL Configuration
    ssl_certificate ${cert_path}/fullchain.pem;
    ssl_certificate_key ${cert_path}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate ${cert_path}/chain.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://api.masstock.fr https://app.masstock.fr https://*.supabase.co;" always;

    # Access logs
    access_log /var/log/nginx/masstock-vitrine-access.log;
    error_log /var/log/nginx/masstock-vitrine-error.log;

    # Client limits
    client_max_body_size 5M;

    # Proxy to MasStock vitrine container
    location / {
        proxy_pass http://masstock_vitrine;

        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

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
# APPLICATION - app.masstock.fr (HTTP → HTTPS redirect)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server {
    listen 80;
    listen [::]:80;
    server_name app.masstock.fr;

    # ACME challenge for certificate renewal
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.masstock.fr;

    # SSL Configuration
    ssl_certificate ${cert_path}/fullchain.pem;
    ssl_certificate_key ${cert_path}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate ${cert_path}/chain.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://api.masstock.fr https://*.supabase.co;" always;

    # Access logs
    access_log /var/log/nginx/masstock-app-access.log;
    error_log /var/log/nginx/masstock-app-error.log;

    # Client limits
    client_max_body_size 10M;

    # Proxy to MasStock app container
    location / {
        proxy_pass http://masstock_app;

        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

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
# API - api.masstock.fr (HTTP → HTTPS redirect)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server {
    listen 80;
    listen [::]:80;
    server_name api.masstock.fr;

    # ACME challenge for certificate renewal
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.masstock.fr;

    # SSL Configuration
    ssl_certificate ${cert_path}/fullchain.pem;
    ssl_certificate_key ${cert_path}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate ${cert_path}/chain.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Access logs
    access_log /var/log/nginx/masstock-api-access.log;
    error_log /var/log/nginx/masstock-api-error.log;

    # Client limits (larger for API uploads)
    client_max_body_size 50M;

    # Proxy to MasStock API container
    location / {
        proxy_pass http://masstock_api;

        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

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
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://masstock_api/health;
    }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# N8N - n8n.masstock.fr (HTTP → HTTPS redirect)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server {
    listen 80;
    listen [::]:80;
    server_name n8n.masstock.fr;

    # ACME challenge for certificate renewal
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name n8n.masstock.fr;

    # SSL Configuration
    ssl_certificate ${cert_path}/fullchain.pem;
    ssl_certificate_key ${cert_path}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate ${cert_path}/chain.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Access logs
    access_log /var/log/nginx/masstock-n8n-access.log;
    error_log /var/log/nginx/masstock-n8n-error.log;

    # Client limits (for workflow data)
    client_max_body_size 50M;

    # Proxy to n8n container
    location / {
        proxy_pass http://masstock_n8n;

        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Connection settings (important for n8n websockets)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
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
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts for webhooks
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

    chmod 644 "$config_file"
    log_success "nginx configuration updated with SSL"
}

test_and_reload_nginx() {
    log_step "Testing and reloading nginx..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would test and reload nginx"
        return 0
    fi

    # Test config
    if nginx -t 2>&1; then
        log_success "nginx configuration is valid"
    else
        error_exit 56 "nginx configuration test failed" "Check syntax errors above"
    fi

    # Reload nginx
    if systemctl reload nginx; then
        log_success "nginx reloaded successfully"
    else
        error_exit 57 "Failed to reload nginx" "Check: systemctl status nginx"
    fi

    # Verify nginx is still running
    sleep 2
    if ! systemctl is-active --quiet nginx; then
        error_exit 58 "nginx stopped after reload" "Check logs: journalctl -u nginx -n 50"
    fi

    log_success "nginx is running with SSL configuration"
}

#####################################################################
# AUTO-RENEWAL SETUP
#####################################################################

setup_auto_renewal() {
    log_step "Configuring automatic certificate renewal..."

    # Check if certbot timer is enabled
    if systemctl is-enabled certbot.timer &> /dev/null; then
        log_success "certbot timer is already enabled"
    else
        log_info "Enabling certbot auto-renewal timer..."

        if [[ "${DRY_RUN:-0}" == "1" ]]; then
            log_warning "[DRY RUN] Would enable certbot.timer"
        else
            systemctl enable certbot.timer
            systemctl start certbot.timer
            log_success "Auto-renewal enabled"
        fi
    fi

    # Show renewal status
    log_info "Checking renewal configuration..."
    certbot renew --dry-run 2>&1 | tail -n 5 || true

    log_info "Certificates will auto-renew via systemd timer"
    log_info "Check status: systemctl status certbot.timer"
}

#####################################################################
# VERIFICATION
#####################################################################

verify_ssl() {
    log_step "Verifying SSL configuration..."

    local errors=0

    # Check certificate files exist
    local cert_path="/etc/letsencrypt/live/masstock.fr"

    if [[ ! -f "${cert_path}/fullchain.pem" ]]; then
        log_error "Certificate not found: ${cert_path}/fullchain.pem"
        errors=$((errors + 1))
    else
        log_debug "Certificate found: fullchain.pem"
    fi

    if [[ ! -f "${cert_path}/privkey.pem" ]]; then
        log_error "Private key not found: ${cert_path}/privkey.pem"
        errors=$((errors + 1))
    else
        log_debug "Private key found: privkey.pem"
    fi

    # Check certificate expiration
    if [[ -f "${cert_path}/fullchain.pem" ]]; then
        local expiry=$(openssl x509 -enddate -noout -in "${cert_path}/fullchain.pem" | cut -d= -f2)
        log_info "Certificate expires: $expiry"
    fi

    if [[ $errors -gt 0 ]]; then
        error_exit 59 "SSL verification failed" "Check certificate files"
    fi

    log_success "SSL certificates verified"
}

test_https_access() {
    log_step "Testing HTTPS access..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would test HTTPS access"
        return 0
    fi

    log_warning "Note: This test will fail if Docker containers are not running yet"
    log_info "To fully test SSL, run build-and-start.sh first"

    # Test certificate only (not the backend)
    for domain in "masstock.fr" "app.masstock.fr" "api.masstock.fr" "n8n.masstock.fr"; do
        log_debug "Testing SSL for: $domain"

        if timeout 5 openssl s_client -connect "$domain:443" -servername "$domain" </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
            log_success "SSL certificate valid for: $domain"
        else
            log_warning "Cannot verify SSL for $domain (containers may not be running yet)"
        fi
    done
}

print_next_steps() {
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  SSL CONFIGURATION COMPLETE"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_success "HTTPS enabled for:"
    echo "  • https://masstock.fr (site vitrine)"
    echo "  • https://app.masstock.fr (application)"
    echo "  • https://api.masstock.fr (API)"
    echo "  • https://n8n.masstock.fr (n8n)"
    echo ""

    log_info "🔒 Security features:"
    echo "  • TLS 1.2 & 1.3 enabled"
    echo "  • HTTP → HTTPS redirect"
    echo "  • HSTS enabled (strict transport security)"
    echo "  • Security headers configured"
    echo "  • Auto-renewal enabled (90-day cycle)"
    echo ""

    log_info "📅 Certificate renewal:"
    echo "  • Automatic via systemd timer"
    echo "  • Check status: systemctl status certbot.timer"
    echo "  • Manual renewal: certbot renew"
    echo "  • Test renewal: certbot renew --dry-run"
    echo ""

    if [[ $STAGING_MODE -eq 1 ]]; then
        log_warning "⚠️  STAGING CERTIFICATES IN USE"
        log_warning "    Browsers will show security warnings"
        log_warning "    Re-run without --staging for production certs"
        echo ""
    fi

    log_info "Next step:"
    log_info "  ./deploy/build-and-start.sh (start MasStock containers)"
    echo ""
}

#####################################################################
# MAIN EXECUTION
#####################################################################

main() {
    parse_ssl_args "$@"

    log_info "Starting SSL configuration..."
    echo ""

    # Install certbot
    install_certbot

    # Get email
    get_letsencrypt_email

    # Verify DNS
    verify_dns

    # Obtain certificates
    obtain_certificates

    # Update nginx with SSL
    update_nginx_with_ssl

    # Test and reload
    test_and_reload_nginx

    # Setup auto-renewal
    setup_auto_renewal

    # Verify
    verify_ssl
    test_https_access

    # Success
    print_success_summary
    print_next_steps
}

# Run main function
main "$@"
