#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - ROLLBACK
# Rolls back to previous version in case of deployment failure
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

Rolls back MasStock to the previous working version.

OPTIONS:
    -v, --verbose       Enable verbose output
    --dry-run           Preview rollback without executing
    --to-commit HASH    Roll back to specific git commit
    -h, --help          Show this help message

WHAT THIS DOES:
    1. Stops current containers
    2. Reverts code to previous commit (git)
    3. Restores previous .env files (if backed up)
    4. Rebuilds and restarts containers
    5. Runs health checks

SAFETY:
    - Creates backup before rollback
    - Can rollback to specific commit
    - Preserves database data (Supabase)
    - Preserves Redis data

WARNING:
    This will overwrite current code with previous version!

EXAMPLES:
    $0                          # Rollback to previous commit
    $0 --to-commit abc123       # Rollback to specific commit
    $0 --dry-run                # Preview rollback

EOF
}

# Options
TARGET_COMMIT=""

#####################################################################
# PARSE ARGUMENTS
#####################################################################

parse_rollback_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --to-commit)
                TARGET_COMMIT="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
}

#####################################################################
# GIT CHECKS
#####################################################################

check_git_repo() {
    log_step "Checking git repository..."

    if ! git -C "$PROJECT_ROOT" rev-parse --git-dir &> /dev/null; then
        error_exit 80 "Not a git repository" "Cannot rollback without git"
    fi

    log_success "Git repository detected"
}

get_current_commit() {
    local current=$(git -C "$PROJECT_ROOT" rev-parse HEAD)
    local current_short=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)
    local branch=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD)

    log_info "Current: $branch @ $current_short"
    echo "$current"
}

determine_rollback_target() {
    log_step "Determining rollback target..."

    if [[ -n "$TARGET_COMMIT" ]]; then
        # Validate provided commit
        if ! git -C "$PROJECT_ROOT" cat-file -e "$TARGET_COMMIT" 2>/dev/null; then
            error_exit 81 "Invalid commit: $TARGET_COMMIT"
        fi

        log_info "Rollback target: $TARGET_COMMIT (manually specified)"
        echo "$TARGET_COMMIT"
    else
        # Get previous commit
        local previous=$(git -C "$PROJECT_ROOT" rev-parse HEAD~1 2>/dev/null || echo "")

        if [[ -z "$previous" ]]; then
            error_exit 82 "No previous commit found" "Cannot rollback from first commit"
        fi

        local previous_short=$(git -C "$PROJECT_ROOT" rev-parse --short "$previous")
        local previous_message=$(git -C "$PROJECT_ROOT" log --format=%B -n 1 "$previous" | head -n1)

        log_info "Rollback target: $previous_short"
        log_info "Message: $previous_message"

        echo "$previous"
    fi
}

show_git_diff() {
    log_step "Changes to be reverted..."

    local target=$1
    local current=$(git -C "$PROJECT_ROOT" rev-parse HEAD)

    echo ""
    log_info "Commits to be undone:"
    git -C "$PROJECT_ROOT" log --oneline "$target..$current" | sed 's/^/  /'
    echo ""

    if ! confirm "Proceed with rollback?"; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
}

#####################################################################
# BACKUP BEFORE ROLLBACK
#####################################################################

create_rollback_backup() {
    log_step "Creating backup before rollback..."

    local backup_dir="/var/backups/masstock/rollback-$(date +%Y%m%d-%H%M%S)"

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would create backup at: $backup_dir"
        return 0
    fi

    mkdir -p "$backup_dir"

    # Backup current commit info
    git -C "$PROJECT_ROOT" rev-parse HEAD > "$backup_dir/commit.txt"
    git -C "$PROJECT_ROOT" diff > "$backup_dir/uncommitted-changes.diff" 2>/dev/null || true

    # Backup .env files
    if [[ -f "$PROJECT_ROOT/backend/.env.production" ]]; then
        cp "$PROJECT_ROOT/backend/.env.production" "$backup_dir/backend.env.production"
    fi

    if [[ -f "$PROJECT_ROOT/frontend/.env.production" ]]; then
        cp "$PROJECT_ROOT/frontend/.env.production" "$backup_dir/frontend.env.production"
    fi

    # Backup docker-compose state
    if docker compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps &> /dev/null; then
        docker compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps > "$backup_dir/containers-state.txt" 2>&1 || true
    fi

    log_success "Backup created: $backup_dir"
    echo "$backup_dir"
}

#####################################################################
# STOP CONTAINERS
#####################################################################

stop_containers() {
    log_step "Stopping containers..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would stop containers"
        return 0
    fi

    cd "$PROJECT_ROOT"

    if docker compose -f docker-compose.production.yml ps --quiet 2>/dev/null | grep -q .; then
        log_info "Stopping running containers..."

        if docker compose version &> /dev/null; then
            docker compose -f docker-compose.production.yml down
        else
            docker-compose -f docker-compose.production.yml down
        fi

        log_success "Containers stopped"
    else
        log_debug "No running containers to stop"
    fi
}

#####################################################################
# GIT ROLLBACK
#####################################################################

perform_git_rollback() {
    local target=$1

    log_step "Rolling back code to $target..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would git reset --hard $target"
        return 0
    fi

    cd "$PROJECT_ROOT"

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD 2>/dev/null; then
        log_warning "Uncommitted changes detected"
        log_info "These changes will be lost during rollback"

        if ! confirm "Discard uncommitted changes and continue?"; then
            error_exit 83 "Rollback cancelled - uncommitted changes present"
        fi
    fi

    # Perform rollback
    if git reset --hard "$target" &> /dev/null; then
        log_success "Code rolled back to $target"

        # Show current state
        local new_short=$(git rev-parse --short HEAD)
        local new_message=$(git log --format=%B -n 1 HEAD | head -n1)

        log_info "Now at: $new_short"
        log_info "Message: $new_message"
    else
        error_exit 84 "Git rollback failed" "Check git status and try manually"
    fi
}

