# UI Buttons Complete Solution

## Overview
The UI button generation feature allows users to describe their desired UI style in Step 5, and the system generates custom button images that automatically replace the default buttons in the slot machine interface.

## How It Works

### 1. Button Generation (Step 5)
- User enters a UI style description (e.g., "Modern", "Futuristic", "Classic")
- System generates a 1024x1024px button sheet with 5 buttons in a row
- Each button is 200x200px, positioned at specific coordinates
- Buttons are extracted from the sheet and saved individually

### 2. Button Extraction
- Spin button: Position (12, 412)
- Autoplay button: Position (212, 412)
- Menu button: Position (412, 412)
- Sound button: Position (612, 412)
- Settings button: Position (812, 412)

### 3. Fallback System
When the Node.js server isn't running (causing 500 errors), the system automatically uses blob/data URLs as fallback, ensuring buttons always display.

## Files Modified

### Core Implementation
1. **Step5_GameAssets.tsx**
   - Added UI button generation with OpenAI
   - Implemented button sheet extraction
   - Added blob URL fallback system

2. **SlotGameUI.tsx** (slot-animation)
   - Added customButtons prop support
   - Implemented custom button rendering
   - Added debug logging for button loading

3. **MobilePortraitUI.tsx & MobileLandscapeUI.tsx**
   - Added customButtons prop support
   - Implemented custom button rendering for mobile views

### Component Integration
4. **GridPreviewWrapper.tsx**
   - Passes customButtons from config to all child components
   - Handles both PhoneMockup and PremiumSlotPreview modes

5. **UnifiedGridPreview.tsx**
   - Added customButtons prop
   - Passes to appropriate UI components

6. **PremiumSlotPreview.tsx**
   - Added customButtons prop
   - Passes to Tier1PixiSlot

7. **Tier1PixiSlot.tsx**
   - Added customButtons prop
   - **Fixed import**: Now uses SlotGameUI from slot-animation (with customButtons support)
   - Passes customButtons to SlotGameUI

### Configuration
8. **vite.config.ts**
   - Added proxy configuration for /game-assets
   - Ensures development server can access saved button images

9. **server.cjs**
   - Enhanced error handling for game assets
   - Proper static file serving for /game-assets

## Usage

1. Navigate to Step 5 (Game Frame Designer)
2. Enter a UI style description
3. Click "Generate UI Buttons"
4. Buttons are automatically applied to the Premium Slot Preview

## Technical Details

### Button Props Structure
```typescript
customButtons?: {
  spinButton?: string;
  autoplayButton?: string;
  menuButton?: string;
  soundButton?: string;
  settingsButton?: string;
}
```

### Data Flow
1. Step5 generates buttons → saves to store as data URLs
2. GridPreviewWrapper reads from config.uiElements
3. Passes through component hierarchy:
   - GridPreviewWrapper → PremiumSlotPreview → Tier1PixiSlot → SlotGameUI
   - GridPreviewWrapper → PhoneMockup → UnifiedGridPreview → UI Components

### Fallback Mechanism
- Primary: Server paths (/game-assets/...)
- Fallback: Blob/data URLs (when server is down)
- Ensures buttons always display regardless of server status

## Server Requirements

For persistent button storage:
```bash
# Start both servers
./start-both-servers.bat  # Windows
./start-both-servers.sh   # Mac/Linux
```

Without server, buttons work but don't persist across refreshes.