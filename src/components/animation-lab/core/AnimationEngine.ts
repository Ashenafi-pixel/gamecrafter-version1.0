import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

/**
 * Core Animation Engine for professional slot game development
 * Handles PIXI.js and GSAP integration with proper memory management
 */
export class AnimationEngine {
  private app: PIXI.Application;
  private stage: PIXI.Container;
  private timelines: Map<string, gsap.core.Timeline>;
  private assets: Map<string, PIXI.Texture>;
  private isInitialized: boolean = false;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.timelines = new Map();
    this.assets = new Map();
    
    // Initialize PIXI Application with professional settings
    try {
      this.app = new PIXI.Application({
        view: canvas,
        width,
        height,
        antialias: true,
        transparent: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap resolution for compatibility
        autoDensity: true,
        powerPreference: 'high-performance',
        backgroundAlpha: 0,
        // Remove problematic shared options for better compatibility
        preserveDrawingBuffer: false,
        clearBeforeRender: true,
        // Add compatibility settings
        legacy: false,
        hello: false // Disable PIXI hello message
      });
    } catch (error) {
      console.error('Failed to create PIXI Application:', error);
      // Try even more minimal fallback
      try {
        this.app = new PIXI.Application({
          view: canvas,
          width,
          height,
          backgroundAlpha: 0,
          forceCanvas: true // Force canvas renderer as fallback
        });
      } catch (fallbackError) {
        console.error('Fallback PIXI Application also failed:', fallbackError);
        // Create minimal app without canvas view
        this.app = new PIXI.Application({
          width,
          height,
          backgroundAlpha: 0
        });
        // Manually set the canvas
        if (this.app.view && canvas.parentElement) {
          canvas.parentElement.replaceChild(this.app.view as HTMLCanvasElement, canvas);
        }
      }
    }

    this.stage = this.app.stage;
  }

  /**
   * Initialize the animation engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Set up PIXI settings for optimal performance (v7+ compatible)
      PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.LINEAR;
      PIXI.BaseTexture.defaultOptions.wrapMode = PIXI.WRAP_MODES.CLAMP;
      
      // Fix shader compilation settings for better compatibility
      try {
        PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;
        PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;
      } catch (settingsError) {
        console.warn('Could not set PIXI environment settings:', settingsError);
        // Force canvas mode for maximum compatibility
        PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL;
      }
      
      // Fix shader limits for compatibility (v7+ compatible)
      try {
        // Use newer BatchRenderer settings instead of deprecated SPRITE_MAX_TEXTURES
        if (PIXI.BatchRenderer) {
          PIXI.BatchRenderer.defaultMaxTextures = Math.min(PIXI.BatchRenderer.defaultMaxTextures || 16, 16);
          PIXI.BatchRenderer.defaultBatchSize = 4096;
        }
        
        // Fallback for older versions
        if (PIXI.settings.SPRITE_MAX_TEXTURES !== undefined) {
          PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(PIXI.settings.SPRITE_MAX_TEXTURES, 16);
        }
        if (PIXI.settings.SPRITE_BATCH_SIZE !== undefined) {
          PIXI.settings.SPRITE_BATCH_SIZE = 4096;
        }
      } catch (error) {
        console.warn('Could not set PIXI BatchRenderer settings:', error);
      }
      
      // Initialize GSAP plugins if needed
      gsap.registerPlugin();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('Animation Engine initialized successfully with PIXI settings optimized');
    } catch (error) {
      console.error('Animation Engine initialization error:', error);
      throw new Error(`Failed to initialize Animation Engine: ${error}`);
    }
  }

  /**
   * Load and cache texture assets
   */
  async loadAsset(id: string, source: string | File | Blob): Promise<PIXI.Texture> {
    if (this.assets.has(id)) {
      return this.assets.get(id)!;
    }

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

      this.assets.set(id, texture);
      console.log(`AnimationEngine: Asset loaded successfully: ${id} (${texture.width}x${texture.height})`);
      return texture;
    } catch (error) {
      console.error(`AnimationEngine: Failed to load asset ${id}:`, error);
      throw new Error(`Failed to load asset ${id}: ${error}`);
    }
  }

  /**
   * Create sprite from loaded asset
   */
  createSprite(assetId: string): PIXI.Sprite {
    const texture = this.assets.get(assetId);
    if (!texture) {
      throw new Error(`Asset ${assetId} not found. Load asset first.`);
    }
    
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
  }

  /**
   * Create GSAP timeline for animation
   */
  createTimeline(id: string): gsap.core.Timeline {
    if (this.timelines.has(id)) {
      this.timelines.get(id)!.kill();
    }
    
    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => this.onTimelineComplete(id),
      onUpdate: () => this.onTimelineUpdate(id)
    });
    
    this.timelines.set(id, timeline);
    return timeline;
  }

  /**
   * Add sprite to stage
   */
  addToStage(sprite: PIXI.DisplayObject): void {
    this.stage.addChild(sprite);
  }

  /**
   * Remove sprite from stage
   */
  removeFromStage(sprite: PIXI.DisplayObject): void {
    this.stage.removeChild(sprite);
  }

  /**
   * Play timeline animation
   */
  playTimeline(id: string): void {
    const timeline = this.timelines.get(id);
    if (timeline) {
      timeline.play();
    }
  }

  /**
   * Pause timeline animation
   */
  pauseTimeline(id: string): void {
    const timeline = this.timelines.get(id);
    if (timeline) {
      timeline.pause();
    }
  }

  /**
   * Stop and reset timeline
   */
  stopTimeline(id: string): void {
    const timeline = this.timelines.get(id);
    if (timeline) {
      timeline.pause().progress(0);
    }
  }

  /**
   * Get PIXI Application instance
   */
  getApp(): PIXI.Application {
    return this.app;
  }

  /**
   * Get stage container
   */
  getStage(): PIXI.Container {
    return this.stage;
  }

  /**
   * Resize canvas and update projection
   */
  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  /**
   * Clean up resources and destroy engine
   */
  destroy(): void {
    // Kill all timelines
    this.timelines.forEach(timeline => timeline.kill());
    this.timelines.clear();
    
    // Destroy all textures
    this.assets.forEach(texture => texture.destroy(true));
    this.assets.clear();
    
    // Destroy PIXI application
    this.app.destroy(true, {
      children: true,
      texture: true,
      baseTexture: true
    });
    
    this.isInitialized = false;
  }

  /**
   * Set up event listeners for performance optimization
   */
  private setupEventListeners(): void {
    // Handle visibility change for performance
    document.addEventListener('visibilitychange', () => {
      if (this.app && this.app.ticker) {
        if (document.hidden) {
          this.app.stop();
        } else {
          this.app.start();
        }
      }
    });
  }

  private onTimelineComplete(id: string): void {
    // Timeline completion callback
    console.log(`Timeline ${id} completed`);
  }

  private onTimelineUpdate(id: string): void {
    // Timeline update callback for real-time feedback
  }
}