#####################################################################
# RESTORE ENVIRONMENT FILES
#####################################################################

restore_env_files() {
    log_step "Checking environment files..."

    # In most cases, .env.production should be preserved (not in git)
    # But if there's a backup we should offer to restore it

    local latest_backup=$(ls -t /var/backups/masstock/rollback-*/backend.env.production 2>/dev/null | head -n1 || echo "")

    if [[ -n "$latest_backup" ]] && [[ -f "$latest_backup" ]]; then
        log_info "Found backed up .env file"

        if confirm "Restore previous .env.production?"; then
            if [[ "${DRY_RUN:-0}" == "1" ]]; then
                log_warning "[DRY RUN] Would restore: $latest_backup"
            else
                cp "$latest_backup" "$PROJECT_ROOT/backend/.env.production"
                log_success ".env.production restored from backup"
            fi
        else
            log_info "Keeping current .env.production"
        fi
    else
        log_debug "No backed up .env file found, keeping current"
    fi

    # Verify .env exists
    if [[ ! -f "$PROJECT_ROOT/backend/.env.production" ]]; then
        log_warning ".env.production not found!"
        log_info "You may need to run: ./deploy/generate-env.sh"
    fi
}

#####################################################################
# REBUILD AND RESTART
#####################################################################

rebuild_containers() {
    log_step "Rebuilding containers with rolled back code..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would rebuild containers"
        return 0
    fi

    cd "$PROJECT_ROOT"

    # Build frontend
    log_info "Building frontend..."
    cd frontend

    if [[ ! -d "node_modules" ]]; then
        run_command "Installing dependencies" npm install
    fi

    export VITE_API_URL="https://api.dorian-gonzalez.fr/api"
    export VITE_ENV="production"

    if ! run_command "Building frontend" npm run build; then
        error_exit 85 "Frontend build failed during rollback"
    fi

    cd "$PROJECT_ROOT"

    # Build Docker images
    log_info "Building Docker images..."

    if docker compose version &> /dev/null; then
        local cmd="docker compose -f docker-compose.production.yml build"
    else
        local cmd="docker-compose -f docker-compose.production.yml build"
    fi

    if ! run_command "Building images" $cmd; then
        error_exit 86 "Docker build failed during rollback"
    fi

    log_success "Containers rebuilt"
}

restart_containers() {
    log_step "Starting containers..."

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would start containers"
        return 0
    fi

    cd "$PROJECT_ROOT"

    if docker compose version &> /dev/null; then
        local cmd="docker compose -f docker-compose.production.yml up -d"
    else
        local cmd="docker-compose -f docker-compose.production.yml up -d"
    fi

    if ! run_command "Starting containers" $cmd; then
        error_exit 87 "Failed to start containers during rollback"
    fi

    log_success "Containers started"
}

#####################################################################
# VERIFICATION
#####################################################################

verify_rollback() {
    log_step "Verifying rollback..."

    # Wait a bit for containers to start
    sleep 5

    # Check if health-check script exists
    if [[ -f "$SCRIPT_DIR/health-check.sh" ]]; then
        log_info "Running health checks..."

        if [[ "${DRY_RUN:-0}" == "1" ]]; then
            log_warning "[DRY RUN] Would run health checks"
            return 0
        fi

        if "$SCRIPT_DIR/health-check.sh" --quiet; then
            log_success "Health checks passed"
        else
            log_error "Health checks failed"
            log_warning "Rollback completed but system is not healthy"
            log_info "Check logs: docker compose -f docker-compose.production.yml logs"
            return 1
        fi
    else
        log_warning "Health check script not found, skipping verification"

        # Basic container check
        local running=$(docker ps --filter "name=masstock" --format "{{.Names}}" | wc -l)
        log_info "Running containers: $running"
    fi
}

#####################################################################
# REPORTING
#####################################################################

print_rollback_summary() {
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "  ROLLBACK COMPLETE"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    local current=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)
    local message=$(git -C "$PROJECT_ROOT" log --format=%B -n 1 HEAD | head -n1)

    log_success "Rolled back to: $current"
    log_info "Message: $message"
    echo ""

    log_info "System status:"
    docker compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps 2>/dev/null || true
    echo ""

    log_info "To roll forward again:"
    log_info "  git log --oneline        # Find the commit you want"
    log_info "  ./deploy/rollback.sh --to-commit <hash>"
    echo ""

    log_info "To deploy latest version:"
    log_info "  git pull origin main"
    log_info "  ./deploy/build-and-start.sh"
    echo ""
}

#####################################################################
# MAIN EXECUTION
#####################################################################

main() {
    parse_rollback_args "$@"

    log_info "Starting rollback procedure..."
    echo ""

    # Git checks
    check_git_repo

    # Get commits
    local current_commit=$(get_current_commit)
    local target_commit=$(determine_rollback_target)

    # Show what will change
    show_git_diff "$target_commit"

    # Create backup
    local backup_dir=$(create_rollback_backup)

    # Stop containers
    stop_containers

    # Perform git rollback
    perform_git_rollback "$target_commit"

    # Restore env if needed
    restore_env_files

    # Rebuild
    rebuild_containers

    # Restart
    restart_containers

    # Verify
    if verify_rollback; then
        print_success_summary
        print_rollback_summary
        exit 0
    else
        log_error "Rollback completed but verification failed"
        log_info "Backup available at: $backup_dir"
        exit 1
    fi
}

# Run main function
main "$@"
