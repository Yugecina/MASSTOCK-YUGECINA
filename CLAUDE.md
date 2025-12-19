# MasStock - SaaS Workflow Automation Platform

## Overview
- **Type:** Standard monorepo (Backend + Frontend + Landing)
- **Stack:** React 19 + Node.js/Express + Supabase + Redis + Gemini AI
- **Architecture:** 3-tier (Frontend → API → Database + Workers)
- **Deployment:** Docker Compose, Nginx, SSL, CI/CD (GitHub Actions)
- **Landing Page:** React 19 + TypeScript + Vite + Tailwind CSS (masstock.fr)

This CLAUDE.md is the authoritative source for development guidelines.
Subdirectories contain specialized CLAUDE.md files that extend these rules.

**Documentation Hub:** All detailed docs live in `.agent/` folder (see [.agent/README.md](.agent/README.md))

---

## Universal Development Rules

### Code Quality (MUST)
- **MUST** write tests for all new features (TDD approach: Red → Green → Refactor)
- **MUST** maintain ≥70% test coverage (branches, functions, lines, statements)
- **MUST** write ALL new files in TypeScript (.ts/.tsx) - JavaScript (.js/.jsx) is deprecated
- **MUST** use **Pure CSS** for main app (`frontend/`) - Tailwind allowed ONLY in `frontend-vitrine/` (landing page)
- **MUST** validate ALL inputs with Zod on backend
- **MUST** enable Row Level Security (RLS) on ALL new Supabase tables
- **MUST** use httpOnly cookies for JWT tokens (NEVER localStorage)
- **MUST** use comprehensive error logging with console (emoji indicators, full context)
- **MUST** use parameterized queries (prevent SQL injection)
- **MUST** apply rate limiting to ALL public endpoints
- **MUST NOT** commit secrets, API keys, or tokens to git
- **MUST NOT** commit/push automatically unless user explicitly requests it
- **MUST NOT** create test scripts - user tests in real conditions with console logging

### Best Practices (SHOULD)
- **SHOULD** follow TDD: write failing test first, then implement
- **SHOULD** use descriptive variable names (no single letters except loop counters)
- **SHOULD** keep functions under 50 lines of code
- **SHOULD** extract complex logic into separate utility functions
- **SHOULD** use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)
- **SHOULD** run tests before every commit
- **SHOULD** use CSS classes from `frontend/src/styles/global.css`
- **SHOULD** log all errors to console with detailed context (component name, error object, data)

### Anti-Patterns (MUST NOT)
- **MUST NOT** use Tailwind classes in main app (`frontend/`) - Pure CSS only. Tailwind is allowed ONLY in `frontend-vitrine/`
- **MUST NOT** create new JavaScript files (.js/.jsx) - use TypeScript (.ts/.tsx) instead
- **MUST NOT** bypass TypeScript errors without explicit justification
- **MUST NOT** push directly to main branch without PR
- **MUST NOT** skip RLS policies on database tables
- **MUST NOT** expose stack traces in production
- **MUST NOT** hardcode API keys or secrets in code
- **MUST NOT** use `test.skip` or `describe.skip` without documented reason
- **MUST NOT** commit console.log in production code (use Winston logger in backend)

---

## Core Commands

### Development
```bash
# Start all services (use /start_masstock slash command)
cd backend && npm run dev &          # API on http://localhost:3000
cd frontend && npm run dev &         # UI on http://localhost:5173
cd backend && npm run worker &       # Background job worker

# Start landing page separately
cd frontend-vitrine && npm run dev  # Landing on http://localhost:5174

# Or use the slash command:
/start_masstock
```

### Testing
```bash
# Backend
cd backend
npm test                    # Run all tests with coverage
npm run test:unit           # Unit tests only
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Frontend
cd frontend
npm test                    # Run all tests with coverage
npm run test:watch          # Watch mode (Vitest)
npm run test:ui             # Vitest UI
npm run lint                # ESLint

# Quality gates (run before PR)
cd backend && npm test && cd ../frontend && npm run lint && npm test
```

