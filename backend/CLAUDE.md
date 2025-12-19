# Backend - Node.js/Express API

**Technology**: Node.js 18+, Express 4.18, Supabase, Bull + Redis, Winston
**Entry Point**: `src/server.js`
**Parent Context**: This extends [../CLAUDE.md](../CLAUDE.md)

---

## Development Commands

### From This Directory
```bash
# Development server (nodemon with auto-reload)
npm run dev          # Starts on http://localhost:3000

# Production server
npm start

# Run tests
npm test                    # All tests with coverage
npm run test:unit           # Unit tests only (skip integration)
npm run test:integration    # Integration tests only
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report (HTML + text)

# Database migrations
npm run migrate             # Apply pending migrations

# Background worker
npm run worker              # Start Bull worker for async jobs
```

### From Root
```bash
cd backend && npm run dev
cd backend && npm test
cd backend && npm run migrate
```

### Pre-PR Checklist
```bash
# Must pass before creating PR
npm test                    # Coverage must be ≥70%
npm run test:coverage       # Verify coverage thresholds
```

---

## Architecture

### Directory Structure
```
backend/
├── src/
│   ├── server.js                    # Express app entry point
│   ├── config/
│   │   ├── database.js              # Supabase client initialization
│   │   └── logger.js                # Winston logger config
│   ├── controllers/                 # Request handlers (business logic)
│   │   ├── authController.js        # Login, refresh, logout
│   │   ├── workflowsController.js   # Workflow CRUD
│   │   ├── executionsController.js  # Execution management
│   │   └── adminController.js       # Admin operations
│   ├── middleware/                  # Express middleware
│   │   ├── auth.js                  # JWT token verification
│   │   ├── errorHandler.js          # Global error handling
│   │   └── rateLimiter.js           # Rate limiting (express-rate-limit)
│   ├── routes/                      # API endpoint definitions
│   │   ├── authRoutes.js            # /api/v1/auth/*
│   │   ├── workflowRoutes.js        # /api/v1/workflows/*
│   │   └── adminRoutes.js           # /api/v1/admin/*
│   ├── services/                    # External API integrations
│   │   └── geminiImageService.js    # Google Gemini API client
│   ├── workers/                     # Background job processors
│   │   └── workflow-worker.js       # Bull worker for workflows
│   ├── queues/                      # Bull queue definitions
│   │   └── workflowQueue.js         # Workflow execution queue
│   ├── helpers/                     # Utility functions
│   │   └── authHelpers.js           # Token refresh, cookie helpers
│   ├── database/
│   │   ├── migrate.js               # Migration runner
│   │   └── migrations/              # SQL migration files
│   └── __tests__/                   # Jest tests
│       ├── controllers/             # Controller tests
│       ├── middleware/              # Middleware tests
│       ├── routes/                  # Route integration tests
│       ├── workers/                 # Worker tests
│       └── integration/             # Full integration tests
├── scripts/                         # Utility scripts
│   ├── seed-nano-banana.js          # Seed Nano Banana workflow
│   ├── check-auth-users.js          # Debug auth users
│   └── test-token-refresh.js        # Test token refresh flow
├── jest.config.js                   # Jest configuration
├── jest.setup.js                    # Jest global setup
└── package.json
```

---

## Code Organization Patterns

### Controllers (Request Handlers)

**✅ DO: Zod Validation + Try/Catch + Winston Logging**

Example: `src/controllers/authController.ts`
```typescript
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { logger } from '../config/logger';
import { z } from 'zod';

// Define Zod schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export async function login(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validate input with Zod
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // 2. Business logic
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('Login failed', { email, error: error.message });
      res.status(401).json({
        message: 'Invalid credentials',
        status: 401
      });
      return;
    }

    // 3. Set httpOnly cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 15 * 60 * 1000 // 15 minutes
    };

    res.cookie('access_token', data.session.access_token, cookieOptions);
    res.cookie('refresh_token', data.session.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 4. Return response
    res.json({ user: data.user, session: data.session });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }

    // Log and return generic error
    logger.error('Login error', { error: (error as Error).message });
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

**Pattern:**
1. Define Zod schema at top
2. Validate input: `schema.parse(req.body)`
3. Execute business logic
4. Log errors with Winston
5. Return JSON response
6. Export functions

**❌ DON'T:**
```typescript
// ❌ No validation
async function login(req: Request, res: Response) {
  const { email, password } = req.body; // Dangerous!
  // ...
}

// ❌ No error logging
async function login(req: Request, res: Response) {
  try {
    // ...
  } catch (error) {
    res.status(500).json({ error: 'Failed' }); // No context!
  }
}

