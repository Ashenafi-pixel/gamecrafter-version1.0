import * as PIXI from 'pixi.js';
import { AssetManager, AssetMetadata } from './AssetManager';
import { ImageAnalysisResult } from './ImageAnalyzer';

/**
 * Sprite Management System for Animation Lab
 * Handles sprite creation, positioning, layering, and manipulation
 */

export interface SpriteConfig {
  id: string;
  assetId: string;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  alpha: number;
  anchor: { x: number; y: number };
  zIndex: number;
  visible: boolean;
  blendMode: PIXI.BLEND_MODES;
  tint: number;
}

export interface SpriteLayer {
  id: string;
  name: string;
  sprites: string[]; // sprite IDs
  visible: boolean;
  alpha: number;
  locked: boolean;
}

export interface SpriteTransform {
  position?: { x: number; y: number };
  scale?: { x: number; y: number };
  rotation?: number;
  alpha?: number;
  anchor?: { x: number; y: number };
}

export class SpriteManager {
  private sprites: Map<string, PIXI.Sprite> = new Map();
  private spriteConfigs: Map<string, SpriteConfig> = new Map();
  private layers: Map<string, SpriteLayer> = new Map();
  private container: PIXI.Container;
  private assetManager: AssetManager;
  private selectedSprites: Set<string> = new Set();

  constructor(container: PIXI.Container, assetManager: AssetManager) {
    this.container = container;
    this.assetManager = assetManager;
    
    // Create default layer
    this.createLayer('default', 'Default Layer');
  }

  /**
   * Create sprite from asset
   */
  createSprite(
    spriteId: string,
    assetId: string,
    config: Partial<SpriteConfig> = {}
  ): PIXI.Sprite {
    if (this.sprites.has(spriteId)) {
      throw new Error(`Sprite with ID ${spriteId} already exists`);
    }

    const sprite = this.assetManager.createSprite(assetId);
    if (!sprite) {
      throw new Error(`Failed to create sprite from asset ${assetId}`);
    }

    // Apply configuration
    const finalConfig: SpriteConfig = {
      id: spriteId,
      assetId,
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      alpha: 1,
      anchor: { x: 0.5, y: 0.5 },
      zIndex: 0,
      visible: true,
      blendMode: PIXI.BLEND_MODES.NORMAL,
      tint: 0xFFFFFF,
      ...config
    };

    this.applySpriteConfig(sprite, finalConfig);
    
    // Store references
    this.sprites.set(spriteId, sprite);
    this.spriteConfigs.set(spriteId, finalConfig);
    
    // Add to container
    this.container.addChild(sprite);
    
    // Add to default layer if no layer specified
    const defaultLayer = this.layers.get('default');
    if (defaultLayer && !defaultLayer.sprites.includes(spriteId)) {
      defaultLayer.sprites.push(spriteId);
    }
    
    // Update z-index
    this.updateLayerOrder();
    
    return sprite;
  }

  /**
   * Create sprite with automatic positioning based on analysis
   */
  createSpriteFromAnalysis(
    spriteId: string,
    assetId: string,
    analysis: ImageAnalysisResult,
    canvasSize: { width: number; height: number }
  ): PIXI.Sprite {
    // Calculate optimal position based on image metadata
    const { metadata } = analysis;
    if (!metadata || typeof metadata.width !== 'number' || typeof metadata.height !== 'number') {
      console.error('Invalid metadata in analysis:', metadata);
      throw new Error('Analysis metadata is missing width/height properties');
    }
    
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    
    // Scale to fit nicely in canvas (max 80% of canvas size)
    const maxWidth = canvasSize.width * 0.8;
    const maxHeight = canvasSize.height * 0.8;
    const scale = Math.min(maxWidth / metadata.width, maxHeight / metadata.height, 1); // Cap at 1x
    
    const config: Partial<SpriteConfig> = {
      position: { x: centerX, y: centerY },
      scale: { x: scale, y: scale },
      anchor: { x: 0.5, y: 0.5 }
    };
    
    return this.createSprite(spriteId, assetId, config);
  }

