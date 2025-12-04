# Deployment Fix Summary - masstock.fr Migration

**Date:** 2025-12-04
**Status:** FIXES APPLIED - READY TO DEPLOY

---

## Issues Identified ✅ FIXED

### 1. Container Name Mismatch ✅ FIXED
**Problem:** Deployment scripts referenced `masstock_nginx` but the actual container is `masstock_app`

**Files Fixed:**
- ✅ `deploy/build-and-start.sh:353` - Updated container check loop
- ✅ `deploy/build-and-start.sh:402` - Updated container list
- ✅ `deploy/build-and-start.sh:460` - Updated nginx health check
- ✅ `deploy/health-check.sh:144` - Updated container list
- ✅ `deploy/health-check.sh:172` - Updated resource check list
- ✅ `deploy/health-check.sh:300` - Updated frontend file check

**Container List Updated:**
```bash
# Old (incorrect)
masstock_redis, masstock_api, masstock_worker, masstock_nginx

# New (correct)
masstock_redis, masstock_api, masstock_worker, masstock_app, masstock_vitrine, masstock_n8n
```

---

### 2. Missing Worker Healthcheck ✅ FIXED
**Problem:** Worker container had no healthcheck, causing it to show as "unhealthy"

**File Fixed:** `docker-compose.production.yml:77-82`

**Healthcheck Added:**
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('ioredis').createClient({host:'redis',port:6379,password:process.env.REDIS_PASSWORD}).ping().then(()=>process.exit(0)).catch(()=>process.exit(1))"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

This healthcheck verifies the worker can connect to Redis (its primary dependency).

---

### 3. Missing Environment Variables ⚠️ ACTION REQUIRED

**Problem:** Required environment variables are not set in `backend/.env.production`

**Missing Variables:**
- `REDIS_PASSWORD` - Required by redis, api, worker containers
- `N8N_USER` - Required by n8n container
- `N8N_PASSWORD` - Required by n8n container
- `N8N_ENCRYPTION_KEY` - Required by n8n container (32-byte hex)

**Solution:** Run the generator script (see instructions below)

---

## Current Deployment State (on VPS)

### ✅ Running Containers (5/6 healthy)
```
✅ masstock_redis     - healthy (job queue)
✅ masstock_api       - healthy (backend API)
✅ masstock_app       - healthy (frontend on :8080)
✅ masstock_vitrine   - healthy (landing page on :8081)
✅ masstock_n8n       - healthy (automation on :5678)
⚠️  masstock_worker   - unhealthy (will be fixed after env vars + rebuild)
```

### ✅ Port Mappings
```
VPS nginx:        80, 443    (SSL termination, reverse proxy)
masstock_app:     8080 → 80  (serves frontend React app)
masstock_vitrine: 8081 → 80  (serves landing page)
masstock_api:     3000       (backend API)
masstock_n8n:     5678       (n8n workflows)
masstock_redis:   6379       (internal only)
```

### ✅ VPS Nginx Configuration
The VPS nginx is correctly configured and running, proxying:
- `app.masstock.fr` → localhost:8080 (masstock_app)
- `masstock.fr` → localhost:8081 (masstock_vitrine)
- `api.masstock.fr` → localhost:3000 (masstock_api)
- `n8n.masstock.fr` → localhost:5678 (masstock_n8n)

---

## Action Required on VPS

### Step 1: Pull Latest Code
```bash
ssh root@<vps-ip>
cd /opt/masstock
git pull origin main
```

This will update:
- ✅ `docker-compose.production.yml` - Worker healthcheck added
- ✅ `deploy/build-and-start.sh` - Container names fixed
- ✅ `deploy/health-check.sh` - Container names fixed
- ✅ `deploy/fix-env-variables.sh` - New script to generate credentials

---

### Step 2: Generate Environment Variables

On your **local machine**, run:
```bash
cd /Users/dorian/Documents/MASSTOCK
./deploy/fix-env-variables.sh
```

This will output:
```
🔐 Generating missing environment variables...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ADD THESE TO backend/.env.production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Redis Configuration
REDIS_PASSWORD=<generated-32-char-password>

# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=<generated-32-char-password>
N8N_ENCRYPTION_KEY=<generated-64-char-hex-key>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Copy these values!** You'll need them in the next step.

---

### Step 3: Add Variables to VPS

**On the VPS:**
```bash
# 1. Edit production environment file
nano /opt/masstock/backend/.env.production

# 2. Scroll to the bottom and paste the generated variables:
#    REDIS_PASSWORD=...
#    N8N_USER=admin
#    N8N_PASSWORD=...
#    N8N_ENCRYPTION_KEY=...

# 3. Save and exit (Ctrl+O, Enter, Ctrl+X)

# 4. Verify the file (check last 10 lines)
tail -10 /opt/masstock/backend/.env.production
```

---

### Step 4: Rebuild Containers

**On the VPS:**
```bash
cd /opt/masstock

