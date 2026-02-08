import * as PIXI from 'pixi.js';

/**
 * Asset Manager for professional animation system
 * Handles texture loading, caching, and memory management
 */
export interface AssetMetadata {
  id: string;
  name: string;
  type: 'image' | 'spritesheet' | 'generated';
  format: string;
  size: { width: number; height: number };
  createdAt: Date;
  source?: string;
}

export interface SpriteSheetData {
  frames: Record<string, {
    frame: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
  }>;
  meta: {
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: number;
  };
}

export class AssetManager {
  private textures: Map<string, PIXI.Texture> = new Map();
  private metadata: Map<string, AssetMetadata> = new Map();
  private spriteSheets: Map<string, PIXI.Spritesheet> = new Map();

  constructor() {
    // PIXI v7+ uses Assets API instead of Loader
  }

  /**
   * Load single image asset
   */
  async loadImageAsset(
    id: string, 
    source: File | Blob | string, 
    name: string
  ): Promise<PIXI.Texture> {
    try {
      let texture: PIXI.Texture;
      
      if (typeof source === 'string') {
        // Direct URL loading
        texture = await PIXI.Texture.fromURL(source);
      } else {
        // For File/Blob, create a persistent URL and load
        const url = URL.createObjectURL(source);
        try {
          texture = await PIXI.Texture.fromURL(url);
          // Don't revoke URL immediately - let PIXI handle it
        } catch (loadError) {
          URL.revokeObjectURL(url);
          throw loadError;
        }
      }

      // Validate texture was loaded properly
      if (!texture || !texture.baseTexture || texture.width === 0 || texture.height === 0) {
        throw new Error('Invalid texture loaded - zero dimensions or missing baseTexture');
      }

      // Store texture and metadata
      this.textures.set(id, texture);
      this.metadata.set(id, {
        id,
        name,
        type: 'image',
        format: this.getFormatFromSource(source),
        size: { width: texture.width, height: texture.height },
        createdAt: new Date(),
        source: typeof source === 'string' ? source : undefined
      });

      console.log(`Asset loaded successfully: ${name} (${texture.width}x${texture.height})`);
      return texture;
    } catch (error) {
      console.error(`Failed to load image asset ${id}:`, error);
      throw new Error(`Failed to load image asset ${id}: ${error}`);
    }
  }

  /**
   * Load sprite sheet asset
   */
  async loadSpriteSheet(
    id: string,
    imageSource: File | Blob | string,
    atlasData: SpriteSheetData,
    name: string
  ): Promise<PIXI.Spritesheet> {
    try {
      let texture: PIXI.Texture;
      
      if (typeof imageSource === 'string') {
        // Direct URL loading
        texture = await PIXI.Texture.fromURL(imageSource);
      } else {
        // For File/Blob, create a persistent URL and load
        const url = URL.createObjectURL(imageSource);
        try {
          texture = await PIXI.Texture.fromURL(url);
          // Don't revoke URL immediately - let PIXI handle it
        } catch (loadError) {
          URL.revokeObjectURL(url);
          throw loadError;
        }
      }

      // Validate texture was loaded properly
      if (!texture || !texture.baseTexture || texture.width === 0 || texture.height === 0) {
        throw new Error('Invalid texture loaded for sprite sheet - zero dimensions or missing baseTexture');
      }

      // Create sprite sheet
      const spriteSheet = new PIXI.Spritesheet(texture, atlasData);
      await spriteSheet.parse();

      // Store sprite sheet and metadata
      this.spriteSheets.set(id, spriteSheet);
      this.metadata.set(id, {
        id,
        name,
        type: 'spritesheet',
        format: this.getFormatFromSource(imageSource),
        size: { width: texture.width, height: texture.height },
        createdAt: new Date(),
        source: typeof imageSource === 'string' ? imageSource : undefined
      });

      console.log(`Sprite sheet loaded successfully: ${name} (${texture.width}x${texture.height})`);
      return spriteSheet;
    } catch (error) {
      console.error(`Failed to load sprite sheet ${id}:`, error);
      throw new Error(`Failed to load sprite sheet ${id}: ${error}`);
    }
  }

