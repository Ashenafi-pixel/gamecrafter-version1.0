# Temporal Dead Zone Fix - GridPreviewWrapper

## Error
```
GridPreviewWrapper.tsx:35 Uncaught ReferenceError: Cannot access 'stepSource' before initialization
```

## Root Cause
In JavaScript/TypeScript, variables declared with `const` and `let` exist in a "temporal dead zone" from the start of the block until the declaration is processed. 

The error occurred because:
1. `stepSource` was being used in a `useEffect` on line 34
2. But `stepSource` wasn't declared until line 38
3. Even though the useEffect wouldn't run until after render, React still needs to read the dependency array during component initialization

## The Fix
Moved the `stepSource` declaration before the useEffect that uses it:

```typescript
// BEFORE (Error):
// Debug logging
React.useEffect(() => {
  console.log('[GridPreviewWrapper] Grid config:', { reels, rows, currentStep, stepSource });
}, [reels, rows, currentStep, stepSource]); // ERROR: stepSource not yet declared!

// Determine step source based on current step
const stepSource = currentStep === 2 ? 'step3' : ...

// AFTER (Fixed):
// Determine step source based on current step
const stepSource = currentStep === 2 ? 'step3' : ...

// Debug logging
React.useEffect(() => {
  console.log('[GridPreviewWrapper] Grid config:', { reels, rows, currentStep, stepSource });
}, [reels, rows, currentStep, stepSource]); // OK: stepSource is now declared
```

## Lesson Learned
Always declare variables before using them in React hooks, even in dependency arrays. The dependency array is evaluated during component initialization, not when the effect runs.

## Prevention
- Follow a consistent order in React components:
  1. State declarations (useState)
  2. Derived values (const calculations)
  3. Effects (useEffect)
  4. Event handlers
  5. Return JSX