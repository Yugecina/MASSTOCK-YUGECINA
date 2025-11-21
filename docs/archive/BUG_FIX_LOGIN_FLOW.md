# Bug Fix: Login Flow - "Cannot read properties of undefined (reading 'access_token')"

## Issue Description
The login page was showing the error: "Cannot read properties of undefined (reading 'access_token')" when attempting to log in. The API request was succeeding but the response handling was broken.

## Root Cause
The frontend authentication store was trying to access the access token incorrectly. The backend returns the authentication response with this structure:

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "role": "..."
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": "..."
  }
}
```

The frontend code was trying to access `response.data.access_token` directly, but the token is nested inside the `session` object.

## Files Modified

### 1. `/frontend/src/store/authStore.js`
**Before:**
```javascript
localStorage.setItem('accessToken', response.data.access_token)  // ❌ undefined
localStorage.setItem('user', JSON.stringify(response.data.user))

set({
  user: response.data.user,
  isAuthenticated: true,
  accessToken: response.data.access_token,  // ❌ undefined
  loading: false,
  error: null,
})
```

**After:**
```javascript
const { user, session } = response.data

localStorage.setItem('accessToken', session.access_token)  // ✅ correct
localStorage.setItem('refreshToken', session.refresh_token)
localStorage.setItem('user', JSON.stringify(user))

set({
  user: user,
  isAuthenticated: true,
  accessToken: session.access_token,  // ✅ correct
  loading: false,
  error: null,
})
```

### 2. `/frontend/src/pages/Login.jsx`
**Before:**
```javascript
const result = await login(email, password)
const redirectPath = result.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard'  // ❌ would also fail
navigate(redirectPath)
```

**After:**
```javascript
await login(email, password)
// Note: The useEffect will handle redirection based on user role
// No need to manually navigate here as the auth state change will trigger it
```

### 3. `/backend/src/controllers/authController.js`
Added null check and better error handling:

```javascript
// Check if session exists
if (!data.session) {
  logger.error('No session returned from Supabase', { email });
  return res.status(500).json({
    message: 'Authentication failed - no session',
    status: 500
  });
}
```

And improved error logging:

```javascript
logger.error('Login error', {
  error: error.message,
  stack: error.stack,
  email
});

// In development, return more details
if (process.env.NODE_ENV === 'development') {
  return res.status(500).json({
    message: 'Internal server error',
    error: error.message,
    status: 500
  });
}
```

## Testing

### Manual Testing Steps
1. Navigate to `http://localhost:5173/login`
2. Enter credentials:
   - Email: `admin@masstock.com`
   - Password: `AdminPassword123!`
3. Click "Sign In"
4. Verify:
   - No "Cannot read properties of undefined" error
   - Access token is stored in localStorage
   - User is redirected to appropriate dashboard based on role

### Expected Behavior
- Login succeeds and stores session data correctly
- User is redirected to `/admin/dashboard` (for admin role) or `/dashboard` (for user role)
- No JavaScript errors in console
- Backend returns proper session object

## Additional Issue Discovered

During investigation, the backend logs revealed a separate Supabase issue:
```
"error":"infinite recursion detected in policy for relation \"users\""
```

This is a Row Level Security (RLS) policy configuration issue in Supabase that needs to be addressed separately. It occurs when RLS policies create circular dependencies.

### To Fix RLS Issue:
1. Go to Supabase Dashboard
2. Navigate to Authentication > Policies
3. Review the `users` table policies
4. Ensure policies don't reference themselves recursively
5. Common fix: Use `auth.uid()` instead of querying the users table within the policy

## Files Changed
- `/frontend/src/store/authStore.js` - Fixed token access path
- `/frontend/src/pages/Login.jsx` - Simplified navigation logic
- `/backend/src/controllers/authController.js` - Added null checks and better error handling

## Prevention
- Always verify API response structure before accessing nested properties
- Use destructuring to make data access patterns explicit
- Add null/undefined checks for optional data
- Include comprehensive error logging in development mode
- Document API response formats in code comments

