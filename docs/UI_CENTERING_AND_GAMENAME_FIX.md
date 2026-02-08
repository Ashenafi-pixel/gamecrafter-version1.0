# UI Centering and Game Name Fix

## Changes Made

### 1. Fixed Balance UI Shifting
Added minimum widths to prevent UI elements from shifting when numbers change:
- **BALANCE**: `min-w-[100px]` - Prevents shift from 1000.00 to 999.00
- **BET**: `min-w-[80px]` - Consistent width for bet amounts
- **WIN**: `min-w-[80px]` - Consistent width for win amounts

### 2. Centered Spin Controls
Changed the layout from flexbox with `justify-between` to CSS Grid:
- Used `grid grid-cols-3` to create three equal columns
- Left column: Menu, Info, and BET display
- Center column: AutoPlay, SPIN, and QuickSpin buttons (with `justify-center`)
- Right column: WIN, BALANCE, and Sound toggle (with `justify-end`)

This ensures the spin controls are perfectly centered regardless of content in other sections.

### 3. Game Name from Step 1
Updated the game name source to use the actual user input:
```javascript
const gameName = config?.gameInfo?.name || config?.theme?.name || 'Slot Game';
```

The priority order is:
1. `config.gameInfo.name` - The name entered by the user in Step 1
2. `config.theme.name` - Fallback to theme name
3. `'Slot Game'` - Default if nothing is set

## Result
- Balance/Bet/Win displays no longer shift when digit count changes
- Spin controls (AutoPlay, SPIN, QuickSpin) are perfectly centered
- Game name shows the actual name entered by the user in Step 1
- Clean, professional layout with proper alignment