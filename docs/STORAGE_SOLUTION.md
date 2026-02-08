# Symbol Storage Solution for LocalStorage Quota Issues

## Current Analysis & Problem Identification

After reviewing the codebase, I've identified several key issues with the current storage approach:

1. **Symbol Storage Implementation**:
   - Symbols are currently stored in localStorage as base64-encoded image strings
   - Each symbol can be several hundred KB or even MB in size
   - The `symbolStorage.ts` utility handles saving/loading from localStorage
   - Browser localStorage has a limited quota (typically 5-10MB) which is easily exceeded

2. **Current Storage Modules**:
   - `symbolStorage.ts` - Handles symbol storage in localStorage
   - `stepStorage.ts` - References server-side storage functions but they're not fully implemented
   - There are references to a `gameStorage.ts` module in imports but the file doesn't exist

3. **Server Capabilities**:
   - The `server.js` file already includes robust endpoints for storing files and data:
     - `/api/games/:gameId/:assetType/upload` - For regular file uploads
     - `/api/games/:gameId/:assetType/upload-base64` - For base64 encoded images
     - `/api/games/:gameId/config/:configType` - For JSON configuration data

4. **Specific Issues**:
   - The `saveSymbolsToLocalStorage` function attempts to store all symbol data in localStorage
   - Large base64 images easily exceed the localStorage quota
   - Error handling exists but doesn't provide fallback storage options
   - Server storage functionality is referenced but not properly connected

## Solution Architecture

I propose a hybrid approach that maintains localStorage for small data but seamlessly falls back to server storage for larger data:

1. **Enhanced Symbol Storage Module**
   - Create a proper `gameStorage.ts` implementation to connect with server endpoints
   - Modify `symbolStorage.ts` to check data size before attempting to use localStorage
   - Implement automatic fallback to server storage when localStorage quota would be exceeded
   - Maintain consistent APIs so other code doesn't need to change

2. **Smart Caching Strategy**
   - Store symbol metadata (type, name, ID) in localStorage for quick access
   - Store image references (URLs) in localStorage instead of the actual base64 data
   - Upload actual image data to the server when it exceeds a certain size threshold 
   - Maintain a "storage mode" flag in localStorage to track where each asset is stored

3. **Server Integration**
   - Leverage existing server endpoints for file storage
   - Implement the missing `saveConfigToServer`, `uploadFile`, `uploadBase64Image`, and `getGameAssetPath` functions
   - Add proper error handling and logging

4. **Migration & Backward Compatibility**
   - Add logic to migrate existing localStorage symbols to server on first use
   - Maintain backward compatibility by checking both storage locations when retrieving symbols
   - Add diagnostic tools for detecting and resolving storage issues

## Implementation Plan

### 1. Create `gameStorage.ts` Module

Implement the essential server storage functionality:

```typescript
// gameStorage.ts
import axios from 'axios';
import { GameConfig } from '../types';

// API base URL - using relative URL for same-origin
const API_BASE_URL = '/api';

/**
 * Save configuration data to the server
 */
export const saveConfigToServer = async (
  config: Partial<GameConfig>, 
  gameId: string, 
  configType: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/games/${gameId}/config/${configType}`,
      config
    );
    return response.data.success;
  } catch (error) {
    console.error('Error saving config to server:', error);
    return false;
  }
};

/**
 * Upload a file to the server
 */
export const uploadFile = async (
  file: File,
  gameId: string,
  assetType: 'symbols'  < /dev/null |  'background' | 'frame' | 'audio'
): Promise<{path: string} | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(
      `${API_BASE_URL}/games/${gameId}/${assetType}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    if (response.data.success) {
      return { path: response.data.path };
    }
    return null;
  } catch (error) {
    console.error(`Error uploading file to server:`, error);
    return null;
  }
};

/**
 * Upload a base64 image to the server
 */
export const uploadBase64Image = async (
  base64Data: string,
  fileName: string,
  gameId: string,
  assetType: 'symbols' | 'background' | 'frame' | 'audio'
): Promise<{path: string} | null> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/games/${gameId}/${assetType}/upload-base64`,
      {
        base64Data,
        fileName
      }
    );
    
    if (response.data.success) {
      return { path: response.data.path };
    }
    return null;
  } catch (error) {
    console.error(`Error uploading base64 image to server:`, error);
    return null;
  }
};

