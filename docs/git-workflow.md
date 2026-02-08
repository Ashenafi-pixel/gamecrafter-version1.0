# SlotAI Git Workflow Guide

This guide explains how to use Git with your SlotAI project to track changes and maintain version history.

## Basic Workflow

After Claude Code makes changes to your code:

1. Test the changes locally to make sure they work as expected
2. Run the git-save script to commit and push your changes to GitHub
3. Continue with your next request to Claude

## Using the git-save Script

A simple script has been created to make saving changes to GitHub easier:

### On Windows:
```
git-save.bat "Your descriptive commit message"
```

### On macOS/Linux:
```
./git-save.sh "Your descriptive commit message"
```

The commit message should briefly describe what changes were made, for example:
- "Swap order of theme and game type steps"
- "Add cache busting mechanism"
- "Fix symbol loading issue"

## Manual Git Commands

If you prefer to use git commands directly:

1. Stage changes: `git add .`
2. Commit changes: `git commit -m "Your descriptive message"`
3. Push to GitHub: `git push`

## Common Scenarios

### First-time Setup:
If this is your first time pushing to GitHub, you'll need a personal access token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token
2. Give it "repo" permissions
3. Copy the token and use it as your password when pushing

### Viewing History:
To see the history of changes:
- On GitHub: Go to https://github.com/arcadien2k6/slotai/commits/main
- Locally: Run `git log --oneline` in your terminal

### Creating Feature Branches:
For major changes, consider creating a branch:
```
git checkout -b feature-name
# Make changes
git add .
git commit -m "Description of changes"
git push -u origin feature-name
```

### Benefits of Using Git:
- Track all changes to your code
- Revert to previous versions if needed
- Document the development process
- Collaborate with others safely
- Back up your code remotely
