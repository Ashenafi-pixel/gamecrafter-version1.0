/**
 * AnimationManager.ts
 * 
 * Manages visual effects and animations for the slot engine.
 * Handles spinStart, reelStop, winReveal, and other FX via configurable presets.
 * Supports GSAP integration or custom callback triggering through registry pattern.
 * UI-agnostic design - delegates actual rendering to registered handlers.
 */

import { EventBus } from '../core/EventBus';
import { animationPresets, AnimationPreset } from '../config/animationPresets';

export interface AnimationConfig {
  /** Animation preset name */
  name: string;
  /** Duration in milliseconds */
  duration?: number;
  /** Easing function name or custom function */
  easing?: string | Function;
  /** Animation-specific parameters */
  params?: Record<string, any>;
  /** Delay before starting animation */
  delay?: number;
  /** Loop count (0 = infinite, 1 = once) */
  loop?: number;
}

export interface AnimationContext {
  /** Target elements or identifiers */
  targets?: any[];
  /** Reel index for reel-specific animations */
  reelIndex?: number;
  /** Symbol positions for win animations */
  winPositions?: Array<{ reel: number; row: number }>;
  /** Win amount for scaling effects */
  winAmount?: number;
  /** Custom context data */
  data?: Record<string, any>;
}

export interface AnimationHandler {
  /** Handler function that executes the animation */
  execute: (config: AnimationConfig, context?: AnimationContext) => Promise<void> | void;
  /** Optional cleanup function */
  cleanup?: () => void;
  /** Priority for handler selection (higher = preferred) */
  priority?: number;
}

export interface AnimationManagerConfig {
  /** Default animation duration in ms */
  defaultDuration: number;
  /** Default easing function */
  defaultEasing: string;
  /** Whether to queue animations or play simultaneously */
  queueAnimations: boolean;
  /** Global animation speed multiplier */
  speedMultiplier: number;
  /** Maximum concurrent animations */
  maxConcurrent: number;
}

/**
 * AnimationManager
 * 
 * Core animation system for the slot engine. Provides a clean interface
 * for triggering visual effects while remaining UI-agnostic.
 */
export class AnimationManager {
  private eventBus: EventBus;
  private config: AnimationManagerConfig;
  private handlers: Map<string, AnimationHandler[]> = new Map();
  private activeAnimations: Set<string> = new Set();
  private animationQueue: Array<{ name: string; config: AnimationConfig; context?: AnimationContext }> = [];
  private isProcessingQueue = false;

  constructor(eventBus: EventBus, config: Partial<AnimationManagerConfig> = {}) {
    this.eventBus = eventBus;
    this.config = {
      defaultDuration: 300,
      defaultEasing: 'ease-out',
      queueAnimations: false,
      speedMultiplier: 1.0,
      maxConcurrent: 5,
      ...config
    };

    this.setupEventListeners();
  }