/**
 * Get the asset path for a game
 */
export const getGameAssetPath = (
  gameId: string,
  assetType: 'symbols' | 'background' | 'frame' | 'audio',
  fileName: string
): string => {
  return `/games/${gameId}/${assetType}/${fileName}`;
};

/**
 * Ensure game directory exists
 */
export const ensureGameDirectory = async (gameId: string): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/games/${gameId}/create-directory`,
      { createSubdirectories: true }
    );
    return response.data.success;
  } catch (error) {
    console.error('Error creating game directory:', error);
    return false;
  }
};
```

### 2. Enhance `symbolStorage.ts` with Smart Fallback

Update the current implementation to handle large data:

```typescript
/**
 * Enhanced symbol storage with automatic fallback to server storage
 * when localStorage quota would be exceeded
 */
export const saveSymbolsToLocalStorage = async (
  symbols: Array<any>,
  gameId?: string
): Promise<boolean> => {
  try {
    // Ensure gameId is set
    const gameIdentifier = gameId || 'default';
    
    // Filter out only valid symbols with images
    const symbolsToSave = symbols
      .filter(s => s.image)
      .map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        weight: s.weight || getDefaultWeight(s.type),
        isWild: s.type === 'wild',
        isScatter: s.type === 'scatter',
        // We'll decide where to store the image later
        image: s.image
      }));
    
    // Estimate size of all images combined
    let totalSize = 0;
    const sizeEstimates = symbolsToSave.map(s => {
      // For base64 images, estimate size
      if (typeof s.image === 'string' && s.image.startsWith('data:')) {
        // Base64 string length is roughly 4/3 of the actual file size
        const sizeInBytes = Math.ceil((s.image.length - s.image.indexOf(',') - 1) * 0.75);
        totalSize += sizeInBytes;
        return { symbol: s, size: sizeInBytes };
      }
      // For URLs, size is minimal
      return { symbol: s, size: s.image.length };
    });
    
    // Check if total size is too large for localStorage (4MB limit)
    const LOCAL_STORAGE_LIMIT = 4 * 1024 * 1024; // 4MB
    const INDIVIDUAL_LIMIT = 500 * 1024; // 500KB per symbol threshold
    
    // Determine storage strategy based on size
    if (totalSize > LOCAL_STORAGE_LIMIT) {
      console.log(`Total symbol data (${totalSize} bytes) exceeds localStorage limit, using hybrid storage`);
      
      // Ensure game directory exists on server
      await ensureGameDirectory(gameIdentifier);
      
      // Process each symbol based on its size
      const processedSymbols = await Promise.all(
        sizeEstimates.map(async ({ symbol, size }) => {
          // For large base64 images, store on server
          if (size > INDIVIDUAL_LIMIT && typeof symbol.image === 'string' && symbol.image.startsWith('data:')) {
            try {
              // Upload to server
              const fileName = `symbol_${symbol.id}.png`;
              const result = await uploadBase64Image(symbol.image, fileName, gameIdentifier, 'symbols');
              
              if (result) {
                // Return symbol with server URL instead of base64
                return {
                  ...symbol,
                  image: result.path,
                  storageMode: 'server'
                };
              }
              // Fall back to local storage if server upload fails
              return { ...symbol, storageMode: 'local' };
            } catch (uploadError) {
              console.error(`Error uploading symbol ${symbol.id} to server:`, uploadError);
              return { ...symbol, storageMode: 'local' };
            }
          }
          // Keep small images in localStorage
          return { ...symbol, storageMode: 'local' };
        })
      );
      
      // Store references and metadata in localStorage
      const storageKey = gameId 
        ? `slotai_symbols_${gameId}` 
        : 'slotai_symbols';
      
      localStorage.setItem(storageKey, JSON.stringify(processedSymbols));
      console.log(`Symbols saved with hybrid storage strategy`);
      
      // Also save a storage mode indicator
      localStorage.setItem(`${storageKey}_mode`, 'hybrid');
      
      return true;
    } else {
      // Small enough for localStorage, use standard approach
      const storageKey = gameId 
        ? `slotai_symbols_${gameId}` 
        : 'slotai_symbols';
      
      localStorage.setItem(storageKey, JSON.stringify(symbolsToSave));
      localStorage.setItem(`${storageKey}_mode`, 'local');
      console.log(`Symbols saved to localStorage with key: ${storageKey}`);
      
      return true;
    }
  } catch (err) {
    // Handle QuotaExceededError specifically
    if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_EXCEEDED') {
      console.warn('localStorage quota exceeded, attempting server fallback');
      
      try {
        // Try server storage as a last resort
        await forcedServerStorage(symbols, gameId || 'default');
        return true;
      } catch (serverError) {
        console.error('Error saving symbols to server (fallback):', serverError);
        return false;
      }
    }
    
    console.error('Error saving symbols to localStorage:', err);
    return false;
  }
};

/**
 * Force server storage for all symbols when localStorage has failed
 */
const forcedServerStorage = async (symbols: Array<any>, gameId: string): Promise<void> => {
  // Ensure game directory exists
  await ensureGameDirectory(gameId);
  
  // Process each symbol
  const processedSymbols = await Promise.all(
    symbols
      .filter(s => s.image)
      .map(async (symbol, index) => {
        // Only process base64 images
        if (typeof symbol.image === 'string' && symbol.image.startsWith('data:')) {
          // Upload to server
          const fileName = `symbol_${symbol.id || index}.png`;
          const result = await uploadBase64Image(symbol.image, fileName, gameId, 'symbols');
          
          if (result) {
            // Return symbol metadata with server URL
            return {
              id: symbol.id,
              name: symbol.name,
              type: symbol.type,
              image: result.path,
              weight: symbol.weight || getDefaultWeight(symbol.type),
              isWild: symbol.type === 'wild',
              isScatter: symbol.type === 'scatter',
              storageMode: 'server'
            };
          }
        }
        
        // For non-base64 or failed uploads, just keep a reference
        return {
          id: symbol.id,
          name: symbol.name,
          type: symbol.type,
          image: typeof symbol.image === 'string' ? symbol.image : null,
          weight: symbol.weight || getDefaultWeight(symbol.type),
          isWild: symbol.type === 'wild',
          isScatter: symbol.type === 'scatter',
          storageMode: 'reference'
        };
      })
  );
  
  // Store references in localStorage
  const storageKey = `slotai_symbols_${gameId}`;
  try {
    // Store only references, which should be much smaller
    localStorage.setItem(storageKey, JSON.stringify(processedSymbols));
    localStorage.setItem(`${storageKey}_mode`, 'server');
  } catch (e) {
    // If even this fails, store in sessionStorage as a last resort
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(processedSymbols));
      sessionStorage.setItem(`${storageKey}_mode`, 'server');
    } catch (sessionError) {
      console.error('Failed to store even symbol references in sessionStorage:', sessionError);
      // At this point, we have server storage but no client-side reference
    }
  }
};
```

