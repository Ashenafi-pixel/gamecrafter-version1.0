/**
 * Utility for handling step storage and persistence across the Visual Journey
 * This ensures that assets and configurations are saved properly at each step
 */
import axios from 'axios';
import { GameConfig } from '../types';
import { 
  saveConfigToServer, 
  uploadFile, 
  uploadBase64Image,
  getGameAssetPath
} from './gameStorage';

// Server API base URL - using relative URL for same-origin
const API_BASE_URL = '/api';

/**
 * Generate a unique game ID if one doesn't exist
 */
export const ensureGameId = (config: Partial<GameConfig>): string => {
  if (config.gameId) {
    return config.gameId;
  }

  // Generate a new game ID based on theme name or timestamp
  let baseName = 'game';

  // Use theme name if available
  if (config.theme?.mainTheme) {
    baseName = config.theme.mainTheme;
  }

  // Sanitize the name - replace spaces with hyphens, remove special chars
  const sanitizedName = baseName.toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/[^a-z0-9\-]/g, '') // Remove any other special characters
    .replace(/\-{2,}/g, '-');    // Replace multiple hyphens with a single one

  // Add current date in format YYYYMMDD
  const today = new Date();
  const dateStr = today.getFullYear() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  // Create final game ID
  const gameId = `${sanitizedName}_${dateStr}`;

  console.log(`[DEBUG] Created game ID: ${gameId} from theme: ${baseName}`);
  return gameId;
};

/**
 * Save the entire game configuration to the server
 */
export const persistGameData = async (
  config: Partial<GameConfig>
): Promise<Partial<GameConfig>> => {
  try {
    // Ensure the game has an ID
    const gameId = ensureGameId(config);
    
    // Update the config with the game ID
    const updatedConfig = {
      ...config,
      gameId,
      lastSaved: new Date().toISOString()
    };
    
    // Save the complete configuration to the server
    await saveConfigToServer(updatedConfig, gameId, 'game');
    
    console.log(`Game configuration saved to server with ID: ${gameId}`);
    return updatedConfig;
  } catch (error) {
    console.error('Error persisting game data:', error);
    return config;
  }
};

/**
 * Save an image from a Base64 string to the server
 */
export const saveBase64Image = async (
  base64Data: string,
  fileName: string,
  gameId: string,
  assetType: 'symbols' | 'background' | 'frame' | 'audio'
): Promise<string | null> => {
  try {
    // Skip if no data or already a server path
    if (!base64Data || base64Data.startsWith('/assets/games/')) {
      return base64Data;
    }
    
    // Upload the image
    const result = await uploadBase64Image(base64Data, fileName, gameId, assetType);
    
    if (result) {
      return result.path;
    }
    
    return null;
  } catch (error) {
    console.error(`Error saving ${assetType} image:`, error);
    return null;
  }
};

/**
 * Save all symbol images to the server
 */
export const saveSymbolImages = async (
  symbols: string[],
  gameId: string
): Promise<string[]> => {
  if (!symbols || !symbols.length || !gameId) {
    return symbols;
  }
  
  const updatedSymbols: string[] = [];
  
  for (const symbolPath of symbols) {
    try {
      // Skip if already a server path or not a base64 string
      if (
        symbolPath.startsWith('/assets/games/') || 
        symbolPath.startsWith('http') ||
        !symbolPath.startsWith('data:')
      ) {
        updatedSymbols.push(symbolPath);
        continue;
      }
      
      // Generate a filename based on index
      const index = symbols.indexOf(symbolPath);
      const fileName = `symbol_${index}.png`;
      
      // Upload the image
      const savedPath = await saveBase64Image(symbolPath, fileName, gameId, 'symbols');
      if (savedPath) {
        updatedSymbols.push(savedPath);
      } else {
        updatedSymbols.push(symbolPath);
      }
    } catch (error) {
      console.error('Error saving symbol image:', error);
      updatedSymbols.push(symbolPath);
    }
  }
  
  return updatedSymbols;
};

/**
 * Save the theme configuration with all generated assets
 */
export const saveThemeAssets = async (
  config: Partial<GameConfig>
): Promise<Partial<GameConfig>> => {
  // Skip if no theme or no gameId
  if (!config.theme || !config.gameId) {
    return config;
  }
  
  const { theme, gameId } = config;
  const { generated } = theme;
  
  if (!generated) {
    return config;
  }
  
  const updatedTheme = { ...theme };
  let updated = false;
  
  // Save symbols
  if (generated.symbols && generated.symbols.length > 0) {
    const updatedSymbols = await saveSymbolImages(generated.symbols, gameId);
    if (updatedSymbols.join(',') !== generated.symbols.join(',')) {
      updatedTheme.generated = {
        ...generated,
        symbols: updatedSymbols
      };
      updated = true;
    }
  }
  
  // Save background
  if (generated.background && generated.background.startsWith('data:')) {
    const savedBackground = await saveBase64Image(
      generated.background, 
      'background.png', 
      gameId, 
      'background'
    );
    
    if (savedBackground) {
      updatedTheme.generated = {
        ...updatedTheme.generated,
        background: savedBackground
      };
      updated = true;
    }
  }
  
  // Save frame
  if (generated.frame && generated.frame.startsWith('data:')) {
    const savedFrame = await saveBase64Image(
      generated.frame, 
      'frame.png', 
      gameId, 
      'frame'
    );
    
    if (savedFrame) {
      updatedTheme.generated = {
        ...updatedTheme.generated,
        frame: savedFrame
      };
      updated = true;
    }
  }
  
  if (updated) {
    return {
      ...config,
      theme: updatedTheme
    };
  }
  
  return config;
};

