import * as PIXI from 'pixi.js';

/**
 * PixiResourceManager - Utility for managing PIXI.js resources, textures, and animations
 * 
 * This manager helps prevent memory leaks by providing centralized tracking and cleanup
 * functionality for PIXI.js resources, especially textures which are often the source
 * of significant memory issues.
 */
class PixiResourceManager {
  // Track all textures by reference ID
  private textures: Map<string, PIXI.Texture> = new Map();
  
  // Track animations by component ID
  private animationFrames: Map<string, number[]> = new Map();
  
  // Track PIXI applications
  private applications: Map<string, PIXI.Application> = new Map();
  
  // GSAP animation tracking
  private gsapAnimations: Map<string, any[]> = new Map();
  
  // Singleton instance
  private static instance: PixiResourceManager;
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PixiResourceManager {
    if (!PixiResourceManager.instance) {
      PixiResourceManager.instance = new PixiResourceManager();
    }
    return PixiResourceManager.instance;
  }
  
  /**
   * Register a texture with the manager
   * @param id Unique identifier for the texture
   * @param texture PIXI Texture to track
   */
  public registerTexture(id: string, texture: PIXI.Texture): void {
    this.textures.set(id, texture);
  }
  
  /**
   * Get a registered texture
   * @param id Texture identifier
   * @returns The texture or undefined if not found
   */
  public getTexture(id: string): PIXI.Texture | undefined {
    return this.textures.get(id);
  }
  
  /**
   * Create and track a PIXI texture from a URL
   * @param id Identifier for the texture
   * @param url URL to load texture from
   * @returns Promise resolving to the texture
   */
  public async createTexture(id: string, url: string): Promise<PIXI.Texture> {
    // Check if texture already exists
    const existing = this.textures.get(id);
    if (existing) {
      return existing;
    }
    
    // Load new texture
    try {
      const texture = await PIXI.Assets.load(url);
      this.textures.set(id, texture);
      return texture;
    } catch (error) {
      console.error(`Failed to load texture ${id} from ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Create and track a PIXI texture from a graphics object
   * @param id Identifier for the texture
   * @param graphics PIXI Graphics object to generate texture from
   * @param renderer PIXI Renderer to use
   * @returns The created texture
   */
  public createTextureFromGraphics(id: string, graphics: PIXI.Graphics, renderer: PIXI.Renderer): PIXI.Texture {
    const texture = renderer.generateTexture(graphics);
    this.textures.set(id, texture);
    return texture;
  }
  
  /**
   * Register a PIXI application with the manager
   * @param id Unique identifier for the application
   * @param app PIXI Application instance
   */
  public registerApplication(id: string, app: PIXI.Application): void {
    this.applications.set(id, app);
  }
  
  /**
   * Get a registered application
   * @param id Application identifier
   * @returns The application or undefined if not found
   */
  public getApplication(id: string): PIXI.Application | undefined {
    return this.applications.get(id);
  }
  
  /**
   * Register an animation frame ID with a component
   * @param componentId Component identifier
   * @param frameId requestAnimationFrame ID
   */
  public registerAnimationFrame(componentId: string, frameId: number): void {
    const frames = this.animationFrames.get(componentId) || [];
    frames.push(frameId);
    this.animationFrames.set(componentId, frames);
  }
  
  /**
   * Register a GSAP animation with a component
   * @param componentId Component identifier
   * @param animation GSAP animation instance
   */
  public registerGsapAnimation(componentId: string, animation: any): void {
    const animations = this.gsapAnimations.get(componentId) || [];
    animations.push(animation);
    this.gsapAnimations.set(componentId, animations);
  }
  
  /**
   * Clean up all resources for a component
   * @param componentId Component identifier
   */
  public cleanupComponent(componentId: string): void {
    // Cancel all animation frames
    const frames = this.animationFrames.get(componentId) || [];
    frames.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    this.animationFrames.delete(componentId);
    
    // Kill all GSAP animations
    const animations = this.gsapAnimations.get(componentId) || [];
    animations.forEach(animation => {
      if (animation && typeof animation.kill === 'function') {
        animation.kill();
      }
    });
    this.gsapAnimations.delete(componentId);
    
    // Clean up the application if it exists
    const app = this.applications.get(componentId);
    if (app) {
      if (app.ticker) {
        app.ticker.stop();
      }
      
      app.destroy(true, { 
        children: true, 
        texture: false, // Don't destroy textures here, we'll do that separately
        baseTexture: false 
      });
      
      this.applications.delete(componentId);
    }
  }
  
  /**
   * Clean up specific textures
   * @param textureIds Array of texture identifiers to clean up
   */
  public cleanupTextures(textureIds: string[]): void {
    textureIds.forEach(id => {
      const texture = this.textures.get(id);
      if (texture) {
        texture.destroy(true);
        this.textures.delete(id);
      }
    });
  }
  
  /**
   * Performs a full global texture garbage collection
   * Use this sparingly, as it affects all textures in the PIXI system
   */
  public globalTextureCleanup(): void {
    PIXI.utils.clearTextureCache();
  }
  
  /**
   * Create a placeholder texture with specified dimensions and color
   * @param id Identifier for the texture
   * @param width Width of the texture
   * @param height Height of the texture
   * @param color Fill color (hexadecimal)
   * @param renderer PIXI Renderer to use
   * @returns The created texture
   */
  public createPlaceholderTexture(
    id: string, 
    width: number, 
    height: number, 
    color: number, 
    renderer: PIXI.Renderer
  ): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    
    return this.createTextureFromGraphics(id, graphics, renderer);
  }
  
  /**
   * Hook up a component to automatically handle animation frame cleanup
   * @param componentId Component identifier
   * @param callback Animation callback function
   * @returns Animation frame ID, already registered with the manager
   */
  public animationFrame(componentId: string, callback: FrameRequestCallback): number {
    const frameId = requestAnimationFrame(callback);
    this.registerAnimationFrame(componentId, frameId);
    return frameId;
  }
}

// Export the singleton instance
export const pixiResourceManager = PixiResourceManager.getInstance();

// Export a React hook for easy integration with functional components
export function usePixiResourceManager() {
  return pixiResourceManager;
}