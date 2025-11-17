# MasStock API Testing Guide

Complete guide with example requests for all endpoints.

## Setup

**Base URL (Local):** `http://localhost:3000/api/v1`
**Base URL (Production):** `https://masstock-backend.onrender.com/api/v1`

**Test Accounts:**
- Admin: `admin@masstock.com`
- Client (Estee): `contact@estee-agency.com`

## 1. Authentication

### Login (Client)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contact@estee-agency.com",
    "password": "password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 604800,
    "user": {
      "id": "uuid",
      "email": "contact@estee-agency.com",
      "role": "user",
      "status": "active"
    },
    "client": {
      "id": "uuid",
      "name": "Estee",
      "plan": "premium_custom",
      "status": "active"
    }
  }
}
```

**Save the token:**
```bash
export TOKEN="paste-access-token-here"
```

### Get Current User

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your-refresh-token"
  }'
```

### Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## 2. Workflows (Client View)

### List All Workflows

```bash
curl http://localhost:3000/api/v1/workflows \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "uuid",
        "name": "Batch Image Generator",
        "description": "Generate multiple AI images...",
        "status": "deployed",
        "config": { "model": "midjourney", "max_images": 100 },
        "cost_per_execution": 15.00,
        "revenue_per_execution": 250.00
      }
    ],
    "total": 10
  }
}
```

### Get Workflow Details

```bash
# Replace {workflow_id} with actual ID from previous response
curl http://localhost:3000/api/v1/workflows/{workflow_id} \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow": { ... },
    "stats": {
      "total_executions": 25,
      "success_count": 23,
      "failed_count": 2,
      "success_rate": "92.00",
      "avg_duration_seconds": 456
    },
    "recent_executions": [ ... ]
  }
}
```

### Execute Workflow

```bash
curl -X POST http://localhost:3000/api/v1/workflows/{workflow_id}/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": {
      "prompts": [
        "sunset over mountains, photorealistic",
        "city skyline at night, cinematic"
      ],
      "count": 2
    }
  }'
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "execution_id": "uuid-execution-id",
    "status": "pending",
    "message": "Workflow execution queued successfully"
  }
}
```

**Save execution ID:**
```bash
export EXECUTION_ID="paste-execution-id-here"
```

### Get Workflow Statistics

```bash
curl http://localhost:3000/api/v1/workflows/{workflow_id}/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Get Workflow Execution History

```bash
curl "http://localhost:3000/api/v1/workflows/{workflow_id}/executions?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**With status filter:**
```bash
curl "http://localhost:3000/api/v1/workflows/{workflow_id}/executions?status=completed" \
  -H "Authorization: Bearer $TOKEN"
```

## 3. Executions

### Get Execution Status

```bash
curl http://localhost:3000/api/v1/executions/$EXECUTION_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Response (pending):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflow_id": "uuid",
    "status": "pending",
    "progress": 10,
    "input_data": { "prompts": [...] },
    "started_at": "2024-11-14T10:00:00Z"
  }
}
```

**Response (completed):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "progress": 100,
    "input_data": { "prompts": [...] },
    "output_data": {
      "status": "success",
      "results": {
        "type": "image_generation",
        "images": [
          {
            "id": "img_123",
            "prompt": "sunset over mountains",
            "url": "https://example.com/image1.png",
            "thumbnail": "https://example.com/thumb1.png"
          }
        ]
      }
    },
    "started_at": "2024-11-14T10:00:00Z",
    "completed_at": "2024-11-14T10:05:23Z",
    "duration_seconds": 323
  }
}
```

**Poll for completion (example script):**
```bash
#!/bin/bash
# poll_execution.sh

EXECUTION_ID=$1
TOKEN=$2

while true; do
  RESPONSE=$(curl -s http://localhost:3000/api/v1/executions/$EXECUTION_ID \
    -H "Authorization: Bearer $TOKEN")

  STATUS=$(echo $RESPONSE | jq -r '.data.status')
  PROGRESS=$(echo $RESPONSE | jq -r '.data.progress')

  echo "Status: $STATUS | Progress: $PROGRESS%"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo "Execution finished!"
    echo $RESPONSE | jq .
    break
  fi

  sleep 5
