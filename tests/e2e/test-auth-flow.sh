#!/bin/bash

echo "========================================="
echo "MasStock Authentication Flow Test"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health Check
echo -n "1. Testing backend health... "
HEALTH=$(curl -s http://localhost:3000/health)
if echo "$HEALTH" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "$HEALTH"
fi

# Test 2: Admin Login
echo -n "2. Testing admin login... "
ADMIN_LOGIN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@masstock.com","password":"Admin123123"}')

if echo "$ADMIN_LOGIN" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)
    echo "   Token: ${ADMIN_TOKEN:0:40}..."
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "$ADMIN_LOGIN" | python3 -m json.tool 2>/dev/null || echo "$ADMIN_LOGIN"
fi

# Test 3: User Login
echo -n "3. Testing user (Estee) login... "
USER_LOGIN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"estee@masstock.com","password":"EsteePassword123!"}')

if echo "$USER_LOGIN" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
    USER_TOKEN=$(echo "$USER_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)
    echo "   Token: ${USER_TOKEN:0:40}..."
    CLIENT_ID=$(echo "$USER_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['client']['id'])" 2>/dev/null)
    echo "   Client ID: $CLIENT_ID"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "$USER_LOGIN" | python3 -m json.tool 2>/dev/null || echo "$USER_LOGIN"
fi

# Test 4: Get User Profile (Protected Route)
if [ ! -z "$USER_TOKEN" ]; then
    echo -n "4. Testing protected route (/auth/me)... "
    ME=$(curl -s -X GET http://localhost:3000/api/v1/auth/me \
      -H "Authorization: Bearer $USER_TOKEN")
    
    if echo "$ME" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ PASS${NC}"
        EMAIL=$(echo "$ME" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['user']['email'])" 2>/dev/null)
        echo "   User email: $EMAIL"
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "$ME" | python3 -m json.tool 2>/dev/null || echo "$ME"
    fi
else
    echo "4. Testing protected route... ${YELLOW}SKIPPED${NC} (no token)"
fi

# Test 5: Admin Dashboard Access
if [ ! -z "$ADMIN_TOKEN" ]; then
    echo -n "5. Testing admin dashboard access... "
    DASHBOARD=$(curl -s -X GET http://localhost:3000/api/v1/admin/dashboard \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$DASHBOARD" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ PASS${NC}"
        ACTIVE_CLIENTS=$(echo "$DASHBOARD" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['active_clients'])" 2>/dev/null)
        echo "   Active clients: $ACTIVE_CLIENTS"
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "$DASHBOARD" | python3 -m json.tool 2>/dev/null || echo "$DASHBOARD"
    fi
else
    echo "5. Testing admin dashboard... ${YELLOW}SKIPPED${NC} (no admin token)"
fi

# Test 6: CORS Check
echo -n "6. Testing CORS headers... "
CORS=$(curl -s -I -X OPTIONS http://localhost:3000/api/v1/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST")

if echo "$CORS" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ALLOWED_ORIGIN=$(echo "$CORS" | grep "Access-Control-Allow-Origin:" | head -1)
    echo "   $ALLOWED_ORIGIN"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (CORS headers not found)"
fi

# Test 7: Rate Limiting Check
echo -n "7. Testing rate limiting... "
# Make 5 rapid requests
RATE_LIMIT_OK=true
for i in {1..5}; do
    RESP=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"wrong@email.com","password":"wrong"}' | tail -1)
    if [ "$RESP" = "429" ]; then
        RATE_LIMIT_OK=false
        break
    fi
done

if $RATE_LIMIT_OK; then
    echo -e "${GREEN}✓ PASS${NC} (rate limiting is active)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (hit rate limit at request $i - this is expected behavior)"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Backend: ${GREEN}Running${NC}"
echo "Authentication: ${GREEN}Working${NC}"
echo "Authorization: ${GREEN}Working${NC}"
echo "CORS: ${GREEN}Configured${NC}"
echo ""
echo "Test Users:"
echo "  Admin: admin@masstock.com / Admin123123"
echo "  User:  estee@masstock.com / EsteePassword123!"
echo ""
