import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { SymbolPool } from './SymbolPool';
import { ProfessionalSlotMachine } from './ProfessionalSlotMachine';

interface SlotConfig {
  reels: number;
  rows: number;
  symbolWidth: number;
  symbolHeight: number;
  symbolPadding: number;
}

interface Symbol {
  id: string;
  url: string;
  type: 'wild' | 'scatter' | 'high' | 'medium' | 'low';
}

/**
 * Professional Slot Scene Manager for Tier 1 Games
 * Handles all visual elements and animations
 */
export class SlotScene {
  private app: PIXI.Application;
  private symbolPool: SymbolPool;

  // Containers
  private stage: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  private gridBackgroundContainer: PIXI.Container;
  private reelContainer: PIXI.Container;
  private frameContainer: PIXI.Container;
  private uiContainer: PIXI.Container;

  // Current configuration
  private config: SlotConfig = {
    reels: 5,
    rows: 3,
    symbolWidth: 120,
    symbolHeight: 120,
    symbolPadding: 10
  };

  // Symbol grid
  private symbolGrid: (PIXI.Sprite | null)[][] = [];
  private symbols: Symbol[] = [];

  // Professional slot machine
  private slotMachine: ProfessionalSlotMachine | null = null;
  private symbolTextureMap: Map<string, PIXI.Texture> = new Map();

  // Assets
  private backgroundSprite: PIXI.Sprite | null = null;
  private frameSprite: PIXI.Sprite | null = null;

  // Grid adjustments
  private gridAdjustments?: { position?: { x: number; y: number }; scale?: number; stretch?: { x: number; y: number } };
  private showSymbolBackgrounds: boolean = true;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.symbolPool = new SymbolPool();

    // Create container hierarchy
    this.stage = app.stage;
    this.backgroundContainer = new PIXI.Container();
    this.gridBackgroundContainer = new PIXI.Container();
    this.reelContainer = new PIXI.Container();
    this.frameContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    // Add containers in correct order
    this.stage.addChild(this.backgroundContainer);
    this.stage.addChild(this.gridBackgroundContainer);
    this.stage.addChild(this.reelContainer);
    this.stage.addChild(this.frameContainer);
    this.stage.addChild(this.uiContainer);

    // Calculate initial symbol size with proper aspect ratio
    const availableWidth = app.screen.width * 0.8;
    const availableHeight = app.screen.height * 0.8;

    // Account for padding between symbols
    const totalPaddingWidth = (this.config.reels - 1) * 10;
    const totalPaddingHeight = (this.config.rows - 1) * 10;

    // Calculate maximum symbol size that fits within available space
    const maxSymbolWidth = (availableWidth - totalPaddingWidth) / this.config.reels;
    const maxSymbolHeight = (availableHeight - totalPaddingHeight) / this.config.rows;

    // Use the smaller dimension to maintain square symbols
    const optimalSize = Math.min(maxSymbolWidth, maxSymbolHeight);

    // Cap the maximum size
    const isFullscreen = document.fullscreenElement != null ||
      app.screen.width > window.screen.width * 0.9 ||
      app.screen.height > window.screen.height * 0.9;
    const maxAllowedSize = isFullscreen ? 250 : 150;
    const finalSize = Math.min(optimalSize, maxAllowedSize);

    this.config.symbolWidth = Math.floor(finalSize);
    this.config.symbolHeight = Math.floor(finalSize);
    this.config.symbolPadding = 10; // Fixed padding for consistent spacing

    // Don't create initial grid - wait for updateGrid to be called
    // This prevents legacy symbols from appearing on startup
    console.log('🎮 SlotScene initialized - waiting for grid configuration');

    // Center reel container initially
    this.centerReelContainer();

