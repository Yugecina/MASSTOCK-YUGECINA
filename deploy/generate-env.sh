#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - ENVIRONMENT GENERATOR
# Interactive script to generate production .env files securely
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
Usage: $0 [OPTIONS]

Interactively generates production environment files with secure secrets.

OPTIONS:
    -v, --verbose    Enable verbose output
    --dry-run        Preview without creating files
    -h, --help       Show this help message

CREATES:
    backend/.env.production    - Backend environment variables
    frontend/.env.production   - Frontend environment variables (optional for CI/CD)

SECURITY:
    - Secrets are entered interactively (not logged)
    - Crypto-secure random generation for JWT, encryption keys
    - Files are created with 600 permissions (owner read/write only)
    - Existing files are backed up before modification

EXAMPLES:
    $0                    # Interactive setup
    $0 --verbose          # With detailed output

EOF
}

#####################################################################
# CRYPTO FUNCTIONS
#####################################################################

generate_secret() {
    local length=${1:-64}
    openssl rand -base64 "$length" | tr -d '\n'
}

generate_jwt_secret() {
    generate_secret 64
}

generate_encryption_key() {
    generate_secret 32
}

generate_redis_password() {
    generate_secret 32
}

#####################################################################
# INPUT FUNCTIONS
#####################################################################

read_secret() {
    local prompt=$1
    local var_name=$2
    local default=$3
    local value

    if [[ -n "$default" ]]; then
        # Show hint for existing value (to stderr to avoid capture)
        echo -e "${YELLOW}[Press Enter to keep existing: ${default:0:20}...]${NC}" >&2
        # Read silently with prompt
        read -sp "$(echo -e ${CYAN}${prompt}${NC} )" value
        echo "" >&2  # New line after hidden input
        value=${value:-$default}
    else
        read -sp "$(echo -e ${CYAN}${prompt}${NC} )" value
        echo "" >&2  # New line after hidden input
    fi

    echo "$value"
}

read_input() {
    local prompt=$1
    local var_name=$2
    local default=$3
    local value

    if [[ -n "$default" ]]; then
        read -p "$(echo -e ${CYAN}${prompt}${NC} ${YELLOW}[${default}]${NC} )" value
        value=${value:-$default}
    else
        read -p "$(echo -e ${CYAN}${prompt}${NC} )" value
    fi

    echo "$value"
}

