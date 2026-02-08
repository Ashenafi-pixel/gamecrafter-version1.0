import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { GlowFilter } from '@pixi/filter-glow';

/**
 * Professional Reel Strip Manager
 * Implements continuous scrolling reel strips like AAA slot games
 * 
 * Features:
 * - Continuous symbol strip (3x visible height)
 * - Smooth infinite scrolling
 * - Symbol recycling at boundaries
 * - Proper masking for visible area
 * - Pre-calculated stop positions
 */
export class ProfessionalReelStrip {
  private container: PIXI.Container;
  private symbolContainer: PIXI.Container;
  private maskGraphics: PIXI.Graphics;
  private symbols: PIXI.Sprite[] = [];
  private symbolTextures: PIXI.Texture[] = [];
  
  // Configuration
  private readonly SYMBOLS_VISIBLE = 3; // Number of visible symbols
  private readonly SYMBOL_BUFFER = 2; // Extra symbols above/below for smooth scrolling
  private readonly TOTAL_SYMBOLS = this.SYMBOLS_VISIBLE + (this.SYMBOL_BUFFER * 2);
  
  // Animation state
  private currentPosition = 0;
  private targetPosition = 0;
  private isSpinning = false;
  private spinTween?: gsap.core.Tween;
  
  // Physics parameters
  private readonly SPIN_SPEED = 50; // Symbols per second during spin
  private readonly ACCELERATION_TIME = 0.2;
  private readonly DECELERATION_TIME = 0.8;
  private readonly BOUNCE_OVERSHOOT = 0.15; // 15% overshoot for elastic stop
  
  constructor(
    private reelIndex: number,
    private symbolWidth: number,
    private symbolHeight: number,
    private x: number,
    private y: number
  ) {
    // Create container hierarchy
    this.container = new PIXI.Container();
    this.symbolContainer = new PIXI.Container();
    this.container.addChild(this.symbolContainer);
    
    // Set position
    this.container.x = x;
    this.container.y = y;
    
    // Ensure containers are visible
    this.container.visible = true;
    this.container.alpha = 1;
    this.symbolContainer.visible = true;
    this.symbolContainer.alpha = 1;
    
    console.log(`🎰 Reel ${reelIndex} container created at (${x}, ${y})`);
    
    // Debug background commented out for production
    // const debugBg = new PIXI.Graphics();
    // debugBg.beginFill(0x333333, 0.3);
    // debugBg.drawRect(0, 0, this.symbolWidth, this.symbolHeight * this.SYMBOLS_VISIBLE);
    // debugBg.endFill();
    // this.container.addChild(debugBg);
    
    // Create mask for visible area
    this.createMask();
    
    // Initialize symbol sprites
    this.createSymbolSprites();
    
    // Set initial symbol positions
    this.updateSymbolPositions();
  }
  
  /**
   * Create mask to show only visible symbols
   */
  private createMask(): void {
    this.maskGraphics = new PIXI.Graphics();
    this.maskGraphics.beginFill(0xffffff);
    this.maskGraphics.drawRect(
      0, 
      0, 
      this.symbolWidth, 
      this.symbolHeight * this.SYMBOLS_VISIBLE
    );
    this.maskGraphics.endFill();
    
    this.symbolContainer.mask = this.maskGraphics;
    this.container.addChild(this.maskGraphics);
  }
  
  /**
   * Create symbol sprites for the reel strip
   */
  private createSymbolSprites(): void {
    // Position symbols from top to bottom
    for (let i = 0; i < this.TOTAL_SYMBOLS; i++) {
      // Create sprite with EMPTY texture initially to prevent white squares
      const symbol = new PIXI.Sprite(PIXI.Texture.EMPTY);
      symbol.width = this.symbolWidth - 8;
      symbol.height = this.symbolHeight - 8;
      
      // Position with buffer symbols above visible area
      symbol.y = (i - this.SYMBOL_BUFFER) * this.symbolHeight;
      
      // Center horizontally
      symbol.anchor.set(0.5);
      symbol.x = this.symbolWidth / 2;
      symbol.y += this.symbolHeight / 2;
      
      // Start invisible until textures are loaded
      symbol.visible = false;
      symbol.alpha = 0;
      
      this.symbols.push(symbol);
      this.symbolContainer.addChild(symbol);
    }
    
    console.log(`🎰 Created ${this.TOTAL_SYMBOLS} symbol sprites for reel ${this.reelIndex}`);
  }
  
