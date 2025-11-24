# MasStock Documentation

**Last Updated:** 2025-11-24

Welcome to the MasStock documentation hub. This folder contains all technical documentation for developers working on the MasStock platform.

---

## 📚 Documentation Structure

```
.agent/
├── README.md                    # This file - documentation index
├── system/                      # System & architecture documentation
│   ├── project_architecture.md  # Complete system architecture
│   ├── database_schema.md       # Database schema & tables
│   └── async_workers.md         # ⭐ Async workers & concurrency (v2.0)
├── SOP/                         # Standard Operating Procedures
│   ├── add_migration.md         # How to add database migrations
│   ├── add_route.md             # How to add API endpoints
│   ├── add_component.md         # How to add React components
│   └── deployment.md            # Production deployment
└── tasks/                       # Feature PRDs & implementation plans
    └── image_factory_workflow.md  # Nano Banana workflow guide
```

---

## 🎯 Quick Start

### New to the Project?

**Start here:**

1. **[System Architecture](./system/project_architecture.md)** - Understand the big picture
   - Project overview and goals
   - Technology stack
   - Component relationships
   - Data flow diagrams

2. **[Database Schema](./system/database_schema.md)** - Learn the data model
   - All database tables
   - Entity relationships
   - RLS policies
   - Common queries

3. **[CLAUDE.md](../CLAUDE.md)** - Development workflow
   - Coding standards
   - TDD approach
   - Security essentials
   - Git conventions

### Ready to Code?

**Pick your task:**

- **Adding a database table?** → [SOP: Add Migration](./SOP/add_migration.md)
- **Creating an API endpoint?** → [SOP: Add Route](./SOP/add_route.md)
- **Building a React component?** → [SOP: Add Component](./SOP/add_component.md)

---

## 📖 System Documentation

### [Project Architecture](./system/project_architecture.md)

**Complete technical overview of MasStock:**

- **What it covers:**
  - System architecture (3-tier: Frontend, API, Data)
  - Technology stack (React 19, Node.js, Supabase, Redis, Gemini API)
  - Project structure (folder organization)
  - Core components (controllers, services, workers)
  - Integration points (Supabase, Redis, Gemini)
  - Authentication & security
  - Data flow (workflow execution lifecycle)
  - Deployment architecture (Docker, CI/CD, SSL)

- **When to read:**
  - First time working on the project
  - Before designing a new feature
  - When debugging cross-component issues
  - Before technical interviews/presentations

### [Database Schema](./system/database_schema.md)

**Complete database structure:**

- **What it covers:**
  - Entity Relationship Diagram (ERD)
  - All 7 tables with full schemas
  - Row Level Security (RLS) policies
  - Indexes and performance optimization
  - Storage buckets
  - Common SQL queries
  - Migration best practices

- **When to read:**
  - Before adding a new table
  - When writing complex queries
  - Debugging data access issues
  - Understanding multi-tenant isolation

### [Async Workers & Concurrency](./system/async_workers.md) ⭐ NEW (v2.0)

**Complete guide to parallel workflow processing:**

- **What it covers:**
  - Two-level concurrency architecture (execution + prompt)
  - Global API rate limiter (sliding window algorithm)
  - Configuration and tuning guidelines
  - Performance benchmarks (15x faster than v1.x)
  - Monitoring and debugging techniques
  - Troubleshooting common issues
  - Environment variable reference

- **When to read:**
  - Understanding worker performance
  - Tuning concurrency settings
  - Debugging rate limit issues
  - Optimizing workflow throughput
  - Before scaling to production

---

## 🛠️ Standard Operating Procedures (SOPs)

### [SOP: Add Database Migration](./SOP/add_migration.md)

**How to create and apply database migrations:**

- **What you'll learn:**
  - Migration file naming convention
  - SQL migration template
  - How to enable RLS
  - Creating indexes and foreign keys
  - Writing RLS policies
  - Applying migrations locally
  - Rollback strategies

