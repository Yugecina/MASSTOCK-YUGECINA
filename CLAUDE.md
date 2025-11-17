# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MasStock is a SaaS platform for workflow automation designed for AI content agencies. It consists of a React frontend and Node.js/Express backend with Supabase as the database.

## Project Structure

```
MASSTOCK/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── __tests__/   # Unit tests (Jest)
│   │   ├── config/      # Database, Redis, Logger config
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth, error handling, rate limiting
│   │   ├── routes/      # API route definitions
│   │   ├── queues/      # Bull job queue setup
│   │   ├── workers/     # Background job processors
│   │   └── server.js    # Main entry point
│   ├── database/
│   │   └── migrations/  # SQL schema and RLS policies
│   ├── docs/
│   │   └── swagger.yaml # OpenAPI specification
│   └── package.json
│
├── frontend/            # React 19 + Vite application
│   ├── src/
│   │   ├── __tests__/   # Unit tests (Vitest)
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service calls
│   │   ├── store/       # Zustand stores
│   │   ├── hooks/       # Custom React hooks
│   │   └── utils/       # Utility functions
│   └── package.json
│
├── tests/               # E2E and integration tests
│   ├── postman/         # Postman collections & guides
│   ├── e2e/             # End-to-end test scripts
│   └── integration/     # Integration tests
│
├── docs/                # Global documentation
│   ├── testing/         # Testing guides
│   ├── design/          # Design system & tokens
│   ├── briefs/          # Project briefs
│   └── archive/         # Historical documents
│
├── CLAUDE.md            # This file
└── README.md            # Project quickstart
```

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + JWT
- **Job Queue:** Bull + Redis (IORedis)
- **Logging:** Winston
- **Testing:** Jest + Supertest
- **API Docs:** Swagger/OpenAPI 3.0

### Frontend
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.2
- **Styling:** Pure CSS (NO Tailwind allowed) - use variables and global.css only
- **State Management:** Zustand 5.0.8
- **Routing:** React Router DOM 7.9.6
- **HTTP Client:** Axios 1.13.2
- **Forms:** React Hook Form 7.66.0 + Zod 4.1.12
- **Charts:** Recharts 3.4.1
- **Animations:** Framer Motion 12.23.24
- **Testing:** Vitest + React Testing Library

---

## Frontend Styling Rules (CRITICAL)

### NO TailwindCSS - Pure CSS ONLY

**ABSOLUTE RULE:** The frontend uses **ZERO Tailwind**. All styling must use pure CSS.

#### How to Style Components

✅ **DO USE:**
- `className="text-h1 bg-white p-6 flex items-center"` (classes from global.css)
- `style={{ display: 'flex', gap: 'var(--spacing-md)' }}` (inline with CSS variables)
- CSS modules (Component.module.css)
- CSS variables from `:root` (--primary, --spacing-md, etc.)

❌ **DON'T USE:**
- Tailwind classes: `flex`, `px-4`, `py-2`, `text-sm`, `border`, `rounded-lg`, etc.
- `@tailwind` directives
- TailwindCSS plugins or config
- `tailwind.config.js`

#### Global CSS Classes Available

All classes are defined in `src/styles/global.css`:
- Typography: `.text-h1`, `.text-h2`, `.text-body`, `.text-body-sm`, `.text-label`
- Spacing: `.p-4`, `.p-6`, `.mb-4`, `.mb-6`, `.gap-md`, `.gap-lg`
- Layout: `.flex`, `.flex-col`, `.items-center`, `.justify-between`
- Grid: `.grid`, `.grid-cols-3`, `.grid-cols-4`
- Colors: `.bg-white`, `.text-neutral-900`, `.border-neutral-200`
- All utilities prefixed properly

#### Example: Styling a Button

❌ **WRONG (Tailwind):**
```jsx
<button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
  Click
</button>
```