done

# Usage: ./poll_execution.sh <execution-id> <token>
```

## 4. Workflow Requests

### Create Workflow Request

```bash
curl -X POST http://localhost:3000/api/v1/workflow-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Video Thumbnail Generator",
    "description": "Automated thumbnail generation for YouTube videos with text overlays and branding",
    "use_case": "Create eye-catching thumbnails for 50+ videos per month",
    "frequency": "weekly",
    "budget": 500.00
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "request_id": "uuid",
    "status": "submitted",
    "message": "Workflow request submitted successfully"
  }
}
```

### List Workflow Requests

```bash
curl http://localhost:3000/api/v1/workflow-requests \
  -H "Authorization: Bearer $TOKEN"
```

### Get Request Details

```bash
curl http://localhost:3000/api/v1/workflow-requests/{request_id} \
  -H "Authorization: Bearer $TOKEN"
```

### Update Request (Client - draft only)

```bash
curl -X PUT http://localhost:3000/api/v1/workflow-requests/{request_id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated requirements: need support for multiple languages"
  }'
```

## 5. Support Tickets

### Create Support Ticket

```bash
curl -X POST http://localhost:3000/api/v1/support-tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workflow execution failed",
    "description": "My workflow execution (ID: xxx) failed with timeout error",
    "priority": "high",
    "workflow_execution_id": "uuid-of-failed-execution"
  }'
```

### List Support Tickets

```bash
curl http://localhost:3000/api/v1/support-tickets \
  -H "Authorization: Bearer $TOKEN"
```

### Get Ticket Details

```bash
curl http://localhost:3000/api/v1/support-tickets/{ticket_id} \
  -H "Authorization: Bearer $TOKEN"
```

## 6. Admin Endpoints

**First, login as admin:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "admin-password"
  }'

export ADMIN_TOKEN="paste-admin-token-here"
```

### Get Admin Dashboard

```bash
curl http://localhost:3000/api/v1/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uptime_percent": 98.5,
    "errors_24h": 3,
    "total_executions_24h": 142,
    "total_revenue_month": "12450.00",
    "active_clients": 1,
    "recent_activity": [ ... ]
  }
}
```

### List All Clients

```bash
curl "http://localhost:3000/api/v1/admin/clients?limit=50&offset=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**With filters:**
```bash
curl "http://localhost:3000/api/v1/admin/clients?status=active&sort=created_at" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get Client Details

```bash
curl http://localhost:3000/api/v1/admin/clients/{client_id} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Create New Client

```bash
curl -X POST http://localhost:3000/api/v1/admin/clients \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Agency",
    "email": "contact@newagency.com",
    "company_name": "New Agency Inc",
    "plan": "premium_custom",
    "subscription_amount": 3000.00
  }'
```

### Update Client

```bash
curl -X PUT http://localhost:3000/api/v1/admin/clients/{client_id} \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "subscription_amount": 3500.00,
    "metadata": {
      "notes": "Upgraded plan",
      "account_manager": "John Doe"
    }
  }'
```

### Suspend Client

```bash
curl -X DELETE http://localhost:3000/api/v1/admin/clients/{client_id} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get Workflow Statistics (All Workflows)

```bash
curl http://localhost:3000/api/v1/admin/workflows/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get Error Logs

```bash
curl "http://localhost:3000/api/v1/admin/errors?limit=50&offset=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get Audit Logs

```bash
curl "http://localhost:3000/api/v1/admin/audit-logs?limit=100&offset=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Filter by client:**
```bash
curl "http://localhost:3000/api/v1/admin/audit-logs?client_id={uuid}" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Filter by action:**
```bash
curl "http://localhost:3000/api/v1/admin/audit-logs?action=workflow_executed" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Update Support Ticket (Admin)

```bash
curl -X PUT http://localhost:3000/api/v1/support-tickets/{ticket_id} \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_to": "admin-user-uuid"
  }'
```

### Update Workflow Request Status (Admin)

```bash
curl -X PUT http://localhost:3000/api/v1/workflow-requests/{request_id} \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "reviewing",
    "estimated_cost": 2500.00,
    "estimated_dev_days": 7,
    "notes": "Reviewing feasibility and technical approach"
  }'
