# Temporal Dead Zone Fix

## Issue
When navigating to Step 3, the application crashed with:
```
ReferenceError: Cannot access 'symbols' before initialization
```

## Root Cause
The `symbols` variable was being referenced in a `useEffect` dependency array on line 101, but it wasn't defined until line 104 with `useMemo`. This is a classic JavaScript temporal dead zone error where a variable is accessed before it's declared.

## Solution
Reorganized the code to ensure proper declaration order:

1. **Moved symbols definition first** (line 64)
   ```typescript
   // Process symbols from config - MUST be defined before any useEffect that uses it
   const symbols = useMemo(() => {
     // ... symbol processing logic
   }, [config?.theme?.generated?.symbols, config?.symbols?.uploaded]);
   ```

2. **Placed PIXI initialization after** (line 126)
   ```typescript
   // Initialize PIXI app with hook
   const { canvasRef, isReady, updateGrid, ... } = usePixiApp({
     // ... configuration
   });
   ```

3. **Then added effects that depend on symbols** (line 146)
   ```typescript
   // Update grid when reels/rows change
   useEffect(() => {
     // ... uses symbols variable
   }, [reels, rows, isReady, updateGrid, symbols, updateSymbols]);
   ```

## Key Learning
In React components, the order of hooks matters! Variables must be defined before they can be referenced in dependency arrays. The correct order is:
1. useState declarations
2. useMemo/useCallback definitions
3. useEffect hooks that depend on the above

## Result
- ✅ No more temporal dead zone errors
- ✅ Step 3 loads without crashing
- ✅ Grid preview works properly
- ✅ All hooks have proper dependencies