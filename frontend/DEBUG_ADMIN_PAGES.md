# Debug Admin Pages - Data Not Displaying

## Problem Summary

Admin pages (Users and Workflows) were not displaying data despite having mock data configured.

## Root Causes Identified

### 1. AdminWorkflows.jsx - Wrong Service Import

**Problem:**
- Component imported `adminService` but used `adminWorkflowService` internally
- `adminService.getWorkflows()` has no mock implementation
- `adminWorkflowService.getWorkflows()` has mock data but wasn't being used

**Solution:**
- Changed import from `adminService` to `adminWorkflowService`
- Updated component to use correct service

### 2. Response Structure Mismatch

**AdminUserService:**
- Returns: `{ success: true, data: { clients: [...] } }`
- Component extracts: `response.data?.clients` ✅ CORRECT

**AdminWorkflowService:**
- Returns: `{ data: { success: true, data: { workflows: [...] } } }`
- Component should extract: `response.data?.data?.workflows` ✅ FIXED

### 3. Missing Empty State for Workflows

**Problem:**
- AdminWorkflows didn't show message when `workflows.length === 0`
- Page appeared blank even when data loading completed

**Solution:**
- Added conditional rendering for empty state
- Shows "Aucun workflow trouvé" message

## Files Modified

### /Users/dorian/Documents/MASSTOCK/frontend/src/pages/admin/AdminWorkflows.jsx

**Changes:**
1. Import changed from `adminService` to `adminWorkflowService`
2. Added console.log statements for debugging
3. Fixed data extraction: `response.data?.data?.workflows`
4. Added empty state rendering
5. Added workflow count display

### /Users/dorian/Documents/MASSTOCK/frontend/src/pages/admin/AdminUsers.jsx

**Changes:**
1. Added console.log statements for debugging
2. Added user count display

## Testing Instructions

1. Open browser console (F12)
2. Navigate to Admin Users page
3. Check console logs:
   - "Loading users..."
   - "Response from getUsers:" (should show mock data)
   - "Response.data:" (should show { clients: [...] })
   - "Clients extracted:" (should show array with 1 user)
4. Page should display:
   - "Total users: 1"
   - Table with Estee Agency user

5. Navigate to Admin Workflows page
6. Check console logs:
   - "Loading workflows..."
   - "Response from getWorkflows:" (should show nested mock data)
   - "Response.data.data.workflows:" (should show array with 10 workflows)
7. Page should display:
   - "Total workflows: 10"
   - 10 workflow cards

## Expected Mock Data

### Users (1 item):
- Name: Estee Agency
- Email: estee@masstock.com
- Company: Estee Agency
- Plan: premium_custom
- Status: active

### Workflows (10 items):
- Batch Image Generator
- Style Transfer Pipeline
- Product Photo Enhancer
- Social Media Content Generator
- Logo Variation Creator
- Moodboard Generator
- Image Upscaler Pro
- Portrait Background Replacer
- Batch Watermark Applier
- AI Avatar Generator

## Next Steps

Once data is confirmed displaying:
1. Remove console.log debug statements
2. Remove "Total users/workflows" count displays (optional)
3. Test with real backend API (set USE_MOCK = false)

## Common Issues

### "Aucun utilisateur trouvé" or "Aucun workflow trouvé"

Check console logs to see if:
- Service is being called
- Response structure matches expected format
- Data extraction path is correct

### Data loads but doesn't display

- Verify component isn't throwing render errors
- Check React DevTools for state values
- Ensure CSS classes are loading properly

### Service not found errors

- Verify import path is correct
- Check service file exists at expected location
- Ensure service is exported correctly
