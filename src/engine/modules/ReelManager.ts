/**
 * ReelManager - Manages individual reel states and animations
 * Handles reel spinning logic, timing, and state tracking
 */

import { ReelState, AnimationConfig } from '../types/types';
import { EventBus } from '../core/EventBus';

export class ReelManager {
  private reels: ReelState[] = [];
  private eventBus: EventBus;
  private animationConfig: AnimationConfig;
  private debugMode: boolean = false;
  private activeTimers: Map<number, NodeJS.Timeout> = new Map();

  constructor(
    reelCount: number, 
    rowCount: number, 
    eventBus: EventBus, 
    animationConfig: AnimationConfig,
    debugMode: boolean = false
  ) {
    this.eventBus = eventBus;
    this.animationConfig = animationConfig;
    this.debugMode = debugMode;
    this.initializeReels(reelCount, rowCount);
  }

  /**
   * Initialize reel states
   */
  private initializeReels(reelCount: number, rowCount: number): void {
    this.reels = [];
    
    for (let i = 0; i < reelCount; i++) {
      const reel: ReelState = {
        index: i,
        isSpinning: false,
        currentSymbols: new Array(rowCount).fill(''),
        targetSymbols: new Array(rowCount).fill(''),
        spinProgress: 0
      };
      this.reels.push(reel);
    }

    if (this.debugMode) {
      console.log(`🎰 ReelManager: Initialized ${reelCount} reels with ${rowCount} rows each`);
    }
  }

  /**
   * Start spinning all reels with staggered timing
   */
  startSpin(targetMatrix: string[][], spinId: string): void {
    if (this.debugMode) {
      console.log(`🎰 ReelManager: Starting spin ${spinId}`);
    }

    // Clear any existing timers
    this.clearAllTimers();

    // Set target symbols for each reel
    this.reels.forEach((reel, index) => {
      reel.targetSymbols = targetMatrix[index] || [];
      reel.spinProgress = 0;
    });

    // Start reels with stagger
    this.reels.forEach((reel, index) => {
      const startDelay = index * this.animationConfig.reelStagger;
      
      const startTimer = setTimeout(() => {
        this.startReelSpin(reel, spinId);
      }, startDelay);
      
      this.activeTimers.set(`start-${index}`, startTimer);
    });
  }

  /**
   * Start spinning a specific reel
   */
  private startReelSpin(reel: ReelState, spinId: string): void {
    reel.isSpinning = true;
    reel.spinProgress = 0;

    if (this.debugMode) {
      console.log(`🎰 ReelManager: Starting reel ${reel.index}`);
    }

    // Emit reel start event
    this.eventBus.emit('reel:start', {
      reelIndex: reel.index,
      spinId
    });

    // Calculate spin duration with variation
    const baseDuration = this.animationConfig.spinSpeed;
    const variation = 200 + (reel.index * 100); // Each reel spins slightly longer
    const spinDuration = baseDuration + variation;

    // Progress animation
    const progressInterval = setInterval(() => {
      if (!reel.isSpinning) {
        clearInterval(progressInterval);
        return;
      }

      reel.spinProgress = Math.min(reel.spinProgress + 0.02, 1.0);

      // Emit progress event
      this.eventBus.emit('reel:progress', {
        reelIndex: reel.index,
        progress: reel.spinProgress,
        spinId
      });

      if (this.debugMode && reel.spinProgress % 0.2 < 0.02) {
        console.log(`🔄 Reel ${reel.index}: ${(reel.spinProgress * 100).toFixed(0)}% progress`);
      }
    }, 16); // ~60fps

    // Stop reel after duration
    const stopDelay = spinDuration + (reel.index * this.animationConfig.reelStopStagger);
    const stopTimer = setTimeout(() => {
      clearInterval(progressInterval);
      this.stopReelSpin(reel, spinId);
    }, stopDelay);

    this.activeTimers.set(`stop-${reel.index}`, stopTimer);
    this.activeTimers.set(`progress-${reel.index}`, progressInterval as any);
  }

  /**
   * Stop spinning a specific reel
   */
  private stopReelSpin(reel: ReelState, spinId: string): void {
    reel.isSpinning = false;
    reel.spinProgress = 1.0;
    reel.currentSymbols = [...reel.targetSymbols];

    if (this.debugMode) {
      console.log(`🛑 ReelManager: Stopped reel ${reel.index}`, reel.currentSymbols);
    }

    // Emit reel stop event
    this.eventBus.emit('reel:stop', {
      reelIndex: reel.index,
      symbols: reel.currentSymbols,
      spinId
    });

    // Check if all reels have stopped
    if (this.areAllReelsStopped()) {
      this.onAllReelsStopped(spinId);
    }
  }

  /**
   * Check if all reels have stopped spinning
   */
  private areAllReelsStopped(): boolean {
    return this.reels.every(reel => !reel.isSpinning);
  }

  /**
   * Handle when all reels have stopped
   */
  private onAllReelsStopped(spinId: string): void {
    if (this.debugMode) {
      console.log(`🎰 ReelManager: All reels stopped for spin ${spinId}`);
    }

    // Emit spin complete event
    this.eventBus.emit('spin:complete', {
      result: {
        matrix: this.reels.map(reel => reel.currentSymbols),
        wins: [], // Will be populated by WinEvaluator
        totalWin: 0,
        isBonus: false
      },
      spinId
    });
  }

  /**
   * Force stop all reels (emergency stop)
   */
  stopAllReels(spinId: string): void {
    if (this.debugMode) {
      console.log(`🛑 ReelManager: Force stopping all reels for spin ${spinId}`);
    }

    this.clearAllTimers();
    
    this.reels.forEach(reel => {
      if (reel.isSpinning) {
        this.stopReelSpin(reel, spinId);
      }
    });
  }

  /**
   * Clear all active timers
   */
  private clearAllTimers(): void {
    this.activeTimers.forEach((timer, key) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.activeTimers.clear();
  }

  /**
   * Get current reel states
   */
  getReelStates(): ReelState[] {
    return this.reels.map(reel => ({ ...reel }));
  }

  /**
   * Get specific reel state
   */
  getReelState(index: number): ReelState | undefined {
    return this.reels[index] ? { ...this.reels[index] } : undefined;
  }

  /**
   * Check if any reel is spinning
   */
  isAnyReelSpinning(): boolean {
    return this.reels.some(reel => reel.isSpinning);
  }

  /**
   * Update animation config
   */
  updateAnimationConfig(config: AnimationConfig): void {
    this.animationConfig = config;
    if (this.debugMode) {
      console.log('🎰 ReelManager: Updated animation config', config);
    }
  }

  /**
   * Set reel symbols (for testing)
   */
  setReelSymbols(reelIndex: number, symbols: string[]): void {
    if (this.reels[reelIndex]) {
      this.reels[reelIndex].currentSymbols = [...symbols];
      if (this.debugMode) {
        console.log(`🎰 ReelManager: Set symbols for reel ${reelIndex}:`, symbols);
      }
    }
  }

  /**
   * Cleanup - clear all timers and reset state
   */
  cleanup(): void {
    this.clearAllTimers();
    this.reels.forEach(reel => {
      reel.isSpinning = false;
      reel.spinProgress = 0;
    });
    
    if (this.debugMode) {
      console.log('🧹 ReelManager: Cleanup complete');
    }
  }
}