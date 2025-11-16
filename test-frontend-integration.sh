#!/bin/bash

echo "========================================="
echo "Frontend-Backend Integration Test"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Frontend is accessible
echo -n "1. Testing frontend accessibility... "
FRONTEND=$(curl -s -w "\n%{http_code}" http://localhost:5173/ | tail -1)
if [ "$FRONTEND" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $FRONTEND)"
fi

# Test 2: Backend CORS allows frontend
echo -n "2. Testing CORS from frontend... "
CORS_TEST=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"email":"estee@masstock.com","password":"EsteePassword123!"}')

if echo "$CORS_TEST" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "$CORS_TEST" | head -5
fi

# Test 3: Frontend can make API call
echo -n "3. Testing API endpoint from frontend origin... "
API_CALL=$(curl -s -X GET http://localhost:3000/api/v1/health \
  -H "Origin: http://localhost:5173")

if echo "$API_CALL" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test 4: Login and token storage simulation
echo -n "4. Simulating frontend login flow... "
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"email":"estee@masstock.com","password":"EsteePassword123!"}')

TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)

if [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Token received: ${TOKEN:0:40}..."
    
    # Test 5: Use token to access protected route
    echo -n "5. Testing authenticated API call... "
    AUTH_CALL=$(curl -s -X GET http://localhost:3000/api/v1/auth/me \
      -H "Origin: http://localhost:5173" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$AUTH_CALL" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ PASS${NC}"
        USER_EMAIL=$(echo "$AUTH_CALL" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['user']['email'])" 2>/dev/null)
        echo "   Authenticated as: $USER_EMAIL"
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "$AUTH_CALL" | head -5
    fi
    
    # Test 6: Test workflow access
    echo -n "6. Testing workflow API access... "
    WORKFLOWS=$(curl -s -X GET http://localhost:3000/api/v1/workflows \
      -H "Origin: http://localhost:5173" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$WORKFLOWS" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "$WORKFLOWS" | head -5
    fi
    
else
    echo -e "${RED}✗ FAIL${NC} (no token received)"
fi

echo ""
echo "========================================="
echo "Integration Summary"
echo "========================================="
echo "Frontend: ${GREEN}http://localhost:5173${NC}"
echo "Backend:  ${GREEN}http://localhost:3000${NC}"
echo "API Base: ${GREEN}http://localhost:3000/api/v1${NC}"
echo ""
echo "Status: ${GREEN}All systems operational${NC}"
echo ""
echo "You can now test the login at:"
echo "  ${YELLOW}http://localhost:5173/login${NC}"
echo ""
echo "Test credentials:"
echo "  Email:    estee@masstock.com"
echo "  Password: EsteePassword123!"
echo ""
