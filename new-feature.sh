#\!/bin/bash

# New Feature Branch Script for SlotAI Project
# Usage: ./new-feature.sh feature-name "Feature description"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if feature name was provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}Error: Please provide a feature name${NC}"
  echo -e "Usage: ./new-feature.sh feature-name \"Feature description\""
  exit 1
fi

FEATURE_NAME="$1"
DESCRIPTION="${2:-New feature: $FEATURE_NAME}"

echo -e "${BLUE}=== SlotAI New Feature Script ===${NC}"
echo -e "${BLUE}Creating new feature branch: ${GREEN}$FEATURE_NAME${NC}"

# Make sure we have the latest main branch
echo -e "${BLUE}Updating main branch...${NC}"
git checkout main
git pull

# Create and switch to new branch
echo -e "${BLUE}Creating branch: ${GREEN}$FEATURE_NAME${NC}"
git checkout -b "$FEATURE_NAME"

# Initial commit on the new branch
echo -e "${BLUE}Creating initial commit for feature...${NC}"
touch .feature-$FEATURE_NAME
git add .feature-$FEATURE_NAME
git commit -m "Start feature: $DESCRIPTION

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
echo -e "${BLUE}Pushing new branch to GitHub...${NC}"
git push -u origin "$FEATURE_NAME"

# Show completion message
echo -e "${GREEN}✓ Feature branch created successfully\!${NC}"
echo -e "${GREEN}✓ Branch name:${NC} $FEATURE_NAME"
echo -e "${GREEN}✓ Description:${NC} $DESCRIPTION"
echo -e "${BLUE}===========================${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Make changes to implement your feature"
echo -e "2. Use ${YELLOW}./git-save.sh \"Your commit message\"${NC} to save progress"
echo -e "3. When ready, create a pull request on GitHub to merge into main"
