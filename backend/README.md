# MasStock Backend API

Complete backend for MasStock SaaS platform - Workflow automation for AI content generation agencies.

## CRITICAL UPDATE (v1.1.0): Auth Sync Fix

### Problem Solved
Previously, users created via Supabase Dashboard only existed in `auth.users` but not in `public.users`, causing **"User not found"** errors during login.

### Solution
Two new admin endpoints that **manually synchronize** both tables, eliminating trigger dependency:

1. **POST /api/v1/admin/create-admin** - Create the first admin (bootstrap, no auth required)
2. **POST /api/v1/admin/users** - Create users/clients (admin authentication required)

**Important:** Always use these endpoints to create users. Never create users directly in Supabase Dashboard.

See [ADMIN_USER_CREATION_GUIDE.md](./ADMIN_USER_CREATION_GUIDE.md) for complete documentation.

---

## Overview

MasStock enables AI content agencies to automate their workflows through custom APIs. The platform supports:
- Custom workflow creation and deployment
- Asynchronous job processing with Bull queue
- Multi-tenant architecture with Row-Level Security
- Comprehensive admin dashboard and monitoring
- Support ticket system
- Audit logging and API analytics

**First Client:** Estee (AI image generation agency) - 2,500 EUR/month subscription

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + JWT
- **Job Queue:** Bull (Redis-based)
- **Cache:** Redis
- **Logging:** Winston
- **API Docs:** Swagger/OpenAPI 3.0
- **Deployment:** Render.com / Railway

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database, Redis, Logger configurations
│   ├── controllers/     # Request handlers
│   │   └── adminController.js   # NEW: Admin user management
│   ├── middleware/      # Auth, logging, error handling, rate limiting
│   ├── routes/          # API route definitions
│   │   └── adminRoutes.js       # NEW: Admin endpoints
│   ├── queues/          # Bull job queue setup
│   ├── workers/         # Background job processors
│   └── server.js        # Main application entry point
├── database/
│   └── migrations/      # SQL schema and RLS policies
│       └── 005_fix_existing_users.sql  # NEW: Sync existing users
├── docs/
│   └── swagger.yaml     # OpenAPI specification
├── logs/                # Application logs (auto-generated)
├── ADMIN_USER_CREATION_GUIDE.md  # NEW: Complete admin guide
├── API_EXAMPLES.md      # NEW: cURL and Postman examples
├── DEPLOYMENT_CHECKLIST.md       # NEW: Deployment guide
├── test-admin-endpoints.sh       # NEW: Automated test script
├── .env.example         # Environment variables template
├── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account (free tier works)
- Redis instance (local or cloud)

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required variables:**

```env
# Supabase (get from dashboard.supabase.com)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3000
NODE_ENV=development
API_VERSION=v1

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Migration

Run migrations in Supabase SQL Editor:

1. Go to `dashboard.supabase.com` > SQL Editor
2. Run `database/migrations/001_create_tables.sql`
3. Run `database/migrations/002_row_level_security.sql`
4. Run `database/migrations/003_seed_data.sql`
5. Run `database/migrations/004_auth_sync_trigger.sql` (NEW)
6. (Optional) Run `database/migrations/005_fix_existing_users.sql` to sync existing users

### 4. Create Admin User (NEW WORKFLOW)

**DO NOT create users in Supabase Dashboard!** Use the API instead:

```bash
# Start the server first
npm run dev

# Create the first admin (in another terminal)
curl -X POST http://localhost:3000/api/v1/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "YourSecurePassword123!",
    "name": "Admin MasStock"
  }'
```

This will return an admin token you can use immediately.

### 5. Start Services

**Terminal 1 - Start Redis (if local):**
```bash
redis-server
```

**Terminal 2 - Start API Server:**
```bash
npm run dev
```

**Terminal 3 - Start Worker:**
```bash
npm run worker
```

### 6. Test API

```bash
# Health check
curl http://localhost:3000/health

# Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@masstock.com", "password": "YourSecurePassword123!"}'

# Run automated test suite
chmod +x test-admin-endpoints.sh
./test-admin-endpoints.sh
```

## Complete Bootstrap Workflow (NEW)

### 1. Create First Admin
```bash
curl -X POST http://localhost:3000/api/v1/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!",
    "name": "Admin MasStock"
  }'
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!"
  }'
