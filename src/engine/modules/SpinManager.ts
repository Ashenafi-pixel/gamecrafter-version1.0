/**
 * SpinManager - Orchestrates the entire spin process
 * Coordinates between SymbolPool, ReelManager, and WinEvaluator
 */

import { SpinResult, EngineState, TestConfig } from '../types/types';
import { EventBus } from '../core/EventBus';
import { SymbolPool } from './SymbolPool';
import { ReelManager } from './ReelManager';
import { WinEvaluator } from './WinEvaluator';

export class SpinManager {
  private eventBus: EventBus;
  private symbolPool: SymbolPool;
  private reelManager: ReelManager;
  private winEvaluator: WinEvaluator;
  private currentState: EngineState;
  private testConfig: TestConfig;
  private debugMode: boolean = false;

  constructor(
    eventBus: EventBus,
    symbolPool: SymbolPool,
    reelManager: ReelManager,
    winEvaluator: WinEvaluator,
    initialState: EngineState,
    testConfig: TestConfig = { enabled: false },
    debugMode: boolean = false
  ) {
    this.eventBus = eventBus;
    this.symbolPool = symbolPool;
    this.reelManager = reelManager;
    this.winEvaluator = winEvaluator;
    this.currentState = initialState;
    this.testConfig = testConfig;
    this.debugMode = debugMode;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for spin coordination
   */
  private setupEventListeners(): void {
    // Listen for spin completion from ReelManager
    this.eventBus.on('spin:complete', (data: any) => {
      this.handleSpinComplete(data.result, data.spinId);
    });

    if (this.debugMode) {
      console.log('🎰 SpinManager: Event listeners setup complete');
    }
  }

  /**
   * Start a new spin
   */
  async startSpin(bet: number): Promise<string> {
    if (this.currentState.isSpinning) {
      throw new Error('Cannot start spin: Already spinning');
    }

    if (bet > this.currentState.balance) {
      throw new Error('Cannot start spin: Insufficient balance');
    }

    const spinId = this.generateSpinId();
    
    if (this.debugMode) {
      console.log(`🎰 SpinManager: Starting spin ${spinId} with bet ${bet}`);
    }

    // Update state
    this.currentState.isSpinning = true;
    this.currentState.bet = bet;
    this.currentState.balance -= bet;
    this.currentState.spinId = spinId;

    // Generate spin result
    const targetMatrix = this.generateSpinResult();

    // Emit spin start event
    this.eventBus.emit('spin:start', { spinId, bet });

    // Start reel animation
    this.reelManager.startSpin(targetMatrix, spinId);

    return spinId;
  }

  /**
   * Generate spin result matrix
   */
  private generateSpinResult(): string[][] {
    // Check if we should use test/mock results
    if (this.testConfig.enabled && this.testConfig.mockResults?.length) {
      const mockResult = this.testConfig.mockResults.shift();
      if (mockResult) {
        if (this.debugMode) {
          console.log('🎰 SpinManager: Using mock result', mockResult.matrix);
        }
        return mockResult.matrix;
      }
    }

    // Generate random result
    const matrix = this.symbolPool.generateSpinMatrix(
      this.currentState.reels.length,
      this.currentState.reels[0]?.currentSymbols.length || 3
    );

    if (this.debugMode) {
      console.log('🎰 SpinManager: Generated spin matrix:', matrix);
    }

    return matrix;
  }

  /**
   * Handle spin completion
   */
  private handleSpinComplete(result: SpinResult, spinId: string): void {
    if (this.debugMode) {
      console.log(`🎰 SpinManager: Spin ${spinId} complete, evaluating wins`);
    }

    // Evaluate wins
    const evaluatedResult = this.winEvaluator.evaluateWins(
      result.matrix,
      this.currentState.bet
    );

    // Update balance with wins
    this.currentState.balance += evaluatedResult.totalWin;
    this.currentState.lastResult = evaluatedResult;
    this.currentState.isSpinning = false;

    // Emit win events
    if (evaluatedResult.wins.length > 0) {
      this.eventBus.emit('win:reveal', {
        wins: evaluatedResult.wins,
        totalWin: evaluatedResult.totalWin,
        spinId
      });

      // Check for big win (e.g., win > 10x bet)
      const bigWinThreshold = this.currentState.bet * 10;
      if (evaluatedResult.totalWin >= bigWinThreshold) {
        const multiplier = evaluatedResult.totalWin / this.currentState.bet;
        this.eventBus.emit('win:big', {
          multiplier,
          totalWin: evaluatedResult.totalWin,
          spinId
        });
      }
    }

    // Emit final spin complete event with full result
    this.eventBus.emit('spin:complete', {
      result: evaluatedResult,
      spinId
    });

    if (this.debugMode) {
      console.log(`🎰 SpinManager: Spin ${spinId} fully processed`);
      console.log('Final result:', evaluatedResult);
      console.log('New balance:', this.currentState.balance);
    }
  }

  /**
   * Force stop current spin
   */
  stopSpin(): void {
    if (!this.currentState.isSpinning) {
      return;
    }

    if (this.debugMode) {
      console.log(`🛑 SpinManager: Force stopping spin ${this.currentState.spinId}`);
    }

    this.reelManager.stopAllReels(this.currentState.spinId);
    this.currentState.isSpinning = false;
  }

  /**
   * Get current engine state
   */
  getState(): EngineState {
    return { ...this.currentState };
  }

  /**
   * Update balance
   */
  updateBalance(newBalance: number): void {
    this.currentState.balance = newBalance;
    if (this.debugMode) {
      console.log(`🎰 SpinManager: Balance updated to ${newBalance}`);
    }
  }

  /**
   * Set test configuration
   */
  setTestConfig(config: TestConfig): void {
    this.testConfig = config;
    if (this.debugMode) {
      console.log('🎰 SpinManager: Test config updated', config);
    }
  }

  /**
   * Add mock spin result for testing
   */
  addMockResult(result: SpinResult): void {
    if (!this.testConfig.mockResults) {
      this.testConfig.mockResults = [];
    }
    this.testConfig.mockResults.push(result);
    
    if (this.debugMode) {
      console.log('🎰 SpinManager: Added mock result', result);
    }
  }

  /**
   * Generate unique spin ID
   */
  private generateSpinId(): string {
    return `spin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if engine can accept new spin
   */
  canSpin(bet: number): { canSpin: boolean; reason?: string } {
    if (this.currentState.isSpinning) {
      return { canSpin: false, reason: 'Already spinning' };
    }

    if (bet > this.currentState.balance) {
      return { canSpin: false, reason: 'Insufficient balance' };
    }

    if (bet <= 0) {
      return { canSpin: false, reason: 'Invalid bet amount' };
    }

    return { canSpin: true };
  }

  /**
   * Get last spin result
   */
  getLastResult(): SpinResult | undefined {
    return this.currentState.lastResult;
  }

  /**
   * Reset engine state
   */
  reset(): void {
    this.stopSpin();
    this.currentState.lastResult = undefined;
    this.currentState.spinId = '';
    
    if (this.debugMode) {
      console.log('🧹 SpinManager: Engine state reset');
    }
  }

  /**
   * Get spin statistics
   */
  getStatistics(): Record<string, any> {
    return {
      currentBalance: this.currentState.balance,
      isSpinning: this.currentState.isSpinning,
      lastWin: this.currentState.lastResult?.totalWin || 0,
      lastSpinId: this.currentState.spinId,
      testMode: this.testConfig.enabled,
      reelStates: this.reelManager.getReelStates()
    };
  }
}