### Database
```bash
# Migrations
cd backend
npm run migrate             # Apply pending migrations

# Supabase operations (via MCP)
# Use mcp__supabase__* tools for queries and migrations
```

### Package Management
```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Add new dependency (requires permission)
npm install <package-name>
```

---

## Project Structure

### Applications

**`backend/`** → Node.js/Express API ([see backend/CLAUDE.md](backend/CLAUDE.md))
- Entry point: `src/server.js`
- Controllers: `src/controllers/` - Request handlers with Zod validation
- Routes: `src/routes/` - API endpoints with auth middleware
- Middleware: `src/middleware/` - Auth (JWT), rate limiting, error handling
- Workers: `src/workers/` - Bull job queues for async workflows
- Services: `src/services/` - Business logic (Gemini API integration)
- Database: `src/database/` - Migration runner
- Tests: `src/__tests__/` - Jest unit/integration tests
- Scripts: `scripts/` - Utility scripts (seed data, fix users, debug)

**`frontend/`** → React 19 SPA ([see frontend/CLAUDE.md](frontend/CLAUDE.md))
- Entry point: `src/main.jsx`
- Routes: `src/App.jsx` - React Router setup
- Pages: `src/pages/` - Route components
- Components: `src/components/` - Reusable UI components
- Store: `src/store/` - Zustand global state
- Services: `src/services/` - API client (Axios)
- Hooks: `src/hooks/` - Custom React hooks
- Styles: `src/styles/` - **Pure CSS only (NO Tailwind)**
- Tests: `src/__tests__/` - Vitest + React Testing Library

**`frontend-vitrine/`** → Landing Page (masstock.fr)
- Entry point: `index.html`, `index.tsx`
- Stack: React 19 + TypeScript + Vite + Tailwind CSS
- Components: Single-file `App.tsx` with all landing sections
- Styles: **Tailwind CSS** (via CDN)
- Deployment: Static build, served separately from main app

### Infrastructure

**`.agent/`** → Documentation hub
- `system/` - Architecture, database schema, async workers
- `SOP/` - Standard Operating Procedures (migrations, routes, components, security)
- `tasks/` - Feature PRDs and implementation plans
- See [.agent/README.md](.agent/README.md) for full index

**`.github/workflows/`** → CI/CD pipelines
- `tests.yml` - Run tests on PRs
- `deploy.yml` - Auto-deploy on push to `main`

**`scripts/`** → Deployment and maintenance
- `health-check.sh` - Monitor services
- `backup.sh` - Automated backups
- `setup-ssl.sh` - SSL certificate management

**`deploy/`** → Production deployment scripts
- Docker Compose configs
- Nginx configuration
- VPS setup scripts

### Testing
- **Unit tests:** Co-located with source (`*.test.js`, `*.test.jsx`)
- **Integration tests:** `backend/src/__tests__/integration/`
- **E2E tests:** Manual testing with console-first debugging

---

## Quick Find Commands

### Code Navigation
```bash
# Find backend controllers
rg -n "^(async )?function" backend/src/controllers

# Find API endpoints
rg -n "router\.(get|post|put|delete)" backend/src/routes

# Find React components
rg -n "^export (function|const).*=.*\(" frontend/src/components

# Find Zustand stores
rg -n "create\(" frontend/src/store

# Find database migrations
ls -la backend/database/migrations/

# Find CSS classes
rg -n "^\." frontend/src/styles/global.css

# Find hooks
rg -n "^export.*use[A-Z]" frontend/src/hooks
```

### Dependency Analysis
```bash
# Check package dependencies
npm ls <package-name>

# Find where package is used
rg -n "from ['\"]<package-name>" .

# Check for outdated packages
npm outdated
```

### Database Queries
```bash
# List all tables (via Supabase MCP)
# Use: mcp__supabase__list_tables

# Execute SQL query (via Supabase MCP)
# Use: mcp__supabase__execute_sql

# Apply migration (via Supabase MCP)
# Use: mcp__supabase__apply_migration
```

---

## Security Guidelines

