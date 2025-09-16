#!/bin/bash

# SteadyStream TV GitHub Setup Script
echo "🚀 Setting up SteadyStream TV GitHub Repository"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking current git status...${NC}"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git not initialized. Initializing now...${NC}"
    git init
else
    echo -e "${GREEN}✅ Git repository already initialized${NC}"
fi

# Check current remotes
echo -e "${BLUE}🔗 Checking git remotes...${NC}"
if git remote get-url origin &> /dev/null; then
    CURRENT_REMOTE=$(git remote get-url origin)
    echo -e "${GREEN}✅ Current remote: ${CURRENT_REMOTE}${NC}"

    if [[ "$CURRENT_REMOTE" != *"steadystreamtv"* ]]; then
        echo -e "${YELLOW}⚠️  Current remote doesn't match SteadyStream TV repository${NC}"
        echo -e "${YELLOW}🔄 Updating remote to SteadyStream TV repository...${NC}"
        git remote set-url origin https://github.com/Travsingletary/steadystreamtv.git
    fi
else
    echo -e "${YELLOW}⚠️  No remote origin found. Adding SteadyStream TV repository...${NC}"
    git remote add origin https://github.com/Travsingletary/steadystreamtv.git
fi

# Create .gitignore if it doesn't exist or update it
echo -e "${BLUE}📝 Setting up .gitignore...${NC}"
cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production
.env.*.local

# Build outputs
dist/
build/
*.tgz
*.tar.gz

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# next.js build output
.next

# Nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Angular specific
/dist
/tmp
/out-tsc
/bazel-out

# Angular CLI
.angular/

# Tauri specific
src-tauri/target/

# Test outputs
/coverage
/.nyc_output

# e2e
/e2e/*.js
/e2e/*.map

# System Files
.DS_Store
Thumbs.db

# Supabase
.branches
.temp
.vscode
supabase/.env

# Local development
test-nowpayments.js
*.log
EOF

echo -e "${GREEN}✅ .gitignore updated${NC}"

# Create GitHub-specific documentation structure
echo -e "${BLUE}📚 Organizing documentation...${NC}"

# Create docs directory
mkdir -p docs

# Move documentation files to docs directory
if [ -f "STEADYSTREAM_README.md" ]; then
    mv STEADYSTREAM_README.md README.md
    echo -e "${GREEN}✅ Main README updated for SteadyStream TV${NC}"
fi

if [ -f "LOVABLE_INTEGRATION.md" ]; then
    cp LOVABLE_INTEGRATION.md docs/
    echo -e "${GREEN}✅ Lovable integration guide copied to docs/${NC}"
fi

if [ -f "DEPLOYMENT.md" ]; then
    cp DEPLOYMENT.md docs/
    echo -e "${GREEN}✅ Deployment guide copied to docs/${NC}"
fi

# Create additional documentation files
cat > docs/API.md << 'EOF'
# 🔌 SteadyStream TV API Documentation

## Overview
Complete API documentation for the SteadyStream TV automated IPTV onboarding platform.

## Base URLs
- **Production**: `https://steadystreamtv.com/api`
- **Development**: `http://localhost:4200/api`
- **Webhook**: `https://ojueihcytxwcioqtvwez.supabase.co/functions/v1`

## Authentication
All API requests require proper authentication via Supabase JWT tokens or API keys.

## Endpoints

### Payment Endpoints
- `POST /payment/create` - Create new crypto payment
- `GET /payment/:id` - Get payment status
- `POST /webhook/nowpayments` - Payment confirmation webhook

### Subscription Endpoints
- `GET /subscription` - Get user subscription
- `POST /subscription` - Create new subscription
- `PUT /subscription/:id` - Update subscription

### User Endpoints
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `GET /user/iptv-accounts` - Get IPTV credentials

## Response Formats
All endpoints return JSON responses with consistent error handling.

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user

## Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error
EOF

cat > docs/CONTRIBUTING.md << 'EOF'
# 🤝 Contributing to SteadyStream TV

## Getting Started
1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/amazing-feature`

## Development Setup
See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions.

## Coding Standards
- Use TypeScript for all new code
- Follow Angular style guide
- Write tests for new features
- Update documentation

## Submitting Changes
1. Ensure all tests pass
2. Update documentation if needed
3. Create a pull request with clear description
4. Respond to code review feedback

## Code of Conduct
Be respectful, inclusive, and professional in all interactions.
EOF

echo -e "${GREEN}✅ Documentation structure created${NC}"

# Check if files are ready for commit
echo -e "${BLUE}📦 Preparing files for commit...${NC}"

# Add all files to staging
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    echo -e "${GREEN}✅ Files staged for commit${NC}"
    echo -e "${BLUE}📄 Files to be committed:${NC}"
    git diff --staged --name-only
fi

# Create commit message
COMMIT_MSG="🚀 Initial SteadyStream TV implementation

✨ Features:
- Cryptocurrency payment processing (300+ coins)
- Automated IPTV account provisioning via MegaOTT
- Real-time subscription dashboard
- Supabase backend integration
- NOWPayments webhook automation
- Email notifications with credentials

🔧 Technical:
- Angular 19 frontend
- Supabase Edge Functions
- NOWPayments API integration
- MegaOTT reseller API
- Comprehensive documentation

🎯 Ready for production deployment"

echo -e "${BLUE}💬 Commit message preview:${NC}"
echo "$COMMIT_MSG"
echo ""

# Ask for confirmation before committing
echo -e "${YELLOW}❓ Ready to commit and push to GitHub? (y/N)${NC}"
read -r CONFIRM

if [[ $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📤 Committing changes...${NC}"
    git commit -m "$COMMIT_MSG"

    echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
    git push -u origin main

    echo -e "${GREEN}🎉 Successfully pushed to GitHub!${NC}"
    echo -e "${BLUE}🔗 Repository: https://github.com/Travsingletary/steadystreamtv${NC}"

    # Open GitHub repository
    echo -e "${YELLOW}🌐 Opening repository in browser...${NC}"
    open https://github.com/Travsingletary/steadystreamtv || echo "Please visit: https://github.com/Travsingletary/steadystreamtv"

else
    echo -e "${YELLOW}⏸️  Commit cancelled. Files are staged and ready when you're ready to commit.${NC}"
    echo -e "${BLUE}💡 To commit later, run: git commit -m 'Your message' && git push -u origin main${NC}"
fi

echo -e "${GREEN}✅ GitHub setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. Visit: https://github.com/Travsingletary/steadystreamtv"
echo -e "2. Set up GitHub repository settings"
echo -e "3. Configure branch protection rules"
echo -e "4. Set up GitHub Actions (optional)"
echo -e "5. Deploy to production"
echo ""
echo -e "${GREEN}🎯 Your SteadyStream TV repository is ready for production!${NC}"
EOF

chmod +x setup-github.sh