validate_url() {
    local url=$1
    if [[ ! "$url" =~ ^https?:// ]]; then
        return 1
    fi
    return 0
}

validate_not_empty() {
    local value=$1
    if [[ -z "$value" ]]; then
        return 1
    fi
    return 0
}

#####################################################################
# BACKEND ENV GENERATION
#####################################################################

generate_backend_env() {
    log_step "Generating backend/.env.production"

    local env_file="$PROJECT_ROOT/backend/.env.production"
    local existing_env=""

    # Backup existing file
    if [[ -f "$env_file" ]]; then
        log_info "Existing .env.production found"
        if confirm "Load existing values as defaults?"; then
            existing_env="$env_file"
            source "$env_file" 2>/dev/null || true
        fi

        backup_file "$env_file"
    fi

    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  BACKEND ENVIRONMENT CONFIGURATION"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Supabase Configuration
    log_info "📦 SUPABASE CONFIGURATION"
    log_info "Get these from: https://app.supabase.com/project/_/settings/api"
    echo ""

    local supabase_url
    while true; do
        supabase_url=$(read_input "Supabase URL (https://xxxxx.supabase.co):" "SUPABASE_URL" "$SUPABASE_URL")
        # Trim whitespace
        supabase_url=$(echo "$supabase_url" | xargs)

        # Validate: must start with https:// and contain supabase.co
        if [[ "$supabase_url" =~ ^https:// ]] && [[ "$supabase_url" =~ supabase\.co ]]; then
            break
        else
            log_error "Invalid Supabase URL. Format: https://xxxxx.supabase.co"
            echo "  Received: '$supabase_url'"
        fi
    done

    echo ""
    local supabase_anon_key
    while true; do
        supabase_anon_key=$(read_secret "Supabase Anon Key (public key):" "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY")
        echo ""
        if validate_not_empty "$supabase_anon_key"; then
            break
        else
            log_error "Anon key cannot be empty"
        fi
    done

    local supabase_service_key
    while true; do
        supabase_service_key=$(read_secret "Supabase Service Role Key (secret!):" "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY")
        echo ""
        if validate_not_empty "$supabase_service_key"; then
            break
        else
            log_error "Service role key cannot be empty"
        fi
    done

    # Gemini API (optional - clients provide their own)
    echo ""
    log_info "🤖 GEMINI API CONFIGURATION"
    log_warning "Note: Clients provide their own API keys in the interface"
    log_info "Press Enter to skip (recommended for production)"
    echo ""

    local gemini_api_key=$(read_secret "Server Gemini API Key (optional, press Enter to skip):" "GEMINI_API_KEY" "$GEMINI_API_KEY")
    echo ""

    # Auto-generated secrets
    echo ""
    log_info "🔐 GENERATING SECURE SECRETS"
    echo ""

    local jwt_secret=${JWT_SECRET:-$(generate_jwt_secret)}
    log_success "JWT_SECRET generated (${#jwt_secret} chars)"

    local encryption_key=${ENCRYPTION_KEY:-$(generate_encryption_key)}
    log_success "ENCRYPTION_KEY generated (${#encryption_key} chars)"

    local redis_password=${REDIS_PASSWORD:-$(generate_redis_password)}
    log_success "REDIS_PASSWORD generated (${#redis_password} chars)"

    # Domain configuration
    echo ""
    log_info "🌐 DOMAIN CONFIGURATION"
    echo ""

    local cors_origin=$(read_input "Frontend domain (https://dorian-gonzalez.fr):" "CORS_ORIGIN" "${CORS_ORIGIN:-https://dorian-gonzalez.fr}")

    # Other settings
    local node_env="production"
    local port="3000"
    local redis_host="redis"
    local redis_port="6379"
    local log_level="info"

    # Worker & Rate Limiting Configuration (Tier 1)
    local worker_concurrency="3"
    local gemini_rate_limit_flash="500"
    local gemini_rate_limit_pro="100"
    local gemini_rate_window="60000"
    local prompt_concurrency_flash="15"
    local prompt_concurrency_pro="10"

    # Write .env file
    log_step "Writing backend/.env.production..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would create: $env_file"
        return 0
    fi

    cat > "$env_file" << EOF
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MASSTOCK - PRODUCTION ENVIRONMENT
# Generated: $(date)
# ⚠️  NEVER commit this file to git!
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Node Environment
NODE_ENV=$node_env
PORT=$port

# Supabase Configuration
SUPABASE_URL=$supabase_url
SUPABASE_ANON_KEY=$supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=$supabase_service_key

# Redis Configuration
REDIS_HOST=$redis_host
REDIS_PORT=$redis_port
REDIS_PASSWORD=$redis_password

# Security Keys (auto-generated)
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=15m
ENCRYPTION_KEY=$encryption_key

# CORS Configuration
CORS_ORIGIN=$cors_origin

# Logging
LOG_LEVEL=$log_level

# Worker Concurrency
WORKER_CONCURRENCY=$worker_concurrency

# Gemini API Rate Limiting (Tier 1 - Dynamic per model)
# Flash models: Fast, high volume (gemini-2.5-flash)
GEMINI_RATE_LIMIT_FLASH=$gemini_rate_limit_flash
PROMPT_CONCURRENCY_FLASH=$prompt_concurrency_flash

# Pro models: High quality, slower (gemini-3-pro)
GEMINI_RATE_LIMIT_PRO=$gemini_rate_limit_pro
PROMPT_CONCURRENCY_PRO=$prompt_concurrency_pro

# Rate limit time window (milliseconds)
GEMINI_RATE_WINDOW=$gemini_rate_window

EOF

    # Add Gemini API if provided
    if [[ -n "$gemini_api_key" ]]; then
        cat >> "$env_file" << EOF
# Gemini AI Configuration
GEMINI_API_KEY=$gemini_api_key

EOF
    fi

    # Set secure permissions
    chmod 600 "$env_file"

    log_success "Backend .env.production created with 600 permissions"
    log_info "Location: $env_file"
}

#####################################################################
# FRONTEND ENV GENERATION
#####################################################################

generate_frontend_env() {
    log_step "Generating frontend/.env.production (for local builds)"

    local env_file="$PROJECT_ROOT/frontend/.env.production"

    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  FRONTEND ENVIRONMENT CONFIGURATION"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_info "Note: This file is for local production builds."
    log_info "GitHub Actions will inject these values during CI/CD."
    echo ""

    if ! confirm "Create frontend/.env.production?"; then
        log_info "Skipping frontend .env creation"
        return 0
    fi

    # Backup existing file
    if [[ -f "$env_file" ]]; then
        backup_file "$env_file"
    fi

    local api_url=$(read_input "API URL (https://api.dorian-gonzalez.fr/api):" "VITE_API_URL" "https://api.dorian-gonzalez.fr/api")
    local vite_env="production"

    # Write .env file
    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would create: $env_file"
        return 0
    fi

    cat > "$env_file" << EOF
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MASSTOCK FRONTEND - PRODUCTION ENVIRONMENT
# Generated: $(date)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# API Configuration
VITE_API_URL=$api_url

# Environment
VITE_ENV=$vite_env

# Logging (none in production)
VITE_LOG_LEVEL=none
EOF

    chmod 600 "$env_file"

    log_success "Frontend .env.production created"
    log_info "Location: $env_file"
}

#####################################################################
# VERIFICATION
#####################################################################

verify_env_files() {
    log_step "Verifying environment files..."

    local backend_env="$PROJECT_ROOT/backend/.env.production"
    local errors=0

    if [[ ! -f "$backend_env" ]]; then
        log_error "Backend .env.production not found"
        errors=$((errors + 1))
    else
        log_debug "Checking backend .env variables..."

        # Source and check required variables
        source "$backend_env"

        local required_vars=(
            "NODE_ENV"
            "SUPABASE_URL"
            "SUPABASE_ANON_KEY"
            "SUPABASE_SERVICE_ROLE_KEY"
            "REDIS_PASSWORD"
            "JWT_SECRET"
            "ENCRYPTION_KEY"
        )

        for var in "${required_vars[@]}"; do
            if [[ -z "${!var}" ]]; then
                log_error "Missing required variable: $var"
                errors=$((errors + 1))
            else
                log_debug "✓ $var is set"
            fi
        done
    fi

    if [[ $errors -gt 0 ]]; then
        error_exit 20 "Environment verification failed" "Re-run script to fix missing variables"
    fi

    log_success "Environment files verified"
}

#####################################################################
# GITHUB SECRETS GUIDE
#####################################################################

print_github_secrets_guide() {
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  GITHUB SECRETS CONFIGURATION"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_info "For automatic deployment, configure these secrets in GitHub:"
    log_info "Repository → Settings → Secrets and variables → Actions → New secret"
    echo ""

    echo -e "${YELLOW}Required secrets:${NC}"
    echo ""
    echo "  SSH_PRIVATE_KEY       Your SSH private key for VPS access"
    echo "  SSH_KNOWN_HOSTS       VPS host fingerprint"
    echo "  VPS_HOST              VPS IP or domain (dorian-gonzalez.fr)"
    echo "  VPS_USER              SSH username (root or masstock)"
    echo "  VITE_API_URL          https://api.dorian-gonzalez.fr/api/v1"
    echo ""

    log_info "To get SSH_KNOWN_HOSTS, run on your local machine:"
    echo -e "${CYAN}  ssh-keyscan dorian-gonzalez.fr${NC}"
    echo ""

    log_info "To get SSH_PRIVATE_KEY, run on your local machine:"
    echo -e "${CYAN}  cat ~/.ssh/id_rsa${NC} (or your specific key)"
    echo ""
}

#####################################################################
# MAIN EXECUTION
#####################################################################

main() {
    log_info "Starting environment generation..."
    log_info "Project root: $PROJECT_ROOT"
    echo ""

    # Check dependencies
    check_command "openssl" 14 "Install with: apt-get install openssl"

    # Generate backend env
    generate_backend_env

    echo ""

    # Generate frontend env (optional)
    generate_frontend_env

    echo ""

    # Verify
    verify_env_files

    echo ""
    print_success_summary

    log_info "✅ Environment files created successfully!"
    echo ""
    log_info "📁 Files created:"
    log_info "   - backend/.env.production (600 permissions)"
    if [[ -f "$PROJECT_ROOT/frontend/.env.production" ]]; then
        log_info "   - frontend/.env.production (600 permissions)"
    fi
    echo ""

    log_warning "⚠️  IMPORTANT SECURITY NOTES:"
    log_info "   - These files are in .gitignore (never commit them!)"
    log_info "   - Keep backups in a secure location"
    log_info "   - Rotate secrets regularly"
    echo ""

    print_github_secrets_guide

    log_info "Next steps:"
    log_info "  1. Configure GitHub Secrets (see guide above)"
    log_info "  2. Run: ./deploy/setup-nginx-vps.sh"
    log_info "  3. Run: ./deploy/setup-ssl.sh"
    log_info "  4. Run: ./deploy/build-and-start.sh"
    log_info ""
    log_info "Or run everything at once:"
    log_info "  sudo ./deploy/master-deploy.sh"
    echo ""
}

# Run main function
main "$@"
