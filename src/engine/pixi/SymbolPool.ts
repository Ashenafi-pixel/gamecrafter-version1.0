import * as PIXI from 'pixi.js';

/**
 * Professional Symbol Pool for Tier 1 Slot Games
 * Manages sprite recycling for optimal performance
 */
export class SymbolPool {
  private available: PIXI.Sprite[] = [];
  private inUse: Set<PIXI.Sprite> = new Set();
  private textureCache: Map<string, PIXI.Texture> = new Map();
  
  constructor() {
    // Pre-create initial pool
    this.expandPool(50);
  }
  
  /**
   * Get a symbol sprite from the pool
   */
  async getSymbol(textureIdOrUrl: string): Promise<PIXI.Sprite | null> {
    console.log(`🔍 SymbolPool.getSymbol called for: ${textureIdOrUrl.substring(0, 50)}...`);
    
    let texture = this.textureCache.get(textureIdOrUrl);
    console.log(`🔍 SymbolPool: Texture from cache: ${texture ? 'FOUND' : 'NOT FOUND'}`);
    
    if (!texture) {
      // Check if this is a blob URL - these should have been preloaded
      if (textureIdOrUrl.startsWith('blob:')) {
        console.warn(`Blob URL not preloaded: ${textureIdOrUrl}. Call preloadTextures first.`);
        return null;
      }
      
      // Try to get from PIXI cache first
      try {
        // For data URLs, ensure we wait for texture to load
        if (textureIdOrUrl.startsWith('data:')) {
          console.log(`🔍 SymbolPool: Creating texture from data URL...`);
          texture = PIXI.Texture.from(textureIdOrUrl);
          console.log(`🔍 SymbolPool: Texture created, valid: ${texture.baseTexture.valid}`);
          
          // If baseTexture is not ready, wait for it
          if (!texture.baseTexture.valid) {
            console.log(`🔍 SymbolPool: Waiting for texture to load...`);
            await new Promise((resolve, reject) => {
              if (texture.baseTexture.valid) {
                console.log(`🔍 SymbolPool: Texture already valid, resolving immediately`);
                resolve(true);
                return;
              }
              
              const timeout = setTimeout(() => {
                console.warn(`⚠️ SymbolPool: Texture load timeout for: ${textureIdOrUrl.substring(0, 50)}...`);
                reject(new Error('Texture load timeout'));
              }, 5000); // Increased timeout for data URLs
              
              texture.baseTexture.once('loaded', () => {
                console.log(`✅ SymbolPool: Texture loaded successfully`);
                clearTimeout(timeout);
                resolve(true);
              });
              
              texture.baseTexture.once('error', (error) => {
                console.error(`SymbolPool: Texture load error:`, error);
                clearTimeout(timeout);
                reject(error);
              });
            });
            console.log(`🔍 SymbolPool: Texture loading wait completed`);
          }
        } else {
          texture = PIXI.Texture.from(textureIdOrUrl);
        }
        
        if (texture && texture !== PIXI.Texture.EMPTY && texture.baseTexture.valid) {
          this.textureCache.set(textureIdOrUrl, texture);
        } else {
          console.warn(`Texture not found or invalid: ${textureIdOrUrl}`);
          return null;
        }
      } catch (error) {
        console.warn(`Failed to create texture from: ${textureIdOrUrl}`, error);
        return null;
      }
    }
    
    // Get sprite from pool or create new one
    let sprite = this.available.pop();
    if (!sprite) {
      this.expandPool(10);
      sprite = this.available.pop();
    }
    
    // Ensure sprite is valid before configuring
    if (!sprite) {
      console.error('CRITICAL: Failed to get sprite from pool after expansion');
      return null;
    }
    
    // Validate sprite is properly initialized
    if (!sprite.scale || !sprite.anchor || sprite.destroyed) {
      console.error('CRITICAL: Sprite from pool is invalid or destroyed, creating new one');
      // Create a new properly initialized sprite
      sprite = new PIXI.Sprite();
    }
    
    // Configure sprite with additional safety checks
    try {
      sprite.texture = texture;
      sprite.visible = true;
      sprite.alpha = 1;
      sprite.scale.set(1);
      sprite.anchor.set(0.5);
      
      
      this.inUse.add(sprite);
      return sprite;
    } catch (error) {
      console.error('Failed to configure sprite:', error);
      // Return a safe fallback sprite
      const fallbackSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      fallbackSprite.visible = true;
      fallbackSprite.alpha = 1;
      fallbackSprite.scale.set(1);
      fallbackSprite.anchor.set(0.5);
      fallbackSprite.tint = 0xFF0000; // Red tint to indicate error
      this.inUse.add(fallbackSprite);
      return fallbackSprite;
    }
  }
  
