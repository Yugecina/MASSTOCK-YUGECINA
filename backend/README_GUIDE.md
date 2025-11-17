# MasStock Backend - Developer Guide

Quick reference for the MasStock Node.js backend.

## 📋 Current Status

✅ **Database Schema** - Created with Supabase
✅ **Authentication** - JWT implementation complete
✅ **Core Endpoints** - User, workflow, client endpoints ready
⏳ **Workflow Execution** - Job queue setup (Redis/Bull)
⏳ **Admin Features** - Some endpoints in progress
⏳ **Deployment** - Ready for Render/Railway

---

## 🗂️ Related Documentation

### Specifications
- **API Endpoints** → `../docs/briefs/BRIEF_BACKEND_ARCHITECT.md`
- **Database Schema** → See `./src/database/schema.sql`
- **Auth Flow** → `../docs/briefs/BRIEF_BACKEND_ARCHITECT.md` section "Authentication"

### Deployment
- **Deployment Steps** → `./DEPLOYMENT.md`
- **API Testing** → `./API_TESTING.md`
- **Admin Creation** → `./ADMIN_USER_CREATION_GUIDE.md`

### Integration
- **Frontend Integration** → `../../frontend/docs/INTEGRATION_CHECKLIST.md`
- **API Examples** → `./API_EXAMPLES.md`

---

## 🚀 Quick Start

### 1. Setup Environment
```bash
cd /Users/dorian/Documents/MASSTOCK/product/backend

# Copy environment variables
cp .env.example .env

# Update with your Supabase credentials
# SUPABASE_URL=https://...
# SUPABASE_KEY=...
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Database
```bash
# Run migrations (if using Supabase)
npm run migrate
# Or use Supabase dashboard to create tables from schema
```

### 4. Start Development Server
```bash
npm run dev
# Runs on http://localhost:3000
```

### 5. Test API
```bash
curl http://localhost:3000/api/health
# Should return: { status: "ok" }
```

---

## 🔧 Main Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Workflows
```
GET /api/workflows
GET /api/workflows/:id
POST /api/workflows/:id/execute
GET /api/executions/:executionId
```

### Admin
```
GET /api/admin/dashboard
GET /api/admin/clients
GET /api/admin/workflows
GET /api/admin/errors
GET /api/admin/tickets
GET /api/admin/finances
```

**Full spec:** See `../docs/briefs/BRIEF_BACKEND_ARCHITECT.md`

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/              # API endpoints
│   ├── controllers/         # Business logic
│   ├── middleware/          # Auth, logging
│   ├── database/            # Schema, migrations
│   ├── services/            # External integrations
│   └── utils/               # Helpers
├── tests/                   # Test suite
├── .env.example            # Environment variables
├── package.json
├── DEPLOYMENT.md           # Deployment guide
├── API_TESTING.md          # How to test
└── README_GUIDE.md        # This file
```

---

## 🔐 Environment Variables

Required `.env` variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_role_key

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## 🧪 Testing

### Test Single Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"estee@masstock.local","password":"demo123"}'
```

### Run Test Suite
```bash
npm test
```

### Test with Postman
- Import: `API_EXAMPLES.md`
- Or create requests using endpoint spec

---

## 🐛 Common Issues

**"Cannot connect to Supabase"**
- Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Verify Supabase project is active
- Check network connectivity

**"Port 3000 already in use"**
```bash
lsof -ti:3000 | xargs kill -9
```

**"JWT errors on login"**
- Verify `JWT_SECRET` is set in `.env`
- Check user credentials exist in database
- Look at console logs for details

**"CORS errors from frontend"**
- Update `CORS_ORIGIN` in `.env` to match frontend URL
- Default: `http://localhost:5173`

---

## 📊 Database

### Using Supabase

1. Create Supabase project
2. Get credentials from dashboard
3. Add to `.env`
4. Run schema (SQL file in `src/database/`)
5. Database ready!

### Schema Overview
- **users** - User accounts
- **clients** - Client organizations
- **workflows** - Workflow definitions
- **executions** - Workflow run history
- **requests** - Custom workflow requests
- **tickets** - Support tickets
- **audit_logs** - System audit trail
- **api_logs** - API call logs

---

## 🚀 Deployment

### To Render
```bash
# 1. Create Render account & connect GitHub
# 2. Create new Web Service
# 3. Configure environment variables
# 4. Deploy!
```

**Detailed:** See `DEPLOYMENT.md`

### To Railway
```bash
# 1. Link Railway to GitHub
# 2. Deploy from `product/backend` directory
# 3. Add environment variables in dashboard
# 4. Done!
```

---

## 📞 Integration with Frontend

Frontend needs:
1. **API URL** in `.env`: `VITE_API_URL=http://localhost:3000/api`
2. **Backend running** on port 3000
3. **CORS enabled** for frontend origin

Test endpoint:
```bash
curl http://localhost:3000/api/health
# Response: { status: "ok" }
```

---

## 🎯 Next Steps

1. **Setup .env** with Supabase credentials
2. **Install dependencies** → `npm install`
3. **Create database** → Use Supabase dashboard
4. **Start server** → `npm run dev`
5. **Test endpoints** → Use Postman or curl
6. **Connect frontend** → Update frontend `.env`
7. **Deploy** → See `DEPLOYMENT.md`

---

## 📚 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm test` | Run tests |
| `npm run migrate` | Run migrations |
| `npm run build` | Build for production |
| `npm start` | Start production server |

---

## 🔗 More Information

- **Full API Spec:** `../docs/briefs/BRIEF_BACKEND_ARCHITECT.md`
- **Deployment Steps:** `./DEPLOYMENT.md`
- **API Examples:** `./API_EXAMPLES.md`
- **Frontend Integration:** `../../frontend/docs/INTEGRATION_CHECKLIST.md`
- **Project Overview:** `../../PROJECT_OVERVIEW.md`

---

**Status:** 🟢 Ready for development & deployment
**Last Updated:** 2024-11-15
