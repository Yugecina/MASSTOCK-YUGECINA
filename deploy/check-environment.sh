#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - ENVIRONMENT CHECK
# Verifies all prerequisites are met before deployment
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

Checks if the VPS environment is ready for MasStock deployment.

OPTIONS:
    -v, --verbose    Enable verbose output
    --dry-run        Run checks without making changes
    -h, --help       Show this help message

CHECKS PERFORMED:
    - Operating system compatibility
    - Docker and Docker Compose installation
    - Required ports availability (80, 443, 3000, 6379, 8080)
    - Disk space (minimum 10GB free)
    - Memory (minimum 2GB)
    - User permissions
    - Git installation
    - Network connectivity

EXIT CODES:
    0   All checks passed
    1-99 Specific check failed (see error code)

EXAMPLES:
    $0                    # Run all checks
    $0 --verbose          # Run with detailed output
    $0 --dry-run          # Preview checks without system changes

EOF
}

#####################################################################
# CHECK FUNCTIONS
#####################################################################

check_os() {
    log_step "Checking operating system..."

    if [[ ! -f /etc/os-release ]]; then
        error_exit 1 "Cannot detect OS - /etc/os-release not found" "This script requires a Linux distribution"
    fi

    source /etc/os-release

    log_info "OS: $NAME $VERSION"
    log_info "ID: $ID"

    # Supported: Ubuntu, Debian, CentOS, RHEL, Fedora
    case "$ID" in
        ubuntu|debian|centos|rhel|fedora)
            log_success "Operating system is supported"
            ;;
        *)
            log_warning "OS '$ID' is not officially tested"
            if ! confirm "Continue anyway?"; then
                exit 0
            fi
            ;;
    esac
}

check_docker() {
    log_step "Checking Docker installation..."

    if ! command -v docker &> /dev/null; then
        error_exit 2 "Docker is not installed" "Install with: curl -fsSL https://get.docker.com | sh"
    fi

    local docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
    log_info "Docker version: $docker_version"

    # Check if docker daemon is running
    if ! docker info &> /dev/null; then
        error_exit 3 "Docker daemon is not running" "Start with: sudo systemctl start docker"
    fi

    log_success "Docker is installed and running"
}

check_docker_compose() {
    log_step "Checking Docker Compose installation..."

    # Check for Docker Compose V2 (plugin)
    if docker compose version &> /dev/null; then
        local compose_version=$(docker compose version | awk '{print $4}')
        log_info "Docker Compose version: $compose_version (plugin)"
        log_success "Docker Compose is installed"
        return 0
    fi

    # Check for Docker Compose V1 (standalone)
    if command -v docker-compose &> /dev/null; then
        local compose_version=$(docker-compose --version | awk '{print $4}' | sed 's/,//')
        log_info "Docker Compose version: $compose_version (standalone)"
        log_warning "Consider upgrading to Docker Compose V2 (plugin)"
        log_success "Docker Compose is installed"
        return 0
    fi

    error_exit 4 "Docker Compose is not installed" "Install with: apt-get install docker-compose-plugin (or docker-compose)"
}

