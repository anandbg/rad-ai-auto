#!/bin/bash
# init.sh - Environment setup script for AI Radiologist
# Run this script to set up and start the development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AI Radiologist - Development Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Creating new project in /app directory...${NC}"

    # Check if /app exists
    if [ ! -d "app" ]; then
        mkdir -p app
        cd app

        # Initialize Next.js project
        echo -e "${BLUE}Initializing Next.js 14 project with TypeScript...${NC}"
        npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm

        # Install additional dependencies
        echo -e "${BLUE}Installing additional dependencies...${NC}"
        pnpm add @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-switch \
            @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-select \
            @supabase/ssr @supabase/supabase-js \
            framer-motion lucide-react stripe zod \
            clsx tailwind-merge

        # Install dev dependencies
        pnpm add -D @playwright/test vitest @vitest/coverage-v8

        cd ..
    fi
fi

# Check for Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js 20 or higher is required. Current version: $(node -v)${NC}"
    echo -e "${YELLOW}Please install Node.js 20+ from https://nodejs.org/${NC}"
    exit 1
fi
echo -e "${GREEN}Node.js version: $(node -v)${NC}"

# Check for pnpm
echo -e "${BLUE}Checking for pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}pnpm version: $(pnpm -v)${NC}"

# Navigate to app directory if it exists
if [ -d "app" ] && [ -f "app/package.json" ]; then
    cd app
fi

# Install dependencies
echo ""
echo -e "${BLUE}Installing dependencies...${NC}"
pnpm install

# Check for .env.local file
echo ""
echo -e "${BLUE}Checking environment configuration...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local template...${NC}"
    cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_POOLER_URL=your_pooler_url

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL_GENERATE=gpt-4o
OPENAI_MODEL_WHISPER=whisper-1

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID_PLUS=price_id_for_plus_tier
STRIPE_PRICE_ID_PRO=price_id_for_pro_tier

# Storage Configuration
TRANSCRIBE_STORAGE_BUCKET=audio-temp
TRANSCRIBE_ENCRYPTION_KEY=your_encryption_key

# Redis/Upstash Configuration
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Application
NODE_ENV=development
EOF
    echo -e "${YELLOW}Please update .env.local with your actual values!${NC}"
else
    echo -e "${GREEN}.env.local found${NC}"
fi

# Run type checking
echo ""
echo -e "${BLUE}Running TypeScript type check...${NC}"
pnpm typecheck || echo -e "${YELLOW}TypeScript errors found - will be fixed during development${NC}"

# Install Playwright browsers if needed
echo ""
echo -e "${BLUE}Setting up Playwright...${NC}"
if [ ! -d "node_modules/.cache/ms-playwright" ]; then
    pnpm exec playwright install chromium
fi

# Start development server
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Starting development server...${NC}"
echo ""
echo -e "The application will be available at:"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "Other useful commands:"
echo -e "  ${YELLOW}pnpm dev${NC}           - Start development server"
echo -e "  ${YELLOW}pnpm build${NC}         - Build for production"
echo -e "  ${YELLOW}pnpm test${NC}          - Run unit tests"
echo -e "  ${YELLOW}pnpm test:e2e${NC}      - Run E2E tests"
echo -e "  ${YELLOW}pnpm lint${NC}          - Run linter"
echo -e "  ${YELLOW}pnpm typecheck${NC}     - Check TypeScript types"
echo ""

# Start the dev server
pnpm dev
