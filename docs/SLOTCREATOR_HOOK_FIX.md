# SlotCreator Component Hook Fix

## Issue Summary

The `SlotCreator.tsx` component contained a critical issue that violated React's "Rules of Hooks". The component was conditionally calling `useEffect()` based on the result of `hasActiveGameSession()`:

```tsx
// Original problematic code
if (!hasActiveGameSession()) {
  useEffect(() => {
    navigate('/home');
  }, [navigate]);
  
  return <LoadingSpinner />;
}
```

This approach violated a fundamental React rule that hooks must be called in the same order on every render and cannot be called conditionally. This was causing the error:

> "Rendered more hooks than during the previous render."

## Changes Made

The component has been refactored to:

1. Move all React hooks to the top level of the component
2. Use state variables to track session validity
3. Perform session validation inside a useEffect
4. Conditionally render the appropriate UI based on validation state

```tsx
// Track session validity state to handle UI rendering properly
const [sessionCheckComplete, setSessionCheckComplete] = useState(false);
const [isValidSession, setIsValidSession] = useState(false);

// Check for active game session and redirect if invalid - always in a useEffect
useEffect(() => {
  const checkGameSession = () => {
    // Session validation logic...
  };

  // Run the check and update state based on result
  const isValid = checkGameSession();
  setIsValidSession(isValid);
  setSessionCheckComplete(true);

  // If session is invalid, navigate to home
  if (!isValid) {
    console.error('No active game session found, redirecting to home');
    navigate('/home');
  }
}, [config, navigate]);

// Show loading spinner while checking session or if invalid but not yet redirected
if (!sessionCheckComplete || !isValidSession) {
  return <LoadingSpinner />;
}
```

## Why This Approach Is Correct

### 1. Respects React Rules of Hooks

The refactored code follows React's rules of hooks by:
- Declaring all hooks at the top level of the component
- Ensuring hooks are called on every render in the same order
- Not placing hooks inside conditional statements or loops

### 2. Proper State Management

The component now uses state to track:
- Whether the session check has completed (`sessionCheckComplete`)
- Whether the session is valid (`isValidSession`)

This allows the component to properly determine what UI to render based on the validation state.

### 3. Cleaner Separation of Concerns

The refactored code separates:
- State initialization and hook declarations
- Business logic for session validation 
- Rendering logic based on validation state

### 4. Better UX During Session Check

The loading spinner is shown in two scenarios:
- While the session check is in progress (`!sessionCheckComplete`)
- When the session is invalid and the user is about to be redirected (`!isValidSession`)

This ensures users always see appropriate feedback rather than a blank screen.

### 5. Proper Navigation Handling

Navigation now happens inside the useEffect hook, which is the correct place for side effects like redirects.

## Testing Guidelines

To verify this fix:
1. Start from the dashboard and navigate to create a new slot game - should work normally
2. Try accessing `/new-game?step=0` directly without a valid session - should redirect to home
3. Check browser console - should not see React hook errors
4. Verify that a loading spinner appears briefly during validation

## Notes for Developers

This pattern should be followed elsewhere in the codebase when dealing with conditional navigation and UI rendering based on validation results:

1. Declare state variables at the top level to track validation status
2. Perform validation in useEffect hooks, not during render
3. Update state based on validation results
4. Render different UI components based on the state

Remember that React hooks must never be conditionally called or placed inside loops.