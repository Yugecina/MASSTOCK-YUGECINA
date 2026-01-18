# E2E Tests for Workflows

## Overview

This directory contains end-to-end tests for MasStock workflows. These tests validate complete workflow execution from API call to result generation using real services (Gemini API, Redis, Supabase).

## Test Files

- **`room-redesigner.e2e.test.ts`** - Room Redesigner workflow tests
- **`image-factory.e2e.test.ts`** - Image Factory batch generation tests
- **`smart-resizer.e2e.test.ts`** - Smart Resizer multi-format tests

## Prerequisites

Before running E2E tests, ensure:

### 1. Services Running

```bash
# Terminal 1: Backend API
cd backend && npm run dev

# Terminal 2: Worker
cd backend && npm run worker

# Terminal 3: Redis
redis-server
```

### 2. Environment Variables

Create `.env.test` in `backend/` directory:

```env
# API
API_URL=http://localhost:3000

# Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx

# Gemini API
GEMINI_API_KEY=xxx

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=xxx
```

### 3. Test Fixtures

Place test images in `backend/src/__tests__/fixtures/`:

```
fixtures/
├── empty-room.jpg       # Empty room for Room Redesigner
├── furnished-room.jpg   # Furnished room for Room Redesigner
└── test-image.jpg       # Generic image for Smart Resizer
```

You can use any JPEG images, but ensure they're realistic for better test coverage:
- **Empty room**: Clear photo of an empty room
- **Furnished room**: Photo of a furnished interior
- **Test image**: Any advertising/marketing image with text

## Running Tests

### Run All E2E Tests

```bash
cd backend
npm run test:e2e
```

### Run Individual Workflow Tests

```bash
# Room Redesigner only
npm test -- src/__tests__/e2e/workflows/room-redesigner.e2e.test.ts

# Image Factory only
npm test -- src/__tests__/e2e/workflows/image-factory.e2e.test.ts

# Smart Resizer only
npm test -- src/__tests__/e2e/workflows/smart-resizer.e2e.test.ts
```

### Run with Verbose Output

```bash
npm test -- src/__tests__/e2e/workflows/ --verbose
```

### Run in Watch Mode

```bash
npm test -- src/__tests__/e2e/workflows/ --watch
```

## Test Structure

Each workflow test follows this pattern:

### 1. Authentication

```typescript
beforeAll(async () => {
  const loginResponse = await request(API_URL)
    .post('/api/v1/auth/login')
    .send({ email, password });

  authToken = loginResponse.body.token;
});
```

### 2. Workflow Execution

```typescript
const response = await request(API_URL)
  .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
  .set('Authorization', `Bearer ${authToken}`)
  .send(workflowParams);
```

### 3. Polling for Results

```typescript
let completed = false;
while (!completed && attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 3000));

  const status = await request(API_URL)
    .get(`/api/v1/executions/${executionId}`)
    .set('Authorization', `Bearer ${authToken}`);

  if (status.body.data?.status === 'completed') {
    completed = true;
  }
}
```

## Test Coverage

### Room Redesigner
- ✅ Single image execution (empty room)
- ✅ Single image execution (furnished room)
- ✅ Invalid style parameter rejection
- ✅ Missing image file rejection

### Image Factory
- ✅ Single image generation
- ✅ Batch generation (5 images)
- ✅ Empty prompts array rejection
- ✅ Invalid count parameter rejection
- ✅ Count exceeding limit rejection (>10,000)

### Smart Resizer
- ✅ Single format resize (Instagram Square)
- ✅ Multi-format resize (Meta platforms)
- ✅ Empty formats array rejection
- ✅ Invalid format name rejection
- ✅ Missing image file rejection

## Timeouts

E2E tests have extended timeouts to account for real API processing:

- **Room Redesigner**: 3 minutes (180s)
- **Image Factory**: 5 minutes (300s)
- **Smart Resizer**: 4 minutes (240s)

## Debugging

### Enable Detailed Logging

Tests include console logs at key points:

```
🔐 Authenticated successfully
🚀 Starting workflow execution
📦 Response: 200 { success: true, ... }
✅ Execution started: <execution-id>
🔍 Attempt 5/60 - Status: processing
✅ Execution completed successfully
📦 Results: { outputUrl: '...', ... }
```

### Check Worker Logs

```bash
# In worker terminal
cd backend && npm run worker
```

### Check Redis Queue

```bash
redis-cli LLEN bull:workflow-queue:wait
redis-cli LLEN bull:workflow-queue:active
redis-cli LLEN bull:workflow-queue:completed
redis-cli LLEN bull:workflow-queue:failed
```

### Check Execution in Database

```bash
# Via Supabase MCP
SELECT * FROM executions WHERE id = '<execution-id>';
```

## Common Issues

### Test Timeout

**Symptom**: Test fails with timeout error

**Solutions**:
1. Increase timeout in test file
2. Check worker is running
3. Check Gemini API quota/limits
4. Check Redis connection

### Authentication Failed

**Symptom**: 401 Unauthorized errors

**Solutions**:
1. Verify `.env.test` credentials
2. Create test user in database if needed
3. Check JWT_SECRET matches between API and tests

### Worker Not Processing

**Symptom**: Execution stays in "pending" status

**Solutions**:
1. Restart worker process
2. Check Redis connection
3. Check worker logs for errors
4. Verify `GEMINI_API_KEY` is valid

### Image Upload Failed

**Symptom**: 400 error on workflow execution

**Solutions**:
1. Verify test image files exist in `fixtures/`
2. Check file permissions
3. Ensure images are valid JPEG format
4. Check file size (max 10MB)

## CI/CD Integration

### GitHub Actions

Add E2E test step to `.github/workflows/tests.yml`:

```yaml
- name: Run E2E Tests
  env:
    API_URL: http://localhost:3000
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: |
    npm run test:e2e
```

### Required Secrets

Configure in GitHub repository settings:

- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Best Practices

### 1. Use Real Test Accounts

Don't use production user accounts for E2E tests. Create dedicated test accounts.

### 2. Clean Up After Tests

E2E tests should clean up resources (executions, generated images) after completion.

### 3. Test Realistic Scenarios

Use realistic test data (actual room photos, marketing images, etc.) for better coverage.

### 4. Monitor API Costs

E2E tests make real Gemini API calls, which incur costs. Run selectively.

### 5. Parallel Execution

Avoid running E2E tests in parallel to prevent race conditions in shared resources (Redis, DB).

## Next Steps

- [ ] Add cleanup hooks to delete test executions
- [ ] Add performance benchmarks (execution time tracking)
- [ ] Add test for concurrent workflow executions
- [ ] Add test for workflow cancellation
- [ ] Add visual regression testing for generated images
- [ ] Add load testing (100+ concurrent executions)

## Support

For issues or questions:

1. Check logs (API, worker, Redis)
2. Review error messages in test output
3. Check `.agent/SOP/debugging_workflows.md` (if exists)
4. Contact dev team

---

**Last Updated**: 2026-01-10
**Maintainer**: MasStock Dev Team
