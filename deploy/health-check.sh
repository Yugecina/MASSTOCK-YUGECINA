#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - HEALTH CHECK
# Comprehensive infrastructure monitoring and health verification
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

Performs comprehensive health checks on MasStock infrastructure.

OPTIONS:
    -v, --verbose    Enable verbose output
    --json           Output results in JSON format
    --quiet          Only show errors and summary
    -h, --help       Show this help message

CHECKS PERFORMED:
    • Docker containers status
    • Redis connectivity and memory
    • API health endpoint
    • Worker process status
    • Frontend accessibility
    • SSL certificate expiry
    • Disk space and memory
    • nginx configuration
    • Network connectivity

OUTPUT:
    Returns exit code 0 if all checks pass, non-zero otherwise.
    With --json, outputs structured data for monitoring tools.

EXAMPLES:
    $0                  # Interactive health check
    $0 --json          # JSON output for monitoring
    $0 --quiet         # Only show problems

EOF
}

# Options
JSON_OUTPUT=0
QUIET_MODE=0

# Health check results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# JSON output structure
declare -a JSON_RESULTS=()

#####################################################################
# PARSE ARGUMENTS
#####################################################################

parse_health_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --json)
                JSON_OUTPUT=1
                shift
                ;;
            --quiet)
                QUIET_MODE=1
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
}

#####################################################################
# HEALTH CHECK TRACKING
#####################################################################

record_check() {
    local check_name=$1
    local status=$2  # "pass", "fail", "warning"
    local message=$3
    local details=${4:-""}

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    case "$status" in
        pass)
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            if [[ $QUIET_MODE -eq 0 ]]; then
                log_success "$check_name: $message"
            fi
            ;;
        fail)
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            log_error "$check_name: $message"
            ;;
        warning)
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            if [[ $QUIET_MODE -eq 0 ]]; then
                log_warning "$check_name: $message"
            fi
            ;;
    esac

    # Store for JSON output
    if [[ $JSON_OUTPUT -eq 1 ]]; then
        local json_entry=$(cat <<EOF
{
  "check": "$check_name",
  "status": "$status",
  "message": "$message",
  "details": "$details",
  "timestamp": "$(date -Iseconds)"
}
EOF
        )
        JSON_RESULTS+=("$json_entry")
    fi
}

#####################################################################
# DOCKER CHECKS
#####################################################################

check_docker_containers() {
    log_step "Checking Docker containers..."

    local containers=("masstock_redis" "masstock_api" "masstock_worker" "masstock_app" "masstock_vitrine" "masstock_n8n")

    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" --format "{{.Names}}" | grep -q "^${container}$"; then
            # Container is running
            local uptime=$(docker ps --filter "name=$container" --format "{{.Status}}")
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")

            if [[ "$health" == "healthy" ]] || [[ "$health" == "none" ]]; then
                record_check "$container" "pass" "Running and healthy" "$uptime"
            else
                record_check "$container" "warning" "Running but health=$health" "$uptime"
            fi

            # Check restart count
            local restart_count=$(docker inspect --format='{{.RestartCount}}' "$container" 2>/dev/null || echo "0")
            if [[ $restart_count -gt 5 ]]; then
                record_check "${container}_restarts" "warning" "High restart count: $restart_count"
            fi
        else
            record_check "$container" "fail" "Not running or not found"
        fi
    done
}

