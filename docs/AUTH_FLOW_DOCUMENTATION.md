# SlotAI Authentication Flow & Routing Documentation

## Fix Round 2024-05-17

### Files Touched
- `App.tsx` - Updated root routing logic with RootRedirect component
- `SlotCreator.tsx` - Enhanced URL parameter handling and data loading
- `index.html` - Modified emergency script loading to prevent interference with routing
- `main.tsx` - Fixed script loading issues causing double bootstrapping

### Problems Found
1. **Direct localStorage access during render** - Using localStorage.getItem in the JSX render caused React hydration issues
2. **Emergency scripts were interfering with route rendering** - Scripts would run on all routes including login
3. **Double loading of main.tsx** - Both static and dynamic script tags loaded the app
4. **Navigation conflicts between React Router and emergency navigation** - Multiple scripts handling route changes
5. **SlotCreator loading incorrect steps** - URL parameters weren't properly applied to Zustand store

### Changes Made
1. **Created RootRedirect component** - Properly handles root route redirects with useEffect
2. **Conditional emergency script loading** - Scripts now check pathname and skip login route
3. **Removed duplicate script loading** - Fixed dynamic script creation in index.html
4. **Enhanced SlotCreator parameter handling** - Better game and template loading from URL params
5. **Added module type to all scripts** - Proper ESM imports for all emergency scripts
6. **Added login page protection** - Emergency scripts now skip execution on login page

### Confirmation of Working Flow
- Login screen loads correctly at /login when no password exists
- After entering "lamadrequetepario", user is redirected to /dashboard
- "New Game" buttons correctly navigate to /slot-creator?step=1&force=true 
- Route guards properly protect authenticated routes
- Emergency scripts don't interfere with normal routing operation
- Build successfully completes with npm run build

## Overview
This document outlines the authentication flow and routing implementation in the SlotAI application. The changes include password-based authentication, route protection, and a new navigation system using React Router.

## Changes Summary

| File | Description of Change |
| --- | --- |
| App.tsx | Added React Router with protected routes and authentication guard, fixed lazy loading |
| LoginScreen.tsx | Updated to use React Router navigation and password-based auth |
| SlotCreator.tsx | Created new component to handle slot creation with URL parameters |
| EnhancedGameCrafterDashboard.tsx | Updated to use React Router navigation for game creation |
| main.tsx | Modified to use App component with routing |
| index.html | Added type="module" to scripts for proper bundling |
| EMERGENCY-CLEANUP.js | Added safety patches for removeChild and observer disconnect |

## Authentication Flow

1. **Initial Load**:
   - App checks for password in localStorage with key "slotai_password" and value "lamadrequetepario"
   - If not found, redirects to `/login` page
   - If found, allows access to protected routes

2. **Login Screen**:
   - User enters password "lamadrequetepario"
   - On success, sets localStorage and redirects to `/dashboard`
   - Preserves destination URL for post-login redirect

3. **Route Protection**:
   - All routes except `/login` are protected by the `AuthGuard` component
   - AuthGuard checks for valid password in localStorage
   - If missing, redirects to login with the return URL

## Routing Structure

The app now uses React Router with the following routes:

- `/login` - Login screen (public)
- `/dashboard` - Main dashboard (protected)
- `/slot-creator` - Slot game creation (protected)
- `/magic_box` - Experimental playground (protected)
- `/canvas_demo` - Canvas testing (protected)
- `/` - Default route that redirects to dashboard or login based on auth state

## Step Navigation

1. **Step Parameters**:
   - URL parameters control step navigation (e.g., `/slot-creator?step=1&force=true`)
   - Steps are stored in Zustand store but initialized from URL

2. **Dashboard to Creator**:
   - "Create Slot Game" button navigates to `/slot-creator?step=1&force=true`
   - Game templates and existing games navigate with additional parameters

3. **Step Control**:
   - SlotCreator component reads step from URL on mount
   - Updates Zustand store to match URL parameters
   - Handles authentication checks before rendering

## Emergency System Integration

1. **Recovery Detection**:
   - Added safety patches to prevent DOM manipulation errors
   - Ensure cleanup observers are disconnected when recovery is complete

2. **Navigation Protection**:
   - Added checks to prevent emergency systems from interfering with React Router
   - Provided fallback navigation for emergency cases

## Usage Notes

1. **Creating a New Game**:
   - Click "New Game" button on dashboard to navigate to `/slot-creator?step=1&force=true`
   - This initializes the Zustand store and sets the appropriate step

2. **Resuming Existing Games**:
   - Click on existing game to navigate to `/slot-creator?step=1&force=true&game={gameId}`
   - This loads the game data and navigates to the appropriate step

3. **Logging Out**:
   - Click "Sign Out" in user dropdown
   - This removes the password from localStorage and redirects to login

4. **Protected Access**:
   - Attempting to access protected routes directly will redirect to login
   - After login, user is redirected back to the requested route

## Build Optimizations

1. **Script Loading**:
   - Added `type="module"` to all emergency scripts in index.html
   - This resolves Vite bundling warnings and ensures proper build handling
   - Scripts retain their load order but work with the module system

2. **Lazy Loading**:
   - Fixed lazy loading of MagicBoxPage and GameCanvasDemo components
   - Used proper Suspense wrapping for lazy-loaded components
   - Implemented React.createElement pattern for dynamic imports in routes