### 3. Update the Symbol Loading Function

Enhance the getSymbolsFromLocalStorage function:

```typescript
/**
 * Retrieves saved symbols from localStorage or server
 */
export const getSymbolsFromLocalStorage = async (
  gameId?: string
): Promise<StoredSymbol[] | null> => {
  try {
    const storageKey = gameId 
      ? `slotai_symbols_${gameId}` 
      : 'slotai_symbols';
    
    // Check storage mode
    const storageMode = localStorage.getItem(`${storageKey}_mode`) || 'local';
    
    // Get stored symbol data/references
    const savedSymbols = localStorage.getItem(storageKey) || 
                        sessionStorage.getItem(storageKey);
    
    if (\!savedSymbols) return null;
    
    const symbols = JSON.parse(savedSymbols) as StoredSymbol[];
    
    // If using local-only storage, just return the symbols
    if (storageMode === 'local') {
      return symbols;
    }
    
    // For hybrid or server mode, we need to handle server-stored images
    if (storageMode === 'hybrid' || storageMode === 'server') {
      // Each symbol may have its own storage mode
      return symbols.map(symbol => {
        // If the image is a server URL or not base64, it's already correct
        if (\!symbol.image || 
            \!symbol.image.startsWith('data:') || 
            symbol.storageMode === 'reference') {
          return symbol;
        }
        
        // If it has a storageMode of server but still contains base64 data,
        // this is inconsistent - we should re-upload it
        if (symbol.storageMode === 'server' && symbol.image.startsWith('data:')) {
          console.warn(`Symbol ${symbol.id} has inconsistent storage state, should re-save`);
        }
        
        return symbol;
      });
    }
    
    return symbols;
  } catch (err) {
    console.error('Error retrieving symbols from storage:', err);
    return null;
  }
};
```

