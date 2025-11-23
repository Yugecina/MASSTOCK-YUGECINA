# SOP: Add New API Route

**Last Updated:** 2025-11-23

## Overview

This guide explains how to add a new API endpoint to the MasStock backend following TDD and security best practices.

---

## Architecture Flow

```
Request → Route → Middleware → Controller → Service → Database → Response
```

---

## Steps (TDD Approach)

### 1. Write Test First (RED)

Create test file in `backend/src/__tests__/controllers/`

**File:** `backend/src/__tests__/controllers/myController.test.js`

```javascript
const request = require('supertest');
const app = require('../../server');
const { supabaseAdmin } = require('../../config/database');

describe('My Controller - POST /api/v1/my-resource', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Setup: Create test user and get auth token
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true
    });
    testUser = data.user;

    // Login to get token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    // Cleanup: Delete test user
    await supabaseAdmin.auth.admin.deleteUser(testUser.id);
  });

  it('should create a new resource', async () => {
    const res = await request(app)
      .post('/api/v1/my-resource')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Resource',
        description: 'Test Description'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('Test Resource');
  });

  it('should return 400 for invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/my-resource')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        // Missing required field 'name'
        description: 'Test Description'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/v1/my-resource')
      .send({
        name: 'Test Resource'
      });

    expect(res.status).toBe(401);
  });
});
```

**Run test (should FAIL):**
```bash
cd backend
npm test -- myController.test.js
```

---

### 2. Create Controller (GREEN)

**File:** `backend/src/controllers/myController.js`

```javascript
const { supabaseAdmin } = require('../config/database');
const { logger } = require('../config/logger');
const { z } = require('zod');

/**
 * Validation Schema
 */
const createResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional()
});

/**
 * Create new resource
 * POST /api/v1/my-resource
 */
async function createResource(req, res) {
  try {
    // 1. Validate input
    const validatedData = createResourceSchema.parse(req.body);

    // 2. Get user context from auth middleware
    const userId = req.user.id;
    const clientId = req.client?.id;

    // 3. Insert into database
    const { data, error } = await supabaseAdmin
      .from('my_resources')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        user_id: userId,
        client_id: clientId
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create resource:', error);
      throw new Error('Failed to create resource');
    }

    // 4. Return success response
    logger.info('Resource created', { resourceId: data.id, userId });

    return res.status(201).json({
      success: true,
      data: data
    });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      });
    }

    // Handle other errors
    logger.error('Create resource error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create resource'
    });
  }
}

/**
 * Get all resources for authenticated user
 * GET /api/v1/my-resource
 */
async function getResources(req, res) {
  try {
    const clientId = req.client?.id;

    const { data, error } = await supabaseAdmin
      .from('my_resources')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch resources:', error);
      throw new Error('Failed to fetch resources');
    }

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    logger.error('Get resources error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch resources'
    });
  }
}

/**
 * Get single resource by ID
 * GET /api/v1/my-resource/:id
 */
async function getResourceById(req, res) {
  try {
    const { id } = req.params;
    const clientId = req.client?.id;

    const { data, error } = await supabaseAdmin
      .from('my_resources')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    logger.error('Get resource error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch resource'
    });
  }
}

/**
 * Update resource
 * PATCH /api/v1/my-resource/:id
 */
async function updateResource(req, res) {
  try {
    const { id } = req.params;
    const clientId = req.client?.id;

    // Validate input
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional()
    });
    const validatedData = updateSchema.parse(req.body);

    // Update in database
    const { data, error } = await supabaseAdmin
      .from('my_resources')
      .update(validatedData)
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    logger.info('Resource updated', { resourceId: id });

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      });
    }

    logger.error('Update resource error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update resource'
    });
  }
}

/**
 * Delete resource
 * DELETE /api/v1/my-resource/:id
 */
async function deleteResource(req, res) {
  try {
    const { id } = req.params;
    const clientId = req.client?.id;

    const { data, error } = await supabaseAdmin
      .from('my_resources')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    logger.info('Resource deleted', { resourceId: id });

    return res.status(200).json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    logger.error('Delete resource error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete resource'
    });
  }
}

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource
};
```

---

### 3. Create Route

