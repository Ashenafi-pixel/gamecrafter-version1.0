import { 
  IGameEngine, 
  GameState,
  SpinRequest,
  SpinResponse,
  EngineState
} from './core/interfaces';
import { IGameConfiguration } from './types/types';
import { StateManager } from './core/StateManager';
import { Renderer } from './rendering/Renderer';
import { AnimationManager } from './managers/AnimationManager';
import { AudioManager } from './managers/AudioManager';
import { AssetManager } from './managers/AssetManager';
import { RGSClient } from './rgs/RGSClient';

export class GameEngine {
  private state: EngineState = 'uninitialized';
  private config: IGameConfiguration | null = null;
  
  // Core components
  private stateManager: StateManager;
  private _renderer: Renderer;
  private animationManager: AnimationManager;
  private audioManager: AudioManager;
  private assetManager: AssetManager;
  private rgsClient: RGSClient;
  
  // Engine properties
  private container: HTMLElement | null = null;
  private isSpinning: boolean = false;
  private spinStopTimeouts: NodeJS.Timeout[] = [];
  private currentSpinPromise: Promise<void> | null = null;
  
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
  private maskSettings = {
    enabled: true,
    debugVisible: false,
    perReelEnabled: [true, true, true, true, true]
  };
  
  // Expose renderer for orientation changes
  get renderer(): Renderer {
    return this._renderer;
  }
  
  // Check if engine is ready for operations
  isReady(): boolean {
    return this.state === 'ready' && this.config !== null && this.config !== undefined;
  }
  
  // Get current configuration
  getConfig(): IGameConfiguration | null {
    return this.config;
  }
  
  constructor() {
    console.log('🎮 Creating Game Engine');
    
    // Initialize managers
    this.stateManager = new StateManager();
    this._renderer = new Renderer(document.createElement('div')); // Temporary
    this.animationManager = new AnimationManager();
    this.audioManager = new AudioManager();
    this.assetManager = new AssetManager();
    
    // RGS client will be initialized with config
    this.rgsClient = null as any;
    
    // Setup Animation Studio event listeners
    this.setupAnimationStudioListeners();
  }
  
  async initialize(config: IGameConfiguration, container: HTMLElement): Promise<void> {
    console.log('🚀 Initializing Game Engine with config:', config);
    console.log('🎮 GameEngine: Symbols in config:', config.symbols?.length || 0, config.symbols);
    
    try {
      this.state = 'initializing';
      this.config = config;
      this.container = container;
      
      console.log('Step 1: Initializing RGS client...');
      // Initialize RGS client with default values if not provided
      this.rgsClient = new RGSClient({
        endpoint: config.rgsEndpoint || 'mock://localhost',
        gameId: config.gameId || 'slot-game-001',
        playerId: config.playerId || 'demo-player'
      });
      
      console.log('Step 2: Connecting to RGS...');
      // Connect to RGS
      try {
        await this.rgsClient.connect();
        console.log('✅ RGS connected');
      } catch (rgsError) {
        console.warn('⚠️ RGS connection failed, continuing with offline mode:', rgsError);
        // Continue without RGS for now
      }
      
      console.log('Step 3: Initializing renderer...');
      // Initialize renderer
      const containerRect = container.getBoundingClientRect();
      console.log('🎮 Container dimensions:', {
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight,
        boundingRect: containerRect
      });
      
      // Use boundingClientRect dimensions as they're most reliable
      const renderWidth = containerRect.width || container.clientWidth || 800;
      const renderHeight = containerRect.height || container.clientHeight || 600;
      
      console.log(`🎮 Using render dimensions: ${renderWidth}x${renderHeight}`);
      
      this._renderer = new Renderer(container);
      await this._renderer.initialize({
        width: renderWidth,
        height: renderHeight,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        quality: config.graphics?.quality || 'high'
      });
      console.log('✅ Renderer initialized');
      
      console.log('Step 4: Initializing asset manager...');
      // Initialize asset manager
      await this.assetManager.initialize();
      console.log('✅ Asset manager initialized');
      
      console.log('Step 5: Initializing animation manager...');
      // Initialize animation manager
      await this.animationManager.initialize();
      console.log('✅ Animation manager initialized');
      
      console.log('Step 6: Initializing audio manager...');
      // Initialize audio manager
      await this.audioManager.initialize(config.audio);
      console.log('✅ Audio manager initialized');
      
      console.log('Step 7: Checking for initial symbols...');
      // Declare initialSymbols outside the if block
      let initialSymbols: number[][] = [];
      
      // Only load assets if symbols are provided
      if (config.symbols && config.symbols.length > 0) {
        console.log('Step 7a: Loading provided symbols...');
        await this.loadGameAssets();
        console.log('✅ Game assets loaded');
        
        console.log('Step 8: Creating initial grid...');
        // Create initial grid
        await this._renderer.createGrid(config.reels || 5, config.rows || 3);
        console.log('✅ Grid created');
        
        console.log('Step 9: Setting initial symbols...');
        // ENHANCED: Progressive symbol loading with aggressive timeout
        try {
          console.log('🔍 SYMBOL DEBUG: Generating initial symbols...');
          initialSymbols = this.generateInitialSymbols();
          console.log('🔍 SYMBOL DEBUG: Generated symbols:', initialSymbols.length, 'symbols');
          
          // Progressive loading with 5s timeout total
          console.log('🔍 SYMBOL DEBUG: Starting progressive symbol loading...');
          await Promise.race([
            this._renderer.setSymbols(initialSymbols),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('CRITICAL: Symbol loading timeout after 5s')), 5000)
            )
          ]);
          console.log('✅ Initial symbols set successfully');
        } catch (error) {
          console.error('⚠️ CRITICAL: Symbol setting failed, using fallback strategy:', error);
          console.log('🔄 Attempting fallback: empty grid with placeholder symbols');
          initialSymbols = [];
          
          // Fallback: Create minimal grid
          try {
            await this._renderer.createGrid(config.reels || 5, config.rows || 3);
            console.log('✅ Fallback grid created successfully');
          } catch (fallbackError) {
            console.error('❌ CRITICAL: Even fallback failed:', fallbackError);
          }
        }
        
