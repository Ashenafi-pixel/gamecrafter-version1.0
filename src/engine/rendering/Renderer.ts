/**
 * Renderer - Unified PIXI.js renderer for the slot engine
 * FIXED VERSION - Comprehensive rewrite to eliminate all issues
 */

import * as PIXI from 'pixi.js';
// Filters are now handled differently or removed for v8 migration momentarily
import { gsap } from 'gsap';
import { CSSPlugin } from 'gsap/CSSPlugin';
import { EasePack } from 'gsap/EasePack';

// Register GSAP plugins
gsap.registerPlugin(CSSPlugin, EasePack);
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
  private logoContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;

  // Grid configuration
  private gridConfig = {
    cols: 5,
    rows: 3,
    symbolWidth: 140,
    symbolHeight: 140,
    symbolPadding: 5
  };

  // Orientation settings
  private orientation: 'portrait' | 'landscape' = 'portrait';
  private isMobile: boolean = false;

  // Standard symbol scale for consistency
  private standardSymbolScale: number = 1;

  // Centering configuration - adjusted to account for UI bar at bottom
  private centeringConfig = {
    desktop: { x: 0.5, y: 0.47 },          // Shifted up to account for UI bar (80px standard height)
    mobileLandscape: { x: 0.5, y: 0.47 },  // Shifted up to account for UI bar
    mobilePortrait: { x: 0.5, y: 0.47 }    // Shifted up to account for UI bar
  };

  // Grid state
  private symbolGrid: (PIXI.Sprite | null)[][] = [];
  private reelMasks: PIXI.Graphics[] = [];

  // Masking controls
  private maskingEnabled: boolean = true;
  private debugMasksVisible: boolean = false;
  private perReelMaskingEnabled: boolean[] = [true, true, true, true, true];

  // Assets
  private backgroundSprite: PIXI.Sprite | null = null;
  private frameSprite: PIXI.Sprite | null = null;
  private logoSprite: PIXI.Sprite | null = null;
  private uiButtonSprites: Map<string, PIXI.Sprite> = new Map();

  // Symbol mapping - ID to URL
  private symbolIdToUrlMap: Map<string, string> = new Map();

  // Animation state
  private activeAnimations: Set<gsap.core.Tween> = new Set();
  private extraSymbols: Map<number, PIXI.Sprite[]> = new Map();
  private isSpinning: boolean = false;
  private spinningReels: Set<number> = new Set();
  private currentSymbolData: any[][] = [];

  // Animation Studio Settings
  private animationSettings = {
    speed: 1.0,
    blurIntensity: 8,
    easing: 'back.out',
    visualEffects: {
      spinBlur: true,
      glowEffects: false,
      screenShake: false
    }
  };

  // Visual effects
  // Filters commented out for v8 migration
  private blurFilter: PIXI.BlurFilter | null = null;
  private glowFilter: any | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.symbolPool = new SymbolPool();

    // Initialize containers
    this.stage = new PIXI.Container();
    this.backgroundContainer = new PIXI.Container();
    this.gridContainer = new PIXI.Container();
    this.reelContainer = new PIXI.Container();
    this.frameContainer = new PIXI.Container();
    this.logoContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();

    // Initialize visual effects filters
    this.initializeFilters();
  }

  /**
   * Initialize visual effects filters
   */
  private initializeFilters(): void {
    // In v8, BlurFilter is usually importable from pixi.js directly
    this.blurFilter = new PIXI.BlurFilter({ strength: this.animationSettings.blurIntensity });
    // GlowFilter removed for now
    // this.glowFilter = new GlowFilter();
    console.log('🎨 Visual effects filters initialized');
  }

  /**
   * Initialize the renderer
   */
  async initialize(config: RendererConfig): Promise<void> {
    console.log('🎨 Initializing renderer with config:', config);

    // Validate dimensions
    const width = Math.max(100, Math.min(config.width || 800, 10000));
    const height = Math.max(100, Math.min(config.height || 600, 10000));

    // Create PIXI application
    console.log('🎨 Creating PIXI Application with:', { width, height });
    try {
      this.app = new PIXI.Application();
      await this.app.init({
        width: width,
        height: height,
        backgroundAlpha: 0, // Make PixiJS stage transparent so UI shows through
        antialias: config.antialias !== false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: 'webgl',
        // view: document.createElement('canvas') as HTMLCanvasElement // let init create it
      });
      console.log('✅ PIXI Application created successfully');
    } catch (pixiError) {
      console.error('❌ Failed to create PIXI Application:', pixiError);
      throw new Error(`PIXI initialization failed: ${pixiError}`);
    }

    // Add canvas to container with proper styling
    // In v8, use app.canvas
    const canvas = this.app.canvas;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%'; // Full height since UI is now absolutely positioned
    canvas.style.objectFit = 'fill'; // Use fill to stretch canvas to exact container dimensions
    canvas.style.background = 'transparent';
    canvas.style.zIndex = '1'; // PixiJS canvas for game content
    canvas.style.pointerEvents = 'none'; // Prevent canvas from blocking UI interactions
    this.container.appendChild(canvas);

    // Set up container hierarchy (order matters for layering)
    this.stage = this.app.stage;
    this.stage.addChild(this.backgroundContainer);  // Background layer (bottom)
    this.stage.addChild(this.gridContainer);        // Symbols layer
    // Note: reelContainer will be added to gridContainer in createReelMasks, not directly to stage
    this.stage.addChild(this.frameContainer);       // Frame overlay
    this.stage.addChild(this.uiContainer);          // UI buttons layer
    this.stage.addChild(this.logoContainer);        // Logo layer (above UI!)
    this.stage.addChild(this.effectsContainer);     // Effects layer (top)

    // Set render quality
    this.setQuality(config.quality);

    // Initialize last size with validation
    this.lastSize = {
      width: Math.max(100, Math.min(this.container.clientWidth || width, 10000)),
      height: Math.max(100, Math.min(this.container.clientHeight || height, 10000))
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
      this.app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
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

    // Create individual reel containers
    for (let i = 0; i < cols; i++) {
      const reelColumn = new PIXI.Container();
      reelColumn.name = `reel_${i}`;
      // Position the reel container immediately
      reelColumn.x = i * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding);
      reelColumn.y = 0;
      this.reelContainer.addChild(reelColumn);
    }

    // Create reel masks for clipping
    this.createReelMasks();

    // Position grid container
    this.centerGridContainer();

    // Enable sorting for proper layering
    this.reelContainer.sortableChildren = true;

    console.log('✅ Grid created');

    // Apply current masking settings now that grid is created
    this.updateMasking();

    // Generate demo symbols for initial visualization
    // Only if we're not spinning (initial load)
    if (!this.isSpinning) {
      await this.generateDemoSymbols();
      console.log('✅ Demo symbols added to grid');
    }
  }

  /**
   * Update grid size
   */
  async updateGridSize(cols: number, rows: number): Promise<void> {
    console.log(`📊 Updating grid size from ${this.gridConfig.cols}x${this.gridConfig.rows} to ${cols}x${rows}`);

    // Skip if no change
    if (this.gridConfig.cols === cols && this.gridConfig.rows === rows) {
      console.log('⏭️ Grid size unchanged, skipping update');
      return;
    }

    // Update grid
    await this.createGrid(cols, rows);

    // Generate demo symbols for visualization
    await this.generateDemoSymbols();
    console.log('✅ Grid size updated with demo symbols');
  }

  /**
   * Generate demo symbols for visualization
   */
  private async generateDemoSymbols(): Promise<void> {
    console.log('🎰 Generating demo symbols for grid preview');

    const demoSymbols = [
      '/assets/symbols/wild.png',
      '/assets/symbols/scatter.png',
      '/assets/symbols/high_1.png',
      '/assets/symbols/high_2.png',
      '/assets/symbols/high_3.png',
      '/assets/symbols/mid_1.png',
      '/assets/symbols/mid_2.png',
      '/assets/symbols/low_1.png',
      '/assets/symbols/low_2.png',
      '/assets/symbols/low_3.png'
    ];

    // Preload demo symbol textures
    await this.symbolPool.preloadTextures(demoSymbols);

    // Fill grid with demo symbols
    const symbolGrid: string[][] = [];
    for (let col = 0; col < this.gridConfig.cols; col++) {
      const columnSymbols: string[] = [];
      for (let row = 0; row < this.gridConfig.rows; row++) {
        // Create a pattern that looks good
        const symbolIndex = (col + row * 2) % demoSymbols.length;
        const symbolPath = demoSymbols[symbolIndex];
        columnSymbols.push(symbolPath);
      }
      symbolGrid.push(columnSymbols);
    }

    // Set the symbols on the grid
    await this.setSymbols(symbolGrid);
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

    // Clear only symbols from reel containers, not the containers themselves
    this.reelContainer.children.forEach(child => {
      if (child instanceof PIXI.Container && child.name?.startsWith('reel_')) {
        // Clear only the symbols inside each reel container
        child.removeChildren();
      }
    });

    // Clear grid container (for background)
    this.gridContainer.removeChildren();

    // Reset grid array and masks
    this.symbolGrid = [];
    this.reelMasks = [];
  }

  /**
   * Set symbols on the grid - main method for setting all symbols at once
   */
  async setSymbols(symbols: any): Promise<void> {
    console.log('🎲 Setting symbols on grid', symbols);
    console.log('🎲 Current grid config:', this.gridConfig);
    console.log('🎲 Has symbols:', Array.isArray(symbols) && symbols.length > 0);
    console.log('🔍 DEBUG: About to start symbol processing...');

    // Only clear grid if we're not spinning and not in rapid update mode
    if (!this.isSpinning) {
      console.log('🔍 DEBUG: About to clear grid...');
      // Clear current symbols (but avoid excessive clearing)
      this.clearGrid();
      console.log('🔍 DEBUG: Grid cleared successfully');

      // Ensure reel containers exist
      if (this.reelContainer.children.length === 0) {
        console.log('📦 Recreating reel containers');
        for (let i = 0; i < this.gridConfig.cols; i++) {
          const reelColumn = new PIXI.Container();
          reelColumn.name = `reel_${i}`;
          reelColumn.x = i * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding);
          reelColumn.y = 0;
          this.reelContainer.addChild(reelColumn);
        }
        // Recreate the grid background
        this.createReelMasks();
      }
    } else {
      console.log('🎰 Skipping grid clear - reels are spinning');
    }

    // Handle empty symbols array
    if (!symbols || symbols.length === 0) {
      console.log('🔲 No symbols provided - showing empty grid');
      // Initialize empty grid array
      this.symbolGrid = Array(this.gridConfig.cols).fill(null).map(() => Array(this.gridConfig.rows).fill(null));
      return;
    }

    // If spinning, symbols will be set when animation completes
    if (this.isSpinning) {
      console.log('🎰 Deferring symbol update until spin completes');
      return;
    }

    // Convert symbols to grid format if needed
    console.log('🔍 DEBUG: Converting symbols to grid format...');
    let symbolGrid: any[][];

    if (Array.isArray(symbols) && Array.isArray(symbols[0])) {
      symbolGrid = symbols;
      console.log('🔍 DEBUG: Symbols are valid 2D array:', symbolGrid.length, 'x', symbolGrid[0]?.length);
    } else {
      console.error('🔍 DEBUG: Invalid symbols format:', { isArray: Array.isArray(symbols), firstElement: symbols?.[0] });
      throw new Error('Symbols must be a 2D array');
    }

    // Initialize grid array if needed
    if (this.symbolGrid.length === 0) {
      this.symbolGrid = Array(this.gridConfig.cols).fill(null).map(() => Array(this.gridConfig.rows).fill(null));
    }

    // Set each symbol
    console.log('🔍 DEBUG: About to iterate through symbols. Grid size:', symbolGrid.length, 'x', symbolGrid[0]?.length);
    console.log('🔍 DEBUG: Target grid config:', this.gridConfig.cols, 'x', this.gridConfig.rows);

    try {
      for (let col = 0; col < Math.min(symbolGrid.length, this.gridConfig.cols); col++) {
        for (let row = 0; row < Math.min(symbolGrid[col].length, this.gridConfig.rows); row++) {
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

          console.log(`🎯 Setting symbol at [${col}, ${row}]: ${symbolId}`);

          try {
            // Create and position symbol
            await this.setSymbolAt(col, row, symbolId);
            console.log(`✅ Symbol set at [${col}, ${row}]`);
          } catch (symbolError) {
            console.error(`❌ Failed to set symbol at [${col}, ${row}]:`, symbolError);
            // Continue with other symbols
          }
        }
      }

      console.log('✅ All symbols set on grid successfully');

      // Verify and fix container hierarchy

      // Auto-fix container hierarchy if needed
      const isGridContainerOnStage = this.app.stage.children.includes(this.gridContainer);
      if (!isGridContainerOnStage) {
        this.app.stage.addChild(this.gridContainer);
      }

      if (!this.gridContainer.children.includes(this.reelContainer)) {
        this.gridContainer.addChild(this.reelContainer);
      }

      // Ensure containers are visible
      this.gridContainer.visible = true;
      this.gridContainer.alpha = 1;
      this.reelContainer.visible = true;
      this.reelContainer.alpha = 1;

      // Force a render
      this.app.renderer.render(this.app.stage);

      console.log('🔍 DEBUG: About to complete setSymbols method...');
    } catch (error) {
      console.error('❌ Error setting symbols on grid:', error);
      throw error;
    }

    console.log('✅ setSymbols method completed successfully');
  }

  /**
   * Set a symbol grid (string[][]) on the display
   */
  async setSymbolGrid(symbolGrid: string[][]): Promise<void> {
    console.log('🎯 Setting symbol grid');

    // Clear existing symbols
    this.symbolGrid.forEach(col => {
      col.forEach(sprite => {
        if (sprite) {
          this.reelContainer.removeChild(sprite);
          this.symbolPool.releaseSymbol(sprite);
        }
      });
    });

    // Reset grid
    this.symbolGrid = Array(this.gridConfig.cols).fill(null).map(() => Array(this.gridConfig.rows).fill(null));

    // Set new symbols
    for (let col = 0; col < Math.min(symbolGrid.length, this.gridConfig.cols); col++) {
      for (let row = 0; row < Math.min(symbolGrid[col].length, this.gridConfig.rows); row++) {
        await this.setSymbolAt(col, row, symbolGrid[col][row]);
      }
    }
  }

  /**
   * Set a single symbol at a specific position
   */
  private async setSymbolAt(col: number, row: number, symbolIdOrPath: string): Promise<void> {
    console.log(`🔍 SYMBOL RENDER: setSymbolAt [${col}, ${row}] symbol: ${symbolIdOrPath?.substring(0, 30)}...`);

    try {

      // Convert symbol ID to URL if needed
      let symbolPath = symbolIdOrPath;

      // Check if this is a symbol ID that needs to be mapped to a URL
      if (this.symbolIdToUrlMap.has(symbolIdOrPath)) {
        symbolPath = this.symbolIdToUrlMap.get(symbolIdOrPath)!;
        console.log(`🔄 Mapped symbol ID "${symbolIdOrPath}" to URL: ${symbolPath.substring(0, 50)}...`);
      } else if (!symbolIdOrPath.includes('/') && !symbolIdOrPath.startsWith('blob:')) {
        // This looks like an ID but wasn't in our map - log a warning
        console.warn(`⚠️ Symbol ID "${symbolIdOrPath}" not found in URL map, using as-is`);
      }

      console.log(`🔍 DEBUG: About to get symbol from pool for path: ${symbolPath.substring(0, 50)}...`);

      // ENHANCED: Get sprite from pool with aggressive timeout
      let sprite: PIXI.Sprite | null = null;
      try {
        console.log(`🔍 SYMBOL RENDER: Getting sprite from pool for: ${symbolPath.substring(0, 30)}...`);
        sprite = await Promise.race([
          this.symbolPool.getSymbol(symbolPath),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error(`CRITICAL: Symbol ${col},${row} timeout after 2s`)), 2000)
          )
        ]);
        console.log(`✅ SYMBOL RENDER: Got sprite for [${col}, ${row}]`);
      } catch (error) {
        console.error(`❌ SYMBOL RENDER: Failed to get sprite for [${col}, ${row}]:`, error);
        // Create fallback sprite instead of failing
        try {
          sprite = this.createFallbackSymbol(symbolIdOrPath);
          console.log(`🔄 SYMBOL RENDER: Using fallback sprite for [${col}, ${row}]`);
        } catch (fallbackError) {
          console.error(`❌ SYMBOL RENDER: Fallback failed for [${col}, ${row}]:`, fallbackError);
          return;
        }
      }

      if (!sprite) {
        console.error(`Failed to get sprite for symbol ${symbolIdOrPath} (resolved to: ${symbolPath})`);
        return;
      }

      console.log(`🔍 DEBUG: Got sprite from pool:`, {
        width: sprite.width,
        height: sprite.height,
        visible: sprite.visible,
        alpha: sprite.alpha,
        texture: sprite.texture ? 'exists' : 'null'
      });

      // Position symbol
      this.positionSymbol(sprite, { x: col, y: row });

      console.log(`🔍 DEBUG: Positioned sprite at:`, {
        x: sprite.x,
        y: sprite.y,
        anchorX: sprite.anchor.x,
        anchorY: sprite.anchor.y,
        scaleX: sprite.scale.x,
        scaleY: sprite.scale.y
      });

      // Store in grid
      if (!this.symbolGrid[col]) {
        this.symbolGrid[col] = [];
      }
      this.symbolGrid[col][row] = sprite;

      // Add to the correct reel container
      const reelColumn = this.reelContainer.children.find(
        child => child.name === `reel_${col}`
      ) as PIXI.Container;
      if (reelColumn) {
        reelColumn.addChild(sprite);
        console.log(`🔍 DEBUG: Added sprite to reel container ${col}. Container children count: ${reelColumn.children.length}`);
        console.log(`🔍 DEBUG: Reel container ${col} properties:`, {
          visible: reelColumn.visible,
          alpha: reelColumn.alpha,
          x: reelColumn.x,
          y: reelColumn.y
        });
      } else {
        console.error(`Reel container ${col} not found!`);
        this.reelContainer.addChild(sprite); // Fallback
      }

      // Ensure symbols are above grid background
      sprite.zIndex = 10 + (col * this.gridConfig.rows) + row;
      console.log(`🔍 DEBUG: Set sprite zIndex to: ${sprite.zIndex}`);

    } catch (error) {
      console.error(`❌ Error in setSymbolAt for [${col}, ${row}]:`, error);
      throw error;
    }
  }

  /**
   * Create a fallback symbol when texture loading fails
   */
  private createFallbackSymbol(symbolId: string): PIXI.Sprite {
    console.log(`🔄 Creating fallback symbol for: ${symbolId}`);

    // Create a simple colored rectangle as fallback
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x4CAF50); // Green color
    graphics.drawRoundedRect(0, 0, 100, 100, 10);
    graphics.endFill();

    // Add text label
    const text = new PIXI.Text('SYM', {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xFFFFFF,
      align: 'center'
    });
    text.anchor.set(0.5);
    text.x = 50;
    text.y = 50;
    graphics.addChild(text);

    // Convert to sprite
    const texture = this.app!.renderer.generateTexture(graphics);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);

    return sprite;
  }

  /**
   * Position a symbol sprite at the given grid coordinates
   */
  private positionSymbol(sprite: PIXI.Sprite, position: { x: number, y: number }): void {
    // Since the symbol is added to a reel container that's already positioned,
    // we only need to set the local position within that container
    const x = this.gridConfig.symbolWidth / 2;
    const y = position.y * (this.gridConfig.symbolHeight + this.gridConfig.symbolPadding) + this.gridConfig.symbolHeight / 2;

    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;

    // Use fixed standard scale for all symbols (calculated once)
    if (this.standardSymbolScale === 1) {
      // Calculate standard scale based on actual symbol texture size
      const referenceSize = Math.max(sprite.texture.width, sprite.texture.height);
      this.standardSymbolScale = Math.min(
        this.gridConfig.symbolWidth / referenceSize,
        this.gridConfig.symbolHeight / referenceSize
      ) * 0.95;
    }

    // Apply the same scale to ALL symbols regardless of their source dimensions
    sprite.scale.set(this.standardSymbolScale);

    // Ensure sprite is above grid graphics
    sprite.zIndex = 10;
  }

  /**
   * Spin a reel with professional infinite scroll animation
   */
  async spinReel(reelIndex: number, duration: number, targetSymbols?: string[], easing?: string): Promise<void> {
    console.log(`🎰 Spinning reel ${reelIndex}`);
    const reel = this.symbolGrid[reelIndex];
    if (!reel) return;

    // Mark reel as spinning
    this.isSpinning = true;
    this.spinningReels.add(reelIndex);

    // Create blur effect using Animation Studio settings
    const blurFilter = new BlurFilter();
    blurFilter.blur = 0;

    // Apply filter to all symbols in reel (only if spin blur is enabled)
    if (this.animationSettings.visualEffects.spinBlur) {
      reel.forEach(sprite => {
        if (sprite) {
          sprite.filters = [blurFilter];
        }
      });
    }

    // Create extended symbol strip for infinite scrolling
    await this.createInfiniteReelStrip(reelIndex);

    // Animate blur in during acceleration using Animation Studio settings
    const maxBlur = this.animationSettings.visualEffects.spinBlur ? this.animationSettings.blurIntensity : 0;
    const blurInTween = gsap.to(blurFilter, {
      blur: maxBlur,
      duration: 0.2 / this.animationSettings.speed, // Faster blur-in for higher speeds
      ease: "power2.in"
    });

    // Start the infinite spin animation
    this.animateInfiniteReelSpin(reelIndex, duration / 1000, blurFilter, easing);

    this.activeAnimations.add(blurInTween);
  }

  /**
   * Create an extended symbol strip for infinite scrolling
   */
  private async createInfiniteReelStrip(reelIndex: number): Promise<void> {
    const reelColumn = this.reelContainer.children.find(
      child => child.name === `reel_${reelIndex}`
    ) as PIXI.Container;
    if (!reelColumn) return;

    const symbolHeight = this.gridConfig.symbolHeight + this.gridConfig.symbolPadding;
    const visibleSymbols = this.gridConfig.rows;
    const bufferSymbols = 4; // Extra symbols above and below visible area

    // Store reference to extra symbols for cleanup
    if (!this.extraSymbols) {
      this.extraSymbols = new Map();
    }

    const extraSprites: PIXI.Sprite[] = [];

    // Get the number of available symbols from the current grid
    const availableSymbolCount = Math.max(3, this.symbolGrid.reduce((max, reel) => {
      return Math.max(max, reel.filter(s => s !== null).length);
    }, 0));

    // Get available symbol IDs from our map
    const availableSymbolIds = Array.from(this.symbolIdToUrlMap.keys());
    if (availableSymbolIds.length === 0) {
      console.warn('No symbols loaded in symbolIdToUrlMap');
      return;
    }

    // Create buffer symbols above visible area
    for (let i = 1; i <= bufferSymbols; i++) {
      // Pick a random symbol ID and get its URL
      const randomSymbolId = availableSymbolIds[Math.floor(Math.random() * availableSymbolIds.length)];
      const symbolUrl = this.symbolIdToUrlMap.get(randomSymbolId)!;
      const sprite = await this.symbolPool.getSymbol(symbolUrl);
      if (sprite) {
        // Apply same positioning and scaling as regular symbols
        sprite.anchor.set(0.5);
        sprite.x = this.gridConfig.symbolWidth / 2;
        // Position buffer symbols well above visible area with consistent spacing
        sprite.y = -i * symbolHeight;

        // Apply consistent scaling
        sprite.scale.set(this.standardSymbolScale);

        reelColumn.addChild(sprite);
        extraSprites.push(sprite);
      }
    }

    // Create buffer symbols below visible area
    for (let i = 0; i < bufferSymbols; i++) {
      // Pick a random symbol ID and get its URL
      const randomSymbolId = availableSymbolIds[Math.floor(Math.random() * availableSymbolIds.length)];
      const symbolUrl = this.symbolIdToUrlMap.get(randomSymbolId)!;
      const sprite = await this.symbolPool.getSymbol(symbolUrl);
      if (sprite) {
        // Apply same positioning and scaling as regular symbols
        sprite.anchor.set(0.5);
        sprite.x = this.gridConfig.symbolWidth / 2;
        // Position buffer symbols well below visible area with consistent spacing
        sprite.y = (visibleSymbols + i) * symbolHeight;

        // Apply consistent scaling
        sprite.scale.set(this.standardSymbolScale);

        reelColumn.addChild(sprite);
        extraSprites.push(sprite);
      }
    }

    this.extraSymbols.set(reelIndex, extraSprites);
  }

  /**
   * Animate infinite reel spin with symbol recycling
   */
  private animateInfiniteReelSpin(reelIndex: number, duration: number, blurFilter: BlurFilter, easing?: string): void {
    const reelColumn = this.reelContainer.children.find(
      child => child.name === `reel_${reelIndex}`
    ) as PIXI.Container;
    if (!reelColumn) return;

    const symbolHeight = this.gridConfig.symbolHeight + this.gridConfig.symbolPadding;
    const visibleHeight = this.gridConfig.rows * symbolHeight;

    // Animation parameters - use Animation Studio settings
    const speedMultiplier = this.animationSettings.speed;
    const finalEasing = easing || this.animationSettings.easing;

    const accelerationTime = 0.2 / speedMultiplier;
    const decelerationTime = 1.0 / speedMultiplier;
    const mainSpinTime = Math.max(0.5, duration - accelerationTime - decelerationTime);

    console.log(`🎨 Reel ${reelIndex} animation: speed=${speedMultiplier}x, easing=${finalEasing}`);

    let currentSpeed = 0;
    const maxSpeed = 3000; // pixels per second
    let totalDistance = 0;
    let isDecelerating = false;

    // Get all symbols in reel (including extras)
    const allSymbols = reelColumn.children.filter(child => child instanceof PIXI.Sprite) as PIXI.Sprite[];

    // Create timeline for speed control
    const timeline = gsap.timeline();

    // Speed control object
    const speedControl = { speed: 0 };

    // Acceleration phase
    timeline.to(speedControl, {
      speed: maxSpeed,
      duration: accelerationTime,
      ease: "power2.in"
    });

    // Main spin phase
    timeline.to(speedControl, {
      speed: maxSpeed,
      duration: mainSpinTime,
      ease: "none"
    });

    // Deceleration phase - use Animation Studio easing or fallback
    // Convert Animation Studio easing format to GSAP format
    let decelerationEasing = "back.out(1.5)"; // Default fallback

    if (easing) {
      // Map Animation Studio easing names to proper GSAP easing - with stronger effects
      const easingMap: { [key: string]: string } = {
        "back.out": "back.out(2.5)", // Stronger overshoot
        "bounce.out": "bounce.out",
        "elastic.out": "elastic.out(1, 0.4)", // Smoother elastic with moderate amplitude and longer period
        "power2.out": "power2.out",
        "power2.in": "power2.in",
        "power2.inOut": "power2.inOut",
        "none": "none"
      };

      decelerationEasing = easingMap[easing] || easing;
      console.log(`🎭 Using easing: ${easing} -> ${decelerationEasing}`);
    }

    timeline.to(speedControl, {
      speed: 0,
      duration: decelerationTime,
      ease: decelerationEasing,
      onStart: () => {
        isDecelerating = true;
        console.log(`🎭 🚀 DECELERATION STARTED for reel ${reelIndex} with easing: ${decelerationEasing} (duration: ${decelerationTime}s)`);
      },
      onUpdate: () => {
        // Log progress during deceleration for debugging (reduced logging)
        if (isDecelerating && Math.random() < 0.05) { // Only log 5% of updates to reduce spam
          console.log(`🎭 ⚡ Deceleration progress: speed=${speedControl.speed.toFixed(0)}`);
        }
      },
      onComplete: () => {
        console.log(`🎭 ✅ Deceleration completed for reel ${reelIndex} with ${decelerationEasing}`);
      }
    });

    // Main animation loop
    const startTime = performance.now();
    let lastTime = startTime;

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Check if animation should end
      if (currentTime - startTime > duration * 1000) {
        this.finalizeReelPosition(reelIndex, allSymbols, blurFilter);
        return;
      }

      // Move all symbols
      const movement = speedControl.speed * deltaTime;
      totalDistance += movement;

      allSymbols.forEach(sprite => {
        sprite.y += movement;

        // Symbol recycling - wrap around when going off screen
        // Add buffer to ensure symbols are fully off-screen before recycling
        const recycleThreshold = visibleHeight + symbolHeight * 2;

        if (sprite.y > recycleThreshold) {
          // Find the topmost symbol
          const topmostY = Math.min(...allSymbols.map(s => s.y));
          // Position above the topmost with consistent spacing (same as initial grid positioning)
          sprite.y = topmostY - symbolHeight;

          // Change to random symbol when recycling during spin
          if (!isDecelerating) {
            // Get available symbol IDs from our map
            const availableSymbolIds = Array.from(this.symbolIdToUrlMap.keys());
            if (availableSymbolIds.length > 0) {
              // Pick a random symbol ID and get its URL
              const randomSymbolId = availableSymbolIds[Math.floor(Math.random() * availableSymbolIds.length)];
              const symbolUrl = this.symbolIdToUrlMap.get(randomSymbolId)!;

              // Get a new sprite with the random symbol texture (async call)
              this.symbolPool.getSymbol(symbolUrl).then(newSymbol => {
                if (newSymbol && newSymbol.texture) {
                  sprite.texture = newSymbol.texture;
                  // Release the temporary sprite back to pool
                  this.symbolPool.releaseSymbol(newSymbol);
                }
              }).catch(err => {
                console.warn('Failed to get symbol during animation:', err);
              });
            }
          }
        }
      });

      // Continue animation
      requestAnimationFrame(animate);
    };

    // Start animation
    requestAnimationFrame(animate);

    this.activeAnimations.add(timeline);
  }

  /**
   * Finalize reel position after spinning
   */
  private finalizeReelPosition(reelIndex: number, allSymbols: PIXI.Sprite[], blurFilter: BlurFilter): void {
    const symbolHeight = this.gridConfig.symbolHeight + this.gridConfig.symbolPadding;

    // Mark reel as stopped
    this.spinningReels.delete(reelIndex);
    if (this.spinningReels.size === 0) {
      this.isSpinning = false;
    }

    // Remove blur
    gsap.to(blurFilter, {
      blur: 0,
      duration: 0.2,
      ease: "power2.out",
      onComplete: () => {
        allSymbols.forEach(sprite => {
          sprite.filters = [];
        });
      }
    });

    // Get the reel container
    const reelColumn = this.reelContainer.children.find(
      child => child.name === `reel_${reelIndex}`
    ) as PIXI.Container;

    if (reelColumn) {
      // TIMING FIX: First, find the best positioned symbols before cleanup
      const visibleSprites = allSymbols
        .filter(sprite => sprite.y >= -symbolHeight && sprite.y <= this.gridConfig.rows * symbolHeight)
        .sort((a, b) => a.y - b.y)
        .slice(0, this.gridConfig.rows);

      // GENTLE cleanup: Smoothly transition the visible symbols to final positions
      const finalSymbols: PIXI.Sprite[] = [];

      // Keep the best positioned symbols and gently snap them to exact grid positions
      for (let index = 0; index < this.gridConfig.rows; index++) {
        const targetY = index * symbolHeight + symbolHeight / 2;
        let bestSprite: PIXI.Sprite | null = null;
        let minDistance = Infinity;

        // Find the sprite closest to the target position
        for (const sprite of visibleSprites) {
          if (!sprite || finalSymbols.includes(sprite)) continue;
          const distance = Math.abs(sprite.y - targetY);
          if (distance < minDistance) {
            minDistance = distance;
            bestSprite = sprite;
          }
        }

        if (bestSprite) {
          // Smoothly animate to exact position instead of snapping
          gsap.to(bestSprite, {
            y: targetY,
            duration: 0.15,
            ease: "power2.out"
          });

          finalSymbols.push(bestSprite);
        }
      }

      // Remove extra symbols that aren't in final positions (gently)
      allSymbols.forEach(sprite => {
        if (!finalSymbols.includes(sprite)) {
          // Fade out and remove extra symbols
          gsap.to(sprite, {
            alpha: 0,
            duration: 0.1,
            onComplete: () => {
              if (sprite.parent) {
                sprite.parent.removeChild(sprite);
                this.symbolPool.releaseSymbol(sprite);
              }
            }
          });
        }
      });

      // Clean up extra symbols reference
      if (this.extraSymbols.has(reelIndex)) {
        this.extraSymbols.delete(reelIndex);
      }

      // Update symbolGrid with final symbols
      this.symbolGrid[reelIndex] = finalSymbols;
    }
  }


  /**
   * Stop a reel
   */
  async stopReel(reelIndex: number, position: number, duration: number): Promise<void> {
    console.log(`⏹️ Stopping reel ${reelIndex} at position ${position}`);

    // The reel is already being animated via spinReel
    // The animation will stop naturally when the duration expires
    // This method is called by GameEngine but our animation handles the stop internally

    // We just need to wait for the animation to complete
    return new Promise((resolve) => {
      // Check if reel is still spinning
      const checkInterval = setInterval(() => {
        if (!this.spinningReels.has(reelIndex)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      // Timeout after max duration
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, duration + 500);
    });
  }

  /**
   * Update symbol references without creating new sprites
   * Used after spin animation to sync game state
   */
  async updateSymbolReferences(symbols: any[][]): Promise<void> {
    console.log('📝 Updating symbol references for game state');
    // Just store the symbol data without creating new sprites
    // The sprites are already positioned by the animation
    this.currentSymbolData = symbols;
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

      // Pulse animation using standard scale as baseline
      const tween = gsap.to(sprite.scale, {
        x: this.standardSymbolScale * 1.2,
        y: this.standardSymbolScale * 1.2,
        duration: 0.3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          sprite.filters = [];
          // Reset to standard scale
          sprite.scale.set(this.standardSymbolScale);
        }
      });

      this.activeAnimations.add(tween);
    });
  }

  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    console.log('🧹 Clearing highlights');

    this.symbolGrid.forEach(col => {
      col.forEach(sprite => {
        if (sprite) {
          sprite.filters = [];
          // Reset scale to standard symbol size
          sprite.scale.set(this.standardSymbolScale);
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

  /**
   * Clear all symbols and reset the pool
   */
  clearAllSymbols(): void {
    console.log('🧹 Clearing all symbols and resetting pool');

    // Clear the grid first
    this.clearGrid();

    // Clear the symbol pool's texture cache
    this.symbolPool.clearTextureCache();

    // Reset available symbol IDs
    this.symbolPool.clearAvailableSymbols();
  }

  /**
   * Load game assets
   */
  async loadAssets(assets: GameAssets): Promise<void> {
    console.log('📦 Loading game assets');

    // Clear existing mappings
    this.symbolIdToUrlMap.clear();

    // Extract URLs from the symbols map and build ID to URL mapping
    const symbolUrls: string[] = [];
    for (const [id, urlOrTexture] of assets.symbols) {
      if (typeof urlOrTexture === 'string') {
        symbolUrls.push(urlOrTexture);
        this.symbolIdToUrlMap.set(id, urlOrTexture);
        console.log(`📦 Mapped symbol ID: ${id} to URL: ${urlOrTexture.substring(0, 50)}...`);
      }
    }

    // Preload all symbol textures
    if (symbolUrls.length > 0) {
      await this.symbolPool.preloadTextures(symbolUrls);
    }

    console.log(`✅ Loaded ${symbolUrls.length} symbol textures`);
  }

  /**
   * Update background image with positioning support
   */
  async updateBackground(url: string, adjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  }): Promise<void> {
    console.log('🖼️ Updating background with adjustments:', adjustments);

    // Remove existing background
    if (this.backgroundSprite) {
      if (this.backgroundSprite.parent) {
        this.backgroundContainer.removeChild(this.backgroundSprite);
      }
      // Only destroy if the sprite has a valid texture
      if (this.backgroundSprite.texture) {
        this.backgroundSprite.destroy();
      }
      this.backgroundSprite = null;
    }

    // Load new background
    const texture = await PIXI.Assets.load(url);
    this.backgroundSprite = new PIXI.Sprite(texture);

    // Apply positioning and scaling
    this.applyBackgroundAdjustments(adjustments);

    this.backgroundContainer.addChild(this.backgroundSprite);
  }

  /**
   * Apply background adjustments to existing background
   */
  applyBackgroundAdjustments(adjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  }): void {
    if (!this.backgroundSprite || !this.backgroundSprite.texture) return;

    const texture = this.backgroundSprite.texture;
    const screenWidth = this.app!.screen.width;
    const screenHeight = this.app!.screen.height;

    // Default values
    const position = adjustments?.position || { x: 0, y: 0 };
    const scaleMultiplier = (adjustments?.scale || 100) / 100;
    const fit = adjustments?.fit || 'cover';

    // Calculate base scale based on fit mode
    let baseScale: number;
    switch (fit) {
      case 'contain':
        baseScale = Math.min(screenWidth / texture.width, screenHeight / texture.height);
        break;
      case 'fill':
        this.backgroundSprite.width = screenWidth;
        this.backgroundSprite.height = screenHeight;
        baseScale = 1; // Already set width/height directly
        break;
      case 'scale-down':
        baseScale = Math.min(1, Math.min(screenWidth / texture.width, screenHeight / texture.height));
        break;
      case 'cover':
      default:
        baseScale = Math.max(screenWidth / texture.width, screenHeight / texture.height);
        break;
    }

    // Apply scale multiplier if not using fill mode
    if (fit !== 'fill') {
      this.backgroundSprite.scale.set(baseScale * scaleMultiplier);
    }

    // Set anchor and position
    this.backgroundSprite.anchor.set(0.5);

    // Apply position offset (percentage-based positioning)
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    // Increase multiplier for more noticeable positioning changes
    const offsetX = (position.x / 100) * screenWidth * 0.8; // Convert percentage to pixels
    const offsetY = (position.y / 100) * screenHeight * 0.8;

    this.backgroundSprite.x = centerX + offsetX;
    this.backgroundSprite.y = centerY + offsetY;

    console.log('🖼️ Background adjustments applied:', {
      fit,
      baseScale,
      finalScale: this.backgroundSprite.scale.x,
      position: { x: this.backgroundSprite.x, y: this.backgroundSprite.y },
      offset: { x: offsetX, y: offsetY }
    });
  }

  /**
   * Update frame overlay
   */
  async updateFrame(url: string, config?: FrameConfig): Promise<void> {
    console.log('🖼️ Updating frame');

    // Remove existing frame
    if (this.frameSprite) {
      this.frameContainer.removeChild(this.frameSprite);
      this.frameSprite.destroy();
    }

    // Load new frame
    const texture = await PIXI.Assets.load(url);
    this.frameSprite = new PIXI.Sprite(texture);

    // Use default config if none provided
    const frameConfig = config || {
      scale: 1.0,
      position: { x: 0, y: 0 },
      stretch: { x: 1.0, y: 1.0 }
    };

    // Apply configuration
    this.frameSprite.scale.set(frameConfig.scale);
    this.frameSprite.anchor.set(0.5);
    this.frameSprite.x = this.app!.screen.width / 2 + frameConfig.position.x;
    this.frameSprite.y = this.app!.screen.height / 2 + frameConfig.position.y;

    // Apply stretch
    this.frameSprite.scale.x *= frameConfig.stretch.x;
    this.frameSprite.scale.y *= frameConfig.stretch.y;

    this.frameContainer.addChild(this.frameSprite);
  }

  /**
   * Update logo with advanced positioning and interactivity
   */
  async updateLogo(url: string, position?: { x: number; y: number }, scale?: number): Promise<void> {
    console.log('🖼️ LOGO DEBUG - updateLogo called with:', {
      url: url?.substring(0, 50) + '...',
      position,
      scale,
      hasApp: !!this.app,
      hasLogoContainer: !!this.logoContainer
    });

    // Remove existing logo
    if (this.logoSprite) {
      this.logoContainer.removeChild(this.logoSprite);
      this.logoSprite.destroy();
    }

    // Load new logo
    const texture = await PIXI.Assets.load(url);

    // Validate texture before creating sprite
    if (!texture) {
      console.warn('Failed to load logo texture:', { url });
      return;
    }

    this.logoSprite = new PIXI.Sprite(texture);

    // Apply positioning and scaling
    this.logoSprite.anchor.set(0.5);

    // Handle CSS-style positioning that matches the InteractiveLogoPositioner
    if (position) {
      // Convert CSS-style positioning (relative to center) to PixiJS absolute positioning
      // CSS positioning: left: 50%, top: 50%, transform: translate(-50%, -50%) translate(x, y)
      // This means the position coordinates are offsets from the center
      const baseX = this.app!.screen.width * 0.5;   // 50% = center horizontally
      const baseY = this.app!.screen.height * 0.1;  // 10% = top offset (matches CSS top: '10%')

      // Apply the position offset from the CSS base position (same as CSS system)
      // Fine-tune positioning: move right (+0px) and down (+74px) to match CSS
      this.logoSprite.x = baseX + position.x + 0;
      this.logoSprite.y = baseY + position.y + 74;

      console.log('🎯 LOGO POSITION CONVERSION:', {
        cssPosition: position,
        cssBasePosition: { x: baseX, y: baseY },
        finalPixiPosition: { x: this.logoSprite.x, y: this.logoSprite.y }
      });
    } else {
      // Default logo position - matches CSS base position (left: 50%, top: 10%)
      // Fine-tune positioning: move right (+0px) and down (+74px) to match CSS
      this.logoSprite.x = this.app!.screen.width * 0.5 + 0;   // 50% = center horizontally, no adjustment
      this.logoSprite.y = this.app!.screen.height * 0.1 + 74;  // 10% = top offset, adjusted down
    }

    console.log('🎯 LOGO POSITION DEBUG:', {
      screenWidth: this.app!.screen.width,
      screenHeight: this.app!.screen.height,
      logoX: this.logoSprite.x,
      logoY: this.logoSprite.y,
      logoScale: scale || 0.8,
      providedPosition: position
    });

    // Apply fine-tuned scale to match CSS preview exactly
    // Base scale calculation for tier 1 slot game appearance - 27% smaller to match CSS
    const baseScale = Math.min(
      this.app!.screen.width / this.logoSprite.texture.width,
      this.app!.screen.height / this.logoSprite.texture.height
    ) * 0.3; // Much smaller base scale

    const finalScale = scale ? scale * 0.73 : baseScale * 0.73; // 27% smaller to match CSS
    this.logoSprite.scale.set(finalScale);

    console.log('🎯 LOGO SCALE DEBUG:', {
      inputScale: scale,
      baseScale: baseScale,
      finalScale: finalScale,
      reduction: '27% smaller to match CSS',
      calculation: `${baseScale} * 0.73 = ${finalScale}`
    });

    // Add logo to container first (essential for visibility)
    this.logoContainer.addChild(this.logoSprite);

    // Ensure logo container is at MAXIMUM z-index and visible - highest priority layer
    this.logoContainer.zIndex = 10000; // Extremely high to ensure it's always on top
    this.logoContainer.visible = true;
    this.logoContainer.alpha = 1;

    // Ensure logo sprite is also at high z-index within its container
    this.logoSprite.zIndex = 1000; // High within logo container

    // Force sort children to apply z-index
    this.app!.stage.sortableChildren = true;
    this.logoContainer.sortableChildren = true;

    // Make logo interactive for repositioning (optional - don't break if it fails)
    try {
      this.logoSprite.eventMode = 'static';
      this.logoSprite.cursor = 'pointer';

      // Add drag functionality
      let isDragging = false;
      let dragData: any = null;

      this.logoSprite.on('pointerdown', (event) => {
        isDragging = true;
        dragData = event.data;
        this.logoSprite!.alpha = 0.8; // Visual feedback
      });

      this.logoSprite.on('pointermove', (event) => {
        if (isDragging && dragData) {
          const newPosition = dragData.getLocalPosition(this.logoContainer);
          this.logoSprite!.x = newPosition.x;
          this.logoSprite!.y = newPosition.y;
        }
      });

      this.logoSprite.on('pointerup', () => {
        isDragging = false;
        dragData = null;
        this.logoSprite!.alpha = 1.0;

        // Log final position for saving
        console.log('🎯 Logo positioned at:', {
          x: this.logoSprite!.x,
          y: this.logoSprite!.y,
          scale: this.logoSprite!.scale.x
        });
      });
    } catch (error) {
      console.warn('Could not make logo interactive:', error);
      // Logo is still visible, just not interactive
    }

    console.log('✅ LOGO DEBUG - Logo sprite added to PixiJS canvas:', {
      logoSpriteExists: !!this.logoSprite,
      logoContainerChildren: this.logoContainer.children.length,
      logoSpriteVisible: this.logoSprite.visible,
      logoSpriteAlpha: this.logoSprite.alpha,
      logoSpriteScale: this.logoSprite.scale.x,
      logoSpritePosition: { x: this.logoSprite.x, y: this.logoSprite.y },
      logoContainerVisible: this.logoContainer.visible,
      logoContainerAlpha: this.logoContainer.alpha,
      logoContainerZIndex: this.logoContainer.zIndex,
      logoSpriteZIndex: this.logoSprite.zIndex,
      stageChildren: this.app!.stage.children.length
    });
  }

  /**
   * Get current logo position (for saving state)
   */
  getLogoPosition(): { x: number; y: number; scale: number } | null {
    if (this.logoSprite) {
      return {
        x: this.logoSprite.x,
        y: this.logoSprite.y,
        scale: this.logoSprite.scale.x
      };
    }
    return null;
  }

  /**
   * Set logo position programmatically
   */
  setLogoPosition(x: number, y: number, scale?: number): void {
    if (this.logoSprite) {
      // Convert CSS-style positioning (relative to center) to PixiJS absolute positioning
      const centerX = this.app!.screen.width * 0.5;
      const centerY = this.app!.screen.height * 0.5;

      // Apply the position offset from center (same as CSS system)
      this.logoSprite.x = centerX + x;
      this.logoSprite.y = centerY + y;

      if (scale !== undefined) {
        // Use scale directly for 1:1 matching with CSS preview
        this.logoSprite.scale.set(scale);
      }
      console.log('🎯 Logo position updated:', {
        cssPosition: { x, y },
        pixiPosition: { x: this.logoSprite.x, y: this.logoSprite.y },
        scale
      });
    }
  }

  /**
   * Update UI buttons
   */
  async updateUIButtons(buttons: any): Promise<void> {
    console.log('🖼️ Updating UI buttons');

    // Clear existing buttons
    this.uiButtonSprites.forEach((sprite, key) => {
      this.uiContainer.removeChild(sprite);
      sprite.destroy();
    });
    this.uiButtonSprites.clear();

    // If buttons is an object with individual button URLs
    if (buttons && typeof buttons === 'object') {
      const buttonLayout = buttons._layout || [];
      const buttonMetadata = buttons._metadata || {};

      // Default positions with safe margins to prevent cutoff
      const defaultPositions = {
        spinButton: { x: this.app!.screen.width * 0.85, y: this.app!.screen.height * 0.85 },
        autoplayButton: { x: this.app!.screen.width * 0.15, y: this.app!.screen.height * 0.85 },
        menuButton: { x: this.app!.screen.width * 0.15, y: this.app!.screen.height * 0.15 },
        soundButton: { x: this.app!.screen.width * 0.85, y: this.app!.screen.height * 0.15 },
        settingsButton: { x: this.app!.screen.width * 0.15, y: this.app!.screen.height * 0.25 }
      };

      for (const [buttonName, buttonData] of Object.entries(buttons)) {
        if (buttonName.startsWith('_')) continue; // Skip layout metadata

        if (buttonData && typeof buttonData === 'object' && (buttonData as any).normal) {
          try {
            const texture = await PIXI.Assets.load((buttonData as any).normal);
            const buttonSprite = new PIXI.Sprite(texture);

            buttonSprite.anchor.set(0.5);

            // Use layout position if available, otherwise use default
            const layoutInfo = buttonLayout.find((btn: any) => btn.name === buttonName);
            if (layoutInfo) {
              buttonSprite.x = layoutInfo.x;
              buttonSprite.y = this.app!.screen.height / 2; // Center vertically as baseline
              buttonSprite.scale.set(layoutInfo.scale || 1.0);
            } else {
              const defaultPosition = defaultPositions[buttonName as keyof typeof defaultPositions];
              if (defaultPosition) {
                buttonSprite.x = defaultPosition.x;
                buttonSprite.y = defaultPosition.y;
              }
            }

            // Apply metadata if available
            const metadata = buttonMetadata[buttonName];
            if (metadata) {
              // Apply any additional styling from metadata
              if (metadata.scale) buttonSprite.scale.set(metadata.scale);
            }

            // Make button interactive only if texture is valid
            if (buttonSprite.texture && buttonSprite.texture.source && buttonSprite.texture.source.width > 0) {
              buttonSprite.eventMode = 'static';
              buttonSprite.cursor = 'pointer';
            }

            this.uiContainer.addChild(buttonSprite);
            this.uiButtonSprites.set(buttonName, buttonSprite);
          } catch (error) {
            console.warn(`Failed to load button ${buttonName}:`, error);
          }
        }
      }
    }
  }

  /**
   * Handle window resize
   */
  resize(width: number, height: number): void {
    if (!this.app) return;

    console.log(`📐 Resizing to ${width}x${height}`);

    // Resize renderer
    this.app.renderer.resize(width, height);

    // Recalculate symbol sizes based on new dimensions
    this.calculateOptimalSymbolSize();

    // Re-center the grid using ratio-based positioning
    this.centerGridContainer();

    // Update background to maintain aspect ratio
    if (this.backgroundSprite) {
      const scale = Math.max(
        width / this.backgroundSprite.texture.width,
        height / this.backgroundSprite.texture.height
      );

      this.backgroundSprite.scale.set(scale);
      this.backgroundSprite.anchor.set(0.5);
      this.backgroundSprite.x = width / 2;
      this.backgroundSprite.y = height / 2;
    }

    // Update frame if exists
    if (this.frameSprite) {
      // Re-center frame
      this.frameSprite.x = width / 2;
      this.frameSprite.y = height / 2;
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
   * Set custom centering ratios for the grid
   * @param xRatio - Horizontal position ratio (0-1, where 0.5 is center)
   * @param yRatio - Vertical position ratio (0-1, where 0.5 is center)
   * @param deviceType - Optional: specify which device type to update
   */
  setCenteringRatio(xRatio: number, yRatio: number, deviceType?: 'desktop' | 'mobileLandscape' | 'mobilePortrait'): void {
    // Clamp values between 0 and 1
    xRatio = Math.max(0, Math.min(1, xRatio));
    yRatio = Math.max(0, Math.min(1, yRatio));

    if (deviceType) {
      this.centeringConfig[deviceType] = { x: xRatio, y: yRatio };
    } else {
      // Update current device type
      const currentType = !this.isMobile ? 'desktop' :
        this.orientation === 'landscape' ? 'mobileLandscape' :
          'mobilePortrait';
      this.centeringConfig[currentType] = { x: xRatio, y: yRatio };
    }

    // Re-center the grid with new ratios
    if (this.app) {
      this.centerGridContainer();
    }

    console.log(`📍 Centering ratio updated to (${xRatio}, ${yRatio})`);
  }

  // ===== Private Methods =====

  private generateRandomSymbolGrid(cols: number, rows: number): string[][] {
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

    // Define coverage ratios for different scenarios - Tier 1 slot game sizing
    let widthCoverageRatio = 0.8;  // Use 80% of screen width for professional look
    let heightCoverageRatio = 0.85; // Use 85% of screen height for maximum impact

    // Smart coverage adjustment: Reduce width coverage for wider grids to prevent clipping
    if (this.gridConfig.cols >= 5) {
      widthCoverageRatio = 0.7;  // 70% for 5+ columns to fit in container
    }
    if (this.gridConfig.cols >= 6) {
      widthCoverageRatio = 0.65; // 65% for 6+ columns to ensure full visibility
    }
    if (this.gridConfig.cols >= 7) {
      widthCoverageRatio = 0.6;  // 60% for 7+ columns for maximum grids
    }

    if (this.isMobile) {
      if (this.orientation === 'landscape') {
        widthCoverageRatio = Math.min(widthCoverageRatio, 0.75);  // Apply mobile constraint
        heightCoverageRatio = 0.8;  // Good height coverage in landscape
      } else {
        widthCoverageRatio = Math.min(widthCoverageRatio, 0.85);  // Apply mobile constraint
        heightCoverageRatio = 0.6;  // Leave space for UI controls in portrait
      }
    }

    // Calculate available space based on ratios
    const availableWidth = this.app.screen.width * widthCoverageRatio;
    const availableHeight = this.app.screen.height * heightCoverageRatio;

    // Account for padding between symbols
    const totalPaddingWidth = (this.gridConfig.cols - 1) * this.gridConfig.symbolPadding;
    const totalPaddingHeight = (this.gridConfig.rows - 1) * this.gridConfig.symbolPadding;

    // Calculate maximum symbol size that fits
    const maxSymbolWidth = (availableWidth - totalPaddingWidth) / this.gridConfig.cols;
    const maxSymbolHeight = (availableHeight - totalPaddingHeight) / this.gridConfig.rows;

    // Use the smaller dimension to maintain square symbols
    const optimalSize = Math.min(maxSymbolWidth, maxSymbolHeight);

    // Apply min/max constraints based on device - Tier 1 slot game sizing
    const minSize = this.isMobile ? 60 : 100;   // Larger minimum for better visibility
    const maxSize = this.isMobile ? 120 : 200;  // Much larger maximum for tier 1 appearance
    const constrainedSize = Math.max(minSize, Math.min(optimalSize, maxSize));

    // Round down to ensure we don't exceed available space
    this.gridConfig.symbolWidth = Math.floor(constrainedSize);
    this.gridConfig.symbolHeight = Math.floor(constrainedSize);

    // Only log if size actually changed
    if (oldWidth !== this.gridConfig.symbolWidth || oldHeight !== this.gridConfig.symbolHeight) {
      console.log(`Symbol size calculated: ${this.gridConfig.symbolWidth}x${this.gridConfig.symbolHeight} (${this.orientation}, mobile: ${this.isMobile})`);
      console.log(`Using coverage ratios - width: ${widthCoverageRatio}, height: ${heightCoverageRatio}`);
    }
  }

  /**
   * Calculate grid-specific vertical offset to match preview positioning
   * This ensures the game engine positions grids the same way as the preview components
   */
  private calculateGridSpecificVerticalOffset(): number {
    const reels = this.gridConfig.cols;
    const rows = this.gridConfig.rows;

    // Base offset - always shift up to account for the UI bar (negative = up)
    const baseOffset = -3; // shift everything up by 3% of container height

    // Grid-specific adjustments to match UnifiedGridPreview logic
    if (reels === 3 && rows === 3) {
      // Small 3x3 grid - needs less upward shift
      return baseOffset + 1; // less upward shift
    } else if (reels === 4 && rows === 3) {
      // 4x3 grid - standard small grid
      return baseOffset + 0.5;
    } else if (reels === 5 && rows === 3) {
      // Standard 5x3 grid - baseline
      return baseOffset;
    } else if (reels === 5 && rows === 4) {
      // Taller 5x4 grid - needs more upward shift
      return baseOffset - 0.5;
    } else if (reels >= 6 && rows <= 3) {
      // Wide but short grids
      return baseOffset - 0.5;
    } else if (reels >= 6 && rows >= 4) {
      // Large grids need to be moved up more to avoid UI overlap
      return baseOffset - 1;
    } else if (reels >= 7 || rows >= 5) {
      // Extra large grids need even more upward shift
      return baseOffset - 1.5;
    }

    return baseOffset;
  }

  private centerGridContainer(): void {
    const totalWidth = this.gridConfig.cols * this.gridConfig.symbolWidth +
      (this.gridConfig.cols - 1) * this.gridConfig.symbolPadding;
    const totalHeight = this.gridConfig.rows * this.gridConfig.symbolHeight +
      (this.gridConfig.rows - 1) * this.gridConfig.symbolPadding;

    // Add padding for the background
    const padding = 20;
    const totalWidthWithPadding = totalWidth + (padding * 2);
    const totalHeightWithPadding = totalHeight + (padding * 2);

    // Get centering ratios based on current device configuration
    const deviceType = !this.isMobile ? 'desktop' :
      this.orientation === 'landscape' ? 'mobileLandscape' :
        'mobilePortrait';

    const { x: horizontalRatio, y: verticalRatio } = this.centeringConfig[deviceType];

    // Apply grid-specific vertical offset to match preview positioning
    const gridSpecificOffset = this.calculateGridSpecificVerticalOffset();
    const adjustedVerticalRatio = verticalRatio + (gridSpecificOffset / 100); // Convert percentage to ratio

    // Calculate center positions based on ratios
    const centerX = this.app!.screen.width * horizontalRatio;
    const centerY = this.app!.screen.height * adjustedVerticalRatio;

    // Position grid container so its center (including padding) aligns with the calculated center point
    this.gridContainer.x = Math.round(centerX - (totalWidthWithPadding / 2));
    this.gridContainer.y = Math.round(centerY - (totalHeightWithPadding / 2));

    // Ensure grid doesn't go off-screen with proper margins
    const margin = 10;
    // Only apply margin constraints if it would push the grid off-center
    if (this.gridContainer.x < margin || this.gridContainer.x + totalWidthWithPadding > this.app!.screen.width - margin) {
      this.gridContainer.x = Math.max(margin, Math.min(this.gridContainer.x, this.app!.screen.width - totalWidthWithPadding - margin));
    }
    if (this.gridContainer.y < margin || this.gridContainer.y + totalHeightWithPadding > this.app!.screen.height - margin) {
      this.gridContainer.y = Math.max(margin, Math.min(this.gridContainer.y, this.app!.screen.height - totalHeightWithPadding - margin));
    }

    // reelContainer is now a child of gridContainer and positioned at (padding, padding) relative to it
    // This is handled in createReelMasks, so we don't need to set it here

    console.log(`🎯 Grid centered:
      - Device: ${deviceType}
      - Screen: ${this.app!.screen.width}x${this.app!.screen.height}
      - Grid size: ${totalWidth}x${totalHeight} (with padding: ${totalWidthWithPadding}x${totalHeightWithPadding})
      - Base ratios: (${horizontalRatio}, ${verticalRatio})
      - Grid offset: ${gridSpecificOffset}%
      - Adjusted ratios: (${horizontalRatio}, ${adjustedVerticalRatio.toFixed(3)})
      - Center point: (${centerX}, ${centerY})
      - Final position: (${this.gridContainer.x}, ${this.gridContainer.y})`);
  }

  private createReelMasks(): void {
    // Clear existing children
    this.gridContainer.removeChildren();

    // Calculate total grid size (symbols + gaps between them) - for positioning only
    const totalWidth = this.gridConfig.cols * this.gridConfig.symbolWidth + (this.gridConfig.cols - 1) * this.gridConfig.symbolPadding;
    const totalHeight = this.gridConfig.rows * this.gridConfig.symbolHeight + (this.gridConfig.rows - 1) * this.gridConfig.symbolPadding;

    // Add padding around the grid for positioning
    const padding = 20;

    // DISABLED: Grid background creation to prevent glass overlay effect
    // No background graphics added - symbols render directly on game background

    // Add reel container to grid container
    this.gridContainer.addChild(this.reelContainer);

    // Clear existing masks
    this.reelMasks = [];

    // Position reel container with padding offset within grid container
    this.reelContainer.x = padding;
    this.reelContainer.y = padding;

    // Create individual masks for each reel column for per-reel control
    if (this.maskingEnabled) {
      console.log(`🎭 Creating individual masks for ${this.gridConfig.cols} reels`);

      for (let col = 0; col < this.gridConfig.cols; col++) {
        const reelColumn = this.reelContainer.children.find(
          child => child.name === `reel_${col}`
        ) as PIXI.Container;

        if (reelColumn) {
          // Position the reel column correctly
          reelColumn.x = col * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding);
          reelColumn.y = 0;

          // Check if this reel should be visible (when enabled = true, reel is visible)
          const reelShouldBeVisible = this.perReelMaskingEnabled[col] === true;

          if (reelShouldBeVisible) {
            // Reel is enabled - create mask to clip symbols properly
            const reelMask = new PIXI.Graphics();
            reelMask.beginFill(0xffffff);

            // Create mask for single reel column
            reelMask.drawRect(0, 0, this.gridConfig.symbolWidth, totalHeight);
            reelMask.endFill();

            // Position mask relative to the reel column
            reelMask.x = padding + col * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding);
            reelMask.y = padding;

            // Apply mask to this specific reel column
            reelColumn.mask = reelMask;
            this.gridContainer.addChild(reelMask);
            this.reelMasks.push(reelMask);

            // Make reel column visible
            reelColumn.visible = true;

            // Handle debug visualization
            if (this.debugMasksVisible) {
              // Create debug outline for this reel
              const debugOutline = new PIXI.Graphics();
              debugOutline.lineStyle(2, 0x00FF00, 1); // Green outline for visible reels
              debugOutline.drawRect(0, 0, this.gridConfig.symbolWidth, totalHeight);
              debugOutline.x = padding + col * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding);
              debugOutline.y = padding;
              this.gridContainer.addChild(debugOutline);
              this.reelMasks.push(debugOutline); // Track debug outlines too
              console.log(`🎭 Debug outline added for visible reel ${col}`);
            }

            console.log(`🎭 Reel ${col} is VISIBLE with mask`);
          } else {
            // Reel is disabled - hide the entire reel column
            reelColumn.mask = null;
            reelColumn.visible = false; // Hide the reel completely

            // Handle debug visualization for hidden reels
            if (this.debugMasksVisible) {
              // Create debug outline to show where hidden reel would be
              const debugOutline = new PIXI.Graphics();
              debugOutline.lineStyle(2, 0xFF0000, 0.5); // Red dashed outline for hidden reels
              debugOutline.drawRect(0, 0, this.gridConfig.symbolWidth, totalHeight);
              debugOutline.x = padding + col * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding);
              debugOutline.y = padding;
              debugOutline.alpha = 0.3;
              this.gridContainer.addChild(debugOutline);
              this.reelMasks.push(debugOutline); // Track debug outlines too
              console.log(`🎭 Debug outline added for hidden reel ${col}`);
            }

            console.log(`🎭 Reel ${col} is HIDDEN`);
          }
        }
      }

      console.log(`🎭 Created ${this.reelMasks.length} individual reel masks`);
    } else {
      // No masking - remove all masks and make all reels visible
      for (let col = 0; col < this.gridConfig.cols; col++) {
        const reelColumn = this.reelContainer.children.find(
          child => child.name === `reel_${col}`
        ) as PIXI.Container;

        if (reelColumn) {
          // Position the reel column correctly
          reelColumn.x = col * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding);
          reelColumn.y = 0;
          reelColumn.mask = null;
          reelColumn.visible = true; // Ensure all reels are visible when masking is disabled
        }
      }
      console.log('🎭 No masking - all reels visible, symbols can overflow grid area');
    }
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
          if (width > 100 && height > 100 && width < 10000 && height < 10000) {
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

        // Validate new dimensions
        const validWidth = Math.max(100, Math.min(newWidth, 10000));
        const validHeight = Math.max(100, Math.min(newHeight, 10000));

        // Only resize if dimensions actually changed and are valid
        if ((validWidth !== this.lastSize.width || validHeight !== this.lastSize.height) &&
          validWidth > 100 && validHeight > 100) {
          console.log(`📐 Resizing renderer: ${this.lastSize.width}x${this.lastSize.height} → ${validWidth}x${validHeight}`);

          this.lastSize.width = validWidth;
          this.lastSize.height = validHeight;

          // Update app size
          this.app.renderer.resize(validWidth, validHeight);

          // Recalculate symbol sizes for new dimensions
          this.calculateOptimalSymbolSize();

          // Recenter the grid using ratio-based positioning
          this.centerGridContainer();

          // Recreate grid graphics with new sizes
          this.recreateGridGraphics();

          // Log the new state
          console.log(`📏 Grid recentered after resize`);
        }
      }
    }, 100); // 100ms debounce
  };

  private recreateGridGraphics(): void {
    // Clear grid container (which contains the background)
    this.gridContainer.removeChildren();

    // Find and remove old graphics from reel container (but keep reel containers)
    const oldGraphics = this.reelContainer.children.filter(child => {
      // Keep reel containers
      if (child.name?.startsWith('reel_')) return false;
      // Remove other graphics
      return child instanceof PIXI.Graphics;
    });
    oldGraphics.forEach(child => this.reelContainer.removeChild(child));

    // Recreate grid background and masks
    this.createReelMasks();

    // Update all symbol positions
    this.symbolGrid.forEach((col, colIndex) => {
      col.forEach((sprite, rowIndex) => {
        if (sprite) {
          // Symbols are positioned relative to their reel container
          const x = this.gridConfig.symbolWidth / 2;
          const y = rowIndex * (this.gridConfig.symbolHeight + this.gridConfig.symbolPadding) + this.gridConfig.symbolHeight / 2;

          sprite.x = x;
          sprite.y = y;

          // Update scale to standard
          sprite.scale.set(this.standardSymbolScale);
        }
      });
    });
  };

  /**
   * Perform freespin transition with background change
   */
  async performFreespinTransition(config: {
    direction: 'to-freespin' | 'to-regular';
    style: 'fade' | 'zoom' | 'dissolve';
    duration: number;
    regularBackgroundUrl?: string;
    freespinBackgroundUrl?: string;
  }): Promise<void> {
    console.log('🌟 Starting freespin transition:', config);

    const { direction, style, duration, regularBackgroundUrl, freespinBackgroundUrl } = config;

    // Determine target background URL
    const targetUrl = direction === 'to-freespin' ? freespinBackgroundUrl : regularBackgroundUrl;

    if (!targetUrl) {
      console.warn('No target background URL provided for transition');
      return;
    }

    // Load target background
    console.log('🌟 Loading target background:', targetUrl.substring(0, 50) + '...');
    const targetTexture = await PIXI.Assets.load(targetUrl);
    const targetBg = new PIXI.Sprite(targetTexture);

    // Position and scale target background to match current
    if (this.backgroundSprite) {
      targetBg.anchor.set(0.5);
      targetBg.x = this.backgroundSprite.x;
      targetBg.y = this.backgroundSprite.y;
      targetBg.scale.set(this.backgroundSprite.scale.x, this.backgroundSprite.scale.y);
    } else {
      // Default positioning if no current background
      const scale = Math.max(
        this.app!.screen.width / targetTexture.width,
        this.app!.screen.height / targetTexture.height
      );
      targetBg.scale.set(scale);
      targetBg.anchor.set(0.5);
      targetBg.x = this.app!.screen.width / 2;
      targetBg.y = this.app!.screen.height / 2;
    }

    console.log('🌟 Target background loaded successfully, size:', targetTexture.width + 'x' + targetTexture.height);

    // Perform transition based on style
    return new Promise<void>((resolve) => {
      if (style === 'fade') {
        this.executeTransitionFade(this.backgroundSprite, targetBg, duration, resolve);
      } else if (style === 'zoom') {
        this.executeTransitionZoom(this.backgroundSprite, targetBg, duration, resolve);
      } else if (style === 'dissolve') {
        this.executeTransitionDissolve(this.backgroundSprite, targetBg, duration, resolve);
      } else {
        // Default to fade
        this.executeTransitionFade(this.backgroundSprite, targetBg, duration, resolve);
      }
    });
  }

  /**
   * Execute fade transition
   */
  private executeTransitionFade(
    currentBg: PIXI.Sprite | null,
    targetBg: PIXI.Sprite,
    duration: number,
    resolve: () => void
  ): void {
    console.log('🌀 Starting fade transition');

    // Start target background invisible
    targetBg.alpha = 0;
    this.backgroundContainer.addChild(targetBg);
    this.backgroundContainer.setChildIndex(targetBg, this.backgroundContainer.children.length - 1);

    // Create fade timeline
    const timeline = gsap.timeline({
      onComplete: () => {
        console.log('🌀 Fade transition completed');
        if (currentBg && currentBg.parent) {
          this.backgroundContainer.removeChild(currentBg);
          currentBg.destroy();
        }
        this.backgroundSprite = targetBg;
        resolve();
      }
    });

    // Fade in new background
    timeline.to(targetBg, {
      alpha: 1,
      duration: duration,
      ease: "power2.inOut"
    }, 0);

    // Fade out current background
    if (currentBg) {
      timeline.to(currentBg, {
        alpha: 0,
        duration: duration,
        ease: "power2.inOut"
      }, 0);
    }

    this.activeAnimations.add(timeline);
  }

  /**
   * Execute dissolve transition  
   */
  private executeTransitionDissolve(
    currentBg: PIXI.Sprite | null,
    targetBg: PIXI.Sprite,
    duration: number,
    resolve: () => void
  ): void {
    console.log('🌀 Starting dissolve transition');

    // Ensure target background starts invisible
    targetBg.alpha = 0;

    // Add to container and ensure proper layering
    this.backgroundContainer.addChild(targetBg);
    this.backgroundContainer.setChildIndex(targetBg, this.backgroundContainer.children.length - 1);

    console.log('🌀 Target background added for dissolve');

    // Create enhanced dissolve timeline with better visual effect
    const timeline = gsap.timeline({
      onComplete: () => {
        console.log('🌀 Dissolve transition completed');
        if (currentBg && currentBg.parent) {
          this.backgroundContainer.removeChild(currentBg);
          currentBg.destroy();
        }
        this.backgroundSprite = targetBg;
        resolve();
      }
    });

    // Create enhanced step-wise dissolve effect with randomization
    const steps = 12; // More steps for smoother dissolve
    const stepDuration = duration / steps;

    for (let i = 0; i < steps; i++) {
      const stepProgress = i / steps;
      const targetAlpha = stepProgress;
      const currentAlpha = currentBg ? 1 - stepProgress : 1;

      // Add slight randomization to timing for organic feel
      const randomDelay = (Math.random() - 0.5) * 0.1;
      const stepTime = i * stepDuration + randomDelay;

      // Fade in target background step by step
      timeline.to(targetBg, {
        alpha: targetAlpha,
        duration: stepDuration * 1.5, // Slightly longer for smoother blend
        ease: "power1.inOut"
      }, stepTime);

      // Fade out current background step by step
      if (currentBg) {
        timeline.to(currentBg, {
          alpha: currentAlpha,
          duration: stepDuration * 1.5,
          ease: "power1.inOut"
        }, stepTime);
      }
    }

    this.activeAnimations.add(timeline);
  }

  /**
   * Get slam stop status for all reels
   */
  getSlamStopStatus(): { [reelIndex: number]: { isStopped: boolean } } {
    const status: { [reelIndex: number]: { isStopped: boolean } } = {};

    // Check each reel's spinning status
    for (let i = 0; i < this.gridConfig.cols; i++) {
      status[i] = {
        isStopped: !this.spinningReels.has(i)
      };
    }

    return status;
  }

  /**
   * Apply mask controls from Animation Studio
   */
  applyMaskControls(controls: {
    enabled: boolean;
    debugVisible: boolean;
    perReelEnabled: boolean[];
  }): void {
    console.log('🎭 Applying mask controls:', controls);
    console.log('🎭 Previous state:', {
      enabled: this.maskingEnabled,
      debugVisible: this.debugMasksVisible,
      perReelEnabled: this.perReelMaskingEnabled
    });

    this.maskingEnabled = controls.enabled;
    this.debugMasksVisible = controls.debugVisible;
    this.perReelMaskingEnabled = controls.perReelEnabled.slice(); // Copy array

    console.log('🎭 New state:', {
      enabled: this.maskingEnabled,
      debugVisible: this.debugMasksVisible,
      perReelEnabled: this.perReelMaskingEnabled
    });

    // Update masking immediately - this will recreate masks with new settings
    this.updateMasking();
  }

  /**
   * Update masking based on current controls
   */
  private updateMasking(): void {
    console.log('🎭 updateMasking called - current state:', {
      hasReelContainer: !!this.reelContainer,
      hasApp: !!this.app,
      maskingEnabled: this.maskingEnabled,
      symbolGridLength: this.symbolGrid.length,
      existingMasks: this.reelMasks.length
    });

    if (!this.reelContainer || !this.app) {
      console.log('🎭 Cannot update masking - renderer not ready');
      return;
    }

    // Clear existing masks
    this.reelMasks.forEach(mask => {
      if (mask.parent) {
        mask.parent.removeChild(mask);
      }
      mask.destroy();
    });
    this.reelMasks = [];
    console.log('🎭 Cleared existing masks');

    if (!this.maskingEnabled) {
      // Remove all masking
      this.reelContainer.mask = null;
      console.log('🎭 Masking disabled - reels visible without clipping');
      return;
    }

    // Only create masks if grid is already created
    if (this.symbolGrid.length === 0) {
      console.log('🎭 Grid not created yet - deferring mask creation');
      return;
    }

    // Create new masks
    console.log('🎭 Creating new masks...');
    this.createReelMasks();
    console.log('🎭 Masking enabled - reels clipped to visible area, created masks:', this.reelMasks.length);
  }

  /**
   * Apply animation controls from Animation Studio
   */
  applyAnimationControls(controls: {
    speed: number;
    blurIntensity: number;
    easing: string;
  }): void {
    console.log('🎬 Applying animation controls:', controls);

    // Store animation settings for future spins
    if (typeof window !== 'undefined') {
      (window as any).ANIMATION_SETTINGS = controls;
    }

    // Apply blur if spinning
    if (this.isSpinning) {
      this.symbolGrid.forEach(col => {
        col.forEach(sprite => {
          if (sprite && sprite.filters) {
            // Update blur intensity for active spins
            const blurFilter = sprite.filters.find(f => f.constructor.name === 'BlurFilter');
            if (blurFilter) {
              (blurFilter as any).blur = controls.blurIntensity;
            }
          }
        });
      });
    }
  }

  /**
   * Apply visual effects from Animation Studio
   */
  applyAnimationStudioEffects(effects: {
    spinBlur: boolean;
    glowEffects: boolean;
    screenShake: boolean;
  }): void {
    console.log('✨ Applying visual effects:', effects);

    // Store visual effects settings
    if (typeof window !== 'undefined') {
      (window as any).VISUAL_EFFECTS_SETTINGS = effects;
    }

    // Apply screen shake if enabled and spinning
    if (effects.screenShake && this.isSpinning) {
      const shakeAmount = 5;
      const originalX = this.gridContainer.x;
      const originalY = this.gridContainer.y;

      // Create shake animation
      const shakeAnimation = setInterval(() => {
        if (!this.isSpinning) {
          clearInterval(shakeAnimation);
          this.gridContainer.x = originalX;
          this.gridContainer.y = originalY;
          return;
        }

        this.gridContainer.x = originalX + (Math.random() - 0.5) * shakeAmount;
        this.gridContainer.y = originalY + (Math.random() - 0.5) * shakeAmount;
      }, 50);
    }
  }

  /**
   * Animation Studio Integration Methods
   */

  /**
   * Update animation settings from Animation Studio
   */
  updateAnimationSettings(settings: any): void {
    console.log('🎨 Renderer: Updating animation settings:', settings);

    // Update internal settings
    this.animationSettings = { ...this.animationSettings, ...settings };

    // Apply blur filter changes
    if (settings.blurIntensity !== undefined && this.blurFilter) {
      this.blurFilter.blur = settings.blurIntensity;
      console.log(`🎨 Blur intensity updated to: ${settings.blurIntensity}px`);
    }

    // Apply visual effects
    if (settings.visualEffects) {
      this.applyAnimationStudioEffects(settings.visualEffects);
    }

    console.log('🎨 Animation settings applied to renderer');
  }

  /**
   * Update mask settings from Animation Studio
   */
  updateMaskSettings(settings: any): void {
    console.log('🎨 Renderer: Updating mask settings:', settings);
    console.log('🎨 Current mask state:', {
      enabled: this.maskingEnabled,
      debugVisible: this.debugMasksVisible,
      perReelEnabled: this.perReelMaskingEnabled,
      reelMasksCount: this.reelMasks.length
    });

    if (settings.enabled !== undefined) {
      this.maskingEnabled = settings.enabled;
      console.log(`🎨 Masking enabled changed to: ${this.maskingEnabled}`);
      this.updateMasking();
    }

    if (settings.debugVisible !== undefined) {
      this.debugMasksVisible = settings.debugVisible;
      console.log(`🎨 Debug visibility changed to: ${this.debugMasksVisible}`);
      this.updateMaskDebugVisibility();
    }

    if (settings.perReelEnabled) {
      this.perReelMaskingEnabled = [...settings.perReelEnabled];
      console.log(`🎨 Per-reel masking changed to:`, this.perReelMaskingEnabled);
      this.updatePerReelMasking();
    }

    console.log('🎨 Mask settings applied to renderer');
  }

  /**
   * Apply visual effects based on settings
   */
  private applyVisualEffects(effects: any): void {
    // Apply glow effects
    if (effects.glowEffects !== undefined) {
      if (effects.glowEffects && this.glowFilter) {
        // Apply glow to winning symbols or all symbols
        this.reelContainer.filters = this.reelContainer.filters || [];
        if (!this.reelContainer.filters.includes(this.glowFilter)) {
          this.reelContainer.filters.push(this.glowFilter);
        }
        console.log('🎨 Glow effects enabled');
      } else {
        // Remove glow filter
        if (this.reelContainer.filters && this.glowFilter) {
          this.reelContainer.filters = this.reelContainer.filters.filter(f => f !== this.glowFilter);
        }
        console.log('🎨 Glow effects disabled');
      }
    }

    // Apply screen shake
    if (effects.screenShake !== undefined) {
      if (effects.screenShake) {
        this.startScreenShake(100, 2000); // 100ms intensity, 2s duration
        console.log('🎨 Screen shake enabled');
      } else {
        console.log('🎨 Screen shake disabled');
      }
    }

    // Blur effects are handled in spin animations automatically
    if (effects.spinBlur !== undefined) {
      console.log(`🎨 Spin blur ${effects.spinBlur ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Update masking visibility based on current settings
   */
  private updateMaskingVisibility(): void {
    this.reelMasks.forEach((mask, index) => {
      if (mask) {
        mask.visible = this.maskingEnabled && this.perReelMaskingEnabled[index];
      }
    });
  }

  /**
   * Update mask debug visibility
   */
  private updateMaskDebugVisibility(): void {
    console.log(`🎭 Updating mask debug visibility to: ${this.debugMasksVisible}, masks: ${this.reelMasks.length}`);

    // With the new system, debug visualization is handled in createReelMasks
    // So we need to recreate masks to apply debug changes
    if (this.maskingEnabled) {
      console.log('🎭 Recreating masks to apply debug visibility changes');
      this.createReelMasks();
    } else {
      console.log('🎭 Masking disabled - no debug visualization to update');
    }
  }

  /**
   * Update per-reel masking
   */
  private updatePerReelMasking(): void {
    console.log(`🎭 Updating per-reel masking:`, {
      maskingEnabled: this.maskingEnabled,
      perReelEnabled: this.perReelMaskingEnabled,
      masksCount: this.reelMasks.length
    });

    // If masking is disabled globally, don't do per-reel updates
    if (!this.maskingEnabled) {
      console.log('🎭 Global masking disabled - skipping per-reel updates');
      return;
    }

    // For the new individual mask system, we need to recreate masks
    // rather than just toggling visibility, because we create only masks for enabled reels
    console.log('🎭 Recreating masks with new per-reel settings');
    this.createReelMasks();
  }

  /**
   * Get current animation settings
   */
  getAnimationSettings(): any {
    return { ...this.animationSettings };
  }
}