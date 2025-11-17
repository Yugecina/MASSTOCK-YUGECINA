# MasStock API - cURL & Postman Examples

## Base URL
```
http://localhost:3000/api/v1
```

---

## 1. CREATE FIRST ADMIN (Bootstrap)

### cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!",
    "name": "Admin MasStock"
  }'
```

### Postman
```
Method: POST
URL: {{base_url}}/admin/create-admin
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "email": "admin@masstock.com",
  "password": "AdminPassword123!",
  "name": "Admin MasStock"
}
```

### Expected Response (201)
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "admin@masstock.com",
    "role": "admin",
    "status": "active",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

---

## 2. ADMIN LOGIN

### cURL
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!"
  }'
```

### Postman
```
Method: POST
URL: {{base_url}}/auth/login
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "email": "admin@masstock.com",
  "password": "AdminPassword123!"
}

Tests (to save token):
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("admin_token", jsonData.data.access_token);
});
```

### Expected Response (200)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_in": 3600,
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "admin@masstock.com",
      "role": "admin",
      "status": "active"
    },
    "client": null
  }
}
```

---

## 3. CREATE USER WITH CLIENT

### cURL
```bash
# First, get the admin token from login response
ADMIN_TOKEN="your_admin_token_here"

curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estee@masstock.com",
    "password": "EsteePassword123!",
    "company_name": "Estee Agency",
    "name": "Estee Manager",
    "plan": "premium_custom",
    "subscription_amount": 2500,
    "role": "user"
  }'
```

### Postman
```
Method: POST
URL: {{base_url}}/admin/users
Headers:
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json

Body (raw JSON):
{
  "email": "estee@masstock.com",
  "password": "EsteePassword123!",
  "company_name": "Estee Agency",
  "name": "Estee Manager",
  "plan": "premium_custom",
  "subscription_amount": 2500,
  "role": "user"
}
```

### Expected Response (201)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "email": "estee@masstock.com",
      "role": "user",
      "status": "active"
    },
    "client": {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "name": "Estee Agency",
      "company_name": "Estee Agency",
      "plan": "premium_custom",
      "status": "active",
      "subscription_amount": 2500
    },
    "credentials": {
      "email": "estee@masstock.com",
      "password": "EsteePassword123!",
      "note": "Share these credentials with the user. They can change the password after first login."
    }
  }
}
```

---

## 4. USER LOGIN (Test Auth Sync)

### cURL
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estee@masstock.com",
    "password": "EsteePassword123!"
  }'
```

### Postman
```
Method: POST
URL: {{base_url}}/auth/login
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "email": "estee@masstock.com",
  "password": "EsteePassword123!"
}

Tests (to save token):
pm.test("User login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("user_token", jsonData.data.access_token);
});
```

### Expected Response (200) - SUCCESS MEANS AUTH SYNC WORKS!
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_in": 3600,
    "user": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "email": "estee@masstock.com",
      "role": "user",
      "status": "active"
    },
    "client": {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "name": "Estee Agency",
      "email": "estee@masstock.com",
      "company_name": "Estee Agency",
      "plan": "premium_custom",
      "status": "active",
      "subscription_amount": 2500
    }
  }
}
```

---

## 5. GET CURRENT USER INFO

### cURL
```bash
USER_TOKEN="user_token_here"

curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $USER_TOKEN"
```

### Postman
```
Method: GET
URL: {{base_url}}/auth/me
Headers:
  Authorization: Bearer {{user_token}}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "email": "estee@masstock.com",
      "role": "user",
      "status": "active",
      "created_at": "2025-11-14T15:00:00.000Z",
      "last_login": "2025-11-14T15:05:00.000Z"
    },
    "client": {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "name": "Estee Agency",
      "email": "estee@masstock.com",
      "company_name": "Estee Agency",
      "plan": "premium_custom",
      "status": "active",
      "subscription_amount": 2500
    }
  }
}
```

---

## 6. CREATE ANOTHER ADMIN

### cURL
```bash
ADMIN_TOKEN="admin_token_here"

curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@masstock.com",
    "password": "SecondAdmin123!",
    "name": "Second Admin",
    "role": "admin"
  }'
```

### Postman
```
Method: POST
URL: {{base_url}}/admin/users
Headers:
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json

Body (raw JSON):
{
  "email": "admin2@masstock.com",
  "password": "SecondAdmin123!",
  "name": "Second Admin",
  "role": "admin"
}
```

### Expected Response (201)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "d4e5f6a7-b8c9-0123-def1-234567890123",
      "email": "admin2@masstock.com",
      "role": "admin",
      "status": "active"
    },
    "client": null,
    "credentials": {
      "email": "admin2@masstock.com",
      "password": "SecondAdmin123!",
      "note": "Share these credentials with the user. They can change the password after first login."
    }
  }
}
```

---

## 7. GET ADMIN DASHBOARD

### cURL
```bash
ADMIN_TOKEN="admin_token_here"

