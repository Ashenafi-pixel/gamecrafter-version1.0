import { gsap } from 'gsap';

/**
 * Professional GSAP Animation Manager
 * Handles smooth, professional animations with easing and sequencing
 */

export interface AnimationConfig {
  duration: number;
  ease: string;
  repeat: number;
  yoyo: boolean;
  delay: number;
}

export type LoopMode = 'once' | 'forever' | 'ping-pong';
export type PlaybackMode = 'simultaneous' | 'sequential';

export interface AnimationState {
  rotation: number;
  scale: number;
  glowIntensity: number;
  floatY: number;
  pulseScale: number;
  x: number;
  y: number;
  alpha: number;
  time: number;
}

export class GSAPAnimationManager {
  private timeline: gsap.core.Timeline | null = null;
  private animationState: AnimationState;
  private isPlaying: boolean = false;
  private selectedAnimations: string[] = [];
  private onUpdateCallback?: (state: AnimationState) => void;
  private loopMode: LoopMode = 'forever';
  private playbackMode: PlaybackMode = 'simultaneous';
  private timelinePosition: number = 0;

  // Animation presets with professional easing
  private readonly presets: Record<string, AnimationConfig> = {
    glow: {
      duration: 2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0
    },
    rotation: {
      duration: 4,
      ease: "none",
      repeat: -1,
      yoyo: false,
      delay: 0
    },
    pulse: {
      duration: 1.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0
    },
    float: {
      duration: 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0
    },
    bounce: {
      duration: 1.2,
      ease: "bounce.out",
      repeat: -1,
      yoyo: false,
      delay: 0
    },
    swing: {
      duration: 2.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0.5
    },
    particle: {
      duration: 2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0.2
    },
    scale: {
      duration: 2.5,
      ease: "elastic.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0
    }
  };

  constructor(initialState: AnimationState, onUpdate?: (state: AnimationState) => void) {
    this.animationState = { ...initialState };
    this.onUpdateCallback = onUpdate;
    this.initializeTimeline();
  }

  /**
   * Initialize the GSAP timeline
   */
  private initializeTimeline(): void {
    this.timeline = gsap.timeline({
      paused: true,
      onUpdate: () => {
        this.timelinePosition = this.timeline?.progress() || 0;
        if (this.onUpdateCallback) {
          this.onUpdateCallback({ ...this.animationState });
        }
      },
      onComplete: () => {
        if (this.loopMode === 'once') {
          this.isPlaying = false;
          console.log('🔚 GSAP: Animation completed (once mode)');
        }
      }
    });
  }

  /**
   * Update selected animations and rebuild timeline
   */
  public updateAnimations(animations: string[]): void {
    console.log('🎬 GSAP: Updating animations:', animations);
    this.selectedAnimations = [...animations];
    this.rebuildTimeline();
    
    if (animations.length > 0 && !this.isPlaying) {
      this.play();
    } else if (animations.length === 0 && this.isPlaying) {
      this.pause();
    }
  }

  /**
   * Rebuild the timeline based on selected animations
   */
  private rebuildTimeline(): void {
    if (!this.timeline) return;

    console.log('🔄 GSAP: Rebuilding timeline for:', this.selectedAnimations, 'Mode:', this.loopMode, this.playbackMode);
    
    // Clear existing timeline
    this.timeline.clear();
    
    // Reset animation state
    this.resetState();

    // Configure timeline based on playback mode
    if (this.playbackMode === 'sequential') {
      this.addSequentialAnimations();
    } else {
      this.addSimultaneousAnimations();
    }

    console.log('✅ GSAP: Timeline rebuilt with', this.timeline.getChildren().length, 'animations');
  }

  /**
   * Add animations to play simultaneously
   */
  private addSimultaneousAnimations(): void {
    this.selectedAnimations.forEach((animationType, index) => {
      this.addAnimationToTimeline(animationType, index, 0); // All start at time 0
    });
  }