**File:** `backend/src/routes/myRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, requireClient } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource
} = require('../controllers/myController');

/**
 * All routes require authentication
 */
router.use(authenticate);
router.use(requireClient);

/**
 * @route   GET /api/v1/my-resource
 * @desc    Get all resources for authenticated client
 * @access  Private (Client)
 */
router.get('/', getResources);

/**
 * @route   GET /api/v1/my-resource/:id
 * @desc    Get single resource by ID
 * @access  Private (Client)
 */
router.get('/:id', getResourceById);

/**
 * @route   POST /api/v1/my-resource
 * @desc    Create new resource
 * @access  Private (Client)
 * @ratelimit 10 requests per 1 minute
 */
router.post('/', rateLimit.standard, createResource);

/**
 * @route   PATCH /api/v1/my-resource/:id
 * @desc    Update resource
 * @access  Private (Client)
 */
router.patch('/:id', updateResource);

/**
 * @route   DELETE /api/v1/my-resource/:id
 * @desc    Delete resource
 * @access  Private (Client)
 */
router.delete('/:id', deleteResource);

module.exports = router;
```

---

### 4. Register Route in Server

**File:** `backend/src/server.js`

```javascript
// ... existing imports ...
const myRoutes = require('./routes/myRoutes');

// ... existing code ...

// API Routes - v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/my-resource', myRoutes); // ← ADD THIS LINE

// ... rest of server.js ...
```

---

### 5. Run Tests (GREEN)

```bash
cd backend
npm test -- myController.test.js
```

Tests should now **PASS**.

---

### 6. Refactor (REFACTOR)

- Extract repeated logic into helpers
- Improve error messages
- Add JSDoc comments
- Optimize database queries

---

## Middleware Options

### Authentication Middleware

```javascript
const { authenticate } = require('../middleware/auth');
router.use(authenticate); // Require JWT token
```

### Role-Based Access

```javascript
const { requireAdmin, requireClient } = require('../middleware/auth');

// Admin only
router.use(authenticate);
router.use(requireAdmin);

// Client only
router.use(authenticate);
router.use(requireClient);
```

### Rate Limiting

```javascript
const rateLimit = require('../middleware/rateLimit');

// Standard: 100 req/min
router.post('/', rateLimit.standard, createResource);

// Strict: 10 req/min
router.post('/', rateLimit.strict, createResource);

// Auth: 5 req/min
router.post('/login', rateLimit.auth, login);
```

### File Upload

```javascript
const upload = require('../middleware/upload');

// Single file
router.post('/upload', upload.single('file'), uploadFile);

// Multiple files
router.post('/upload', upload.array('files', 10), uploadFiles);
```

---

## Response Formats

### Success Response

```javascript
return res.status(200).json({
  success: true,
  data: {
    id: '123',
    name: 'Resource Name'
  }
});
```

### Error Response

```javascript
return res.status(400).json({
  success: false,
  error: 'Error message',
  details: [] // Optional validation errors
});
```

### Pagination Response

```javascript
return res.status(200).json({
  success: true,
  data: items,
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
});
```

---

## Security Checklist

### ✅ Required

- [ ] **Authentication**: Use `authenticate` middleware
- [ ] **Authorization**: Check user has access to resource
- [ ] **Input Validation**: Use Zod schema
- [ ] **Rate Limiting**: Apply to POST/PUT/DELETE
- [ ] **SQL Injection**: Use parameterized queries (Supabase client)
- [ ] **Error Handling**: Don't expose stack traces
- [ ] **Logging**: Log all operations

### ✅ Best Practices

- [ ] **Client Isolation**: Filter by client_id for multi-tenant data
- [ ] **RLS**: Enable Row Level Security on table
- [ ] **HTTPS Only**: Enforce in production
- [ ] **CORS**: Whitelist specific origins

---

## Testing Checklist

### ✅ Test Coverage

- [ ] **Success case**: Valid request returns 200/201
- [ ] **Validation**: Invalid input returns 400
- [ ] **Authentication**: No token returns 401
- [ ] **Authorization**: Wrong user/client returns 403
- [ ] **Not Found**: Invalid ID returns 404
- [ ] **Server Error**: Database error returns 500

---

## Example: Complete REST API

**Controller:** `backend/src/controllers/tasksController.js`
**Route:** `backend/src/routes/tasksRoutes.js`
**Test:** `backend/src/__tests__/controllers/tasksController.test.js`

**Endpoints:**
- `GET /api/v1/tasks` - List all tasks
- `GET /api/v1/tasks/:id` - Get single task
- `POST /api/v1/tasks` - Create task
- `PATCH /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task

---

## Related Documentation

- **[project_architecture.md](../system/project_architecture.md)** - API architecture
- **[add_migration.md](./add_migration.md)** - Create database tables first
- **[../../CLAUDE.md](../../CLAUDE.md)** - Development workflow