✅ **RIGHT (CSS + Variables):**
```jsx
<button className="btn btn-primary">
  Click
</button>
// OR inline if needed:
<button style={{
  padding: 'var(--spacing-sm) var(--spacing-lg)',
  backgroundColor: 'var(--primary)',
  color: 'white',
  borderRadius: 'var(--radius-lg)',
}}>
  Click
</button>
```

#### Setup in New Files

1. Import global CSS in main.jsx:
   ```jsx
   import './styles/global.css'
   ```

2. Use classes from global.css:
   ```jsx
   <div className="flex items-center gap-md p-6">
   ```

3. Use CSS variables for values:
   ```jsx
   <div style={{ color: 'var(--primary)', gap: 'var(--spacing-lg)' }}>
   ```

---

## Security Best Practices

### Authentication & Authorization

1. **JWT Tokens:**
   - Always validate JWT signature and expiration
   - Never expose service role keys in frontend
   - Use short-lived access tokens (15min) + refresh tokens
   - Store tokens in httpOnly cookies (NOT localStorage)

2. **Row Level Security (RLS):**
   - Enable RLS on ALL Supabase tables
   - Test policies with different user roles
   - Never bypass RLS with service role key in user-facing endpoints
   - Document all policies in migration files

3. **Input Validation:**
   - Validate ALL inputs on backend (never trust frontend)
   - Use Zod schemas for validation
   - Sanitize user inputs to prevent XSS
   - Use parameterized queries to prevent SQL injection

### API Security

1. **Rate Limiting:**
   - Apply rate limits to ALL public endpoints
   - Stricter limits on auth endpoints (login, register)
   - Use Redis for distributed rate limiting
   - Return 429 status with Retry-After header

2. **CORS Configuration:**
   - Whitelist specific origins (NO `*` in production)
   - Allow credentials only for trusted origins
   - Validate Origin header on sensitive endpoints

3. **Error Handling:**
   - Never expose stack traces in production
   - Use generic error messages for auth failures
   - Log detailed errors server-side only
   - Return appropriate HTTP status codes

### Data Protection

1. **Sensitive Data:**
   - Never log passwords, tokens, or API keys
   - Encrypt sensitive data at rest
   - Use environment variables for secrets
   - Rotate secrets regularly

2. **File Uploads:**
   - Validate file types and sizes
   - Scan uploads for malware
   - Store files in secure storage (Supabase Storage)
   - Use signed URLs with expiration

### OWASP Top 10

Prevent common vulnerabilities:
- **A01: Broken Access Control** → Always check user permissions
- **A02: Cryptographic Failures** → Use bcrypt for passwords, HTTPS everywhere
- **A03: Injection** → Parameterized queries, input validation
- **A07: XSS** → Sanitize outputs, use Content Security Policy
- **A08: Insecure Deserialization** → Validate JSON payloads
- **A09: Security Logging** → Log auth events, failed attempts

### Example: Secure Controller

```javascript
// backend/src/controllers/secureController.js
const { z } = require('zod');

// Input validation schema
const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

async function createItem(req, res) {
  try {
    // 1. Validate input
    const validatedData = createItemSchema.parse(req.body);

    // 2. Check authorization
    if (!req.user || !req.user.canCreateItems) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 3. Sanitize and process
    const { data, error } = await supabase
      .from('items')
      .insert({
        ...validatedData,
        user_id: req.user.id, // RLS will enforce ownership
      })
      .select()
      .single();

    if (error) throw error;

    // 4. Return success
    res.status(201).json({ item: data });

  } catch (error) {
    // 5. Handle errors securely
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Log detailed error server-side
    logger.error('Failed to create item', { error, userId: req.user?.id });

    // Return generic error to client
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Common Commands

### Backend

```bash
cd backend

# Development
npm install                # Install dependencies
cp .env.example .env       # Create environment file
npm run dev                # Start dev server (port 3000)
npm run worker             # Start background worker

# Testing
npm test                   # Run all tests with coverage
npm run test:unit          # Run unit tests only
npm run test:watch         # Watch mode
npm run test:coverage      # Generate coverage report

# Database
npm run migrate            # Run database migrations
npm run migrate:create     # Create new migration file

