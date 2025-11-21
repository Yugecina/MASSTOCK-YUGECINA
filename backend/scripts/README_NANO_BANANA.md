# Batch Nano Banana Workflow - Setup Complete

## Summary

The "Batch Nano Banana" workflow has been successfully created in the database and is now accessible to the Estee user.

## What Was Done

### 1. Workflow Creation
- **Workflow ID**: `f8b20b59-7d06-4599-8413-64da74225b0c`
- **Name**: Batch Nano Banana
- **Client**: Estee Agency (`a76e631c-4dc4-4abc-b759-9f7c225c142b`)
- **Status**: deployed
- **Type**: nano_banana (Google Gemini 2.5 Flash Image API)

### 2. Configuration Details
```json
{
  "workflow_type": "nano_banana",
  "model": "gemini-2.5-flash-image",
  "api_provider": "google_gemini",
  "max_prompts": 100,
  "max_reference_images": 3,
  "cost_per_image": 0.039,
  "supported_formats": ["png", "jpg", "webp"],
  "aspect_ratios": ["1:1", "16:9", "9:16", "4:3", "3:4"],
  "requires_api_key": true,
  "api_key_storage": "encrypted_ephemeral"
}
```

### 3. Pricing
- **Cost per Execution**: $0.04
- **Revenue per Execution**: $0.10
- **Profit Margin**: $0.06 (60%)

### 4. User Access
- **Email**: estee@masstock.com
- **Password**: Estee123123
- **User ID**: `60dd743e-5bbb-494b-8094-77a9c97f1673`
- **Role**: user
- **Status**: active

## Verification Tests

All tests passed successfully:

1. ✅ Authentication works (Estee can log in)
2. ✅ User found in database
3. ✅ Client properly linked to user
4. ✅ Workflow visible via backend API
5. ✅ Workflow visible via RLS (client can access their own workflow)

## Scripts Created

The following utility scripts were created in `/backend/scripts/`:

1. **seed-nano-banana.js** - Creates the Batch Nano Banana workflow
2. **verify-nano-banana.js** - Verifies workflow configuration and visibility
3. **check-estee-user.js** - Checks Estee user and client linkage
4. **check-auth-users.js** - Lists all Supabase Auth users
5. **reset-estee-password.js** - Resets Estee's password for testing
6. **test-estee-login.js** - Full end-to-end authentication and workflow access test

## How to Test

### Backend Test (Already Done)
```bash
cd backend
node scripts/test-estee-login.js
```

### Frontend Test (Next Steps)
1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open browser and navigate to: `http://localhost:5173`

3. Log in with Estee credentials:
   - Email: `estee@masstock.com`
   - Password: `Estee123123`

4. Navigate to the Workflows page

5. Verify "Batch Nano Banana" appears in the workflow list

### Admin Test
1. Log in as admin:
   - Email: `admin@masstock.com`
   - Password: `Admin123123`

2. Navigate to Admin > Workflows

3. Verify "Batch Nano Banana" appears in the list

## Database Structure

### Workflow Record
```sql
SELECT
  id,
  name,
  client_id,
  status,
  config,
  cost_per_execution,
  revenue_per_execution,
  deployed_at
FROM workflows
WHERE name = 'Batch Nano Banana';
```

### Client-User Linkage
```sql
SELECT
  c.id as client_id,
  c.name as client_name,
  c.email as client_email,
  c.user_id,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role
FROM clients c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.email = 'estee@masstock.com';
```

## RLS Policies

The workflow is protected by Row-Level Security policies:

1. **Clients can view own workflows** (lines 85-97 in `002_row_level_security.sql`)
   - Allows clients to see workflows where `client_id` matches their client record
   - Allows admins to see all workflows

2. **Admins can manage workflows** (lines 100-107)
   - Allows admin users full access to all workflows

These policies ensure data isolation between clients while allowing admins full access.

## API Endpoints

### Get All Workflows (Client)
```bash
GET /api/workflows
Authorization: Bearer <access_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "f8b20b59-7d06-4599-8413-64da74225b0c",
        "name": "Batch Nano Banana",
        "description": "AI image generation...",
        "status": "deployed",
        "config": { ... },
        "cost_per_execution": 0.04,
        "revenue_per_execution": 0.1
      }
    ],
    "total": 1
  }
}
```

### Execute Workflow
```bash
POST /api/workflows/:workflow_id/execute
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

prompts_text: "A beautiful sunset over mountains\nA cat sitting on a windowsill"
api_key: "your-google-gemini-api-key"
reference_images: [file1.jpg, file2.png]
```

## Troubleshooting

### Workflow Not Visible

If the workflow doesn't appear:

1. **Check workflow status**:
   ```bash
   node scripts/verify-nano-banana.js
   ```

2. **Check user authentication**:
   ```bash
   node scripts/test-estee-login.js
   ```

3. **Check RLS policies**:
   - Ensure RLS is enabled on workflows table
   - Verify policies allow client to view their own workflows

### Authentication Issues

If login fails:

1. **Reset password**:
   ```bash
   node scripts/reset-estee-password.js
   ```

2. **Check user linkage**:
   ```bash
   node scripts/check-estee-user.js
   ```

### Database Issues

If queries fail:

1. **Check database connection**:
   ```bash
   cd backend
   npm run migrate
   ```

2. **Verify environment variables**:
   - Check `.env` file has correct Supabase credentials
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

## Next Steps

1. ✅ Workflow created and verified
2. ✅ User authentication tested
3. ✅ RLS policies verified
4. ⏳ Frontend testing (to be done by user)
5. ⏳ Execute workflow from frontend
6. ⏳ Verify batch results display correctly

## Files Modified/Created

### Created
- `/backend/scripts/seed-nano-banana.js`
- `/backend/scripts/verify-nano-banana.js`
- `/backend/scripts/check-estee-user.js`
- `/backend/scripts/check-auth-users.js`
- `/backend/scripts/reset-estee-password.js`
- `/backend/scripts/test-estee-login.js`
- `/backend/scripts/README_NANO_BANANA.md` (this file)

### Migration (Already Exists)
- `/backend/database/migrations/010_seed_nano_banana_workflow.sql`

## Support

If you encounter any issues:

1. Run the verification script: `node scripts/verify-nano-banana.js`
2. Check the backend logs for errors
3. Verify the frontend is making requests to the correct API endpoint
4. Ensure the access token is being sent in the Authorization header

## Success Criteria

- [x] Workflow exists in database
- [x] Workflow status is "deployed"
- [x] Workflow assigned to Estee client
- [x] Estee user can authenticate
- [x] Estee user linked to Estee client
- [x] Workflow visible via backend API
- [x] Workflow visible via RLS query
- [ ] Workflow visible in frontend UI (to be tested)
- [ ] Workflow can be executed from frontend (to be tested)