  /**
   * Create texture from generated image data
   */
  createGeneratedAsset(
    id: string,
    imageData: ImageData | HTMLCanvasElement | HTMLImageElement,
    name: string
  ): PIXI.Texture {
    try {
      let texture: PIXI.Texture;
      
      if (imageData instanceof ImageData) {
        // Convert ImageData to canvas
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);
        texture = PIXI.Texture.from(canvas);
      } else {
        texture = PIXI.Texture.from(imageData);
      }

      // Store texture and metadata
      this.textures.set(id, texture);
      this.metadata.set(id, {
        id,
        name,
        type: 'generated',
        format: 'canvas',
        size: { width: texture.width, height: texture.height },
        createdAt: new Date()
      });

      return texture;
    } catch (error) {
      throw new Error(`Failed to create generated asset ${id}: ${error}`);
    }
  }

  /**
   * Get texture by ID
   */
  getTexture(id: string): PIXI.Texture | null {
    return this.textures.get(id) || null;
  }

  /**
   * Get sprite sheet by ID
   */
  getSpriteSheet(id: string): PIXI.Spritesheet | null {
    return this.spriteSheets.get(id) || null;
  }

  /**
   * Get asset metadata
   */
  getMetadata(id: string): AssetMetadata | null {
    return this.metadata.get(id) || null;
  }

  /**
   * Get all asset metadata
   */
  getAllMetadata(): AssetMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Create sprite from texture
   */
  createSprite(id: string): PIXI.Sprite | null {
    const texture = this.getTexture(id);
    if (!texture) return null;
    
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
  }

  /**
   * Create animated sprite from sprite sheet
   */
  createAnimatedSprite(id: string, animationName?: string): PIXI.AnimatedSprite | null {
    const spriteSheet = this.getSpriteSheet(id);
    if (!spriteSheet) return null;
    
    const textures = animationName 
      ? spriteSheet.animations[animationName]
      : Object.values(spriteSheet.textures);
    
    if (!textures || textures.length === 0) return null;
    
    const animatedSprite = new PIXI.AnimatedSprite(textures);
    animatedSprite.anchor.set(0.5);
    animatedSprite.animationSpeed = 0.1;
    return animatedSprite;
  }

  /**
   * Validate image format support
   */
  validateImageFormat(file: File): boolean {
    const supportedFormats = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    return supportedFormats.includes(file.type);
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    textureCount: number;
    spriteSheetCount: number;
    estimatedMemoryMB: number;
  } {
    let estimatedMemory = 0;
    
    // Estimate texture memory usage
    this.textures.forEach(texture => {
      if (texture && texture.width && texture.height) {
        const bytes = texture.width * texture.height * 4; // RGBA
        estimatedMemory += bytes;
      }
    });
    
    this.spriteSheets.forEach(spriteSheet => {
      if (spriteSheet && spriteSheet.baseTexture && 
          spriteSheet.baseTexture.width && spriteSheet.baseTexture.height) {
        const bytes = spriteSheet.baseTexture.width * spriteSheet.baseTexture.height * 4;
        estimatedMemory += bytes;
      }
    });
    
    return {
      textureCount: this.textures.size,
      spriteSheetCount: this.spriteSheets.size,
      estimatedMemoryMB: estimatedMemory / (1024 * 1024)
    };
  }

  /**
   * Remove asset and clean up memory
   */
  removeAsset(id: string): boolean {
    const texture = this.textures.get(id);
    const spriteSheet = this.spriteSheets.get(id);
    
    if (texture) {
      texture.destroy(true);
      this.textures.delete(id);
    }
    
    if (spriteSheet) {
      spriteSheet.destroy(true);
      this.spriteSheets.delete(id);
    }
    
    this.metadata.delete(id);
    return true;
  }

  /**
   * Clear all assets and clean up memory
   */
  clearAll(): void {
    // Destroy all textures
    this.textures.forEach(texture => texture.destroy(true));
    this.textures.clear();
    
    // Destroy all sprite sheets
    this.spriteSheets.forEach(spriteSheet => spriteSheet.destroy(true));
    this.spriteSheets.clear();
    
    // Clear metadata
    this.metadata.clear();
  }

  /**
   * Export asset list for project saving
   */
  exportAssetList(): AssetMetadata[] {
    return this.getAllMetadata();
  }

  private getFormatFromSource(source: File | Blob | string): string {
    if (typeof source === 'string') {
      const extension = source.split('.').pop()?.toLowerCase();
      return extension || 'unknown';
    } else if (source instanceof File) {
      return source.type.split('/')[1] || 'unknown';
    } else {
      return 'blob';
    }
  }
}