    // Enable interactivity
    this.stage.eventMode = 'static';
    this.stage.hitArea = app.screen;
  }

  /**
   * Update grid configuration with smooth transition
   */
  async updateGrid(reels: number, rows: number, animate: boolean = true): Promise<void> {
    console.log(`🔄 updateGrid called: ${reels}x${rows} (current: ${this.config.reels}x${this.config.rows})`);

    // Force update even if dimensions appear the same
    // This ensures proper cleanup and recreation

    const oldConfig = { ...this.config };
    this.config.reels = reels;
    this.config.rows = rows;

    // Calculate optimal symbol size based on available space with proper aspect ratio
    // Use 80% of available space to ensure proper margins
    const availableWidth = this.app.screen.width * 0.8;
    const availableHeight = this.app.screen.height * 0.8;

    // Account for padding between symbols
    const totalPaddingWidth = (reels - 1) * 10; // 10px padding between symbols
    const totalPaddingHeight = (rows - 1) * 10;

    // Calculate maximum symbol size that fits within available space
    const maxSymbolWidth = (availableWidth - totalPaddingWidth) / reels;
    const maxSymbolHeight = (availableHeight - totalPaddingHeight) / rows;

    // Use the smaller dimension to maintain square symbols
    const optimalSize = Math.min(maxSymbolWidth, maxSymbolHeight);

    // Cap the maximum size for desktop/mobile
    const isFullscreen = document.fullscreenElement != null ||
      this.app.screen.width > window.screen.width * 0.9 ||
      this.app.screen.height > window.screen.height * 0.9;
    const maxAllowedSize = isFullscreen ? 250 : 150;
    const finalSize = Math.min(optimalSize, maxAllowedSize);

    this.config.symbolWidth = Math.floor(finalSize);
    this.config.symbolHeight = Math.floor(finalSize);
    this.config.symbolPadding = 10; // Fixed padding for consistent spacing

    console.log(`📐 New symbol size: ${this.config.symbolWidth}x${this.config.symbolHeight}`);
    console.log(`📐 Grid dimensions: ${reels}x${rows}, Screen: ${this.app.screen.width}x${this.app.screen.height}`);

    if (animate && this.symbolGrid.length > 0) {
      // Only fade out if we have existing symbols
      await this.fadeOutSymbols();
    }

    // Clear old grid completely
    this.clearGrid();

    // Only create grid if we have symbols or are using placeholders
    // This prevents floating symbols when no symbols are available
    if (this.symbols.length > 0 || (this.config.reels !== 5 || this.config.rows !== 3)) {
      // Create new grid
      await this.createGrid();

      // Draw grid background
      this.drawGridBackground();

      // Center the new grid
      this.centerReelContainer();

      if (animate && this.symbolGrid.length > 0) {
        // Fade in new symbols
        await this.fadeInSymbols();
      }
    } else {
      console.log('⚠️ Skipping grid creation - no symbols available for professional slot');
    }

    console.log(`✅ Grid update complete: ${reels}x${rows}`);
  }

  /**
   * Update symbols with new set
   */
  async updateSymbols(symbols: Symbol[]): Promise<void> {
    console.log('🎨 Updating symbols:', symbols.length, symbols);
    console.log('🔍 Symbol details:', symbols.map(s => ({ id: s.id, type: s.type, url: s.url.substring(0, 50) + '...' })));
    this.symbols = symbols;

    // Preload all symbol textures first
    const urls = symbols.map(s => s.url);
    await this.symbolPool.preloadTextures(urls);
    console.log('✅ All symbol textures preloaded');

    // Update symbol texture map for professional slot
    if (this.slotMachine || (this.config.reels === 5 && this.config.rows === 3)) {
      console.log('🎰 Updating professional slot machine with new symbols');
      await this.updateSymbolTextureMap();
      // Recreate the slot machine with new symbols
      await this.initializeProfessionalSlot();
    } else {
      // For legacy grid, update symbols without recreating the entire grid
      console.log('📋 Updating legacy grid symbols');
      if (this.symbolGrid.length > 0) {
        // Update existing sprites with new symbols
        this.populateGrid();
      } else {
        // Grid doesn't exist yet, create it
        await this.createGrid();
        this.drawGridBackground();
        this.centerReelContainer();
      }
    }
  }

  /**
   * Set background image
   */
  async setBackground(url: string | null): Promise<void> {
    // Remove old background
    if (this.backgroundSprite) {
      this.backgroundContainer.removeChild(this.backgroundSprite);
      this.backgroundSprite.destroy();
      this.backgroundSprite = null;
    }

    if (!url) return;

    try {
      let texture: PIXI.Texture;

      // Handle blob URLs by converting to base64
      if (url.startsWith('blob:')) {
        console.log('🔄 Converting blob URL to base64 for PIXI');
        const response = await fetch(url);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        texture = await PIXI.Assets.load(base64);
      } else {
        texture = await PIXI.Assets.load(url);
      }

      this.backgroundSprite = new PIXI.Sprite(texture);

      // Scale to cover
      const scale = Math.max(
        this.app.screen.width / texture.width,
        this.app.screen.height / texture.height
      );
      this.backgroundSprite.scale.set(scale);

      // Center
      this.backgroundSprite.anchor.set(0.5);
      this.backgroundSprite.x = this.app.screen.width / 2;
      this.backgroundSprite.y = this.app.screen.height / 2;

      this.backgroundContainer.addChild(this.backgroundSprite);
    } catch (error) {
      console.warn('Failed to load background:', error);
    }
  }

  /**
   * Set frame overlay with adjustments
   */
  async setFrame(
    url: string | null,
    adjustments?: {
      scale?: number;
      position?: { x: number; y: number };
      stretch?: { x: number; y: number };
    }
  ): Promise<void> {
    // Remove old frame
    if (this.frameSprite) {
      this.frameContainer.removeChild(this.frameSprite);
      this.frameSprite.destroy();
      this.frameSprite = null;
    }

    if (!url) return;

    try {
      let texture: PIXI.Texture;

      // Handle blob URLs by converting to base64
      if (url.startsWith('blob:')) {
        console.log('🔄 Converting blob URL to base64 for PIXI (frame)');
        const response = await fetch(url);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        texture = await PIXI.Assets.load(base64);
      } else {
        texture = await PIXI.Assets.load(url);
      }

      this.frameSprite = new PIXI.Sprite(texture);

      // Get adjustment values
      const frameScale = adjustments?.scale || 100;
      const framePosition = adjustments?.position || { x: 0, y: 0 };
      const frameStretch = adjustments?.stretch || { x: 100, y: 100 };

      // Calculate grid dimensions including padding
      const gridWidth = this.config.reels * this.config.symbolWidth +
        (this.config.reels - 1) * this.config.symbolPadding;
      const gridHeight = this.config.rows * this.config.symbolHeight +
        (this.config.rows - 1) * this.config.symbolPadding;

      // Add extra padding for the frame to wrap around the grid
      const framePadding = 40; // Space between grid and frame edge
      const targetWidth = gridWidth + (framePadding * 2);
      const targetHeight = gridHeight + (framePadding * 2);

      // Calculate scale to match grid size with adjustments
      const baseScaleX = targetWidth / texture.width;
      const baseScaleY = targetHeight / texture.height;

      // Apply scale and stretch adjustments
      const finalScaleX = baseScaleX * (frameScale / 100) * (frameStretch.x / 100);
      const finalScaleY = baseScaleY * (frameScale / 100) * (frameStretch.y / 100);
      this.frameSprite.scale.set(finalScaleX, finalScaleY);

      // Get grid position (same calculation as centerReelContainer)
      const gridX = (this.app.screen.width - gridWidth) / 2;
      const gridY = (this.app.screen.height - gridHeight) / 2;
      const gridAdjustments = this.gridAdjustments?.position || { x: 0, y: 0 };
      const gridScale = this.gridAdjustments?.scale || 100;

      // Position frame to align with grid center, accounting for grid scale
      this.frameSprite.anchor.set(0.5);
      this.frameSprite.x = gridX + (gridWidth / 2) + gridAdjustments.x + framePosition.x;
      this.frameSprite.y = gridY + (gridHeight / 2) + gridAdjustments.y + framePosition.y;

      // Apply same scale as grid if grid is scaled
      const currentScaleX = this.frameSprite.scale.x;
      const currentScaleY = this.frameSprite.scale.y;
      this.frameSprite.scale.set(currentScaleX * (gridScale / 100), currentScaleY * (gridScale / 100));

      this.frameContainer.addChild(this.frameSprite);
    } catch (error) {
      console.warn('Failed to load frame:', error);
    }
  }

  /**
   * Trigger win animation
   */
  async playWinAnimation(positions: Array<{ reel: number, row: number }>): Promise<void> {
    const winSymbols = positions.map(pos => {
      return this.symbolGrid[pos.reel]?.[pos.row];
    }).filter(Boolean);

    // Highlight winning symbols
    winSymbols.forEach(sprite => {
      if (!sprite) return;

      // Add color filter for glow effect
      const colorMatrix = new PIXI.ColorMatrixFilter();
      colorMatrix.brightness(1.5, false);
      sprite.filters = [colorMatrix];

      // Pulse animation
      gsap.to(sprite.scale, {
        x: 1.2,
        y: 1.2,
        duration: 0.5,
        repeat: 3,
        yoyo: true,
        ease: "power2.inOut",
        onComplete: () => {
          sprite.filters = null;
          sprite.scale.set(1);
        }
      });
    });
  }

  /**
   * Resize handler
   */
  resize(width: number, height: number): void {
    console.log(`📐 Resizing PIXI app to ${width}x${height}`);
    this.app.renderer.resize(width, height);

    // Recalculate symbol sizes using the same logic as updateGrid
    const availableWidth = width * 0.8;
    const availableHeight = height * 0.8;

    // Account for padding between symbols
    const totalPaddingWidth = (this.config.reels - 1) * 10;
    const totalPaddingHeight = (this.config.rows - 1) * 10;

    // Calculate maximum symbol size that fits within available space
    const maxSymbolWidth = (availableWidth - totalPaddingWidth) / this.config.reels;
    const maxSymbolHeight = (availableHeight - totalPaddingHeight) / this.config.rows;

    // Use the smaller dimension to maintain square symbols
    const optimalSize = Math.min(maxSymbolWidth, maxSymbolHeight);

    // Cap the maximum size
    const isFullscreen = document.fullscreenElement != null ||
      width > window.screen.width * 0.9 ||
      height > window.screen.height * 0.9;
    const maxAllowedSize = isFullscreen ? 250 : 150;
    const finalSize = Math.min(optimalSize, maxAllowedSize);

    console.log(`🖥️ Fullscreen: ${isFullscreen}, Symbol size: ${finalSize}`);
    console.log(`📏 Screen: ${window.screen.width}x${window.screen.height}, Container: ${width}x${height}`);

    const oldSymbolWidth = this.config.symbolWidth;
    const oldSymbolHeight = this.config.symbolHeight;

    this.config.symbolWidth = Math.floor(finalSize);
    this.config.symbolHeight = Math.floor(finalSize);
    this.config.symbolPadding = 10;

    // If symbol size changed significantly, rebuild the grid
    if (Math.abs(oldSymbolWidth - this.config.symbolWidth) > 5 ||
      Math.abs(oldSymbolHeight - this.config.symbolHeight) > 5) {
      console.log(`🔄 Symbol size changed significantly, rebuilding grid`);

      // Only recreate if we have symbols
      if (this.symbols.length > 0 || (this.config.reels !== 5 || this.config.rows !== 3)) {
        // Clear and recreate grid with new sizes
        this.clearGrid();
        this.createGrid().then(() => {
          console.log('Grid recreated after resize');
        }).catch(console.error);
        this.drawGridBackground();

        // Reapply symbols if we have them
        if (this.symbols.length > 0) {
          this.populateGrid();
        }
      }
    }

    // Update background
    if (this.backgroundSprite && this.backgroundSprite.texture) {
      const scale = Math.max(
        width / this.backgroundSprite.texture.width,
        height / this.backgroundSprite.texture.height
      );
      this.backgroundSprite.scale.set(scale);
      this.backgroundSprite.x = width / 2;
      this.backgroundSprite.y = height / 2;
    }

    // Update frame
    if (this.frameSprite && this.frameSprite.texture) {
      const padding = 50;
      const maxWidth = width - padding;
      const maxHeight = height - padding;
      const scale = Math.min(
        maxWidth / this.frameSprite.texture.width,
        maxHeight / this.frameSprite.texture.height
      );
      this.frameSprite.scale.set(scale);
      this.frameSprite.x = width / 2;
      this.frameSprite.y = height / 2;
    }

    // Center reel container
    this.centerReelContainer();
  }

  /**
   * Create symbol grid
   */
  private async createGrid(): Promise<void> {
    console.log(`📊 Creating new grid: ${this.config.reels}x${this.config.rows}`);

    // Always clear any existing content first
    this.clearGrid();

    // Use professional slot machine ONLY for standard 5x3 configuration
    if (this.config.reels === 5 && this.config.rows === 3) {
      console.log('📱 Using professional slot machine for 5x3 grid');
      await this.initializeProfessionalSlot();
      return;
    }

    // For any other configuration, use legacy grid system
    console.log(`📋 Using legacy grid system for ${this.config.reels}x${this.config.rows} grid`);
    console.log(`🎨 Available symbols: ${this.symbols.length}`);

    // Ensure symbol textures are preloaded for legacy grid
    if (this.symbols.length > 0) {
      const urls = this.symbols.map(s => s.url);
      await this.symbolPool.preloadTextures(urls);
      console.log('✅ Symbol textures preloaded');
    }

    // Legacy grid creation for non-standard sizes
    this.symbolGrid = [];

    for (let reel = 0; reel < this.config.reels; reel++) {
      this.symbolGrid[reel] = [];

      for (let row = 0; row < this.config.rows; row++) {
        const sprite = this.createSymbolSprite(reel, row);
        if (sprite) {
          this.symbolGrid[reel][row] = sprite;
          this.reelContainer.addChild(sprite);

          // Ensure sprite starts with full opacity
          sprite.alpha = 1;
        }
      }
    }

    console.log(`✅ Legacy grid created with ${this.reelContainer.children.length} sprites`);
    console.log(`📐 Grid dimensions: ${this.config.symbolWidth}x${this.config.symbolHeight} per symbol`);

    // Ensure all symbols start visible for legacy grid
    this.symbolGrid.forEach(reel => {
      reel.forEach(sprite => {
        if (sprite) {
          sprite.visible = true;
          sprite.alpha = 1; // Start fully visible
        }
      });
    });
  }

  /**
   * Initialize professional slot machine
   */
  private async initializeProfessionalSlot(): Promise<void> {
    console.log('🎰 Initializing professional slot machine for 5x3 grid...');

    // Verify this is only for 5x3
    if (this.config.reels !== 5 || this.config.rows !== 3) {
      console.error(`❌ Professional slot machine only supports 5x3, got ${this.config.reels}x${this.config.rows}`);
      return;
    }

    // Clean up old slot machine if exists
    if (this.slotMachine) {
      console.log('🧹 Destroying existing professional slot machine');
      this.slotMachine.destroy();
      this.slotMachine = null;
    }

    // IMPORTANT: Clear any legacy grid symbols that might be floating around
    this.clearGrid();

    // Also clear the grid background to ensure no legacy visuals
    this.gridBackgroundContainer.removeChildren();

    // Create symbol texture map and wait for textures to load
    await this.updateSymbolTextureMap();

    // Verify we have textures before creating slot machine
    if (this.symbolTextureMap.size === 0) {
      console.error('❌ No textures loaded, cannot create slot machine');
      // Create fallback textures
      await this.createFallbackTextures();
    }

    console.log(`📋 Creating professional slot machine with ${this.symbolTextureMap.size} textures`);

    // Create professional slot machine
    this.slotMachine = new ProfessionalSlotMachine(
      this.app,
      this.reelContainer,
      this.symbolTextureMap
    );

    // Configure position - center the slot machine
    this.centerReelContainer();

    console.log(`🎯 Reel container positioned at: (${this.reelContainer.x}, ${this.reelContainer.y})`);
    console.log(`📐 App screen size: ${this.app.screen.width}x${this.app.screen.height}`);

    console.log('✅ Professional slot machine initialized for 5x3 grid');
  }

  /**
   * Update symbol texture map
   */
  private async updateSymbolTextureMap(): Promise<void> {
    console.log('📋 Updating symbol texture map with', this.symbols.length, 'symbols');
    // Clear existing map
    this.symbolTextureMap.clear();

    // If we have custom symbols from Step 4, use those
    if (this.symbols.length > 0) {
      // Map symbols to standard IDs for the mock reel strips
      const symbolMapping: Record<string, string> = {};

      // Find and map special symbols
      this.symbols.forEach(symbol => {
        if (symbol.type === 'wild' && !symbolMapping['WILD']) {
          symbolMapping['WILD'] = symbol.url;
        } else if (symbol.type === 'scatter' && !symbolMapping['SCATTER']) {
          symbolMapping['SCATTER'] = symbol.url;
        }
      });

      // Map high value symbols to A, K, Q
      const highSymbols = this.symbols.filter(s => s.type === 'high');
      if (highSymbols[0]) symbolMapping['A'] = highSymbols[0].url;
      if (highSymbols[1]) symbolMapping['K'] = highSymbols[1].url;
      if (highSymbols[2]) symbolMapping['Q'] = highSymbols[2].url;

      // Map medium symbols to J, 10
      const mediumSymbols = this.symbols.filter(s => s.type === 'medium');
      if (mediumSymbols[0]) symbolMapping['J'] = mediumSymbols[0].url;
      if (mediumSymbols[1]) symbolMapping['10'] = mediumSymbols[1].url;

      // Map low symbols to 9
      const lowSymbols = this.symbols.filter(s => s.type === 'low');
      if (lowSymbols[0]) symbolMapping['9'] = lowSymbols[0].url;

      // Create textures from mapped symbols and ensure they load
      const texturePromises: Promise<void>[] = [];
      Object.entries(symbolMapping).forEach(([id, url]) => {
        console.log(`  Mapping ${id} -> ${url.substring(0, 50)}...`);

        // Load texture asynchronously to ensure it's ready
        const loadPromise = (async () => {
          try {
            let texture: PIXI.Texture;

            // Handle base64 images or URLs uniformly with Assets.load
            if (url.startsWith('data:')) {
              console.log(`  🖼️ Loading base64 texture for ${id}`);
              // In v8, Assets.load handles data URLs naturally? Or might need explicit handling
              texture = await PIXI.Assets.load(url);
            } else {
              // Load from URL
              texture = await PIXI.Assets.load(url);
            }

            this.symbolTextureMap.set(id, texture);
            console.log(`  ✅ Loaded texture for ${id} (${texture.width}x${texture.height})`);
          } catch (err) {
            console.error(`  ❌ Failed to load texture for ${id}:`, err);
            // Use WHITE texture as fallback
            this.symbolTextureMap.set(id, PIXI.Texture.WHITE);
          }
        })();

        texturePromises.push(loadPromise);
      });

      // Wait for all textures to load
      await Promise.all(texturePromises);

      // Don't auto-fill missing symbols - let the professional slot machine handle what's available
      console.log(`  ℹ️ Mapped ${this.symbolTextureMap.size} symbols without auto-filling missing ones`);
    } else {
      // Use default symbols as fallback
      const defaultSymbols = {
        'WILD': '/assets/symbols/wild.png',
        'SCATTER': '/assets/symbols/scatter.png',
        'A': '/assets/symbols/high_1.png',
        'K': '/assets/symbols/high_2.png',
        'Q': '/assets/symbols/high_3.png',
        'J': '/assets/symbols/mid_1.png',
        '10': '/assets/symbols/mid_2.png',
        '9': '/assets/symbols/low_1.png'
      };

      const defaultPromises: Promise<void>[] = [];
      Object.entries(defaultSymbols).forEach(([id, path]) => {
        const loadPromise = PIXI.Assets.load(path).then(texture => {
          this.symbolTextureMap.set(id, texture);
          console.log(`  ✅ Loaded default texture for ${id}`);
        }).catch(() => {
          console.error(`  ❌ Failed to load default texture for ${id}`);
          this.symbolTextureMap.set(id, PIXI.Texture.WHITE);
        });
        defaultPromises.push(loadPromise);
      });

      await Promise.all(defaultPromises);
    }

    console.log('✅ Symbol texture map updated with', this.symbolTextureMap.size, 'entries');
  }

  /**
   * Create a symbol sprite at position
   */
  private createSymbolSprite(reel: number, row: number): PIXI.Sprite | null {
    // Check if we have symbols available
    if (this.symbols.length === 0) {
      console.log(`⚠️ No symbols available for grid position [${reel},${row}], creating placeholder`);
      return this.createPlaceholderSymbol(reel, row);
    }

    // Dev warning for single symbol configuration
    if (this.symbols.length === 1) {
      console.warn(`⚠️ Warning: Only 1 symbol available for grid population. This may indicate a misconfiguration.`);
    }

    const symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
    console.log(`🎲 Selected symbol for [${reel},${row}]: ${symbol.id} (${symbol.type})`);

    // Try to get sprite from pool with additional error handling
    let sprite: PIXI.Sprite | null = null;
    try {
      sprite = this.symbolPool.getSymbol(symbol.url);
    } catch (error) {
      console.error(`Exception while getting sprite from pool:`, error);
      sprite = null;
    }

    if (!sprite) {
      console.warn(`❌ Failed to get sprite from pool for symbol ${symbol.id} at [${reel},${row}], creating placeholder`);
      return this.createPlaceholderSymbol(reel, row);
    }

    // Additional validation that sprite is usable
    if (!sprite.scale || !sprite.anchor || sprite.destroyed) {
      console.error(`❌ Sprite returned from pool is invalid for symbol ${symbol.id} at [${reel},${row}]`);
      return this.createPlaceholderSymbol(reel, row);
    }

    // Position sprite - ensure proper centering
    const x = reel * (this.config.symbolWidth + this.config.symbolPadding) + this.config.symbolWidth / 2;
    const y = row * (this.config.symbolHeight + this.config.symbolPadding) + this.config.symbolHeight / 2;

    sprite.x = x;
    sprite.y = y;

    // Scale to fit the cell with very minimal padding
    const targetWidth = this.config.symbolWidth - 4;
    const targetHeight = this.config.symbolHeight - 4;

    // Wait for texture to load to get actual dimensions
    if (sprite.texture && sprite.texture.baseTexture.valid) {
      const scale = Math.min(
        targetWidth / sprite.texture.width,
        targetHeight / sprite.texture.height
      );
      sprite.scale.set(scale);
      console.log(`✅ Symbol sprite created at [${reel},${row}] with scale ${scale.toFixed(2)}`);
    } else {
      // Set initial conservative scale to prevent huge symbols
      const estimatedScale = Math.min(targetWidth / 200, targetHeight / 200);
      sprite.scale.set(estimatedScale);

      sprite.texture.baseTexture.once('loaded', () => {
        // Re-validate sprite before scaling
        if (!sprite || sprite.destroyed || !sprite.scale) {
          console.error('Sprite became invalid during texture load');
          return;
        }

        const scale = Math.min(
          targetWidth / sprite.texture.width,
          targetHeight / sprite.texture.height
        );
        // Animate scale change to prevent jarring transition
        gsap.to(sprite.scale, {
          x: scale,
          y: scale,
          duration: 0.2,
          ease: "power2.out"
        });
        console.log(`✅ Symbol texture loaded for [${reel},${row}], scaled to ${scale.toFixed(2)}`);
      });
    }

    return sprite;
  }

  /**
   * Create placeholder symbol
   */
  private createPlaceholderSymbol(reel: number, row: number): PIXI.Sprite {
    const graphics = new PIXI.Graphics();

    // Draw a subtle rounded rectangle background
    graphics.beginFill(0x2a2a3e, 0.3);
    graphics.lineStyle(1, 0x4a4a6e, 0.5);
    graphics.drawRoundedRect(0, 0, this.config.symbolWidth - 2, this.config.symbolHeight - 2, 10);
    graphics.endFill();

    // Calculate symbol number (1-6 repeating pattern)
    const symbolNumber = ((reel + row * this.config.reels) % 6) + 1;

    // Add text with the symbol number
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: Math.min(this.config.symbolWidth, this.config.symbolHeight) * 0.4,
      fill: 0x8888aa,
      align: 'center',
      fontWeight: 'bold'
    });

    const text = new PIXI.Text(`${symbolNumber}`, style);
    text.anchor.set(0.5);
    text.x = (this.config.symbolWidth - 2) / 2;
    text.y = (this.config.symbolHeight - 2) / 2;
    graphics.addChild(text);

    // Convert to texture
    const texture = this.app.renderer.generateTexture(graphics);
    const sprite = new PIXI.Sprite(texture);

    // Position - ensure proper centering
    const x = reel * (this.config.symbolWidth + this.config.symbolPadding) + this.config.symbolWidth / 2;
    const y = row * (this.config.symbolHeight + this.config.symbolPadding) + this.config.symbolHeight / 2;

    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;

    graphics.destroy();

    return sprite;
  }

  /**
   * Draw grid background
   */
  private drawGridBackground(): void {
    // Clear existing grid background
    this.gridBackgroundContainer.removeChildren();

    // Only draw if showSymbolBackgrounds is true
    if (!this.showSymbolBackgrounds) return;

    const graphics = new PIXI.Graphics();

    // Draw grid cells
    for (let reel = 0; reel < this.config.reels; reel++) {
      for (let row = 0; row < this.config.rows; row++) {
        const x = reel * (this.config.symbolWidth + this.config.symbolPadding);
        const y = row * (this.config.symbolHeight + this.config.symbolPadding);

        // Draw cell background
        graphics.beginFill(0x1a1a2e, 0.2);
        graphics.lineStyle(1, 0x2a2a4e, 0.3);
        graphics.drawRoundedRect(x, y, this.config.symbolWidth, this.config.symbolHeight, 8);
        graphics.endFill();
      }
    }

    this.gridBackgroundContainer.addChild(graphics);
  }

  /**
   * Set whether to show symbol backgrounds
   */
  setShowSymbolBackgrounds(show: boolean): void {
    this.showSymbolBackgrounds = show;
    this.drawGridBackground();
  }

  /**
   * Clear the grid
   */
  private clearGrid(): void {
    console.log('🧹 Clearing grid - removing all sprites');

    // Clean up professional slot machine if it exists
    if (this.slotMachine) {
      console.log('🎰 Destroying professional slot machine');
      this.slotMachine.destroy();
      this.slotMachine = null;
    }

    // Release all symbols back to pool first
    this.symbolPool.releaseAll();

    // Clear legacy grid symbols
    this.symbolGrid.forEach(reel => {
      reel.forEach(sprite => {
        if (sprite) {
          sprite.visible = false;
          sprite.parent?.removeChild(sprite);
          sprite.destroy();
        }
      });
    });

    // Remove ALL children from the reel container
    while (this.reelContainer.children.length > 0) {
      const child = this.reelContainer.getChildAt(0);
      this.reelContainer.removeChild(child);
      if (child instanceof PIXI.Sprite) {
        child.destroy();
      }
    }

    // Clear the symbol grid array completely
    this.symbolGrid = [];

    console.log('✅ Grid cleared - reel container children:', this.reelContainer.children.length);
  }

  /**
   * Populate grid with current symbols
   */
  private populateGrid(): void {
    if (this.symbols.length === 0) {
      console.warn('⚠️ No symbols available to populate grid');
      return;
    }

    // Dev warning for single symbol
    if (this.symbols.length === 1) {
      console.warn(`⚠️ Warning: Populating grid with only 1 symbol. Consider adding more symbols for variety.`);
    }

    console.log(`🎨 Populating grid with ${this.symbols.length} symbols`);

    this.symbolGrid.forEach((reel, reelIndex) => {
      reel.forEach((sprite, rowIndex) => {
        if (sprite && !sprite.destroyed) {
          // Update with random symbol
          const symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];

          // Get texture from PIXI cache (should be preloaded)
          try {
            sprite.texture = PIXI.Texture.from(symbol.url);
            sprite.visible = true;
            sprite.alpha = 1;
          } catch (error) {
            console.error(`Failed to load texture for symbol ${symbol.id}:`, error);
            // Use placeholder texture
            sprite.texture = PIXI.Texture.WHITE;
            sprite.tint = 0x666666;
          }

          // Update scale when texture changes
          const targetWidth = this.config.symbolWidth - 4;
          const targetHeight = this.config.symbolHeight - 4;

          if (sprite.texture && sprite.texture.baseTexture.valid) {
            const scale = Math.min(
              targetWidth / sprite.texture.width,
              targetHeight / sprite.texture.height
            );
            sprite.scale.set(scale);
          } else {
            // Set initial conservative scale to prevent huge symbols
            const estimatedScale = Math.min(targetWidth / 200, targetHeight / 200);
            sprite.scale.set(estimatedScale);

            sprite.texture.baseTexture.once('loaded', () => {
              // Re-validate sprite before scaling
              if (!sprite || sprite.destroyed || !sprite.scale) {
                console.error('Sprite became invalid during texture load in populateGrid');
                return;
              }

              const scale = Math.min(
                targetWidth / sprite.texture.width,
                targetHeight / sprite.texture.height
              );
              // Smoothly transition to correct scale
              gsap.to(sprite.scale, {
                x: scale,
                y: scale,
                duration: 0.2,
                ease: "power2.out"
              });
            });
          }

          // Re-center sprite position in case grid size changed
          const x = reelIndex * (this.config.symbolWidth + this.config.symbolPadding) + this.config.symbolWidth / 2;
          const y = rowIndex * (this.config.symbolHeight + this.config.symbolPadding) + this.config.symbolHeight / 2;
          sprite.x = x;
          sprite.y = y;
        } else if (!sprite) {
          console.warn(`No sprite at grid position [${reelIndex},${rowIndex}]`);
        }
      });
    });

    console.log('✅ Grid populated with symbols');
  }

  /**
   * Center the reel container with optional position offsets and scale
   */
  private centerReelContainer(): void {
    const totalWidth = this.config.reels * this.config.symbolWidth +
      (this.config.reels - 1) * this.config.symbolPadding;
    const totalHeight = this.config.rows * this.config.symbolHeight +
      (this.config.rows - 1) * this.config.symbolPadding;

    const x = (this.app.screen.width - totalWidth) / 2;
    const y = (this.app.screen.height - totalHeight) / 2;

    // Apply grid adjustments if they exist
    const gridPosition = this.gridAdjustments?.position || { x: 0, y: 0 };
    const gridScale = this.gridAdjustments?.scale || 100;
    const gridStretch = this.gridAdjustments?.stretch || { x: 100, y: 100 };

    // Calculate scale with stretch
    const scaleX = (gridScale / 100) * (gridStretch.x / 100);
    const scaleY = (gridScale / 100) * (gridStretch.y / 100);

    this.reelContainer.x = x + gridPosition.x;
    this.reelContainer.y = y + gridPosition.y;
    this.reelContainer.scale.set(scaleX, scaleY);

    // Also position and scale the grid background
    this.gridBackgroundContainer.x = x + gridPosition.x;
    this.gridBackgroundContainer.y = y + gridPosition.y;
    this.gridBackgroundContainer.scale.set(scaleX, scaleY);
  }

  /**
   * Set grid adjustments (position, scale, and stretch)
   */
  setGridAdjustments(adjustments: { position?: { x: number; y: number }; scale?: number; stretch?: { x: number; y: number } }): void {
    this.gridAdjustments = adjustments;
    this.centerReelContainer();
  }

  /**
   * Fade out symbols animation
   */
  private async fadeOutSymbols(): Promise<void> {
    const promises: Promise<void>[] = [];

    this.symbolGrid.forEach(reel => {
      reel.forEach(sprite => {
        if (sprite) {
          promises.push(new Promise(resolve => {
            gsap.to(sprite, {
              alpha: 0,
              duration: 0.3,
              onComplete: resolve
            });
          }));
        }
      });
    });

    await Promise.all(promises);
  }

  /**
   * Fade in symbols animation
   */
  private async fadeInSymbols(): Promise<void> {
    // For professional slot machine, skip fade in
    if (this.slotMachine) {
      console.log('🎰 Skipping fade in for professional slot machine');
      return;
    }

    const promises: Promise<void>[] = [];

    this.symbolGrid.forEach((reel, reelIndex) => {
      reel.forEach((sprite, rowIndex) => {
        if (sprite) {
          sprite.alpha = 0;
          sprite.visible = true; // Ensure sprite is visible
          // Store the intended scale before animation
          const targetScale = { x: sprite.scale.x, y: sprite.scale.y };
          promises.push(new Promise(resolve => {
            gsap.to(sprite, {
              alpha: 1,
              duration: 0.3,
              delay: (reelIndex * 0.05) + (rowIndex * 0.02),
              ease: "power2.out",
              onStart: () => {
                // Ensure scale is correct at start of animation
                sprite.scale.set(targetScale.x, targetScale.y);
              },
              onComplete: resolve
            });
          }));
        }
      });
    });

    if (promises.length === 0) {
      console.log('⚠️ No symbols to fade in');
    } else {
      console.log(`✨ Fading in ${promises.length} symbols`);
    }

    await Promise.all(promises);
  }

  /**
   * Spin the reels with animation
   */
  async spinReels(): Promise<void> {
    console.log('🎰 Starting reel spin animation...');

    // If we have a professional slot machine, use that
    if (this.slotMachine) {
      await this.slotMachine.spin();
      return;
    }

    // Otherwise use the legacy animation (fallback)
    // Store current symbols
    const currentSymbols = this.symbolGrid.map(reel =>
      reel.map(sprite => sprite?.texture || null)
    );

    // Animate each reel
    const spinPromises: Promise<void>[] = [];

    for (let reelIndex = 0; reelIndex < this.config.reels; reelIndex++) {
      spinPromises.push(this.spinReel(reelIndex));
    }

    // Wait for all reels to complete
    await Promise.all(spinPromises);

    console.log('✅ Reel spin animation complete');
  }

  /**
   * Spin a single reel
   */
  private async spinReel(reelIndex: number): Promise<void> {
    const reel = this.symbolGrid[reelIndex];
    if (!reel) return;

    // Stagger the start of each reel
    const startDelay = reelIndex * 0.1;

    // Blur effect during spin
    await gsap.to(reel, {
      duration: 0.2,
      delay: startDelay,
      onUpdate: () => {
        reel.forEach(sprite => {
          if (sprite) {
            sprite.filters = [new PIXI.filters.BlurFilter(5)];
          }
        });
      }
    });

    // Spin animation
    const spinDuration = 1.5 + (reelIndex * 0.2); // Each reel spins longer
    const spinCount = 3 + reelIndex; // More spins for later reels

    // Create spinning motion
    for (let spin = 0; spin < spinCount; spin++) {
      // Move symbols down
      for (let i = 0; i < reel.length; i++) {
        const sprite = reel[i];
        if (!sprite) continue;

        await gsap.to(sprite, {
          y: sprite.y + (this.config.symbolHeight + this.config.symbolPadding),
          duration: 0.1,
          ease: "none",
          onComplete: () => {
            // Reset position and change symbol
            if (this.symbols.length > 0) {
              const randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
              sprite.texture = PIXI.Texture.from(randomSymbol.url);
            }
            sprite.y -= (this.config.symbolHeight + this.config.symbolPadding) * reel.length;
          }
        });
      }
    }

    // Stop with bounce effect
    await gsap.to(reel, {
      duration: 0.3,
      ease: "back.out(1.5)",
      onUpdate: () => {
        reel.forEach(sprite => {
          if (sprite) {
            sprite.filters = [];
          }
        });
      }
    });

    // Final symbol assignment
    reel.forEach((sprite, rowIndex) => {
      if (sprite && this.symbols.length > 0) {
        const finalSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        sprite.texture = PIXI.Texture.from(finalSymbol.url);
      }
    });
  }

  /**
   * Create fallback textures when none are available
   */
  private async createFallbackTextures(): Promise<void> {
    console.log('🎨 Creating fallback textures...');

    const symbolIds = ['WILD', 'SCATTER', 'A', 'K', 'Q', 'J', '10', '9'];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500, 0x800080];

    symbolIds.forEach((id, index) => {
      // Create graphics off-screen
      const graphics = new PIXI.Graphics();
      graphics.beginFill(colors[index], 0.8);
      graphics.drawRoundedRect(0, 0, 100, 100, 10);
      graphics.endFill();

      // Add text
      const text = new PIXI.Text(id, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: 'bold'
      });
      text.anchor.set(0.5);
      text.x = 50;
      text.y = 50;
      graphics.addChild(text);

      // Generate texture without adding to stage
      const texture = this.app.renderer.generateTexture(graphics, {
        resolution: 2,
        scaleMode: PIXI.SCALE_MODES.LINEAR
      });

      this.symbolTextureMap.set(id, texture);

      // Destroy graphics and text to prevent them from appearing
      text.destroy();
      graphics.destroy(true);
    });

    console.log('✅ Fallback textures created (off-screen)');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearGrid();
    this.symbolPool.destroy();

    if (this.backgroundSprite) {
      this.backgroundSprite.destroy();
    }

    if (this.frameSprite) {
      this.frameSprite.destroy();
    }

    if (this.slotMachine) {
      this.slotMachine.destroy();
    }

    this.stage.removeChildren();
  }
}