```

## 7. Error Handling Examples

### 401 Unauthorized

```bash
curl http://localhost:3000/api/v1/workflows
# Missing Authorization header
```

**Response:**
```json
{
  "success": false,
  "error": "Missing or invalid authorization header",
  "code": "UNAUTHORIZED"
}
```

### 403 Forbidden

```bash
# Client trying to access admin endpoint
curl http://localhost:3000/api/v1/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": false,
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

### 404 Not Found

```bash
curl http://localhost:3000/api/v1/workflows/invalid-uuid \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": false,
  "error": "Workflow not found",
  "code": "WORKFLOW_NOT_FOUND"
}
```

### 429 Rate Limit Exceeded

```bash
# Make 101 requests in 1 minute
for i in {1..101}; do
  curl http://localhost:3000/api/v1/workflows \
    -H "Authorization: Bearer $TOKEN"
done
```

**Response:**
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 1634567890
}
```

## 8. Complete Workflow Test Scenario

```bash
#!/bin/bash
# complete_test.sh - Test entire workflow from login to execution

BASE_URL="http://localhost:3000/api/v1"

echo "=== 1. Login as Estee client ==="
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "contact@estee-agency.com", "password": "password"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')
echo "Token: ${TOKEN:0:50}..."

echo -e "\n=== 2. Get workflows ==="
WORKFLOWS=$(curl -s $BASE_URL/workflows \
  -H "Authorization: Bearer $TOKEN")

WORKFLOW_ID=$(echo $WORKFLOWS | jq -r '.data.workflows[0].id')
echo "First workflow ID: $WORKFLOW_ID"

echo -e "\n=== 3. Execute workflow ==="
EXEC_RESPONSE=$(curl -s -X POST $BASE_URL/workflows/$WORKFLOW_ID/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": {
      "prompts": ["test prompt"],
      "count": 1
    }
  }')

EXECUTION_ID=$(echo $EXEC_RESPONSE | jq -r '.data.execution_id')
echo "Execution ID: $EXECUTION_ID"

echo -e "\n=== 4. Poll for completion ==="
for i in {1..20}; do
  sleep 2
  STATUS_RESPONSE=$(curl -s $BASE_URL/executions/$EXECUTION_ID \
    -H "Authorization: Bearer $TOKEN")

  STATUS=$(echo $STATUS_RESPONSE | jq -r '.data.status')
  PROGRESS=$(echo $STATUS_RESPONSE | jq -r '.data.progress')

  echo "[$i] Status: $STATUS | Progress: $PROGRESS%"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo -e "\n=== Final Result ==="
    echo $STATUS_RESPONSE | jq .
    break
  fi
done

echo -e "\n=== Test Complete ==="
```

## 9. Postman Collection

Import this into Postman:

```json
{
  "info": {
    "name": "MasStock API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/v1"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth - Login",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"contact@estee-agency.com\", \"password\": \"password\"}"
        }
      }
    }
  ]
}
```

## 10. Integration Testing

```javascript
// Example using Jest + Supertest

const request = require('supertest');
const app = require('../src/server');

describe('Workflow Execution Flow', () => {
  let token;
  let workflowId;
  let executionId;

  test('Login as client', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'contact@estee-agency.com',
        password: 'password'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    token = res.body.data.access_token;
  });

  test('Get workflows', async () => {
    const res = await request(app)
      .get('/api/v1/workflows')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.workflows.length).toBeGreaterThan(0);
    workflowId = res.body.data.workflows[0].id;
  });

  test('Execute workflow', async () => {
    const res = await request(app)
      .post(`/api/v1/workflows/${workflowId}/execute`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        input_data: {
          prompts: ['test'],
          count: 1
        }
      });

    expect(res.statusCode).toBe(202);
    expect(res.body.data.status).toBe('pending');
    executionId = res.body.data.execution_id;
  });

  test('Get execution status', async () => {
    const res = await request(app)
      .get(`/api/v1/executions/${executionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(['pending', 'processing', 'completed']).toContain(res.body.data.status);
  });
});
```

---

**Happy Testing!** All endpoints are documented and ready for integration.