### Secrets Management
- **NEVER** commit tokens, API keys, credentials, or `.env` files
- Use `.env.local` for local secrets (already in `.gitignore`)
- Use environment variables for CI/CD secrets
- PII must be redacted in logs
- Use `SUPABASE_SERVICE_ROLE_KEY` only in backend (never frontend)
- Use `SUPABASE_ANON_KEY` in frontend

### Authentication & Authorization
- JWT tokens in httpOnly cookies (15min expiry)
- Refresh tokens in httpOnly cookies (7d expiry)
- Automatic token refresh via Axios interceptor (see `.agent/SOP/token_refresh.md`)
- All endpoints require auth except `/api/v1/auth/login`, `/api/v1/auth/refresh`
- RLS policies enforce client isolation at database level
- Rate limiting: 100 req/15min general, 5 req/15min auth endpoints

### Input Validation
- ALL API inputs validated with Zod schemas
- Sanitize user-generated content before display
- Use parameterized queries (Supabase client handles this)
- Never use `eval()` or `Function()` constructors

### Safe Operations
- Review generated bash commands before execution
- Confirm before: `git force push`, `rm -rf`, database drops, production deploys
- Use staging environment for risky operations
- Always test migrations locally before applying to production

### OWASP Top 10 Checklist
- ✅ Injection: Parameterized queries, Zod validation
- ✅ Broken Authentication: JWT + httpOnly cookies, token rotation
- ✅ Sensitive Data Exposure: Never log secrets, use HTTPS
- ✅ XML External Entities: Not applicable (JSON only)
- ✅ Broken Access Control: RLS policies on all tables
- ✅ Security Misconfiguration: Environment-based configs
- ✅ XSS: React auto-escapes, Content Security Policy headers
- ✅ Insecure Deserialization: Validate all JSON inputs
- ✅ Using Components with Known Vulnerabilities: `npm audit` in CI
- ✅ Insufficient Logging & Monitoring: Winston logger, health checks

---

## Git Workflow

### Branch Strategy
- Branch from `main` for features: `feature/description`
- Branch types: `feature/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`
- Keep branches short-lived (< 3 days if possible)
- Delete branches after merge

### Commit Messages
Use Conventional Commits format:
```
<type>(<scope>): <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, missing semicolons)
- `refactor`: Code restructuring without behavior change
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (deps, config)
- `perf`: Performance improvements

**Examples:**
```bash
feat(auth): add automatic token refresh system
fix(workflows): resolve timeout issues in Nano Banana execution
docs(security): add security audit results to .agent/SOP
test(admin): increase coverage for user management endpoints
```

### Pull Request Process
1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Ensure tests pass: `npm test` (≥70% coverage)
5. Run linter: `npm run lint` (frontend only)
6. Push branch: `git push origin feature/xyz`
7. Create PR with description
8. Wait for CI checks (tests, coverage)
9. Request review
10. Address feedback
11. Squash and merge to `main`
12. Delete branch

### Pre-Commit Checklist
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run lint && npm test

# If all green ✅
git add .
git commit -m "feat: your feature description"
```

---

## Testing Requirements

### Test-Driven Development (TDD)
**Mandatory workflow:**
1. **RED** ❌ - Write a failing test
2. **GREEN** ✅ - Write minimum code to pass
3. **REFACTOR** ♻️ - Improve code quality

### Coverage Requirements
- **Minimum:** 70% coverage (branches, functions, lines, statements)
- **Enforced by:** CI/CD pipeline (GitHub Actions)
- **Check locally:** `npm run test:coverage`

### Unit Tests
- **Location:** Co-located with source files
- **Backend:** `src/__tests__/` or `*.test.js`
- **Frontend:** `src/__tests__/` or `*.test.jsx`
- **Frameworks:** Jest (backend), Vitest (frontend)
- **Pattern:** Test behavior, not implementation
- **Examples:** See `backend/src/__tests__/controllers/` and `frontend/src/__tests__/`

### Integration Tests
- **Location:** `backend/src/__tests__/integration/`
- **Purpose:** Test API endpoints, database operations, auth flow
- **Example:** `auth-persistence.integration.test.js`

### E2E Tests
- **Approach:** Manual testing in real conditions
- **Method:** Console-first debugging with detailed error logging
- **Pattern:** User tests on actual client interface, reports console logs
- **NO test scripts** unless explicitly requested