# Production
npm start                  # Production server
```

### Frontend

```bash
cd frontend

# Development
npm install                # Install dependencies
cp .env.example .env       # Create environment file
npm run dev                # Start Vite dev server (port 5173)

# Testing
npm test                   # Run all tests with coverage
npm run test:unit          # Run unit tests only
npm run test:watch         # Watch mode
npm run test:ui            # Open Vitest UI

# Linting & Formatting
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint errors
npm run format             # Format with Prettier

# Production
npm run build              # Build for production
npm run preview            # Preview production build
```

### E2E & Integration Tests

```bash
# Postman tests
cd tests/postman
# Import collections into Postman or use Newman

# E2E scripts
cd tests/e2e
./test-auth-flow.sh
./test-frontend-integration.sh
./test-admin-endpoints.sh

# Integration tests
cd tests/integration
node test_api.js
node test_db.js
```

---

## Development Workflow

### Test-Driven Development (TDD)

This project follows TDD principles. Always write tests BEFORE implementing features:

1. **Red** ❌ : Write a failing test
2. **Green** ✅ : Write minimum code to pass the test
3. **Refactor** ♻️ : Improve code without changing behavior

### Workflow for New Features

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Write unit tests first (TDD)
# Backend: backend/src/__tests__/
# Frontend: frontend/src/__tests__/

# 3. Run tests in watch mode
npm run test:watch

# 4. Implement feature
# Write minimal code to pass tests

# 5. Refactor and verify
npm run test:coverage

# 6. Commit changes
git add .
git commit -m "feat: implement my feature"

# 7. Push and create PR
git push origin feature/my-feature
```

### Before Committing

Always run these checks before committing:

```bash
# Backend
cd backend
npm test                    # All tests must pass
npm run test:coverage       # Coverage ≥ 70%

# Frontend
cd frontend
npm test                    # All tests must pass
npm run test:coverage       # Coverage ≥ 70%
npm run lint                # No lint errors
```

---

## Git Conventions & Workflow

### Branch Naming

Use descriptive branch names with prefixes:
- `feature/user-authentication` - New features
- `fix/login-validation` - Bug fixes
- `refactor/api-routes` - Code refactoring
- `docs/update-readme` - Documentation
- `test/add-auth-tests` - Adding tests
- `chore/update-deps` - Maintenance tasks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```bash
feat(auth): add JWT refresh token flow

Implement refresh token rotation with Redis storage
- Add /auth/refresh endpoint
- Store refresh tokens in Redis with TTL
- Add middleware to validate refresh tokens

Closes #123

---

fix(workflow): prevent duplicate job execution

Add distributed lock using Redis to prevent race conditions
when multiple workers process the same job.

Fixes #456

---

test(client): add unit tests for ClientService

Add tests for CRUD operations with 85% coverage
```

### Pull Request Process

1. **Before Creating PR:**
   ```bash
   # Update from main
   git checkout main
   git pull origin main

   # Rebase your branch
   git checkout feature/my-feature
   git rebase main

   # Run all tests
   npm test

   # Push changes
   git push origin feature/my-feature --force-with-lease
   ```

2. **PR Template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] All tests passing
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows project conventions
   - [ ] No console.log or debugging code
   - [ ] Coverage ≥ 70%
   - [ ] Documentation updated

   ## Screenshots (if applicable)
   ```

3. **Code Review Requirements:**
   - At least 1 approval required
   - All CI checks must pass
   - No merge conflicts
   - Branch up to date with main

### Git Hooks

Use Husky for automated checks:

```bash
# Install Husky
npm install -D husky

# Setup hooks
npx husky install

# Pre-commit: Run linter and tests
npx husky add .husky/pre-commit "npm run lint && npm test"

# Commit-msg: Validate commit message format
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

---

## Architecture Guidelines

### Backend Architecture

1. **Controllers** handle HTTP requests/responses
2. **Middleware** for auth, validation, error handling
3. **Services** for business logic (create if needed)
4. **Routes** define API endpoints
5. **Queues/Workers** for async background jobs