  /**
   * Add animations to play sequentially
   */
  private addSequentialAnimations(): void {
    let currentTime = 0;
    this.selectedAnimations.forEach((animationType, index) => {
      const config = this.presets[animationType];
      if (config) {
        this.addAnimationToTimeline(animationType, index, currentTime);
        currentTime += config.duration; // Next animation starts after this one
      }
    });
  }

  /**
   * Apply loop mode to animation configuration
   */
  private applyLoopMode(config: AnimationConfig): AnimationConfig {
    const loopConfig = { ...config };
    
    switch (this.loopMode) {
      case 'once':
        loopConfig.repeat = 0;
        loopConfig.yoyo = false;
        break;
      case 'forever':
        loopConfig.repeat = -1; // Infinite
        loopConfig.yoyo = false;
        break;
      case 'ping-pong':
        loopConfig.repeat = -1; // Infinite
        loopConfig.yoyo = true; // Back and forth
        break;
    }
    
    return loopConfig;
  }

  /**
   * Add a specific animation to the timeline
   */
  private addAnimationToTimeline(animationType: string, index: number, startTime: number = 0): void {
    if (!this.timeline) return;

    const config = this.presets[animationType];
    if (!config) {
      console.warn(`Unknown animation type: ${animationType}`);
      return;
    }

    // Apply loop mode to configuration
    const loopConfig = this.applyLoopMode(config);
    const delay = startTime + config.delay + (this.playbackMode === 'simultaneous' ? index * 0.1 : 0);

    switch (animationType) {
      case 'glow':
        this.timeline.to(this.animationState, {
          glowIntensity: 1,
          duration: loopConfig.duration,
          ease: loopConfig.ease,
          repeat: loopConfig.repeat,
          yoyo: loopConfig.yoyo,
          delay
        }, startTime);
        break;

      case 'rotation':
        this.timeline.to(this.animationState, {
          rotation: Math.PI * 2,
          duration: loopConfig.duration,
          ease: loopConfig.ease,
          repeat: loopConfig.repeat,
          delay
        }, startTime);
        break;

      case 'pulse':
        this.timeline.to(this.animationState, {
          pulseScale: 1.2,
          duration: loopConfig.duration,
          ease: loopConfig.ease,
          repeat: loopConfig.repeat,
          yoyo: loopConfig.yoyo,
          delay
        }, startTime);
        break;

      case 'float':
        this.timeline.to(this.animationState, {
          floatY: -30,
          duration: loopConfig.duration,
          ease: loopConfig.ease,
          repeat: loopConfig.repeat,
          yoyo: loopConfig.yoyo,
          delay
        }, startTime);
        break;

      case 'bounce':
        this.timeline.to(this.animationState, {
          y: -50,
          duration: loopConfig.duration / 2,
          ease: "power2.out",
          repeat: loopConfig.repeat,
          yoyo: false,
          delay
        }, startTime)
        .to(this.animationState, {
          y: 0,
          duration: loopConfig.duration / 2,
          ease: "bounce.out",
          delay: loopConfig.duration / 2
        }, startTime);
        break;

      case 'swing':
        this.timeline.to(this.animationState, {
          rotation: 0.3,
          duration: loopConfig.duration,
          ease: loopConfig.ease,
          repeat: loopConfig.repeat,
          yoyo: loopConfig.yoyo,
          delay
        }, startTime);
        break;

      case 'particle':
        this.timeline.to(this.animationState, {
          alpha: 0.7,
          glowIntensity: 0.8,
          duration: loopConfig.duration,
          ease: loopConfig.ease,
          repeat: loopConfig.repeat,
          yoyo: loopConfig.yoyo,
          delay
        }, startTime);
        break;

      case 'scale':
        this.timeline.to(this.animationState, {
          scale: 1.3,
          duration: loopConfig.duration,
          ease: loopConfig.ease,
          repeat: loopConfig.repeat,
          yoyo: loopConfig.yoyo,
          delay
        }, startTime);
        break;
    }

    console.log(`✨ GSAP: Added ${animationType} animation`);
  }