  /**
   * Return a symbol to the pool
   */
  releaseSymbol(sprite: PIXI.Sprite): void {
    if (!this.inUse.has(sprite)) return;
    
    this.inUse.delete(sprite);
    
    // Reset sprite state
    sprite.visible = false;
    sprite.parent?.removeChild(sprite);
    sprite.filters = null;
    sprite.mask = null;
    sprite.tint = 0xFFFFFF;
    sprite.scale.set(1, 1); // Reset scale to baseline
    
    this.available.push(sprite);
  }
  
  /**
   * Release all symbols back to pool
   */
  releaseAll(): void {
    this.inUse.forEach(sprite => {
      sprite.visible = false;
      sprite.parent?.removeChild(sprite);
      sprite.filters = null;
      sprite.mask = null;
      sprite.tint = 0xFFFFFF;
      sprite.scale.set(1, 1); // Reset scale to baseline
      this.available.push(sprite);
    });
    this.inUse.clear();
  }
  
  /**
   * Pre-load textures for instant access
   */
  async preloadTextures(urls: string[]): Promise<void> {
    const loadPromises = urls.map(async (url) => {
      try {
        let texture: PIXI.Texture;
        
        // Handle blob URLs by converting to base64
        if (url.startsWith('blob:')) {
          console.log(`🔄 Converting blob URL to base64 for symbol: ${url.substring(0, 50)}...`);
          const response = await fetch(url);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          texture = await PIXI.Assets.load(base64);
          // Still cache it with the original URL as key
          this.textureCache.set(url, texture);
        } else {
          texture = await PIXI.Assets.load(url);
          this.textureCache.set(url, texture);
        }
        
        console.log(`✅ Preloaded texture: ${url.substring(0, 50)}...`);
      } catch (error) {
        console.warn(`Failed to preload texture: ${url}`, error);
      }
    });
    
    await Promise.all(loadPromises);
    console.log(`✅ Preloaded ${this.textureCache.size} textures total`);
  }
  
  /**
   * Expand the pool with more sprites
   */
  private expandPool(count: number): void {
    for (let i = 0; i < count; i++) {
      // Create properly initialized sprites with error handling
      try {
        const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        sprite.visible = false;
        sprite.anchor.set(0.5); // Initialize anchor
        sprite.scale.set(1);    // Initialize scale
        this.available.push(sprite);
      } catch (error) {
        console.error('Failed to create sprite during pool expansion:', error);
      }
    }
    
    // Verify we actually created sprites
    if (this.available.length === 0) {
      console.error('CRITICAL: Pool expansion failed, no sprites created');
    }
  }
  
  /**
   * Get pool statistics
   */
  getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }
  
  /**
   * Clear all texture cache
   */
  clearTextureCache(): void {
    console.log('[SymbolPool] Clearing texture cache');
    // Destroy all cached textures
    this.textureCache.forEach((texture, url) => {
      console.log(`[SymbolPool] Removing texture from cache: ${url.substring(0, 50)}...`);
    });
    this.textureCache.clear();
  }

  /**
   * Clear available symbols list (not applicable for this pool implementation)
   */
  clearAvailableSymbols(): void {
    console.log('[SymbolPool] Clearing symbols (releasing all back to pool)');
    this.releaseAll();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.releaseAll();
    
    // Destroy all sprites
    [...this.available, ...this.inUse].forEach(sprite => {
      sprite.destroy();
    });
    
    this.available = [];
    this.inUse.clear();
    this.textureCache.clear();
  }
}