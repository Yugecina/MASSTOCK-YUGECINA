# MasStock - TODO List

**Last Updated:** 2025-12-19

## ✅ Completed (Today)

### Deployment Fixes
- [x] Fixed TypeScript compilation in production Docker (added build step)
- [x] Re-enabled auto-deploy on push to main
- [x] Added database migration step to CI/CD workflow
- [x] Created monitoring setup script (deploy/setup-monitoring.sh)
- [x] Integrated monitoring into CI/CD workflow

### Contact Form
- [x] Created contact_submissions table migration
- [x] Added RLS policies (public INSERT, admin-only read/update/delete)
- [x] Added performance indexes (created_at, status, email, topic)
- [x] Topic enum constraint at database level

### CORS Fix
- [x] Backend CORS configuration with explicit OPTIONS handling
- [x] Nginx CORS preflight handling (VPS level)
- [x] Comprehensive deployment architecture documentation

---

## 🔴 High Priority (Next PR)

### Testing
- [ ] Add tests for contactController.ts
  - [ ] Valid submission test
  - [ ] Invalid email test
  - [ ] Rate limiting test (5 req/15min)
  - [ ] Zod validation tests
- [ ] Add tests for emailService.ts
  - [ ] Mock Resend API
  - [ ] Test HTML escaping (XSS prevention)
  - [ ] Test duplicate contact handling
  - [ ] Test graceful degradation when API key missing
- [ ] Add tests for contactRoutes.ts
  - [ ] Integration test for full endpoint
  - [ ] CORS test
  - [ ] Rate limiting integration test
- [ ] Fix TypeScript compilation errors in test files
  - [ ] Add "jest" to tsconfig.json types
  - [ ] Resolve @types/jest issues

### Security
- [ ] Add IP anonymization for GDPR compliance
  - [ ] Anonymize IPv4 (xxx.xxx.xxx.0)
  - [ ] Anonymize IPv6 (first 4 groups only)
  - [ ] Document in privacy policy
- [ ] Add privacy notice on landing page contact form
  - [ ] Mention IP collection for spam prevention
  - [ ] Link to privacy policy

---

## 🟡 Medium Priority (Sprint 2)

### Monitoring Improvements
- [ ] Implement alert system in monitoring.sh
  - [ ] Email notifications on service failures
  - [ ] Slack webhook integration (optional)
  - [ ] Discord webhook integration (optional)
- [ ] Add log rotation for monitoring logs
  - [ ] Create /etc/logrotate.d/masstock config
  - [ ] Daily rotation, keep 7 days
  - [ ] Compress old logs
- [ ] Add monitoring dashboard (optional)
  - [ ] Grafana setup
  - [ ] Prometheus metrics export
  - [ ] Container resource usage graphs

### Email Service Improvements
- [ ] Add retry logic with exponential backoff
  - [ ] 3 retries with 1s, 2s, 4s delays
  - [ ] Log failed attempts
  - [ ] Queue failed emails for manual retry
- [ ] Externalize email templates
  - [ ] Move HTML template to separate file
  - [ ] Support multiple languages (i18n)
  - [ ] Add email preview in dev mode
- [ ] Add rate limiting for Resend API calls
  - [ ] Track API calls per minute
  - [ ] Queue emails if rate limit approaching
  - [ ] Log rate limit warnings

### Database
- [ ] Add rollback SQL to migration 016
  - [ ] DROP trigger, function, table
  - [ ] Document rollback procedure
- [ ] Add data retention policy for contact submissions
  - [ ] Archive old submissions after 6 months
  - [ ] Delete archived after 2 years (GDPR)
  - [ ] Add automated cleanup job

---

## 🟢 Low Priority (Backlog)

### CI/CD Enhancements
- [ ] Add smoke tests in deploy.yml
  - [ ] Test critical user flows
  - [ ] Test API endpoints return expected structure
  - [ ] Test frontend renders without errors
- [ ] Improve deployment health checks
  - [ ] Increase wait time if needed (currently 30s)
  - [ ] Add retry logic for health checks
  - [ ] Test database connectivity
- [ ] Add deployment notifications
  - [ ] Slack notification on success/failure
  - [ ] Email notification to team
  - [ ] GitHub deployment status badges

### Code Quality
- [ ] Increase test coverage to 80%+ (currently 18.54% after adding untested files)
- [ ] Add E2E tests with Playwright
  - [ ] Test login flow
  - [ ] Test workflow creation
  - [ ] Test contact form submission
- [ ] Add API documentation with Swagger/OpenAPI
  - [ ] Document all endpoints
  - [ ] Add request/response examples
  - [ ] Generate interactive docs

### Performance
- [ ] Add caching layer
  - [ ] Cache frequently accessed workflows
  - [ ] Cache user profiles
  - [ ] Redis cache with TTL
- [ ] Optimize Docker images
  - [ ] Multi-stage builds (already done for API)
  - [ ] Reduce image sizes
  - [ ] Layer caching optimization
- [ ] Add CDN for static assets
  - [ ] Frontend bundle
  - [ ] Landing page assets
  - [ ] Generated images

---

## 📋 Code Review Recommendations

### From agent-code-reviewer (2025-12-19)

**Must Fix:**
- Tests for contact form functionality (TDD requirement)
- TypeScript compilation errors in test files

**Should Fix:**
- IP anonymization for GDPR compliance
- Rollback SQL in migration file
- Log rotation for monitoring logs
- Alert notifications in monitoring.sh

**Nice to Have:**
- Email retry logic
- Externalized email templates
- Smoke tests in CI/CD
- Monitoring dashboard (Grafana)

---

## 🎯 Current Sprint Goals

**Sprint:** 2025-12-19 to 2025-12-26

### Week 1 (This Week)
1. ✅ Fix deployment issues (TypeScript compilation)
2. ✅ Re-enable auto-deploy
3. ✅ Setup monitoring
4. ✅ Create contact_submissions table
5. ⏳ Add tests for contact form (IN PROGRESS)

### Week 2 (Next Week)
1. IP anonymization
2. Email retry logic
3. Log rotation
4. Alert system
5. Increase test coverage to 70%+

---

## 📝 Notes

### Deployment Status
- **Last Deploy:** 2025-12-19 (auto-deployed via GitHub Actions)
- **Status:** ✅ All containers healthy
- **CORS:** ✅ Fixed and verified
- **Monitoring:** ✅ Cron job active (every 5 minutes)

### Known Issues
- Test coverage: 18.54% (below 70% threshold)
- TypeScript compilation warnings in tests (non-blocking)
- Monitoring alerts not implemented (logs only)
- IP addresses not anonymized (GDPR concern)

### Recent Changes
- Migration 016: contact_submissions table
- Auto-deploy re-enabled with migration step
- Monitoring setup script created and integrated
- TypeScript build step added to Docker production image

---

## 🔗 Related Documentation

- [Code Review Report](DEPLOYMENT_FIX.md) - Detailed review from agent-code-reviewer
- [Deployment Architecture](.agent/system/deployment_architecture.md) - Full infrastructure docs
- [Security Audit](.agent/SOP/security_audit_2025_11.md) - Security checklist
- [Testing Guide](backend/CLAUDE.md#testing-guidelines) - TDD workflow

---

**Priority Legend:**
- 🔴 High - Blocking or security issue
- 🟡 Medium - Important but not urgent
- 🟢 Low - Nice to have, backlog

**Status:**
- ✅ Done
- ⏳ In Progress
- 🔜 Next Up
- 📋 Planned
