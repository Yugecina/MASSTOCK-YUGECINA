#!/bin/bash

# Script to replace console.log/error/warn with logger in frontend files
# This ensures production-safe logging

echo "🔄 Replacing console.log/error/warn with logger..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
count=0

# Find all .jsx and .js files in frontend/src (excluding test files and node_modules)
find /Users/dorian/Documents/MASSTOCK/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -name "*.test.js" \
  ! -name "*.test.jsx" \
  ! -name "logger.js" | while read file; do

  # Check if file contains console.log, console.error, or console.warn
  if grep -q -E 'console\.(log|error|warn|info|debug)' "$file"; then
    echo -e "${BLUE}Processing:${NC} $file"

    # Check if file already imports logger
    if ! grep -q "import logger from" "$file"; then
      # Add logger import at the top after other imports
      # Find the last import line
      last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)

      if [ ! -z "$last_import_line" ]; then
        # Insert logger import after last import
        sed -i '' "${last_import_line}a\\
import logger from '@/utils/logger';\\
" "$file"
        echo -e "  ${GREEN}✓${NC} Added logger import"
      else
        # No imports found, add at the beginning
        sed -i '' "1i\\
import logger from '@/utils/logger';\\
\\
" "$file"
        echo -e "  ${GREEN}✓${NC} Added logger import at beginning"
      fi
    fi

    # Replace console.debug with logger.debug
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"

    # Replace console.log with logger.debug (most logs are debug level)
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"

    # Replace console.info with logger.info
    sed -i '' 's/console\.info(/logger.info(/g' "$file"

    # Replace console.warn with logger.warn
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"

    # Replace console.error with logger.error
    sed -i '' 's/console\.error(/logger.error(/g' "$file"

    ((count++))
    echo -e "  ${GREEN}✓${NC} Replaced console calls with logger"
    echo ""
  fi
done

echo ""
echo -e "${GREEN}✅ Done!${NC} Processed $count files"
echo ""
echo "Note: All console.* calls have been replaced with logger.*"
echo "In production (VITE_ENV=production), these logs will be suppressed."