#### Example: Adding a New API Endpoint

```javascript
// 1. Write test first (TDD)
// backend/src/__tests__/controllers/itemController.test.js
const request = require('supertest');
const app = require('../../server');

describe('ItemController', () => {
  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Test Item' })
        .expect(201);

      expect(response.body.item).toHaveProperty('id');
      expect(response.body.item.name).toBe('Test Item');
    });

    it('should return 400 for invalid input', async () => {
      await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: '' })
        .expect(400);
    });
  });
});

// 2. Create controller
// backend/src/controllers/itemController.js
const { z } = require('zod');
const { supabase } = require('../config/supabase');

const createItemSchema = z.object({
  name: z.string().min(1).max(100),
});

async function createItem(req, res) {
  try {
    const validatedData = createItemSchema.parse(req.body);

    const { data, error } = await supabase
      .from('items')
      .insert({ ...validatedData, user_id: req.user.id })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ item: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createItem };

// 3. Add route
// backend/src/routes/items.js
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createItem } = require('../controllers/itemController');

const router = express.Router();

router.post('/items', requireAuth, createItem);

module.exports = router;

// 4. Register route
// backend/src/server.js
const itemsRoutes = require('./routes/items');
app.use('/api', itemsRoutes);
```

### Frontend Architecture

1. **Pages** are route-level components
2. **Components** are reusable UI elements
3. **Stores** (Zustand) for global state
4. **Services** for API calls
5. **Hooks** for shared logic

#### Example: Adding a New Component

```jsx
// 1. Write test first (TDD)
// frontend/src/__tests__/components/ItemCard.test.jsx
import { render, screen } from '@testing-library/react';
import { ItemCard } from '@/components/ItemCard';

describe('ItemCard', () => {
  it('should render item name', () => {
    render(<ItemCard item={{ id: 1, name: 'Test Item' }} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<ItemCard item={{ id: 1, name: 'Test' }} onDelete={onDelete} />);

    screen.getByRole('button', { name: /delete/i }).click();
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});

// 2. Create component
// frontend/src/components/ItemCard.jsx
export function ItemCard({ item, onDelete }) {
  return (
    <div className="card p-4">
      <h3 className="text-h3">{item.name}</h3>
      <button
        className="btn btn-danger"
        onClick={() => onDelete(item.id)}
      >
        Delete
      </button>
    </div>
  );
}

// 3. Use in page
// frontend/src/pages/ItemsPage.jsx
import { ItemCard } from '@/components/ItemCard';
import { useItemsStore } from '@/store/itemsStore';

export function ItemsPage() {
  const { items, deleteItem } = useItemsStore();

  return (
    <div className="grid grid-cols-3 gap-md">
      {items.map(item => (
        <ItemCard key={item.id} item={item} onDelete={deleteItem} />
      ))}
    </div>
  );
}
```

#### Example: Zustand Store

```javascript
// frontend/src/store/itemsStore.js
import { create } from 'zustand';
import { itemsAPI } from '@/services/itemsAPI';

export const useItemsStore = create((set, get) => ({
  // State
  items: [],
  loading: false,
  error: null,

  // Actions
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await itemsAPI.getAll();
      set({ items, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createItem: async (data) => {
    const item = await itemsAPI.create(data);
    set({ items: [...get().items, item] });
    return item;
  },

  deleteItem: async (id) => {
    await itemsAPI.delete(id);
    set({ items: get().items.filter(item => item.id !== id) });
  },

  updateItem: async (id, data) => {
    const updated = await itemsAPI.update(id, data);
    set({
      items: get().items.map(item =>
        item.id === id ? updated : item
      )
    });
    return updated;
  },
}));

// Usage in component
import { useItemsStore } from '@/store/itemsStore';

function MyComponent() {
  const { items, loading, fetchItems } = useItemsStore();

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) return <Spinner />;

  return <ItemsList items={items} />;
}
```

---

## Error Handling Patterns

