#!/bin/bash

set -e

echo "🧪 MASSTOCK Test Guard"
echo "======================"

FAILED=0

# Backend tests
echo ""
echo "📦 Backend unit tests..."
cd backend
if npm run test:unit --silent 2>/dev/null; then
  echo "✅ Backend tests passed"
else
  echo "❌ Backend tests FAILED"
  FAILED=1
fi
cd ..

# Frontend tests
echo ""
echo "🎨 Frontend unit tests..."
cd frontend
if npm run test:unit --silent 2>/dev/null; then
  echo "✅ Frontend tests passed"
else
  echo "❌ Frontend tests FAILED"
  FAILED=1
fi
cd ..

echo ""
echo "======================"
if [ $FAILED -ne 0 ]; then
  echo "❌ SOME TESTS FAILED - Do not commit!"
  exit 1
fi

echo "✅ ALL TESTS PASSED"
exit 0
