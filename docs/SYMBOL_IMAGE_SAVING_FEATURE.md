# Symbol Image Saving Feature

This document describes the implementation of the image saving feature for slot symbols in the SlotAI application.

## Overview

The Symbol Image Saving feature allows users to persist generated symbol images to game-specific folders on the server. Each game, identified by its `gameId`, has its own directory where symbol images are stored. This ensures that generated symbols are retained across sessions and can be reused.

## Key Components

1. **Netlify Function**: A serverless function (`save-image.ts`) handles the server-side image saving logic.
2. **Image Saver Utility**: A client-side utility (`imageSaver.ts`) provides easy-to-use functions for saving images.
3. **Integration in Step4_SymbolGeneration**: The feature is integrated into the Symbol Generation UI with:
   - Automatic saving when generating new symbols
   - A "Save All" button to save all current symbols at once

## Implementation Details

### Server-Side (Netlify Function)

The `save-image.ts` function:
- Accepts POST requests with image data, gameId, and symbol metadata
- Creates game-specific directories as needed
- Handles both base64 data and image URLs
- Returns the public path to the saved image

### Client-Side (imageSaver.ts)

The utility provides two main functions:
- `saveImage()`: Saves a single image with metadata
- `saveAllImages()`: Bulk saves all symbols in the current game

### User Interface

- Images are automatically saved when generated with GPT-image-1
- The "Save All" button allows manually persisting all symbols
- Success/error notifications provide feedback on save operations

## Directory Structure

Images are saved in the following structure:
```
/public/saved-images/
  /{gameId1}/
    symbol1_wild.png
    symbol2_scatter.png
    ...
  /{gameId2}/
    ...
```

## Usage

1. **Automatic Saving**: When generating a symbol with GPT-image-1, the image is automatically saved to the server.
2. **Manual Saving**: Click the "Save All" button to save all currently generated symbols.
3. **Accessing Saved Images**: Images can be accessed at `/saved-images/{gameId}/{filename}`.

## Benefits

- Persistence of generated symbols across sessions
- Organization by game ID for easier management
- Reduced need for regeneration of previously created symbols
- Backup of valuable generated assets

## Technical Notes

- Images are saved as PNG files for optimal quality
- Filenames include the symbol ID and name for easy reference
- The system works with both base64 data and image URLs
- A fallback mechanism ensures the UI continues to work even if saving fails