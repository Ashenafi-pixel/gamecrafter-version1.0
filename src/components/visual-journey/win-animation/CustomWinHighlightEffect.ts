import * as PIXI from 'pixi.js';

// Configuration interface for the highlight effect
export interface WinHighlightConfig {
  // Target symbol to highlight
  symbol: PIXI.Sprite | PIXI.Container;
  
  // Custom texture for particles (stars, comets, etc.)
  effectTexture?: PIXI.Texture;
  
  // Number of particles orbiting the symbol
  particleCount?: number;
  
  // Radius of the orbit
  orbitRadius?: number;
  
  // Speed of the orbit animation
  orbitSpeed?: number;
  
  // Scale of the particles
  particleScale?: number;
  
  // Intensity of the glow effect
  glowIntensity?: number;
  
  // Color of the glow effect (hex)
  glowColor?: number;
  
  // Show frame around the symbol
  showFrame?: boolean;
  
  // Frame color (hex)
  frameColor?: number;
  
  // Frame thickness
  frameThickness?: number;
}

/**
 * CustomWinHighlightEffect
 * Creates a customizable highlight effect for winning symbols
 * Similar to the comet/stars effect seen in popular slot games
 */
export class CustomWinHighlightEffect {
  // PIXI container for the effect
  public container: PIXI.Container;
  
  // Reference to the target symbol
  private targetSymbol: PIXI.Sprite | PIXI.Container;
  
  // Effect texture
  private customEffectTexture: PIXI.Texture;
  
  // Particle array
  private particles: PIXI.Sprite[] = [];
  
  // Glow filter
  private glowFilter: PIXI.Filter;
  
  // Frame graphic
  private frame: PIXI.Graphics | null = null;
  
  // Configuration parameters
  private particleCount: number;
  private orbitRadius: number;
  private orbitSpeed: number;
  private particleScale: number;
  private glowIntensity: number;
  private glowColor: number;
  private showFrame: boolean;
  private frameColor: number;
  private frameThickness: number;
  
  // Animation variables
  private time: number = 0;
  private active: boolean = false;
  
  constructor(config: WinHighlightConfig) {
    // Create container for the effect
    this.container = new PIXI.Container();
    
    // Store target symbol
    this.targetSymbol = config.symbol;
    
    // Set default texture if not provided
    this.customEffectTexture = config.effectTexture || PIXI.Texture.WHITE;
    
    // Set configuration parameters with defaults
    this.particleCount = config.particleCount ?? 12;
    this.orbitRadius = config.orbitRadius ?? 60;
    this.orbitSpeed = config.orbitSpeed ?? 1;
    this.particleScale = config.particleScale ?? 0.5;
    this.glowIntensity = config.glowIntensity ?? 0.8;
    this.glowColor = config.glowColor ?? 0xFFFFA0;
    this.showFrame = config.showFrame ?? true;
    this.frameColor = config.frameColor ?? 0xFFFFFF;
    this.frameThickness = config.frameThickness ?? 3;
    
    // Initialize effect components
    this.createParticles();
    this.createGlow();
    if (this.showFrame) {
      this.createFrame();
    }
    
    // Initialize glow filter with a placeholder
    this.glowFilter = new PIXI.Filter();
  }
  
  /**
   * Create orbiting particles
   */
  private createParticles(): void {
    // Create the specified number of particles
    for (let i = 0; i < this.particleCount; i++) {
      // Create sprite from texture
      const particle = new PIXI.Sprite(this.customEffectTexture);
      
      // Center anchor point
      particle.anchor.set(0.5);
      
      // Set scale
      particle.scale.set(this.particleScale);
      
      // Set initial position in a circle
      const angle = (i / this.particleCount) * Math.PI * 2;
      particle.x = Math.cos(angle) * this.orbitRadius;
      particle.y = Math.sin(angle) * this.orbitRadius;
      
      // Store angle for animation
      (particle as any).angle = angle;
      
      // Add randomly offset starting positions for more natural look
      (particle as any).offset = Math.random() * Math.PI * 2;
      (particle as any).speed = 0.5 + Math.random() * 0.5; // Varied speeds
      (particle as any).distance = this.orbitRadius * (0.8 + Math.random() * 0.4); // Varied distances
      
      // Add to container and array
      this.container.addChild(particle);
      this.particles.push(particle);
    }
  }
  
