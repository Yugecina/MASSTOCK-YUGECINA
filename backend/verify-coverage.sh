#!/bin/bash

echo "=================================="
echo "MASSTOCK Backend Test Coverage"
echo "=================================="
echo ""

echo "Running full test suite with coverage..."
npm test -- --coverage --silent 2>&1 | tee test-output.txt

echo ""
echo "=================================="
echo "Coverage Summary:"
echo "=================================="
grep -A 20 "Coverage summary" test-output.txt || echo "Coverage summary not found"

echo ""
echo "Test Results:"
grep "Tests:" test-output.txt || echo "Test results not found"

echo ""
echo "Files created:"
ls -lah src/__tests__/routes/*.test.js | wc -l | xargs echo "Route test files:"
ls -lah src/__tests__/workers/*.test.js | wc -l | xargs echo "Worker test files:"

echo ""
echo "Test counts by file:"
for file in src/__tests__/routes/*.test.js; do
  count=$(grep -c "it('should" "$file" 2>/dev/null || echo "0")
  echo "  $(basename $file): $count tests"
done

for file in src/__tests__/workers/*.test.js; do
  count=$(grep -c "it('should" "$file" 2>/dev/null || echo "0")
  echo "  $(basename $file): $count tests"
done
