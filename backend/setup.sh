#!/bin/bash

# MasStock Backend Setup Script
# Automated setup for local development

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║         MasStock Backend - Setup Script                  ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version OK: $(node -v)${NC}"

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm version OK: $(npm -v)${NC}"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create logs directory
echo ""
echo "Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"

# Check for .env file
echo ""
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT: Edit .env file with your Supabase credentials${NC}"
    echo ""
    echo "Required variables:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo "  - REDIS_HOST (if using external Redis)"
    echo ""
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check Redis
echo ""
echo "Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠ Redis not running locally${NC}"
        echo "  Start Redis with: redis-server"
        echo "  Or use cloud Redis (Upstash, Railway)"
    fi
else
    echo -e "${YELLOW}⚠ Redis not installed locally${NC}"
    echo "  Install Redis or use cloud Redis"
fi

# Test Supabase connection
echo ""
echo "Testing Supabase connection..."
if [ -f .env ]; then
    source .env
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
        echo -e "${YELLOW}⚠ Supabase credentials not configured in .env${NC}"
    else
        echo -e "${GREEN}✓ Supabase credentials found in .env${NC}"
        echo "  You can test connection after running: npm start"
    fi
else
    echo -e "${YELLOW}⚠ Configure .env file first${NC}"
fi

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  Setup Complete!                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure Supabase:"
echo "   - Create project at supabase.com"
echo "   - Run migrations (see DEPLOYMENT.md)"
echo "   - Update .env with credentials"
echo ""
echo "2. Start Redis (if local):"
echo "   redis-server"
echo ""
echo "3. Start API server:"
echo "   npm run dev"
echo ""
echo "4. Start worker (in another terminal):"
echo "   npm run worker"
echo ""
echo "5. Test API:"
echo "   curl http://localhost:3000/health"
echo ""
echo "6. View API docs:"
echo "   http://localhost:3000/api-docs"
echo ""
echo "For detailed instructions, see:"
echo "  - README.md (setup guide)"
echo "  - DEPLOYMENT.md (production deployment)"
echo "  - API_TESTING.md (endpoint examples)"
echo ""
