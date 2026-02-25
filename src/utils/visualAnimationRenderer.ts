// Visual Animation Renderer - Phase 2.0
// Connects timeline animation data to actual visual sprite rendering

import * as PIXI from 'pixi.js';
import type { ExtractedLayerData } from './professionalLayerExtractor';

export interface AnimatedSprite {
  layerId: string;
  sprite: PIXI.Sprite;
  texture: PIXI.Texture;
  baseProperties: {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    alpha: number;
  };
  currentProperties: {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    alpha: number;
  };
}

export interface AnimationViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

class VisualAnimationRenderer {
  private app: PIXI.Application | null = null;
  private container: PIXI.Container | null = null;
  private animatedSprites: Map<string, AnimatedSprite> = new Map();
  private viewport: AnimationViewport;
  private isInitialized = false;
  private renderCanvas: HTMLCanvasElement | null = null;

  constructor() {
    this.viewport = {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      scale: 1.0
    };
  }

  /**
   * Initialize PIXI application for animation rendering
   */
  async initializeRenderer(canvasElement: HTMLCanvasElement): Promise<void> {
    console.log('🎬 [Visual Renderer] Initializing PIXI animation renderer...');
    console.log('🔧 [DEBUG] Initialize called with:', {
      isInitialized: this.isInitialized,
      canvasElement,
      canvasWidth: canvasElement?.width,
      canvasHeight: canvasElement?.height,
      viewportWidth: this.viewport.width,
      viewportHeight: this.viewport.height
    });

    if (!canvasElement) {
      throw new Error('Canvas element is required for initialization');
    }

    try {
      // Clean up existing app if any
      if (this.app) {
        console.log('🧹 [Visual Renderer] Cleaning up existing PIXI app...');
        this.app.destroy(true);
      }

      console.log('🏗️ [Visual Renderer] Creating new PIXI application...');
      
      // Create new PIXI application
      this.app = new PIXI.Application({
        view: canvasElement,
        width: this.viewport.width,
        height: this.viewport.height,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });

      console.log('📦 [Visual Renderer] PIXI app created, setting up container...');

      // Create main container for animated sprites
      this.container = new PIXI.Container();
      this.app.stage.addChild(this.container);

      // Set up viewport
      this.container.x = this.viewport.width / 2;
      this.container.y = this.viewport.height / 2;

      this.renderCanvas = canvasElement;
      this.isInitialized = true;

      console.log('✅ [Visual Renderer] PIXI animation renderer initialized successfully!', {
        isInitialized: this.isInitialized,
        appExists: !!this.app,
        containerExists: !!this.container,
        canvasAttached: this.app?.view === canvasElement
      });

    } catch (error) {
      console.error('[Visual Renderer] Failed to initialize:', error);
      console.error('[DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        canvasDetails: {
          element: canvasElement,
          width: canvasElement?.width,
          height: canvasElement?.height,
          parentElement: canvasElement?.parentElement,
          isConnected: canvasElement?.isConnected
        }
      });
      throw error;
    }
  }

  /**
   * Load extracted sprites into the animation renderer
   */
  async loadExtractedSprites(extractedLayers: Record<string, ExtractedLayerData>): Promise<void> {
    if (!this.isInitialized || !this.app || !this.container) {
      throw new Error('Renderer not initialized');
    }

    console.log(`🎭 [Visual Renderer] Loading ${Object.keys(extractedLayers).length} sprites...`);

    // Clear existing sprites
    this.clearSprites();

    // Load each extracted layer as an animated sprite
    for (const [layerId, layerData] of Object.entries(extractedLayers)) {
      await this.loadSpriteFromLayerData(layerId, layerData);
    }

    console.log(`✅ [Visual Renderer] Loaded ${this.animatedSprites.size} animated sprites`);
  }

  /**
   * Load individual sprite from extracted layer data
   */
  private async loadSpriteFromLayerData(layerId: string, layerData: ExtractedLayerData): Promise<void> {
    try {
      // Create texture from base64 sprite data
      const texture = await PIXI.Texture.fromURL(layerData.spriteBase64);
      
      // Create PIXI sprite
      const sprite = new PIXI.Sprite(texture);
      
      // Set initial properties based on refined bounds
      const baseX = (layerData.refinedBounds.x / 100) * this.viewport.width - this.viewport.width / 2;
      const baseY = (layerData.refinedBounds.y / 100) * this.viewport.height - this.viewport.height / 2;
      
      sprite.x = baseX;
      sprite.y = baseY;
      sprite.anchor.set(0.5, 0.5); // Center anchor for rotation
      sprite.scale.set(0.5); // Scale down for preview
      
      // Store base and current properties
      const baseProperties = {
        x: baseX,
        y: baseY,
        rotation: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        alpha: 1
      };

      const animatedSprite: AnimatedSprite = {
        layerId,
        sprite,
        texture,
        baseProperties,
        currentProperties: { ...baseProperties }
      };

      // Add to container and tracking
      this.container!.addChild(sprite);
      this.animatedSprites.set(layerId, animatedSprite);

      console.log(`🎨 [Visual Renderer] Loaded sprite: ${layerData.name} at (${baseX.toFixed(1)}, ${baseY.toFixed(1)})`);

    } catch (error) {
      console.error(`[Visual Renderer] Failed to load sprite ${layerId}:`, error);
    }
  }

  /**
   * Update sprite properties from animation timeline
   */
  updateSpriteProperties(layerId: string, properties: any): void {
    console.log(`🔍 [Visual Renderer] Looking for sprite: ${layerId}`);
    console.log(`🔍 [Visual Renderer] Available sprites:`, Array.from(this.animatedSprites.keys()));
    
    const animatedSprite = this.animatedSprites.get(layerId);
    if (!animatedSprite) {
      console.warn(`⚠️ [Visual Renderer] Sprite not found: ${layerId}`);
      console.warn(`⚠️ [Visual Renderer] Available sprites:`, Array.from(this.animatedSprites.keys()));
      return;
    }

    const { sprite, baseProperties } = animatedSprite;

    // Apply animation properties relative to base position
    sprite.x = baseProperties.x + (properties.x - baseProperties.x) * 0.1; // Scale down movement
    sprite.y = baseProperties.y + (properties.y - baseProperties.y) * 0.1;
    sprite.rotation = (properties.rotation * Math.PI) / 180; // Convert to radians
    sprite.scale.set(
      baseProperties.scaleX * properties.scaleX,
      baseProperties.scaleY * properties.scaleY
    );
    sprite.alpha = properties.alpha;
    sprite.visible = properties.visible;

    // Update current properties
    animatedSprite.currentProperties = {
      x: sprite.x,
      y: sprite.y,
      rotation: sprite.rotation,
      scaleX: sprite.scale.x,
      scaleY: sprite.scale.y,
      alpha: sprite.alpha
    };

    // Debug log for first few updates
    if (Math.random() < 0.1) { // Log 10% of updates to avoid spam
      console.log(`🎭 [Visual Renderer] Updated ${layerId}:`, {
        position: `(${sprite.x.toFixed(1)}, ${sprite.y.toFixed(1)})`,
        rotation: `${(sprite.rotation * 180 / Math.PI).toFixed(1)}°`,
        scale: `${sprite.scale.x.toFixed(2)}x`,
        alpha: `${sprite.alpha.toFixed(2)}`
      });
    }
  }

  /**
   * Set animation viewport and scale
   */
  setViewport(viewport: Partial<AnimationViewport>): void {
    this.viewport = { ...this.viewport, ...viewport };
    
    if (this.app) {
      this.app.renderer.resize(this.viewport.width, this.viewport.height);
    }
    
    if (this.container) {
      this.container.x = this.viewport.width / 2;
      this.container.y = this.viewport.height / 2;
      this.container.scale.set(this.viewport.scale);
    }

    console.log(`📐 [Visual Renderer] Viewport updated:`, this.viewport);
  }

  /**
   * Clear all sprites from renderer
   */
  clearSprites(): void {
    if (this.container) {
      this.container.removeChildren();
    }
    
    // Dispose of textures
    this.animatedSprites.forEach(({ texture }) => {
      texture.destroy(true);
    });
    
    this.animatedSprites.clear();
    console.log('🧹 [Visual Renderer] Cleared all sprites');
  }

  /**
   * Pause/resume rendering
   */
  pauseRendering(): void {
    if (this.app) {
      this.app.stop();
      console.log('⏸️ [Visual Renderer] Rendering paused');
    }
  }

  resumeRendering(): void {
    if (this.app) {
      this.app.start();
      console.log('▶️ [Visual Renderer] Rendering resumed');
    }
  }

  /**
   * Get render statistics
   */
  getStats(): { fps: number; sprites: number; memory: string } {
    return {
      fps: this.app?.ticker.FPS || 0,
      sprites: this.animatedSprites.size,
      memory: `${(this.app?.renderer.gl?.getParameter(this.app.renderer.gl.SAMPLES) || 0)}MB`
    };
  }

  /**
   * Destroy renderer and clean up resources
   */
  destroy(): void {
    console.log('🗑️ [Visual Renderer] Destroying animation renderer...');
    
    this.clearSprites();
    
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }
    
    this.container = null;
    this.renderCanvas = null;
    this.isInitialized = false;
    
    console.log('✅ [Visual Renderer] Destroyed successfully');
  }

  /**
   * Take screenshot of current animation frame
   */
  captureFrame(): string {
    if (!this.app) {
      throw new Error('Renderer not initialized');
    }

    // Extract the canvas as base64
    const canvas = this.app.view as HTMLCanvasElement;
    return canvas.toDataURL('image/png');
  }

  /**
   * Export animation as frame sequence
   */
  async exportFrameSequence(duration: number, fps: number): Promise<string[]> {
    const frames: string[] = [];
    const frameCount = Math.ceil((duration / 1000) * fps);
    
    console.log(`🎞️ [Visual Renderer] Exporting ${frameCount} frames...`);
    
    for (let i = 0; i < frameCount; i++) {
      // This would need to be coordinated with the timeline
      // For now, just capture current frame
      frames.push(this.captureFrame());
    }
    
    return frames;
  }

  // Getters
  isReady(): boolean {
    const ready = this.isInitialized && !!this.app && !!this.container;
    
    // Debug logging for isReady check (occasional to avoid spam)
    if (Math.random() < 0.01) { // Log 1% of calls
      console.log('🔍 [Visual Renderer] isReady check:', {
        ready,
        isInitialized: this.isInitialized,
        hasApp: !!this.app,
        hasContainer: !!this.container
      });
    }
    
    return ready;
  }

  getSprite(layerId: string): PIXI.Sprite | null {
    return this.animatedSprites.get(layerId)?.sprite || null;
  }

  getSpriteCount(): number {
    return this.animatedSprites.size;
  }

  getViewport(): AnimationViewport {
    return { ...this.viewport };
  }
}

// Export singleton instance
export const visualAnimationRenderer = new VisualAnimationRenderer();

// Utility functions
export const initializeVisualRenderer = async (canvas: HTMLCanvasElement) => {
  return visualAnimationRenderer.initializeRenderer(canvas);
};

export const loadSpritesForAnimation = async (extractedLayers: Record<string, ExtractedLayerData>) => {
  return visualAnimationRenderer.loadExtractedSprites(extractedLayers);
};

export const updateAnimatedSprite = (layerId: string, properties: any) => {
  visualAnimationRenderer.updateSpriteProperties(layerId, properties);
};

export const clearAnimationSprites = () => {
  visualAnimationRenderer.clearSprites();
};

export const getRendererStats = () => {
  return visualAnimationRenderer.getStats();
};