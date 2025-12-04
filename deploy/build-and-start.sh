#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - BUILD AND START
# Builds Docker images and starts all MasStock containers
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

Builds and starts all MasStock Docker containers.

OPTIONS:
    -v, --verbose    Enable verbose output
    --dry-run        Preview without building/starting
    --rebuild        Force rebuild all images (no cache)
    --no-build       Skip build, only start existing containers
    -h, --help       Show this help message

WHAT THIS DOES:
    1. Builds frontend (React → /dist)
    2. Builds Docker images (api, worker, nginx)
    3. Starts all containers via docker-compose
    4. Waits for health checks to pass
    5. Verifies all services are running

CONTAINERS STARTED:
    • redis         - Job queue (Bull)
    • api           - Backend Express server
    • worker        - Background job processor
    • nginx         - Reverse proxy + static files

EXAMPLES:
    $0                  # Normal build and start
    $0 --rebuild        # Force full rebuild (no cache)
    $0 --no-build       # Just start existing containers
    $0 --verbose        # Show detailed build output

EOF
}

# Options
REBUILD=0
NO_BUILD=0

#####################################################################
# PARSE ARGUMENTS
#####################################################################

parse_build_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --rebuild)
                REBUILD=1
                log_info "Force rebuild enabled (no cache)"
                shift
                ;;
            --no-build)
                NO_BUILD=1
                log_info "Skip build mode enabled"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
}

#####################################################################
# PRE-FLIGHT CHECKS
#####################################################################

check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error_exit 60 "Docker not installed" "Install Docker first"
    fi

    # Check Docker Compose
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        error_exit 61 "Docker Compose not installed" "Install Docker Compose plugin"
    fi

    # Check docker daemon
    if ! docker info &> /dev/null; then
        error_exit 62 "Docker daemon not running" "Start with: systemctl start docker"
    fi

    # Check .env.production exists
    if [[ ! -f "$PROJECT_ROOT/backend/.env.production" ]]; then
        error_exit 63 "Backend .env.production not found" "Run: ./deploy/generate-env.sh"
    fi

    # Check docker-compose.production.yml exists
    if [[ ! -f "$PROJECT_ROOT/docker-compose.production.yml" ]]; then
        error_exit 64 "docker-compose.production.yml not found" "File missing from project"
    fi

    log_success "Prerequisites check passed"
}

check_disk_space() {
    log_step "Checking disk space for build..."

    local min_gb=5
    local available_gb=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')

    log_info "Available disk space: ${available_gb}GB"

    if [[ $available_gb -lt $min_gb ]]; then
        log_warning "Low disk space: ${available_gb}GB (recommended: ${min_gb}GB)"
        if ! confirm "Continue with low disk space?"; then
            error_exit 65 "Insufficient disk space" "Free up space and try again"
        fi
    else
        log_success "Disk space sufficient"
    fi
}

#####################################################################
# FRONTEND BUILD
#####################################################################

build_frontend() {
    if [[ $NO_BUILD -eq 1 ]]; then
        log_info "Skipping frontend build (--no-build)"
        return 0
    fi

    log_step "Building frontend (React app)..."

    cd "$PROJECT_ROOT/frontend"

    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing frontend dependencies..."
        run_command "npm install" npm install
    fi

    # Build production bundle
    log_info "Building production bundle..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would build frontend"
        cd "$PROJECT_ROOT"
        return 0
    fi

    # Set production env variables for build
    export VITE_API_URL="https://api.dorian-gonzalez.fr/api"
    export VITE_ENV="production"
    export VITE_LOG_LEVEL="none"

    if run_command "Building frontend" npm run build; then
        log_success "Frontend built successfully"

        # Verify dist folder
        if [[ -d "dist" ]]; then
            local size=$(du -sh dist | awk '{print $1}')
            log_info "Build output: frontend/dist ($size)"
        else
            error_exit 66 "Frontend build failed - dist folder not created"
        fi
    else
        error_exit 67 "Frontend build failed" "Check npm build output above"
    fi

    cd "$PROJECT_ROOT"
}

#####################################################################
# DOCKER BUILD
#####################################################################

