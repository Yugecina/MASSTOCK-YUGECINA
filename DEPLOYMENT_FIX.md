# Deployment Fix: TypeScript Compilation Issue

## Problem
The `masstock_api` container was failing health checks and marked as unhealthy, causing dependent containers (worker, app) to fail. The root cause was a TypeScript build configuration issue in production.

## Root Cause
1. **TypeScript not compiled**: Production Docker image was trying to run `.ts` files directly
2. **ts-node missing in production**: `ts-node` was only in devDependencies, not available in production container
3. **No build step**: Multi-stage Docker build didn't include TypeScript compilation step
4. **Wrong start script**: Used `ts-node src/server.ts` instead of `node dist/server.js`

## Solution Applied

### 1. Updated package.json Scripts
- Changed `start` script from `ts-node src/server.ts` to `node dist/server.js`
- Added `build` script: `tsc`
- Added production scripts: `migrate:prod`, `worker:prod`

**File:** `/Users/dorian/Documents/MASSTOCK/backend/package.json`

### 2. Updated Dockerfile Build Process
- Added TypeScript compilation in build stage
- Copy `tsconfig.json` to build stage
- Run `npm run build` to compile TS to JS
- Copy compiled `dist/` folder to production stage (not source files)
- Removed unnecessary `.env.production` copy (handled by docker-compose)

**File:** `/Users/dorian/Documents/MASSTOCK/backend/Dockerfile`

### 3. Updated tsconfig.json
- Excluded test files from compilation: `**/__tests__/**`
- Build output: `dist/` directory

**File:** `/Users/dorian/Documents/MASSTOCK/backend/tsconfig.json`

### 4. Created .dockerignore
- Exclude test files, coverage, logs
- Exclude node_modules (installed in container)
- Exclude source dist folder (rebuilt in container)

**File:** `/Users/dorian/Documents/MASSTOCK/backend/.dockerignore`

### 5. Updated docker-compose.production.yml
- Changed worker command from `npm run worker` to `npm run worker:prod`

**File:** `/Users/dorian/Documents/MASSTOCK/docker-compose.production.yml`

## Files Changed
- `backend/package.json` - Updated scripts
- `backend/Dockerfile` - Added build step, fixed copy commands
- `backend/tsconfig.json` - Excluded test files
- `backend/.dockerignore` - Added (new file)
- `docker-compose.production.yml` - Updated worker command

## Deployment Steps

### On VPS
```bash
# 1. Pull latest changes
cd /opt/masstock
git pull origin main

# 2. Rebuild containers
docker-compose -f docker-compose.production.yml build --no-cache

# 3. Stop and remove old containers
docker-compose -f docker-compose.production.yml down

# 4. Start services
docker-compose -f docker-compose.production.yml up -d

# 5. Verify health
docker ps
docker logs masstock_api
docker exec masstock_api wget -qO- http://localhost:3000/health
```

## Verification Checklist
- [ ] `masstock_api` container starts without errors
- [ ] Health check endpoint returns `{"status":"ok"}`
- [ ] Container status shows "healthy" (not "unhealthy")
- [ ] `masstock_worker` starts successfully
- [ ] `masstock_app` serves frontend
- [ ] API responds at `https://api.dorian-gonzalez.fr/health`
- [ ] Contact form submission works

## Testing Locally
```bash
# Test TypeScript compilation
cd backend
npm run build
ls -la dist/

# Test compiled JavaScript runs
node dist/server.js

# Test in Docker
docker build -t masstock-api:test -f backend/Dockerfile backend/
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  masstock-api:test
```

## Prevention Recommendations
1. **Always compile TypeScript before production deployment**
2. **Use `node dist/` in production, `ts-node src/` in development**
3. **Test Docker builds locally before deploying to VPS**
4. **Add CI/CD step to verify Docker image builds successfully**
5. **Monitor container health checks in production**

## Related Documentation
- Backend CLAUDE.md: `/Users/dorian/Documents/MASSTOCK/backend/CLAUDE.md`
- Project Architecture: `/Users/dorian/Documents/MASSTOCK/.agent/system/project_architecture.md`
- Docker Compose: `/Users/dorian/Documents/MASSTOCK/docker-compose.production.yml`

## Contact Form Feature
The deployment issue was triggered by adding new contact form features:
- `backend/src/controllers/contactController.ts` (NEW)
- `backend/src/services/emailService.ts` (NEW)
- `backend/src/routes/contactRoutes.ts` (NEW)
- `backend/src/middleware/rateLimit.ts` (MODIFIED)
- `backend/src/server.ts` (MODIFIED - CORS config)

These files are now properly compiled to JavaScript in the production build.

---

**Date:** 2025-12-19
**Status:** FIXED - Ready for deployment
**Impact:** Production deployment was broken, now resolved