# Rebuild with new configuration
./deploy/build-and-start.sh --rebuild

# This will:
# 1. Stop all containers
# 2. Rebuild Docker images
# 3. Start containers with new env vars
# 4. Run health checks
```

**Expected output:**
```
[2025-12-04 XX:XX:XX] [SUCCESS] ✅ All containers healthy
[2025-12-04 XX:XX:XX] [INFO] Deployment complete!

Services:
  ✅ masstock_redis     - healthy
  ✅ masstock_api       - healthy
  ✅ masstock_worker    - healthy  ← SHOULD NOW BE HEALTHY
  ✅ masstock_app       - healthy
  ✅ masstock_vitrine   - healthy
  ✅ masstock_n8n       - healthy
```

---

### Step 5: Verify Deployment

**Check container status:**
```bash
docker compose -f docker-compose.production.yml ps
```

All containers should show `healthy` status.

**Run full health check:**
```bash
./deploy/health-check.sh
```

**Test endpoints:**
```bash
# API health
curl https://api.masstock.fr/health

# Frontend (should return HTML)
curl -I https://app.masstock.fr

# Landing page
curl -I https://masstock.fr

# n8n (should return HTML with auth prompt)
curl -I https://n8n.masstock.fr
```

---

## Post-Deployment Verification

### Test n8n Access
1. Open browser: https://n8n.masstock.fr
2. Login with:
   - **Username:** `admin`
   - **Password:** `<N8N_PASSWORD from generator>`
3. Should see n8n dashboard

### Test Application
1. Open browser: https://app.masstock.fr
2. Should redirect to `/login` (auth protection working)
3. Login with existing test user
4. Should see dashboard

### Test API
```bash
# Health check
curl https://api.masstock.fr/health

# Should return:
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Rollback Plan (if needed)

If something goes wrong:

```bash
# 1. Stop containers
docker compose -f docker-compose.production.yml down

# 2. Remove bad env vars from .env.production
nano /opt/masstock/backend/.env.production
# Delete the lines you added

# 3. Checkout previous version
git reset --hard HEAD~1

# 4. Rebuild
./deploy/build-and-start.sh --rebuild

# 5. Check status
docker compose -f docker-compose.production.yml ps
```

---

## Summary of Changes

### Files Modified (Local → Push to Git)
1. ✅ `docker-compose.production.yml` - Added worker healthcheck
2. ✅ `deploy/build-and-start.sh` - Fixed container names (masstock_nginx → masstock_app)
3. ✅ `deploy/health-check.sh` - Fixed container names
4. ✅ `deploy/fix-env-variables.sh` - NEW: Script to generate credentials

### Files to Modify (VPS Only - DO NOT COMMIT)
- ⚠️ `backend/.env.production` - Add REDIS_PASSWORD, N8N_* variables

---

## Architecture Confirmation

### Container Architecture ✅ CORRECT
```
┌─────────────────────────────────────────────┐
│  VPS nginx (ports 80, 443)                  │
│  - SSL termination (Let's Encrypt)          │
│  - Reverse proxy                            │
│  - Domain routing                           │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│  Docker Compose Network                     │
│                                              │
│  masstock_app       (:8080)  ← Frontend     │
│  masstock_vitrine   (:8081)  ← Landing      │
│  masstock_api       (:3000)  ← API          │
│  masstock_n8n       (:5678)  ← Automation   │
│  masstock_worker    (internal) ← Jobs       │
│  masstock_redis     (internal) ← Queue      │
└─────────────────────────────────────────────┘
```

### Domain Routing ✅ CORRECT
- `https://masstock.fr` → VPS nginx:443 → masstock_vitrine:80
- `https://app.masstock.fr` → VPS nginx:443 → masstock_app:80
- `https://api.masstock.fr` → VPS nginx:443 → masstock_api:3000
- `https://n8n.masstock.fr` → VPS nginx:443 → masstock_n8n:5678

---

## Next Steps After Successful Deployment

1. ✅ Verify all containers healthy
2. ✅ Test all endpoints (app, api, n8n, vitrine)
3. ✅ Save n8n credentials securely
4. 📝 Update documentation with final architecture
5. 🚀 Configure CI/CD to auto-deploy to masstock.fr
6. 📊 Set up monitoring (Uptime Robot, logs)
7. 🎨 Develop landing page content for masstock.fr

---

## Questions?

If you encounter issues:

1. **Check logs:**
   ```bash
   docker compose -f docker-compose.production.yml logs -f
   ```

2. **Check specific container:**
   ```bash
   docker logs masstock_worker
   docker logs masstock_n8n
   ```

3. **Check VPS nginx:**
   ```bash
   tail -f /var/log/nginx/masstock-*-error.log
   ```

4. **Run health check:**
   ```bash
   ./deploy/health-check.sh --verbose
   ```

---

**Ready to deploy!** 🚀

Run `./deploy/fix-env-variables.sh` locally first, then follow the VPS steps above.
