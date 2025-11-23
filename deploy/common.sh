#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - COMMON FUNCTIONS
# Shared utilities for all deployment scripts
#####################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Log directory
LOG_DIR="/var/log/masstock"
LOG_FILE="${LOG_DIR}/deployment-$(date +%Y%m%d-%H%M%S).log"

# Error tracking
ERROR_COUNT=0
ERRORS_LIST=()

# Initialize logging
init_logging() {
    if [[ $EUID -eq 0 ]]; then
        mkdir -p "$LOG_DIR"
        touch "$LOG_FILE"
        chmod 755 "$LOG_DIR"
        chmod 644 "$LOG_FILE"
    else
        LOG_FILE="/tmp/masstock-deployment-$(date +%Y%m%d-%H%M%S).log"
        mkdir -p "$(dirname "$LOG_FILE")"
    fi

    log_info "Logging initialized: $LOG_FILE"
}

# Timestamp function
timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# Log to file and console
log_message() {
    local level=$1
    local color=$2
    shift 2
    local message="$*"
    local ts=$(timestamp)

    # Log to file (no colors)
    echo "[$ts] [$level] $message" >> "$LOG_FILE"

    # Log to console (with colors)
    echo -e "${color}[$ts] [$level]${NC} $message"
}

# Log levels
log_info() {
    log_message "INFO" "$CYAN" "$@"
}

log_success() {
    log_message "SUCCESS" "$GREEN" "✅ $@"
}

log_warning() {
    log_message "WARNING" "$YELLOW" "⚠️  $@"
}

log_error() {
    log_message "ERROR" "$RED" "❌ $@"
    ERROR_COUNT=$((ERROR_COUNT + 1))
    ERRORS_LIST+=("$*")
}

log_step() {
    log_message "STEP" "$MAGENTA" "🔷 $@"
}

log_debug() {
    if [[ "${VERBOSE:-0}" == "1" ]]; then
        log_message "DEBUG" "$BLUE" "🔍 $@"
    fi
}

# Error handling with codes
error_exit() {
    local error_code=$1
    local error_message=$2
    local context=${3:-""}

    log_error "[ERR${error_code}] $error_message"

    if [[ -n "$context" ]]; then
        log_error "Context: $context"
    fi

    log_error "Check logs: $LOG_FILE"

    # Print summary
    print_error_summary

    exit "$error_code"
}

# Print error summary
print_error_summary() {
    if [[ $ERROR_COUNT -gt 0 ]]; then
        echo ""
        echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}${BOLD}  DEPLOYMENT FAILED - $ERROR_COUNT ERROR(S) FOUND${NC}"
        echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        for i in "${!ERRORS_LIST[@]}"; do
            echo -e "${RED}  $((i+1)). ${ERRORS_LIST[$i]}${NC}"
        done
        echo ""
        echo -e "${YELLOW}📋 Full logs: ${LOG_FILE}${NC}"
        echo -e "${YELLOW}💡 Copy/paste errors to Claude for debugging${NC}"
        echo ""
    fi
}

# Success summary
print_success_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}  ✅ DEPLOYMENT SUCCESSFUL${NC}"
    echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}📋 Logs: ${LOG_FILE}${NC}"
    echo ""
}

# Check if command exists
check_command() {
    local cmd=$1
    local error_code=$2
    local install_hint=$3

    if ! command -v "$cmd" &> /dev/null; then
        error_exit "$error_code" "Required command not found: $cmd" "$install_hint"
    fi
    log_debug "Command found: $cmd ($(command -v $cmd))"
}

# Check if port is available
check_port() {
    local port=$1
    local error_code=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        local process=$(ps -p $pid -o comm=)
        error_exit "$error_code" "Port $port is already in use" "Process: $process (PID: $pid). Use: kill $pid or lsof -i :$port"
    fi
    log_debug "Port $port is available"
}

# Check if user has sudo privileges
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        log_warning "This script requires sudo privileges"
        log_info "Please run with: sudo $0 $*"
        exit 1
    fi
}

# Confirm action
confirm() {
    local message=$1
    local default=${2:-"n"}

    if [[ "$default" == "y" ]]; then
        local prompt="$message [Y/n]: "
        local default_val="y"
    else
        local prompt="$message [y/N]: "
        local default_val="n"
    fi

    read -p "$(echo -e ${YELLOW}${prompt}${NC})" response
    response=${response:-$default_val}

    if [[ "$response" =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Run command with logging
run_command() {
    local description=$1
    shift
    local cmd="$@"

    log_step "$description"
    log_debug "Executing: $cmd"

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
        log_warning "[DRY RUN] Would execute: $cmd"
        return 0
    fi

    # Execute and capture output
    local output
    local exit_code

    if [[ "${VERBOSE:-0}" == "1" ]]; then
        eval "$cmd" 2>&1 | tee -a "$LOG_FILE"
        exit_code=${PIPESTATUS[0]}
    else
        output=$(eval "$cmd" 2>&1)
        exit_code=$?
        echo "$output" >> "$LOG_FILE"
    fi

    if [[ $exit_code -ne 0 ]]; then
        log_error "Command failed with exit code $exit_code"
        log_error "Command: $cmd"
        if [[ "${VERBOSE:-0}" != "1" ]]; then
            log_error "Output: $output"
        fi
        return $exit_code
    fi

    log_debug "Command succeeded"
    return 0
}

# Backup file before modification
backup_file() {
    local file=$1

    if [[ -f "$file" ]]; then
        local backup="${file}.backup-$(date +%Y%m%d-%H%M%S)"
        cp "$file" "$backup"
        log_info "Backed up: $file -> $backup"
        echo "$backup"
    fi
}

# Restore from backup
restore_backup() {
    local backup=$1
    local original=${backup%.backup-*}

    if [[ -f "$backup" ]]; then
        cp "$backup" "$original"
        log_info "Restored: $backup -> $original"
        return 0
    else
        log_error "Backup not found: $backup"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local min_gb=$1
    local error_code=$2

    local available_gb=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')

    if [[ $available_gb -lt $min_gb ]]; then
        error_exit "$error_code" "Insufficient disk space" "Available: ${available_gb}GB, Required: ${min_gb}GB"
    fi

    log_debug "Disk space OK: ${available_gb}GB available"
}

# Wait for service to be healthy
wait_for_service() {
    local service_name=$1
    local check_command=$2
    local max_attempts=${3:-30}
    local sleep_time=${4:-2}

    log_step "Waiting for $service_name to be healthy..."

    local attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if eval "$check_command" &> /dev/null; then
            log_success "$service_name is healthy"
            return 0
        fi

        log_debug "Attempt $attempt/$max_attempts - $service_name not ready yet"
        sleep $sleep_time
        attempt=$((attempt + 1))
    done

    log_error "$service_name did not become healthy after $max_attempts attempts"
    return 1
}

# Cleanup on exit
cleanup() {
    local exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        log_error "Script exited with code $exit_code"
        print_error_summary
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Parse common arguments
parse_common_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                export VERBOSE=1
                log_info "Verbose mode enabled"
                shift
                ;;
            --dry-run)
                export DRY_RUN=1
                log_warning "DRY RUN MODE - No changes will be made"
                shift
                ;;
            -h|--help)
                if declare -f usage > /dev/null; then
                    usage
                else
                    echo "Usage: $0 [-v|--verbose] [--dry-run] [-h|--help]"
                fi
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
}

# Initialize if sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Script is being sourced
    init_logging
fi
