# MasStock Production Deployment SOP

**Standard Operating Procedure for deploying MasStock to production VPS**

Last updated: 2025-11-25

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Deployment](#initial-deployment)
4. [Routine Deployments](#routine-deployments)
5. [Rollback Procedure](#rollback-procedure)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Overview

### Architecture

**Production Stack:**
- **Frontend:** React SPA served via nginx container (port 8080)
- **Backend API:** Express.js (port 3000)
- **Worker:** Bull queue processor
- **Redis:** Job queue storage
- **VPS nginx:** Reverse proxy handling SSL/TLS (ports 80/443)

**Domains:**
- `dorian-gonzalez.fr` → nginx container → React frontend
- `api.dorian-gonzalez.fr` → api container → Express API
- `n8n.dorian-gonzalez.fr` → existing n8n instance (coexists independently)

**Data Flow:**
```
Internet (HTTPS)
    ↓
VPS nginx (:80/:443) + SSL
    ↓
    ├─→ dorian-gonzalez.fr → nginx container (:8080) → React app
    └─→ api.dorian-gonzalez.fr → api container (:3000) → Express API
```

---

## Prerequisites

### VPS Requirements

- **OS:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM:** Minimum 2GB (4GB recommended)
- **Disk:** Minimum 10GB free space
- **CPU:** 2+ cores recommended
- **Ports:** 80, 443, 3000, 6379, 8080 available

### Software Requirements

- **Docker** 20.10+
- **Docker Compose** V2 (plugin) or V1.29+
- **Git** 2.x
- **nginx** (for VPS reverse proxy)
- **certbot** (for SSL certificates)

### DNS Configuration

**Both domains must point to VPS IP:**
```bash
dorian-gonzalez.fr      A     <VPS_IP>
www.dorian-gonzalez.fr  A     <VPS_IP>
api.dorian-gonzalez.fr  A     <VPS_IP>
```

Verify with:
```bash
dig +short dorian-gonzalez.fr
dig +short api.dorian-gonzalez.fr
```

### Credentials Needed

From **Supabase Dashboard** (https://app.supabase.com/project/_/settings/api):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `GEMINI_API_KEY` (for AI workflows)

---

## Initial Deployment

### Step 1: Clone Repository on VPS

```bash
# SSH into VPS
ssh user@dorian-gonzalez.fr

# Create project directory
sudo mkdir -p /opt/masstock
sudo chown $USER:$USER /opt/masstock

# Clone repository
cd /opt/masstock
git clone https://github.com/YOUR_USERNAME/masstock.git .

# Verify structure
ls -la
# Should see: backend/, frontend/, deploy/, docker-compose.production.yml, etc.
```

### Step 2: Run Master Deployment Script

```bash
cd /opt/masstock

# Make scripts executable (should already be done)
chmod +x deploy/*.sh

# Run full deployment
sudo ./deploy/master-deploy.sh
```

**The script will:**
1. ✓ Check environment (Docker, ports, disk space)
2. ✓ Prompt for environment configuration (Supabase credentials)
3. ✓ Configure VPS nginx as reverse proxy
4. ✓ Obtain Let's Encrypt SSL certificates
5. ✓ Build frontend and Docker images
6. ✓ Start all containers (redis, api, worker, nginx)
7. ✓ Run health checks

**Interactive Prompts:**

You'll be asked to provide:
- Supabase URL
- Supabase Anon Key (press Enter to hide input)
- Supabase Service Role Key (press Enter to hide input)
- Gemini API Key (optional, press Enter to skip)
- Email for Let's Encrypt notifications

Secrets (JWT, encryption keys, Redis password) are auto-generated.

### Step 3: Verify Deployment

```bash
# Run health check
./deploy/health-check.sh

# Check container status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f

# Test frontend
curl -I https://dorian-gonzalez.fr

# Test API
curl https://api.dorian-gonzalez.fr/health
```

**Expected Output:**
- All containers status: `Up` and `healthy`
- Frontend: HTTP 200
- API: `{"status":"ok","timestamp":"...","services":{...}}`

---

## Routine Deployments

### Option A: Automatic Deployment (Recommended)

**Setup GitHub Actions** (one-time):

1. **Generate SSH key on local machine:**
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/masstock-deploy
```

2. **Add public key to VPS:**
```bash
ssh-copy-id -i ~/.ssh/masstock-deploy.pub user@dorian-gonzalez.fr
```

3. **Configure GitHub Secrets:**

Go to: `Repository → Settings → Secrets and variables → Actions`

Add these secrets:
- `SSH_PRIVATE_KEY`: Content of `~/.ssh/masstock-deploy` (private key)
- `SSH_KNOWN_HOSTS`: Run `ssh-keyscan dorian-gonzalez.fr` and paste output
- `VPS_HOST`: `dorian-gonzalez.fr`
- `VPS_USER`: Your SSH username (e.g., `root` or `masstock`)
- `VITE_API_URL`: `https://api.dorian-gonzalez.fr/api/v1`

4. **Deploy by pushing to main:**
```bash
git add .
git commit -m "feat: your feature description"
git push origin main
```

GitHub Actions will automatically:
- Build frontend with production env
- SSH to VPS
- Pull latest code
- Rebuild Docker images
- Restart containers
- Run health checks
- Rollback on failure

**Monitor deployment:**
- Go to: `Repository → Actions`
- Click on latest workflow run
- View real-time logs

### Option B: Manual Deployment

**On VPS:**

```bash
cd /opt/masstock

# Pull latest code
git pull origin main

# Rebuild and restart
./deploy/build-and-start.sh --rebuild

# Verify
./deploy/health-check.sh
```

---

## Rollback Procedure

### Automatic Rollback (Git-based)

```bash
cd /opt/masstock

# Rollback to previous commit
./deploy/rollback.sh

# Rollback to specific commit
./deploy/rollback.sh --to-commit abc123

# Preview rollback (dry-run)
./deploy/rollback.sh --dry-run
```

**What it does:**
1. Creates backup of current state
2. Stops containers
3. Reverts code to previous commit
4. Rebuilds Docker images
5. Restarts containers
6. Runs health checks

**Backups stored in:**
```
/var/backups/masstock/rollback-YYYYMMDD-HHMMSS/
```

### Manual Rollback

If scripts fail:

```bash
# Stop containers
docker compose -f docker-compose.production.yml down

# Reset git to previous commit
git log --oneline  # Find commit hash
git reset --hard <commit-hash>

# Rebuild
cd frontend && npm run build && cd ..
docker compose -f docker-compose.production.yml build

# Restart
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps
```

---

## Monitoring & Health Checks

### Automated Health Check

```bash
# Run comprehensive health check
./deploy/health-check.sh

# JSON output (for monitoring tools)
./deploy/health-check.sh --json

# Quiet mode (only errors)
./deploy/health-check.sh --quiet
```

**Checks performed:**
- ✓ Docker containers status and restarts
- ✓ Redis connectivity and memory
- ✓ API health endpoint (internal + external HTTPS)
- ✓ Worker activity and job failures
- ✓ Frontend accessibility
- ✓ SSL certificate expiry
- ✓ Disk space and memory usage
- ✓ nginx configuration validity
- ✓ Network connectivity

**Exit codes:**
- `0` = All checks passed
- `1` = One or more checks failed

### Container Logs

```bash
# All containers (follow mode)
docker compose -f docker-compose.production.yml logs -f

# Specific container
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f worker

# Last 100 lines
docker compose -f docker-compose.production.yml logs --tail=100

# Since timestamp
docker compose -f docker-compose.production.yml logs --since="2025-01-23T10:00:00"
```

### System Logs

```bash
# Deployment logs
ls -lh /var/log/masstock/
tail -f /var/log/masstock/deployment-YYYYMMDD-HHMMSS.log

# nginx access logs
tail -f /var/log/nginx/masstock-frontend-access.log
tail -f /var/log/nginx/masstock-api-access.log

# nginx error logs
tail -f /var/log/nginx/masstock-frontend-error.log
tail -f /var/log/nginx/masstock-api-error.log

# System journal (nginx, docker)
journalctl -u nginx -f
journalctl -u docker -f
```

### Monitoring Metrics

**Container stats:**
```bash
docker stats masstock_api masstock_worker masstock_redis masstock_nginx
```

**Redis info:**
```bash
docker exec masstock_redis redis-cli INFO
docker exec masstock_redis redis-cli INFO memory
docker exec masstock_redis redis-cli INFO stats
```

**Disk usage:**
```bash
df -h
docker system df
```

**Memory usage:**
```bash
free -h
```

---

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

**Symptom:** Container exits immediately after start

**Diagnosis:**
```bash
# Check container logs
docker compose -f docker-compose.production.yml logs <container_name>

# Check container exit code
docker inspect masstock_<container> --format='{{.State.ExitCode}}'
```

**Common causes:**
- Missing environment variables (check `.env.production`)
- Port conflict (check `lsof -i :<port>`)
- Build failure (rebuild with `--no-cache`)

**Fix:**
```bash
# Check .env file exists and has all variables
cat backend/.env.production

# Rebuild without cache
./deploy/build-and-start.sh --rebuild

# Check for port conflicts
lsof -i :3000
lsof -i :6379
```

#### 2. SSL Certificate Issues

**Symptom:** Browser shows "Certificate not valid" or HTTPS doesn't work

**Diagnosis:**
```bash
# Check certificate exists
ls -l /etc/letsencrypt/live/dorian-gonzalez.fr/

# Check expiry
openssl x509 -enddate -noout -in /etc/letsencrypt/live/dorian-gonzalez.fr/fullchain.pem

# Test HTTPS
curl -I https://dorian-gonzalez.fr
curl -I https://api.dorian-gonzalez.fr
```

**Fix:**
```bash
# Renew certificate
sudo certbot renew

# Or re-run SSL setup
sudo ./deploy/setup-ssl.sh

# Check nginx config
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. nginx Configuration Errors

**Symptom:** nginx won't reload, 502 Bad Gateway errors

**Diagnosis:**
```bash
# Test nginx config
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Fix:**
```bash
# Restore backup if config is broken
sudo ls -lt /etc/nginx/sites-available/masstock.conf.backup-*
sudo cp /etc/nginx/sites-available/masstock.conf.backup-XXXXXX /etc/nginx/sites-available/masstock.conf

# Or re-run nginx setup
sudo ./deploy/setup-nginx-vps.sh

# Reload nginx
sudo systemctl reload nginx
```

#### 4. Database Connection Errors

**Symptom:** API logs show "Cannot connect to Supabase"

**Diagnosis:**
```bash
# Check backend environment
docker exec masstock_api env | grep SUPABASE

# Test Supabase connection from container
docker exec masstock_api wget -O- $SUPABASE_URL/rest/v1/
```

**Fix:**
```bash
# Regenerate .env with correct credentials
./deploy/generate-env.sh

# Restart API container
docker compose -f docker-compose.production.yml restart api
```

#### 5. Worker Not Processing Jobs

**Symptom:** Jobs stuck in queue, no workflow executions, API returns 500 on workflow execution

**Diagnosis:**
```bash
# Check worker logs
docker compose -f docker-compose.production.yml logs worker

# Check Redis connectivity
docker exec masstock_redis redis-cli PING

# If Redis has password, use:
docker exec masstock_redis redis-cli -a "$REDIS_PASSWORD" PING

# Check queue status (from API container)
docker exec masstock_api node -e "const Queue = require('bull'); const q = new Queue('workflow-queue', 'redis://redis:6379'); q.getJobCounts().then(console.log);"
```

**Common cause: Redis password mismatch**

If you see AUTH errors in logs, the problem is likely a mismatch between:
1. The Redis server password (`--requirepass` in docker-compose)
2. The `REDIS_PASSWORD` in `backend/.env.production`
3. The `REDIS_PASSWORD` in root `.env` file

**Verify passwords match:**
```bash
# Check root .env
cat /opt/masstock/.env | grep REDIS_PASSWORD

# Check backend .env.production
cat /opt/masstock/backend/.env.production | grep REDIS_PASSWORD

# They MUST be identical!
```

**Fix:**
```bash
# Restart worker
docker compose -f docker-compose.production.yml restart worker

# If Redis has issues
docker compose -f docker-compose.production.yml restart redis worker

# If password mismatch - ensure both .env files have same REDIS_PASSWORD
# then restart all services:
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

#### 6. Port 8080 Already in Use

**Symptom:** `failed to bind host port 0.0.0.0:8080/tcp: address already in use`

**Diagnosis:**
```bash
# Find what's using port 8080
sudo lsof -i :8080

# Check for uvicorn/FastAPI services
ps aux | grep uvicorn

# List all running services
sudo systemctl --type=service --state=running
```

**Common causes:**
- `rag.service` (RAG API using uvicorn on port 8080)
- `agent_api.service` (Agent D API)
- Old MasStock containers not cleaned up

**Fix:**
```bash
# Option 1: Stop conflicting systemd services
sudo systemctl stop rag.service
sudo systemctl disable rag.service

sudo systemctl stop agent_api.service
sudo systemctl disable agent_api.service

# Option 2: Kill process directly (if not a service)
sudo lsof -i :8080  # Get PID
sudo kill -9 <PID>

# Option 3: Let deployment script handle it automatically
# The build-and-start.sh script now auto-kills port 8080 processes
./deploy/build-and-start.sh
```

**Prevention:**
The `free_required_ports()` function in `deploy/build-and-start.sh` now automatically kills processes using ports 8080 and 3000 before starting containers.

#### 7. nginx Container Fails with SSL Certificate Error

**Symptom:** `cannot load certificate "/etc/nginx/ssl/dorian-gonzalez.fr/fullchain.pem": No such file`

**Cause:** Container nginx configuration references SSL certificates that don't exist yet.

**Fix:**
The container nginx should use HTTP-only config (VPS nginx handles SSL):
```bash
# The nginx/conf.d/masstock.conf should use:
# - listen 80 default_server (not 443)
# - server_name _ (catch-all, no domain filtering)
# - No SSL certificate paths

# If container nginx is misconfigured, rebuild:
git pull origin main  # Ensure you have latest HTTP-only config
docker compose -f docker-compose.production.yml build nginx
docker compose -f docker-compose.production.yml up -d nginx
```

#### 8. Frontend Returns "Internal Server Error" (nginx VPS → Container Connection Reset)

**Symptom:**
- `curl http://localhost:8080/` works on VPS
- `curl http://dorian-gonzalez.fr` returns "Internal Server Error"
- nginx VPS logs: `recv() failed (104: Connection reset by peer)`

**Cause:** Container nginx filters requests by `server_name` and rejects proxied requests from VPS nginx.

**Fix:**
Container nginx must use `server_name _` (catch-all) to accept all proxied requests:
```bash
# In nginx/conf.d/masstock.conf:
server {
    listen 80 default_server;
    server_name _;  # Not specific domain!
    # ...
}

# After fixing config:
docker compose -f docker-compose.production.yml build nginx
docker compose -f docker-compose.production.yml up -d nginx
```

### Emergency Procedures

#### Complete System Restart

```bash
cd /opt/masstock

# Stop all
docker compose -f docker-compose.production.yml down

# Wait 5 seconds
sleep 5

# Start all
docker compose -f docker-compose.production.yml up -d

# Verify
./deploy/health-check.sh
```

#### Nuclear Option: Full Redeployment

```bash
# Stop and remove everything
docker compose -f docker-compose.production.yml down -v

# Clean Docker
docker system prune -a --volumes

# Redeploy
sudo ./deploy/master-deploy.sh
```

⚠️ **Warning:** This removes all Docker volumes (Redis data will be lost)

---

## Maintenance

### SSL Certificate Renewal

**Certificates auto-renew via systemd timer:**

```bash
# Check renewal status
sudo systemctl status certbot.timer

# Test renewal (dry-run)
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

**Auto-renewal is configured** - certificates renew 30 days before expiry.

### Docker Cleanup

```bash
# Remove unused images (frees disk space)
docker system prune -a

# Remove unused volumes (⚠️ caution!)
docker volume prune

# Check disk usage
docker system df
```

### Update Dependencies

**Backend:**
```bash
cd /opt/masstock/backend
npm outdated
npm update

# Rebuild after updates
cd ..
./deploy/build-and-start.sh --rebuild
```

**Frontend:**
```bash
cd /opt/masstock/frontend
npm outdated
npm update

# Rebuild after updates
cd ..
./deploy/build-and-start.sh --rebuild
```

### Backup Strategy

**What to backup:**
1. **Environment files** (not in git):
   - `/opt/masstock/backend/.env.production`

2. **SSL certificates**:
   - `/etc/letsencrypt/live/dorian-gonzalez.fr/`

3. **nginx configuration**:
   - `/etc/nginx/sites-available/masstock.conf`

4. **Database** (Supabase handles this automatically)

**Backup script exists:**
```bash
# Manual backup
sudo /opt/masstock/scripts/backup.sh
```

Backups stored in: `/var/backups/masstock/`

### Updating Production

**Standard workflow:**

1. **Test locally** (always!)
```bash
# On local machine
npm test
npm run build
```

2. **Create feature branch**
```bash
git checkout -b feature/my-feature
# Make changes, commit
git push origin feature/my-feature
```

3. **Create Pull Request**
   - Review changes
   - Ensure tests pass

4. **Merge to main**
```bash
git checkout main
git merge feature/my-feature
git push origin main
```

5. **Automatic deployment** (if GitHub Actions configured)
   - Or manual: `ssh` to VPS and run `./deploy/build-and-start.sh`

6. **Verify deployment**
```bash
./deploy/health-check.sh
```

7. **Monitor for issues**
```bash
docker compose -f docker-compose.production.yml logs -f
```

---

## Quick Reference

### Essential Commands

```bash
# Deploy
sudo ./deploy/master-deploy.sh

# Health check
./deploy/health-check.sh

# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart service
docker compose -f docker-compose.production.yml restart <service>

# Rebuild and deploy
./deploy/build-and-start.sh --rebuild

# Rollback
./deploy/rollback.sh

# Stop all
docker compose -f docker-compose.production.yml down

# Start all
docker compose -f docker-compose.production.yml up -d
```

### File Locations

```
/opt/masstock/                           # Project root
/opt/masstock/.env                       # Docker Compose env (REDIS_PASSWORD)
/opt/masstock/backend/.env.production    # Backend secrets (REDIS_PASSWORD must match!)
/opt/masstock/deploy/*.sh                # Deployment scripts
/etc/nginx/sites-available/masstock.conf # nginx config
/etc/letsencrypt/live/dorian-gonzalez.fr/ # SSL certificates
/var/log/masstock/                       # Deployment logs
/var/log/nginx/                          # nginx logs
/var/backups/masstock/                   # Backups
```

### Redis Configuration

**IMPORTANT:** Redis uses password authentication. The password must be synchronized:

1. **Root `.env`** (for Docker Compose):
   ```env
   REDIS_PASSWORD=your_strong_password_here
   ```

2. **`backend/.env.production`** (for API and Worker):
   ```env
   REDIS_PASSWORD=your_strong_password_here  # MUST be identical!
   ```

3. **`docker-compose.production.yml`** (uses the variable):
   ```yaml
   command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
   ```

**If passwords don't match:** Worker fails to connect → API returns 500 on workflow execution

### Service URLs

```
Frontend:  https://dorian-gonzalez.fr
API:       https://api.dorian-gonzalez.fr
Health:    https://api.dorian-gonzalez.fr/health
```

### Container Names

```
masstock_redis   - Redis job queue
masstock_api     - Express API server
masstock_worker  - Bull worker process
masstock_nginx   - nginx (frontend + proxy)
```

---

## Support

**For deployment issues:**
1. Check logs: `/var/log/masstock/deployment-*.log`
2. Run health check: `./deploy/health-check.sh`
3. Copy error messages
4. Contact: Share error logs with development team

**Documentation:**
- This SOP: `.agent/SOP/deployment.md`
- Project README: `README.md`
- Backend docs: `backend/README.md`
- Frontend docs: `frontend/README.md`

---

**End of SOP**
