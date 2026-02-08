/**
 * SlotEngine - Main engine class that orchestrates all slot functionality
 * This is the primary interface for the slot machine engine
 */

import { 
  GameConfig, 
  EngineState, 
  SpinResult, 
  TestConfig,
  SlotEngineEvents
} from '../types/types';
import { EventBus } from './EventBus';
import { SymbolPool } from '../modules/SymbolPool';
import { ReelManager } from '../modules/ReelManager';
import { WinEvaluator } from '../modules/WinEvaluator';
import { SpinManager } from '../modules/SpinManager';

export class SlotEngine {
  private eventBus: EventBus;
  private symbolPool: SymbolPool;
  private reelManager: ReelManager;
  private winEvaluator: WinEvaluator;
  private spinManager: SpinManager;
  private gameConfig: GameConfig;
  private debugMode: boolean = false;

  constructor(gameConfig: GameConfig, debugMode: boolean = false) {
    this.gameConfig = gameConfig;
    this.debugMode = debugMode;

    // Initialize core components
    this.eventBus = new EventBus(debugMode);
    this.symbolPool = new SymbolPool(gameConfig.symbols, debugMode);
    this.reelManager = new ReelManager(
      gameConfig.grid.reels,
      gameConfig.grid.rows,
      this.eventBus,
      gameConfig.animation,
      debugMode
    );
    this.winEvaluator = new WinEvaluator(
      gameConfig.symbols,
      gameConfig.paylines,
      debugMode
    );

    // Initialize engine state
    const initialState: EngineState = {
      isSpinning: false,
      reels: this.reelManager.getReelStates(),
      spinId: '',
      balance: 1000, // Default balance
      bet: 1
    };

    this.spinManager = new SpinManager(
      this.eventBus,
      this.symbolPool,
      this.reelManager,
      this.winEvaluator,
      initialState,
      { enabled: false },
      debugMode
    );

    if (this.debugMode) {
      console.log('🎰 SlotEngine: Initialized successfully');
      console.log('Config:', gameConfig);
    }
  }

  /**
   * Subscribe to engine events
   */
  on<K extends keyof SlotEngineEvents>(
    event: K,
    callback: (data: SlotEngineEvents[K]) => void
  ): () => void {
    return this.eventBus.on(event, callback);
  }

  /**
   * Subscribe to engine events (one-time)
   */
  once<K extends keyof SlotEngineEvents>(
    event: K,
    callback: (data: SlotEngineEvents[K]) => void
  ): void {
    this.eventBus.once(event, callback);
  }

  /**
   * Start a spin with the specified bet
   */
  async startSpin(bet: number = 1): Promise<string> {
    const validation = this.spinManager.canSpin(bet);
    if (!validation.canSpin) {
      throw new Error(`Cannot start spin: ${validation.reason}`);
    }

    if (this.debugMode) {
      console.log(`🎰 SlotEngine: Starting spin with bet ${bet}`);
    }

    return await this.spinManager.startSpin(bet);
  }

  /**
   * Stop the current spin
   */
  stopSpin(): void {
    if (this.debugMode) {
      console.log('🛑 SlotEngine: Stopping current spin');
    }
    this.spinManager.stopSpin();
  }

  /**
   * Get current engine state
   */
  getState(): EngineState {
    return this.spinManager.getState();
  }

  /**
   * Get last spin result
   */
  getLastResult(): SpinResult | undefined {
    return this.spinManager.getLastResult();
  }

  /**
   * Update game configuration
   */
  updateConfig(newConfig: Partial<GameConfig>): void {
    // Merge with existing config
    this.gameConfig = { ...this.gameConfig, ...newConfig };

    // Update individual components
    if (newConfig.symbols) {
      this.symbolPool.updateSymbols(newConfig.symbols);
      this.winEvaluator.updateConfiguration(newConfig.symbols, newConfig.paylines);
    }

    if (newConfig.animation) {
      this.reelManager.updateAnimationConfig(newConfig.animation);
    }

    if (this.debugMode) {
      console.log('🎰 SlotEngine: Configuration updated', newConfig);
    }
  }

  /**
   * Set player balance
   */
  setBalance(balance: number): void {
    this.spinManager.updateBalance(balance);
    
    if (this.debugMode) {
      console.log(`🎰 SlotEngine: Balance set to ${balance}`);
    }
  }

  /**
   * Get current balance
   */
  getBalance(): number {
    return this.getState().balance;
  }

  /**
   * Enable test mode with optional mock results
   */
  enableTestMode(config: TestConfig = { enabled: true }): void {
    this.spinManager.setTestConfig(config);
    
    if (this.debugMode) {
      console.log('🎰 SlotEngine: Test mode enabled', config);
    }
  }

  /**
   * Add a mock spin result for testing
   */
  addMockResult(result: SpinResult): void {
    this.spinManager.addMockResult(result);
    
    if (this.debugMode) {
      console.log('🎰 SlotEngine: Mock result added');
    }
  }

  /**
   * Create a quick test spin with guaranteed win
   */
  createTestWin(): SpinResult {
    const symbols = this.gameConfig.symbols.filter(s => s.type === 'regular');
    const winSymbol = symbols[0]?.id || 'high_1';
    
    const matrix = Array(this.gameConfig.grid.reels).fill(null).map(() => 
      Array(this.gameConfig.grid.rows).fill(winSymbol)
    );

    return {
      matrix,
      wins: [],
      totalWin: 100,
      isBonus: false
    };
  }

  /**
   * Simulate multiple spins for testing
   */
  async simulateSpins(count: number, bet: number = 1): Promise<SpinResult[]> {
    const results: SpinResult[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const spinId = await this.startSpin(bet);
        
        // Wait for spin to complete
        await new Promise<void>((resolve) => {
          this.once('spin:complete', () => resolve());
        });
        
        const result = this.getLastResult();
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error in simulation spin ${i + 1}:`, error);
        break;
      }
    }
    
    if (this.debugMode) {
      console.log(`🎰 SlotEngine: Simulated ${results.length} spins`);
    }
    
    return results;
  }

  /**
   * Get engine statistics and debug info
   */
  getDebugInfo(): Record<string, any> {
    return {
      config: this.gameConfig,
      state: this.getState(),
      statistics: this.spinManager.getStatistics(),
      eventListeners: this.eventBus.getListenerInfo(),
      symbolDistribution: this.symbolPool.getDistributionStats(),
      reelStates: this.reelManager.getReelStates()
    };
  }

  /**
   * Reset the engine to initial state
   */
  reset(): void {
    this.spinManager.reset();
    
    if (this.debugMode) {
      console.log('🧹 SlotEngine: Engine reset to initial state');
    }
  }

  /**
   * Cleanup and dispose of the engine
   */
  dispose(): void {
    this.reelManager.cleanup();
    this.eventBus.clear();
    
    if (this.debugMode) {
      console.log('🧹 SlotEngine: Engine disposed');
    }
  }

  /**
   * Check if engine is ready to accept spins
   */
  isReady(): boolean {
    const state = this.getState();
    return !state.isSpinning && state.balance > 0;
  }

  /**
   * Get current game configuration
   */
  getConfig(): GameConfig {
    return { ...this.gameConfig };
  }

  /**
   * Force trigger specific events (for testing UI)
   */
  triggerTestEvent(event: keyof SlotEngineEvents, data?: any): void {
    if (this.debugMode) {
      console.log(`🎰 SlotEngine: Triggering test event '${event}'`, data);
    }
    this.eventBus.emit(event, data);
  }
}