build_docker_images() {
    if [[ $NO_BUILD -eq 1 ]]; then
        log_info "Skipping Docker build (--no-build)"
        return 0
    fi

    log_step "Building Docker images..."

    cd "$PROJECT_ROOT"

    local build_args=""

    if [[ $REBUILD -eq 1 ]]; then
        build_args+=" --no-cache"
        log_info "Building without cache (--rebuild)"
    fi

    if [[ "${VERBOSE:-0}" == "1" ]]; then
        build_args+=" --progress=plain"
    fi

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would build Docker images"
        return 0
    fi

    # Build images
    log_info "This may take several minutes on first build..."

    if docker compose version &> /dev/null; then
        # Docker Compose V2 (plugin)
        local cmd="docker compose -f docker-compose.production.yml build $build_args"
    else
        # Docker Compose V1 (standalone)
        local cmd="docker-compose -f docker-compose.production.yml build $build_args"
    fi

    if run_command "Building Docker images" $cmd; then
        log_success "Docker images built successfully"
    else
        error_exit 68 "Docker build failed" "Check build output above"
    fi
}

#####################################################################
# CONTAINER MANAGEMENT
#####################################################################

free_required_ports() {
    log_step "Checking and freeing required ports..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would check ports"
        return 0
    fi

    # Ports needed by MasStock containers
    local ports=(8080 3000)

    for port in "${ports[@]}"; do
        log_debug "Checking port $port..."

        # Check if port is in use
        local pid=$(lsof -ti :$port 2>/dev/null)

        if [[ -n "$pid" ]]; then
            local process_info=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            log_warning "Port $port is in use by PID $pid ($process_info)"

            # Kill the process using the port
            log_info "Killing process $pid to free port $port..."
            if kill -9 $pid 2>/dev/null; then
                log_success "Port $port freed (killed PID $pid)"
                sleep 1  # Wait for port to be fully released
            else
                log_warning "Could not kill PID $pid (may require sudo)"
            fi
        else
            log_debug "Port $port is available"
        fi
    done

    log_success "Port check complete"
}

stop_existing_containers() {
    log_step "Stopping existing containers..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would stop containers"
        return 0
    fi

    # Check if containers are running
    if docker compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps --quiet 2>/dev/null | grep -q .; then
        log_info "Stopping running containers..."

        if docker compose version &> /dev/null; then
            docker compose --env-file backend/.env.production -f docker-compose.production.yml down
        else
            docker-compose --env-file backend/.env.production -f docker-compose.production.yml down
        fi

        log_success "Containers stopped"
    else
        log_debug "No running containers to stop"
    fi
}

start_containers() {
    log_step "Starting MasStock containers..."

    cd "$PROJECT_ROOT"

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would start containers"
        return 0
    fi

    # Start containers with env file
    if docker compose version &> /dev/null; then
        local cmd="docker compose --env-file backend/.env.production -f docker-compose.production.yml up -d"
    else
        local cmd="docker-compose --env-file backend/.env.production -f docker-compose.production.yml up -d"
    fi

    if run_command "Starting containers" $cmd; then
        log_success "Containers started"
    else
        error_exit 69 "Failed to start containers" "Check docker-compose output above"
    fi
}

#####################################################################
# HEALTH CHECKS
#####################################################################

wait_for_containers() {
    log_step "Waiting for containers to be healthy..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would wait for health checks"
        return 0
    fi

    local max_wait=180  # 3 minutes
    local elapsed=0
    local check_interval=5

    while [[ $elapsed -lt $max_wait ]]; do
        # Check container status
        local unhealthy_count=0

        # Get container statuses
        if docker compose version &> /dev/null; then
            local containers=$(docker compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps --format json 2>/dev/null || echo "[]")
        else
            # Fallback for older docker-compose
            local containers=$(docker ps --filter "name=masstock" --format "{{.Names}}" 2>/dev/null || echo "")
        fi

        # Check each critical container (excluding worker - it has no health check)
        for container in masstock_redis masstock_api masstock_app masstock_vitrine masstock_n8n; do
            if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
                # Check health status
                local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")

                if [[ "$health" == "healthy" ]] || [[ "$health" == "none" ]]; then
                    log_debug "$container is healthy"
                else
                    log_debug "$container health: $health"
                    unhealthy_count=$((unhealthy_count + 1))
                fi
            else
                log_warning "$container is not running"
                unhealthy_count=$((unhealthy_count + 1))
            fi
        done

        # Special check for worker: just verify it's running (no health check needed)
        if docker ps --filter "name=masstock_worker" --filter "status=running" | grep -q "masstock_worker"; then
            log_debug "masstock_worker is running (no health check)"
        else
            log_warning "masstock_worker is not running"
            unhealthy_count=$((unhealthy_count + 1))
        fi

        if [[ $unhealthy_count -eq 0 ]]; then
            log_success "All containers are healthy!"
            return 0
        fi

        log_debug "Waiting for $unhealthy_count container(s) to be healthy... (${elapsed}s/${max_wait}s)"
        sleep $check_interval
        elapsed=$((elapsed + check_interval))
    done

    error_exit 70 "Containers did not become healthy within ${max_wait}s" "Check logs: docker compose -f docker-compose.production.yml logs"
}

