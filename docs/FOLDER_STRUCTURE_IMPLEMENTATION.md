# Folder Structure Implementation

## Overview
This implementation creates an organized folder structure for each game, automatically organizing assets by type. When a user selects a theme and proceeds to the next step, the system creates a game-specific folder structure that follows a consistent naming pattern. The folders are created in the `/public/game-assets` directory of your project.

## Folder Structure

```
/public/game-assets/
  /{gameId}_{YYYYMMDD}/      # Game-specific folder with date format
    /symbols/             # Symbol images
      /wild/             # Wild symbols
      /scatter/          # Scatter symbols
      /high/             # High-paying symbols
      /medium/           # Medium-paying symbols
      /low/              # Low-paying symbols
    /background/         # Background images
    /frame/              # Frame assets
    /ui/                 # UI elements
    /sound/              # Sound effects and music
      /effects/          # Sound effects
      /music/            # Background music
    /gameconfig/         # Game configuration files
      config.json       # Basic game metadata
```

## Implementation Details

### 1. Server-Side Implementation
Enhanced the Express server with folder creation and management capabilities:

- **Create Folders Endpoint**: Added `/create-folders` endpoint that creates a standard folder structure for a game ID
- **Check Folders Endpoint**: Added `/check-folders` endpoint to verify if a game's folder structure exists
- **Smart Asset Categorization**: Enhanced the `/save-image` endpoint to automatically place assets in the appropriate subdirectories based on asset type
- **Metadata Storage**: Automatically creates a config.json file in the gameconfig folder with basic game metadata

### 2. Client-Side Implementation

#### Folder Creation Utility
Enhanced the `folderCreator.ts` utility with:
- More detailed folder structure with subdirectories for different asset types
- Proper error handling and fallbacks
- Functions to ensure folders exist before attempting to save assets

#### Step 1: Theme Selection Integration
Modified `EnhancedStep1_ThemeSelection.tsx` to:
- Create folder structure when moving from Step 1 to Step 2
- Generate a consistent game ID format: `{theme-name}_{YYYYMMDD}`
- Store the game ID in localStorage for use across components
- Ensure the folder structure exists before proceeding

#### Image Saving Enhancements
Enhanced the server's image saving functionality to:
- Categorize assets based on their type (wild, scatter, high, medium, low)
- Save to the appropriate subdirectory automatically
- Maintain consistent file naming for easy retrieval

## Usage Flow

1. **Theme Selection (Step 1)**
   - User selects a theme (e.g., "Ancient Egypt")
   - System generates a game ID (e.g., "ancient-egypt_20250523")
   - When user clicks "Next", folder structure is created on the server

2. **Symbol Generation (Step 4)**
   - Symbols are generated and saved to the appropriate subdirectories
   - Wild symbols → `/symbols/wild/`
   - Scatter symbols → `/symbols/scatter/`
   - High symbols → `/symbols/high/`
   - etc.

3. **Background Creation (Step 5)**
   - Background images are saved to `/background/` directory

4. **Frame Design (Step 5)**
   - Frame assets are saved to `/frame/` directory

5. **Game Configuration**
   - Game configuration and settings are saved to `/gameconfig/` directory

## Benefits

1. **Organized Asset Management**: Clear organization makes it easier to find and manage assets
2. **Consistent Structure**: Every game follows the same structure, making automation easier
3. **Better Categorization**: Different asset types are properly categorized
4. **Simplified Asset Retrieval**: Assets can be easily retrieved by their type and category
5. **Future-Proof Design**: Structure supports additional asset types and categorizations

## Testing

To test the implementation:
1. Select "Ancient Egypt" theme in Step 1
2. Click "Next" to proceed to Step 2
3. Navigate to Step 4 and generate symbols
4. Verify that symbols are saved in the correct folders
5. Navigate to Step 5, generate background and frame
6. Verify that assets are saved in the correct folders

The server should create the following folder structure:
```
/public/game-assets/ancient-egypt_20250523/
  /symbols/
    /wild/
    /scatter/
    /high/
    /medium/
    /low/
  /background/
  /frame/
  /ui/
  /sound/
    /effects/
    /music/
  /gameconfig/
    config.json
```

All generated assets should be saved to their appropriate folders based on their type.