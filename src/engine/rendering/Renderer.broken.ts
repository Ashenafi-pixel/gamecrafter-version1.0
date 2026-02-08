/**
 * Renderer - Unified PIXI.js renderer for the slot engine
 * Consolidates all rendering logic from various preview components
 */

import * as PIXI from 'pixi.js';
import { GlowFilter } from '@pixi/filter-glow';
import { gsap } from 'gsap';
import {
  IRenderer,
  RendererConfig,
  Symbol,
  Position,
  WinType,
  GameAssets,
  FrameConfig,
  RenderQuality
} from '../core/interfaces';
import { SymbolPool } from '../pixi/SymbolPool';

export class Renderer implements IRenderer {
  private app: PIXI.Application | null = null;
  private container: HTMLElement;
  private symbolPool: SymbolPool;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private lastSize = { width: 0, height: 0 };
  
  // Containers
  private stage: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  private gridContainer: PIXI.Container;
  private reelContainer: PIXI.Container;
  private frameContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;
  
  // Grid configuration
  private gridConfig = {
    cols: 5,
    rows: 3,
    symbolWidth: 140,
    symbolHeight: 140,
    symbolPadding: 5  // Reduced padding for tighter grid
  };
  
  // Orientation settings
  private orientation: 'portrait' | 'landscape' = 'portrait';
  private isMobile: boolean = false;
  
  // Grid state
  private symbolGrid: (PIXI.Sprite | null)[][] = [];
  private reelMasks: PIXI.Graphics[] = [];
  
  // Assets
  private backgroundSprite: PIXI.Sprite | null = null;
  private frameSprite: PIXI.Sprite | null = null;
  
  // Animation state
  private activeAnimations: Set<gsap.core.Tween> = new Set();

  constructor(container: HTMLElement) {
    this.container = container;
    this.symbolPool = new SymbolPool();
    
    // Initialize containers
    this.stage = new PIXI.Container();
    this.backgroundContainer = new PIXI.Container();
    this.gridContainer = new PIXI.Container();
    this.reelContainer = new PIXI.Container();
    this.frameContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
  }

  /**
   * Initialize the renderer
   */
  async initialize(config: RendererConfig): Promise<void> {
    console.log('🎨 Initializing renderer with config:', config);
    
    // Create PIXI application
    this.app = new PIXI.Application({
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      antialias: config.antialias,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      view: document.createElement('canvas') as HTMLCanvasElement
    });
    
    // Add canvas to container with proper styling
    const canvas = this.app.view as HTMLCanvasElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    this.container.appendChild(canvas);
    
    // Set up container hierarchy
    this.stage = this.app.stage;
    this.stage.addChild(this.backgroundContainer);
    this.stage.addChild(this.gridContainer);
    this.stage.addChild(this.reelContainer);
    this.stage.addChild(this.frameContainer);
    this.stage.addChild(this.effectsContainer);
    
    // Set render quality
    this.setQuality(config.quality);
    
    // Initialize last size
    this.lastSize = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    
    // Handle resize
    this.setupResizeHandler();
    
    console.log('✅ Renderer initialized');
  }

  /**
   * Destroy the renderer
   */
  destroy(): void {
    console.log('🧹 Destroying renderer...');
    
    // Stop all animations
    this.stopAllAnimations();
    
    // Clear grid
    this.clearGrid();
    
    // Destroy symbol pool
    this.symbolPool.destroy();
    
    // Clear resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    // Remove resize handler
    window.removeEventListener('resize', this.handleResize);
    
    // Disconnect ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Destroy PIXI app
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }
    