- **When to use:**
  - Creating a new table
  - Adding/modifying columns
  - Adding indexes
  - Updating RLS policies

### [SOP: Add API Route](./SOP/add_route.md)

**How to add new backend endpoints:**

- **What you'll learn:**
  - TDD approach (write test first)
  - Controller creation
  - Input validation with Zod
  - Route registration
  - Middleware (auth, rate limiting)
  - Security checklist
  - Testing checklist

- **When to use:**
  - Creating a new API endpoint
  - Adding CRUD operations
  - Implementing new features

### [SOP: Add React Component](./SOP/add_component.md)

**How to create frontend components:**

- **What you'll learn:**
  - TDD approach (write test first)
  - Component structure
  - **Pure CSS styling** (NO Tailwind)
  - State management with Zustand
  - API integration
  - Error logging (critical for debugging)
  - Testing patterns

- **When to use:**
  - Creating new UI components
  - Adding new pages
  - Building feature components

---

## 📋 Task Documentation

The `tasks/` folder contains feature-specific documentation:

- **PRDs (Product Requirements Documents)**: Feature specifications
- **Implementation Plans**: Technical breakdown of features
- **Architecture Decisions**: Design choices and rationale

**Available Task Docs:**

### [Image Factory Workflow](./tasks/image_factory_workflow.md) ⭐

**Complete guide to the Nano Banana workflow:**

- **What it covers:**
  - Architecture and component flow
  - Technical specifications (models, formats, limits)
  - Configuration (workflow config, runtime params)
  - API integration (Gemini API, MasStock endpoints)
  - Error handling and retry logic
  - Performance optimization
  - Testing and verification procedures
  - Troubleshooting common issues
  - Recent updates (v1.2: timeout fixes, scope fixes)

- **When to read:**
  - Working on workflow execution features
  - Debugging image generation issues
  - Understanding timeout/retry behavior
  - Adding new AI integrations
  - Performance optimization

**Other tasks:**
- User authentication system (planned)
- Admin dashboard analytics (planned)

---

## 🗺️ Documentation Navigation Guide

### I want to...

**Understand the system:**
- Overall architecture → [project_architecture.md](./system/project_architecture.md)
- Database structure → [database_schema.md](./system/database_schema.md)
- Worker performance → [async_workers.md](./system/async_workers.md) ⭐ NEW
- Development workflow → [../CLAUDE.md](../CLAUDE.md)

**Add new functionality:**
- Database table → [add_migration.md](./SOP/add_migration.md)
- API endpoint → [add_route.md](./SOP/add_route.md)
- UI component → [add_component.md](./SOP/add_component.md)

**Debug issues:**
- API flow → [project_architecture.md](./system/project_architecture.md) (Data Flow section)
- Database queries → [database_schema.md](./system/database_schema.md) (Common Queries section)
- Worker performance → [async_workers.md](./system/async_workers.md) (Troubleshooting section)
- Rate limiting → [async_workers.md](./system/async_workers.md) (Rate Limiting section)
- Authentication → [project_architecture.md](./system/project_architecture.md) (Authentication Flow section)

**Learn the stack:**
- Frontend (React) → [project_architecture.md](./system/project_architecture.md) (Frontend Components section)
- Backend (Node.js) → [project_architecture.md](./system/project_architecture.md) (Backend Components section)
- Database (Supabase) → [database_schema.md](./system/database_schema.md)

---

## 🎓 Learning Path

### Week 1: Foundations

**Day 1-2:** System Understanding
- Read [project_architecture.md](./system/project_architecture.md)
- Review [database_schema.md](./system/database_schema.md)
- Read [CLAUDE.md](../CLAUDE.md)

**Day 3-4:** Code Exploration
- Explore `backend/src/` structure
- Explore `frontend/src/` structure
- Run the app locally (see [README.md](../README.md))

