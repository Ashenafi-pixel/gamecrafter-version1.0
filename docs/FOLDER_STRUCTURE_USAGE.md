# How to Use the Folder Structure System

## Getting Started

1. **Start the Server with Folder Support**
   
   Use the provided script to start the server with proper folder structure support:
   
   ```bash
   # On Windows
   ./start-with-folders.bat
   
   # On Mac/Linux
   ./start-with-folders.sh
   ```
   
   This script ensures that the required parent directories are created:
   - `/public/game-assets/` - For storing game-specific assets
   - `/public/saved-images/` - For storing temporary or shared images

2. **Accessing the Application**
   
   Navigate to http://localhost:8080 in your browser to access the application.

## Folder Organization

Each game you create gets its own folder structure:

```
/public/game-assets/{gameId}_{date}/
```

For example, if you create a game with the "Ancient Egypt" theme on May 23, 2025, the folder would be:

```
/public/game-assets/ancient-egypt_20250523/
```

Inside this folder, assets are organized by type:

- `symbols/wild/` - Wild symbols
- `symbols/scatter/` - Scatter symbols
- `symbols/high/` - High-paying symbols
- `symbols/medium/` - Medium-paying symbols
- `symbols/low/` - Low-paying symbols
- `background/` - Background images
- `frame/` - Frame assets
- `ui/` - UI elements
- `sound/effects/` - Sound effects
- `sound/music/` - Background music
- `gameconfig/` - Game configuration files

## How It Works

1. **Theme Selection (Step 1)**
   - When you select a theme and click "Next", the system creates the folder structure
   - The game ID is based on the theme name and current date

2. **Asset Generation**
   - When you generate symbols, backgrounds, frames, etc., they are automatically saved to the appropriate folders
   - Each asset is categorized based on its type

3. **Retrieving Assets**
   - The application automatically retrieves assets from the correct folders
   - This ensures consistent asset management across game development

## Troubleshooting

If you encounter any issues with folder creation:

1. **Check if the Parent Directories Exist**
   
   Make sure the following directories exist:
   - `/public/`
   - `/public/game-assets/`
   - `/public/saved-images/`
   
   If they don't exist, you can create them manually or use the start-with-folders script.

2. **Check File Permissions**
   
   Ensure the server has write permissions to these directories.

3. **Verify Game ID Generation**
   
   If folders aren't being created with the expected game ID, check the theme name and ensure it's being properly converted to a valid folder name.

## Notes

- The date format used in folder names is YYYYMMDD (e.g., 20250523 for May 23, 2025)
- Special characters in theme names are converted to hyphens for folder name compatibility
- Each game maintains its own isolated folder structure to prevent asset conflicts