  /**
   * Update sprite configuration
   */
  updateSprite(spriteId: string, transform: SpriteTransform): void {
    const sprite = this.sprites.get(spriteId);
    const config = this.spriteConfigs.get(spriteId);
    
    if (!sprite || !config) {
      throw new Error(`Sprite ${spriteId} not found`);
    }
    
    // Update config
    if (transform.position) {
      config.position = { ...transform.position };
    }
    if (transform.scale) {
      config.scale = { ...transform.scale };
    }
    if (transform.rotation !== undefined) {
      config.rotation = transform.rotation;
    }
    if (transform.alpha !== undefined) {
      config.alpha = transform.alpha;
    }
    if (transform.anchor) {
      config.anchor = { ...transform.anchor };
    }
    
    // Apply to sprite
    this.applySpriteConfig(sprite, config);
  }

  /**
   * Get sprite by ID
   */
  getSprite(spriteId: string): PIXI.Sprite | null {
    return this.sprites.get(spriteId) || null;
  }

  /**
   * Get sprite configuration
   */
  getSpriteConfig(spriteId: string): SpriteConfig | null {
    return this.spriteConfigs.get(spriteId) || null;
  }

  /**
   * Get all sprites
   */
  getAllSprites(): { id: string; sprite: PIXI.Sprite; config: SpriteConfig }[] {
    const result: { id: string; sprite: PIXI.Sprite; config: SpriteConfig }[] = [];
    
    this.sprites.forEach((sprite, id) => {
      const config = this.spriteConfigs.get(id);
      if (config) {
        result.push({ id, sprite, config });
      }
    });
    
    return result;
  }

  /**
   * Remove sprite
   */
  removeSprite(spriteId: string): boolean {
    const sprite = this.sprites.get(spriteId);
    if (!sprite) return false;
    
    // Remove from container
    this.container.removeChild(sprite);
    
    // Remove from layers
    this.layers.forEach(layer => {
      const index = layer.sprites.indexOf(spriteId);
      if (index > -1) {
        layer.sprites.splice(index, 1);
      }
    });
    
    // Remove from selection
    this.selectedSprites.delete(spriteId);
    
    // Destroy sprite
    sprite.destroy();
    
    // Remove from maps
    this.sprites.delete(spriteId);
    this.spriteConfigs.delete(spriteId);
    
    return true;
  }

  /**
   * Create new layer
   */
  createLayer(layerId: string, name: string): SpriteLayer {
    if (this.layers.has(layerId)) {
      throw new Error(`Layer ${layerId} already exists`);
    }
    
    const layer: SpriteLayer = {
      id: layerId,
      name,
      sprites: [],
      visible: true,
      alpha: 1,
      locked: false
    };
    
    this.layers.set(layerId, layer);
    return layer;
  }

  /**
   * Move sprite to layer
   */
  moveToLayer(spriteId: string, layerId: string): void {
    const targetLayer = this.layers.get(layerId);
    if (!targetLayer) {
      throw new Error(`Layer ${layerId} not found`);
    }
    
    // Remove from current layers
    this.layers.forEach(layer => {
      const index = layer.sprites.indexOf(spriteId);
      if (index > -1) {
        layer.sprites.splice(index, 1);
      }
    });
    
    // Add to target layer
    targetLayer.sprites.push(spriteId);
    this.updateLayerOrder();
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;
    
    layer.visible = visible;
    
    // Update sprite visibility
    layer.sprites.forEach(spriteId => {
      const sprite = this.sprites.get(spriteId);
      if (sprite) {
        sprite.visible = visible && this.spriteConfigs.get(spriteId)?.visible !== false;
      }
    });
  }

  /**
   * Set layer alpha
   */
  setLayerAlpha(layerId: string, alpha: number): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;
    
    layer.alpha = Math.max(0, Math.min(1, alpha));
    