curl -X GET http://localhost:3000/api/v1/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Postman
```
Method: GET
URL: {{base_url}}/admin/dashboard
Headers:
  Authorization: Bearer {{admin_token}}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": {
    "uptime_percent": 99.5,
    "errors_24h": 2,
    "total_executions_24h": 150,
    "total_revenue_month": "12500.00",
    "active_clients": 5,
    "recent_activity": [...]
  }
}
```

---

## 8. GET ALL CLIENTS (Admin)

### cURL
```bash
ADMIN_TOKEN="admin_token_here"

curl -X GET "http://localhost:3000/api/v1/admin/clients?limit=10&offset=0&status=active" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Postman
```
Method: GET
URL: {{base_url}}/admin/clients
Headers:
  Authorization: Bearer {{admin_token}}

Query Params:
  limit: 10
  offset: 0
  status: active
```

### Expected Response (200)
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "user_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "name": "Estee Agency",
        "email": "estee@masstock.com",
        "company_name": "Estee Agency",
        "plan": "premium_custom",
        "status": "active",
        "subscription_amount": 2500
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0,
    "page": 1
  }
}
```

---

## COMPLETE WORKFLOW SCRIPT

### Bash Script
```bash
#!/bin/bash
# Complete workflow to bootstrap MasStock

BASE_URL="http://localhost:3000/api/v1"

echo "Step 1: Create Admin"
ADMIN_RESP=$(curl -s -X POST "$BASE_URL/admin/create-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!",
    "name": "Admin MasStock"
  }')

ADMIN_TOKEN=$(echo "$ADMIN_RESP" | jq -r '.data.access_token')
echo "Admin Token: $ADMIN_TOKEN"
echo ""

echo "Step 2: Create User (Estee)"
curl -s -X POST "$BASE_URL/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estee@masstock.com",
    "password": "EsteePassword123!",
    "company_name": "Estee Agency",
    "name": "Estee Manager",
    "plan": "premium_custom",
    "subscription_amount": 2500,
    "role": "user"
  }' | jq
echo ""

echo "Step 3: Test User Login"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estee@masstock.com",
    "password": "EsteePassword123!"
  }' | jq

echo ""
echo "Done! If user login succeeded, auth sync is working! ✓"
```

---

## POSTMAN ENVIRONMENT

### Create environment variables:
```json
{
  "name": "MasStock Local",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/v1",
      "enabled": true
    },
    {
      "key": "admin_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "user_token",
      "value": "",
      "enabled": true
    }
  ]
}
```

### Auto-save tokens in Postman Tests:
Add this to the "Tests" tab of your login requests:

```javascript
// For admin login
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    if (jsonData.success) {
        pm.environment.set("admin_token", jsonData.data.access_token);
        console.log("Admin token saved!");
    }
});

// For user login
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    if (jsonData.success) {
        pm.environment.set("user_token", jsonData.data.access_token);
        console.log("User token saved!");
    }
});
```

---

## ERROR RESPONSES

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Email and password are required",
  "code": "MISSING_REQUIRED_FIELDS"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

### 403 - Forbidden (Admin Exists)
```json
{
  "success": false,
  "error": "Admin user already exists. Use POST /api/v1/admin/users to create additional users.",
  "code": "ADMIN_EXISTS"
}
```

### 403 - Forbidden (Not Admin)
```json
{
  "success": false,
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

### 404 - User Not Found (THE PROBLEM WE FIXED)
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

This error should NO LONGER appear when using the new endpoints!

---

## QUICK REFERENCE

### User Creation Patterns

**Create Admin:**
```bash
POST /admin/create-admin (no auth) - first admin only
POST /admin/users + role=admin (with admin auth) - additional admins
```

**Create Regular User:**
```bash
POST /admin/users + role=user (with admin auth)
```

### Authentication Patterns

**Login:**
```bash
POST /auth/login (email + password) → returns access_token
```

**Use Token:**
```bash
GET /any-protected-endpoint
Header: Authorization: Bearer <token>
```

**Refresh Token:**
```bash
POST /auth/refresh (refresh_token) → returns new access_token
```

---

## NOTES

1. All timestamps are in ISO 8601 format (UTC)
2. All IDs are UUIDs (v4)
3. Passwords must be at least 8 characters
4. Email addresses are automatically normalized (lowercased)
5. Admin users don't have clients (client = null)
6. Regular users always have a client
7. Credentials are returned ONLY on user creation (not on login)
8. Store these credentials securely and share with the user
