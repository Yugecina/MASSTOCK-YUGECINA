Create a new API endpoint following TDD approach (Test → Controller → Route).

**Arguments:** $ARGUMENTS (endpoint description, e.g., "GET /api/v1/users/:id")

## Steps:

### 1. Parse Endpoint Details
Extract from $ARGUMENTS:
- HTTP Method (GET, POST, PUT, DELETE)
- Route path (e.g., `/api/v1/users/:id`)
- Controller name (e.g., `getUserById`)
- File locations

### 2. Create Test First (TDD - RED)
File: `backend/src/__tests__/[controller]/[controller].test.js`

```javascript
const request = require('supertest');
const app = require('../../server');

describe('[Controller Name]', () => {
  describe('[METHOD] [PATH]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const testData = { /* test data */ };

      // Act
      const response = await request(app)
        .[method]('[path]')
        .send(testData);

      // Assert
      expect(response.status).toBe([expected_status]);
      expect(response.body).toHaveProperty('[expected_property]');
    });

    it('should return [error_code] when [error_condition]', async () => {
      // Test error cases
    });
  });
});
```

### 3. Create Controller (TDD - GREEN)
File: `backend/src/controllers/[controller].js`

```javascript
const { supabaseAdmin } = require('../config/database');
const { logger } = require('../config/logger');
const { z } = require('zod');

// Zod validation schema
const [schemaName] = z.object({
  // Define validation rules
});

async function [functionName](req, res) {
  try {
    // 1. Validate input
    const validated = [schemaName].parse(req.body);

    // 2. Business logic
    const { data, error } = await supabaseAdmin
      .from('[table]')
      .[operation](validated);

    if (error) {
      logger.error('[Controller] failed', { error: error.message });
      return res.status(400).json({ error: error.message });
    }

    // 3. Return response
    res.json({ success: true, data });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('[Controller] error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { [functionName] };
```

### 4. Create/Update Route
File: `backend/src/routes/[route].js`

```javascript
const express = require('express');
const router = express.Router();
const { [functionName] } = require('../controllers/[controller]');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply middleware + handler
router.[method]('[path]', rateLimiter.general, authenticate, [functionName]);

module.exports = router;
```

### 5. Register Route (if new file)
In `backend/src/server.js`:
```javascript
const [route]Routes = require('./routes/[route]Routes');
app.use('/api/v1/[route]', [route]Routes);
```

### 6. Run Tests
```bash
cd backend && npm test -- [controller].test.js
```

### 7. Checklist
- [ ] Test written and failing (RED)
- [ ] Controller implements logic (GREEN)
- [ ] Route registered with middleware
- [ ] Zod validation schema defined
- [ ] Error handling implemented
- [ ] Winston logging added
- [ ] Tests passing
- [ ] Coverage ≥70%

Refer to: [.agent/SOP/add_route.md](.agent/SOP/add_route.md)
