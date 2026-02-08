import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import { ProcessedMesh, AnimationConstraints } from './professionalMeshProcessor';

// Professional animation types
export interface GSAPAnimationKeyframe {
  time: number;
  properties: {
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    skewX?: number;
    skewY?: number;
    alpha?: number;
    tint?: number;
    [key: string]: any;
  };
  easing?: string;
  duration?: number;
}

export interface ProfessionalAnimationClip {
  id: string;
  name: string;
  elementId: string;
  type: 'idle' | 'win' | 'scatter' | 'wild' | 'bonus' | 'intro';
  keyframes: GSAPAnimationKeyframe[];
  loop: boolean;
  duration: number;
  priority: number;
  blendMode?: string;
}

export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  activeClips: string[];
  blendWeights: Record<string, number>;
}

export class ProfessionalGSAPAnimator {
  private static instance: ProfessionalGSAPAnimator;
  private timelines: Map<string, gsap.core.Timeline> = new Map();
  private sprites: Map<string, PIXI.Sprite> = new Map();
  private meshData: Map<string, ProcessedMesh> = new Map();
  private animationClips: Map<string, ProfessionalAnimationClip> = new Map();
  private masterTimeline: gsap.core.Timeline;
  private state: AnimationState;

  constructor() {
    this.masterTimeline = gsap.timeline({
      repeat: -1,
      yoyo: false,
      paused: true
    });

    this.state = {
      isPlaying: false,
      currentTime: 0,
      speed: 1,
      activeClips: [],
      blendWeights: {}
    };

    console.log('🎬 Professional GSAP Animator initialized');
    console.log('📊 GSAP version:', gsap.version);
  }

  public static getInstance(): ProfessionalGSAPAnimator {
    if (!ProfessionalGSAPAnimator.instance) {
      ProfessionalGSAPAnimator.instance = new ProfessionalGSAPAnimator();
    }
    return ProfessionalGSAPAnimator.instance;
  }

  /**
   * Register a sprite with its mesh data for animation
   */
  public registerSprite(elementId: string, sprite: PIXI.Sprite, meshData: ProcessedMesh): void {
    this.sprites.set(elementId, sprite);
    this.meshData.set(elementId, meshData);

    // Set up sprite anchor based on mesh center
    const bounds = meshData.boundingBox;
    const centerX = (bounds.x + bounds.width / 2) / bounds.width;
    const centerY = (bounds.y + bounds.height / 2) / bounds.height;

    sprite.anchor.set(centerX, centerY);

    console.log(`🎭 Registered sprite: ${elementId} with mesh data`);
  }

  /**
   * Create professional animation clips based on element type and mesh properties
   */
  public createAnimationClips(elementId: string, elementType: string, meshData: ProcessedMesh): ProfessionalAnimationClip[] {
    const clips: ProfessionalAnimationClip[] = [];

    // Generate different animation types based on element
    clips.push(
      this.createIdleAnimation(elementId, elementType, meshData),
      this.createWinAnimation(elementId, elementType, meshData),
      this.createScatterAnimation(elementId, elementType, meshData),
      this.createWildAnimation(elementId, elementType, meshData),
      this.createBonusAnimation(elementId, elementType, meshData),
      this.createIntroAnimation(elementId, elementType, meshData)
    );

    // Register clips
    clips.forEach(clip => {
      this.animationClips.set(clip.id, clip);
    });

    console.log(`🎨 Created ${clips.length} animation clips for ${elementId} (${elementType})`);
    return clips;
  }

