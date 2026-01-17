#!/bin/bash

# Script to run all workflow tests with pretty output
# Usage: npm run test:workflows

set -e

echo ""
echo "🚀 =========================================="
echo "   MASSTOCK WORKFLOW TESTS"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

UNIT_PASSED=false
INTEGRATION_PASSED=false

echo ""
echo -e "${BLUE}📊 STEP 1/2: Running Unit Tests (Pricing Calculations)${NC}"
echo "----------------------------------------------"

if npm run test:workflows:unit --silent; then
    echo -e "${GREEN}✅ Unit tests PASSED${NC}"
    UNIT_PASSED=true
else
    echo -e "${RED}❌ Unit tests FAILED${NC}"
    UNIT_PASSED=false
fi

echo ""
echo -e "${BLUE}📊 STEP 2/2: Running Integration Tests (Workflow Execution)${NC}"
echo "----------------------------------------------"

if npm run test:workflows:integration --silent; then
    echo -e "${GREEN}✅ Integration tests PASSED${NC}"
    INTEGRATION_PASSED=true
else
    echo -e "${RED}❌ Integration tests FAILED${NC}"
    INTEGRATION_PASSED=false
fi

echo ""
echo "=========================================="
echo "   TEST SUMMARY"
echo "=========================================="
echo ""

if [ "$UNIT_PASSED" = true ]; then
    echo -e "${GREEN}✅ Unit Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Unit Tests: FAILED${NC}"
fi

if [ "$INTEGRATION_PASSED" = true ]; then
    echo -e "${GREEN}✅ Integration Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Integration Tests: FAILED${NC}"
fi

echo ""

if [ "$UNIT_PASSED" = true ] && [ "$INTEGRATION_PASSED" = true ]; then
    echo -e "${GREEN}🎉 ALL WORKFLOW TESTS PASSED!${NC}"
    echo ""
    echo "Workflows tested:"
    echo "  • Nano Banana (Image Factory)"
    echo "  • Pricing Calculations (All models)"
    echo ""
    echo "Next steps:"
    echo "  • Run E2E tests: npm run test:workflows:e2e"
    echo "  • Run all tests: npm run test:workflows:all"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please fix the failing tests before committing."
    echo ""
    exit 1
fi