    console.log('✅ Renderer destroyed');
  }

  /**
   * Create grid with specified dimensions
   */
  async createGrid(cols: number, rows: number): Promise<void> {
    console.log(`📊 Creating grid: ${cols}x${rows}`);
    
    // Clear existing grid
    this.clearGrid();
    
    // Update configuration
    this.gridConfig.cols = cols;
    this.gridConfig.rows = rows;
    
    // Calculate optimal symbol size
    this.calculateOptimalSymbolSize();
    
    // Initialize grid array
    this.symbolGrid = Array(cols).fill(null).map(() => Array(rows).fill(null));
    
    // Create reel masks for clipping
    this.createReelMasks();
    
    // Position grid container
    this.centerGridContainer();
    
    // Enable sorting for proper layering
    this.reelContainer.sortableChildren = true;
    
    console.log('✅ Grid created');
  }

  /**
   * Update grid size with animation
   */
  async updateGridSize(cols: number, rows: number): Promise<void> {
    console.log(`🔄 Updating grid size from ${this.gridConfig.cols}x${this.gridConfig.rows} to ${cols}x${rows}`);
    
    // Skip if no change
    if (this.gridConfig.cols === cols && this.gridConfig.rows === rows) {
      console.log('⏭️ Grid size unchanged, skipping update');
      return;
    }
    
    // Fade out existing symbols
    await this.fadeOutSymbols();
    
    // Update grid
    await this.createGrid(cols, rows);
    
    // Generate and display new symbols for the new grid
    const newSymbols = this.generateDemoSymbols(cols, rows);
    await this.updateGrid(newSymbols);
    
    console.log('✅ Grid size updated');
  }

  /**
   * Clear the grid
   */
  clearGrid(): void {
    console.log('🧹 Clearing grid');
    
    // Release all symbols to pool
    this.symbolGrid.forEach(col => {
      col.forEach(sprite => {
        if (sprite) {
          this.symbolPool.releaseSymbol(sprite);
        }
      });
    });
    
    // Clear mask
    if (this.reelContainer.mask) {
      this.reelContainer.mask = null;
    }
    
    // Clear containers
    this.reelContainer.removeChildren();
    this.gridContainer.removeChildren();
    
    // Reset grid array
    this.symbolGrid = [];
    this.reelMasks = [];
  }

  /**
   * Set symbols on the grid
   */
  async setSymbols(symbols: Symbol[][]): Promise<void> {
    console.log('🎰 Setting symbols on grid');
    
    for (let col = 0; col < symbols.length; col++) {
      for (let row = 0; row < symbols[col].length; row++) {
        await this.updateSymbol(col, row, symbols[col][row]);
      }
    }
  }

  /**
   * Update a single symbol
   */
  async updateSymbol(col: number, row: number, symbol: Symbol): Promise<void> {
    // Release existing symbol
    const existingSprite = this.symbolGrid[col]?.[row];
    if (existingSprite) {
      this.symbolPool.releaseSymbol(existingSprite);
    }
    
    // Get new symbol from pool
    const sprite = this.symbolPool.getSymbol(symbol.id);
    if (!sprite) {
      console.error(`Failed to get sprite for symbol ${symbol.id}`);
      return;
    }
    
    // Position symbol
    const x = col * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding) + this.gridConfig.symbolWidth / 2;
    const y = row * (this.gridConfig.symbolHeight + this.gridConfig.symbolPadding) + this.gridConfig.symbolHeight / 2;
    
    sprite.x = x;
    sprite.y = y;
    
    // Scale to fit
    const scale = Math.min(
      this.gridConfig.symbolWidth / sprite.texture.width,
      this.gridConfig.symbolHeight / sprite.texture.height
    ) * 0.8; // 80% to leave more padding for the cell borders
    
    sprite.scale.set(scale);
    
    // Ensure sprite is above the grid graphics
    sprite.zIndex = 10;
    
    // Add to reel container
    this.reelContainer.addChild(sprite);
    
    // Store in grid
    if (!this.symbolGrid[col]) {
      this.symbolGrid[col] = [];
    }
    this.symbolGrid[col][row] = sprite;
  }

  /**
   * Spin a reel
   */
  async spinReel(reelIndex: number, duration: number): Promise<void> {
    const reel = this.symbolGrid[reelIndex];
    if (!reel) return;
    
    // Create blur effect
    const blurFilter = new PIXI.filters.BlurFilter();
    blurFilter.blur = 0;
    
    reel.forEach(sprite => {
      if (sprite) {
        sprite.filters = [blurFilter];
      }
    });
    
    // Animate blur and movement
    const tween = gsap.to(blurFilter, {
      blur: 8,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        // Continue spinning animation
        this.animateReelSpin(reelIndex, duration - 0.4);
      }
    });
    
    this.activeAnimations.add(tween);
  }

  /**
   * Stop a reel
   */
  async stopReel(reelIndex: number, stopPosition: number, duration: number): Promise<void> {
    const reel = this.symbolGrid[reelIndex];
    if (!reel) return;
    
    // Remove blur
    const blurFilter = reel[0]?.filters?.[0] as PIXI.filters.BlurFilter;
    if (blurFilter) {
      const tween = gsap.to(blurFilter, {
        blur: 0,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          reel.forEach(sprite => {
            if (sprite) {
              sprite.filters = [];
            }
          });
        }
      });
      
      this.activeAnimations.add(tween);
    }
    
    // Bounce effect
    reel.forEach((sprite, index) => {
      if (sprite) {
        const tween = gsap.to(sprite, {
          y: sprite.y + 10,
          duration: 0.1,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
          delay: index * 0.05
        });
        
        this.activeAnimations.add(tween);
      }
    });
  }

  /**
   * Highlight winning symbols
   */
  async highlightWin(positions: Position[], type: WinType): Promise<void> {
    console.log(`✨ Highlighting ${positions.length} winning symbols`);
    
    positions.forEach(pos => {
      const sprite = this.symbolGrid[pos.reel]?.[pos.row];
      if (!sprite) return;
      
      // Create glow effect
      const glowFilter = new GlowFilter({
        color: type === 'jackpot' ? 0xFFD700 : 0x00FF00,
        outerStrength: 2,
        innerStrength: 1,
        quality: 0.5
      });
      
      sprite.filters = [glowFilter];
      
      // Pulse animation
      const tween = gsap.to(sprite.scale, {
        x: sprite.scale.x * 1.2,
        y: sprite.scale.y * 1.2,
        duration: 0.3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          sprite.filters = [];
        }
      });
      
      this.activeAnimations.add(tween);
    });
  }

  /**
   * Load game assets
   */
  async loadAssets(assets: GameAssets): Promise<void> {
    console.log('📦 Loading game assets');
    
    // Extract URLs from the symbols map
    const symbolUrls: string[] = [];
    for (const [id, urlOrTexture] of assets.symbols) {
      // Check if it's a URL (string) or a texture object
      if (typeof urlOrTexture === 'string') {
        symbolUrls.push(urlOrTexture);
      } else if ((urlOrTexture as any).baseTexture?.resource?.url) {
        // It's a PIXI texture, extract the URL
        symbolUrls.push((urlOrTexture as any).baseTexture.resource.url);
      } else {
        console.warn(`Could not extract URL for symbol ${id}`);
      }
    }
    
    // Preload all textures into the pool
    if (symbolUrls.length > 0) {
      await this.symbolPool.preloadTextures(symbolUrls);
    }
    
    console.log(`✅ Loaded ${symbolUrls.length} symbol textures`);
  }

  /**
   * Update background image
   */
  async updateBackground(url: string): Promise<void> {
    console.log('🖼️ Updating background');
    
    // Remove existing background
    if (this.backgroundSprite) {
      this.backgroundContainer.removeChild(this.backgroundSprite);
      this.backgroundSprite.destroy();
    }
    
    // Load new background
    const texture = await PIXI.Assets.load(url);
    this.backgroundSprite = new PIXI.Sprite(texture);
    
    // Scale to cover
    const scale = Math.max(
      this.app!.screen.width / texture.width,
      this.app!.screen.height / texture.height
    );
    
    this.backgroundSprite.scale.set(scale);
    this.backgroundSprite.anchor.set(0.5);
    this.backgroundSprite.x = this.app!.screen.width / 2;
    this.backgroundSprite.y = this.app!.screen.height / 2;
    
    this.backgroundContainer.addChild(this.backgroundSprite);
  }

  /**
   * Update frame overlay
   */
  async updateFrame(url: string, config: FrameConfig): Promise<void> {
    console.log('🖼️ Updating frame');
    
    // Remove existing frame
    if (this.frameSprite) {
      this.frameContainer.removeChild(this.frameSprite);
      this.frameSprite.destroy();
    }
    
    // Load new frame
    const texture = await PIXI.Assets.load(url);
    this.frameSprite = new PIXI.Sprite(texture);
    
    // Apply configuration
    this.frameSprite.scale.set(config.scale);
    this.frameSprite.anchor.set(0.5);
    this.frameSprite.x = this.app!.screen.width / 2 + config.position.x;
    this.frameSprite.y = this.app!.screen.height / 2 + config.position.y;
    
    // Apply stretch
    this.frameSprite.scale.x *= config.stretch.x;
    this.frameSprite.scale.y *= config.stretch.y;
    
    this.frameContainer.addChild(this.frameSprite);
  }

  /**
   * Handle window resize
   */
  resize(width: number, height: number): void {
    if (!this.app) return;
    
    console.log(`📐 Resizing to ${width}x${height}`);
    
    // Resize renderer
    this.app.renderer.resize(width, height);
    
    // Recalculate symbol sizes
    this.calculateOptimalSymbolSize();
    
    // Reposition elements
    this.centerGridContainer();
    
    // Update background
    if (this.backgroundSprite) {
      const scale = Math.max(
        width / this.backgroundSprite.texture.width,
        height / this.backgroundSprite.texture.height
      );
      
      this.backgroundSprite.scale.set(scale);
      this.backgroundSprite.x = width / 2;
      this.backgroundSprite.y = height / 2;
    }
  }

  /**
   * Set render quality
   */
  setQuality(quality: RenderQuality): void {
    if (!this.app) return;
    
    switch (quality) {
      case 'low':
        this.app.renderer.resolution = 1;
        break;
      case 'medium':
        this.app.renderer.resolution = window.devicePixelRatio || 1;
        break;
      case 'high':
      case 'ultra':
        this.app.renderer.resolution = window.devicePixelRatio * 1.5;
        break;
    }
  }
  
  /**
   * Set orientation and mobile state
   */
  setOrientation(orientation: 'portrait' | 'landscape', isMobile: boolean): void {
    this.orientation = orientation;
    this.isMobile = isMobile;
    console.log(`🔄 Orientation set to ${orientation} (mobile: ${isMobile})`);
    
    // Recalculate optimal sizes for new orientation
    if (this.app) {
      this.calculateOptimalSymbolSize();
      this.centerGridContainer();
      this.recreateGridGraphics();
    }
  }

  /**
   * Set symbols on the grid
   */
  async setSymbols(symbols: any): Promise<void> {
    console.log('🎲 Setting symbols on grid');
    
    // Clear current symbols
    this.clearGrid();
    
    // Recreate grid background
    this.createReelMasks();
    
    // Convert symbols to grid format if needed
    let symbolGrid: any[][];
    
    if (Array.isArray(symbols) && Array.isArray(symbols[0])) {
      symbolGrid = symbols;
    } else {
      throw new Error('Symbols must be a 2D array');
    }
    
    // Set each symbol
    for (let col = 0; col < symbolGrid.length; col++) {
      for (let row = 0; row < symbolGrid[col].length; row++) {
        const symbolData = symbolGrid[col][row];
        
        // Extract symbol ID
        let symbolId: string;
        if (typeof symbolData === 'string') {
          symbolId = symbolData;
        } else if (symbolData?.id) {
          symbolId = symbolData.id;
        } else if (symbolData?.value) {
          symbolId = symbolData.value;
        } else {
          symbolId = 'wild'; // Default fallback
        }
        
        // Create symbol sprite
        const sprite = await this.symbolPool.getSymbol(symbolId);
        if (sprite) {
          this.positionSymbol(sprite, { x: col, y: row });
          
          if (!this.symbolGrid[col]) {
            this.symbolGrid[col] = [];
          }
          this.symbolGrid[col][row] = sprite;
          this.reelContainer.addChild(sprite);
        }
      }
    }
    
    console.log('✅ Symbols set on grid');
  }
  
  /**
   * Update grid size
   */
  async updateGridSize(cols: number, rows: number): Promise<void> {
    console.log(`📊 Updating grid size to ${cols}x${rows}`);
    await this.createGrid(cols, rows);
  }
  
  /**
   * Spin a reel
   */
  async spinReel(reelIndex: number, duration: number): Promise<void> {
    console.log(`🎰 Spinning reel ${reelIndex}`);
    this.animateReelSpin(reelIndex, duration / 1000);
  }
  
  /**
   * Stop a reel
   */
  async stopReel(reelIndex: number, position: number, duration: number): Promise<void> {
    console.log(`⏹️ Stopping reel ${reelIndex} at position ${position}`);
    // Stop animation logic here
    // For now, just clear animations for that reel
    const reel = this.symbolGrid[reelIndex];
    if (reel) {
      reel.forEach(sprite => {
        if (sprite) {
          gsap.killTweensOf(sprite);
          // Reset position if needed
        }
      });
    }
  }
  
  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    console.log('🧹 Clearing highlights');
    
    this.symbolGrid.forEach(col => {
      col.forEach(sprite => {
        if (sprite && sprite.filters) {
          sprite.filters = [];
        }
      });
    });
    
    // Stop highlight animations
    this.activeAnimations.forEach(tween => {
      if (tween.vars.repeat === -1) {
        tween.kill();
      }
    });
  }

  // ===== Private Methods =====
  
  private generateDemoSymbols(cols: number, rows: number): string[][] {
    const availableSymbols = [
      'wild', 'scatter',
      'high_1', 'high_2', 'high_3',
      'low_1', 'low_2', 'low_3'
    ];
    
    const grid: string[][] = [];
    for (let col = 0; col < cols; col++) {
      const column: string[] = [];
      for (let row = 0; row < rows; row++) {
        const randomSymbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
        column.push(randomSymbol);
      }
      grid.push(column);
    }
    
    return grid;
  }

  private calculateOptimalSymbolSize(): void {
    if (!this.app) return;
    
    const oldWidth = this.gridConfig.symbolWidth;
    const oldHeight = this.gridConfig.symbolHeight;
    
    // Adjust coverage based on orientation and device
    let screenCoverage = 0.7;
    if (this.isMobile) {
      screenCoverage = this.orientation === 'landscape' ? 0.6 : 0.5;
    }
    
    const availableWidth = this.app.screen.width * screenCoverage;
    const availableHeight = this.app.screen.height * screenCoverage;
    
    const totalPaddingWidth = (this.gridConfig.cols - 1) * this.gridConfig.symbolPadding;
    const totalPaddingHeight = (this.gridConfig.rows - 1) * this.gridConfig.symbolPadding;
    
    const maxSymbolWidth = (availableWidth - totalPaddingWidth) / this.gridConfig.cols;
    const maxSymbolHeight = (availableHeight - totalPaddingHeight) / this.gridConfig.rows;
    
    // Use the smaller dimension to maintain aspect ratio
    const optimalSize = Math.min(maxSymbolWidth, maxSymbolHeight);
    
    // Apply reasonable min/max constraints based on device
    const minSize = this.isMobile ? 50 : 60;
    const maxSize = this.isMobile ? 120 : 150;
    const constrainedSize = Math.max(minSize, Math.min(optimalSize, maxSize));
    
    this.gridConfig.symbolWidth = Math.floor(constrainedSize);
    this.gridConfig.symbolHeight = Math.floor(constrainedSize);
    
    // Only log if size actually changed
    if (oldWidth !== this.gridConfig.symbolWidth || oldHeight !== this.gridConfig.symbolHeight) {
      console.log(`Symbol size calculated: ${this.gridConfig.symbolWidth}x${this.gridConfig.symbolHeight} (${this.orientation}, mobile: ${this.isMobile})`);
    }
  }

  private centerGridContainer(): void {
    const totalWidth = this.gridConfig.cols * this.gridConfig.symbolWidth + 
                      (this.gridConfig.cols - 1) * this.gridConfig.symbolPadding;
    const totalHeight = this.gridConfig.rows * this.gridConfig.symbolHeight + 
                       (this.gridConfig.rows - 1) * this.gridConfig.symbolPadding;
    
    this.reelContainer.x = (this.app!.screen.width - totalWidth) / 2;
    this.reelContainer.y = (this.app!.screen.height - totalHeight) / 2;
    
    this.gridContainer.x = this.reelContainer.x;
    this.gridContainer.y = this.reelContainer.y;
  }

  private createReelMasks(): void {
    // Create grid background
    const gridBackground = new PIXI.Graphics();
    gridBackground.beginFill(0x0a0a0a, 1); // Very dark background
    
    // Calculate total grid size
    const totalWidth = this.gridConfig.cols * this.gridConfig.symbolWidth + (this.gridConfig.cols - 1) * this.gridConfig.symbolPadding;
    const totalHeight = this.gridConfig.rows * this.gridConfig.symbolHeight + (this.gridConfig.rows - 1) * this.gridConfig.symbolPadding;
    
    gridBackground.drawRoundedRect(-20, -20, totalWidth + 40, totalHeight + 40, 15);
    gridBackground.endFill();
    this.reelContainer.addChildAt(gridBackground, 0);
    
    // Create individual cell backgrounds with borders
    const cellGraphics = new PIXI.Graphics();
    
    for (let col = 0; col < this.gridConfig.cols; col++) {
      for (let row = 0; row < this.gridConfig.rows; row++) {
        const x = col * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding);
        const y = row * (this.gridConfig.symbolHeight + this.gridConfig.symbolPadding);
        
        // Cell background
        cellGraphics.beginFill(0x1a1a2e, 0.3);
        cellGraphics.lineStyle(2, 0x3a3a5e, 0.8);
        cellGraphics.drawRoundedRect(x, y, this.gridConfig.symbolWidth, this.gridConfig.symbolHeight, 8);
        cellGraphics.endFill();
        
        // Add reel position number
        const positionNumber = col * this.gridConfig.rows + row + 1;
        const text = new PIXI.Text(positionNumber.toString(), {
          fontSize: this.gridConfig.symbolWidth / 4,
          fill: 0x4a4a6e,
          fontFamily: 'Arial',
          fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        text.x = x + this.gridConfig.symbolWidth / 2;
        text.y = y + this.gridConfig.symbolHeight / 2;
        text.alpha = 0.3;
        this.reelContainer.addChild(text);
      }
    }
    
    this.reelContainer.addChild(cellGraphics);
  }

  private async fadeOutSymbols(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    this.symbolGrid.forEach(col => {
      col.forEach(sprite => {
        if (sprite) {
          const promise = new Promise<void>(resolve => {
            const tween = gsap.to(sprite, {
              alpha: 0,
              duration: 0.3,
              onComplete: resolve
            });
            this.activeAnimations.add(tween);
          });
          promises.push(promise);
        }
      });
    });
    
    await Promise.all(promises);
  }

  private async fadeInSymbols(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    this.symbolGrid.forEach((col, colIndex) => {
      col.forEach((sprite, rowIndex) => {
        if (sprite) {
          sprite.alpha = 0;
          const promise = new Promise<void>(resolve => {
            const tween = gsap.to(sprite, {
              alpha: 1,
              duration: 0.3,
              delay: (colIndex * 0.05) + (rowIndex * 0.02),
              onComplete: resolve
            });
            this.activeAnimations.add(tween);
          });
          promises.push(promise);
        }
      });
    });
    
    await Promise.all(promises);
  }

  private animateReelSpin(reelIndex: number, duration: number): void {
    // Implement continuous spinning animation
    const reel = this.symbolGrid[reelIndex];
    if (!reel) return;
    
    reel.forEach(sprite => {
      if (sprite) {
        const tween = gsap.to(sprite, {
          y: sprite.y + this.app!.screen.height,
          duration: 0.5,
          ease: "none",
          repeat: Math.floor(duration / 0.5),
          onRepeat: () => {
            // Reset position when it goes off screen
            sprite.y -= this.app!.screen.height;
          }
        });
        
        this.activeAnimations.add(tween);
      }
    });
  }

  private stopAllAnimations(): void {
    this.activeAnimations.forEach(tween => {
      tween.kill();
    });
    this.activeAnimations.clear();
  }

  private setupResizeHandler(): void {
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    
    // Also observe container size changes with a more specific handler
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Only handle if this is our container
        if (entry.target === this.container) {
          // Use contentBoxSize if available (more accurate)
          const width = entry.contentBoxSize?.[0]?.inlineSize || entry.contentRect.width;
          const height = entry.contentBoxSize?.[0]?.blockSize || entry.contentRect.height;
          
          // Prevent infinite loops - only resize if dimensions are reasonable
          if (width > 0 && height > 0 && width < 10000 && height < 10000) {
            this.handleResize();
          } else {
            console.warn(`Ignoring invalid resize: ${width}x${height}`);
          }
        }
      }
    });
    this.resizeObserver.observe(this.container);
  }

  private handleResize = (): void => {
    // Clear any existing timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Debounce resize events
    this.resizeTimeout = setTimeout(() => {
      if (this.container && this.app) {
        const newWidth = this.container.clientWidth;
        const newHeight = this.container.clientHeight;
        
        // Only resize if dimensions actually changed
        if (newWidth !== this.lastSize.width || newHeight !== this.lastSize.height) {
          console.log(`📐 Resizing renderer: ${this.lastSize.width}x${this.lastSize.height} → ${newWidth}x${newHeight}`);
          
          this.lastSize.width = newWidth;
          this.lastSize.height = newHeight;
          
          // Update app size
          this.app.renderer.resize(newWidth, newHeight);
          
          // Recalculate symbol sizes for new dimensions
          this.calculateOptimalSymbolSize();
          
          // Recenter the grid
          this.centerGridContainer();
          
          // Recreate grid graphics with new sizes
          this.recreateGridGraphics();
        }
      }
    }, 100); // 100ms debounce
  };
  
  private recreateGridGraphics(): void {
    // Find and remove old grid graphics
    const oldGraphics = this.reelContainer.children.filter(child => 
      child instanceof PIXI.Graphics || (child instanceof PIXI.Text && child.alpha === 0.3)
    );
    oldGraphics.forEach(child => this.reelContainer.removeChild(child));
    
    // Recreate grid with new dimensions
    this.createReelMasks();
    
    // Update all symbol positions
    this.symbolGrid.forEach((col, colIndex) => {
      col.forEach((sprite, rowIndex) => {
        if (sprite) {
          const x = colIndex * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding) + this.gridConfig.symbolWidth / 2;
          const y = rowIndex * (this.gridConfig.symbolHeight + this.gridConfig.symbolPadding) + this.gridConfig.symbolHeight / 2;
          
          sprite.x = x;
          sprite.y = y;
          
          // Update scale
          const scale = Math.min(
            this.gridConfig.symbolWidth / sprite.texture.width,
            this.gridConfig.symbolHeight / sprite.texture.height
          ) * 0.8;
          
          sprite.scale.set(scale);
        }
      });
    });
  };
}