  /**
   * Set symbol textures for this reel
   */
  setSymbolTextures(textures: PIXI.Texture[]): void {
    console.log(`📋 Setting ${textures.length} textures for reel ${this.reelIndex}`);
    this.symbolTextures = textures;
    
    // Ensure we have valid textures
    if (textures.length === 0) {
      console.warn(`⚠️ No textures provided for reel ${this.reelIndex}`);
      return;
    }
    
    // Update textures immediately
    this.updateSymbolTextures();
    
    // Force position update to ensure visibility
    this.updateSymbolPositions();
  }
  
  /**
   * Update symbol textures based on current position
   */
  private updateSymbolTextures(): void {
    if (this.symbolTextures.length === 0) {
      console.warn(`⚠️ No textures available for reel ${this.reelIndex}`);
      return;
    }
    
    // Calculate which symbols should be shown based on position
    const baseIndex = Math.floor(this.currentPosition);
    
    this.symbols.forEach((symbol, i) => {
      // Calculate symbol index with wrapping
      const symbolIndex = (baseIndex + i) % this.symbolTextures.length;
      const texture = this.symbolTextures[Math.abs(symbolIndex)];
      
      if (texture) {
        symbol.texture = texture;
        
        // Ensure symbol is visible
        symbol.visible = true;
        symbol.alpha = 1;
        
        // Wait for texture to be valid before scaling
        if (texture.valid && texture.width > 0 && texture.height > 0) {
          // Maintain aspect ratio
          const scale = Math.min(
            (this.symbolWidth - 8) / texture.width,
            (this.symbolHeight - 8) / texture.height
          );
          symbol.scale.set(scale);
        } else {
          // Set temporary scale while texture loads
          symbol.scale.set(0.8);
          
          // Set up listener for when texture loads
          texture.baseTexture.once('loaded', () => {
            const scale = Math.min(
              (this.symbolWidth - 8) / texture.width,
              (this.symbolHeight - 8) / texture.height
            );
            symbol.scale.set(scale);
          });
        }
      } else {
        console.warn(`⚠️ No texture at index ${symbolIndex} for reel ${this.reelIndex}`);
        // Use white texture as fallback
        symbol.texture = PIXI.Texture.WHITE;
        symbol.scale.set(0.8);
        symbol.visible = true;
      }
    });
    
    console.log(`✅ Updated textures for reel ${this.reelIndex}, visible symbols: ${this.symbols.filter(s => s.visible).length}`);
  }
  
  /**
   * Update symbol positions for continuous scrolling
   */
  private updateSymbolPositions(): void {
    const offset = (this.currentPosition % 1) * this.symbolHeight;
    
    this.symbols.forEach((symbol, i) => {
      // Base position with buffer offset
      const baseY = (i - this.SYMBOL_BUFFER) * this.symbolHeight;
      // Apply scroll offset - positive offset moves symbols DOWN (top to bottom)
      symbol.y = baseY + offset + this.symbolHeight / 2;
      
      // Wrap symbols that scroll off the bottom to the top
      if (symbol.y > this.symbolHeight * (this.SYMBOLS_VISIBLE + this.SYMBOL_BUFFER - 0.5)) {
        symbol.y -= this.TOTAL_SYMBOLS * this.symbolHeight;
        // Update texture when recycling
        this.updateRecycledSymbol(symbol, i);
      }
    });
  }
  
  /**
   * Update texture for recycled symbol
   */
  private updateRecycledSymbol(symbol: PIXI.Sprite, index: number): void {
    if (this.symbolTextures.length === 0) return;
    
    // Calculate new texture index
    const baseIndex = Math.floor(this.currentPosition);
    const symbolIndex = (baseIndex + index + this.TOTAL_SYMBOLS) % this.symbolTextures.length;
    const texture = this.symbolTextures[Math.abs(symbolIndex)];
    
    if (texture) {
      symbol.texture = texture;
    }
  }
  