### Backend Error Handling

#### 1. Custom Error Classes

```javascript
// backend/src/utils/errors.js
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
};
```

#### 2. Global Error Handler Middleware

```javascript
// backend/src/middleware/errorHandler.js
const logger = require('../config/logger');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  let { statusCode = 500, message } = err;

  // Log error
  logger.error('Error occurred', {
    statusCode,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Operational errors (trusted errors)
  if (err.isOperational) {
    return res.status(statusCode).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Programming or unknown errors (don't leak details)
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message,
      stack: err.stack,
    });
  }

  // Production: generic error
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
```

#### 3. Async Handler Wrapper

```javascript
// backend/src/utils/asyncHandler.js
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };

// Usage
const { asyncHandler } = require('../utils/asyncHandler');
const { NotFoundError } = require('../utils/errors');

router.get('/items/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('items')
    .select()
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Item');
  }

  res.json({ item: data });
}));
```

### Frontend Error Handling

#### 1. API Service Error Wrapper

```javascript
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'An error occurred';
    const statusCode = error.response?.status || 500;

    // Handle specific errors
    if (statusCode === 401) {
      // Redirect to login
      window.location.href = '/login';
    }

    // Create standardized error object
    const standardError = {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(standardError);
  }
);

export { api };
```

#### 2. Error Boundary Component

```jsx
// frontend/src/components/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container p-6">
          <h1 className="text-h1">Something went wrong</h1>
          <p className="text-body">{this.state.error?.message}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### 3. Custom Hook for Error Handling

```javascript
// frontend/src/hooks/useApiError.js
import { useState } from 'react';
import { useToast } from './useToast';

export function useApiError() {
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const handleError = (err) => {
    const message = err.message || 'An error occurred';
    setError(err);
    showToast(message, 'error');

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('API Error:', err);
    }
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
}

// Usage
function MyComponent() {
  const { error, handleError } = useApiError();
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const result = await api.get('/items');
      setData(result);
    } catch (err) {
      handleError(err);
    }
  };

  return <div>...</div>;
}
```

---

## Performance Guidelines

### Backend Performance

#### 1. Database Optimization

```javascript
// Use indexes for frequently queried columns
// backend/database/migrations/003_add_indexes.sql
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflow_requests_status ON workflow_requests(status);
CREATE INDEX idx_workflow_requests_created_at ON workflow_requests(created_at);