// ❌ Token in response body
res.json({ token: 'xxx' }); // Should be httpOnly cookie!
```

---

### Middleware (Request Pipeline)

**✅ DO: Extract to Middleware for Reusability**

Example: `src/middleware/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/database';
import { logger } from '../config/logger';

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract token from httpOnly cookie
    let token = req.cookies?.access_token;

    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({
        error: 'Missing authorization token',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    // 2. Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    // 3. Attach user to request
    req.user = user;
    next();

  } catch (error) {
    logger.error('Auth middleware error', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

**Common Middleware:**
- `src/middleware/auth.ts` - JWT verification
- `src/middleware/rateLimiter.ts` - Rate limiting
- `src/middleware/errorHandler.ts` - Global error handler

---

### Routes (API Endpoints)

**✅ DO: Separate Routes from Controllers**

Example: `src/routes/authRoutes.ts`
```typescript
import express from 'express';
import { login, refresh, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public routes with rate limiting
router.post('/login', rateLimiter.auth, login);
router.post('/refresh', rateLimiter.auth, refresh);

// Protected routes
router.post('/logout', authenticate, logout);

export default router;
```

**Pattern:**
1. Import Express router
2. Import controller functions
3. Import middleware
4. Define routes with middleware chain
5. Export router

**Route Registration in `src/server.ts`:**
```typescript
import authRoutes from './routes/authRoutes';
import workflowRoutes from './routes/workflowRoutes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workflows', workflowRoutes);
```

---

### Services (External APIs)

**✅ DO: Encapsulate External API Logic**

Example: `src/services/geminiImageService.ts`
```typescript
import axios, { AxiosError } from 'axios';
import { logger } from '../config/logger';

interface GeminiOptions {
  [key: string]: unknown;
}

interface GeminiResponse {
  predictions?: unknown[];
}

class GeminiImageService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateImage(prompt: string, options: GeminiOptions = {}): Promise<GeminiResponse> {
    try {
      logger.debug('Generating image with Gemini', { prompt, options });

      const response = await axios.post<GeminiResponse>(
        `${this.baseUrl}/models/imagen-3.0-generate-001:predict`,
        {
          instances: [{ prompt }],
          parameters: { ...options }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.debug('Image generation successful', {
        imageCount: response.data.predictions?.length
      });

      return response.data;

    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Gemini API error', {
        error: axiosError.message,
        response: axiosError.response?.data
      });
      throw error;
    }
  }
}

export default new GeminiImageService();
```

**Pattern:**
- Class-based for stateful services
- Environment variables for config
- Detailed error logging
- Export singleton instance

---

### Workers (Background Jobs)

**✅ DO: Use Bull for Async Processing**

Example: `src/workers/workflow-worker.ts`
```typescript
import { Job } from 'bull';
import { workflowQueue } from '../queues/workflowQueue';
import geminiService from '../services/geminiImageService';
import { logger } from '../config/logger';

interface WorkflowJobData {
  executionId: string;
  prompts: string[];
  config: Record<string, unknown>;
}

interface WorkflowResult {
  executionId: string;
  results: unknown[];
}

// Process workflow jobs
workflowQueue.process(async (job: Job<WorkflowJobData>): Promise<WorkflowResult> => {
  const { executionId, prompts, config } = job.data;

  logger.debug('Processing workflow', { executionId, promptCount: prompts.length });

  try {
    // Process each prompt
    const results = [];
    for (const prompt of prompts) {
      const result = await geminiService.generateImage(prompt, config);
      results.push(result);

      // Update progress
      job.progress((results.length / prompts.length) * 100);
    }

    return { executionId, results };

  } catch (error) {
    logger.error('Workflow processing failed', {
      executionId,
      error: (error as Error).message
    });
    throw error;
  }
});

// Event listeners
workflowQueue.on('completed', (job: Job, result: WorkflowResult) => {
  logger.debug('Workflow completed', { jobId: job.id });
});

workflowQueue.on('failed', (job: Job, err: Error) => {
  logger.error('Workflow failed', { jobId: job.id, error: err.message });
});

logger.debug('Workflow worker started');
```

**Worker Best Practices:**
- Use `job.progress()` for progress tracking
- Log all events (completed, failed, stalled)
- Implement retry logic in queue config
- Handle errors gracefully

**Queue Configuration:**
Example: `src/queues/workflowQueue.ts`
```typescript
import Queue from 'bull';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const workflowQueue = new Queue('workflow-queue', {
  redis: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});
```

---

### Database Operations (Supabase)

**✅ DO: Use Supabase Client with RLS**

Example: Query with RLS
```typescript
import { supabaseAdmin } from '../config/database';
import { logger } from '../config/logger';

// Query respects RLS policies
const { data, error } = await supabaseAdmin
  .from('workflows')
  .select('*')
  .eq('client_id', clientId);

if (error) {
  logger.error('Database query failed', { error: error.message });
  throw error;
}

return data;
```

**Common Patterns:**
```typescript
// SELECT
const { data, error } = await supabaseAdmin
  .from('table')
  .select('*')
  .eq('column', value)
  .single(); // For single row

// INSERT
const { data, error } = await supabaseAdmin
  .from('table')
  .insert({ column: value })
  .select()
  .single();

// UPDATE
const { data, error } = await supabaseAdmin
  .from('table')
  .update({ column: newValue })
  .eq('id', id)
  .select()
  .single();

// DELETE
const { error } = await supabaseAdmin
  .from('table')
  .delete()
  .eq('id', id);
```

**❌ DON'T:**
```typescript
// ❌ Direct SQL (use Supabase client instead)
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ Ignore errors
await supabaseAdmin.from('table').insert(data); // Check error!

// ❌ Expose service role key
res.json({ apiKey: process.env.SUPABASE_SERVICE_ROLE_KEY }); // NEVER!
```

---

## Key Files

### Core Files (Understand These First)

**`src/server.js`** - Express app setup
- CORS configuration
- Cookie parser
- Route registration
- Error handling middleware
- Server startup

**`src/config/database.js`** - Supabase client
- Admin client with service role key
- Used for all backend operations
- RLS policies still apply

**`src/config/logger.js`** - Winston logger
- Log levels: debug, info, warn, error
- File transports (combined.log, error.log)
- Production: logs to files only (no console)
- Development: logs to console + files

### Authentication

**`src/controllers/authController.js`** - Auth endpoints
- `login()` - Authenticate user, set httpOnly cookies
- `refresh()` - Refresh access token using refresh token
- `logout()` - Clear cookies

**`src/middleware/auth.js`** - JWT verification
- `authenticate()` - Verify access token from cookie/header
- Attaches `req.user` for downstream use
- Returns 401 if invalid/expired

**`src/helpers/authHelpers.js`** - Auth utilities
- `setCookies()` - Set access/refresh token cookies
- `clearCookies()` - Clear auth cookies
- `verifyRefreshToken()` - Validate refresh token

### Workflows & Executions

**`src/controllers/workflowsController.js`** - Workflow CRUD
- `getWorkflows()` - List workflows for client
- `getWorkflowById()` - Get single workflow
- `createWorkflow()` - Create new workflow
- `updateWorkflow()` - Update workflow
- `deleteWorkflow()` - Delete workflow

**`src/controllers/executionsController.js`** - Execution management
- `createExecution()` - Trigger workflow execution
- `getExecutions()` - List executions with filters
- `getExecutionById()` - Get execution details
- `downloadResults()` - Download execution outputs

**`src/workers/workflow-worker.js`** - Async execution processor
- Processes jobs from `workflow-queue`
- Calls Gemini API for image generation
- Updates execution status in database
- See [.agent/system/async_workers.md](../.agent/system/async_workers.md) for concurrency details

---

## Common Patterns

### API Response Format

**✅ Success Response:**
```typescript
res.status(200).json({
  success: true,
  data: { /* result */ }
});
```

**✅ Error Response:**
```typescript
res.status(400).json({
  success: false,
  error: 'Descriptive error message',
  code: 'ERROR_CODE'
});
```

### Error Handling Pattern

```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';

async function controllerFunction(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const validated = schema.parse(req.body);

    // Business logic
    const result = await service.doSomething(validated);

    // Success response
    res.json({ success: true, data: result });

  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    // Log unexpected errors
    const err = error as Error;
    logger.error('Controller error', {
      function: 'controllerFunction',
      error: err.message,
      stack: err.stack
    });

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
```

### Pagination Pattern

```typescript
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';

async function getItems(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('table')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}
```

---

## Quick Search Commands

### Find Controllers
```bash
# Find all controller functions
rg -n "^async function" backend/src/controllers

# Find specific controller
rg -n "async function.*login" backend/src/controllers
```

### Find Routes
```bash
# Find all route definitions
rg -n "router\.(get|post|put|delete)" backend/src/routes

# Find specific endpoint
rg -n "'/workflows'" backend/src/routes
```

### Find Middleware
```bash
# Find middleware functions
rg -n "^(async )?function.*\(req, res, next\)" backend/src/middleware

# Find middleware usage
rg -n "authenticate" backend/src/routes
```

### Find Database Queries
```bash
# Find Supabase queries
rg -n "supabaseAdmin\.from" backend/src

# Find specific table queries
rg -n "\.from\('workflows'\)" backend/src
```

### Find Tests
```bash
# Find all test files
find backend/src/__tests__ -name "*.test.js"

# Find tests for specific file
find backend/src/__tests__ -name "*auth*.test.js"

# Find test descriptions
rg -n "describe\(|it\(" backend/src/__tests__
```

---

## Common Gotchas

### Environment Variables
- **Backend only:** `SUPABASE_SERVICE_ROLE_KEY` (NEVER expose to frontend)
- **Cookie security:** Set `secure: true` in production, `false` in development
- **CORS:** Must match frontend URL exactly (no trailing slash mismatch)

### Authentication
- **Token location:** Check cookie first, then Authorization header (backward compat)
- **Token refresh:** Automatic via frontend Axios interceptor, manual via `/api/v1/auth/refresh`
- **httpOnly cookies:** Cannot be accessed via JavaScript (secure by design)

### Database
- **RLS policies:** Always enabled, even with service role key
- **Supabase client:** Use `supabaseAdmin` for backend, not frontend anon client
- **Timestamps:** Supabase auto-manages `created_at`, `updated_at` if columns exist

### Workers
- **Redis required:** Worker won't start without Redis connection
- **Concurrency:** Configured in queue options (default: 5 concurrent jobs)
- **Job retention:** `removeOnComplete: true` to avoid memory buildup

### Rate Limiting
- **General endpoints:** 100 requests per 15 minutes per IP
- **Auth endpoints:** 5 requests per 15 minutes per IP (stricter)
- **Override:** Set `RATE_LIMIT_MAX_REQUESTS` in `.env`

---

## Testing Guidelines

### Unit Tests

**Location:** Co-located with source (`src/__tests__/`)

**Framework:** Jest + Supertest

**Pattern:** AAA (Arrange, Act, Assert)

**Example:** `src/__tests__/controllers/authController.test.ts`
```typescript
import request from 'supertest';
import app from '../../server';

describe('Auth Controller', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
```

### Integration Tests

**Location:** `src/__tests__/integration/`

**Purpose:** Test full request/response cycle with database

**Example:** `src/__tests__/integration/auth-persistence.integration.test.ts`
```typescript
import request from 'supertest';
import app from '../../server';

describe('Auth Persistence Integration', () => {
  it('should maintain session across requests', async () => {
    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    const cookies = loginRes.headers['set-cookie'];

    // Use session in subsequent request
    const profileRes = await request(app)
      .get('/api/v1/auth/profile')
      .set('Cookie', cookies);

    expect(profileRes.status).toBe(200);
  });
});
```

### Mocking Supabase

```typescript
jest.mock('../config/database', () => ({
  supabaseAdmin: {
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));
```

### Running Tests

```bash
# All tests with coverage
npm test

# Watch mode (useful during TDD)
npm run test:watch

# Specific test file
npm test -- authController.test.js

# Coverage threshold check
npm run test:coverage
```

---

## Pre-PR Validation

Run this command before creating a PR:
```bash
npm test && npm run test:coverage
```

**All checks must pass:**
- ✅ All tests passing
- ✅ Coverage ≥70% (branches, functions, lines, statements)
- ✅ No console.log in production code
- ✅ All new endpoints have Zod validation
- ✅ All new endpoints have rate limiting
- ✅ All errors logged with Winston

---

## Related Documentation

- **Root Guide:** [../CLAUDE.md](../CLAUDE.md)
- **Architecture:** [../.agent/system/project_architecture.md](../.agent/system/project_architecture.md)
- **Database Schema:** [../.agent/system/database_schema.md](../.agent/system/database_schema.md)
- **Async Workers:** [../.agent/system/async_workers.md](../.agent/system/async_workers.md)
- **Add Migration:** [../.agent/SOP/add_migration.md](../.agent/SOP/add_migration.md)
- **Add Route:** [../.agent/SOP/add_route.md](../.agent/SOP/add_route.md)
- **Token Refresh:** [../.agent/SOP/token_refresh.md](../.agent/SOP/token_refresh.md)
- **Security Audit:** [../.agent/SOP/security_audit_2025_11.md](../.agent/SOP/security_audit_2025_11.md)

---

**Last Updated:** 2025-11-30
**Version:** 1.0
