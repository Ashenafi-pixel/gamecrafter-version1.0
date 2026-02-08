/**
 * Utility for saving generated images to server-side storage
 * Allows persisting images in game-specific folders based on gameId
 */

import { useGameStore } from '../store';

/**
 * Save an image to the server in a gameId-specific folder
 * @param imageData Base64 image data or URL
 * @param symbolName Name of the symbol (for filename)
 * @param symbolId ID of the symbol (for filename and reference)
 * @returns Promise with the saved image path
 */
export const saveImage = async (
  imageData: string,
  symbolName: string,
  symbolId: string,
  gameId?: string
): Promise<{ filePath: string; symbolId: string }> => {
  try {
    // Prioritize the passed gameId parameter first
    let finalGameId = gameId;
    
    if (finalGameId) {
      console.log(`Using gameId from parameter: ${finalGameId}`);
    } else {
      // Fallback to localStorage
      const gameIdFromLocalStorage = localStorage.getItem('slotai_gameId');
      if (gameIdFromLocalStorage) {
        finalGameId = gameIdFromLocalStorage;
        console.log(`Using gameId from localStorage: ${finalGameId}`);
      } else {
        // If not in localStorage, try to get from the store
        const gameConfig = useGameStore.getState();
        if (gameConfig?.gameId) {
          finalGameId = gameConfig.gameId;
          console.log(`Using gameId from store: ${finalGameId}`);
        } else {
          // If still not found, create a default one
          const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
          finalGameId = `default_${dateStr}`;
          console.log(`No gameId found, using default: ${finalGameId}`);
        }
      }
    }
    
    // Save the gameId back to localStorage for consistency
    localStorage.setItem('slotai_current_game', finalGameId);
    
    // Get store config for debugging
    const gameConfig = useGameStore.getState();
    
    // Console log all state information for debugging
    console.log(`Game state debug:`, {
      storeGameId: gameConfig?.gameId,
      storeTheme: gameConfig?.theme?.mainTheme,
      finalGameId: finalGameId,
      url: window.location.href
    });
    
    // Log symbol details including symbol type (useful for debugging medium symbols)
    const symbolType = symbolId.split('_')[0] || "unknown";
    console.log(`Saving image for game: ${finalGameId}, symbol: ${symbolName} (${symbolId}, type: ${symbolType})`);

    // For direct testing in development, try saving to local file via fetch
    let saveUrl = '/.netlify/functions/save-image';
    
    // Check if running on localhost and use a direct server URL if needed
    if (window.location.hostname === 'localhost') {
      console.log('Running on localhost, trying direct server path...');
      // Use the server.cjs endpoint with the correct port
      saveUrl = 'http://localhost:8080/save-image';
    }
    
    console.log(`Posting to: ${saveUrl}`);
    const response = await fetch(saveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-ID': finalGameId  // Also send in headers for extra reliability
      },
      body: JSON.stringify({
        image: imageData,
        gameId: finalGameId,  // Use the correct gameId
        symbolName,
        symbolId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`Image saved successfully: ${result.filePath}`);
    
    return {
      filePath: result.filePath,
      symbolId: result.symbolId
    };
  } catch (error) {
    console.error('Error saving image:', error);
    
    // Return the original image data on error so the app can continue to work
    return {
      filePath: imageData,
      symbolId
    };
  }
};

/**
 * Save a particle asset to the server in the particles folder
 * @param imageData Base64 image data or URL
 * @param particleName Name of the particle (gold_coin, diamond, etc.)
 * @param particleId ID of the particle
 * @param gameId Game ID for folder structure
 * @returns Promise with the saved image path
 */
export const saveParticleAsset = async (
  imageData: string,
  particleName: string,
  particleId: string,
  gameId?: string
): Promise<{ filePath: string; particleId: string }> => {
  try {
    // Get gameId (same logic as saveImage)
    let finalGameId = gameId;
    
    if (!finalGameId) {
      const gameIdFromLocalStorage = localStorage.getItem('slotai_gameId');
      if (gameIdFromLocalStorage) {
        finalGameId = gameIdFromLocalStorage;
      } else {
        const gameConfig = useGameStore.getState();
        finalGameId = gameConfig?.gameId || `default_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
      }
    }
    
    localStorage.setItem('slotai_current_game', finalGameId);
    
    const fileName = particleName.toLowerCase().replace(/\s+/g, '_');
    
    console.log(`Saving particle asset: ${particleName} (${fileName}) for game: ${finalGameId}`);

    let saveUrl = '/.netlify/functions/save-image';
    
    if (window.location.hostname === 'localhost') {
      saveUrl = 'http://localhost:8080/save-image';
    }
    
    const response = await fetch(saveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-ID': finalGameId
      },
      body: JSON.stringify({
        image: imageData,
        gameId: finalGameId,
        symbolName: fileName,
        symbolId: particleId,
        folder: 'particles' // Specify the particles folder
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`Particle asset saved successfully: ${result.filePath}`);
    
    return {
      filePath: result.filePath,
      particleId: particleId
    };
  } catch (error) {
    console.error('Error saving particle asset:', error);
    throw new Error(`Failed to save particle asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Save a title asset to the server in the titles folder
 * @param imageData Base64 image data or URL
 * @param titleType Type of title (freeSpins, bonusGame, etc.)
 * @param gameId Game ID for folder structure
 * @returns Promise with the saved image path
 */
export const saveTitleAsset = async (
  imageData: string,
  titleType: string,
  gameId?: string
): Promise<{ filePath: string; titleType: string }> => {
  try {
    // Get gameId (same logic as saveImage)
    let finalGameId = gameId;
    
    if (!finalGameId) {
      const gameIdFromLocalStorage = localStorage.getItem('slotai_gameId');
      if (gameIdFromLocalStorage) {
        finalGameId = gameIdFromLocalStorage;
      } else {
        const gameConfig = useGameStore.getState();
        finalGameId = gameConfig?.gameId || `default_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
      }
    }
    
    localStorage.setItem('slotai_current_game', finalGameId);
    
    const titleLabels = {
      freeSpins: 'free_spins',
      bonusGame: 'bonus_game',
      pickAndClick: 'pick_and_click',
      small: 'small_win',
      big: 'big_win',
      mega: 'mega_win',
      super: 'super_win',
      gameOver: 'game_over',
      congratulations: 'congratulations'
    };
    
    const fileName = titleLabels[titleType] || titleType.toLowerCase().replace(/\s+/g, '_');
    
    console.log(`Saving title asset: ${titleType} (${fileName}) for game: ${finalGameId}`);

    let saveUrl = '/.netlify/functions/save-image';
    
    if (window.location.hostname === 'localhost') {
      saveUrl = 'http://localhost:8080/save-image';
    }
    
    const response = await fetch(saveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-ID': finalGameId
      },
      body: JSON.stringify({
        image: imageData,
        gameId: finalGameId,
        symbolName: fileName,
        symbolId: `title_${fileName}`,
        folder: 'titles' // Specify the titles folder
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`Title asset saved successfully: ${result.filePath}`);
    
    return {
      filePath: result.filePath,
      titleType: titleType
    };
  } catch (error) {
    console.error('Error saving title asset:', error);
    throw new Error(`Failed to save title asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Attempts to save all currently generated symbols
 * @param symbols Array of symbol objects with image data
 * @returns Promise with the results of all save operations
 */
export const saveAllImages = async (symbols: Array<{
  id: string;
  name: string;
  type?: string;
  image: string | null;
}>) => {
  try {
    // Filter out symbols without images
    const symbolsWithImages = symbols.filter(s => s.image);
    
    if (symbolsWithImages.length === 0) {
      console.log('No images to save');
      return [];
    }
    
    // Log symbol types before saving for debugging
    const typeCounts = {
      total: symbolsWithImages.length,
      wild: symbolsWithImages.filter(s => s.type === 'wild').length,
      scatter: symbolsWithImages.filter(s => s.type === 'scatter').length,
      high: symbolsWithImages.filter(s => s.type === 'high').length,
      medium: symbolsWithImages.filter(s => s.type === 'medium').length,
      low: symbolsWithImages.filter(s => s.type === 'low').length
    };
    
    console.log(`Saving ${symbolsWithImages.length} symbol images with type distribution:`, typeCounts);
    
    // Get the gameId from localStorage which was set in Step 1
    const gameIdFromStorage = localStorage.getItem('slotai_gameId');
    console.log(`Game ID from localStorage for batch save:`, gameIdFromStorage);
    
    // Try to get from store if not in localStorage
    const gameConfig = useGameStore.getState();
    const gameIdFromStore = gameConfig?.gameId;
    
    // Use the first available gameId
    let gameId = gameIdFromStorage || gameIdFromStore;
    
    if (gameId) {
      console.log(`BATCH SAVE: Using game ID ${gameId} for consistent folder naming`);
      // Make sure this gameId is used for all saves in this batch
      localStorage.setItem('slotai_current_game', gameId);
      localStorage.setItem('slotai_batch_gameId', gameId);
    } else {
      // Fallback
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      gameId = `default_${dateStr}`;
      console.log(`No gameId found for batch, using default: ${gameId}`);
      localStorage.setItem('slotai_current_game', gameId);
    }
    
    // Log game state before batch save
    console.log(`Game config before batch save:`, {
      finalGameId: gameId,
      fromStorage: gameIdFromStorage,
      fromStore: gameIdFromStore,
      theme: gameConfig?.theme?.mainTheme
    });
    
    // Save each image in parallel
    const savePromises = symbolsWithImages.map(symbol => 
      saveImage(symbol.image!, symbol.name, symbol.id)
    );
    
    // Wait for all saves to complete
    const results = await Promise.all(savePromises);
    
    console.log(`Successfully saved ${results.length} images`);
    
    return results;
  } catch (error) {
    console.error('Error saving multiple images:', error);
    return [];
  }
};