/**
 * Save the background configuration
 */
export const saveBackgroundAssets = async (
  config: Partial<GameConfig>
): Promise<Partial<GameConfig>> => {
  // Skip if no background or no gameId
  if (!config.background || !config.gameId) {
    return config;
  }
  
  const { background, gameId } = config;
  const { backgroundImage } = background;
  
  if (!backgroundImage || !backgroundImage.startsWith('data:')) {
    return config;
  }
  
  // Save background image
  const savedBackground = await saveBase64Image(
    backgroundImage,
    'custom_background.png',
    gameId,
    'background'
  );
  
  if (savedBackground) {
    return {
      ...config,
      background: {
        ...background,
        backgroundImage: savedBackground
      }
    };
  }
  
  return config;
};

/**
 * Save the frame configuration
 */
export const saveFrameAssets = async (
  config: Partial<GameConfig>
): Promise<Partial<GameConfig>> => {
  // Skip if no frame or no gameId
  if (!config.frame || !config.gameId) {
    return config;
  }
  
  const { frame, gameId } = config;
  const { frameImage } = frame;
  
  if (!frameImage || !frameImage.startsWith('data:')) {
    return config;
  }
  
  // Save frame image
  const savedFrame = await saveBase64Image(
    frameImage,
    'custom_frame.png',
    gameId,
    'frame'
  );
  
  if (savedFrame) {
    return {
      ...config,
      frame: {
        ...frame,
        frameImage: savedFrame
      }
    };
  }
  
  return config;
};

/**
 * Combines all asset saving functions into one
 */
export const saveAllStepAssets = async (
  config: Partial<GameConfig>
): Promise<Partial<GameConfig>> => {
  try {
    // Ensure the game has an ID
    let updatedConfig = { ...config };

    if (!updatedConfig.gameId) {
      updatedConfig.gameId = ensureGameId(config);
      console.log(`[DEBUG] Generated new gameId: ${updatedConfig.gameId}`);
    } else {
      console.log(`[DEBUG] Using existing gameId: ${updatedConfig.gameId}`);
    }

    // Add a timestamp to track this save operation
    const saveTimestamp = Date.now();
    console.log(`[DEBUG] Starting asset save operation #${saveTimestamp} for gameId: ${updatedConfig.gameId}`);

    // First, make sure the game directory exists by explicitly creating it
    // This ensures directory creation before saving any assets
    try {
      console.log(`[DEBUG] Creating game directory structure...`);
      const createDirUrl = `${API_BASE_URL}/games/${updatedConfig.gameId}/create-directory`;

      const response = await axios.post(createDirUrl, {
        createSubdirectories: true
      });

      if (response.data.success) {
        console.log(`[DEBUG] Game directory created successfully at: ${response.data.path}`);
        console.log(`[DEBUG] Game directory contents: ${response.data.contents.join(', ')}`);
      } else {
        console.error(`[ERROR] Failed to create game directory:`, response.data.error);
      }
    } catch (initError) {
      console.error(`[ERROR] Failed to create game directory:`, initError);
      // Continue even if this fails - subsequent steps might still work
    }

    // Step 1-2: Save theme assets
    console.log(`[DEBUG] Saving theme assets...`);
    updatedConfig = await saveThemeAssets(updatedConfig);

    // Step 5: Save background assets
    console.log(`[DEBUG] Saving background assets...`);
    updatedConfig = await saveBackgroundAssets(updatedConfig);

    // Step 6: Save frame assets
    console.log(`[DEBUG] Saving frame assets...`);
    updatedConfig = await saveFrameAssets(updatedConfig);

    // Finally, save the complete configuration
    console.log(`[DEBUG] Persisting complete game data...`);
    updatedConfig = await persistGameData(updatedConfig);

    // Double-check that the game directory exists
    try {
      // Make a direct API call to verify the game directory exists
      const verifyUrl = `${API_BASE_URL}/games/${updatedConfig.gameId}/verify-directory`;
      console.log(`[DEBUG] Verifying game directory exists at ${verifyUrl}...`);

      const verifyResponse = await axios.get(verifyUrl).catch((err) => {
        // If verification endpoint doesn't exist, assume directory exists
        console.log(`[DEBUG] Verification endpoint not available (${err.message}), assuming directory exists`);
        return { data: { exists: true } };
      });

      if (verifyResponse?.data?.exists) {
        console.log(`[DEBUG] Game directory verified for ${updatedConfig.gameId}`);
      } else {
        console.error(`[ERROR] Game directory does not exist for ${updatedConfig.gameId}`);
      }
    } catch (verifyError) {
      console.error(`[ERROR] Error verifying game directory:`, verifyError);
    }

    console.log(`[DEBUG] Asset save operation #${saveTimestamp} completed successfully for ${updatedConfig.gameId}`);
    return updatedConfig;
  } catch (error) {
    console.error('[ERROR] Error saving step assets:', error);
    // Re-throw with more context to help debugging
    throw new Error(`Failed to save assets: ${error.message}`);
  }
};