```

### 3. Create User with Client
```bash
# Use the admin token from step 2
ADMIN_TOKEN="<your-admin-token>"

curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estee@masstock.com",
    "password": "EsteePassword123!",
    "company_name": "Estee Agency",
    "name": "Estee Manager",
    "plan": "premium_custom",
    "subscription_amount": 2500,
    "role": "user"
  }'
```

### 4. Test User Login (Verify Auth Sync)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estee@masstock.com",
    "password": "EsteePassword123!"
  }'
```

**Expected:** Login successful (no "User not found" error) - Auth sync is working!

See [API_EXAMPLES.md](./API_EXAMPLES.md) for more examples.

## API Documentation

**Local:** http://localhost:3000/api-docs

**Endpoints:**

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Admin - User Management (NEW)
- `POST /api/v1/admin/create-admin` - Create first admin (no auth required)
- `POST /api/v1/admin/users` - Create user/client (admin only)

### Admin - Client Management
- `GET /api/v1/admin/clients` - List all clients
- `GET /api/v1/admin/clients/:id` - Get client details
- `POST /api/v1/admin/clients` - Create client (legacy)
- `PUT /api/v1/admin/clients/:id` - Update client
- `DELETE /api/v1/admin/clients/:id` - Suspend client

### Admin - Monitoring
- `GET /api/v1/admin/dashboard` - Dashboard statistics
- `GET /api/v1/admin/workflows/stats` - Workflow performance
- `GET /api/v1/admin/errors` - Error logs
- `GET /api/v1/admin/audit-logs` - Audit trail

### Workflows (Client)
- `GET /api/v1/workflows` - List all workflows
- `GET /api/v1/workflows/:id` - Get workflow details
- `POST /api/v1/workflows/:id/execute` - Execute workflow
- `GET /api/v1/workflows/:id/executions` - Get execution history
- `GET /api/v1/workflows/:id/stats` - Get workflow statistics

### Executions
- `GET /api/v1/executions/:id` - Get execution status and results

### Workflow Requests
- `POST /api/v1/workflow-requests` - Submit new workflow request
- `GET /api/v1/workflow-requests` - List all requests
- `GET /api/v1/workflow-requests/:id` - Get request details
- `PUT /api/v1/workflow-requests/:id` - Update request

### Support Tickets
- `POST /api/v1/support-tickets` - Create ticket
- `GET /api/v1/support-tickets` - List tickets
- `GET /api/v1/support-tickets/:id` - Get ticket details
- `PUT /api/v1/support-tickets/:id` - Update ticket (admin)

## Authentication Flow

All endpoints (except `/auth/login`, `/auth/refresh`, and `/admin/create-admin`) require JWT authentication.

**Example:**

```bash
# 1. Login
RESPONSE=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "estee@masstock.com", "password": "EsteePassword123!"}')

# 2. Extract token
TOKEN=$(echo $RESPONSE | jq -r '.data.access_token')

# 3. Use token in requests
curl http://localhost:3000/api/v1/workflows \
  -H "Authorization: Bearer $TOKEN"
```

## Multi-tenant Architecture

Every endpoint verifies the authenticated user's `client_id`. Row-Level Security (RLS) policies ensure:

- Clients can ONLY see their own data
- Admins can see ALL data
- No cross-client data leakage

**Example RLS Policy:**
```sql
CREATE POLICY "Clients view own workflows" ON workflows
  FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

## Testing

### Automated Test Suite
```bash
chmod +x test-admin-endpoints.sh
./test-admin-endpoints.sh
```

This will test:
- Admin creation
- Admin authentication
- User creation
- User login (auth sync verification)
- Client creation

### Manual Testing
See [API_EXAMPLES.md](./API_EXAMPLES.md) for cURL and Postman examples.

## Rate Limiting

- **API endpoints:** 100 req/15min per IP
- **Auth endpoints:** 10 req/15min per IP
- **Admin endpoints:** 50 req/15min per IP
- **Workflow executions:** 10 req/min per client

## Deployment

### Render.com (Recommended)

1. **Create Web Service:**
   - Runtime: Node
   - Build: `npm install`
   - Start: `npm start`

2. **Create Background Worker:**
   - Runtime: Node
   - Build: `npm install`
   - Start: `npm run worker`

3. **Add Redis:**
   - Type: Redis
   - Plan: Free (25 MB)

4. **Environment Variables:**
   - Add all vars from `.env.example`
   - Set `NODE_ENV=production`

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete deployment guide.

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
API_VERSION=v1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
CORS_ORIGIN=https://your-frontend-domain.com
```

