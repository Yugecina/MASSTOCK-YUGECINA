#!/bin/bash

# Simple test script for Nano Banana workflow using curl
# Usage: ./scripts/test-workflow-simple.sh

set -e

API_URL="${API_URL:-http://localhost:3000/api}"
TEST_EMAIL="estee@masstock.com"
TEST_PASSWORD="password123"

echo "🧪 Testing Nano Banana Workflow (Simple)"
echo ""

# Check for GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY not set"
    echo "Please set it: export GEMINI_API_KEY='your-key'"
    exit 1
fi

# Step 1: Login
echo "📝 Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Login Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Step 2: Get workflows
echo "📝 Step 2: Fetching workflows..."
WORKFLOWS_RESPONSE=$(curl -s -X GET "$API_URL/workflows" \
  -H "Authorization: Bearer $TOKEN")

echo "Workflows Response: $WORKFLOWS_RESPONSE"

WORKFLOW_ID=$(echo $WORKFLOWS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$WORKFLOW_ID" ]; then
    echo "❌ Failed to get workflow ID"
    echo "Response: $WORKFLOWS_RESPONSE"
    exit 1
fi

echo "✅ Found workflow: $WORKFLOW_ID"
echo ""

# Step 3: Execute workflow
echo "📝 Step 3: Executing workflow..."
EXECUTE_RESPONSE=$(curl -s -X POST "$API_URL/workflows/$WORKFLOW_ID/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -F "prompts_text=A cute cat wearing sunglasses on a beach" \
  -F "api_key=$GEMINI_API_KEY")

echo "Execute Response: $EXECUTE_RESPONSE"
echo ""

EXECUTION_ID=$(echo $EXECUTE_RESPONSE | grep -o '"execution_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$EXECUTION_ID" ]; then
    echo "❌ Failed to get execution ID"
    echo "Response: $EXECUTE_RESPONSE"
    exit 1
fi

echo "✅ Workflow execution queued: $EXECUTION_ID"
echo ""

# Step 4: Poll for completion
echo "📝 Step 4: Waiting for completion..."
for i in {1..30}; do
    sleep 2
    STATUS_RESPONSE=$(curl -s -X GET "$API_URL/executions/$EXECUTION_ID" \
      -H "Authorization: Bearer $TOKEN")

    STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   Attempt $i: Status = $STATUS"

    if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
        break
    fi
done

echo ""
echo "Final Status Response: $STATUS_RESPONSE"
echo ""

if [ "$STATUS" = "completed" ]; then
    echo "✅ Workflow completed successfully!"

    # Get batch results
    RESULTS_RESPONSE=$(curl -s -X GET "$API_URL/executions/$EXECUTION_ID/batch-results" \
      -H "Authorization: Bearer $TOKEN")

    echo ""
    echo "📊 Batch Results:"
    echo "$RESULTS_RESPONSE"
elif [ "$STATUS" = "failed" ]; then
    echo "❌ Workflow failed"
else
    echo "⏱️ Workflow still processing or timed out"
fi

echo ""
echo "✅ Test completed"