  /**
   * Start spinning animation
   */
  async spin(stopPosition: number, duration: number = 2): Promise<void> {
    if (this.isSpinning) return;
    
    this.isSpinning = true;
    this.targetPosition = stopPosition;
    
    // Kill any existing animation
    if (this.spinTween) {
      this.spinTween.kill();
    }
    
    // Calculate spin distance (minimum 10 symbols for good effect)
    const currentPos = this.currentPosition % this.symbolTextures.length;
    const distance = Math.max(10, stopPosition - currentPos + this.symbolTextures.length);
    
    // Create animation timeline
    const tl = gsap.timeline({
      onUpdate: () => {
        this.updateSymbolPositions();
        this.updateSymbolTextures();
      },
      onComplete: () => {
        this.isSpinning = false;
        this.onSpinComplete();
      }
    });
    
    // Acceleration phase
    tl.to(this, {
      currentPosition: this.currentPosition + 2,
      duration: this.ACCELERATION_TIME,
      ease: "power2.in"
    });
    
    // Main spin phase (constant speed)
    const spinDistance = distance - 4; // Reserve some for deceleration
    const spinDuration = duration - this.ACCELERATION_TIME - this.DECELERATION_TIME;
    
    tl.to(this, {
      currentPosition: this.currentPosition + spinDistance,
      duration: spinDuration,
      ease: "none"
    });
    
    // Deceleration with anticipation
    tl.to(this, {
      currentPosition: this.currentPosition + distance,
      duration: this.DECELERATION_TIME,
      ease: "back.out(1.5)" // Creates bounce effect
    });
    
    this.spinTween = tl;
  }
  
  /**
   * Quick spin for free spins or turbo mode
   */
  async quickSpin(stopPosition: number): Promise<void> {
    return this.spin(stopPosition, 0.8);
  }
  
  /**
   * Apply blur effect during spin
   */
  setBlur(amount: number): void {
    if (amount > 0) {
      const blurFilter = new PIXI.filters.BlurFilter();
      blurFilter.blur = amount;
      blurFilter.quality = 4;
      this.symbolContainer.filters = [blurFilter];
    } else {
      this.symbolContainer.filters = [];
    }
  }
  
  /**
   * Highlight winning symbols
   */
  highlightSymbol(symbolIndex: number): void {
    const symbol = this.symbols[symbolIndex + this.SYMBOL_BUFFER];
    if (!symbol) return;
    
    // Add glow effect
    const glowFilter = new GlowFilter({
      distance: 15,
      outerStrength: 2,
      innerStrength: 1,
      color: 0xffdd00,
      quality: 0.5
    });
    
    symbol.filters = [glowFilter];
    
    // Pulse animation
    gsap.to(symbol.scale, {
      x: symbol.scale.x * 1.1,
      y: symbol.scale.y * 1.1,
      duration: 0.3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }
  
  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    this.symbols.forEach(symbol => {
      symbol.filters = [];
      gsap.killTweensOf(symbol.scale);
      // Reset scale
      const texture = symbol.texture;
      if (texture) {
        const scale = Math.min(
          (this.symbolWidth - 4) / texture.width,
          (this.symbolHeight - 4) / texture.height
        );
        symbol.scale.set(scale);
      }
    });
  }
  
  /**
   * Called when spin completes
   */
  private onSpinComplete(): void {
    // Clear blur
    this.setBlur(0);
    
    // Emit event for win checking
    window.dispatchEvent(new CustomEvent('reelStopped', {
      detail: { 
        reelIndex: this.reelIndex,
        stopPosition: this.targetPosition
      }
    }));
  }
  
  /**
   * Get container for adding to stage
   */
  getContainer(): PIXI.Container {
    return this.container;
  }
  
  /**
   * Get visible symbols (for win evaluation)
   */
  getVisibleSymbols(): number[] {
    const baseIndex = Math.floor(this.currentPosition);
    const visible: number[] = [];
    
    for (let i = 0; i < this.SYMBOLS_VISIBLE; i++) {
      const symbolIndex = (baseIndex + i + this.SYMBOL_BUFFER) % this.symbolTextures.length;
      visible.push(symbolIndex);
    }
    
    return visible;
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    if (this.spinTween) {
      this.spinTween.kill();
    }
    
    this.symbols.forEach(symbol => {
      gsap.killTweensOf(symbol);
      gsap.killTweensOf(symbol.scale);
      symbol.destroy();
    });
    
    this.maskGraphics.destroy();
    this.symbolContainer.destroy();
    this.container.destroy();
  }
}