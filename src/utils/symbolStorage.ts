/**
 * Utility functions for managing symbol storage in localStorage
 */
import { useState, useEffect } from 'react';
import { useGameStore } from '../store';

export interface StoredSymbol {
  id: string;
  name: string;
  type: 'wild' | 'wild 2' | 'scatter' | 'high 1' | 'high 2' | 'high 3' | 'high 4' | 'medium 1' | 'medium 2' | 'medium 3' | 'medium 4' | 'low 1' | 'low 2' | 'low 3' | 'low 4';
  image: string;
  weight?: number;
  isWild?: boolean;
  isScatter?: boolean;
  payouts?: Record<string, number>;
  objectDescription?: string;
  customPromptText?: string;
}

/**
 * Saves the game symbols to localStorage
 * @param symbols Array of symbol objects to save
 * @param gameId Optional game ID to separate storage for different games
 * @returns boolean indicating success
 */
export const saveSymbolsToLocalStorage = (
  symbols: Array<any>,
  gameId?: string
): boolean => {
  try {
    // Clear old symbol storage to prevent quota issues
    clearOldSymbolStorage();
    
    // Filter out only valid symbols with images
    const symbolsToSave = symbols
      .filter(s => s.image)
      .map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        image: s.image,
        weight: s.weight || getDefaultWeight(s.type),
        isWild: s.type === 'wild' || s.type === 'wild 2',
        isScatter: s.type === 'scatter',
        objectDescription: s.objectDescription || '',
        customPromptText: s.customPromptText || '',
      }));
    
    const storageKey = gameId 
      ? `slotai_symbols_${gameId}` 
      : 'slotai_symbols';
    
    const dataToStore = {
      symbols: symbolsToSave,
      timestamp: Date.now(),
      gameId: gameId || 'default'
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    console.log(`Symbols saved to localStorage with key: ${storageKey}`);
    return true;
  } catch (err) {
    console.error('Error saving symbols to localStorage:', err);
    
    // If quota exceeded, try clearing all symbol storage and retry once
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      console.log('Quota exceeded, clearing all symbol storage and retrying...');
      clearAllSymbolStorage();
      try {
        // Only save essential metadata, not the actual images
        const symbolMetadata = symbols.slice(0, 10).map((symbol, index) => ({
          id: symbol.id || `symbol_${index}`,
          name: symbol.name || `Symbol ${index}`,
          type: symbol.type || 'custom',
          // Don't save the actual image data - too large for localStorage
          hasImage: !!symbol.image,
          imageSize: symbol.image ? Math.round(symbol.image.length / 1024) : 0 // Size in KB
        }));
        
        const minimalData = {
          symbolCount: symbols.length,
          symbolMetadata,
          gameId: gameId || 'default',
          timestamp: Date.now(),
          note: 'Image data not stored due to size constraints'
        };
        const retryStorageKey = gameId ? `slotai_symbols_${gameId}` : 'slotai_symbols';
        localStorage.setItem(retryStorageKey, JSON.stringify(minimalData));
        console.log(`Retry successful: Saved minimal symbols after clearing storage`);
        return true;
      } catch (retryError) {
        console.error('Retry failed, skipping localStorage save:', retryError);
        // Don't throw - continue without localStorage
      }
    }
    return false;
  }
};

/**
 * Retrieves saved symbols from localStorage
 * @param gameId Optional game ID to retrieve specific game symbols
 * @returns Array of stored symbols or null if not found
 */
export const getSymbolsFromLocalStorage = (
  gameId?: string
): StoredSymbol[] | null => {
  try {
    const storageKey = gameId
      ? `slotai_symbols_${gameId}`
      : 'slotai_symbols';

    const savedData = localStorage.getItem(storageKey);
    if (!savedData) return null;

    const parsedData = JSON.parse(savedData);

    // Handle both old format (direct array) and new format (object with symbols property)
    if (Array.isArray(parsedData)) {
      // Old format - direct array of symbols
      return parsedData;
    } else if (parsedData && parsedData.symbols && Array.isArray(parsedData.symbols)) {
      // New format - object with symbols property
      return parsedData.symbols;
    } else {
      console.warn('Invalid symbol data format in localStorage:', parsedData);
      return null;
    }
  } catch (err) {
    console.error('Error retrieving symbols from localStorage:', err);
    return null;
  }
};