check_container_resources() {
    log_step "Checking container resource usage..."

    local containers=("masstock_api" "masstock_worker" "masstock_redis" "masstock_app" "masstock_vitrine" "masstock_n8n")

    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --format "{{.Names}}" | grep -q "^${container}$"; then
            # Get resource stats
            local stats=$(docker stats --no-stream --format "{{.CPUPerc}}|{{.MemPerc}}|{{.MemUsage}}" "$container" 2>/dev/null || echo "N/A|N/A|N/A")

            IFS='|' read -r cpu mem mem_usage <<< "$stats"

            if [[ "$cpu" != "N/A" ]]; then
                local cpu_num=$(echo "$cpu" | tr -d '%')
                local mem_num=$(echo "$mem" | tr -d '%')

                # Thresholds
                if (( $(echo "$cpu_num > 90" | bc -l 2>/dev/null || echo 0) )); then
                    record_check "${container}_cpu" "warning" "High CPU: $cpu"
                elif (( $(echo "$cpu_num > 50" | bc -l 2>/dev/null || echo 0) )); then
                    record_check "${container}_cpu" "pass" "CPU: $cpu" "$mem_usage"
                else
                    record_check "${container}_cpu" "pass" "CPU: $cpu" "$mem_usage"
                fi

                if (( $(echo "$mem_num > 90" | bc -l 2>/dev/null || echo 0) )); then
                    record_check "${container}_memory" "warning" "High memory: $mem"
                fi
            fi
        fi
    done
}

#####################################################################
# SERVICE CHECKS
#####################################################################

check_redis() {
    log_step "Checking Redis..."

    # Check connectivity
    if docker exec masstock_redis redis-cli --raw incr ping &> /dev/null; then
        record_check "redis_connectivity" "pass" "Redis is responding to commands"

        # Check memory usage
        local memory_used=$(docker exec masstock_redis redis-cli INFO memory 2>/dev/null | grep "used_memory_human" | awk -F: '{print $2}' | tr -d '\r')
        if [[ -n "$memory_used" ]]; then
            record_check "redis_memory" "pass" "Memory usage: $memory_used"
        fi

        # Check connected clients
        local clients=$(docker exec masstock_redis redis-cli INFO clients 2>/dev/null | grep "connected_clients" | awk -F: '{print $2}' | tr -d '\r')
        if [[ -n "$clients" ]]; then
            record_check "redis_clients" "pass" "Connected clients: $clients"
        fi

        # Check for errors
        local errors=$(docker exec masstock_redis redis-cli INFO stats 2>/dev/null | grep "total_error_replies" | awk -F: '{print $2}' | tr -d '\r')
        if [[ -n "$errors" ]] && [[ $errors -gt 100 ]]; then
            record_check "redis_errors" "warning" "Error replies: $errors"
        fi
    else
        record_check "redis_connectivity" "fail" "Cannot connect to Redis"
    fi
}

