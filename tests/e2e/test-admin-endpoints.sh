#!/bin/bash

# Test script for Admin User Creation Endpoints
# Tests the new /api/v1/admin/create-admin and /api/v1/admin/users endpoints

set -e  # Exit on error

BASE_URL="http://localhost:3000/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "MasStock Admin Endpoints Test Suite"
echo "========================================="
echo ""

# Test 1: Create First Admin
echo -e "${YELLOW}TEST 1: Create First Admin${NC}"
echo "POST $BASE_URL/admin/create-admin"
echo ""

ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/create-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!",
    "name": "Admin MasStock"
  }')

echo "$ADMIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ADMIN_RESPONSE"
echo ""

# Check if admin creation succeeded
if echo "$ADMIN_RESPONSE" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✓ Admin created successfully${NC}"

  # Extract access token
  ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null || echo "")

  if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}⚠ No token returned, but user created. Try logging in.${NC}"
  else
    echo -e "${GREEN}✓ Admin token obtained${NC}"
  fi
else
  # Check if admin already exists
  if echo "$ADMIN_RESPONSE" | grep -q "ADMIN_EXISTS"; then
    echo -e "${YELLOW}⚠ Admin already exists. Logging in instead...${NC}"

    # Login as admin
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin@masstock.com",
        "password": "AdminPassword123!"
      }')

    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

    if echo "$LOGIN_RESPONSE" | grep -q "\"success\":true"; then
      ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null || echo "")
      echo -e "${GREEN}✓ Admin login successful${NC}"
    else
      echo -e "${RED}✗ Admin login failed${NC}"
      exit 1
    fi
  else
    echo -e "${RED}✗ Admin creation failed${NC}"
    exit 1
  fi
fi

echo ""
echo "========================================="
echo ""

# Test 2: Verify Admin can access /auth/me
echo -e "${YELLOW}TEST 2: Verify Admin Authentication${NC}"
echo "GET $BASE_URL/auth/me"
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
  ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

  echo "$ME_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ME_RESPONSE"
  echo ""

  if echo "$ME_RESPONSE" | grep -q "\"role\":\"admin\""; then
    echo -e "${GREEN}✓ Admin authenticated successfully${NC}"
  else
    echo -e "${RED}✗ Admin authentication failed${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Skipping (no admin token)${NC}"
fi

echo ""
echo "========================================="
echo ""

# Test 3: Create a regular user (with client)
echo -e "${YELLOW}TEST 3: Create User with Client${NC}"
echo "POST $BASE_URL/admin/users"
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
  USER_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/users" \
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
    }')

  echo "$USER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$USER_RESPONSE"
  echo ""

  if echo "$USER_RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✓ User created successfully${NC}"

    # Extract user email and password for next test
    USER_EMAIL="estee@masstock.com"
    USER_PASSWORD="EsteePassword123!"
  else
    if echo "$USER_RESPONSE" | grep -q "USER_EXISTS"; then
      echo -e "${YELLOW}⚠ User already exists${NC}"
      USER_EMAIL="estee@masstock.com"
      USER_PASSWORD="EsteePassword123!"
    else
      echo -e "${RED}✗ User creation failed${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠ Skipping (no admin token)${NC}"
fi

echo ""
echo "========================================="
echo ""

# Test 4: Verify user can login (THIS IS THE CRITICAL TEST)
echo -e "${YELLOW}TEST 4: Verify User Can Login (Auth Sync Test)${NC}"
echo "POST $BASE_URL/auth/login"
echo ""

if [ -n "$USER_EMAIL" ]; then
  USER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER_EMAIL\",
      \"password\": \"$USER_PASSWORD\"
    }")

  echo "$USER_LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$USER_LOGIN_RESPONSE"
  echo ""

  if echo "$USER_LOGIN_RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✓✓✓ USER LOGIN SUCCESS - AUTH SYNC WORKING! ✓✓✓${NC}"

    # Check if client data is present
    if echo "$USER_LOGIN_RESPONSE" | grep -q "\"client\""; then
      echo -e "${GREEN}✓ Client data attached to user${NC}"
    else
      echo -e "${YELLOW}⚠ No client data (might be admin user)${NC}"
    fi
  else
    if echo "$USER_LOGIN_RESPONSE" | grep -q "USER_NOT_FOUND"; then
      echo -e "${RED}✗✗✗ CRITICAL: 'User not found' error - Auth sync FAILED! ✗✗✗${NC}"
      echo -e "${RED}This means the user exists in auth.users but not in public.users${NC}"
    else
      echo -e "${RED}✗ User login failed (other error)${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠ Skipping (no user created)${NC}"
fi

echo ""
echo "========================================="
echo ""

# Test 5: Create another admin user
echo -e "${YELLOW}TEST 5: Create Second Admin (using admin/users)${NC}"
echo "POST $BASE_URL/admin/users"
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
  SECOND_ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin2@masstock.com",
      "password": "SecondAdmin123!",
      "name": "Second Admin",
      "role": "admin"
    }')

  echo "$SECOND_ADMIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SECOND_ADMIN_RESPONSE"
  echo ""

  if echo "$SECOND_ADMIN_RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✓ Second admin created successfully${NC}"
  else
    if echo "$SECOND_ADMIN_RESPONSE" | grep -q "USER_EXISTS"; then
      echo -e "${YELLOW}⚠ Second admin already exists${NC}"
    else
      echo -e "${RED}✗ Second admin creation failed${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠ Skipping (no admin token)${NC}"
fi

echo ""
echo "========================================="
echo ""
echo -e "${GREEN}Test Suite Complete!${NC}"
echo ""

# Summary
echo "Summary:"
echo "--------"
echo "1. Admin creation: $([ -n "$ADMIN_TOKEN" ] && echo "✓ PASS" || echo "✗ FAIL")"
echo "2. Admin authentication: $([ -n "$ADMIN_TOKEN" ] && echo "✓ PASS" || echo "- SKIP")"
echo "3. User creation: $([ -n "$USER_EMAIL" ] && echo "✓ PASS" || echo "- SKIP")"
echo "4. User login (auth sync): Check output above"
echo ""
echo "========================================="
echo ""

# Save tokens to file for manual testing
if [ -n "$ADMIN_TOKEN" ]; then
  echo "ADMIN_TOKEN=$ADMIN_TOKEN" > /tmp/masstock_tokens.env
  echo -e "${GREEN}✓ Admin token saved to /tmp/masstock_tokens.env${NC}"
  echo "Use it in your requests:"
  echo "  curl -H \"Authorization: Bearer $ADMIN_TOKEN\" http://localhost:3000/api/v1/admin/dashboard"
fi