  /**
   * Create idle animation based on element type
   */
  private createIdleAnimation(elementId: string, elementType: string, _meshData: ProcessedMesh): ProfessionalAnimationClip {
    const duration = this.getIdleDuration(elementType);
    const keyframes: GSAPAnimationKeyframe[] = [];

    switch (elementType) {
      case 'wing':
        // Gentle wing flutter
        keyframes.push(
          { time: 0, properties: { rotation: 0, scaleY: 1 }, easing: 'power2.inOut' },
          { time: 0.3, properties: { rotation: -0.1, scaleY: 1.05 }, easing: 'power2.inOut' },
          { time: 0.6, properties: { rotation: 0.08, scaleY: 0.98 }, easing: 'power2.inOut' },
          { time: 1, properties: { rotation: 0, scaleY: 1 }, easing: 'power2.inOut' }
        );
        break;

      case 'body':
        // Subtle breathing
        keyframes.push(
          { time: 0, properties: { scaleX: 1, scaleY: 1 }, easing: 'power1.inOut' },
          { time: 0.5, properties: { scaleX: 1.02, scaleY: 1.01 }, easing: 'power1.inOut' },
          { time: 1, properties: { scaleX: 1, scaleY: 1 }, easing: 'power1.inOut' }
        );
        break;

      case 'antenna':
        // Gentle swaying
        keyframes.push(
          { time: 0, properties: { rotation: 0 }, easing: 'sine.inOut' },
          { time: 0.4, properties: { rotation: 0.15 }, easing: 'sine.inOut' },
          { time: 0.8, properties: { rotation: -0.1 }, easing: 'sine.inOut' },
          { time: 1, properties: { rotation: 0 }, easing: 'sine.inOut' }
        );
        break;

      case 'leg':
        // Subtle leg twitch
        keyframes.push(
          { time: 0, properties: { rotation: 0, x: 0 }, easing: 'power2.out' },
          { time: 0.1, properties: { rotation: 0.05, x: 1 }, easing: 'power2.out' },
          { time: 0.9, properties: { rotation: 0, x: 0 }, easing: 'power2.out' },
          { time: 1, properties: { rotation: 0, x: 0 }, easing: 'power2.out' }
        );
        break;

      default:
        // Generic gentle pulse
        keyframes.push(
          { time: 0, properties: { alpha: 1 }, easing: 'power1.inOut' },
          { time: 0.5, properties: { alpha: 0.9 }, easing: 'power1.inOut' },
          { time: 1, properties: { alpha: 1 }, easing: 'power1.inOut' }
        );
    }

    return {
      id: `${elementId}_idle`,
      name: `${elementType} Idle`,
      elementId,
      type: 'idle',
      keyframes,
      loop: true,
      duration,
      priority: 1,
      blendMode: 'normal'
    };
  }