check_api() {
    log_step "Checking API..."

    # Internal health check (from within container)
    if docker exec masstock_api wget --spider -q http://localhost:3000/health 2>/dev/null; then
        record_check "api_internal" "pass" "API health endpoint responding"
    else
        record_check "api_internal" "fail" "API health endpoint not responding"
        return
    fi

    # External HTTPS check (via VPS nginx)
    if command -v curl &> /dev/null; then
        local response=$(curl -sk -o /dev/null -w "%{http_code}" https://api.dorian-gonzalez.fr/health 2>/dev/null || echo "000")

        if [[ "$response" == "200" ]]; then
            record_check "api_external" "pass" "API accessible via HTTPS (HTTP $response)"
        elif [[ "$response" == "000" ]]; then
            record_check "api_external" "warning" "Cannot reach API via HTTPS (network issue?)"
        else
            record_check "api_external" "fail" "API returned HTTP $response"
        fi
    fi

    # Check API logs for recent errors
    local recent_errors=$(docker logs masstock_api --since 5m 2>&1 | grep -i "error" | wc -l || echo 0)
    if [[ $recent_errors -gt 10 ]]; then
        record_check "api_errors" "warning" "High error count in recent logs: $recent_errors"
    elif [[ $recent_errors -gt 0 ]]; then
        record_check "api_errors" "pass" "Recent errors: $recent_errors"
    fi
}

check_worker() {
    log_step "Checking Worker..."

    # Check if worker is running
    if docker ps --filter "name=masstock_worker" --format "{{.Names}}" | grep -q "masstock_worker"; then
        record_check "worker_running" "pass" "Worker container is running"

        # Check recent logs for activity
        local recent_logs=$(docker logs masstock_worker --since 1m 2>&1 || echo "")

        if echo "$recent_logs" | grep -q "Processing\|Completed\|Waiting"; then
            record_check "worker_activity" "pass" "Worker is active"
        elif echo "$recent_logs" | grep -qi "error"; then
            record_check "worker_activity" "warning" "Worker has recent errors"
        else
            record_check "worker_activity" "pass" "Worker is idle (waiting for jobs)"
        fi

        # Check for failed jobs (if logs show them)
        local failed_jobs=$(echo "$recent_logs" | grep -i "failed" | wc -l || echo 0)
        if [[ $failed_jobs -gt 5 ]]; then
            record_check "worker_failures" "warning" "High job failure rate: $failed_jobs in last minute"
        fi
    else
        record_check "worker_running" "fail" "Worker container not running"
    fi
}

check_frontend() {
    log_step "Checking Frontend..."

    # Check nginx container serving frontend
    if docker exec masstock_app test -f /usr/share/nginx/html/index.html 2>/dev/null; then
        record_check "frontend_files" "pass" "Frontend files deployed"
    else
        record_check "frontend_files" "fail" "Frontend files not found in nginx container"
    fi

    # External HTTPS check
    if command -v curl &> /dev/null; then
        local response=$(curl -sk -o /dev/null -w "%{http_code}" https://dorian-gonzalez.fr 2>/dev/null || echo "000")

        if [[ "$response" == "200" ]]; then
            record_check "frontend_external" "pass" "Frontend accessible via HTTPS (HTTP $response)"
        elif [[ "$response" == "000" ]]; then
            record_check "frontend_external" "warning" "Cannot reach frontend via HTTPS"
        else
            record_check "frontend_external" "fail" "Frontend returned HTTP $response"
        fi
    fi
}

#####################################################################
# SYSTEM CHECKS
#####################################################################

check_disk_space() {
    log_step "Checking disk space..."

    local available_gb=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    local used_percent=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [[ $available_gb -lt 2 ]]; then
        record_check "disk_space" "fail" "Critical: Only ${available_gb}GB free"
    elif [[ $available_gb -lt 5 ]]; then
        record_check "disk_space" "warning" "Low disk space: ${available_gb}GB free"
    else
        record_check "disk_space" "pass" "${available_gb}GB free (${used_percent}% used)"
    fi

    # Check Docker volumes
    local docker_size=$(docker system df --format "{{.Size}}" 2>/dev/null | head -n1 || echo "N/A")
    if [[ "$docker_size" != "N/A" ]]; then
        record_check "docker_storage" "pass" "Docker using: $docker_size"
    fi
}

check_memory() {
    log_step "Checking memory..."

    local total_mb=$(free -m | awk 'NR==2 {print $2}')
    local available_mb=$(free -m | awk 'NR==2 {print $7}')
    local used_percent=$(( (total_mb - available_mb) * 100 / total_mb ))

    if [[ $available_mb -lt 200 ]]; then
        record_check "memory" "warning" "Low memory: ${available_mb}MB free of ${total_mb}MB"
    else
        record_check "memory" "pass" "${available_mb}MB free of ${total_mb}MB (${used_percent}% used)"
    fi

    # Check swap
    local swap_total=$(free -m | awk 'NR==3 {print $2}')
    local swap_used=$(free -m | awk 'NR==3 {print $3}')

    if [[ $swap_total -gt 0 ]] && [[ $swap_used -gt $((swap_total / 2)) ]]; then
        record_check "swap_usage" "warning" "High swap usage: ${swap_used}MB / ${swap_total}MB"
    fi
}

check_ssl_certificates() {
    log_step "Checking SSL certificates..."

    local cert_path="/etc/letsencrypt/live/dorian-gonzalez.fr/fullchain.pem"

    if [[ -f "$cert_path" ]]; then
        # Check expiry
        local expiry_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
        local now_epoch=$(date +%s)
        local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

        if [[ $days_left -lt 7 ]]; then
            record_check "ssl_expiry" "fail" "SSL expires in $days_left days!"
        elif [[ $days_left -lt 30 ]]; then
            record_check "ssl_expiry" "warning" "SSL expires in $days_left days"
        else
            record_check "ssl_expiry" "pass" "SSL valid for $days_left days"
        fi
    else
        record_check "ssl_expiry" "warning" "SSL certificate not found (HTTP only?)"
    fi
}

check_nginx() {
    log_step "Checking nginx configuration..."

    # Test VPS nginx config
    if nginx -t &> /dev/null; then
        record_check "nginx_config" "pass" "nginx configuration valid"
    else
        record_check "nginx_config" "fail" "nginx configuration has errors"
    fi

    # Check if nginx is running
    if systemctl is-active --quiet nginx 2>/dev/null; then
        record_check "nginx_service" "pass" "nginx service is active"
    else
        record_check "nginx_service" "fail" "nginx service is not running"
    fi

    # Check nginx error logs for recent issues
    if [[ -f /var/log/nginx/masstock-frontend-error.log ]]; then
        local recent_errors=$(grep -c "error" /var/log/nginx/masstock-frontend-error.log 2>/dev/null | tail -100 || echo 0)
        if [[ $recent_errors -gt 50 ]]; then
            record_check "nginx_errors" "warning" "High error count in nginx logs: $recent_errors"
        fi
    fi
}

check_network() {
    log_step "Checking network connectivity..."

    # Internet connectivity
    if ping -c 1 8.8.8.8 &> /dev/null; then
        record_check "internet" "pass" "Internet connectivity OK"
    else
        record_check "internet" "fail" "No internet connectivity"
    fi

    # DNS resolution
    if ping -c 1 google.com &> /dev/null; then
        record_check "dns" "pass" "DNS resolution OK"
    else
        record_check "dns" "warning" "DNS resolution issues"
    fi

    # Docker network
    if docker network inspect masstock_network &> /dev/null; then
        record_check "docker_network" "pass" "Docker network exists"
    else
        record_check "docker_network" "fail" "Docker network not found"
    fi
}

#####################################################################
# OUTPUT
#####################################################################

print_summary() {
    if [[ $JSON_OUTPUT -eq 1 ]]; then
        # JSON output
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"total_checks\": $TOTAL_CHECKS,"
        echo "  \"passed\": $PASSED_CHECKS,"
        echo "  \"warnings\": $WARNING_CHECKS,"
        echo "  \"failed\": $FAILED_CHECKS,"
        echo "  \"status\": \"$([ $FAILED_CHECKS -eq 0 ] && echo "healthy" || echo "unhealthy")\","
        echo "  \"checks\": ["

        local first=1
        for result in "${JSON_RESULTS[@]}"; do
            if [[ $first -eq 1 ]]; then
                first=0
            else
                echo ","
            fi
            echo "    $result"
        done

        echo ""
        echo "  ]"
        echo "}"
    else
        # Human-readable summary
        echo ""
        log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_info "  HEALTH CHECK SUMMARY"
        log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "  Total checks:  $TOTAL_CHECKS"
        echo -e "  ${GREEN}✓ Passed:${NC}      $PASSED_CHECKS"
        echo -e "  ${YELLOW}⚠ Warnings:${NC}    $WARNING_CHECKS"
        echo -e "  ${RED}✗ Failed:${NC}      $FAILED_CHECKS"
        echo ""

        if [[ $FAILED_CHECKS -eq 0 ]] && [[ $WARNING_CHECKS -eq 0 ]]; then
            log_success "All systems healthy! 🎉"
        elif [[ $FAILED_CHECKS -eq 0 ]]; then
            log_warning "System operational with $WARNING_CHECKS warning(s)"
        else
            log_error "System has $FAILED_CHECKS critical issue(s)"
        fi
        echo ""
    fi
}

#####################################################################
# MAIN EXECUTION
#####################################################################

main() {
    parse_health_args "$@"

    if [[ $QUIET_MODE -eq 0 ]] && [[ $JSON_OUTPUT -eq 0 ]]; then
        log_info "Running health checks..."
        echo ""
    fi

    # Run all checks
    check_docker_containers
    check_container_resources
    check_redis
    check_api
    check_worker
    check_frontend
    check_disk_space
    check_memory
    check_ssl_certificates
    check_nginx
    check_network

    # Print summary
    print_summary

    # Exit code
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
