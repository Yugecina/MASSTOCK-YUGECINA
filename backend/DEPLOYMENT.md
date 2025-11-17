# MasStock Backend - Deployment Guide

Complete step-by-step deployment guide for production.

## Prerequisites

- Supabase account (free tier)
- Render.com or Railway account (free tier)
- Redis instance (Upstash free tier or Render Redis)

## Step 1: Setup Supabase

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: `masstock-production`
4. Database Password: Generate strong password (save it!)
5. Region: Choose closest to your users
6. Wait for provisioning (~2 minutes)

### 1.2 Get API Credentials

1. Go to Settings > API
2. Copy these values:
   - **Project URL** (`SUPABASE_URL`)
   - **anon public** key (`SUPABASE_ANON_KEY`)
   - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`)

### 1.3 Run Database Migrations

1. Go to SQL Editor in Supabase Dashboard
2. Click "New Query"
3. Copy content from `database/migrations/001_create_tables.sql`
4. Click "Run"
5. Repeat for `002_row_level_security.sql`
6. Repeat for `003_seed_data.sql`

### 1.4 Create Admin User

1. Go to Authentication > Users
2. Click "Add User"
3. Email: `admin@masstock.com`
4. Password: Generate strong password
5. Confirm email automatically: Yes
6. Copy the User UID
7. Go to SQL Editor and run:

```sql
UPDATE users SET role = 'admin'
WHERE id = 'paste-user-uid-here';
```

### 1.5 Create Estee Client User

1. Go to Authentication > Users
2. Click "Add User"
3. Email: `contact@estee-agency.com`
4. Password: Generate password
5. Copy the User UID
6. Go to SQL Editor and run:

```sql
UPDATE clients SET user_id = 'paste-user-uid-here'
WHERE email = 'contact@estee-agency.com';
```

## Step 2: Setup Redis

### Option A: Upstash (Recommended - Free Tier)

1. Go to [upstash.com](https://upstash.com)
2. Create account
3. Create Redis Database
   - Name: `masstock-queue`
   - Region: Same as Supabase
   - Type: Regional
4. Copy connection details:
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`

### Option B: Render Redis

1. In Render Dashboard
2. Click "New +" > "Redis"
3. Name: `masstock-redis`
4. Plan: Free
5. Click "Create Redis"
6. Copy Internal Connection String

## Step 3: Deploy to Render

### 3.1 Push Code to GitHub

```bash
cd /Users/dorian/Documents/MASSTOCK/product/backend
git init
git add .
git commit -m "Initial commit - MasStock Backend"
git branch -M main
git remote add origin https://github.com/your-username/masstock-backend.git
git push -u origin main
```

### 3.2 Create Web Service (API Server)