        console.log('Step 10: Finalizing initialization...');
      } else {
        console.log('Step 7b: No symbols provided - creating empty grid...');
        // Just create empty grid without symbols
        await this._renderer.createGrid(config.reels || 5, config.rows || 3);
        console.log('✅ Empty grid created');
      }
      
      console.log('Step 10: Setting initial game state...');
      // Initialize state manager with proper game state
      const hasSymbols = config.symbols && config.symbols.length > 0;
      const currentSymbols = hasSymbols ? initialSymbols : [];
      this.stateManager.setState({
        config: config as any, // Will be properly typed later
        status: 'ready',
        currentSymbols: currentSymbols,
        reelPositions: Array(config.reels || 5).fill(0),
        isSpinning: false,
        currentSpinId: null,
        lastWin: null,
        totalWin: 0,
        consecutiveWins: 0,
        balance: 1000, // Default balance
        currentBet: 1,
        activeFeatures: [],
        freeSpinsRemaining: 0,
        currentMultiplier: 1
      });
      console.log('✅ Game state initialized');
      
      // If we have symbols but didn't set them yet (empty grid case), 
      // we'll wait for them to be provided via updateSymbols
      if (!hasSymbols) {
        console.log('🔲 No initial symbols - waiting for symbols to be provided');
      }
      
      this.state = 'ready';
      console.log('✅ Game Engine initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Game Engine:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      this.state = 'error';
      throw error;
    }
  }
  
  destroy(): void {
    console.log('🧹 Destroying Game Engine');
    
    this.state = 'destroying' as EngineState;
    
    try {
      // Stop any ongoing animations
      this.animationManager.stopAllAnimations();
      
      // Disconnect from RGS
      if (this.rgsClient?.isConnected()) {
        this.rgsClient.disconnect();
      }
      
      // Destroy all managers
      this._renderer.destroy();
      this.animationManager.destroy();
      this.audioManager.destroy();
      this.assetManager.destroy();
      this.stateManager.destroy();
      
      // Clear references
      this.config = null;
      this.container = null;
      
      this.state = 'destroyed' as EngineState;
      console.log('✅ Game Engine destroyed');
    } catch (error) {
      console.error('Error during engine destruction:', error);
    }
  }
  
  // Animation Studio Integration Methods
  private setupAnimationStudioListeners(): void {
    console.log('🎨 Setting up Animation Studio event listeners');
    
    // Listen for animation settings changes
    window.addEventListener('slotSpin', this.handleAnimationStudioSpin.bind(this));
    window.addEventListener('applyMaskControls', this.handleMaskControls.bind(this));
    window.addEventListener('animationSettingsChanged', this.handleAnimationSettings.bind(this));
  }
  
  private handleAnimationStudioSpin(event: CustomEvent): void {
    const { settings, source } = event.detail || {};
    if (settings && source === 'animation-studio-test') {
      console.log('🎨 Animation Studio test spin with settings:', settings);
      // Update current animation settings
      this.animationSettings = { ...this.animationSettings, ...settings };
      // Apply to renderer immediately
      this._renderer.updateAnimationSettings(this.animationSettings);
    }
  }
  
  private handleMaskControls(event: CustomEvent): void {
    const { controls } = event.detail || {};
    if (controls) {
      console.log('🎨 Applying mask controls:', controls);
      this.maskSettings = { ...this.maskSettings, ...controls };
      // Apply to renderer
      this._renderer.updateMaskSettings(this.maskSettings);
    }
  }
  
  private handleAnimationSettings(event: CustomEvent): void {
    const { settings } = event.detail || {};
    if (settings) {
      console.log('🎨 Updating animation settings:', settings);
      this.animationSettings = { ...this.animationSettings, ...settings };
      // Apply to renderer
      this._renderer.updateAnimationSettings(this.animationSettings);
    }
  }
  
  // Public method to update animation settings
  updateAnimationSettings(settings: any): void {
    this.animationSettings = { ...this.animationSettings, ...settings };
    this._renderer.updateAnimationSettings(this.animationSettings);
    console.log('🎨 Animation settings updated:', this.animationSettings);
  }
  
  async spin(bet: number, lines: number, forceWin?: boolean, easing?: string): Promise<SpinResponse> {
    if (this.state !== 'ready') {
      throw new Error(`Cannot spin in state: ${this.state}`);
    }
    
    if (this.isSpinning) {
      throw new Error('Spin already in progress');
    }
    
    // Use Animation Studio settings or fallback to parameters
    const finalEasing = easing || this.animationSettings.easing;
    const spinSpeed = this.animationSettings.speed;
    
    console.log(`🎰 Starting spin - Bet: ${bet}, Lines: ${lines}, ForceWin: ${forceWin || false}`);
    console.log(`🎨 Using Animation Studio settings - Speed: ${spinSpeed}x, Easing: ${finalEasing}, Blur: ${this.animationSettings.blurIntensity}px`);
    
    try {
      this.isSpinning = true;
      this.state = 'spinning';
      
      // Play spin start sound
      this.audioManager.playEffect('spin_start');
      
      // Start spin animations with Animation Studio settings
      const spinPromise = this.animateSpinStart(finalEasing, spinSpeed);
      
      // Generate mock spin result (with optional force win for Step 7)
      const spinResponse = forceWin 
        ? await this.generateForceWinResult(bet, lines)
        : await this.generateMockSpinResult(bet, lines);
      
      // Wait for minimum spin time
      await Promise.all([
        spinPromise,
        this.delay(this.config!.minSpinDuration || 1000)
      ]);
      
      // Stop reels with new symbols
      await this.animateSpinStop(spinResponse.symbols);
      
      // Update game state
      const currentBalance = this.stateManager.getState()?.balance || 1000;
      this.stateManager.setState({
        balance: currentBalance - bet + spinResponse.totalWin,
        currentBet: bet,
        lastWin: spinResponse.totalWin,
        totalBet: bet * lines,
        freeSpinsRemaining: 0,
        currentMultiplier: 1
      });
      
      // Handle wins
      if (spinResponse.wins.length > 0) {
        await this.handleWins(spinResponse.wins);
      }
      
      // Clean up any remaining timeouts
      this.spinStopTimeouts.forEach(timeout => clearTimeout(timeout));
      this.spinStopTimeouts = [];
      
      this.isSpinning = false;
      this.state = 'ready';
      
      console.log('✅ Spin complete');
      return spinResponse;
      
    } catch (error) {
      console.error('❌ Spin failed:', error);
      
      // Clean up timeouts on error too
      this.spinStopTimeouts.forEach(timeout => clearTimeout(timeout));
      this.spinStopTimeouts = [];
      
      this.isSpinning = false;
      this.state = 'error';
      throw error;
    }
  }

  /**
   * Generate mock spin result for testing
   */
  private async generateMockSpinResult(bet: number, lines: number): Promise<SpinResponse> {
    // Always use the current config's reels and rows
    const reels = this.config?.reels || 5;
    const rows = this.config?.rows || 3;
    
    console.log(`🎲 Generating mock spin for ${reels}x${rows} grid`);
    
    // Use the same symbols that were loaded
    const hasCustomSymbols = this.config?.symbols && this.config.symbols.length > 0;
    const symbols = hasCustomSymbols 
      ? this.config.symbols.map((s, idx) => s.id || `symbol_${idx}`)
      : [
          'wild', 'scatter',
          'high_1', 'high_2', 'high_3',
          'low_1', 'low_2', 'low_3'
        ];
    
    // Generate random symbols
    const resultSymbols: string[][] = [];
    for (let reel = 0; reel < reels; reel++) {
      const reelSymbols: string[] = [];
      for (let row = 0; row < rows; row++) {
        reelSymbols.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
      resultSymbols.push(reelSymbols);
    }
    
    // Simple win detection (3+ same symbols on a line)
    const wins: any[] = [];
    let totalWin = 0;
    
    // Check middle line for simplicity
    const middleRow = Math.floor(rows / 2);
    const firstSymbol = resultSymbols[0][middleRow];
    let matchCount = 1;
    
    for (let reel = 1; reel < reels; reel++) {
      if (resultSymbols[reel][middleRow] === firstSymbol || resultSymbols[reel][middleRow] === 'wild') {
        matchCount++;
      } else {
        break;
      }
    }
    
    if (matchCount >= 3) {
      const winAmount = bet * matchCount * 2; // Simple payout calculation
      wins.push({
        line: 0,
        symbol: firstSymbol,
        count: matchCount,
        amount: winAmount,
        positions: Array.from({ length: matchCount }, (_, i) => ({ reel: i, row: middleRow })),
        type: matchCount === 5 ? 'big' : 'normal'
      });
      totalWin += winAmount;
    }
    
    return {
      symbols: resultSymbols,
      wins,
      totalWin,
      features: {
        triggeredBonus: false,
        triggeredFreeSpins: false,
        freeSpinsAwarded: 0
      }
    };
  }
  
  /**
   * Generate a forced win result for Step 7 testing
   */
  private async generateForceWinResult(bet: number, lines: number): Promise<SpinResponse> {
    const reels = this.config?.reels || 5;
    const rows = this.config?.rows || 3;
    
    console.log(`🎰 Generating FORCED WIN for ${reels}x${rows} grid (Step 7)`);
    
    // Use configured symbols or defaults
    const hasCustomSymbols = this.config?.symbols && this.config.symbols.length > 0;
    const symbols = hasCustomSymbols 
      ? this.config.symbols.map((s, idx) => s.id || `symbol_${idx}`)
      : ['wild', 'scatter', 'high_1', 'high_2', 'high_3', 'low_1', 'low_2', 'low_3'];
    
    // Pick a random win type
    const winTypes = ['small', 'big', 'mega', 'jackpot'];
    const winType = winTypes[Math.floor(Math.random() * winTypes.length)];
    
    // Generate winning patterns based on type
    const resultSymbols: string[][] = [];
    const middleRow = Math.floor(rows / 2);
    let winSymbol = symbols[2]; // Use first high symbol
    let matchCount = 3;
    
    switch (winType) {
      case 'small':
        matchCount = 3;
        break;
      case 'big':
        matchCount = 4;
        break;
      case 'mega':
        matchCount = 5;
        winSymbol = symbols[0]; // Use wild
        break;
      case 'jackpot':
        matchCount = 5;
        winSymbol = symbols[1]; // Use scatter
        break;
    }
    
    // Create the winning grid
    for (let reel = 0; reel < reels; reel++) {
      const reelSymbols: string[] = [];
      for (let row = 0; row < rows; row++) {
        if (row === middleRow && reel < matchCount) {
          // Place winning symbols on middle row
          reelSymbols.push(winSymbol);
        } else {
          // Random symbols elsewhere
          reelSymbols.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
      }
      resultSymbols.push(reelSymbols);
    }
    
    // Calculate win amount based on type
    const multipliers = { small: 5, big: 25, mega: 100, jackpot: 500 };
    const winAmount = bet * multipliers[winType];
    
    const wins = [{
      line: 0,
      symbol: winSymbol,
      count: matchCount,
      amount: winAmount,
      positions: Array.from({ length: matchCount }, (_, i) => ({ reel: i, row: middleRow })),
      type: winType
    }];
    
    console.log(`🎉 Forced ${winType} win: ${matchCount}x ${winSymbol} = ${winAmount}`);
    
    return {
      symbols: resultSymbols,
      wins,
      totalWin: winAmount,
      features: {
        triggeredBonus: winType === 'jackpot',
        triggeredFreeSpins: winType === 'mega',
        freeSpinsAwarded: winType === 'mega' ? 10 : 0
      }
    };
  }
  
  
  async updateGrid(reels: number, rows: number): Promise<void> {
    console.log(`📊 Updating grid to ${reels}x${rows}`);
    console.log(`📊 Current config before update - reels: ${this.config?.reels}, rows: ${this.config?.rows}`);
    
    if (this.isSpinning) {
      throw new Error('Cannot update grid while spinning');
    }
    
    this.state = 'updating';
    
    try {
      // Update renderer grid
      await this._renderer.updateGridSize(reels, rows);
      
      // Update config
      if (this.config) {
        this.config.reels = reels;
        this.config.rows = rows;
        console.log(`📊 Updated config - reels: ${this.config.reels}, rows: ${this.config.rows}`);
      }
      
      // Only generate new symbols if we have symbols configured
      const hasSymbols = this.config?.symbols && this.config.symbols.length > 0;
      if (hasSymbols) {
        console.log('📊 Regenerating symbols for new grid size');
        const newSymbols = this.generateInitialSymbols();
        await this._renderer.setSymbols(newSymbols);
      } else {
        console.log('📊 No symbols configured - keeping empty grid');
        // Grid remains empty, waiting for symbols to be provided
      }
      
      this.state = 'ready';
      console.log('✅ Grid updated');
      
    } catch (error) {
      console.error('❌ Failed to update grid:', error);
      this.state = 'error';
      throw error;
    }
  }
  
  getState(): EngineState {
    return this.state;
  }
  
  getGameState(): GameState | null {
    try {
      return this.stateManager.getState();
    } catch (error) {
      console.error('Failed to get game state:', error);
      return null;
    }
  }
  
  getBalance(): number {
    const state = this.stateManager.getState();
    return state?.balance || 0;
  }
  
  async updateBackground(backgroundUrl: string, adjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  }): Promise<void> {
    console.log('🖼️ Updating background:', backgroundUrl, 'with adjustments:', adjustments);

    if (!this._renderer) {
      throw new Error('Renderer not initialized');
    }

    try {
      await this._renderer.updateBackground(backgroundUrl, adjustments);
      console.log('✅ Background updated');
    } catch (error) {
      console.error('❌ Failed to update background:', error);
      throw error;
    }
  }

  /**
   * Update background adjustments without changing the image
   */
  updateBackgroundAdjustments(adjustments: {
    position?: { x: number; y: number };
    scale?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  }): void {
    console.log('🖼️ Updating background adjustments:', adjustments);

    if (!this._renderer) {
      throw new Error('Renderer not initialized');
    }

    try {
      this._renderer.applyBackgroundAdjustments(adjustments);
      console.log('✅ Background adjustments updated');
    } catch (error) {
      console.error('❌ Failed to update background adjustments:', error);
      throw error;
    }
  }

  async updateFrame(frameUrl: string): Promise<void> {
    console.log('🖼️ Updating frame:', frameUrl);
    
    if (!this._renderer) {
      throw new Error('Renderer not initialized');
    }
    
    try {
      await this._renderer.updateFrame(frameUrl);
      console.log('✅ Frame updated');
    } catch (error) {
      console.error('❌ Failed to update frame:', error);
      throw error;
    }
  }

  async updateLogo(logoUrl: string, position?: { x: number; y: number }, scale?: number): Promise<void> {
    console.log('🖼️ Updating logo:', logoUrl);
    
    if (!this._renderer) {
      throw new Error('Renderer not initialized');
    }
    
    try {
      await this._renderer.updateLogo(logoUrl, position, scale);
      console.log('✅ Logo updated');
    } catch (error) {
      console.error('❌ Failed to update logo:', error);
      throw error;
    }
  }

  async updateUIButtons(buttons: any): Promise<void> {
    console.log('🖼️ Updating UI buttons:', buttons);
    
    if (!this._renderer) {
      throw new Error('Renderer not initialized');
    }
    
    try {
      await this._renderer.updateUIButtons(buttons);
      console.log('✅ UI buttons updated');
    } catch (error) {
      console.error('❌ Failed to update UI buttons:', error);
      throw error;
    }
  }
  
  async updateSymbols(symbols: any[], forceRefresh?: boolean): Promise<void> {
    console.log('🎨 Updating symbols:', symbols, 'forceRefresh:', forceRefresh);
    
    if (this.isSpinning) {
      if (forceRefresh) {
        console.log('🔄 Engine busy but forceRefresh requested - retrying in 200ms');
        setTimeout(() => {
          this.updateSymbols(symbols, forceRefresh);
        }, 200);
        return;
      } else {
        console.warn('⚠️ Ignoring symbol update - engine is busy');
        return;
      }
    }
    
    if (!this.config) {
      throw new Error('Engine not initialized - config is null');
    }
    
    try {
      // Set busy flag to prevent concurrent updates
      this.isSpinning = true;
      
      // Clear texture cache if forceRefresh is requested
      if (forceRefresh) {
        console.log('🔄 Force refresh requested - clearing texture cache');
        this._renderer.clearAllSymbols(); // This calls symbolPool.clearTextureCache()
      }
      
      // Update the config with new symbols first
      this.config.symbols = symbols;
      
      // Update asset manager with new symbols
      const assetDefinitions = symbols.map((symbol, index) => ({
        id: symbol.id || `symbol_${index}`,
        url: symbol.image,
        type: 'symbol' as const
      }));
      
      await this.assetManager.loadAssets(assetDefinitions);
      
      // Update URL map (not texture map) - renderer expects URLs
      const symbolUrlMap = new Map();
      assetDefinitions.forEach(def => {
        symbolUrlMap.set(def.id, def.url);
      });
      
      console.log('📦 About to call renderer.loadAssets...');
      // Update renderer with new URLs
      await this._renderer.loadAssets({
        symbols: symbolUrlMap,
        backgrounds: new Map(),
        frames: new Map(),
        effects: new Map()
      });
      console.log('✅ Renderer.loadAssets completed');
      
      // Place uploaded symbols on the grid
      console.log('🎲 Placing uploaded symbols on grid...');
      const gridSymbols = this.generateGridWithUploadedSymbols();
      if (gridSymbols.length > 0) {
        await this._renderer.setSymbols(gridSymbols);
        console.log('✅ Uploaded symbols placed on grid');
        
        // Add a small delay and check if symbols are still there
        setTimeout(() => {
          console.log('🔍 DELAYED CHECK: Checking symbol state after 100ms...');
          console.log('🔍 DELAYED CHECK: Grid container children:', this._renderer['gridContainer']?.children?.length || 'N/A');
          console.log('🔍 DELAYED CHECK: Reel container children:', this._renderer['reelContainer']?.children?.length || 'N/A');
        }, 100);
      } else {
        console.log('🔲 No symbols to place - grid remains empty');
      }
      
      console.log('✅ Symbols updated');
    } catch (error) {
      console.error('❌ Failed to update symbols:', error);
      throw error;
    } finally {
      // Clear busy flag
      this.isSpinning = false;
    }
  }
  
  quickSpin(): void {
    console.log('⚡ Quick spin requested');
    // TODO: Implement quick spin functionality
    // This would skip animations and show results immediately
  }
  
  startAutoPlay(): void {
    console.log('🔄 Starting autoplay');
    // TODO: Implement autoplay functionality
    // This would start automatic spinning
  }
  
  stopAutoPlay(): void {
    console.log('⏹️ Stopping autoplay');
    // TODO: Implement stop autoplay functionality
    // This would stop automatic spinning
  }

  /**
   * Check if slam stop is available for any reels
   */
  getSlamStopStatus(): { [reelIndex: number]: { canStop: boolean, isSpinning: boolean, isStopped: boolean } } {
    if (!this._renderer) {
      return {};
    }
    return this._renderer.getSlamStopStatus();
  }

  /**
   * Cancel pending normal spin stop timeouts for slam stopped reels
   */
  private cancelSpinStopTimeouts(): void {
    console.log('🧹 Canceling pending spin stop timeouts due to slam stop');
    this.spinStopTimeouts.forEach(timeout => clearTimeout(timeout));
    this.spinStopTimeouts = [];
  }

  /**
   * Slam stop a specific reel
   */
  async slamStopReel(reelIndex: number): Promise<boolean> {
    console.log(`🎯 Game Engine: Slam stop requested for reel ${reelIndex}`);
    
    if (!this._renderer) {
      console.warn('⚠️ No renderer available for slam stop');
      return false;
    }

    if (!this.isSpinning) {
      console.warn('⚠️ Cannot slam stop - not currently spinning');
      return false;
    }

    try {
      // Play slam stop sound effect
      this.audioManager.playEffect('slam_stop');
      
      // Execute slam stop on renderer
      const success = await this._renderer.slamStopReel(reelIndex);
      
      if (success) {
        console.log(`✅ Reel ${reelIndex} slam stopped successfully`);
        
        // If any reels were slam stopped, we should cancel the normal stop sequence
        // to avoid conflicts
        this.cancelSpinStopTimeouts();
      } else {
        console.warn(`⚠️ Slam stop failed for reel ${reelIndex}`);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Slam stop error for reel ${reelIndex}:`, error);
      return false;
    }
  }

  /**
   * Slam stop all available reels
   */
  async slamStopAll(): Promise<boolean[]> {
    console.log('🎯 Game Engine: Slam stop all reels requested');
    
    // Cancel normal stop sequence immediately when slam stop all is triggered
    this.cancelSpinStopTimeouts();
    
    const status = this.getSlamStopStatus();
    const results: boolean[] = [];
    
    // Slam stop each reel that can be stopped
    for (const reelIndex in status) {
      const reelNum = parseInt(reelIndex);
      if (status[reelNum].canStop) {
        // Don't cancel timeouts again in individual slam stop since we already did it
        try {
          this.audioManager.playEffect('slam_stop');
          const success = await this._renderer.slamStopReel(reelNum);
          results.push(success);
          
          if (success) {
            console.log(`✅ Reel ${reelNum} slam stopped successfully`);
          } else {
            console.warn(`⚠️ Slam stop failed for reel ${reelNum}`);
          }
        } catch (error) {
          console.error(`❌ Slam stop error for reel ${reelNum}:`, error);
          results.push(false);
        }
        
        // Small delay between slam stops for better visual effect
        await this.delay(50);
      }
    }
    
    return results;
  }
  
  
  // Private helper methods
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async loadGameAssets(): Promise<void> {
    console.log('📦 Loading game assets');
    
    // Use symbols from configuration if available
    const assetDefinitions = [];
    
    if (this.config?.symbols && this.config.symbols.length > 0) {
      // Use provided symbols ONLY - don't load defaults
      this.config.symbols.forEach((symbol, index) => {
        assetDefinitions.push({
          id: symbol.id || `symbol_${index}`,
          url: symbol.image,
          type: 'symbol' as const
        });
      });
      console.log(`📦 Loading ${assetDefinitions.length} custom symbols`);
    } else {
      // No symbols to load - empty grid
      console.log('📦 No symbols to load - grid will remain empty');
      return;
    }
    
    // Load assets
    await this.assetManager.loadAssets(assetDefinitions);
    
    // Create URL map for renderer - SymbolPool expects URLs, not textures
    const symbolUrlMap = new Map();
    assetDefinitions.forEach(def => {
      if (def.type === 'symbol') {
        symbolUrlMap.set(def.id, def.url);
      }
    });
    
    // Load assets into renderer
    await this._renderer.loadAssets({
      symbols: symbolUrlMap,
      backgrounds: new Map(),
      frames: new Map(),
      effects: new Map()
    });
    
    // Load audio assets - commented out for now due to missing sound files
    // await this.audioManager.preloadCommonSounds();
  }
  
  private generateInitialSymbols(): any[][] {
    const symbols = [];
    
    // Check if we have custom symbols loaded
    const hasCustomSymbols = this.config?.symbols && this.config.symbols.length > 0;
    
    if (!hasCustomSymbols) {
      // Return empty grid
      console.log('🔲 No symbols available - returning empty grid');
      return [];
    }
    
    // Use custom symbols
    const availableSymbols = this.config.symbols.map((s, idx) => s.id || `symbol_${idx}`);
    
    const reels = this.config?.reels || 5;
    const rows = this.config?.rows || 3;
    
    for (let reel = 0; reel < reels; reel++) {
      const reelSymbols = [];
      for (let row = 0; row < rows; row++) {
        const randomSymbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
        reelSymbols.push({
          id: randomSymbol,
          value: randomSymbol
        });
      }
      symbols.push(reelSymbols);
    }
    
    return symbols;
  }

  private generateGridWithUploadedSymbols(): any[][] {
    const symbols = [];
    
    // Check if we have custom symbols loaded
    const hasCustomSymbols = this.config?.symbols && this.config.symbols.length > 0;
    
    if (!hasCustomSymbols) {
      console.log('🔲 No uploaded symbols available - returning empty grid');
      return [];
    }
    
    // Use uploaded symbols to fill the grid
    const availableSymbols = this.config.symbols.map((s, idx) => s.id || `symbol_${idx}`);
    console.log(`🎲 Using ${availableSymbols.length} uploaded symbols: ${availableSymbols.join(', ')}`);
    
    const reels = this.config?.reels || 5;
    const rows = this.config?.rows || 3;
    
    for (let reel = 0; reel < reels; reel++) {
      const reelSymbols = [];
      for (let row = 0; row < rows; row++) {
        // Use uploaded symbols in order, cycling through them
        const symbolIndex = (reel * rows + row) % availableSymbols.length;
        const selectedSymbol = availableSymbols[symbolIndex];
        reelSymbols.push({
          id: selectedSymbol,
          value: selectedSymbol
        });
      }
      symbols.push(reelSymbols);
    }
    
    console.log(`🎲 Generated ${reels}x${rows} grid with uploaded symbols`);
    return symbols;
  }
  
  private async animateSpinStart(easing?: string, speed?: number): Promise<void> {
    const reels = this.config?.reels || 5;
    const baseSpinDuration = 1000;
    const speedMultiplier = speed || this.animationSettings.speed;
    
    // Apply speed: higher speed = shorter duration
    const spinDuration = baseSpinDuration / speedMultiplier;
    const staggerDelay = 100 / speedMultiplier;
    
    console.log(`🎰 animateSpinStart: Starting spin animation for ${reels} reels with speed: ${speedMultiplier}x, duration: ${spinDuration}ms, easing: ${easing || 'default'}`);
    
    const promises = [];
    for (let i = 0; i < reels; i++) {
      const promise = new Promise<void>(resolve => {
        setTimeout(async () => {
          await this._renderer.spinReel(i, spinDuration, undefined, easing);
          resolve();
        }, i * staggerDelay);
      });
      promises.push(promise);
    }
    
    await Promise.all(promises);
  }
  
  private async animateSpinStop(newSymbols: string[][]): Promise<void> {
    const reels = this.config?.reels || 5;
    const stopDuration = 500;
    const staggerDelay = 300; // 300ms between reel stops for dramatic effect
    
    // Convert string symbols to symbol objects
    const symbolObjects = newSymbols.map(reel => 
      reel.map(symbol => ({
        id: symbol,
        value: symbol
      }))
    );
    
    // DON'T update symbols immediately - let the animation run first
    // await this._renderer.setSymbols(symbolObjects);
    
    // Animate reel stops
    const promises = [];
    this.spinStopTimeouts = []; // Clear previous timeouts
    
    for (let i = 0; i < reels; i++) {
      const promise = new Promise<void>(resolve => {
        const timeout = setTimeout(async () => {
          // Check if this reel was already slam stopped
          const slamStatus = this._renderer.getSlamStopStatus();
          if (slamStatus[i]?.isStopped) {
            console.log(`🎯 Skipping normal stop for reel ${i} - already slam stopped`);
            resolve();
            return;
          }
          
          await this._renderer.stopReel(i, 0, stopDuration);
          this.audioManager.playEffect('reel_stop', { volume: 0.5 });
          resolve();
        }, i * staggerDelay);
        
        this.spinStopTimeouts.push(timeout);
      });
      promises.push(promise);
    }
    
    await Promise.all(promises);
    
    // The animation has already positioned the symbols correctly
    // No need to call setSymbols again - it would create duplicates
    console.log('✅ Reels stopped - symbols already in place from animation');
    
    // Store the new symbols for game state (but don't set them on display)
    await this._renderer.updateSymbolReferences(symbolObjects);
  }
  

  private async handleWins(wins: any[]): Promise<void> {
    console.log(`💰 Handling ${wins.length} wins`);
    
    // Determine win size
    const totalWin = wins.reduce((sum, win) => sum + win.amount, 0);
    const betAmount = this.stateManager.getState()?.currentBet || 1;
    const winRatio = totalWin / betAmount;
    
    let winSound = 'win_small';
    let winType = 'small';
    
    if (winRatio >= 100) {
      winSound = 'win_jackpot';
      winType = 'jackpot';
    } else if (winRatio >= 50) {
      winSound = 'win_mega';
      winType = 'mega';
    } else if (winRatio >= 10) {
      winSound = 'win_big';
      winType = 'big';
    }
    
    // Play win sound
    this.audioManager.playEffect(winSound);
    
    // Trigger win celebration animation
    if (this.animationManager.triggerWinCelebration) {
      const firstWin = wins[0];
      await this.animationManager.triggerWinCelebration(winType, firstWin.positions);
    }
    
    // Highlight winning positions
    for (const win of wins) {
      await this._renderer.highlightWin(win.positions, win.type);
      
      // Play win animation
      const targets = win.positions.map((pos: any) => {
        // Get display objects from renderer (would need to expose this)
        return null; // Placeholder
      }).filter(Boolean);
      
      if (targets.length > 0) {
        await this.animationManager.playWinAnimation(targets, {
          type: 'win',
          duration: 2000,
          ease: 'elastic.out',
          scale: { factor: 1.2, duration: 0.5, repeat: 2 },
          glow: {
            color: 0xFFD700,
            distance: 15,
            outerStrength: 2,
            innerStrength: 1,
            quality: 0.5
          },
          autoClear: true
        });
      }
    }
    
    // Wait for animations
    await this.delay(winType === 'jackpot' ? 5000 : winType === 'mega' ? 3500 : winType === 'big' ? 2500 : 2000);
    
    // Clear highlights
    this._renderer.clearHighlights();
  }
  
  private async handleBonusFeature(features: any): Promise<void> {
    console.log('🎁 Handling bonus feature:', features);
    
    // Play bonus sound
    this.audioManager.playEffect('bonus_triggered');
    
    // TODO: Implement bonus feature handling
    // This would trigger bonus games, free spins, etc.
  }
}