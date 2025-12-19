#!/bin/bash

#####################################################################
# MASSTOCK DEPLOYMENT - PRODUCTION MONITORING
# Vérifie les services et les redémarre automatiquement si nécessaire
#
# Usage: ./deploy/monitoring.sh [--auto-restart] [--alert]
# Cron:  */5 * * * * /opt/masstock/deploy/monitoring.sh --auto-restart
#####################################################################

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source common functions
source "$SCRIPT_DIR/common.sh"

# Configuration
AUTO_RESTART=0
ALERT_ON_FAILURE=0
LOG_FILE="/var/log/masstock/monitoring.log"
ALERT_FILE="/var/log/masstock/alerts.log"

# Thresholds
MAX_RESTART_ATTEMPTS=3
HEALTH_CHECK_TIMEOUT=10

# Counters
SERVICES_CHECKED=0
SERVICES_HEALTHY=0
SERVICES_RESTARTED=0
SERVICES_FAILED=0

#####################################################################
# ARGUMENT PARSING
#####################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-restart)
            AUTO_RESTART=1
            shift
            ;;
        --alert)
            ALERT_ON_FAILURE=1
            shift
            ;;
        -h|--help)
            cat << EOF
Usage: $0 [OPTIONS]

Monitoring script pour MasStock en production.
Vérifie la santé des services et peut les redémarrer automatiquement.

OPTIONS:
    --auto-restart    Redémarre automatiquement les services défaillants
    --alert           Envoie des alertes en cas de problème
    -h, --help        Affiche cette aide

EXEMPLES:
    # Check simple (pas de restart)
    $0

    # Check avec restart automatique
    $0 --auto-restart

    # Check avec restart + alertes
    $0 --auto-restart --alert

CRON:
    # Toutes les 5 minutes
    */5 * * * * $0 --auto-restart --alert

EOF
            exit 0
            ;;
        *)
            echo "Option inconnue: $1"
            echo "Utilisez --help pour l'aide"
            exit 1
            ;;
    esac
done

#####################################################################
# LOGGING
#####################################################################

log_monitoring() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [MONITOR] $message" >> "$LOG_FILE"
}

log_alert() {
    local severity="$1"
    local message="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$severity] $message" >> "$ALERT_FILE"

    if [[ "$ALERT_ON_FAILURE" == "1" ]]; then
        # TODO: Implémenter notification (email, Slack, etc.)
        echo "ALERT [$severity]: $message"
    fi
}

#####################################################################
# HEALTH CHECKS
#####################################################################

check_docker_running() {
    if ! command -v docker &> /dev/null; then
        log_alert "CRITICAL" "Docker n'est pas installé"
        return 1
    fi

    if ! docker ps &> /dev/null; then
        log_alert "CRITICAL" "Docker daemon n'est pas accessible"
        return 1
    fi

    return 0
}

check_container_status() {
    local container_name="$1"
    ((SERVICES_CHECKED++))

    # Vérifier si le container existe
    if ! docker ps -a --format "{{.Names}}" | grep -q "^${container_name}$"; then
        log_alert "ERROR" "Container $container_name n'existe pas"
        ((SERVICES_FAILED++))
        return 1
    fi

    # Vérifier si le container est running
    local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)

    if [[ "$status" != "running" ]]; then
        log_alert "WARNING" "Container $container_name est $status (pas running)"

        if [[ "$AUTO_RESTART" == "1" ]]; then
            restart_container "$container_name"
        else
            ((SERVICES_FAILED++))
        fi
        return 1
    fi

    # Vérifier le health check du container
    local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)

    if [[ "$health" == "unhealthy" ]]; then
        log_alert "WARNING" "Container $container_name est unhealthy"

        if [[ "$AUTO_RESTART" == "1" ]]; then
            restart_container "$container_name"
        else
            ((SERVICES_FAILED++))
        fi
        return 1
    fi

    # Container OK
    log_monitoring "Container $container_name est healthy"
    ((SERVICES_HEALTHY++))
    return 0
}

check_http_endpoint() {
    local name="$1"
    local url="$2"
    ((SERVICES_CHECKED++))

    local response
    if response=$(curl -s -f --max-time "$HEALTH_CHECK_TIMEOUT" "$url" 2>&1); then
        log_monitoring "HTTP endpoint $name ($url) répond OK"
        ((SERVICES_HEALTHY++))
        return 0
    else
        log_alert "ERROR" "HTTP endpoint $name ($url) ne répond pas: $response"
        ((SERVICES_FAILED++))
        return 1
    fi
}

check_redis() {
    local container="masstock_redis"
    ((SERVICES_CHECKED++))

    if docker exec "$container" redis-cli ping &> /dev/null; then
        log_monitoring "Redis répond OK"
        ((SERVICES_HEALTHY++))
        return 0
    else
        log_alert "ERROR" "Redis ne répond pas"

        if [[ "$AUTO_RESTART" == "1" ]]; then
            restart_container "$container"
        else
            ((SERVICES_FAILED++))
        fi
        return 1
    fi
}

