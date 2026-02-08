/**
 * Utility for creating folder structures for game assets
 * Creates standardized folders for each game based on gameId
 */

import { useGameStore } from '../store';

/**
 * Creates the folder structure for a game
 * @param gameId The game ID to create folders for
 * @returns Promise with the result of the folder creation
 */
export const createGameFolders = async (gameId: string): Promise<{ success: boolean; message: string; path?: string }> => {
  try {
    if (!gameId) {
      throw new Error('Game ID is required to create folders');
    }

    console.log(`Creating folder structure for game: ${gameId}`);

    // Determine the API endpoint based on environment
    let apiUrl = '/.netlify/functions/create-folders';

    // Check if running on localhost
    if (window.location.hostname === 'localhost') {
      console.log('Running on localhost, using direct server path (port 3500)');
      apiUrl = 'http://localhost:3500/create-folders';
    }

    // Call the server-side function to create folders
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-ID': gameId
      },
      body: JSON.stringify({
        gameId,
        folders: [
          'symbols',
          'symbols/wild',       // Wild symbols
          'symbols/scatter',    // Scatter symbols  
          'symbols/high',       // High-paying symbols
          'symbols/medium',     // Medium-paying symbols
          'symbols/low',        // Low-paying symbols
          'background',         // Background images
          'frame',              // Frame assets
          'titles',             // Title assets (FREE SPINS, BONUS GAME, etc.)
          'ui',                 // UI elements
          'sound',              // Sound effects and music
          'sound/effects',      // Sound effects
          'sound/music',        // Background music
          'gameconfig'          // Game configuration files
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log(`Folders created successfully: ${result.path}`);

    // Store the game folder path in localStorage for reference
    localStorage.setItem('slotai_game_folder', result.path);

    return {
      success: true,
      message: 'Game folders created successfully',
      path: result.path
    };
  } catch (error) {
    console.error('Error creating game folders:', error);
    return {
      success: false,
      message: `Error creating folders: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Helper function to create game folders when next button is clicked in Step 1
 * This should be called when moving from Step 1 to Step 2
 */
export const createFoldersForCurrentGame = async (): Promise<boolean> => {
  try {
    // Get the current game configuration
    const gameConfig = useGameStore.getState().config;

    // Check if we have a game ID
    const gameId = gameConfig.gameId;
    if (!gameId) {
      console.error('No game ID found, cannot create folders');
      return false;
    }

    // Get the theme and display name for logging
    const themeName = gameConfig.theme?.mainTheme || 'Unknown';
    const displayName = gameConfig.displayName || gameId;

    console.log(`Creating folders for game: ${displayName} (ID: ${gameId}, Theme: ${themeName})`);

    // Call the folder creation function
    const result = await createGameFolders(gameId);

    if (result.success) {
      console.log(`Successfully created folders for ${displayName} at ${result.path}`);

      // Save the game path to localStorage and store
      localStorage.setItem('slotai_current_game_path', result.path || '');
      useGameStore.getState().updateConfig({
        gameFolderPath: result.path
      });

      return true;
    } else {
      console.error(`Failed to create folders: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('Error in createFoldersForCurrentGame:', error);
    return false;
  }
};