  /**
   * Register an animation handler for a specific animation name
   */
  registerHandler(animationName: string, handler: AnimationHandler): void {
    if (!this.handlers.has(animationName)) {
      this.handlers.set(animationName, []);
    }

    const handlers = this.handlers.get(animationName)!;
    handlers.push(handler);
    
    // Sort by priority (highest first)
    handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Unregister a specific handler or all handlers for an animation
   */
  unregisterHandler(animationName: string, handler?: AnimationHandler): void {
    if (!handler) {
      // Remove all handlers for this animation
      const handlers = this.handlers.get(animationName);
      if (handlers) {
        handlers.forEach(h => h.cleanup?.());
        this.handlers.delete(animationName);
      }
    } else {
      // Remove specific handler
      const handlers = this.handlers.get(animationName);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers[index].cleanup?.();
          handlers.splice(index, 1);
        }
      }
    }
  }

  /**
   * Play an animation effect
   */
  async playFX(name: string, context?: AnimationContext): Promise<void> {
    // Get animation config from presets or use default
    const preset = animationPresets[name];
    if (!preset) {
      console.warn(`AnimationManager: Unknown animation preset '${name}'`);
      return;
    }

    const config: AnimationConfig = {
      name,
      duration: preset.duration || this.config.defaultDuration,
      easing: preset.easing || this.config.defaultEasing,
      params: preset.params || {},
      delay: preset.delay || 0,
      loop: preset.loop || 1
    };

    // Apply speed multiplier
    if (config.duration) {
      config.duration = Math.round(config.duration / this.config.speedMultiplier);
    }

    // Handle queueing vs immediate execution
    if (this.config.queueAnimations || this.activeAnimations.size >= this.config.maxConcurrent) {
      this.animationQueue.push({ name, config, context });
      this.processQueue();
    } else {
      await this.executeAnimation(name, config, context);
    }
  }

  /**
   * Play multiple animations in sequence
   */
  async playSequence(animations: Array<{ name: string; context?: AnimationContext; delay?: number }>): Promise<void> {
    for (const anim of animations) {
      if (anim.delay) {
        await this.delay(anim.delay);
      }
      await this.playFX(anim.name, anim.context);
    }
  }

  /**
   * Play multiple animations simultaneously
   */
  async playParallel(animations: Array<{ name: string; context?: AnimationContext }>): Promise<void> {
    const promises = animations.map(anim => this.playFX(anim.name, anim.context));
    await Promise.all(promises);
  }

  /**
   * Stop all active animations
   */
  stopAll(): void {
    this.activeAnimations.clear();
    this.animationQueue.length = 0;
    this.isProcessingQueue = false;
    
    // Emit stop event for handlers to clean up
    this.eventBus.emit('animation:stopAll');
  }

  /**
   * Stop a specific animation
   */
  stop(name: string): void {
    this.activeAnimations.delete(name);
    this.eventBus.emit('animation:stop', { name });
  }

  /**
   * Check if an animation is currently playing
   */
  isPlaying(name: string): boolean {
    return this.activeAnimations.has(name);
  }

  /**
   * Get current animation manager state
   */
  getState() {
    return {
      activeAnimations: Array.from(this.activeAnimations),
      queueLength: this.animationQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      config: { ...this.config }
    };
  }

  /**
   * Update animation manager configuration
   */
  updateConfig(newConfig: Partial<AnimationManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Execute an animation with registered handlers
   */
  private async executeAnimation(name: string, config: AnimationConfig, context?: AnimationContext): Promise<void> {
    const handlers = this.handlers.get(name);
    if (!handlers || handlers.length === 0) {
      console.warn(`AnimationManager: No handlers registered for animation '${name}'`);
      return;
    }

    this.activeAnimations.add(name);

    try {
      // Emit animation start event
      this.eventBus.emit('animation:start', { name, config, context });

      // Apply delay if specified
      if (config.delay && config.delay > 0) {
        await this.delay(config.delay);
      }

      // Execute with the highest priority handler
      const handler = handlers[0];
      await handler.execute(config, context);

      // Emit animation complete event
      this.eventBus.emit('animation:complete', { name, config, context });
    } catch (error) {
      console.error(`AnimationManager: Error executing animation '${name}':`, error);
      this.eventBus.emit('animation:error', { name, config, context, error });
    } finally {
      this.activeAnimations.delete(name);
    }
  }

  /**
   * Process the animation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.animationQueue.length > 0 && this.activeAnimations.size < this.config.maxConcurrent) {
      const { name, config, context } = this.animationQueue.shift()!;
      
      if (this.config.queueAnimations) {
        await this.executeAnimation(name, config, context);
      } else {
        // Execute without waiting
        this.executeAnimation(name, config, context);
      }
    }

    this.isProcessingQueue = false;

    // Continue processing if more items were added
    if (this.animationQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Setup event listeners for slot engine events
   */
  private setupEventListeners(): void {
    // Spin start animations
    this.eventBus.on('spin:start', () => {
      this.playFX('spinStart');
    });

    // Reel stop animations
    this.eventBus.on('reel:stop', (data: { reelIndex: number }) => {
      this.playFX('reelStop', { reelIndex: data.reelIndex });
    });

    // Win reveal animations
    this.eventBus.on('win:reveal', (data: { winAmount: number; winPositions: Array<{ reel: number; row: number }> }) => {
      const animationName = this.getWinAnimationName(data.winAmount);
      this.playFX(animationName, { 
        winAmount: data.winAmount, 
        winPositions: data.winPositions 
      });
    });

    // All reels stopped
    this.eventBus.on('spin:complete', () => {
      this.playFX('spinComplete');
    });
  }

  /**
   * Determine win animation based on win amount
   */
  private getWinAnimationName(winAmount: number): string {
    if (winAmount >= 100) return 'megaWin';
    if (winAmount >= 20) return 'bigWin';
    if (winAmount > 0) return 'smallWin';
    return 'noWin';
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAll();
    
    // Clean up all handlers
    for (const [name, handlers] of this.handlers) {
      handlers.forEach(handler => handler.cleanup?.());
    }
    this.handlers.clear();
  }
}

export default AnimationManager;