/**
 * Gets the default weight for a symbol based on its type
 */
const getDefaultWeight = (type: string): number => {
  switch(type) {
    case 'wild': return 5;
    case 'wild 2': return 5;
    case 'scatter': return 3;
    case 'high 1': return 10;
    case 'high 2': return 10;
    case 'high 3': return 10;
    case 'high 4': return 10;
    case 'medium 1': return 20;
    case 'medium 2': return 20;
    case 'medium 3': return 20;
    case 'medium 4': return 20;
    case 'low 1': return 30;
    case 'low 2': return 30;
    case 'low 3': return 30;
    case 'low 4': return 30;
    default: return 15;
  }
};

/**
 * Clears saved symbols from localStorage
 * @param gameId Optional game ID to clear specific game symbols
 * @returns boolean indicating success
 */
export const clearSavedSymbols = (gameId?: string): boolean => {
  try {
    const storageKey = gameId 
      ? `slotai_symbols_${gameId}` 
      : 'slotai_symbols';
    
    localStorage.removeItem(storageKey);
    return true;
  } catch (err) {
    console.error('Error clearing saved symbols:', err);
    return false;
  }
};

/**
 * Converts symbols from the store format to the API format
 * @param symbols Array of stored symbols
 * @returns Symbols in the format expected by the API
 */
export const convertSymbolsToApiFormat = (
  symbols: StoredSymbol[]
): any => {
  if (!symbols || !symbols.length) return null;
  
  // Count symbols by type
  // const counts = {
  //   total: symbols.length,
  //   wilds: symbols.filter(s => s.type === 'wild').length,
  //   scatters: symbols.filter(s => s.type === 'scatter').length,
  //   high: symbols.filter(s => s.type === 'high 1' || 'high 2' || 'high 3' || 'high 4').length,
  //   medium: symbols.filter(s => s.type === 'medium 1' || 'medium 2' || 'medium 3' || 'medium 4').length,
  //   low: symbols.filter(s => s.type === 'low 1' || 'low 2' || 'low 3' || 'low 4').length,
  // };
  
  // Convert to API format
  return {
    // count: counts,
    list: symbols.map(s => ({
      id: s.id,
      name: s.name,
      image: s.image,
      weight: s.weight || getDefaultWeight(s.type),
      isWild: s.type === 'wild' || 'wild 2',
      isScatter: s.type === 'scatter',
      payouts: s.payouts || getDefaultPayouts(s.type),
    }))
  };
};

/**
 * Clear old symbol storage to prevent quota issues
 */
export const clearOldSymbolStorage = (): void => {
  try {
    const keysToRemove: string[] = [];
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 1 week
    
    // Find old symbol storage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('slotai_symbols_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && data.timestamp < oneWeekAgo) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // Invalid data, mark for removal
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove old keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed old symbol storage: ${key}`);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`Cleared ${keysToRemove.length} old symbol storage entries`);
    }
  } catch (error) {
    console.error('Error clearing old symbol storage:', error);
  }
};

/**
 * Clear all symbol storage (emergency function for quota issues)
 */
export const clearAllSymbolStorage = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    // Find all symbol storage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('slotai_symbols_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Emergency cleanup: Cleared ${keysToRemove.length} symbol storage entries`);
  } catch (error) {
    console.error('Error clearing all symbol storage:', error);
  }
};

/**
 * Gets default payouts based on symbol type
 */