### Error Logging Standards
**Every error must include:**
```javascript
console.log('✅ Component: Success message', { data, keys })
console.error('❌ Component.function: Error details', {
  error: err,
  message: err.message,
  response: err.response,
  status: err.response?.status,
  context: { executionId, userId, etc }
})
```

**Emoji indicators:**
- 🔍 Loading/fetching
- ✅ Success
- ❌ Error
- 📦 Data received
- 🚀 Initialization
- ⚠️ Warning

---

## Available Tools

### Standard Tools
You have access to:
- `bash` - Shell commands (git, npm, node, curl, etc.)
- `rg` (ripgrep) - Fast text search
- `tree` - Directory structure visualization
- `git` - Version control
- `npm` - Package management
- `node` - JavaScript execution
- `redis-cli` - Redis operations
- `gh` - GitHub CLI (issues, PRs, releases)

### MCP Servers (Model Context Protocol)
- **Supabase MCP** ✅ Active - Database operations, migrations, logs
  - `mcp__supabase__list_tables`
  - `mcp__supabase__execute_sql`
  - `mcp__supabase__apply_migration`
  - `mcp__supabase__get_logs`
  - `mcp__supabase__get_advisors`
  - See all tools with `claude mcp list`

### Tool Permissions

**✅ Allowed without asking:**
- Read any file
- Write code files (`.js`, `.jsx`, `.css`, `.md`)
- Run tests (`npm test`, `npm run test:watch`)
- Run linters (`npm run lint`)
- Check git status (`git status`, `git diff`, `git log`)
- Run dev servers (`npm run dev`)
- Execute non-destructive scripts in `backend/scripts/`
- Run Redis read operations (`redis-cli PING`, `redis-cli GET`)
- Execute Supabase SELECT queries via MCP

**❌ Requires explicit user permission:**
- Edit `.env` or `.env.production` files
- Run `git push` (unless user says "commit and push" or "push this")
- Run destructive commands (`rm -rf`, `DROP TABLE`, `FLUSHALL`)
- Run database migrations (`npm run migrate` or `mcp__supabase__apply_migration`)
- Deploy to production
- Force push (`git push --force`)
- Install new dependencies (`npm install <package>`)
- Delete files in `backend/database/migrations/`

**🚫 Blocked (safety hooks):**
- Writing Tailwind classes (auto-blocked by hook)
- Force push to `main` branch (requires confirmation)
- Editing `.env` files without warning

---

## Specialized Context

When working in specific directories, refer to their CLAUDE.md for detailed guidance:

### Backend Development
**File:** [backend/CLAUDE.md](backend/CLAUDE.md)

**Covers:**
- Express server architecture
- Controller patterns with Zod validation
- Middleware (auth, rate limiting, error handling)
- Bull workers and job queues
- Redis integration
- Gemini API service
- Jest testing patterns
- Database migrations
- Common backend patterns

**When to read:** Adding endpoints, workers, middleware, backend tests

### Frontend Development
**File:** [frontend/CLAUDE.md](frontend/CLAUDE.md)

**Covers:**
- React 19 patterns (functional components, hooks)
- **Pure CSS styling system** (NO Tailwind)
- Zustand state management
- Axios API client with token refresh
- React Router setup
- Form handling (React Hook Form + Zod)
- Vitest testing patterns
- Component architecture
- Common UI patterns

**When to read:** Adding pages, components, styles, frontend tests

### Documentation & SOPs
**Folder:** [.agent/](.agent/)

**Key files:**
- [.agent/README.md](.agent/README.md) - Documentation index
- [.agent/system/project_architecture.md](.agent/system/project_architecture.md) - System overview
- [.agent/system/database_schema.md](.agent/system/database_schema.md) - Database structure
- [.agent/system/async_workers.md](.agent/system/async_workers.md) - Worker concurrency
- [.agent/SOP/add_migration.md](.agent/SOP/add_migration.md) - How to add migrations
- [.agent/SOP/add_route.md](.agent/SOP/add_route.md) - How to add API endpoints
- [.agent/SOP/add_component.md](.agent/SOP/add_component.md) - How to add components
- [.agent/SOP/token_refresh.md](.agent/SOP/token_refresh.md) - Token refresh system
- [.agent/SOP/security_audit_2025_11.md](.agent/SOP/security_audit_2025_11.md) - Security audit