    // Update sprite alpha (multiply with sprite's own alpha)
    layer.sprites.forEach(spriteId => {
      const sprite = this.sprites.get(spriteId);
      const config = this.spriteConfigs.get(spriteId);
      if (sprite && config) {
        sprite.alpha = config.alpha * layer.alpha;
      }
    });
  }

  /**
   * Select sprite
   */
  selectSprite(spriteId: string, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this.selectedSprites.clear();
    }
    
    this.selectedSprites.add(spriteId);
  }

  /**
   * Deselect sprite
   */
  deselectSprite(spriteId: string): void {
    this.selectedSprites.delete(spriteId);
  }

  /**
   * Get selected sprites
   */
  getSelectedSprites(): string[] {
    return Array.from(this.selectedSprites);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedSprites.clear();
  }

  /**
   * Duplicate sprite
   */
  duplicateSprite(spriteId: string, newSpriteId: string): PIXI.Sprite {
    const config = this.spriteConfigs.get(spriteId);
    if (!config) {
      throw new Error(`Sprite ${spriteId} not found`);
    }
    
    // Create duplicate with slight offset
    const duplicateConfig = {
      ...config,
      id: newSpriteId,
      position: {
        x: config.position.x + 20,
        y: config.position.y + 20
      }
    };
    
    return this.createSprite(newSpriteId, config.assetId, duplicateConfig);
  }

  /**
   * Get sprite at position
   */
  getSpriteAtPosition(x: number, y: number): string | null {
    // Check sprites in reverse order (top to bottom)
    const sortedSprites = this.getAllSprites()
      .sort((a, b) => b.config.zIndex - a.config.zIndex);
    
    for (const { id, sprite } of sortedSprites) {
      if (sprite.visible && this.isPointInSprite(sprite, x, y)) {
        return id;
      }
    }
    
    return null;
  }

  /**
   * Get sprites in selection area
   */
  getSpritesInArea(x: number, y: number, width: number, height: number): string[] {
    const result: string[] = [];
    
    this.sprites.forEach((sprite, id) => {
      if (sprite.visible && this.isSpriteInArea(sprite, x, y, width, height)) {
        result.push(id);
      }
    });
    
    return result;
  }

  /**
   * Clear all sprites
   */
  clearAll(): void {
    // Remove all sprites from container
    this.sprites.forEach(sprite => {
      this.container.removeChild(sprite);
      sprite.destroy();
    });
    
    // Clear all maps
    this.sprites.clear();
    this.spriteConfigs.clear();
    this.selectedSprites.clear();
    
    // Reset layers
    this.layers.forEach(layer => {
      layer.sprites = [];
    });
  }

  /**
   * Export sprite configurations
   */
  exportConfigurations(): Record<string, SpriteConfig> {
    const result: Record<string, SpriteConfig> = {};
    this.spriteConfigs.forEach((config, id) => {
      result[id] = { ...config };
    });
    return result;
  }

  /**
   * Import sprite configurations
   */
  async importConfigurations(configurations: Record<string, SpriteConfig>): Promise<void> {
    for (const [id, config] of Object.entries(configurations)) {
      try {
        if (!this.sprites.has(id)) {
          this.createSprite(id, config.assetId, config);
        }
      } catch (error) {
        console.warn(`Failed to import sprite ${id}:`, error);
      }
    }
  }

  // Private helper methods

  private applySpriteConfig(sprite: PIXI.Sprite, config: SpriteConfig): void {
    sprite.position.set(config.position.x, config.position.y);
    sprite.scale.set(config.scale.x, config.scale.y);
    sprite.rotation = config.rotation;
    sprite.alpha = config.alpha;
    sprite.anchor.set(config.anchor.x, config.anchor.y);
    sprite.zIndex = config.zIndex;
    sprite.visible = config.visible;
    sprite.blendMode = config.blendMode;
    sprite.tint = config.tint;
  }

  private updateLayerOrder(): void {
    // Sort sprites by z-index
    const allSprites = Array.from(this.sprites.entries())
      .map(([id, sprite]) => ({ id, sprite, config: this.spriteConfigs.get(id)! }))
      .sort((a, b) => a.config.zIndex - b.config.zIndex);
    
    // Re-add sprites to container in correct order
    allSprites.forEach(({ sprite }) => {
      this.container.removeChild(sprite);
      this.container.addChild(sprite);
    });
  }

  private isPointInSprite(sprite: PIXI.Sprite, x: number, y: number): boolean {
    const bounds = sprite.getBounds();
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }

  private isSpriteInArea(
    sprite: PIXI.Sprite, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): boolean {
    const bounds = sprite.getBounds();
    return !(bounds.x > x + width || 
             bounds.x + bounds.width < x || 
             bounds.y > y + height || 
             bounds.y + bounds.height < y);
  }
}