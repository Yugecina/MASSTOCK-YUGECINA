# Image Factory Workflow (Nano Banana)

**Last Updated:** 2025-11-24
**Status:** Production-Ready
**Version:** 1.2.0
**Workflow ID:** `f8b20b59-7d06-4599-8413-64da74225b0c`

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technical Specifications](#technical-specifications)
4. [Configuration](#configuration)
5. [API Integration](#api-integration)
6. [Error Handling & Retries](#error-handling--retries)
7. [Performance & Optimization](#performance--optimization)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)
10. [Recent Updates](#recent-updates)

---

## Overview

**Image Factory** is MasStock's flagship workflow for batch AI image generation using Google's Gemini 2.5 Flash and Gemini 3 Pro Image APIs. It allows clients to generate multiple images from text prompts with optional reference images.

### Key Features

- **Batch Processing**: Generate up to 10,000 images per execution
- **Reference Images**: Support for up to 3 reference images per generation
- **Multiple Models**:
  - `gemini-2.5-flash-image` (default, fast, cost-effective)
  - `gemini-3-pro-image-preview` (high quality, 4K support)
- **Flexible Aspect Ratios**: 1:1, 16:9, 9:16, 4:3, 3:4
- **Background Processing**: Uses Bull queue + Redis for async processing
- **Real-time Progress**: Track execution progress and view results live
- **Automatic Retry**: Handles timeouts and transient failures automatically

### Use Cases

1. **Product Photography**: Generate product-in-decor images for e-commerce
2. **Marketing Assets**: Create social media visuals from text descriptions
3. **Content Creation**: Batch generate illustrations for articles/blogs
4. **Design Prototyping**: Quickly visualize design concepts

---

## Architecture

### Component Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                                │
│    - User submits prompts + reference images via frontend       │
│    - Provides Gemini API key (ephemeral, encrypted in transit)  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. API ENDPOINT (workflowsController.js)                        │
│    - Validates input (Zod schema)                               │
│    - Parses prompts (newline-separated)                         │
│    - Processes reference images (base64 conversion)             │
│    - Encrypts API key for worker                                │
│    - Creates workflow_executions record                         │
│    - Enqueues job to Bull queue                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. BULL QUEUE (Redis)                                           │
│    - Job queued with executionId                                │
│    - Worker picks up job when available                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. WORKFLOW WORKER (workflow-worker.js)                         │
│    - Decrypts API key                                           │
│    - Initializes GeminiImageService                             │
│    - Processes each prompt sequentially                         │
│    - Updates workflow_batch_results for each image              │
│    - Uploads results to Supabase Storage                        │
│    - Updates workflow_executions status                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. GEMINI API (geminiImageService.js)                           │
│    - Makes API request to Google Gemini                         │
│    - Handles timeouts (120s base, progressive to 180s)          │
│    - Retries on failure (3 attempts, exponential backoff)       │
│    - Returns base64 image data                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. STORAGE & DATABASE                                           │
│    - Image stored in Supabase Storage (workflow-results bucket) │
│    - Public URL generated                                       │
│    - workflow_batch_results updated with URL                    │
│    - workflow_executions marked as completed                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. CLIENT POLLING                                               │
│    - Frontend polls /api/executions/:id every 2s               │
│    - Displays real-time progress and results                    │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── workflowsController.js       # Handles workflow execution requests
│   ├── services/
│   │   └── geminiImageService.js        # Gemini API integration
│   ├── workers/
│   │   └── workflow-worker.js           # Background job processor
│   ├── queues/
│   │   └── workflowQueue.js             # Bull queue configuration
│   └── utils/
│       ├── encryption.js                # API key encryption/decryption
│       └── workflowLogger.js            # Workflow-specific logging
├── database/
│   └── migrations/
│       └── 010_seed_nano_banana_workflow.sql  # Workflow seed data
└── scripts/
    ├── seed-nano-banana.js              # Seed workflow data
    ├── verify-nano-banana.js            # Verify workflow setup
    └── README_NANO_BANANA.md            # Original setup docs

frontend/
├── src/
│   ├── pages/
│   │   └── WorkflowExecute.jsx          # Workflow execution UI
│   ├── components/
│   │   └── workflows/
│   │       ├── NanoBananaForm.jsx       # Input form for prompts
│   │       └── BatchResultsView.jsx     # Results display
│   └── services/
│       └── api.js                       # API client
```

---

## Technical Specifications

### Model Specifications

#### Gemini 2.5 Flash Image (Default)
- **Model ID**: `gemini-2.5-flash-image`
- **Speed**: Fast (20-60 seconds per image)
- **Cost**: $0.039 per image
- **Resolution**: Default (optimized for speed)
- **Best For**: High-volume batch generation, quick prototypes

#### Gemini 3 Pro Image Preview
- **Model ID**: `gemini-3-pro-image-preview`
- **Speed**: Slower (40-90 seconds per image)
- **Cost**: $0.039 per image (same as Flash)
- **Resolution**: Configurable (1K, 2K, 4K)
- **Best For**: High-quality outputs, marketing materials, print

### Supported Aspect Ratios

| Ratio | Description | Best For |
|-------|-------------|----------|
| `1:1` | Square | Social media posts, avatars |
| `16:9` | Wide | YouTube thumbnails, banners |
| `9:16` | Portrait | Instagram stories, mobile |
| `4:3` | Standard | General use, presentations |
| `3:4` | Vertical | Pinterest, tall prints |

### Image Formats

- **Output Format**: PNG (default)
- **Encoding**: Base64 (in API response)
- **Storage Format**: PNG binary in Supabase Storage
- **Public URL**: Accessible via Supabase CDN

### Limits

| Parameter | Limit | Notes |
|-----------|-------|-------|
| Max prompts per execution | 10,000 | Configurable in workflow config |
| Max reference images | 3 | Per generation request |
| Prompt min length | 3 characters | Validation enforced |
| Prompt max length | No hard limit | Longer prompts = better results |
| Reference image max size | ~5MB | Converted to base64 |
| Request timeout | 120s (base) | Progressive to 180s on retries |
| Max retries | 3 | With exponential backoff |

---

## Configuration

### Workflow Configuration (Database)

```json
{
  "workflow_type": "nano_banana",
  "model": "gemini-2.5-flash-image",
  "api_provider": "google_gemini",
  "max_prompts": 10000,
  "max_reference_images": 3,
  "cost_per_image": 0.039,
  "supported_formats": ["png", "jpg", "webp"],
  "aspect_ratios": ["1:1", "16:9", "9:16", "4:3", "3:4"],
  "requires_api_key": true,
  "api_key_storage": "encrypted_ephemeral"
}
```

### Execution Configuration (Runtime)

```javascript
{
  api_key_encrypted: "encrypted_gemini_api_key",
  model: "gemini-2.5-flash-image",  // or "gemini-3-pro-image-preview"
  aspect_ratio: "1:1",               // Default aspect ratio
  resolution: "1K"                   // For Pro model: "1K", "2K", "4K"
}
```

### Environment Variables

**Backend (.env):**
```bash
# Required
GEMINI_API_KEY=your-google-gemini-api-key  # For testing only
ENCRYPTION_KEY=32-byte-hex-string          # For API key encryption
REDIS_URL=redis://localhost:6379           # Bull queue
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Optional
NODE_ENV=production                        # Enable zero-log mode
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:3000/api
```

---

## API Integration

### Gemini API Request Format

**Endpoint:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

**Headers:**
```
x-goog-api-key: YOUR_GEMINI_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "contents": [{
    "parts": [
      {
        "text": "A beautiful sunset over mountains"
      },
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "base64_encoded_reference_image"
        }
      }
    ]
  }],
  "generationConfig": {
    "responseModalities": ["Image"],
    "imageConfig": {
      "aspectRatio": "16:9",
      "imageSize": "4K"  // Pro model only
    }
  }
}
```

**Response Structure:**
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "inline_data": {
          "mime_type": "image/png",
          "data": "base64_encoded_image"
        }
      }]
    }
  }]
}
```

### MasStock API Endpoints

#### Execute Workflow
```http
POST /api/workflows/:workflow_id/execute
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

prompts_text: "Prompt 1\nPrompt 2\nPrompt 3"
api_key: "your-gemini-api-key"
reference_images: [file1.jpg, file2.png]
model: "gemini-2.5-flash-image"
aspect_ratio: "1:1"
resolution: "1K"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "uuid",
    "workflow_id": "uuid",
    "status": "queued",
    "prompt_count": 3,
    "estimated_time_seconds": 180
  }
}
```

#### Get Execution Status
```http
GET /api/executions/:execution_id
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflow_id": "uuid",
    "status": "processing",
    "progress": 66,
    "started_at": "2025-11-24T12:00:00Z",
    "batch_results": [
      {
        "batch_index": 0,
        "status": "completed",
        "prompt_text": "Prompt 1",
        "result_url": "https://xxx.supabase.co/storage/v1/...",
        "processing_time_ms": 25000
      },
      {
        "batch_index": 1,
        "status": "processing",
        "prompt_text": "Prompt 2"
      }
    ]
  }
}
```

---

## Error Handling & Retries

### Timeout Configuration

**Before (v1.0):**
- Fixed 60-second timeout
- No progressive timeout on retries
- **Issue**: 84-second requests failed

**After (v1.2):**
- Base timeout: **120 seconds**
- Progressive timeout on retries:
  - Attempt 1: 120 seconds
  - Attempt 2: 150 seconds (+30s)
  - Attempt 3: 180 seconds (+60s)
- **Result**: Handles slow API responses gracefully

**Implementation** (geminiImageService.js:272):
```javascript
const attemptTimeout = timeout + (30000 * (attempt - 1)); // Progressive timeout
```

### Retry Logic

**Retry Strategy:**
1. **Max Retries**: 3 attempts
2. **Backoff Delay**:
   - Regular errors: 2s, 4s, 6s (exponential)
   - Timeout errors: 5s, 10s, 15s (longer delay)
3. **Non-retriable Errors**:
   - 400 Bad Request
   - 401 Unauthorized
   - 403 Forbidden
   - Any 4xx except 429 (Rate Limit)

**Implementation** (geminiImageService.js:381-383):
```javascript
const backoffDelay = isTimeout
  ? TIMEOUT_RETRY_DELAY * attempt  // 5s, 10s, 15s
  : RETRY_DELAY * attempt;          // 2s, 4s, 6s
```

### Error Types

| Error Code | Description | Retry? | User Action |
|------------|-------------|--------|-------------|
| `TIMEOUT` | Request exceeded timeout | ✅ Yes | Wait for retry |
| `INVALID_API_KEY` | API key invalid/expired | ❌ No | Check API key |
| `RATE_LIMIT_EXCEEDED` | Too many requests | ✅ Yes | Wait and retry |
| `INVALID_REQUEST` | Bad request format | ❌ No | Fix input data |
| `SERVER_ERROR` | Gemini API 5xx error | ✅ Yes | Wait for retry |

### Scope Issue Fix (v1.2)

**Problem:**
Variables `aspectRatio` and `resolution` were declared inside try-catch block (`const`), making them block-scoped and inaccessible in the for-loop.

**Error:**
```
ReferenceError: aspectRatio is not defined
```

**Fix** (workflow-worker.js:43-46):
```javascript
// Declare variables that need to be accessible in the for-loop
let geminiService;
let aspectRatio;
let resolution;

// Validate and decrypt API key
try {
  geminiService = createGeminiImageService(decryptedApiKey);
  aspectRatio = config.aspect_ratio || '1:1';
  resolution = config.resolution || '1K';
}
```

---

## Performance & Optimization

### Processing Times (Observed)

| Model | Min | Avg | Max | Notes |
|-------|-----|-----|-----|-------|
| Flash | 20s | 40s | 84s | Varies by prompt complexity |
| Pro | 40s | 65s | 90s | Higher quality, slower |

### Optimization Strategies

1. **Sequential Processing**: Process prompts one at a time to avoid rate limits
2. **Progressive Timeouts**: Increase timeout on retries to handle slow requests
3. **Early Detection**: Warn when request uses >80% of timeout
4. **Efficient Storage**: Store images as PNG binary, not base64
5. **Public URLs**: Use Supabase CDN for fast image delivery

### Cost Optimization

**Pricing:**
- Cost per image: $0.039
- Revenue per execution: $0.10 (can be higher for bulk)
- Profit margin: 60%

**Example:**
- 10 prompts = $0.39 cost
- Client pays: $1.00
- Profit: $0.61 (61% margin)

---

## Testing & Verification

### Unit Tests

```bash
cd backend
npm test -- geminiImageService.test.js
```

**Coverage:**
- ✅ API key validation
- ✅ Prompt validation
- ✅ Request payload building
- ✅ Response parsing
- ✅ Error handling
- ✅ Retry logic
- ✅ Timeout handling

### Integration Tests

```bash
cd backend
npm test -- workflowsController.test.js
```

**Coverage:**
- ✅ Workflow execution endpoint
- ✅ Input validation (Zod)
- ✅ Reference image processing
- ✅ Queue job creation
- ✅ Database record creation

### Manual Testing

**1. Backend Test:**
```bash
cd backend
node scripts/test-estee-login.js
```

**2. Frontend Test:**
1. Start frontend: `cd frontend && npm run dev`
2. Login as Estee: `estee@masstock.com` / `Estee123123`
3. Navigate to Workflows
4. Click "Image Factory"
5. Enter prompts:
   ```
   A cozy living room with a modern sofa
   A bedroom with a stylish bed frame
   A kitchen with marble countertops
   ```
6. Upload reference images (optional)
7. Enter Gemini API key
8. Click "Execute"
9. Watch real-time progress
10. Verify images appear in results

**3. Verify Database:**
```bash
cd backend
node scripts/verify-nano-banana.js
```

### Load Testing

**Test Scenarios:**
1. **Small Batch**: 5 prompts, no reference images
2. **Medium Batch**: 50 prompts, 1 reference image
3. **Large Batch**: 500 prompts, 3 reference images
4. **Concurrent**: 3 executions running simultaneously

---

## Troubleshooting

### Common Issues

#### 1. "aspectRatio is not defined"

**Cause:** Variable scope issue (fixed in v1.2)

**Solution:** Upgrade to v1.2 or declare variables outside try-catch

#### 2. "timeout of 60000ms exceeded"

**Cause:** Old timeout configuration (fixed in v1.2)

**Solution:**
- Upgrade to v1.2 (120s base timeout)
- Or increase timeout manually in geminiImageService.js:20

#### 3. "Invalid or expired API key"

**Cause:** Gemini API key is invalid

**Solution:**
1. Verify API key at https://aistudio.google.com/app/apikey
2. Ensure key has correct permissions
3. Check for typos in API key

#### 4. Workflow Not Visible

**Cause:** RLS policy or client linkage issue

**Solution:**
```bash
cd backend
node scripts/verify-nano-banana.js
node scripts/check-estee-user.js
```

#### 5. Images Not Uploading

**Cause:** Supabase Storage permissions

**Solution:**
1. Check storage bucket exists: `workflow-results`
2. Verify RLS policies allow inserts
3. Check service role key in .env

### Debug Logging

**Enable Debug Logs:**
```bash
# Backend
export LOG_LEVEL=debug
npm run dev

# Check logs
tail -f logs/combined.log
```

**Key Log Patterns:**
```
🎨 Gemini Image Service - generateImage called
🌐 Making Gemini API request (attempt 1/3)
✅ Gemini API request successful (45000ms)
⚠️  Request took 96000ms (80% of 120000ms timeout)
❌ Gemini API request failed (attempt 1/3)
⏳ Retrying in 5000ms...
```

### Performance Warnings

**Warning**: Request took >80% of timeout
```
⚠️ Request took 108000ms (90% of 120000ms timeout)
```

**Action**: Monitor for potential timeout issues

---

## Recent Updates

### Version 1.2.0 (2025-11-24)

**Bug Fixes:**
1. ✅ **Fixed timeout issues**
   - Increased base timeout from 60s to 120s
   - Added progressive timeout (up to 180s on 3rd retry)
   - Added longer retry delay for timeout errors (5s vs 2s)

2. ✅ **Fixed scope issue**
   - Moved `aspectRatio` and `resolution` declarations outside try-catch
   - Changed from `const` to `let` for proper scoping
   - Fixed "aspectRatio is not defined" error

**Performance Improvements:**
- Added warning when request uses >80% of timeout
- Better logging for timeout detection
- More resilient retry logic

**Files Modified:**
- `backend/src/services/geminiImageService.js` (timeout config, retry logic)
- `backend/src/workers/workflow-worker.js` (variable scoping)

### Version 1.1.0 (2025-11-23)

**Features:**
- Added support for Gemini 3 Pro Image model
- Added configurable resolution (1K, 2K, 4K)
- Updated example prompts to product-in-decor scenarios

### Version 1.0.0 (2025-11-20)

**Initial Release:**
- Gemini 2.5 Flash Image integration
- Batch processing with Bull queue
- Reference image support
- Real-time progress tracking
- Database schema and migrations

---

## Related Documentation

- **[Project Architecture](../system/project_architecture.md)** - System overview
- **[Database Schema](../system/database_schema.md)** - Tables and relationships
- **[SOP: Add Migration](../SOP/add_migration.md)** - How to add migrations
- **[CLAUDE.md](../../CLAUDE.md)** - Development workflow
- **[README_NANO_BANANA.md](../../backend/scripts/README_NANO_BANANA.md)** - Original setup docs

---

## Support

For issues or questions:

1. Check this documentation first
2. Run verification scripts: `node scripts/verify-nano-banana.js`
3. Check backend logs: `tail -f logs/combined.log`
4. Review Gemini API docs: https://ai.google.dev/gemini-api/docs/image-generation
5. Contact development team

---

**Last Review:** 2025-11-24
**Next Review:** When adding new features or fixing bugs
**Maintained By:** MasStock Development Team
