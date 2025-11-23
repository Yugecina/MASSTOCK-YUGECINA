# CLAUDE.md

MasStock: SaaS workflow automation platform for AI content agencies. React 19 + Node.js/Express + Supabase.

# DOCS
We keep all important docs in .agent folder and keep updating them, structure like below

.agent
- Tasks: PRD & implementation plan for each feature
- System: Document the current state of the system (project structure, tech stack, integration points, database schema, and core functionalities such as agent architecture, LLM layer, etc.)
- SOP: Best practices of execute certain tasks (e.g. how to add a schema migration, how to add a new page route, etc.)
- README.md: an index of all the documentations we have so people know what & where to look for things

We should always update . agent docs after we implement certain featrue, to make sure it fully reflect the up to date information

Before you plan any implementation, always read the .agent/README first to get context

## Structure

```
backend/src/     # Express API, Jest tests
  __tests__/     # Unit tests
  controllers/   # Request handlers
  middleware/    # Auth, errors, rate limiting
  routes/        # API endpoints
  queues/        # Bull job queues
  workers/       # Background jobs

frontend/src/    # React 19 + Vite, Vitest tests
  components/    # UI components
  pages/         # Route components
  store/         # Zustand state
  services/      # API calls
  hooks/         # Custom hooks
```

## Stack

**Backend:** Node.js 18+, Express, Supabase (PostgreSQL), Supabase Auth + JWT, Bull + Redis, Winston, Jest + Supertest
**Frontend:** React 19.2.0, Vite 7.2.2, **Pure CSS ONLY (NO Tailwind)**, Zustand 5.0.8, React Router DOM 7.9.6, Axios 1.13.2, React Hook Form + Zod, Vitest + React Testing Library

## Styling Rules (CRITICAL)

**ABSOLUTE RULE: ZERO Tailwind. Pure CSS only.**

✅ **DO:** Use classes from `src/styles/global.css` (`.text-h1`, `.btn`, `.flex`, `.p-6`, `.gap-md`) or CSS variables (`var(--primary)`, `var(--spacing-md)`)
❌ **DON'T:** Tailwind classes (`px-4`, `py-2`, `text-sm`, `rounded-lg`, etc.), `@tailwind` directives, tailwind.config.js

```jsx
// ✅ CORRECT
<button className="btn btn-primary">Click</button>
<div className="flex items-center gap-md p-6">

// ❌ WRONG
<button className="px-6 py-2 bg-blue-500 rounded-lg">Click</button>
```

## Security Essentials

- **Auth:** Validate JWT, never expose service keys in frontend, httpOnly cookies (NOT localStorage)
- **RLS:** Enable on ALL Supabase tables, document policies in migrations
- **Input:** Validate ALL inputs with Zod on backend, use parameterized queries
- **Rate Limiting:** Apply to ALL public endpoints, stricter on auth endpoints
- **CORS:** Whitelist specific origins (NO `*` in production)
- **Errors:** Never expose stack traces in production, generic messages for auth failures
- **OWASP:** Check permissions, bcrypt passwords, parameterized queries, sanitize outputs

## Development Workflow

**Real-World Testing Approach (CRITICAL):**
- **NO test scripts** - All testing is done by the user in real conditions on the actual client interface
- **100% production-grade error handling** - Every potential error point must be protected with try-catch
- **Console-first debugging** - All errors MUST be logged to browser console with detailed context
- **Error messages must include:**
  - 🔍 Clear emoji indicators (🔍 loading, ✅ success, ❌ error, 📦 data received, etc.)
  - Exact location (component name, function name, step)
  - Full error object with message, response, status code
  - Variable states and data structures at point of failure
  - Execution ID, request ID, or any relevant identifiers
- **User provides feedback** - User tests the workflow, copies console logs, and reports results
- **Zero assumptions** - Never assume something works without user confirmation from live testing

**Example Error Logging:**
```javascript
try {
  const response = await api.call()
  console.log('✅ ComponentName: API call successful:', {
    status: response.status,
    data: response.data,
    keys: Object.keys(response.data)
  })
} catch (err) {
  console.error('❌ ComponentName.functionName: API call failed:', {
    error: err,
    message: err.message,
    response: err.response,
    status: err.response?.status,
    data: err.response?.data,
    executionId: executionId
  })
  setError(`Failed to load: ${err.response?.data?.message || err.message}`)
}
```

**TDD for Unit Tests:**
1. Write failing test
2. Write minimum code to pass
3. Refactor

**Coverage:** ≥70% for branches, functions, lines, statements

**Commands:**
```bash
# Backend
cd backend
npm run dev          # Port 3000
npm test             # Run tests with coverage
npm run migrate      # Run migrations

# Frontend
cd frontend
npm run dev          # Port 5173
npm test             # Run tests with coverage
npm run lint         # ESLint
```

## Architecture Patterns

**Backend:** Controllers → Middleware → Services → Routes → Queues/Workers
**Frontend:** Pages → Components → Stores (Zustand) → Services → Hooks

**New Endpoint Pattern:**
1. Write test (TDD)
2. Create controller with Zod validation
3. Add route with auth middleware
4. Register in server.js

**New Component Pattern:**
1. Write test (TDD)
2. Create component with CSS classes from global.css
3. Use Zustand store for state
4. Use custom hooks for logic

## Database

Tables: `users`, `clients`, `workflows`, `workflow_requests`, `support_tickets`

**Migration Template:**
```sql
-- Enable RLS first
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX idx_my_table_user_id ON my_table(user_id);

-- RLS Policies
CREATE POLICY "Users can view their own records"
  ON my_table FOR SELECT
  USING (auth.uid() = user_id);
```

## Environment Variables

**Backend (.env):**
```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
JWT_SECRET=
JWT_EXPIRES_IN=15m
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ENV=development
```

## Git Conventions

**Branch naming:** `feature/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`

**Commit format:** `<type>(<scope>): <subject>`
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Before commit:** Run tests, check coverage ≥70%, lint

## Critical Rules

- **NEVER commit/push automatically** - Only when user explicitly asks ("commit this", "push to GitHub")
- **NEVER create test scripts** - User tests in real conditions, no scripts unless explicitly requested
- **NEVER use Tailwind** - Code review blocker
- **Enable RLS on all tables** - Security requirement
- **Validate all inputs** - Prevent injection attacks
- **Always TDD for unit tests** - Write tests first for testable logic
- **Always comprehensive error logging** - Every error must be traceable via console
- **Use environment variables** for all secrets

## Quick Troubleshooting

```bash
# Backend won't start
lsof -i :3000  # Check port
redis-cli ping  # Check Redis

# Frontend build fails
rm -rf node_modules/.vite  # Clear Vite cache

# Tests failing
npm test -- --clearCache

# Database issues
npm run migrate:reset
```

## Resources

- [README.md](README.md) - Project quickstart
- [backend/README.md](backend/README.md) - Backend details
- [frontend/README.md](frontend/README.md) - Frontend details
- Swagger UI: http://localhost:3000/api-docs
