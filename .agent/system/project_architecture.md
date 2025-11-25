# MasStock - Project Architecture

**Last Updated:** 2025-11-25
**Status:** Production-Ready
**Version:** 2.1.0 (Multi-User Client Management)

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Integration Points](#integration-points)
7. [Authentication & Security](#authentication--security)
8. [Data Flow](#data-flow)
9. [Deployment Architecture](#deployment-architecture)

---

## Project Overview

**MasStock** is a production-grade SaaS workflow automation platform designed for AI content agencies. It enables agencies to automate AI-powered content production workflows from client request to final delivery.

### Key Features

- **Workflow Automation**: Execute AI-powered workflows with job queue management
- **Batch Processing**: Process multiple items (e.g., image generation) in parallel
- **Multi-tenant**: Support for multiple clients with role-based access
- **Multi-User Clients**: Users can belong to multiple clients with different roles (owner/collaborator) ⭐ v2.1
- **Workflow Templates**: Admin-defined templates for easy workflow assignment ⭐ v2.1
- **Real-time Monitoring**: Track workflow executions in real-time
- **Admin Dashboard**: Complete analytics, user management, client management, and system monitoring
- **Production-Ready**: Zero-log production mode, SSL, CI/CD, automated backups

### Primary Use Case

The flagship workflow is **Nano Banana** (Gemini 2.5 Flash Image Generation):
- Batch generation of AI images from text prompts
- Support for reference images
- Background processing with Bull queue
- Real-time progress tracking
- Result storage in Supabase Storage

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React 19 SPA (Vite)                                      │   │
│  │  - Pure CSS (NO Tailwind)                                 │   │
│  │  - Zustand State Management                               │   │
│  │  - React Router v7                                        │   │
│  │  - Axios with httpOnly cookies                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (withCredentials: true)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express.js REST API                                      │   │
│  │  - JWT Authentication (httpOnly cookies)                  │   │
│  │  - Rate Limiting                                          │   │
│  │  - Request Logging (Winston)                              │   │
│  │  - Error Handling Middleware                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Supabase   │  │  Bull Queue  │  │   Gemini AI  │
    │  PostgreSQL  │  │    Redis     │  │     API      │
    │   + Auth     │  │              │  │              │
    │   + Storage  │  │  Background  │  │ Image Gen    │
    └──────────────┘  │   Workers    │  └──────────────┘
                      └──────────────┘
```

### Three-Tier Architecture

1. **Presentation Tier** (Frontend)
   - React 19 SPA with Vite
   - Pure CSS custom design system
   - Zustand for state management
   - Client-side routing with React Router

2. **Application Tier** (Backend API)
   - Node.js + Express REST API
   - JWT authentication with httpOnly cookies
   - Business logic in controllers
   - Middleware for auth, rate limiting, error handling

3. **Data Tier** (Database + Queue + External APIs)
   - Supabase (PostgreSQL + Auth + Storage)
   - Redis + Bull (Job queue)
   - Google Gemini API (Image generation)

---

## Technology Stack

### Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **Framework** | Express | 4.18.2 | Web framework |
| **Database** | Supabase | 2.81.1 | PostgreSQL + Auth + Storage |
| **Queue** | Bull | 4.12.0 | Background job processing |
| **Cache/Queue** | Redis | ioredis 5.3.2 | In-memory data store |
| **Authentication** | JWT | jsonwebtoken 9.0.2 | Token-based auth |
| **Validation** | Zod | 4.1.12 | Schema validation |
| **Logging** | Winston | 3.18.3 | Structured logging |
| **Testing** | Jest | 29.7.0 | Unit/integration tests |
| **Security** | Helmet | 7.1.0 | HTTP security headers |
| **Rate Limiting** | express-rate-limit | 7.1.5 | API rate limiting |

### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 19.2.0 | UI library |
| **Build Tool** | Vite | 7.2.2 | Fast dev server & bundler |
| **Styling** | Pure CSS | - | **NO Tailwind** - Custom design system |
| **State** | Zustand | 5.0.8 | State management |
| **Routing** | React Router | 7.9.6 | Client-side routing |
| **HTTP Client** | Axios | 1.13.2 | API calls |
| **Forms** | React Hook Form | 7.66.0 | Form handling |
| **Validation** | Zod | 4.1.12 | Schema validation |
| **Notifications** | react-hot-toast | 2.6.0 | Toast notifications |
| **Charts** | Recharts | 3.4.1 | Data visualization |
| **Testing** | Vitest | 4.0.9 | Unit tests |

### External Services

- **Supabase**: PostgreSQL database, Authentication, File Storage
- **Redis**: Job queue, caching, session storage
- **Google Gemini API**: AI image generation (Gemini 2.5 Flash)
- **Let's Encrypt**: SSL certificates (production)

---

## Project Structure

```
MASSTOCK/
├── .agent/                      # 📚 Project documentation
│   ├── README.md                # Documentation index
│   ├── system/                  # System & architecture docs
│   │   ├── project_architecture.md
│   │   └── database_schema.md
│   ├── sop/                     # Standard operating procedures
│   │   ├── add_migration.md
│   │   ├── add_route.md
│   │   └── add_component.md
│   └── tasks/                   # Feature PRDs & implementation plans
│
├── backend/                     # 🔧 Node.js API Server
│   ├── src/
│   │   ├── __tests__/           # Jest tests (70%+ coverage)
│   │   ├── config/              # Configuration (database, redis, logger)
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Auth, errors, rate limiting
│   │   ├── routes/              # API route definitions
│   │   ├── queues/              # Bull job queues
│   │   ├── workers/             # Background job workers
│   │   ├── services/            # Business logic (Gemini service)
│   │   ├── utils/               # Helpers, encryption, logging
│   │   └── server.js            # Express app entry point
│   ├── scripts/                 # Utility scripts
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                    # 🎨 React Application
│   ├── src/
│   │   ├── __tests__/           # Vitest tests (70%+ coverage)
│   │   ├── components/          # React components
│   │   │   ├── ui/              # Reusable UI components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── admin/           # Admin-specific components
│   │   │   └── workflows/       # Workflow-specific components
│   │   ├── pages/               # Route components
│   │   │   ├── admin/           # Admin pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── WorkflowsList.jsx
│   │   │   ├── Executions.jsx
│   │   │   └── Login.jsx
│   │   ├── services/            # API client services
│   │   ├── store/               # Zustand stores
│   │   ├── hooks/               # Custom React hooks
│   │   ├── styles/              # CSS files
│   │   │   └── global.css       # Design system (tokens, classes)
│   │   ├── utils/               # Helpers
│   │   ├── App.jsx              # Root component
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── scripts/                     # 🚀 Deployment scripts
│   ├── generate-secrets.js      # Generate crypto-secure secrets
│   ├── setup-ssl.sh             # SSL certificate setup
│   ├── health-check.sh          # Production health monitoring
│   └── backup.sh                # Automated backups
│
├── docker-compose.production.yml # 🐳 Production Docker setup
├── backend/Dockerfile           # Backend container
├── nginx/                       # Nginx reverse proxy config
│
├── .github/workflows/           # 🔄 CI/CD pipelines
│   ├── tests.yml                # Automated testing
│   └── deploy.yml               # Auto-deployment
│
├── CLAUDE.md                    # Claude Code development guide
├── README.md                    # Project README
└── package.json                 # Root package.json
```

---

## Core Components

### Backend Components

#### 1. **Controllers** (`backend/src/controllers/`)

Handle HTTP requests and responses:

- `authController.js` - Login, logout, token refresh, user profile
- `workflowsController.js` - Workflow CRUD, execution trigger
- `workflowRequestsController.js` - Client workflow requests
- `supportTicketsController.js` - Support ticket management
- `adminController.js` - Admin operations (legacy)
- `adminUserController.js` - User management (CRUD)
- `adminWorkflowController.js` - Admin workflow management
- `adminClientController.js` - **Client management** (members, workflows, executions, activity) ⭐ v2.1
- `workflowTemplatesController.js` - **Workflow templates CRUD** ⭐ v2.1
- `analyticsController.js` - Analytics & metrics
- `settingsController.js` - User/client settings

#### 2. **Middleware** (`backend/src/middleware/`)

- `auth.js` - JWT authentication, role checks (admin, client)
- `errorHandler.js` - Centralized error handling
- `rateLimit.js` - API rate limiting
- `requestLogger.js` - Request/response logging
- `upload.js` - File upload handling (Multer)

#### 3. **Routes** (`backend/src/routes/`)

Define API endpoints (all prefixed with `/api/v1/`):

- `authRoutes.js` - `/auth/*` (login, logout, me, refresh)
- `workflowRoutes.js` - `/workflows/*` (list, detail, execute)
- `executionRoutes.js` - `/executions/*` (list, detail, results)
- `workflowRequestRoutes.js` - `/workflow-requests/*`
- `supportTicketRoutes.js` - `/support-tickets/*`
- `settingsRoutes.js` - `/settings/*`
- `adminRoutes.js` - `/admin/*` (users, workflows, analytics)

#### 4. **Services** (`backend/src/services/`)

- `geminiImageService.js` - Google Gemini API integration for image generation

#### 5. **Queues & Workers** (`backend/src/queues/`, `backend/src/workers/`) ⭐ v2.0 Async

**Async Parallel Processing Architecture:**

- `workflowQueue.js` - Bull queue for background jobs (Redis-backed)
- `workflow-worker.js` - **Async worker pool** (v2.0)
  - **Worker concurrency:** 3 parallel executions (configurable via `WORKER_CONCURRENCY`)
  - **Prompt concurrency:** 5 parallel prompts per execution (via `PROMPT_CONCURRENCY`)
  - `processNanoBananaWorkflow()` - Batch image generation with parallel processing
  - `processStandardWorkflow()` - Placeholder for future workflows
  - **Performance:** 15x faster than sequential processing (v1.x)

**See:** [Async Workers Documentation](./async_workers.md) for complete details

#### 6. **Configuration** (`backend/src/config/`)

- `database.js` - Supabase client setup (anon + admin)
- `redis.js` - Redis connection configuration
- `logger.js` - Winston logger setup

#### 7. **Utilities** (`backend/src/utils/`)

- `encryption.js` - Encrypt/decrypt API keys (AES-256-CBC)
- `workflowLogger.js` - Structured workflow logging
- `promptParser.js` - Parse workflow prompts
- `apiRateLimiter.js` - **Global API rate limiter** (v2.0)
  - Sliding window algorithm (15 req/min for Gemini Free tier)
  - Automatic request queuing when limit hit
  - Real-time statistics and monitoring
  - Shared singleton across all worker processes

### Frontend Components

#### 1. **Pages** (`frontend/src/pages/`)

Route components (one per URL):

**Client Pages:**
- `Dashboard.jsx` - Client dashboard with stats
- `WorkflowsList.jsx` - Available workflows
- `WorkflowDetail.jsx` - Single workflow view
- `WorkflowExecute.jsx` - Execute workflow form
- `Executions.jsx` - Execution history & results
- `Requests.jsx` - Workflow requests list
- `Settings.jsx` - User settings

**Admin Pages** (`frontend/src/pages/admin/`):
- `AdminDashboard.jsx` - Admin overview
- `AdminUsers.jsx` - User management
- `AdminClients.jsx` - Client list & management
- `AdminClientDetail.jsx` - **Client detail page with tabs** (Overview, Members, Workflows, Executions, Activity) ⭐ v2.1
- `AdminWorkflows.jsx` - Workflow & request management
- `AdminTickets.jsx` - Support tickets
- `AdminErrors.jsx` - Error tracking
- `AdminFinances.jsx` - Financial reporting
- `AdminSettings.jsx` - System settings

**Other:**
- `Login.jsx` - Authentication page
- `NotFound.jsx` - 404 page

#### 2. **Components** (`frontend/src/components/`)

**UI Components** (`ui/`):
- `Button.jsx` - Reusable button with variants
- `Input.jsx` - Form input
- `Card.jsx` - Container card
- `Badge.jsx` - Status badge
- `Modal.jsx` - Dialog modal
- `Spinner.jsx` - Loading spinner
- `Toast.jsx` - Notification toast
- `EmptyState.jsx` - Empty state placeholder
- `SkeletonScreen.jsx` - Loading skeleton

**Layout Components** (`layout/`):
- `ClientLayout.jsx` - Client area layout
- `AdminLayout.jsx` - Admin area layout
- `AdminSidebar.jsx` - Admin navigation
- `Sidebar.jsx` - Client navigation

**Admin Components** (`admin/`):
- `UserTable.jsx` - User management table
- `UserForm.jsx` - User create/edit form
- `WorkflowTable.jsx` - Workflow table
- `WorkflowRequestsList.jsx` - Requests list
- `AnalyticsCard.jsx` - Metric card
- `TrendChart.jsx` - Line chart
- `SuccessChart.jsx` - Success rate chart
- `RevenueChart.jsx` - Revenue chart
- `TopWorkflowsTable.jsx` - Top workflows
- `TopClientsTable.jsx` - Top clients
- `RecentFailuresTable.jsx` - Failed executions
- **Client Management Components** ⭐ v2.1:
  - `ClientOverviewTab.jsx` - Client stats and info
  - `ClientMembersTab.jsx` - Member list with role badges
  - `ClientWorkflowsTab.jsx` - Assigned workflows
  - `ClientExecutionsTab.jsx` - Executions with filters
  - `ClientActivityTab.jsx` - Audit log timeline
  - `AddMemberModal.jsx` - User search & add to client
  - `AssignWorkflowModal.jsx` - Template selection & assign

**Workflow Components** (`workflows/`):
- `NanoBananaForm.jsx` - Nano Banana workflow form
- `BatchResultsView.jsx` - View batch results

#### 3. **Services** (`frontend/src/services/`)

API client wrappers:

- `api.js` - Axios instance with auth interceptor
- `auth.js` - Auth API calls
- `workflows.js` - Workflow API calls
- `requests.js` - Workflow request API calls
- `admin.js` - Admin API calls
- `adminUserService.js` - User management API
- `adminWorkflowService.js` - Admin workflow API
- `adminClientService.js` - **Client management API** (members, workflows, executions, activity, templates) ⭐ v2.1
- `analyticsService.js` - Analytics API
- `settings.js` - Settings API

#### 4. **Stores** (`frontend/src/store/`)

Zustand state management:

- `authStore.js` - Authentication state (user, login, logout)
- `workflowStore.js` - Workflow list state
- `adminWorkflowsStore.js` - Admin workflow state
- `adminClientStore.js` - **Client detail state** (members, workflows, executions, activity, search, templates) ⭐ v2.1

#### 5. **Hooks** (`frontend/src/hooks/`)

- `useAuth.js` - Authentication hook

#### 6. **Styles** (`frontend/src/styles/`)

- `global.css` - **Complete CSS design system** (NO Tailwind)
  - CSS custom properties (tokens)
  - Utility classes (`.flex`, `.p-6`, `.gap-md`)
  - Component classes (`.btn`, `.card`, `.badge`)

---

## Integration Points

### 1. Supabase Integration

**Purpose**: PostgreSQL database + Authentication + File Storage

**Components:**
- `backend/src/config/database.js` - Client setup
- `backend/src/middleware/auth.js` - JWT verification

**Tables Used:**
- `users` - User accounts
- `clients` - Client organizations
- `client_members` - User-client membership (N:N junction) ⭐ v2.1
- `workflow_templates` - Admin-defined workflow templates ⭐ v2.1
- `workflows` - Workflow instances (assigned to clients)
- `workflow_executions` - Execution records
- `workflow_batch_results` - Batch processing results
- `workflow_requests` - Client requests
- `support_tickets` - Support tickets

**Storage Buckets:**
- `workflow-results` - Generated images/files

**Authentication:**
- Supabase Auth for JWT generation
- Row Level Security (RLS) enabled on all tables

### 2. Redis + Bull Integration

**Purpose**: Background job processing

**Components:**
- `backend/src/config/redis.js` - Redis connection
- `backend/src/queues/workflowQueue.js` - Job queue
- `backend/src/workers/workflow-worker.js` - Job processor

**Flow:**
1. User triggers workflow execution (API request)
2. Job added to Bull queue with execution data
3. Worker picks up job from Redis
4. Worker processes workflow (e.g., generate images)
5. Results stored in Supabase
6. Execution status updated

### 3. Google Gemini API Integration

**Purpose**: AI image generation

**Component:**
- `backend/src/services/geminiImageService.js`

**Model**: `gemini-2.5-flash-image` (Nano Banana)

**Features:**
- Text-to-image generation
- Reference image support
- Configurable aspect ratios
- Retry logic with exponential backoff

**Pricing**: $0.039 per image

**API Endpoint:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent
```

---

## Authentication & Security

### Authentication Flow

1. **Login** (`POST /api/v1/auth/login`)
   - User submits email + password
   - Backend validates credentials with Supabase Auth
   - Backend generates JWT access token (15min) and refresh token (30d)
   - Tokens stored in **httpOnly cookies** (NOT localStorage)
   - User data returned to frontend

2. **Authenticated Requests**
   - Frontend sends cookies automatically (`withCredentials: true`)
   - Backend extracts token from `access_token` cookie
   - Backend verifies JWT with Supabase
   - User data attached to `req.user`

3. **Token Refresh** (`POST /api/v1/auth/refresh`)
   - When access token expires, use refresh token
   - Backend validates refresh token
   - New access token issued

4. **Logout** (`POST /api/v1/auth/logout`)
   - Backend clears httpOnly cookies
   - Frontend clears state

### Security Measures

1. **Authentication**
   - JWT tokens in httpOnly cookies (XSS protection)
   - Refresh token rotation
   - Password hashing with bcrypt
   - Supabase Auth integration

2. **Authorization**
   - **Platform roles:** `admin` (MasStock team), `user` (everyone else)
   - **Client roles:** `owner` (full access, billing), `collaborator` (workflows only) ⭐ v2.1
   - Row Level Security (RLS) in Supabase using `client_members` table
   - Middleware for role checks (`requireAdmin`, `requireClient`)

3. **API Security**
   - Rate limiting (100 req/min default)
   - CORS whitelist (production)
   - Helmet.js security headers
   - Request validation with Zod

4. **Data Security**
   - API keys encrypted in database (AES-256-CBC)
   - Environment variables for secrets
   - No sensitive data in logs (production)
   - SSL/HTTPS (production)

5. **Input Validation**
   - Zod schemas for all inputs
   - Parameterized SQL queries (Supabase client)
   - File upload restrictions

6. **Error Handling**
   - No stack traces in production
   - Generic error messages for auth failures
   - Structured logging with Winston

---

## Data Flow

### Workflow Execution Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER TRIGGERS EXECUTION                                       │
│    Frontend: WorkflowExecute.jsx                                 │
│    POST /api/v1/workflows/:id/execute                            │
│    Body: { prompts: [...], api_key: "encrypted" }                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. API HANDLER                                                    │
│    Backend: workflowsController.executeWorkflow()                │
│    - Validate input (Zod)                                        │
│    - Encrypt API key                                             │
│    - Create execution record in DB                               │
│    - Add job to Bull queue                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. JOB QUEUE (Redis + Bull)                                      │
│    workflowQueue.add({                                           │
│      executionId, workflowId, clientId,                          │
│      inputData, config                                           │
│    })                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKGROUND WORKER                                             │
│    Backend: workflow-worker.js                                   │
│    - Pick job from queue                                         │
│    - Update execution status to "processing"                     │
│    - Decrypt API key                                             │
│    - Dispatch to workflow handler (Nano Banana)                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. WORKFLOW PROCESSING (Nano Banana)                             │
│    For each prompt:                                              │
│    - Insert batch_result record (status: processing)             │
│    - Call Gemini API (generateImage)                             │
│    - Upload result to Supabase Storage                           │
│    - Get public URL                                              │
│    - Update batch_result (status: completed, result_url)         │
│    - Update job progress                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. COMPLETION                                                     │
│    - Update execution status to "completed"                      │
│    - Store output_data (successful, failed, total)               │
│    - Calculate duration_seconds                                  │
│    - Log completion                                              │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. USER VIEWS RESULTS                                            │
│    Frontend: Executions.jsx                                      │
│    GET /api/v1/executions/:id                                    │
│    GET /api/v1/executions/:id/batch-results                      │
│    - Display images in grid                                      │
│    - Download all as ZIP                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Production Environment

**URLs:**
- Frontend: https://dorian-gonzalez.fr
- API: https://api.dorian-gonzalez.fr
- Health: https://api.dorian-gonzalez.fr/health

### Infrastructure Stack

```
                     Internet
                        │
                        ▼
                ┌──────────────┐
                │   Nginx      │ ← SSL (Let's Encrypt)
                │  (Reverse    │ ← Rate limiting
                │   Proxy)     │ ← HTTPS redirect
                └──────┬───────┘
                       │
         ┌─────────────┼─────────────┐
         │                           │
         ▼                           ▼
  ┌──────────────┐          ┌──────────────┐
  │   Frontend   │          │   Backend    │
  │   (Docker)   │          │   (Docker)   │
  │              │          │              │
  │   Nginx +    │          │  Node.js +   │
  │   Static     │          │  Express     │
  └──────────────┘          └──────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────────┐
            │    Redis     │ │ Supabase │ │  Gemini API  │
            │   (Docker)   │ │ (Cloud)  │ │   (Cloud)    │
            │              │ │          │ │              │
            │  Bull Queue  │ │ DB+Auth+ │ │ Image Gen    │
            │              │ │ Storage  │ │              │
            └──────────────┘ └──────────┘ └──────────────┘
```

### Docker Services

**docker-compose.production.yml:**

1. **api** - Node.js backend
2. **worker** - Bull worker for background jobs
3. **redis** - Redis for job queue
4. **nginx** - Reverse proxy + frontend static files

### CI/CD Pipeline

**GitHub Actions** (.github/workflows/):

1. **tests.yml** - Run on PR
   - Lint code
   - Run backend tests (Jest)
   - Run frontend tests (Vitest)
   - Check coverage (≥70%)

2. **deploy.yml** - Run on push to `main`
   - Build Docker images
   - SSH to VPS
   - Pull latest code
   - Run docker-compose up
   - Health check
   - Rollback on failure

### Monitoring & Maintenance

**Health Checks** (`scripts/health-check.sh`):
- API health endpoint
- Redis connectivity
- Disk space
- Memory usage
- SSL certificate expiry

**Automated Backups** (`scripts/backup.sh`):
- Environment files
- SSL certificates
- Redis data
- Nginx configs
- 30-day retention

**Logging:**
- Production: Winston (file-based, NO console)
- Development: Winston (console + file)
- Zero logs in production browser console

---

## Related Documentation

- **[Database Schema](./database_schema.md)** - Complete database structure
- **[../sop/add_migration.md](../sop/add_migration.md)** - How to add database migrations
- **[../sop/add_route.md](../sop/add_route.md)** - How to add new API routes
- **[../sop/add_component.md](../sop/add_component.md)** - How to add React components
- **[../../CLAUDE.md](../../CLAUDE.md)** - Claude Code development guide
- **[../../README.md](../../README.md)** - Project README

---

**Next Steps:**
- Review [database_schema.md](./database_schema.md) for complete table structures
- Check SOPs for common development tasks
- Read CLAUDE.md for development workflow guidelines
