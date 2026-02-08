# ClaudeCode Ground Rules & Best Practices

These rules should be strictly followed when working on this codebase:

## 1️⃣ Minimal Files, Focused Scope
✅ Fix the issue in-place within the relevant files.

🚫 Do not create extra files unless absolutely necessary.

🚫 No scattering logic across multiple new components or directories.

🔍 If a fix affects multiple parts of a file, consolidate it inside that single file.

## 2️⃣ No Bypass Fixes
❌ Do not hide or suppress layout bugs using conditional rendering or visibility hacks.

✅ Identify the real cause of the problem (CSS/layout/flex/grid/logic/etc.) and correct it properly.

🚫 Avoid "quick wins" or visual masking — fix the root issue.

## 3️⃣ UI Must Match Visual Expectations
✅ UI changes must visually match the instructions and screenshots provided.

❌ Do not introduce placeholders or alternate components unless explicitly allowed.

✅ Maintain full layout alignment, spacing, and scaling expectations — pixel-perfect behavior is preferred.

## 4️⃣ Respect Existing Architecture
✅ Reuse existing patterns/components when possible.

🚫 Do not re-abstract or create helper modules unless a fix requires it.

🚫 No unnecessary refactors or conversions.

## 5️⃣ Developer Experience
✅ Keep the code clear, consistent, and maintainable.

✅ Use className, flex, grid, and Tailwind conventions consistently.

❌ Avoid hardcoded magic numbers unless specifically justified.

✅ Prefer descriptive variable/class naming.

## 6️⃣ Communication
✅ Clearly document what was changed and why in your summary.

✅ If something cannot be implemented exactly, explain why and offer the closest high-quality alternative.

✅ If you're unsure, ask — don't guess or generate noise.

## 7️⃣ No Regressions
✅ Ensure fixes do not break previously working elements.

✅ Test responsiveness (landscape & portrait) after each layout update.

✅ Avoid layout jumpiness or overflow unless designed that way.

## Implementation Examples

### Good Example: Direct Fix in Existing File

```jsx
// Original component with layout issue
const Component = () => {
  // Fix the layout issue directly where it occurs
  useEffect(() => {
    const container = document.querySelector('.container');
    if (container) {
      // Apply direct fix to the actual problem
      container.style.display = 'flex';
      container.style.justifyContent = 'space-between';
    }
  }, []);

  return (
    <div className="container">
      <div className="left-panel">...</div>
      <div className="right-panel">...</div>
    </div>
  );
};
```

### Bad Example: Overcomplicating with New Files/Components

```jsx
// DON'T: Create unnecessary new component
const FixedLayoutWrapper = ({ children }) => {
  return <div className="fixed-layout-wrapper">{children}</div>;
};

// DON'T: Add unnecessary abstraction
const useLayoutFix = () => {
  useEffect(() => {
    // Overly complex logic...
  }, []);
};

// Original component with unnecessary complexity added
const Component = () => {
  useLayoutFix(); // Unnecessary abstraction
  
  return (
    <FixedLayoutWrapper> {/* Unnecessary wrapper */}
      <div className="container">
        <div className="left-panel">...</div>
        <div className="right-panel">...</div>
      </div>
    </FixedLayoutWrapper>
  );
};
```

## Reminder
Always address the root cause of issues directly in the affected files. Implement the simplest, most direct solution that correctly fixes the problem without introducing unnecessary complexity or dependencies.