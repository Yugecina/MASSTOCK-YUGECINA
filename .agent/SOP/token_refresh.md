# SOP: Automatic Token Refresh System

**Last Updated:** 2025-11-28
**Version:** 2.2.1
**Status:** Production-Ready

---

## Overview

MasStock implements an automatic token refresh system to maintain user sessions for up to **7 days** without requiring manual re-login, while keeping access tokens short-lived (15 minutes) for security.

---

## How It Works

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ LOGIN                                                             │
│ - User logs in with email + password                             │
│ - Backend issues two httpOnly cookies:                           │
│   • access_token (15 minutes)                                    │
│   • refresh_token (7 days)                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ NORMAL USAGE (0-15 minutes)                                      │
│ - User makes API calls                                           │
│ - access_token is valid                                          │
│ - Requests succeed normally                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ TOKEN EXPIRY (after 15 minutes)                                  │
│ - User makes API call                                            │
│ - access_token expired → Backend returns 401                     │
│ - Frontend interceptor catches 401                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ AUTOMATIC REFRESH                                                │
│ - Interceptor calls POST /api/v1/auth/refresh                    │
│ - Sends refresh_token cookie automatically                       │
│ - Backend validates refresh token with Supabase                  │
│ - Backend issues NEW cookies:                                    │
│   • access_token (fresh 15 minutes)                              │
│   • refresh_token (fresh 7 days)                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ RETRY ORIGINAL REQUEST                                           │
│ - Interceptor automatically retries the failed request           │
│ - Request succeeds with new access_token                         │
│ - User experiences NO interruption                               │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
    Cycle repeats every 15 minutes for up to 7 days
```

### Session Duration

| Token Type | Duration | Purpose |
|------------|----------|---------|
| **Access Token** | 15 minutes | Short-lived for security - used for API authentication |
| **Refresh Token** | 7 days | Long-lived - used to obtain new access tokens |
| **Total Session** | Up to 7 days | User stays logged in as long as they use the app within 7 days |

---

## Implementation Details

### Backend Components

#### 1. Auth Routes (`backend/src/routes/authRoutes.js`)

```javascript
const { login, getMe, logout, refreshToken } = require('../controllers/authController');