  /**
   * Create win animation with dramatic effects
   */
  private createWinAnimation(elementId: string, elementType: string, _meshData: ProcessedMesh): ProfessionalAnimationClip {
    const keyframes: GSAPAnimationKeyframe[] = [];

    switch (elementType) {
      case 'wing':
        // Excited wing spread and flutter
        keyframes.push(
          { time: 0, properties: { rotation: 0, scaleX: 1, scaleY: 1 }, easing: 'back.out(1.7)' },
          { time: 0.2, properties: { rotation: -0.3, scaleX: 1.2, scaleY: 1.1 }, easing: 'power2.out' },
          { time: 0.4, properties: { rotation: 0.25, scaleX: 1.15, scaleY: 1.05 }, easing: 'power2.out' },
          { time: 0.6, properties: { rotation: -0.2, scaleX: 1.1, scaleY: 1.08 }, easing: 'power2.out' },
          { time: 0.8, properties: { rotation: 0.15, scaleX: 1.05, scaleY: 1.03 }, easing: 'power2.out' },
          { time: 1, properties: { rotation: 0, scaleX: 1, scaleY: 1 }, easing: 'power2.inOut' }
        );
        break;

      case 'body':
        // Triumphant scale and glow
        keyframes.push(
          { time: 0, properties: { scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'back.out(1.7)' },
          { time: 0.3, properties: { scaleX: 1.15, scaleY: 1.1, alpha: 1.2 }, easing: 'power2.out' },
          { time: 0.7, properties: { scaleX: 1.1, scaleY: 1.05, alpha: 1.1 }, easing: 'power2.out' },
          { time: 1, properties: { scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'power2.inOut' }
        );
        break;

      default:
        // Generic celebration pulse
        keyframes.push(
          { time: 0, properties: { scaleX: 1, scaleY: 1, rotation: 0 }, easing: 'back.out(1.7)' },
          { time: 0.5, properties: { scaleX: 1.2, scaleY: 1.2, rotation: 0.1 }, easing: 'power2.out' },
          { time: 1, properties: { scaleX: 1, scaleY: 1, rotation: 0 }, easing: 'power2.inOut' }
        );
    }

    return {
      id: `${elementId}_win`,
      name: `${elementType} Win`,
      elementId,
      type: 'win',
      keyframes,
      loop: false,
      duration: 2.5,
      priority: 3,
      blendMode: 'screen'
    };
  }

  /**
   * Create scatter animation with mystical effects
   */
  private createScatterAnimation(elementId: string, elementType: string, _meshData: ProcessedMesh): ProfessionalAnimationClip {
    const keyframes: GSAPAnimationKeyframe[] = [];

    // Mystical glow and rotation for all elements
    keyframes.push(
      { time: 0, properties: { alpha: 1, rotation: 0, tint: 0xffffff }, easing: 'sine.inOut' },
      { time: 0.25, properties: { alpha: 1.3, rotation: 0.1, tint: 0xffddaa }, easing: 'sine.inOut' },
      { time: 0.5, properties: { alpha: 0.8, rotation: -0.05, tint: 0xaaddff }, easing: 'sine.inOut' },
      { time: 0.75, properties: { alpha: 1.2, rotation: 0.08, tint: 0xddaaff }, easing: 'sine.inOut' },
      { time: 1, properties: { alpha: 1, rotation: 0, tint: 0xffffff }, easing: 'sine.inOut' }
    );

    return {
      id: `${elementId}_scatter`,
      name: `${elementType} Scatter`,
      elementId,
      type: 'scatter',
      keyframes,
      loop: true,
      duration: 3.0,
      priority: 2,
      blendMode: 'add'
    };
  }

  /**
   * Create wild animation with divine power
   */
  private createWildAnimation(elementId: string, elementType: string, _meshData: ProcessedMesh): ProfessionalAnimationClip {
    const keyframes: GSAPAnimationKeyframe[] = [];

    // Divine power surge
    keyframes.push(
      { time: 0, properties: { scaleX: 1, scaleY: 1, alpha: 1, rotation: 0 }, easing: 'power4.out' },
      { time: 0.1, properties: { scaleX: 1.3, scaleY: 1.3, alpha: 1.5, rotation: 0.2 }, easing: 'elastic.out(1, 0.3)' },
      { time: 0.4, properties: { scaleX: 0.95, scaleY: 0.95, alpha: 1.2, rotation: -0.1 }, easing: 'power2.out' },
      { time: 0.7, properties: { scaleX: 1.1, scaleY: 1.1, alpha: 1.3, rotation: 0.15 }, easing: 'power2.out' },
      { time: 1, properties: { scaleX: 1, scaleY: 1, alpha: 1, rotation: 0 }, easing: 'power2.inOut' }
    );

    return {
      id: `${elementId}_wild`,
      name: `${elementType} Wild`,
      elementId,
      type: 'wild',
      keyframes,
      loop: false,
      duration: 2.0,
      priority: 4,
      blendMode: 'screen'
    };
  }

  /**
   * Create bonus animation with ascension effect
   */
  private createBonusAnimation(elementId: string, elementType: string, _meshData: ProcessedMesh): ProfessionalAnimationClip {
    const keyframes: GSAPAnimationKeyframe[] = [];

    // Ascension effect
    keyframes.push(
      { time: 0, properties: { y: 0, scaleX: 1, scaleY: 1, alpha: 1, rotation: 0 }, easing: 'power2.out' },
      { time: 0.3, properties: { y: -20, scaleX: 1.1, scaleY: 1.1, alpha: 1.2, rotation: 0.3 }, easing: 'power2.out' },
      { time: 0.6, properties: { y: -10, scaleX: 1.05, scaleY: 1.05, alpha: 1.1, rotation: -0.2 }, easing: 'power2.out' },
      { time: 1, properties: { y: 0, scaleX: 1, scaleY: 1, alpha: 1, rotation: 0 }, easing: 'bounce.out' }
    );

    return {
      id: `${elementId}_bonus`,
      name: `${elementType} Bonus`,
      elementId,
      type: 'bonus',
      keyframes,
      loop: false,
      duration: 3.5,
      priority: 5,
      blendMode: 'screen'
    };
  }

  /**
   * Create intro animation with awakening effect
   */
  private createIntroAnimation(elementId: string, elementType: string, _meshData: ProcessedMesh): ProfessionalAnimationClip {
    const keyframes: GSAPAnimationKeyframe[] = [];

    // Awakening from sleep
    keyframes.push(
      { time: 0, properties: { scaleX: 0.1, scaleY: 0.1, alpha: 0, rotation: -0.5 }, easing: 'back.out(1.7)' },
      { time: 0.4, properties: { scaleX: 1.2, scaleY: 1.2, alpha: 0.8, rotation: 0.2 }, easing: 'elastic.out(1, 0.5)' },
      { time: 0.8, properties: { scaleX: 0.95, scaleY: 0.95, alpha: 1, rotation: -0.1 }, easing: 'power2.out' },
      { time: 1, properties: { scaleX: 1, scaleY: 1, alpha: 1, rotation: 0 }, easing: 'power2.inOut' }
    );

    return {
      id: `${elementId}_intro`,
      name: `${elementType} Intro`,
      elementId,
      type: 'intro',
      keyframes,
      loop: false,
      duration: 2.5,
      priority: 6,
      blendMode: 'normal'
    };
  }

  /**
   * Play animation clip with professional blending
   */
  public playClip(clipId: string, blendWeight: number = 1.0): void {
    const clip = this.animationClips.get(clipId);
    if (!clip) {
      console.warn(`⚠️ Animation clip not found: ${clipId}`);
      return;
    }

    const sprite = this.sprites.get(clip.elementId);
    if (!sprite) {
      console.warn(`⚠️ Sprite not found for element: ${clip.elementId}`);
      return;
    }

    // Create timeline for this clip
    const timeline = gsap.timeline({
      repeat: clip.loop ? -1 : 0,
      yoyo: false,
      paused: true
    });

    // Add keyframes to timeline
    clip.keyframes.forEach((keyframe, index) => {
      const nextKeyframe = clip.keyframes[index + 1];
      const duration = nextKeyframe ? (nextKeyframe.time - keyframe.time) * clip.duration : 0;

      if (duration > 0) {
        timeline.to(sprite, {
          duration,
          ...keyframe.properties,
          ease: keyframe.easing || 'power2.inOut'
        }, keyframe.time * clip.duration);
      }
    });

    // Store timeline and add to master
    this.timelines.set(clipId, timeline);
    this.masterTimeline.add(timeline, 0);

    // Update state
    this.state.activeClips.push(clipId);
    this.state.blendWeights[clipId] = blendWeight;

    console.log(`🎬 Playing clip: ${clip.name} (weight: ${blendWeight})`);
  }

  /**
   * Stop animation clip
   */
  public stopClip(clipId: string): void {
    const timeline = this.timelines.get(clipId);
    if (timeline) {
      timeline.kill();
      this.timelines.delete(clipId);

      // Update state
      this.state.activeClips = this.state.activeClips.filter(id => id !== clipId);
      delete this.state.blendWeights[clipId];

      console.log(`⏹️ Stopped clip: ${clipId}`);
    }
  }

  /**
   * Play master timeline
   */
  public play(): void {
    this.masterTimeline.play();
    this.state.isPlaying = true;
    console.log('▶️ Professional animations started');
  }

  /**
   * Pause master timeline
   */
  public pause(): void {
    this.masterTimeline.pause();
    this.state.isPlaying = false;
    console.log('⏸️ Professional animations paused');
  }

  /**
   * Stop all animations
   */
  public stop(): void {
    this.masterTimeline.pause();
    this.masterTimeline.seek(0);
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    console.log('⏹️ Professional animations stopped');
  }

  /**
   * Set animation speed
   */
  public setSpeed(speed: number): void {
    this.masterTimeline.timeScale(speed);
    this.state.speed = speed;
    console.log(`⚡ Animation speed: ${speed}x`);
  }

  /**
   * Get ideal animation duration based on element type
   */
  private getIdleDuration(elementType: string): number {
    const durations = {
      'wing': 2.0,      // Fast flutter
      'body': 4.0,      // Slow breathing
      'antenna': 3.0,   // Moderate sway
      'leg': 5.0,       // Slow twitch
      'eye': 1.5,       // Quick blink
      'tail': 2.5,      // Moderate wave
      'pattern': 6.0    // Slow glow
    };

    return durations[elementType] || 3.0;
  }

  /**
   * Get current animation state
   */
  public getState(): AnimationState {
    this.state.currentTime = this.masterTimeline.time();
    return { ...this.state };
  }

  /**
   * Clean up all animations
   */
  public cleanup(): void {
    this.masterTimeline.kill();
    this.timelines.clear();
    this.sprites.clear();
    this.meshData.clear();
    this.animationClips.clear();

    this.state = {
      isPlaying: false,
      currentTime: 0,
      speed: 1,
      activeClips: [],
      blendWeights: {}
    };

    console.log('🧹 Professional animator cleaned up');
  }
}

// Export singleton instance
export const professionalGSAPAnimator = ProfessionalGSAPAnimator.getInstance();