## Monitoring & Logging

**Log files:** `./logs/`
- `combined.log` - All logs
- `error.log` - Errors only

**Database logs:**
- `api_logs` table - All API requests
- `audit_logs` table - All actions with user/client context

**View logs:**
```bash
# Tail combined logs
tail -f logs/combined.log

# Tail errors only
tail -f logs/error.log
```

## Troubleshooting

### "User not found" error on login
**Cause:** User exists in auth.users but not in public.users

**Solution 1 (Recommended):** Always create users via API endpoints:
```bash
POST /api/v1/admin/create-admin  # For first admin
POST /api/v1/admin/users         # For all other users
```

**Solution 2:** Manually sync existing users:
```sql
-- Run in Supabase SQL Editor
-- See database/migrations/005_fix_existing_users.sql
```

### "Admin already exists" error
**Cause:** Trying to use POST /admin/create-admin when an admin already exists

**Solution:** Use POST /admin/users instead (requires admin token)

### Database Connection Failed
```bash
# Verify Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection in Supabase dashboard
```

### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Or use cloud Redis (Upstash, Railway)
```

### Worker Not Processing Jobs
```bash
# Check Redis connection
# Check worker logs: npm run worker
# Verify queue in Redis:
redis-cli
> KEYS bull:workflow-execution:*
```

### 401 Unauthorized
```bash
# Token expired - refresh token
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your-refresh-token"}'
```

## Development

```bash
# Run in development mode (auto-reload)
npm run dev

# Run worker
npm run worker

# Run tests
npm test

# Check code style
npm run lint
```

## Production Checklist

- [ ] Run all database migrations
- [ ] Create admin user via API (not Supabase Dashboard)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to frontend domain
- [ ] Enable HTTPS (handled by Render/Railway)
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure backup retention in Supabase
- [ ] Test all endpoints with production data
- [ ] Load test with expected traffic
- [ ] Document error codes for frontend
- [ ] Set up alerting for failed jobs
- [ ] Verify auth sync is working (test user login)

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete checklist.

## API Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Paginated:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "limit": 50,
    "offset": 0,
    "page": 1
  }
}
```

## Changelog

### Version 1.1.0 (2025-11-14)
**BREAKING CHANGES:** None (backward compatible)

**NEW FEATURES:**
- Admin user creation endpoints (POST /admin/create-admin, POST /admin/users)
- Manual auth sync function (syncAuthToDatabase)
- Comprehensive admin user creation guide
- API examples and test suite
- SQL migration to fix existing users

**BUG FIXES:**
- Fixed "User not found" error on login
- Ensured auth.users and public.users sync

**DOCUMENTATION:**
- Added ADMIN_USER_CREATION_GUIDE.md
- Added API_EXAMPLES.md
- Added DEPLOYMENT_CHECKLIST.md
- Added test-admin-endpoints.sh
- Updated README.md

### Version 1.0.0 (2025-11-13)
- Initial release
- Multi-tenant architecture
- Workflow management
- Admin dashboard
- Support tickets
- Audit logging

## Support

- **Documentation:** See ADMIN_USER_CREATION_GUIDE.md and API_EXAMPLES.md
- **API Docs:** http://localhost:3000/api-docs
- **Issues:** Contact backend team
- **Email:** support@masstock.com

## License

Proprietary - MasStock SaaS Platform

---

**Built with Node.js, Express, Supabase, and Redis**

**Next Steps:**
1. Read [ADMIN_USER_CREATION_GUIDE.md](./ADMIN_USER_CREATION_GUIDE.md) for admin operations
2. Check [API_EXAMPLES.md](./API_EXAMPLES.md) for integration examples
3. Follow [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for production deployment
