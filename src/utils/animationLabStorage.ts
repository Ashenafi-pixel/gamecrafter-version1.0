/**
 * Animation Lab Storage Utility
 * Saves sprites and images to the animation lab folder for debugging and reuse
 */

export interface AnimationLabSprite {
  id: string;
  name: string;
  type: string;
  originalImageUrl: string;
  spriteSheetUrl?: string;
  components: Array<{
    name: string;
    description: string;
    bounds?: { x: number; y: number; width: number; height: number };
    attachmentPoint?: { x: number; y: number };
  }>;
  detectionResults: any;
  generatedAt: number;
  prompt?: string;
}

/**
 * Save original symbol image to animation lab folder
 */
export async function saveSymbolToAnimationLab(
  imageUrl: string, 
  symbolId: string, 
  prompt?: string,
  detectionResults?: any
): Promise<string> {
  try {
    console.log(`[AnimationLab] 💾 Saving symbol ${symbolId} to animation lab...`);
    
    // 🚀 DEVELOPMENT MODE: Skip localStorage entirely for sprites to avoid quota issues
    if ((process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost')) {
      console.log(`[AnimationLab] 🚀 Development mode: Skipping localStorage to avoid quota, using direct URL`);
      return imageUrl; // Return original URL directly without any storage
    }
    
    // Handle data URLs properly by converting to blob without fetch
    let blob: Blob;
    if (imageUrl.startsWith('data:')) {
      // Convert data URL to blob directly without fetch to avoid URL length limits
      const base64Data = imageUrl.split(',')[1];
      const mimeType = imageUrl.split(',')[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
      console.log(`[AnimationLab] 📷 Converted data URL to blob: ${blob.size} bytes`);
    } else {
      // Regular URL - use fetch
      const response = await fetch(imageUrl);
      blob = await response.blob();
    }
    
    // Create filename
    const timestamp = Date.now();
    const filename = `${symbolId}_${timestamp}_original.png`;
    
    // Convert blob back to base64 for JSON API
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    const base64Data = await base64Promise;
    
    // Create JSON payload for the API - Use separate animationlab folder
    const payload = {
      image: base64Data,
      gameId: 'animationlab',
      symbolName: symbolId,
      symbolId: symbolId,
      folder: 'symbols',
      metadata: {
        prompt,
        detectionResults,
        generatedAt: timestamp,
        type: 'original'
      }
    };
    
    // Save to server with JSON
    const saveResponse = await fetch('/.netlify/functions/save-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (saveResponse.ok) {
      const result = await saveResponse.json();
      const savedPath = `/game-assets/animationlab/symbols/${filename}`;
      
      console.log(`[AnimationLab] ✅ Symbol saved to: ${savedPath}`);
      
      // Also save metadata to localStorage for quick access
      const spriteData: AnimationLabSprite = {
        id: symbolId,
        name: `Symbol ${symbolId}`,
        type: 'original',
        originalImageUrl: savedPath,
        components: [],
        detectionResults,
        generatedAt: timestamp,
        prompt
      };
      
      // Store in animation lab registry (with size limit protection)
      try {
        const registry = getAnimationLabRegistry();
        registry[symbolId] = spriteData;
        
        // Check if registry is getting too large
        const registryString = JSON.stringify(registry);
        if (registryString.length > 5000000) { // 5MB limit
          console.warn('[AnimationLab] 🧹 Registry getting large, clearing old entries');
          const entries = Object.entries(registry);
          const recent = entries
            .sort(([,a], [,b]) => b.generatedAt - a.generatedAt)
            .slice(0, 20); // Keep only 20 most recent
          const newRegistry = Object.fromEntries(recent);
          localStorage.setItem('animation_lab_registry', JSON.stringify(newRegistry));
        } else {
          localStorage.setItem('animation_lab_registry', registryString);
        }
      } catch (quotaError) {
        console.warn('[AnimationLab] 🧹 LocalStorage quota exceeded, clearing old data');
        // Clear old animation lab data and keep only essentials
        const essentialData = { [symbolId]: spriteData };
        localStorage.setItem('animation_lab_registry', JSON.stringify(essentialData));
      }
      
      return savedPath;
    } else {
      console.error(`[AnimationLab] Failed to save symbol:`, saveResponse.statusText);
      
      // Fallback: Save to localStorage and return original URL
      const spriteData: AnimationLabSprite = {
        id: symbolId,
        name: `Symbol ${symbolId}`,
        type: 'original',
        originalImageUrl: imageUrl, // Keep original data URL
        components: [],
        detectionResults,
        generatedAt: timestamp,
        prompt
      };
      
      const registry = getAnimationLabRegistry();
      registry[symbolId] = spriteData;
      localStorage.setItem('animation_lab_registry', JSON.stringify(registry));
      console.log(`[AnimationLab] 💾 Saved to localStorage as fallback`);
      
      return imageUrl; // Return original URL as fallback
    }
    
  } catch (error) {
    console.error(`[AnimationLab] Error saving symbol:`, error);
    
    // Fallback: Save to localStorage only
    try {
      const timestamp = Date.now();
      const spriteData: AnimationLabSprite = {
        id: symbolId,
        name: `Symbol ${symbolId}`,
        type: 'original',
        originalImageUrl: imageUrl,
        components: [],
        detectionResults,
        generatedAt: timestamp,
        prompt
      };
      
      const registry = getAnimationLabRegistry();
      registry[symbolId] = spriteData;
      localStorage.setItem('animation_lab_registry', JSON.stringify(registry));
      console.log(`[AnimationLab] 💾 Saved to localStorage in catch block`);
    } catch (fallbackError) {
      console.error(`[AnimationLab] Even localStorage fallback failed:`, fallbackError);
      // Final fallback: Clear animation lab registry and try once more
      try {
        localStorage.removeItem('animation_lab_registry');
        console.log('[AnimationLab] 🧹 Cleared animation lab registry due to quota');
        
        const minimalSprite: AnimationLabSprite = {
          id: symbolId,
          name: `Symbol ${symbolId}`,
          type: 'original',
          originalImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent pixel
          components: [],
          detectionResults: null,
          generatedAt: timestamp,
          prompt: prompt || 'Recovery placeholder'
        };
        
        localStorage.setItem('animation_lab_registry', JSON.stringify({ [symbolId]: minimalSprite }));
        console.log('[AnimationLab] 💾 Created minimal sprite entry as final fallback');
      } catch (finalError) {
        console.error('[AnimationLab] All storage methods failed:', finalError);
      }
    }
    
    return imageUrl; // Return original URL as fallback
  }
}

/**
 * Save sprite components to animation lab folder
 */
export async function saveSpriteComponentsToAnimationLab(
  spriteSheetUrl: string,
  symbolId: string,
  components: any[]
): Promise<string> {
  try {
    console.log(`[AnimationLab] 💾 Saving sprite components for ${symbolId} to filesystem...`);
    
    // Convert sprite sheet URL to base64
    let base64Data: string;
    if (spriteSheetUrl.startsWith('data:')) {
      base64Data = spriteSheetUrl;
    } else {
      const response = await fetch(spriteSheetUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      base64Data = await base64Promise;
    }
    
    // Create filename
    const timestamp = Date.now();
    const filename = `${symbolId}_${timestamp}_sprites.png`;
    
    // Create JSON payload for the API - Use separate animationlab folder  
    const payload = {
      image: base64Data,
      gameId: 'animationlab',
      symbolName: symbolId,
      symbolId: symbolId,
      folder: 'sprites',
      metadata: {
        components,
        generatedAt: timestamp,
        type: 'sprite_sheet'
      }
    };
    
    // Save to server with JSON
    const saveResponse = await fetch('/.netlify/functions/save-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (saveResponse.ok) {
      const savedPath = `/game-assets/animationlab/sprites/${filename}`;
      
      console.log(`[AnimationLab] ✅ Sprite components saved to: ${savedPath}`);
      
      // Update registry with sprite sheet
      const registry = getAnimationLabRegistry();
      if (registry[symbolId]) {
        registry[symbolId].spriteSheetUrl = savedPath;
        registry[symbolId].components = components;
        localStorage.setItem('animation_lab_registry', JSON.stringify(registry));
      }
      
      return savedPath;
    } else {
      console.error(`[AnimationLab] Failed to save sprite components:`, saveResponse.statusText);
      return spriteSheetUrl;
    }
    
  } catch (error) {
    console.error(`[AnimationLab] Error saving sprite components:`, error);
    return spriteSheetUrl;
  }
}

/**
 * Get animation lab registry from localStorage
 */
export function getAnimationLabRegistry(): Record<string, AnimationLabSprite> {
  try {
    const registry = localStorage.getItem('animation_lab_registry');
    return registry ? JSON.parse(registry) : {};
  } catch (error) {
    console.error('[AnimationLab] Error reading registry:', error);
    return {};
  }
}

/**
 * List all saved sprites in animation lab
 */
export function listAnimationLabSprites(): AnimationLabSprite[] {
  const registry = getAnimationLabRegistry();
  return Object.values(registry).sort((a, b) => b.generatedAt - a.generatedAt);
}

/**
 * Get sprite by ID from animation lab
 */
export function getAnimationLabSprite(symbolId: string): AnimationLabSprite | null {
  const registry = getAnimationLabRegistry();
  return registry[symbolId] || null;
}

/**
 * Delete sprite from animation lab
 */
export function deleteAnimationLabSprite(symbolId: string): void {
  const registry = getAnimationLabRegistry();
  delete registry[symbolId];
  localStorage.setItem('animation_lab_registry', JSON.stringify(registry));
  console.log(`[AnimationLab] 🗑️ Deleted sprite ${symbolId} from registry`);
}

/**
 * Create a download link for debugging
 */
export function createDebugDownload(imageUrl: string, filename: string): void {
  try {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`[AnimationLab] 📥 Debug download created for ${filename}`);
  } catch (error) {
    console.error('[AnimationLab] Error creating debug download:', error);
  }
}

/**
 * Clear animation lab storage to resolve quota issues
 */
export function clearAnimationLabStorage(): void {
  try {
    console.log('[AnimationLab] 🧹 Clearing animation lab storage...');
    
    const beforeUsage = getStorageUsage();
    console.log(`[AnimationLab] 📊 Storage before clearing: ${beforeUsage.percentage}% (${(beforeUsage.used / 1024 / 1024).toFixed(1)}MB)`);
    
    // Clear registry
    localStorage.removeItem('animation_lab_registry');
    
    // Clear all sprite component data
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    keys.forEach(key => {
      if (key.startsWith('sprite_components_') || 
          key.startsWith('anim_test_') ||
          key.startsWith('test_symbol_') ||
          key.includes('animation_lab') ||
          key.includes('pixi_') ||
          key.includes('gsap_') ||
          key.includes('mesh_')) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    const afterUsage = getStorageUsage();
    console.log(`[AnimationLab] ✅ Animation lab storage cleared: ${clearedCount} items removed`);
    console.log(`[AnimationLab] 📊 Storage after clearing: ${afterUsage.percentage}% (${(afterUsage.used / 1024 / 1024).toFixed(1)}MB)`);
    console.log(`[AnimationLab] 💾 Space freed: ${((beforeUsage.used - afterUsage.used) / 1024 / 1024).toFixed(1)}MB`);
  } catch (error) {
    console.error('[AnimationLab] Error clearing storage:', error);
  }
}

/**
 * Get storage usage information
 */
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  try {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    const total = 10 * 1024 * 1024; // 10MB typical limit
    const percentage = Math.round((used / total) * 100);
    
    return { used, total, percentage };
  } catch (error) {
    return { used: 0, total: 0, percentage: 0 };
  }
}