const getDefaultPayouts = (type: string): Record<string, number> => {
  switch(type) {
    case 'wild':
      return { '3': 5, '4': 25, '5': 100 };
      case 'wild 2':
      return { '3': 5, '4': 25, '5': 100 };
    case 'scatter':
      return { '3': 3, '4': 10, '5': 50 };
    case 'high 1':
      return { '3': 3, '4': 10, '5': 50 };
      case 'high 2':
      return { '3': 3, '4': 10, '5': 50 };
      case 'high 3':
      return { '3': 3, '4': 10, '5': 50 };
      case 'high 4':
      return { '3': 3, '4': 10, '5': 50 };
    case 'medium 1':
      return { '3': 2, '4': 5, '5': 25 };
      case 'medium 2':
      return { '3': 2, '4': 5, '5': 25 };
      case 'medium 3':
      return { '3': 2, '4': 5, '5': 25 };
      case 'medium 4':
      return { '3': 2, '4': 5, '5': 25 };
    case 'low 1':
      return { '3': 1, '4': 2, '5': 10 };
      case 'low 2':
      return { '3': 1, '4': 2, '5': 10 };
      case 'low 3':
      return { '3': 1, '4': 2, '5': 10 };
      case 'low 4':
      return { '3': 1, '4': 2, '5': 10 };
    default:
      return { '3': 1, '4': 5, '5': 20 };
  }
};

/**
 * React hook to load symbols from localStorage and update the store
 * 
 * Use this hook in components that need to display symbols, like
 * the game preview in Step 13 or any other component that needs
 * access to the saved symbols.
 */
export const useStoredSymbols = () => {
  const { config, updateConfig } = useGameStore();
  const [loadedSymbols, setLoadedSymbols] = useState<StoredSymbol[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Helper function to check if store has symbols (both array and object formats)
    const storeHasSymbols = () => {
      const symbols = config?.theme?.generated?.symbols;
      if (!symbols) return false;
      if (Array.isArray(symbols)) return symbols.length > 0;
      return Object.keys(symbols).length > 0;
    };

    if (!storeHasSymbols()) {
      // Try to get symbols from localStorage
      const savedSymbols = getSymbolsFromLocalStorage(config?.gameId);

      if (savedSymbols && savedSymbols.length > 0) {
        // For backward compatibility, we'll store as array format
        // The Step5 component will handle the conversion to key-based format
        const symbolImages = savedSymbols.map(s => s.image);

        // Update the store with the loaded symbols
        updateConfig({
          theme: {
            ...config.theme,
            generated: {
              background: config?.theme?.generated?.background || null,
              frame: config?.theme?.generated?.frame || null,
              symbols: symbolImages
            }
          }
        });

        // Set the loaded symbols for component consumption
        setLoadedSymbols(savedSymbols);
      }
    } else {
      // If store already has symbols, create the full symbol objects
      // from the image URLs in the store
      const symbols = config?.theme?.generated?.symbols;
      if (symbols) {
        const types = ['wild', 'scatter', 'high 1', 'high 2', 'high 3','high 4', 'medium 1', 'medium 2', 'medium 3', 'medium 4', 'low 1', 'low 2', 'low 3', 'low 4'];
        const typeCounts: Record<string, number> = {};

        let storeSymbols: StoredSymbol[] = [];

        if (Array.isArray(symbols)) {
          // Legacy array format
          storeSymbols = symbols.map((image, index) => {
            const type = types[index] || 'medium 1';
            typeCounts[type] = (typeCounts[type] || 0) + 1;

            return {
              id: `${type}_${typeCounts[type]}`,
              name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${typeCounts[type]}`,
              type,
              image,
              weight: getDefaultWeight(type),
              isWild: type === 'wild' || type === 'wild 2',
              isScatter: type === 'scatter',
            };
          }) as StoredSymbol[];
        } else {
          // New object format with keys
          storeSymbols = Object.entries(symbols).map(([key, image]) => {
            // Convert key back to type (e.g., 'wild2' -> 'wild 2')
            const type = key.replace(/(\d+)$/, ' $1').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

            return {
              id: key,
              name: type.charAt(0).toUpperCase() + type.slice(1),
              type,
              image,
              weight: getDefaultWeight(type),
              isWild: type === 'wild' || type === 'wild 2',
              isScatter: type === 'scatter',
            };
          }) as StoredSymbol[];
        }

        setLoadedSymbols(storeSymbols);
      }
    }
    
    setIsLoading(false);
  }, []);
  
  return { symbols: loadedSymbols, isLoading };
};