#!/bin/bash

# Download Test Fixtures for E2E Tests
# This script downloads sample images for workflow E2E tests from Unsplash

set -e

FIXTURES_DIR="$(dirname "$0")/../src/__tests__/fixtures"

echo "📦 Downloading test fixtures for E2E tests..."
echo "Target directory: $FIXTURES_DIR"

# Create fixtures directory if it doesn't exist
mkdir -p "$FIXTURES_DIR"

cd "$FIXTURES_DIR"

# Download empty room image
if [ ! -f "empty-room.jpg" ]; then
  echo "🏠 Downloading empty-room.jpg..."
  curl -L -o empty-room.jpg "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
  echo "✅ empty-room.jpg downloaded"
else
  echo "⏭️  empty-room.jpg already exists"
fi

# Download furnished room image
if [ ! -f "furnished-room.jpg" ]; then
  echo "🛋️  Downloading furnished-room.jpg..."
  curl -L -o furnished-room.jpg "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80"
  echo "✅ furnished-room.jpg downloaded"
else
  echo "⏭️  furnished-room.jpg already exists"
fi

# Download test marketing image
if [ ! -f "test-image.jpg" ]; then
  echo "🎨 Downloading test-image.jpg..."
  curl -L -o test-image.jpg "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80"
  echo "✅ test-image.jpg downloaded"
else
  echo "⏭️  test-image.jpg already exists"
fi

echo ""
echo "✅ All test fixtures downloaded successfully!"
echo ""
echo "Fixtures:"
ls -lh *.jpg 2>/dev/null || echo "No images found"

echo ""
echo "You can now run E2E tests with:"
echo "  npm run test:e2e"
