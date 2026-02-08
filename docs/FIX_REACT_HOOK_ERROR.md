# Fix for React Hook Error

## Issue
Getting "Invalid hook call" errors and "Cannot read properties of null (reading 'useRef')" when loading premium.html.

## Root Cause
This typically happens when:
1. Multiple versions of React are loaded
2. Vite cache contains outdated dependencies
3. React and React DOM versions mismatch

## Solution

### 1. Clear Vite Cache and Reinstall
```bash
# Stop all running servers (Ctrl+C)

# Clear Vite cache
rm -rf .vite-cache
rm -rf node_modules/.vite

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### 2. Start Servers in Correct Order
```bash
# Terminal 1 - Start Node.js server first
node server.cjs

# Terminal 2 - Start Vite dev server
npm run dev
```

### 3. Access the App
- Go to http://localhost:5173/premium.html
- Clear browser cache (Ctrl+Shift+R)

## Alternative Fix (if above doesn't work)

### Update Vite Config
Add these optimizeDeps settings to vite.config.ts:
```typescript
optimizeDeps: {
  exclude: ['lucide-react'],
  include: ['react', 'react-dom', 'react-router-dom'],
  force: true
}
```

### Check for Duplicate React
Run this command to check for multiple React versions:
```bash
npm ls react react-dom
```

All versions should match (18.3.1 based on your package.json).

## Prevention
- Always stop and restart both servers after making significant changes
- Clear browser cache when seeing React errors
- Use `npm run build` to test production build if dev server has issues