#####################################################################
# AUTO-RESTART
#####################################################################

restart_container() {
    local container_name="$1"

    log_alert "WARNING" "Tentative de restart: $container_name"

    # Vérifier le nombre de restarts récents
    local restart_count=$(docker inspect --format='{{.RestartCount}}' "$container_name" 2>/dev/null || echo "0")

    if [[ "$restart_count" -ge "$MAX_RESTART_ATTEMPTS" ]]; then
        log_alert "CRITICAL" "Container $container_name a redémarré $restart_count fois (max: $MAX_RESTART_ATTEMPTS). Abandon du restart automatique."
        ((SERVICES_FAILED++))
        return 1
    fi

    # Restart le container
    if docker restart "$container_name" &> /dev/null; then
        log_monitoring "Container $container_name redémarré avec succès"

        # Attendre 10 secondes pour que le service démarre
        sleep 10

        # Vérifier si le restart a fonctionné
        local new_status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
        if [[ "$new_status" == "running" ]]; then
            log_monitoring "Container $container_name est maintenant running"
            ((SERVICES_RESTARTED++))
            ((SERVICES_HEALTHY++))
            return 0
        else
            log_alert "ERROR" "Container $container_name n'est pas running après restart (status: $new_status)"
            ((SERVICES_FAILED++))
            return 1
        fi
    else
        log_alert "ERROR" "Échec du restart de $container_name"
        ((SERVICES_FAILED++))
        return 1
    fi
}

restart_nginx() {
    log_alert "WARNING" "Tentative de restart: nginx"

    if systemctl restart nginx; then
        log_monitoring "Nginx redémarré avec succès"
        ((SERVICES_RESTARTED++))
        return 0
    else
        log_alert "CRITICAL" "Échec du restart de nginx"
        ((SERVICES_FAILED++))
        return 1
    fi
}

#####################################################################
# MAIN MONITORING
#####################################################################

main() {
    log_monitoring "========================================="
    log_monitoring "Début du monitoring MasStock"
    log_monitoring "Mode auto-restart: $AUTO_RESTART"
    log_monitoring "Mode alert: $ALERT_ON_FAILURE"

    # Vérifier que Docker tourne
    if ! check_docker_running; then
        log_alert "CRITICAL" "Docker n'est pas accessible - abandon"
        exit 1
    fi

    # Vérifier les containers Docker
    echo "🔍 Vérification des containers Docker..."
    check_container_status "masstock_redis"
    check_container_status "masstock_api"
    check_container_status "masstock_worker"
    check_container_status "masstock_app"
    check_container_status "masstock_vitrine"

    # Vérifier Redis
    echo "🔍 Vérification de Redis..."
    check_redis

    # Vérifier les health endpoints HTTP
    echo "🔍 Vérification des endpoints HTTP..."

    # Backend API (interne)
    check_http_endpoint "Backend API (internal)" "http://localhost:3000/health"

    # Frontend App (interne)
    check_http_endpoint "Frontend App (internal)" "http://localhost:8080/health"

    # Vitrine (interne)
    check_http_endpoint "Vitrine (internal)" "http://localhost:8081/"

    # Backend API (externe via nginx)
    if command -v curl &> /dev/null; then
        check_http_endpoint "Backend API (external)" "https://api.masstock.fr/health"
        check_http_endpoint "Frontend App (external)" "https://app.masstock.fr/"
        check_http_endpoint "Vitrine (external)" "https://masstock.fr/"
    fi

    # Vérifier nginx
    echo "🔍 Vérification de Nginx..."
    ((SERVICES_CHECKED++))
    if systemctl is-active --quiet nginx; then
        log_monitoring "Nginx est running"
        ((SERVICES_HEALTHY++))
    else
        log_alert "ERROR" "Nginx n'est pas running"

        if [[ "$AUTO_RESTART" == "1" ]]; then
            restart_nginx
        else
            ((SERVICES_FAILED++))
        fi
    fi

    # Rapport final
    log_monitoring "========================================="
    log_monitoring "Fin du monitoring"
    log_monitoring "Services vérifiés: $SERVICES_CHECKED"
    log_monitoring "Services healthy: $SERVICES_HEALTHY"
    log_monitoring "Services restartés: $SERVICES_RESTARTED"
    log_monitoring "Services failed: $SERVICES_FAILED"
    log_monitoring "========================================="

    # Affichage console
    echo ""
    echo "📊 Résultat du monitoring:"
    echo "   Services vérifiés: $SERVICES_CHECKED"
    echo "   ✅ Healthy: $SERVICES_HEALTHY"

    if [[ "$SERVICES_RESTARTED" -gt 0 ]]; then
        echo "   🔄 Restartés: $SERVICES_RESTARTED"
    fi

    if [[ "$SERVICES_FAILED" -gt 0 ]]; then
        echo "   ❌ Failed: $SERVICES_FAILED"
    fi

    echo ""

    # Exit code
    if [[ "$SERVICES_FAILED" -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Créer les fichiers de log si nécessaire
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$ALERT_FILE")"

# Exécuter le monitoring
main "$@"
