import * as PIXI from 'pixi.js';
import { 
  IAssetManager, 
  AssetDefinition, 
  AssetLoadProgress,
  AssetType,
  AssetState
} from '../core/interfaces';

interface AssetMetadata {
  type: AssetType;
  size: number;
  loaded: boolean;
  error?: string;
  texture?: PIXI.Texture;
  data?: any;
}

export class AssetManager implements IAssetManager {
  private assets: Map<string, AssetMetadata> = new Map();
  private loadQueue: AssetDefinition[] = [];
  private progressCallbacks: ((progress: AssetLoadProgress) => void)[] = [];
  private state: AssetState = 'idle';
  
  constructor() {
    // Set up PIXI asset loader settings
    try {
      PIXI.Assets.setPreferences({
        preferWorkers: true,
        crossOrigin: 'anonymous'
      });
    } catch (error) {
      console.warn('Failed to set PIXI asset preferences:', error);
    }
  }
  
  async initialize(): Promise<void> {
    console.log('📦 Initializing Asset Manager');
    
    try {
      // Clear any existing assets
      this.assets.clear();
      this.loadQueue = [];
      this.state = 'ready';
      
      console.log('✅ Asset Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Asset Manager:', error);
      throw error;
    }
  }
  
  destroy(): void {
    console.log('🧹 Destroying Asset Manager');
    
    // Clear all textures
    this.assets.forEach((metadata, id) => {
      if (metadata.texture) {
        metadata.texture.destroy(true);
      }
    });
    
    // Clear collections
    this.assets.clear();
    this.loadQueue = [];
    this.progressCallbacks = [];
    
    // Reset PIXI Assets
    PIXI.Assets.reset();
    
    console.log('✅ Asset Manager destroyed');
  }
  
  async loadAsset(definition: AssetDefinition): Promise<void> {
    console.log(`📥 Loading asset: ${definition.id}`);
    
    // Check if already loaded
    if (this.assets.has(definition.id)) {
      console.log(`Asset ${definition.id} already loaded`);
      return;
    }
    
    // Add to metadata
    this.assets.set(definition.id, {
      type: definition.type,
      size: 0,
      loaded: false
    });
    
    try {
      // Load based on type
      if (definition.type === 'symbol' || definition.type === 'background' || definition.type === 'frame') {
        const texture = await PIXI.Assets.load({
          alias: definition.id,
          src: definition.url,
          loadParser: 'loadTextures'
        });
        
        const metadata = this.assets.get(definition.id)!;
        metadata.texture = texture;
        metadata.loaded = true;
        
        console.log(`✅ Loaded texture: ${definition.id}`);
        
      } else if (definition.type === 'effect' || definition.type === 'data') {
        const data = await fetch(definition.url).then(res => res.json());
        
        const metadata = this.assets.get(definition.id)!;
        metadata.data = data;
        metadata.loaded = true;
        
        console.log(`✅ Loaded data: ${definition.id}`);
      }
      
    } catch (error) {
      console.error(`Failed to load asset ${definition.id}:`, error);
      
      const metadata = this.assets.get(definition.id)!;
      metadata.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Create placeholder texture for failed loads
      if (definition.type === 'symbol' || definition.type === 'background' || definition.type === 'frame') {
        metadata.texture = this.createPlaceholderTexture(definition.type);
      }
    }
  }
  