### 4. Add Debug and Diagnostic Tools

```typescript
/**
 * Utility to diagnose storage issues
 */
export const diagnoseStorageIssues = async (gameId?: string): Promise<any> => {
  const storageKey = gameId 
    ? `slotai_symbols_${gameId}` 
    : 'slotai_symbols';
  
  try {
    // Check available space
    let usedSpace = 0;
    let availableSpace = 0;
    
    try {
      // Estimate available space by adding data until quota exceeded
      const testKey = '_storage_test_';
      const testData = 'a'.repeat(1024); // 1KB per test
      let i = 0;
      
      localStorage.setItem(testKey + i, testData);
      i++;
      
      try {
        while (true) {
          localStorage.setItem(testKey + i, testData);
          i++;
        }
      } catch (e) {
        // Quota exceeded, this tells us the approximate limit
        availableSpace = (i - 1) * 1024; // Subtract 1 because the last one failed
      }
      
      // Clean up test data
      for (let j = 0; j < i; j++) {
        localStorage.removeItem(testKey + j);
      }
    } catch (e) {
      console.error("Error testing storage capacity:", e);
    }
    
    // Check current storage mode
    const storageMode = localStorage.getItem(`${storageKey}_mode`) || 'unknown';
    
    // Check if the symbols are currently stored
    const symbolsStored = localStorage.getItem(storageKey) \!== null;
    const sessionSymbolsStored = sessionStorage.getItem(storageKey) \!== null;
    
    // Try to get server symbols directory size if possible
    let serverStatus = "Unknown";
    if (gameId) {
      try {
        // This requires a new endpoint on the server to get directory size
        const response = await axios.get(`/api/games/${gameId}/symbols/stats`);
        serverStatus = response.data;
      } catch (e) {
        serverStatus = "Error checking server: " + e.message;
      }
    }
    
    return {
      usedSpace,
      availableSpace,
      storageMode,
      symbolsInLocalStorage: symbolsStored,
      symbolsInSessionStorage: sessionSymbolsStored,
      serverStatus,
      browserSupport: {
        localStorage: typeof localStorage \!== 'undefined',
        sessionStorage: typeof sessionStorage \!== 'undefined',
        quota: navigator.storage && typeof navigator.storage.estimate === 'function' 
            ? "Supported" : "Not supported"
      }
    };
  } catch (err) {
    return {
      error: err.message,
      stack: err.stack
    };
  }
};
```

## Additional Recommendations

1. **Migration Tool**
   - Create a migration tool to move existing localStorage data to the server
   - Add an automatic check at application startup to migrate if needed

2. **Data Compression**
   - Consider adding LZ-based compression for localStorage data
   - This could reduce base64 image sizes by 30-50%

3. **User Experience**
   - Add a storage indicator in the UI to show when server storage is being used
   - Provide a way for users to clear cached data

4. **Error Recovery**
   - Implement resilient storage that can recover from partial failures
   - Add version tracking to handle format changes

## Summary

This solution provides a robust approach to handle symbol storage that:

1. Works within browser localStorage limits by intelligently offloading large data to the server
2. Maintains a consistent API so existing code requires minimal changes
3. Handles error conditions gracefully with appropriate fallbacks
4. Leverages existing server infrastructure that's already in place
5. Provides diagnostic tools to help identify and resolve storage issues

Implementation requires creating the missing gameStorage.ts module and enhancing symbolStorage.ts with the smart fallback logic, then updating any direct calls to account for the new async nature of some functions.