**Day 5:** First Contribution
- Follow [add_component.md](./SOP/add_component.md) to create a simple component
- Write tests (TDD approach)
- Submit PR

### Week 2-4: Feature Development

- Pick a feature from `tasks/`
- Follow relevant SOPs
- Implement with TDD
- Document learnings

---

## 📝 Documentation Maintenance

### When to Update Docs

**Update immediately after:**
- Adding a new database table → Update [database_schema.md](./system/database_schema.md)
- Changing architecture → Update [project_architecture.md](./system/project_architecture.md)
- Creating new workflow → Document in `tasks/`
- Adding new integration → Update [project_architecture.md](./system/project_architecture.md)

### How to Update

1. Read existing documentation
2. Make changes inline
3. Update "Last Updated" date at top
4. Update this README if structure changed
5. Commit with message: `docs: update [filename] - [reason]`

---

## 🔗 External Resources

### Official Docs

- **React 19:** https://react.dev
- **Vite:** https://vite.dev
- **Supabase:** https://supabase.com/docs
- **Node.js:** https://nodejs.org/docs
- **Express:** https://expressjs.com
- **Zustand:** https://zustand-demo.pmnd.rs
- **Zod:** https://zod.dev
- **Bull:** https://github.com/OptimalBits/bull

### MasStock Project

- **Main README:** [../README.md](../README.md)
- **Development Guide:** [../CLAUDE.md](../CLAUDE.md)
- **Backend README:** [../backend/README.md](../backend/README.md)
- **Frontend README:** [../frontend/README.md](../frontend/README.md)

---

## 🆘 Getting Help

### Documentation Issues

**Can't find what you need?**
1. Check this index first
2. Search within docs (Cmd+F)
3. Check related docs (see "Related Documentation" sections)
4. Ask team lead

**Found outdated info?**
1. Update the doc yourself
2. Submit PR with fix
3. Notify team

### Technical Issues

**Development problems?**
1. Check [CLAUDE.md](../CLAUDE.md) troubleshooting section
2. Review relevant SOP
3. Check test files for examples
4. Ask in team chat

---

## 📊 Documentation Health

**Last Full Review:** 2025-11-24
**Coverage:** ✅ Complete

### Coverage Checklist

- [x] System architecture documented
- [x] Database schema documented
- [x] **Async workers & concurrency (v2.0)** ⭐ NEW
- [x] SOPs for common tasks (migrations, routes, components, deployment)
- [x] Development workflow (CLAUDE.md)
- [x] Quick start guide (README.md)
- [x] Task-specific PRDs (Image Factory v1.2)
- [ ] API documentation (Swagger - auto-generated)
- [x] Troubleshooting guides (per workflow, workers)

---

## 🎯 Documentation Philosophy

**Our approach:**

1. **Comprehensive**: Cover all aspects of the system
2. **Practical**: Include examples and code snippets
3. **Searchable**: Clear structure and table of contents
4. **Up-to-date**: Update immediately when code changes
5. **Beginner-friendly**: Explain concepts, not just commands
6. **Production-focused**: Real-world patterns, not academic

**What we document:**
- ✅ Architecture and design decisions
- ✅ Standard procedures (how-to guides)
- ✅ Database schema and relationships
- ✅ API endpoints and contracts
- ✅ Common patterns and examples
- ✅ Troubleshooting guides

**What we don't document:**
- ❌ Auto-generated API docs (use Swagger)
- ❌ Code that explains itself (use comments instead)
- ❌ Temporary workarounds (fix the root cause)
- ❌ Personal notes (use TODO comments)

---

## 🚀 Next Steps

**Ready to start?**

1. **First time?** → Read [project_architecture.md](./system/project_architecture.md)
2. **Adding a feature?** → Pick the relevant SOP
3. **Debugging?** → Check architecture docs for data flow
4. **Deploying?** → See [../README.md](../README.md) production section

**Questions?** Check the "Getting Help" section above.

---

**Happy coding! 🎉**