  async loadAssets(definitions: AssetDefinition[]): Promise<void> {
    console.log(`📦 Loading ${definitions.length} assets`);
    
    this.state = 'loading';
    this.loadQueue = [...definitions];
    
    const total = definitions.length;
    let loaded = 0;
    
    // Load in batches for better performance
    const batchSize = 5;
    for (let i = 0; i < definitions.length; i += batchSize) {
      const batch = definitions.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (def) => {
        await this.loadAsset(def);
        loaded++;
        
        // Report progress
        this.reportProgress({
          loaded,
          total,
          percentage: (loaded / total) * 100,
          currentAsset: def.id
        });
      }));
    }
    
    this.state = 'ready';
    
    console.log('✅ All assets loaded');
  }
  
  getAsset(id: string): any {
    const metadata = this.assets.get(id);
    if (!metadata) {
      console.warn(`Asset not found: ${id}`);
      return null;
    }
    
    if (!metadata.loaded && !metadata.error) {
      console.warn(`Asset not loaded yet: ${id}`);
      return null;
    }
    
    return metadata.texture || metadata.data || null;
  }
  
  getTexture(id: string): PIXI.Texture | null {
    const metadata = this.assets.get(id);
    if (!metadata || !metadata.texture) {
      console.warn(`Texture not found: ${id}`);
      return this.createPlaceholderTexture('symbol');
    }
    
    return metadata.texture;
  }
  
  hasAsset(id: string): boolean {
    return this.assets.has(id) && this.assets.get(id)!.loaded;
  }
  
  unloadAsset(id: string): void {
    const metadata = this.assets.get(id);
    if (!metadata) return;
    
    // Destroy texture if exists
    if (metadata.texture) {
      metadata.texture.destroy(true);
    }
    
    // Remove from collections
    this.assets.delete(id);
    PIXI.Assets.unload(id);
    
    console.log(`🗑️ Unloaded asset: ${id}`);
  }
  
  unloadAll(): void {
    console.log('🗑️ Unloading all assets');
    
    this.assets.forEach((metadata, id) => {
      if (metadata.texture) {
        metadata.texture.destroy(true);
      }
    });
    
    this.assets.clear();
    PIXI.Assets.unloadAll();
  }
  
  onProgress(callback: (progress: AssetLoadProgress) => void): void {
    this.progressCallbacks.push(callback);
  }
  
  getLoadProgress(): AssetLoadProgress {
    const total = this.loadQueue.length;
    const loaded = Array.from(this.assets.values()).filter(a => a.loaded).length;
    
    return {
      loaded,
      total,
      percentage: total > 0 ? (loaded / total) * 100 : 0,
      currentAsset: this.loadQueue[loaded]?.id || ''
    };
  }
  
  isLoading(): boolean {
    return this.state === 'loading';
  }
  
  getState(): AssetState {
    return this.state;
  }
  
  // Utility methods
  
  async preloadGameAssets(gameId: string): Promise<void> {
    console.log(`🎮 Preloading assets for game: ${gameId}`);
    
    const baseUrl = `/game-assets/${gameId}`;
    
    const assets: AssetDefinition[] = [
      // Symbols
      { id: 'wild', url: `${baseUrl}/symbols/wild/wild_1.png`, type: 'symbol' },
      { id: 'scatter', url: `${baseUrl}/symbols/scatter/scatter_1.png`, type: 'symbol' },
      { id: 'high_1', url: `${baseUrl}/symbols/high/high_1.png`, type: 'symbol' },
      { id: 'high_2', url: `${baseUrl}/symbols/high/high_2.png`, type: 'symbol' },
      { id: 'high_3', url: `${baseUrl}/symbols/high/high_3.png`, type: 'symbol' },
      { id: 'medium_1', url: `${baseUrl}/symbols/medium/medium_1.png`, type: 'symbol' },
      { id: 'medium_2', url: `${baseUrl}/symbols/medium/medium_2.png`, type: 'symbol' },
      { id: 'low_1', url: `${baseUrl}/symbols/low/low_1.png`, type: 'symbol' },
      { id: 'low_2', url: `${baseUrl}/symbols/low/low_2.png`, type: 'symbol' },
      { id: 'low_3', url: `${baseUrl}/symbols/low/low_3.png`, type: 'symbol' },
      
      // Background and frame
      { id: 'background', url: `${baseUrl}/background/background.png`, type: 'background' },
      { id: 'frame', url: `${baseUrl}/frame/frame.png`, type: 'frame' },
      
      // Effects
      { id: 'win_effect', url: `${baseUrl}/effects/win_effect.json`, type: 'effect' },
      { id: 'spin_blur', url: `${baseUrl}/effects/spin_blur.json`, type: 'effect' }
    ];
    
    await this.loadAssets(assets);
  }
  
  private createPlaceholderTexture(type: AssetType): PIXI.Texture {
    const size = type === 'background' ? 800 : 100;
    
    // Determine color based on type
    let fillColor = '#808080'; // Default gray
    switch (type) {
      case 'symbol':
        fillColor = '#4A5568';
        break;
      case 'background':
        fillColor = '#2D3748';
        break;
      case 'frame':
        fillColor = '#1A202C';
        break;
      case 'effect':
        fillColor = '#5A67D8';
        break;
    }
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }
    
    // Draw placeholder
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, size, size);
    
    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);
    
    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${size / 10}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type.toUpperCase(), size / 2, size / 2);
    
    // Create texture from canvas
    return PIXI.Texture.from(canvas);
  }
  
  private addResourceType(extension: string, type: AssetType): void {
    // This would integrate with PIXI's loader system
    // For now, we handle it in loadAsset method
  }
  
  private reportProgress(progress: AssetLoadProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }
  
  // Cache management
  
  getCacheSize(): number {
    let totalSize = 0;
    
    this.assets.forEach(metadata => {
      if (metadata.texture) {
        const { width, height } = metadata.texture;
        // Approximate size in bytes (4 bytes per pixel for RGBA)
        totalSize += width * height * 4;
      }
      totalSize += metadata.size;
    });
    
    return totalSize;
  }
  
  clearCache(olderThan?: number): void {
    console.log('🧹 Clearing asset cache');
    
    // For now, clear all non-essential assets
    const essentialAssets = ['wild', 'scatter'];
    
    this.assets.forEach((metadata, id) => {
      if (!essentialAssets.includes(id)) {
        this.unloadAsset(id);
      }
    });
  }
}