// Use pagination for large datasets
async function getWorkflows(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('workflows')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw error;

  res.json({
    workflows: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
}

// Use select() to limit returned columns
const { data } = await supabase
  .from('workflows')
  .select('id, name, status') // Only fetch needed columns
  .eq('user_id', userId);
```

#### 2. Caching with Redis

```javascript
// backend/src/utils/cache.js
const redis = require('../config/redis');

async function getCached(key, fetchFunction, ttl = 3600) {
  // Try to get from cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch fresh data
  const data = await fetchFunction();

  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

async function invalidateCache(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

module.exports = { getCached, invalidateCache };

// Usage
const { getCached } = require('../utils/cache');

async function getWorkflows(req, res) {
  const userId = req.user.id;
  const cacheKey = `workflows:${userId}`;

  const workflows = await getCached(
    cacheKey,
    async () => {
      const { data } = await supabase
        .from('workflows')
        .select()
        .eq('user_id', userId);
      return data;
    },
    1800 // 30 minutes
  );

  res.json({ workflows });
}
```

#### 3. Background Jobs for Heavy Tasks

```javascript
// backend/src/queues/workflowQueue.js
const Queue = require('bull');
const redis = require('../config/redis');

const workflowQueue = new Queue('workflow-processing', {
  redis: redis.options,
});

// Add job to queue
async function processWorkflowAsync(workflowId, data) {
  await workflowQueue.add(
    { workflowId, data },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    }
  );
}

module.exports = { workflowQueue, processWorkflowAsync };

// backend/src/workers/workflowWorker.js
const { workflowQueue } = require('../queues/workflowQueue');

workflowQueue.process(async (job) => {
  const { workflowId, data } = job.data;

  // Heavy processing here
  await processWorkflow(workflowId, data);

  // Update progress
  job.progress(50);

  // More processing...

  return { success: true };
});
```

### Frontend Performance

#### 1. Code Splitting & Lazy Loading

```jsx
// frontend/src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Workflows = lazy(() => import('./pages/Workflows'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

#### 2. Memoization & Optimization

```jsx
// Use React.memo for expensive components
import { memo } from 'react';

export const WorkflowCard = memo(({ workflow, onDelete }) => {
  return (
    <div className="card">
      <h3>{workflow.name}</h3>
      <button onClick={() => onDelete(workflow.id)}>Delete</button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.workflow.id === nextProps.workflow.id &&
         prevProps.workflow.name === nextProps.workflow.name;
});

// Use useMemo for expensive calculations
import { useMemo } from 'react';

function WorkflowStats({ workflows }) {
  const stats = useMemo(() => {
    return {
      total: workflows.length,
      active: workflows.filter(w => w.status === 'active').length,
      completed: workflows.filter(w => w.status === 'completed').length,
    };
  }, [workflows]);

  return <StatsDisplay stats={stats} />;
}

// Use useCallback for event handlers passed to children
import { useCallback } from 'react';

function WorkflowList({ workflows }) {
  const handleDelete = useCallback((id) => {
    deleteWorkflow(id);
  }, []);

  return workflows.map(w => (
    <WorkflowCard key={w.id} workflow={w} onDelete={handleDelete} />
  ));
}
```

#### 3. Virtual Scrolling for Long Lists

```jsx
// frontend/src/components/VirtualList.jsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualWorkflowList({ workflows }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: workflows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated row height
    overscan: 5, // Render 5 extra items
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <WorkflowCard workflow={workflows[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 4. Image Optimization

```jsx
// Use lazy loading for images
<img
  src={workflow.image}
  alt={workflow.name}
  loading="lazy"
  style={{ width: '100%', height: 'auto' }}
/>

// Use modern formats (WebP) with fallback
<picture>
  <source srcSet={`${workflow.image}.webp`} type="image/webp" />
  <source srcSet={`${workflow.image}.jpg`} type="image/jpeg" />
  <img src={`${workflow.image}.jpg`} alt={workflow.name} />
</picture>
```

---

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

#### 1. Semantic HTML

```jsx
// ❌ WRONG: Non-semantic divs
<div onClick={handleClick}>Click me</div>

// ✅ RIGHT: Semantic button
<button onClick={handleClick}>Click me</button>

// ❌ WRONG: Generic divs for structure
<div>
  <div>Header</div>
  <div>Content</div>
</div>

// ✅ RIGHT: Semantic structure
<article>
  <header>
    <h1>Header</h1>
  </header>
  <main>Content</main>
</article>
```

#### 2. ARIA Labels & Roles

```jsx
// Buttons without visible text
<button aria-label="Close modal" onClick={handleClose}>
  <CloseIcon />
</button>

// Form inputs
<label htmlFor="email">Email address</label>
<input
  id="email"
  type="email"
  aria-describedby="email-help"
  aria-required="true"
/>
<span id="email-help">We'll never share your email</span>

// Custom components
<div
  role="tablist"
  aria-label="Workflow sections"
>
  <button
    role="tab"
    aria-selected={activeTab === 0}
    aria-controls="panel-0"
  >
    Overview
  </button>
</div>
<div
  role="tabpanel"
  id="panel-0"
  aria-labelledby="tab-0"
>
  Content
</div>

// Live regions for dynamic content
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  {error && <p>{error}</p>}
</div>
```

#### 3. Keyboard Navigation

```jsx
// Ensure all interactive elements are keyboard accessible
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef();

  useEffect(() => {
    if (isOpen) {
      // Focus first focusable element
      const focusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    // Close on Escape
    if (e.key === 'Escape') {
      onClose();
    }

    // Trap focus within modal
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
```

#### 4. Color Contrast & Focus Indicators

```css
/* global.css */

/* Ensure sufficient color contrast (4.5:1 for normal text) */
:root {
  --text-primary: #1a1a1a;     /* Black text on white: 16:1 */
  --text-secondary: #4a4a4a;   /* Dark gray: 9:1 */
  --bg-white: #ffffff;
  --primary: #0066cc;          /* Blue with good contrast */
}

/* Visible focus indicators */
*:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

button:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}

/* Don't hide focus for keyboard users */
*:focus:not(:focus-visible) {
  outline: none;
}

/* Sufficient interactive target size (44x44px minimum) */
button, a, input[type="checkbox"], input[type="radio"] {
  min-height: 44px;
  min-width: 44px;
}
```

#### 5. Form Accessibility

```jsx
function AccessibleForm() {
  const [errors, setErrors] = useState({});

  return (
    <form aria-labelledby="form-title">
      <h2 id="form-title">Create Workflow</h2>

      <div>
        <label htmlFor="workflow-name">
          Workflow Name
          <abbr title="required" aria-label="required">*</abbr>
        </label>
        <input
          id="workflow-name"
          type="text"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" role="alert" className="error">
            {errors.name}
          </span>
        )}
      </div>

      <fieldset>
        <legend>Workflow Type</legend>
        <div>
          <input
            type="radio"
            id="type-automated"
            name="type"
            value="automated"
          />
          <label htmlFor="type-automated">Automated</label>
        </div>
        <div>
          <input
            type="radio"
            id="type-manual"
            name="type"
            value="manual"
          />
          <label htmlFor="type-manual">Manual</label>
        </div>
      </fieldset>

      <button type="submit">Create Workflow</button>
    </form>
  );
}
```

#### 6. Screen Reader Announcements

```jsx
// Use visually-hidden class for screen reader only content
// global.css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// Component usage
function WorkflowCard({ workflow }) {
  return (
    <div className="card">
      <h3>
        {workflow.name}
        <span className="sr-only">
          {workflow.status === 'active' ? 'Currently active' : 'Inactive'}
        </span>
      </h3>
      <span aria-label={`${workflow.completionRate}% complete`}>
        {workflow.completionRate}%
      </span>
    </div>
  );
}
```

---

## Database Schema

The backend uses Supabase (PostgreSQL) with Row Level Security (RLS). Key tables:

- `users` - User accounts (managed by Supabase Auth)
- `clients` - Client organizations
- `workflows` - Workflow definitions
- `workflow_requests` - Workflow execution requests
- `support_tickets` - Support system

### Database Migrations

Create new migrations:
```bash
cd backend
npm run migrate:create my_migration_name
```

Migration file structure:
```sql
-- backend/database/migrations/004_my_migration.sql

-- Up Migration
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_my_table_user_id ON my_table(user_id);

-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own records"
  ON my_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records"
  ON my_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records"
  ON my_table FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records"
  ON my_table FOR DELETE
  USING (auth.uid() = user_id);

-- Down Migration
DROP TABLE IF EXISTS my_table CASCADE;
```

See `backend/database/migrations/` for complete schema.

---

## Environment Variables

### Backend (.env)

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
PORT=3000
NODE_ENV=development

# Redis (for Bull queue)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_TLS=false

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Email (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@masstock.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# External APIs (if any)
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Monitoring (optional)
SENTRY_DSN=
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Environment
VITE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_CHAT_SUPPORT=true

# External Services
VITE_STRIPE_PUBLIC_KEY=
VITE_GOOGLE_ANALYTICS_ID=

# App Configuration
VITE_APP_NAME=MasStock
VITE_APP_VERSION=1.0.0
```

**Security Notes:**
- Never commit `.env` files to Git
- Use `.env.example` as template
- Rotate secrets regularly
- Use different secrets for dev/staging/production
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (backend only)

---

## Testing Guidelines

### Coverage Requirements

Maintain at least 70% coverage for:
- Branches
- Functions
- Lines
- Statements

### What to Test

**Backend:**
- Controllers: All request handlers
- Middleware: Auth, validation, error handling
- Services: Business logic
- Utilities: Pure functions
- Error handling: Custom error classes

**Frontend:**
- Components: User interactions, rendering
- Hooks: State management, side effects
- Stores: Zustand actions and state updates
- Services: API calls (mocked)
- Utilities: Pure functions, formatters
- Forms: Validation, submission

### What NOT to Test

- Third-party libraries
- Configuration files
- Database migrations (test in integration tests)
- Simple getters/setters
- Type definitions

### Testing Best Practices

1. **Follow AAA Pattern:**
   ```javascript
   test('should create a workflow', async () => {
     // Arrange
     const workflowData = { name: 'Test Workflow' };

     // Act
     const result = await createWorkflow(workflowData);

     // Assert
     expect(result).toHaveProperty('id');
     expect(result.name).toBe('Test Workflow');
   });
   ```

2. **Use Descriptive Test Names:**
   ```javascript
   // ❌ BAD
   test('test1', () => { ... });

   // ✅ GOOD
   test('should return 401 when user is not authenticated', () => { ... });
   ```

3. **Mock External Dependencies:**
   ```javascript
   // Mock Supabase
   jest.mock('../config/supabase', () => ({
     supabase: {
       from: jest.fn(() => ({
         select: jest.fn().mockResolvedValue({ data: [], error: null }),
       })),
     },
   }));
   ```

---

## API Documentation

API documentation is available at:
- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI spec: `backend/docs/swagger.yaml`

### Adding New Endpoints to Swagger

```yaml
# backend/docs/swagger.yaml
paths:
  /api/items:
    post:
      summary: Create a new item
      tags:
        - Items
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 100
      responses:
        '201':
          description: Item created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  item:
                    $ref: '#/components/schemas/Item'
        '400':
          description: Invalid input
        '401':
          description: Unauthorized
```

---

## Common Issues

### Backend won't start
```bash
# Check Supabase connection
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"

# Check Redis connection
redis-cli ping

# Check port availability
lsof -i :3000

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend build fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Check for TypeScript errors
npm run type-check
```

### Tests failing
```bash
# Clear Jest cache
npm test -- --clearCache

# Clear Vitest cache
npx vitest --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- path/to/test.test.js
```

### Database issues
```bash
# Reset database
npm run migrate:reset

# Check migrations status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback
```

---

## Resources

- [Project Overview](README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Testing Guide](docs/testing/TESTING_GUIDE.md)
- [Design System](docs/design/DESIGN_SYSTEM.md)

---

## Important Notes

### Critical Rules

- **NEVER commit or push code automatically** - Only create commits or push to remote when the user EXPLICITLY asks for it with clear instructions like "commit this", "push to GitHub", "create a commit", etc. Do NOT commit after writing code or making changes unless specifically requested.
- **CRITICAL: Never use Tailwind in frontend** - violations are code review blockers
- **Enable RLS on all Supabase tables** - security requirement
- **Validate all user inputs** - prevent injection attacks

### Development Guidelines

- **Always write tests first** (TDD approach)
- **Run tests before committing** to ensure nothing breaks
- **Follow the existing code style** in each project
- **Use conventional commit messages** (feat, fix, docs, etc.)
- **Document complex logic** with comments
- **Update this file** when adding new patterns or conventions
- **Use environment variables** for all secrets and config

### Git Workflow Rules

**DO NOT** run git commands unless explicitly requested:
- ❌ `git add` - Don't stage files automatically
- ❌ `git commit` - Don't commit automatically
- ❌ `git push` - Don't push automatically
- ❌ `git pull` - Don't pull automatically

**ONLY run git commands when user says:**
- ✅ "Commit this with message X"
- ✅ "Push to GitHub"
- ✅ "Create a commit"
- ✅ "Stage these files"
- ✅ "Pull latest changes"

**Exception:** You CAN run `git status` or `git diff` to check the current state when needed for context, but never modify the repository.