  /**
   * Create glow effect
   */
  private createGlow(): void {
    // Check if PIXI.filters.GlowFilter exists (it's not in standard PIXI)
    // In a real implementation, you would use a proper glow filter or shader
    try {
      if ('GlowFilter' in PIXI.filters) {
        this.glowFilter = new (PIXI.filters as any).GlowFilter({
          distance: 15,
          outerStrength: this.glowIntensity,
          innerStrength: this.glowIntensity / 2,
          color: this.glowColor,
          quality: 0.5,
        });
      } else {
        // Fallback using a basic filter if GlowFilter is not available
        console.log('GlowFilter not available, using fallback');
        this.createFallbackGlow();
      }
    } catch (error) {
      console.error('Error creating glow filter:', error);
      this.createFallbackGlow();
    }
  }
  
  /**
   * Create a fallback glow effect using available PIXI filters
   */
  private createFallbackGlow(): void {
    // Create a simple glow using blur and color matrix filters
    const blurFilter = new PIXI.BlurFilter(8);
    const colorMatrix = new PIXI.ColorMatrixFilter();
    
    // Adjust color to create glow
    colorMatrix.brightness(1.5);
    
    // Use RGB from glowColor
    const r = ((this.glowColor >> 16) & 0xFF) / 255;
    const g = ((this.glowColor >> 8) & 0xFF) / 255;
    const b = (this.glowColor & 0xFF) / 255;
    
    // Apply tint matrix
    const matrix = [
      r, 0, 0, 0, 0,
      0, g, 0, 0, 0,
      0, 0, b, 0, 0,
      0, 0, 0, 1, 0
    ];
    
    colorMatrix.matrix = matrix;
    
    // Create a composite filter
    this.glowFilter = new PIXI.Filter(undefined, undefined, {
      blend: true
    });
    
    // Store references for animation
    (this.glowFilter as any)._blurFilter = blurFilter;
    (this.glowFilter as any)._colorMatrix = colorMatrix;
  }
  
  /**
   * Create frame around the symbol
   */
  private createFrame(): void {
    // Create pulsing frame
    this.frame = new PIXI.Graphics();
    this.updateFrame(1); // Initial draw
    this.container.addChild(this.frame);
  }
  
  /**
   * Update frame with animation
   */
  private updateFrame(pulseFactor: number): void {
    if (!this.frame) return;
    
    // Clear existing frame
    this.frame.clear();
    
    // Get symbol dimensions
    const symbolWidth = this.targetSymbol.width;
    const symbolHeight = this.targetSymbol.height;
    
    // Adjust alpha based on pulse
    const alpha = 0.4 + 0.4 * pulseFactor;
    
    // Draw frame
    this.frame.lineStyle(this.frameThickness, this.frameColor, alpha);
    this.frame.drawRect(
      -symbolWidth/2 - 5, 
      -symbolHeight/2 - 5, 
      symbolWidth + 10, 
      symbolHeight + 10
    );
  }
  