**When to read:** Before implementing new features, debugging, understanding architecture

---

## Environment Variables

### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx

# Server
PORT=3000
NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=xxx
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Gemini API
GEMINI_API_KEY=xxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_ENV=development
VITE_LOG_LEVEL=debug
```

---

## Troubleshooting

### Backend won't start
```bash
# Check Supabase connection
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"

# Check Redis
redis-cli ping

# Check port availability
lsof -i :3000

# Kill process on port
lsof -ti :3000 | xargs kill
```

### Frontend build fails
```bash
# Clear Vite cache
rm -rf frontend/node_modules/.vite
rm -rf frontend/dist

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Tests failing
```bash
# Backend - clear Jest cache
cd backend
npm test -- --clearCache
npm test

# Frontend - clear Vitest cache
cd frontend
npx vitest --clearCache
npm test
```

### Worker not processing jobs
```bash
# Check Redis connection
redis-cli ping

# Check job queue
redis-cli LLEN bull:workflow-queue:wait

# Restart worker
pkill -f workflow-worker
npm run worker
```

### Database migration issues
```bash
# Check migration files
ls -la backend/database/migrations/

# Check Supabase connection
# Use: mcp__supabase__list_tables

# Manually apply migration
# Use: mcp__supabase__apply_migration
```

### Authentication issues
```bash
# Check JWT secret
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET)"

# Test token refresh
node backend/scripts/test-token-refresh.js

# Check auth users
node backend/scripts/check-auth-users.js
```

---

## Custom Slash Commands

MasStock provides custom slash commands for common workflows:

- **`/start_masstock`** - Start backend + frontend + worker (already configured)
- **`/run_tests`** - Run all tests (backend + frontend) with coverage
- **`/check_security`** - Run security audit checklist
- **`/new_migration`** - Create a new database migration with template
- **`/new_endpoint`** - Scaffold a new API endpoint (TDD)
- **`/new_component`** - Scaffold a new React component (TDD)
- **`/review_pr`** - Comprehensive PR review checklist
- **`/debug_workflow`** - Debug workflow execution issues

See `.claude/commands/` for implementation details.

---

## Getting Help

### Documentation
1. **Start here:** This file (CLAUDE.md)
2. **System understanding:** [.agent/system/project_architecture.md](.agent/system/project_architecture.md)
3. **Database:** [.agent/system/database_schema.md](.agent/system/database_schema.md)
4. **How-to guides:** [.agent/SOP/](.agent/SOP/)
5. **Backend details:** [backend/CLAUDE.md](backend/CLAUDE.md)
6. **Frontend details:** [frontend/CLAUDE.md](frontend/CLAUDE.md)

### Common Questions
- **How do I add a new table?** → [.agent/SOP/add_migration.md](.agent/SOP/add_migration.md)
- **How do I add a new endpoint?** → [.agent/SOP/add_route.md](.agent/SOP/add_route.md)
- **How do I add a new component?** → [.agent/SOP/add_component.md](.agent/SOP/add_component.md)
- **How does auth work?** → [.agent/SOP/token_refresh.md](.agent/SOP/token_refresh.md)
- **How do workers work?** → [.agent/system/async_workers.md](.agent/system/async_workers.md)
- **What are the security requirements?** → [.agent/SOP/security_audit_2025_11.md](.agent/SOP/security_audit_2025_11.md)

### External Resources
- **React 19:** https://react.dev
- **Vite:** https://vite.dev
- **Supabase:** https://supabase.com/docs
- **Node.js:** https://nodejs.org/docs
- **Express:** https://expressjs.com
- **Zustand:** https://zustand-demo.pmnd.rs
- **Zod:** https://zod.dev
- **Bull:** https://github.com/OptimalBits/bull

---

**Last Updated:** 2025-11-30
**Version:** 3.0 (Claude Code optimized)
