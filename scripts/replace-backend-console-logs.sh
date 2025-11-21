#!/bin/bash

# Script to replace console.log/error/warn with logger in backend files
# This ensures production-safe logging with Winston

echo "🔄 Replacing console.log/error/warn with logger in backend..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Counter
count=0

# Find all .js files in backend/src (excluding test files and node_modules)
find /Users/dorian/Documents/MASSTOCK/backend/src -type f -name "*.js" \
  ! -path "*/node_modules/*" \
  ! -path "*/__tests__/*" \
  ! -name "*.test.js" \
  ! -name "logger.js" | while read file; do

  # Check if file contains console.log, console.error, or console.warn
  if grep -q -E 'console\.(log|error|warn|info|debug)' "$file"; then
    echo -e "${BLUE}Processing:${NC} $file"

    # Check if file already requires logger
    if ! grep -q "require.*logger" "$file" && ! grep -q "require.*config/logger" "$file"; then
      # Find the last require statement
      last_require_line=$(grep -n "^const.*require\|^const {.*} = require" "$file" | tail -1 | cut -d: -f1)

      if [ ! -z "$last_require_line" ]; then
        # Insert logger require after last require
        sed -i '' "${last_require_line}a\\
const { logger } = require('../config/logger');\\
" "$file"
        echo -e "  ${GREEN}✓${NC} Added logger require"
      else
        # No requires found, add at the beginning after any comments
        first_code_line=$(grep -n -v "^\/\*\|^\*\|^\/\/" "$file" | head -1 | cut -d: -f1)
        if [ ! -z "$first_code_line" ]; then
          sed -i '' "${first_code_line}i\\
const { logger } = require('../config/logger');\\
\\
" "$file"
          echo -e "  ${GREEN}✓${NC} Added logger require at beginning"
        fi
      fi
    fi

    # Replace console.log with logger.debug (most logs are debug level)
    log_count=$(grep -c "console\.log(" "$file")
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    if [ $log_count -gt 0 ]; then
      echo -e "  ${GREEN}✓${NC} Replaced $log_count console.log → logger.debug"
    fi

    # Replace console.debug with logger.debug
    debug_count=$(grep -c "console\.debug(" "$file")
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    if [ $debug_count -gt 0 ]; then
      echo -e "  ${GREEN}✓${NC} Replaced $debug_count console.debug → logger.debug"
    fi

    # Replace console.info with logger.info
    info_count=$(grep -c "console\.info(" "$file")
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
    if [ $info_count -gt 0 ]; then
      echo -e "  ${GREEN}✓${NC} Replaced $info_count console.info → logger.info"
    fi

    # Replace console.warn with logger.warn
    warn_count=$(grep -c "console\.warn(" "$file")
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    if [ $warn_count -gt 0 ]; then
      echo -e "  ${GREEN}✓${NC} Replaced $warn_count console.warn → logger.warn"
    fi

    # Replace console.error with logger.error
    error_count=$(grep -c "console\.error(" "$file")
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    if [ $error_count -gt 0 ]; then
      echo -e "  ${GREEN}✓${NC} Replaced $error_count console.error → logger.error"
    fi

    ((count++))
    echo ""
  fi
done

echo ""
echo -e "${GREEN}✅ Done!${NC} Processed $count files"
echo ""
echo -e "${YELLOW}Note:${NC} All console.* calls have been replaced with logger.*"
echo "In production (NODE_ENV=production), Winston will only log to files, not console."
