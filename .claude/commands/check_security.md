Run comprehensive security audit checklist for MasStock:

## 1. Authentication Security
- [ ] Check all auth endpoints have rate limiting (5 req/15min)
- [ ] Verify JWT tokens are in httpOnly cookies (not localStorage)
- [ ] Confirm refresh token rotation on use
- [ ] Check token expiry times (access: 15min, refresh: 7d)

## 2. Database Security (RLS)
- [ ] List all tables: Use mcp__supabase__list_tables
- [ ] Verify RLS is ENABLED on all tables
- [ ] Check RLS policies exist for: SELECT, INSERT, UPDATE, DELETE
- [ ] Run: mcp__supabase__get_advisors with type "security"

## 3. Input Validation
- [ ] Scan all controllers for Zod validation: `rg -n "\.parse\(" backend/src/controllers`
- [ ] Check no direct `req.body` usage without validation
- [ ] Verify all API inputs validated

## 4. Secrets Management
- [ ] Check no secrets in git: `git log -p | grep -E '(API_KEY|SECRET|PASSWORD)' | head -20`
- [ ] Verify .env files in .gitignore
- [ ] Check no hardcoded API keys: `rg -n "AIza|sk-" backend/src frontend/src`

## 5. CORS & Headers
- [ ] Check CORS_ORIGIN not set to '*' in production
- [ ] Verify secure cookies in production (secure: true)
- [ ] Check helmet middleware is active

## 6. Rate Limiting
- [ ] Verify all public endpoints have rate limiting
- [ ] Check stricter limits on auth endpoints
- [ ] Test rate limit enforcement

## 7. Code Quality
- [ ] No console.log in backend production code: `rg -n "console\\.log" backend/src --glob '!__tests__'`
- [ ] No eval() or Function() usage: `rg -n "eval\\(|Function\\(" backend/src frontend/src`
- [ ] No SQL injection vulnerabilities (using Supabase client = safe)

## Report Format:
- ✅ Passed items
- ❌ Failed items with file:line references
- ⚠️ Warnings with recommendations
- Summary score (X/7 categories passed)

Refer to: [.agent/SOP/security_audit_2025_11.md](.agent/SOP/security_audit_2025_11.md)
