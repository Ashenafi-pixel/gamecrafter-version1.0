#!/bin/bash

# Simple script to push to GitHub with authentication
# Usage: ./push-github.sh "Your commit message"

# Check if commit message was provided
if [ -z "$1" ]; then
  echo "Error: Please provide a commit message"
  echo "Usage: ./push-github.sh \"Your commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

# Stage all changes
git add .

# Commit with message
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub with credentials
echo "Enter your GitHub username:"
read USERNAME

echo "Enter your GitHub personal access token (will not be displayed):"
read -s TOKEN

# Use the credentials for this push
git push https://$USERNAME:$TOKEN@github.com/arcadien2k6/slotai.git

echo "Push completed!"