  /**
   * Reset animation state to defaults
   */
  private resetState(): void {
    this.animationState = {
      rotation: 0,
      scale: 1,
      glowIntensity: 0,
      floatY: 0,
      pulseScale: 1,
      x: 0,
      y: 0,
      alpha: 1,
      time: 0
    };
  }

  /**
   * Play the animation timeline
   */
  public play(): void {
    if (!this.timeline) return;
    
    console.log('▶️ GSAP: Playing animations');
    this.isPlaying = true;
    this.timeline.play();
  }

  /**
   * Pause the animation timeline
   */
  public pause(): void {
    if (!this.timeline) return;
    
    console.log('⏸️ GSAP: Pausing animations');
    this.isPlaying = false;
    this.timeline.pause();
  }

  /**
   * Stop and reset the animation timeline
   */
  public stop(): void {
    if (!this.timeline) return;
    
    console.log('⏹️ GSAP: Stopping animations');
    this.isPlaying = false;
    this.timeline.pause(0);
    this.resetState();
    
    if (this.onUpdateCallback) {
      this.onUpdateCallback({ ...this.animationState });
    }
  }

  /**
   * Set animation speed
   */
  public setSpeed(speed: number): void {
    if (!this.timeline) return;
    
    console.log('🏃 GSAP: Setting speed to', speed);
    this.timeline.timeScale(speed);
  }

  /**
   * Get current animation state
   */
  public getState(): AnimationState {
    return { ...this.animationState };
  }

  /**
   * Check if animations are playing
   */
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Set loop mode and rebuild timeline
   */
  public setLoopMode(mode: LoopMode): void {
    console.log('🔄 GSAP: Setting loop mode to', mode);
    this.loopMode = mode;
    this.rebuildTimeline();
  }

  /**
   * Set playback mode and rebuild timeline
   */
  public setPlaybackMode(mode: PlaybackMode): void {
    console.log('🔄 GSAP: Setting playback mode to', mode);
    this.playbackMode = mode;
    this.rebuildTimeline();
  }

  /**
   * Set timeline position (0-1)
   */
  public setTimelinePosition(position: number): void {
    if (!this.timeline) return;
    
    const clampedPosition = Math.max(0, Math.min(1, position));
    this.timeline.progress(clampedPosition);
    this.timelinePosition = clampedPosition;
    console.log('⏰ GSAP: Timeline position set to', (clampedPosition * 100).toFixed(1) + '%');
  }

  /**
   * Get current timeline position (0-1)
   */
  public getTimelinePosition(): number {
    return this.timelinePosition;
  }

  /**
   * Get current loop mode
   */
  public getLoopMode(): LoopMode {
    return this.loopMode;
  }

  /**
   * Get current playback mode
   */
  public getPlaybackMode(): PlaybackMode {
    return this.playbackMode;
  }

  /**
   * Get available animation presets
   */
  public getPresets(): Record<string, AnimationConfig> {
    return { ...this.presets };
  }

  /**
   * Update a specific preset configuration
   */
  public updatePreset(animationType: string, config: Partial<AnimationConfig>): void {
    if (this.presets[animationType]) {
      this.presets[animationType] = { ...this.presets[animationType], ...config };
      console.log(`🔧 GSAP: Updated preset for ${animationType}:`, this.presets[animationType]);
      
      // Rebuild timeline if this animation is currently selected
      if (this.selectedAnimations.includes(animationType)) {
        this.rebuildTimeline();
      }
    }
  }

  /**
   * Destroy the animation manager and clean up
   */
  public destroy(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    this.isPlaying = false;
    this.selectedAnimations = [];
    console.log('🗑️ GSAP: Animation manager destroyed');
  }
}