1. Go to [render.com](https://render.com)
2. Click "New +" > "Web Service"
3. Connect your GitHub repository
4. Configuration:
   - **Name:** `masstock-backend`
   - **Environment:** Node
   - **Region:** Same as Supabase
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   SUPABASE_URL=<from-step-1.2>
   SUPABASE_ANON_KEY=<from-step-1.2>
   SUPABASE_SERVICE_ROLE_KEY=<from-step-1.2>
   REDIS_HOST=<from-step-2>
   REDIS_PORT=<from-step-2>
   REDIS_PASSWORD=<from-step-2>
   JWT_SECRET=<generate-strong-random-key>
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   LOG_LEVEL=info
   CORS_ORIGIN=*
   ```

6. Click "Create Web Service"
7. Wait for deployment (~3-5 minutes)
8. Copy the service URL: `https://masstock-backend.onrender.com`

### 3.3 Create Background Worker

1. Click "New +" > "Background Worker"
2. Connect same repository
3. Configuration:
   - **Name:** `masstock-worker`
   - **Environment:** Node
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `npm run worker`
   - **Plan:** Free

4. Add same environment variables as Web Service
5. Click "Create Background Worker"

## Step 4: Test Deployment

### 4.1 Health Check

```bash
curl https://masstock-backend.onrender.com/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-11-14T...",
  "uptime": 123.456,
  "version": "v1"
}
```

### 4.2 Test Login (Admin)

```bash
curl -X POST https://masstock-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "your-admin-password"
  }'
```

Save the `access_token` from response.

### 4.3 Test Admin Dashboard

```bash
curl https://masstock-backend.onrender.com/api/v1/admin/dashboard \
  -H "Authorization: Bearer <your-access-token>"
```

### 4.4 Test Client Login (Estee)

```bash
curl -X POST https://masstock-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contact@estee-agency.com",
    "password": "your-client-password"
  }'
```

### 4.5 Test Workflow Execution

```bash
# Get workflows
curl https://masstock-backend.onrender.com/api/v1/workflows \
  -H "Authorization: Bearer <estee-access-token>"

# Execute first workflow
curl -X POST https://masstock-backend.onrender.com/api/v1/workflows/<workflow-id>/execute \
  -H "Authorization: Bearer <estee-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": {
      "prompts": ["test image"],
      "count": 1
    }
  }'

# Check execution status
curl https://masstock-backend.onrender.com/api/v1/executions/<execution-id> \
  -H "Authorization: Bearer <estee-access-token>"
```

## Step 5: Configure Monitoring

### 5.1 Render Dashboard

- Monitor CPU/Memory usage
- Check logs for errors
- Set up log drains (optional)

### 5.2 Supabase Dashboard

- Monitor database size
- Check connection pool
- Review slow queries

### 5.3 Uptime Monitoring (Optional)

Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

Add monitor for: `https://masstock-backend.onrender.com/health`

## Step 6: Production Checklist

- [ ] Database migrations completed successfully
- [ ] Admin user created and tested
- [ ] Estee client user created and tested
- [ ] All 10 workflows visible for Estee
- [ ] Redis connected (worker logs show "Redis client connected")
- [ ] Worker processing jobs (test execution completes)
- [ ] API documentation accessible at `/api-docs`
- [ ] Rate limiting working (test with 101 requests in 1 minute)
- [ ] CORS configured correctly
- [ ] JWT tokens expiring correctly
- [ ] Audit logs being created
- [ ] API logs being created
- [ ] Error handling working (test invalid requests)
- [ ] Health endpoint responding
- [ ] Supabase RLS policies active
- [ ] All environment variables set
- [ ] Strong passwords used
- [ ] JWT_SECRET is random and secure

## Step 7: Handoff Information

### For Frontend Developer

**API Base URL:** `https://masstock-backend.onrender.com/api/v1`

**API Documentation:** `https://masstock-backend.onrender.com/api-docs`

**Test Credentials (Estee Client):**
- Email: `contact@estee-agency.com`
- Password: `<provide-password>`

**Example Integration:**
```javascript
// Login
const loginResponse = await fetch('https://masstock-backend.onrender.com/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'contact@estee-agency.com',
    password: 'password'
  })
});

const { data } = await loginResponse.json();
const token = data.access_token;

// Get workflows
const workflowsResponse = await fetch('https://masstock-backend.onrender.com/api/v1/workflows', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const workflows = await workflowsResponse.json();
```

### For UI Designer

**Swagger Spec:** Download from `https://masstock-backend.onrender.com/api-docs`

**Data Models:** See `database/migrations/001_create_tables.sql`

**Sample Responses:** Test each endpoint to see actual data structure

## Troubleshooting

### Service Won't Start

1. Check Render logs
2. Verify all environment variables set
3. Check database connection (SUPABASE_URL correct?)
4. Verify Node version (should be 18+)

### Worker Not Processing Jobs

1. Check Redis connection in worker logs
2. Verify REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
3. Test Redis connection manually
4. Check Render worker is running (not sleeping)

### 401 Errors

1. Verify user exists in Supabase Auth
2. Check user role in users table
3. Verify JWT_SECRET matches between deployments
4. Check token expiration

### Database Errors

1. Verify RLS policies applied
2. Check user permissions in Supabase
3. Review SQL Editor for migration errors
4. Check connection pool limits

### Rate Limiting Too Aggressive

Adjust in environment variables:
```
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=200
```

## Scaling Considerations

### When to Upgrade

**Database (Supabase):**
- More than 500MB data: Upgrade to Pro ($25/mo)
- More than 100 concurrent connections: Upgrade tier

**API Server (Render):**
- Response times > 1s: Upgrade to Starter ($7/mo)
- High CPU usage: Scale horizontally

**Worker (Render):**
- Job queue backing up: Add more workers
- Long-running jobs: Upgrade to larger instance

**Redis:**
- More than 25MB data: Upgrade Upstash tier
- High connection count: Use connection pooling

## Cost Estimates

**MVP (Current):**
- Supabase: Free ($0)
- Render Web Service: Free ($0)
- Render Worker: Free ($0)
- Upstash Redis: Free ($0)
- **Total: $0/month**

**Production (1000 executions/day):**
- Supabase Pro: $25/mo
- Render Starter: $7/mo
- Render Worker: $7/mo
- Upstash: $10/mo
- **Total: ~$49/month**

**Scale (10,000 executions/day):**
- Supabase Pro: $25/mo
- Render Standard: $25/mo (2 instances)
- Render Workers: $14/mo (2 instances)
- Upstash Pro: $30/mo
- **Total: ~$94/month**

## Security Notes

1. **Never commit `.env` file**
2. **Rotate JWT_SECRET regularly**
3. **Use strong passwords** (20+ chars, random)
4. **Enable 2FA** on Supabase/Render accounts
5. **Monitor audit logs** for suspicious activity
6. **Keep dependencies updated** (`npm audit`)
7. **Use HTTPS only** (handled by Render)
8. **Implement IP whitelisting** if needed

## Backup Strategy

**Database:**
- Supabase automatic backups (daily)
- Point-in-time recovery (Pro plan)
- Manual exports weekly

**Redis:**
- Not critical (jobs can be requeued)
- Upstash persistence enabled

**Code:**
- GitHub repository (primary)
- Regular commits
- Tagged releases

## Support

**Deployment Issues:**
- Render Support: https://render.com/docs
- Supabase Support: https://supabase.com/docs

**Backend Questions:**
- Email: dev@masstock.com
- GitHub Issues: (your-repo)

---

**Deployment completed!** API is now live and ready for frontend integration.