verify_containers() {
    log_step "Verifying container status..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would verify containers"
        return 0
    fi

    local errors=0

    # Expected containers
    local containers=("masstock_redis" "masstock_api" "masstock_worker" "masstock_app" "masstock_vitrine" "masstock_n8n")

    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            local uptime=$(docker ps --filter "name=$container" --format "{{.Status}}" | awk '{print $2, $3}')
            log_success "$container is running ($uptime)"
        else
            log_error "$container is not running"
            errors=$((errors + 1))
        fi
    done

    if [[ $errors -gt 0 ]]; then
        error_exit 71 "$errors container(s) failed to start" "Check logs for failed containers"
    fi

    log_success "All containers verified"
}

#####################################################################
# SERVICE TESTS
#####################################################################

test_services() {
    log_step "Testing services..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would test services"
        return 0
    fi

    # Test Redis
    log_debug "Testing Redis..."
    if docker exec masstock_redis redis-cli --raw incr ping &> /dev/null; then
        log_success "✓ Redis is responding"
    else
        log_error "✗ Redis is not responding"
    fi

    # Test API health endpoint
    log_debug "Testing API..."
    if docker exec masstock_api wget --spider -q http://localhost:3000/health 2>/dev/null; then
        log_success "✓ API is responding"
    else
        log_warning "⚠ API health check failed (may still be starting)"
    fi

    # Test Worker logs
    log_debug "Checking Worker..."
    if docker logs masstock_worker --tail 5 2>&1 | grep -q "Worker started\|Waiting for jobs\|Processing"; then
        log_success "✓ Worker is active"
    else
        log_debug "Worker logs:"
        docker logs masstock_worker --tail 10 2>&1 | sed 's/^/    /' || true
    fi

    # Test nginx
    log_debug "Testing nginx..."
    if docker exec masstock_app wget --spider -q http://localhost:80/health 2>/dev/null; then
        log_success "✓ nginx is responding"
    else
        log_warning "⚠ nginx health check failed"
    fi
}

#####################################################################
# SHOW STATUS
#####################################################################

show_container_status() {
    log_step "Container status summary..."

    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  CONTAINER STATUS"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would show container status"
        return 0
    fi

    # Show docker compose ps
    if docker compose version &> /dev/null; then
        docker compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps
    else
        docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps
    fi

    echo ""
}

print_access_info() {
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  MASSTOCK IS LIVE!"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_success "Services are running:"
    echo ""
    echo "  🌐 Frontend:  https://dorian-gonzalez.fr"
    echo "  🔌 API:       https://api.dorian-gonzalez.fr"
    echo "  📊 Health:    https://api.dorian-gonzalez.fr/health"
    echo ""

    log_info "Useful commands:"
    echo ""
    echo "  # View logs"
    echo "  docker compose -f docker-compose.production.yml logs -f [service]"
    echo ""
    echo "  # Restart a service"
    echo "  docker compose -f docker-compose.production.yml restart [service]"
    echo ""
    echo "  # Stop all"
    echo "  docker compose -f docker-compose.production.yml down"
    echo ""
    echo "  # Run health check"
    echo "  ./deploy/health-check.sh"
    echo ""

    log_info "Monitor logs:"
    echo "  docker compose -f docker-compose.production.yml logs -f"
    echo ""
}

#####################################################################
# MAIN EXECUTION
#####################################################################

main() {
    parse_build_args "$@"

    log_info "Starting MasStock deployment build..."
    log_info "Project root: $PROJECT_ROOT"
    echo ""

    # Pre-flight checks
    check_prerequisites
    check_disk_space

    # Build frontend
    build_frontend

    # Build Docker images
    build_docker_images

    # Stop existing containers
    stop_existing_containers

    # Free required ports (kill processes using 8080, 3000)
    free_required_ports

    # Start containers
    start_containers

    # Wait for health checks
    wait_for_containers

    # Verify all containers
    verify_containers

    # Test services
    test_services

    # Show status
    show_container_status

    # Success
    print_success_summary
    print_access_info
}

# Run main function
main "$@"
