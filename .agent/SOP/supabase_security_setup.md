# Supabase Security Configuration

**Status:** Recommended
**Priority:** High
**Reference:** Security Audit 2025-12-08

---

## 1. Enable Leaked Password Protection

### Overview
Supabase Auth can check user passwords against the HaveIBeenPwned.org database to prevent the use of compromised credentials. This is currently **disabled** but should be enabled for production security.

### Steps to Enable

1. **Access Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard
   - Select your project: MasStock

2. **Navigate to Authentication Settings:**
   - Click "Authentication" in left sidebar
   - Click "Policies" tab
   - Or go directly to: `Project Settings → Authentication → Policies`

3. **Enable Password Protection:**
   - Find "Leaked Password Protection" section
   - Toggle "Enable leaked password protection" to **ON**
   - This will check passwords against HaveIBeenPwned API on signup and password change

4. **Configure Password Strength (Optional but Recommended):**
   - Minimum password length: **8 characters** (already enforced in code)
   - Require uppercase: Recommended
   - Require lowercase: Recommended
   - Require numbers: Recommended
   - Require special characters: Optional

### Impact

**Before:**
- Users can set passwords like "password123" even if compromised

**After:**
- Supabase rejects any password found in HaveIBeenPwned database
- User sees error: "Password has been found in a data breach"
- Forces users to choose unique, non-compromised passwords

### Cost

- **Free:** HaveIBeenPwned API is free to use
- **No performance impact:** Check happens on signup/password change only

### Documentation

- Supabase Docs: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- HaveIBeenPwned: https://haveibeenpwned.com/Passwords

---

## 2. Verify Row Level Security (RLS) Policies

### Current Status
✅ **All 13 tables have RLS enabled** (verified in security audit)

### Regular RLS Audit Checklist

Run this query in Supabase SQL Editor to verify RLS status:

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Result:** All tables should have `rls_enabled = true`

### Per-Table RLS Policies

Each table should have policies for:
- ✅ SELECT (read access)
- ✅ INSERT (create access)
- ✅ UPDATE (modify access)
- ✅ DELETE (remove access)

**Example policy check:**
```sql
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'workflows'
ORDER BY tablename, policyname;
```

---

## 3. Production Environment Variables

### Backend (.env.production)

Ensure these are set correctly in production:

```bash
# Must be 'production' (not 'development')
NODE_ENV=production

# CORS - Must match frontend domain exactly
CORS_ORIGIN=https://yourdomain.com  # NOT http:// or *

# Cookies - Must be secure in production
# (Already configured in code: secure: NODE_ENV === 'production')

# JWT Secret - Use strong random value
JWT_SECRET=<64-character-random-hex>  # Generate: openssl rand -hex 32

# Encryption Key - For encrypting API keys in database
ENCRYPTION_KEY=<64-character-random-hex>
```

### Frontend (.env.production)

```bash
# Production API URL
VITE_API_URL=https://api.yourdomain.com/api/v1

# Environment flag
VITE_ENV=production

# Optional: Default Gemini API key (if you want to provide one)
VITE_DEFAULT_GEMINI_API_KEY=<your-key>  # Or leave empty
```

---

## 4. API Key Security

### ❌ Previous Issue (FIXED)
- **Problem:** Hardcoded Gemini API key in frontend source code
- **Location:** `frontend/src/components/workflows/NanoBananaForm.tsx`
- **Fix:** Replaced with `import.meta.env.VITE_DEFAULT_GEMINI_API_KEY`
- **Status:** ✅ Fixed in commit [pending]

### Best Practices

1. **Never commit API keys to git:**
   - Add to `.gitignore`: `*.env`, `.env.local`, `.env.production`
   - Use environment variables only

2. **Revoke exposed keys immediately:**
   - If a key is committed to git, assume it's compromised
   - Revoke at: https://console.cloud.google.com/apis/credentials
   - Generate new key and update `.env` files

3. **Use different keys for dev/prod:**
   - Development: Use test key with rate limits
   - Production: Use production key with proper quotas

4. **Rotate keys regularly:**
   - Schedule quarterly key rotation
   - Update all environments simultaneously
   - Test after rotation

---

## 5. Security Headers Verification

### Current Configuration (backend/src/server.ts)

✅ Helmet middleware active with:
- Content Security Policy (CSP)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS) in production

### Verify in Production

1. **Check headers with curl:**
```bash
curl -I https://api.yourdomain.com/health
```

2. **Expected headers:**
```
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
```

3. **Test with Security Headers:**
   - Tool: https://securityheaders.com
   - URL: https://yourdomain.com
   - Target Grade: A or A+

---

## 6. Rate Limiting Configuration

### Current Limits (Production Ready)

| Endpoint Type | Window | Max Requests | Status |
|---------------|--------|--------------|--------|
| Auth (/login, /refresh) | 15 min | 10 | ✅ |
| General API | 1 min | 100 | ✅ |
| Executions | 1 min | 10 per client | ✅ |
| Admin | 1 min | 200 | ✅ |

### Monitor Rate Limits

1. **Check logs for violations:**
```bash
grep "Rate limit exceeded" backend/logs/combined.log | tail -20
```

2. **Adjust if needed:**
   - Edit `backend/src/middleware/rateLimit.ts`
   - Or use environment variables:
     ```bash
     RATE_LIMIT_WINDOW_MS=60000
     RATE_LIMIT_MAX_REQUESTS=100
     ```

---

## 7. Regular Security Audit Schedule

### Monthly Checks

- [ ] Run `/check_security` command
- [ ] Review Supabase Security Advisors
- [ ] Check for npm vulnerabilities: `npm audit`
- [ ] Review rate limit logs

### Quarterly Checks

- [ ] Rotate JWT_SECRET and ENCRYPTION_KEY
- [ ] Review and update RLS policies
- [ ] Test authentication flow end-to-end
- [ ] Review user permissions and roles
- [ ] Check for outdated dependencies: `npm outdated`

### After Major Changes

- [ ] Run full security audit
- [ ] Update RLS policies if schema changed
- [ ] Test rate limiting with realistic load
- [ ] Verify CORS configuration

---

## 8. Security Incident Response

### If API Key is Exposed

1. **Immediate:**
   - Revoke key at provider's console
   - Generate new key
   - Update all environments

2. **Within 1 hour:**
   - Review access logs for unauthorized usage
   - Check billing for unexpected charges
   - Document incident

3. **Within 24 hours:**
   - Audit all other secrets
   - Review git history for other exposures
   - Update security procedures

### If Database Breach Suspected

1. **Immediate:**
   - Enable RLS on all tables (if not already)
   - Review recent database queries in Supabase logs
   - Rotate SUPABASE_SERVICE_ROLE_KEY

2. **Within 1 hour:**
   - Audit user accounts for suspicious activity
   - Review audit_logs table
   - Force logout all users (rotate JWT_SECRET)

3. **Within 24 hours:**
   - Notify affected users if PII exposed
   - Document breach and response
   - File incident report

---

## Resources

- Supabase Security: https://supabase.com/docs/guides/platform/security
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Security Audit SOP: [.agent/SOP/security_audit_2025_11.md](security_audit_2025_11.md)
- MasStock Security Audit: Run `/check_security` command

---

**Last Updated:** 2025-12-08
**Next Review:** 2026-01-08
**Version:** 1.0