router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshToken); // ⭐ No authentication required (uses refresh_token cookie)
```

#### 2. Refresh Controller (`backend/src/controllers/authController.js:166-243`)

**Key Features:**
- Extracts `refresh_token` from httpOnly cookie
- Calls Supabase `refreshSession()` API
- Issues new access_token (15min) and refresh_token (7d) cookies
- Clears cookies if refresh fails
- Comprehensive error logging

**Error Codes:**
- `NO_REFRESH_TOKEN` - Missing refresh token cookie
- `INVALID_REFRESH_TOKEN` - Token expired or invalid

#### 3. Frontend Interceptor (`frontend/src/services/api.js:33-103`)

**Key Features:**
- **Automatic detection:** Catches 401 errors on any API call
- **Request queuing:** Multiple failed requests queue while refreshing
- **Single refresh:** Only one refresh request at a time (prevents race conditions)
- **Retry logic:** Automatically retries original request after refresh
- **Smart exclusions:** Doesn't refresh on `/login` or `/refresh` endpoints
- **Graceful degradation:** Only logs out if refresh also fails

**Console Logs (for debugging):**
```javascript
🔄 Access token expired - attempting refresh...
✅ Token refreshed successfully - retrying request
❌ Token refresh failed: { error, message, code }
🚪 Logging out due to refresh failure
```

---

## Testing the System

### Manual Testing

**Test 1: Verify refresh works**
```bash
cd backend
node scripts/test-token-refresh.js
```

**Expected output:**
```
✅ Login successful
✅ Token refresh successful
✅ Protected route access successful
✅ ALL TESTS PASSED
```

**Test 2: Browser testing**
1. Login to the app
2. Open DevTools → Console
3. Wait 16 minutes (or mock by clearing access_token cookie)
4. Make an API call (navigate to any page)
5. Watch console for refresh logs
6. Verify no logout occurred

### Debugging Tips

**Check cookies:**
```javascript
// In browser console
document.cookie
```

**Check token expiry:**
```javascript
// Backend logs
logger.info('Token refreshed successfully', {
  userId: data.user?.id,
  expiresAt: data.session.expires_at
});
```

**Monitor interceptor:**
```javascript
// Frontend console logs
console.log('🔄 Access token expired - attempting refresh...')
```

---

## Common Issues & Solutions

### Issue 1: User logged out after 15 minutes

**Symptom:** User forced to login again after 15 minutes

**Causes:**
1. Refresh endpoint not registered
2. Frontend interceptor not implemented
3. Cookies not being sent (`withCredentials: false`)

**Solution:**
```javascript
// Check axios config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // ← MUST be true
})
```

### Issue 2: Infinite refresh loop

**Symptom:** Console shows continuous refresh attempts

**Causes:**
1. Refresh endpoint also returns 401 (missing exclusion)
2. `isRefreshing` flag not reset

**Solution:**
```javascript
// Ensure refresh endpoint is excluded
if (error.response?.status === 401 &&
    !originalRequest._retry &&
    !originalRequest.url?.includes('/v1/auth/refresh')) { // ← Check this
```

### Issue 3: Multiple refresh requests

**Symptom:** Multiple `/refresh` calls in network tab

**Cause:** Request queuing not implemented

**Solution:** Use `isRefreshing` flag and `failedQueue` array (already implemented)

### Issue 4: Refresh fails with "Invalid refresh token"

**Symptom:** User logged out after 7 days

**Cause:** Refresh token expired (expected behavior)

**Solution:** This is intentional - user must login again after 7 days of inactivity

---

## Security Considerations

### Why 15-minute access tokens?

**Pros:**
- Limits damage if token stolen (only valid 15 minutes)
- Reduces attack window for XSS attacks
- Industry best practice for security

**Cons:**
- More frequent refresh calls (mitigated by automatic refresh)

### Why httpOnly cookies?

**Pros:**
- Not accessible via JavaScript → XSS protection
- Automatically sent with requests
- Secure flag in production (HTTPS only)

**Cons:**
- Cannot be read in DevTools (by design)

### Refresh Token Rotation

Each refresh issues a **NEW** refresh token (not the same one). This:
- Invalidates old refresh tokens
- Prevents token reuse attacks
- Limits compromise window

---

## Configuration

### Environment Variables

**Backend (.env):**
```bash
JWT_EXPIRES_IN=7d              # Not used for cookies (historical)
REFRESH_TOKEN_EXPIRES_IN=30d   # Not used for cookies (historical)
```

**Actual cookie durations** (hardcoded in `authController.js`):
```javascript
// Access token cookie
maxAge: 15 * 60 * 1000 // 15 minutes

// Refresh token cookie
maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
```

### Adjusting Token Durations

**To change access token duration:**
```javascript
// backend/src/controllers/authController.js (line 207)
maxAge: 30 * 60 * 1000 // 30 minutes (example)
```

**To change refresh token duration:**
```javascript
// backend/src/controllers/authController.js (line 213)
maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days (example)
```

**Recommendations:**
- Access token: **5-30 minutes** (balance between security and UX)
- Refresh token: **7-30 days** (balance between convenience and security)

---

## Monitoring & Metrics

### Logs to Monitor

**Backend (Winston):**
```javascript
// Success
logger.info('Token refreshed successfully', { userId, expiresAt })

// Failure
logger.error('Token refresh failed', { error, hasSession })
```

**Frontend (Console):**
```javascript
// Only in development
console.log('🔄 Access token expired - attempting refresh...')
console.log('✅ Token refreshed successfully')
console.error('❌ Token refresh failed:', { error, message, code })
```

### Metrics to Track

- **Refresh rate:** How often users trigger refresh (should spike every 15 minutes)
- **Refresh failures:** Should be low (<1%)
- **Session duration:** Average time between login and logout
- **Token expiry logouts:** Users logged out due to 7-day expiry

---

## Related Documentation

- **[Project Architecture](../system/project_architecture.md)** - System overview
- **[Database Schema](../system/database_schema.md)** - Users table structure
- **[Add Route SOP](./add_route.md)** - How to add API endpoints
- **[CLAUDE.md](../../CLAUDE.md)** - Development workflow

---

## Troubleshooting Checklist

**User reports being logged out:**

- [ ] Check if it's after exactly 15 minutes → Access token expired, refresh should work
- [ ] Check if it's after 7 days → Expected behavior, user must re-login
- [ ] Check browser console for refresh logs
- [ ] Check backend logs for refresh failures
- [ ] Verify `withCredentials: true` in API calls
- [ ] Test refresh endpoint manually: `POST /api/v1/auth/refresh`
- [ ] Check if cookies are being set (Network tab → Response → Set-Cookie)
- [ ] Verify Supabase Auth is working (check Supabase dashboard)

**Refresh endpoint returns 401:**

- [ ] Check if `refresh_token` cookie is being sent
- [ ] Check cookie expiry (might be expired)
- [ ] Check Supabase Auth logs
- [ ] Verify refresh token is valid in Supabase

**Interceptor not working:**

- [ ] Check if error is 401
- [ ] Check if URL is excluded (login, refresh, /me)
- [ ] Check if `_retry` flag is set correctly
- [ ] Verify `isRefreshing` flag logic
- [ ] Check if original request is being retried

---

**Last Review:** 2025-11-28
**Status:** ✅ Fully Implemented & Tested
