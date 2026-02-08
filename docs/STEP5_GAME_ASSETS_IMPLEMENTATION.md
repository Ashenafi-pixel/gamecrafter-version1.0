# Step 5: Game Assets Implementation

## Overview
Step 5 has been completely revised to provide comprehensive game asset customization with two modes: **Preset** and **Advanced**.

## Features Implemented

### Preset Tab (AI-Powered Asset Generation)

#### 1. Background Generation
- **AI Integration**: Uses GPT-image-1 to generate backgrounds
- **Multi-device Support**: Prompts specify both desktop (16:9) and mobile portrait (9:16) requirements
- **Theme-aware**: Incorporates the selected theme from Step 1
- **Upload Option**: Users can also upload their own backgrounds
- **Live Preview**: Shows current background in the preview panel

#### 2. Frame Generation
- **Frame Types**: 
  - Outer Frame: Surrounds the entire grid
  - Reel Frame: Vertical dividers between reels
  - Both: Combined outer and reel frames
- **Transparent PNG**: AI prompts specify transparent center area
- **Theme-specific**: Examples like forest roots, Egyptian borders, candy canes
- **Frame Adjustments**:
  - Scale: 80-120%
  - Horizontal Position: -50 to +50px
  - Vertical Position: -50 to +50px
  - Horizontal Stretch: 80-120%
  - Auto-Adjust button for optimal settings based on grid size

#### 3. UI Elements Generation
- **Button Set**: Spin, Autoplay, Menu, Sound, Settings
- **Style Options**: Modern, Classic, Minimal, Ornate, Futuristic, Retro
- **Transparent Icons**: AI generates PNG icons with transparency
- **Preview Grid**: Shows all 5 UI buttons in a preview grid

### Advanced Tab (Grid & Symbol Positioning)

#### 1. Symbol Square Grid Toggle
- **Show/Hide**: Toggle the blue square backgrounds behind symbols
- **Clean Look**: Hiding backgrounds creates a more modern appearance

#### 2. Grid Position Controls
- **Horizontal Offset**: -200 to +200px
  - Move grid left (negative) or right (positive)
  - Useful for adding meters or UI elements on sides
- **Vertical Offset**: -200 to +200px
  - Move grid up (negative) or down (positive)
  - Helps with UI element placement

#### 3. Grid Scale
- **Range**: 50-150%
- **Maintains Position**: Scales from center point
- **Use Case**: Scale down to 85% when adding side meters

#### 4. Reset Button
- Restores all advanced settings to defaults

## Technical Implementation

### State Management
```typescript
interface AssetConfig {
  // Background
  backgroundPath: string | null;
  backgroundStyle: string;
  backgroundPrompt: string;
  isGeneratingBackground: boolean;
  
  // Frame
  framePath: string | null;
  frameStyle: 'outer' | 'reel' | 'both';
  framePrompt: string;
  isGeneratingFrame: boolean;
  framePosition: { x: number; y: number };
  frameScale: number;
  frameStretch: { x: number; y: number };
  
  // UI Buttons
  uiButtonsPath: string | null;
  uiButtonsStyle: string;
  uiButtonsPrompt: string;
  isGeneratingUIButtons: boolean;
  uiElements: {
    spinButton?: string;
    autoplayButton?: string;
    menuButton?: string;
    soundButton?: string;
    settingsButton?: string;
  }
  
  // Advanced
  showSymbolGrid: boolean;
  gridPosition: { x: number; y: number };
  gridScale: number;
}
```

### AI Integration
- Uses `enhancedOpenaiClient.generateImage()`
- Size: 1024x1024 for all assets
- Quality: 'high'
- Detailed prompts for each asset type

### Store Updates
All settings are automatically saved to the game store and persist across steps.

## Example Use Cases

### Adding a Meter on the Left
1. Go to Advanced tab
2. Set Horizontal Offset to +100px
3. Set Grid Scale to 85%
4. Optionally hide Symbol Square Grid

### Forest Theme Frame
1. In Preset tab, select Frame
2. Choose "Outer Frame" style
3. Enter prompt: "Ancient forest roots and vines wrapping around the slot grid"
4. Click Generate

### Modern UI Buttons
1. Select "Modern" style in UI Elements
2. Add prompt: "Sleek, minimalist gaming buttons with subtle glow effects"
3. Generate to create matching button set

## Future Enhancements
- Individual button generation/extraction
- Multiple background variations
- Frame animation support
- Custom UI button positioning
- Grid animation effects when repositioned