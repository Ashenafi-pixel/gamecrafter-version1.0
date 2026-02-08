#\!/bin/bash

# Git Save Script for SlotAI Project
# Usage: ./git-save.sh "Your descriptive commit message"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if a commit message was provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}Error: Please provide a commit message${NC}"
  echo -e "Usage: ./git-save.sh \"Your descriptive commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo -e "${BLUE}=== SlotAI Git Save Script ===${NC}"
echo -e "${BLUE}Saving changes to GitHub...${NC}"

# Check for unstaged changes
echo -e "${BLUE}Checking for changes...${NC}"
git status -s

# Stage all changes
echo -e "${BLUE}Staging changes...${NC}"
git add .

# Commit with message
echo -e "${BLUE}Committing changes with message:${NC} $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push

# Show completion message
echo -e "${GREEN}✓ Changes saved successfully to GitHub\!${NC}"
echo -e "${GREEN}✓ Commit message:${NC} $COMMIT_MESSAGE"
echo -e "${BLUE}===========================${NC}"