check_ports() {
    log_step "Checking port availability..."

    local ports=(80 443 3000 6379 8080)
    local blocked_ports=()

    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
            local process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            log_warning "Port $port is in use by $process (PID: $pid)"
            blocked_ports+=("$port:$process:$pid")
        else
            log_debug "Port $port is available"
        fi
    done

    if [[ ${#blocked_ports[@]} -gt 0 ]]; then
        log_info "Blocked ports detected:"
        for entry in "${blocked_ports[@]}"; do
            IFS=':' read -r port process pid <<< "$entry"
            echo "  - Port $port: $process (PID: $pid)"
        done

        # Special handling for common cases
        if [[ " ${blocked_ports[@]} " =~ " 80:" ]] || [[ " ${blocked_ports[@]} " =~ " 443:" ]]; then
            log_info ""
            log_info "Ports 80/443 are typically used by nginx or apache."
            log_info "If this is the nginx managing n8n, we'll configure it to proxy to MasStock."
            if ! confirm "Continue with port conflict resolution?"; then
                error_exit 5 "Port availability check failed" "Free required ports before deployment"
            fi
        else
            error_exit 5 "Critical ports are in use" "Stop services or change port configuration"
        fi
    else
        log_success "All required ports are available"
    fi
}

check_disk_space() {
    log_step "Checking disk space..."

    local min_gb=10
    local available_gb=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
    local total_gb=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $2}' | sed 's/G//')
    local used_gb=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $3}' | sed 's/G//')

    log_info "Disk: ${used_gb}GB used / ${total_gb}GB total (${available_gb}GB free)"

    if [[ $available_gb -lt $min_gb ]]; then
        error_exit 6 "Insufficient disk space" "Available: ${available_gb}GB, Required: ${min_gb}GB minimum"
    fi

    log_success "Disk space is sufficient"
}

check_memory() {
    log_step "Checking memory..."

    local min_mb=2048
    local total_mb=$(free -m | awk 'NR==2 {print $2}')
    local available_mb=$(free -m | awk 'NR==2 {print $7}')

    log_info "Memory: ${available_mb}MB available / ${total_mb}MB total"

    if [[ $available_mb -lt $min_mb ]]; then
        log_warning "Low memory detected (${available_mb}MB available, ${min_mb}MB recommended)"
        log_info "MasStock may run slower with less than 2GB available"
        if ! confirm "Continue anyway?"; then
            exit 0
        fi
    else
        log_success "Memory is sufficient"
    fi
}

check_user_permissions() {
    log_step "Checking user permissions..."

    local current_user=$(whoami)
    log_info "Current user: $current_user"

    # Check if user can run docker commands
    if ! docker ps &> /dev/null; then
        if [[ $EUID -eq 0 ]]; then
            log_debug "Running as root - OK"
        else
            error_exit 7 "User '$current_user' cannot run docker commands" "Add user to docker group: sudo usermod -aG docker $current_user && newgrp docker"
        fi
    else
        log_success "User has docker permissions"
    fi

    # Check write permissions
    if [[ ! -w "$PROJECT_ROOT" ]]; then
        error_exit 8 "No write permissions in $PROJECT_ROOT" "Fix with: sudo chown -R $current_user:$current_user $PROJECT_ROOT"
    fi

    log_debug "Write permissions OK"
}

check_git() {
    log_step "Checking Git installation..."

    check_command "git" 9 "Install with: apt-get install git (or yum install git)"

    local git_version=$(git --version | awk '{print $3}')
    log_info "Git version: $git_version"

    # Check if we're in a git repo
    if ! git -C "$PROJECT_ROOT" rev-parse --git-dir &> /dev/null; then
        log_warning "Not in a git repository"
        log_info "This is OK for manual deployment, but CI/CD won't work"
    else
        local branch=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD)
        local commit=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)
        log_info "Git branch: $branch ($commit)"
        log_success "Git repository detected"
    fi
}

check_network() {
    log_step "Checking network connectivity..."

    # Check internet connection
    if ! ping -c 1 8.8.8.8 &> /dev/null; then
        error_exit 10 "No internet connectivity" "Check network connection"
    fi

    log_debug "Internet connectivity OK"

    # Check DNS resolution
    if ! ping -c 1 google.com &> /dev/null; then
        log_warning "DNS resolution issues detected"
        log_info "Internet works but DNS may be slow"
    fi

    # Check Docker Hub access
    if ! curl -fsSL https://hub.docker.com &> /dev/null; then
        log_warning "Cannot reach Docker Hub"
        log_info "Docker image pulls may fail"
    else
        log_debug "Docker Hub accessible"
    fi

    log_success "Network connectivity OK"
}

check_dependencies() {
    log_step "Checking system dependencies..."

    local deps=(curl wget lsof)
    local missing=()

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
            log_warning "Missing: $dep"
        else
            log_debug "Found: $dep"
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_warning "Missing dependencies: ${missing[*]}"
        log_info "Install with: apt-get install ${missing[*]} (or yum install)"

        if ! confirm "Continue without these dependencies?"; then
            error_exit 11 "Required dependencies missing" "Install: ${missing[*]}"
        fi
    else
        log_success "All dependencies installed"
    fi
}

check_project_structure() {
    log_step "Checking project structure..."

    local required_dirs=(
        "$PROJECT_ROOT/backend"
        "$PROJECT_ROOT/frontend"
        "$PROJECT_ROOT/deploy"
    )

    local required_files=(
        "$PROJECT_ROOT/backend/package.json"
        "$PROJECT_ROOT/frontend/package.json"
        "$PROJECT_ROOT/docker-compose.production.yml"
    )

    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            error_exit 12 "Required directory not found: $dir" "Ensure you're in the MasStock project root"
        fi
        log_debug "Found directory: $dir"
    done

    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error_exit 13 "Required file not found: $file" "Ensure project is complete"
        fi
        log_debug "Found file: $file"
    done

    log_success "Project structure is valid"
}

#####################################################################
# MAIN EXECUTION
#####################################################################

main() {
    log_info "Starting environment check..."
    log_info "Project root: $PROJECT_ROOT"
    echo ""

    # Run all checks
    check_os
    check_docker
    check_docker_compose
    check_git
    check_dependencies
    check_disk_space
    check_memory
    check_user_permissions
    check_network
    check_ports
    check_project_structure

    echo ""
    print_success_summary
    log_info "Environment is ready for MasStock deployment! 🚀"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Run: ./deploy/generate-env.sh (configure environment variables)"
    log_info "  2. Run: ./deploy/master-deploy.sh (full deployment)"
    echo ""
}

# Run main function
main "$@"