  /**
   * Update animation
   */
  public update(delta: number): void {
    if (!this.active) return;
    
    // Update time
    this.time += delta * 0.01;
    
    // Animate particles
    this.particles.forEach(particle => {
      const particleData = particle as any;
      particleData.angle += this.orbitSpeed * 0.02 * delta * particleData.speed;
      
      // Calculate position with slight variations for more organic movement
      const wobble = Math.sin(this.time * 5 + particleData.offset) * 5;
      particle.x = Math.cos(particleData.angle) * particleData.distance + wobble;
      particle.y = Math.sin(particleData.angle) * particleData.distance;
      
      // Slightly vary the scale for pulsing effect
      const scalePulse = 1 + Math.sin(this.time * 3 + particleData.offset) * 0.1;
      particle.scale.set(this.particleScale * scalePulse);
      
      // Vary the alpha for twinkling effect
      particle.alpha = 0.7 + Math.sin(this.time * 2 + particleData.offset) * 0.3;
    });
    
    // Pulse the frame
    if (this.frame) {
      const pulseFactor = Math.sin(this.time * 2) * 0.5 + 0.5;
      this.updateFrame(pulseFactor);
    }
    
    // Pulse the glow if using custom GlowFilter
    try {
      if (this.glowFilter) {
        if ((this.glowFilter as any).outerStrength !== undefined) {
          // Using GlowFilter
          (this.glowFilter as any).outerStrength = this.glowIntensity + Math.sin(this.time * 3) * 0.2;
        } else if ((this.glowFilter as any)._blurFilter) {
          // Using fallback filter
          const blurPulse = 6 + Math.sin(this.time * 2) * 2;
          (this.glowFilter as any)._blurFilter.blur = blurPulse;
        }
      }
    } catch (error) {
      console.error('Error updating glow filter:', error);
    }
  }
  
  /**
   * Apply the effect to a symbol
   */
  public applyTo(symbol: PIXI.Sprite | PIXI.Container): void {
    // Position the effect container at the center of the symbol
    this.container.x = symbol.x + symbol.width/2;
    this.container.y = symbol.y + symbol.height/2;
    
    // Apply glow filter to symbol if available
    try {
      const filters = symbol.filters || [];
      symbol.filters = [...filters, this.glowFilter];
    } catch (error) {
      console.error('Error applying glow filter:', error);
    }
    
    // Add container to symbol's parent
    if (symbol.parent) {
      symbol.parent.addChild(this.container);
    }
    
    // Activate the effect
    this.active = true;
  }
  
  /**
   * Remove the effect
   */
  public remove(): void {
    // Deactivate
    this.active = false;
    
    // Remove the container
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    
    // Remove filters from symbol
    if (this.targetSymbol && this.targetSymbol.filters) {
      this.targetSymbol.filters = this.targetSymbol.filters.filter(f => f !== this.glowFilter);
    }
  }
  
  /**
   * Set a new texture for the particles
   */
  public setTexture(texture: PIXI.Texture): void {
    this.customEffectTexture = texture;
    
    // Update existing particles
    this.particles.forEach(particle => {
      particle.texture = texture;
    });
  }
  
  /**
   * Update effect configuration
   */
  public updateConfig(config: Partial<WinHighlightConfig>): void {
    // Update properties that have changed
    if (config.particleCount !== undefined && config.particleCount !== this.particleCount) {
      this.particleCount = config.particleCount;
      // Recreate particles
      this.particles.forEach(p => this.container.removeChild(p));
      this.particles = [];
      this.createParticles();
    }
    
    if (config.orbitRadius !== undefined) this.orbitRadius = config.orbitRadius;
    if (config.orbitSpeed !== undefined) this.orbitSpeed = config.orbitSpeed;
    if (config.particleScale !== undefined) this.particleScale = config.particleScale;
    if (config.glowIntensity !== undefined) this.glowIntensity = config.glowIntensity;
    
    if (config.glowColor !== undefined) {
      this.glowColor = config.glowColor;
      // Update glow filter
      this.createGlow();
      
      // Reapply to symbol
      if (this.targetSymbol && this.targetSymbol.filters) {
        this.targetSymbol.filters = this.targetSymbol.filters.filter(f => f !== this.glowFilter);
        this.targetSymbol.filters.push(this.glowFilter);
      }
    }
    
    if (config.showFrame !== undefined) {
      this.showFrame = config.showFrame;
      if (this.showFrame && !this.frame) {
        this.createFrame();
      } else if (!this.showFrame && this.frame) {
        this.container.removeChild(this.frame);
        this.frame = null;
      }
    }
    
    if (config.frameColor !== undefined) {
      this.frameColor = config.frameColor;
      if (this.frame) {
        this.updateFrame(1);
      }
    }
    
    if (config.frameThickness !== undefined) {
      this.frameThickness = config.frameThickness;
      if (this.frame) {
        this.updateFrame(1);
      }
    }
  }
}