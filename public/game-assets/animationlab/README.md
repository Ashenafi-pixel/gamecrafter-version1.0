# Animation Lab Assets

This folder contains assets specifically for the Animation Lab feature, separate from the main SlotAI game builder assets.

## Folder Structure

- `symbols/` - Original symbol images saved for animation processing
- `sprites/` - Generated sprite sheets with separated components for animation

## File Naming Convention

### Symbols
- Format: `{symbolId}_{timestamp}_original.png`
- Example: `beetle_1234567890_original.png`

### Sprite Sheets
- Format: `{symbolId}_{timestamp}_sprites.png`
- Example: `beetle_1234567890_sprites.png`

## Storage System

The Animation Lab uses a dual storage system:
1. **LocalStorage Registry**: Quick access metadata and sprite information
2. **File System Storage**: Actual image files stored in this directory structure

## Integration

This folder is completely separate from the main SlotAI game assets and will not interfere with game building functionality.