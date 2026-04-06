#!/bin/bash

# AI Radiologist Landing Page Installer
# This script copies all necessary files to your Next.js project

set -e  # Exit on error

echo "🚀 AI Radiologist Landing Page Installer"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the landing directory
if [ ! -f "README.md" ] || [ ! -d "components" ]; then
    echo -e "${RED}❌ Error: Please run this script from the 'landing' directory${NC}"
    exit 1
fi

# Prompt for target directory
echo -e "${BLUE}📁 Enter the path to your Next.js project:${NC}"
read -e -p "Target directory: " TARGET_DIR

# Expand tilde to home directory
TARGET_DIR="${TARGET_DIR/#\~/$HOME}"

# Validate target directory
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}❌ Error: Directory '$TARGET_DIR' does not exist${NC}"
    exit 1
fi

if [ ! -f "$TARGET_DIR/package.json" ]; then
    echo -e "${YELLOW}⚠️  Warning: No package.json found. Is this a Next.js project?${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ Target directory: $TARGET_DIR${NC}"
echo ""

# Confirm installation
echo -e "${YELLOW}This will copy the following to your project:${NC}"
echo "  • Components (landing-page.tsx, demo-animation.tsx)"
echo "  • Styles (globals.css, tokens.css)"
echo "  • Demo screenshots (14 images)"
echo "  • Tailwind config (will create backup)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installation cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}📦 Installing files...${NC}"
echo ""

# Create directories
echo "Creating directories..."
mkdir -p "$TARGET_DIR/components/landing"
mkdir -p "$TARGET_DIR/styles"
mkdir -p "$TARGET_DIR/public/demo-screenshots"

# Copy components
echo -e "${GREEN}→${NC} Copying components..."
cp -v components/landing/landing-page.tsx "$TARGET_DIR/components/landing/"
cp -v components/landing/demo-animation.tsx "$TARGET_DIR/components/landing/"

# Copy screenshots
echo -e "${GREEN}→${NC} Copying demo screenshots..."
cp -v public/demo-screenshots/*.png "$TARGET_DIR/public/demo-screenshots/" 2>/dev/null || true

# Backup and copy styles
echo -e "${GREEN}→${NC} Copying styles..."
if [ -f "$TARGET_DIR/styles/globals.css" ]; then
    echo -e "${YELLOW}  ⚠️  Backing up existing globals.css${NC}"
    cp "$TARGET_DIR/styles/globals.css" "$TARGET_DIR/styles/globals.css.backup"
fi
if [ -f "$TARGET_DIR/styles/tokens.css" ]; then
    echo -e "${YELLOW}  ⚠️  Backing up existing tokens.css${NC}"
    cp "$TARGET_DIR/styles/tokens.css" "$TARGET_DIR/styles/tokens.css.backup"
fi

cp -v styles/globals.css "$TARGET_DIR/styles/"
cp -v styles/tokens.css "$TARGET_DIR/styles/"

# Backup and copy Tailwind config
echo -e "${GREEN}→${NC} Copying Tailwind configuration..."
if [ -f "$TARGET_DIR/tailwind.config.ts" ]; then
    echo -e "${YELLOW}  ⚠️  Backing up existing tailwind.config.ts${NC}"
    cp "$TARGET_DIR/tailwind.config.ts" "$TARGET_DIR/tailwind.config.ts.backup"
    echo -e "${YELLOW}  ⚠️  You will need to merge configs manually!${NC}"
else
    cp -v tailwind.config.ts "$TARGET_DIR/"
fi

# Copy documentation
echo -e "${GREEN}→${NC} Copying documentation..."
cp -v README.md "$TARGET_DIR/LANDING-PAGE-README.md"
cp -v SETUP-CHECKLIST.md "$TARGET_DIR/LANDING-PAGE-CHECKLIST.md"

echo ""
echo -e "${GREEN}✅ Files copied successfully!${NC}"
echo ""

# Check for lucide-react dependency
echo -e "${BLUE}🔍 Checking dependencies...${NC}"
if grep -q "lucide-react" "$TARGET_DIR/package.json"; then
    echo -e "${GREEN}✅ lucide-react is already installed${NC}"
else
    echo -e "${YELLOW}⚠️  lucide-react not found in package.json${NC}"
    echo ""
    echo "Would you like to install it now?"
    read -p "(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$TARGET_DIR"

        # Detect package manager
        if [ -f "pnpm-lock.yaml" ]; then
            echo "Using pnpm..."
            pnpm add lucide-react
        elif [ -f "yarn.lock" ]; then
            echo "Using yarn..."
            yarn add lucide-react
        elif [ -f "bun.lockb" ]; then
            echo "Using bun..."
            bun add lucide-react
        else
            echo "Using npm..."
            npm install lucide-react
        fi

        echo -e "${GREEN}✅ lucide-react installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Remember to install lucide-react later:${NC}"
        echo "   npm install lucide-react"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Installation complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Review LANDING-PAGE-README.md in your project"
echo "2. Check LANDING-PAGE-CHECKLIST.md for setup steps"
echo "3. If you had existing tailwind.config.ts, merge it manually"
echo "4. Update routes in landing-page.tsx (/sign-up, /sign-in, /billing)"
echo "5. Import the LandingPage component in your route:"
echo ""
echo -e "${YELLOW}   import { LandingPage } from '@/components/landing/landing-page';${NC}"
echo ""
echo "6. Test the landing page in development mode"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
