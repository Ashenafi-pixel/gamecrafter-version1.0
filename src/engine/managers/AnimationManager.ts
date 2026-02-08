import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import { GlowFilter } from '@pixi/filter-glow';
import { 
  IAnimationManager, 
  AnimationType, 
  AnimationConfig,
  SpinAnimation,
  WinAnimation,
  TransitionAnimation,
  AnimationState
} from '../core/interfaces';

export class AnimationManager implements IAnimationManager {
  private activeAnimations: Map<string, gsap.core.Tween | gsap.core.Timeline> = new Map();
  private animationConfigs: Map<AnimationType, AnimationConfig> = new Map();
  private state: AnimationState = 'idle';
  
  constructor() {
    this.setupDefaultConfigs();
  }
  
  async initialize(configs?: Map<AnimationType, AnimationConfig>): Promise<void> {
    console.log('🎬 Initializing Animation Manager');
    
    // Override default configs with provided ones
    if (configs) {
      configs.forEach((config, type) => {
        this.animationConfigs.set(type, config);
      });
    }
    
    console.log('✅ Animation Manager initialized');
  }
  
  destroy(): void {
    console.log('🧹 Destroying Animation Manager');
    
    // Kill all active animations
    this.activeAnimations.forEach(animation => {
      animation.kill();
    });
    this.activeAnimations.clear();
    
    console.log('✅ Animation Manager destroyed');
  }
  
  /**
   * Trigger win celebration based on win type
   * Used by Step 7 to test different win animations
   */
  async triggerWinCelebration(winType: string, winPositions?: Array<{reel: number, row: number}>): Promise<void> {
    console.log(`🎉 Triggering ${winType} win celebration`);
    
    const animationConfigs = {
      small: {
        type: 'win' as const,
        duration: 1500,
        scale: { factor: 1.2, duration: 0.3, repeat: 2 },
        glow: {
          color: 0xFFFF00,
          distance: 10,
          outerStrength: 1,
          innerStrength: 0.5,
          quality: 0.5
        },
        autoClear: true
      },
      big: {
        type: 'win' as const,
        duration: 2500,
        scale: { factor: 1.5, duration: 0.5, repeat: 3 },
        glow: {
          color: 0xFFD700,
          distance: 20,
          outerStrength: 2,
          innerStrength: 1,
          quality: 0.5
        },
        rotation: { angle: Math.PI * 2, duration: 2 },
        autoClear: true
      },
      mega: {
        type: 'win' as const,
        duration: 3500,
        scale: { factor: 2, duration: 0.7, repeat: 4 },
        glow: {
          color: 0xFF00FF,
          distance: 30,
          outerStrength: 3,
          innerStrength: 2,
          quality: 0.7
        },
        rotation: { angle: Math.PI * 4, duration: 3 },
        particles: {
          count: 50,
          spread: 360,
          speed: 5,
          gravity: 0.5
        },
        autoClear: true
      },
      jackpot: {
        type: 'win' as const,
        duration: 5000,
        scale: { factor: 2.5, duration: 1, repeat: 5 },
        glow: {
          color: 0xFF0000,
          distance: 40,
          outerStrength: 4,
          innerStrength: 3,
          quality: 1
        },
        rotation: { angle: Math.PI * 6, duration: 4 },
        particles: {
          count: 100,
          spread: 360,
          speed: 10,
          gravity: 0.3
        },
        autoClear: true
      }
    };
    
    const config = animationConfigs[winType] || animationConfigs.small;
    
    // For now, just log - actual implementation would get display objects from renderer
    console.log(`🎨 Would play ${winType} animation with config:`, config);
    
    // Dispatch event for UI to show win celebration overlay
    window.dispatchEvent(new CustomEvent('winCelebration', {
      detail: { winType, config }
    }));
  }
  
  async playSpinAnimation(
    targets: PIXI.DisplayObject[], 
    config: SpinAnimation
  ): Promise<void> {
    const animId = `spin_${Date.now()}`;
    this.state = 'playing';
    
    // Create timeline for coordinated animation
    const timeline = gsap.timeline({
      onComplete: () => {
        this.activeAnimations.delete(animId);
        if (this.activeAnimations.size === 0) {
          this.state = 'idle';
        }
      }
    });
    
    // Blur effect during spin
    if (config.blur) {
      const blurFilter = new PIXI.filters.BlurFilter();
      blurFilter.blur = 0;
      
      targets.forEach(target => {
        target.filters = [blurFilter];
      });
      
      timeline.to(blurFilter, {
        blur: config.blur.intensity,
        duration: config.blur.duration,
        ease: config.blur.ease || 'power2.in'
      });
    }
    
    // Spin movement
    targets.forEach((target, index) => {
      const delay = config.stagger ? index * config.stagger : 0;
      
      timeline.to(target, {
        y: target.y + config.distance,
        duration: config.duration,
        ease: config.ease || 'none',
        repeat: config.loops || 0,
        delay,
        modifiers: {
          y: (y: number) => {
            // Wrap around for continuous spinning effect
            if (config.wrapAround && y > config.wrapPoint!) {
              return y - config.distance;
            }
            return y;
          }
        }
      }, 0);
    });
    
    this.activeAnimations.set(animId, timeline);
    
    await timeline.then();
  }
  
  async playWinAnimation(
    targets: PIXI.DisplayObject[], 
    config: WinAnimation
  ): Promise<void> {
    const animId = `win_${Date.now()}`;
    this.state = 'playing';
    
    const timeline = gsap.timeline({
      onComplete: () => {
        this.activeAnimations.delete(animId);
        if (this.activeAnimations.size === 0) {
          this.state = 'idle';
        }
      }
    });
    
    targets.forEach((target, index) => {
      const delay = config.stagger ? index * config.stagger : 0;
      
      // Glow effect
      if (config.glow) {
        const glowFilter = new GlowFilter({
          distance: config.glow.distance,
          outerStrength: config.glow.outerStrength,
          innerStrength: config.glow.innerStrength,
          color: config.glow.color,
          quality: config.glow.quality
        });
        
        target.filters = [...(target.filters || []), glowFilter];
        
        // Animate glow
        timeline.to(glowFilter, {
          outerStrength: config.glow.outerStrength * 1.5,
          duration: config.duration / 2,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: -1
        }, delay);
      }
      
      // Scale pulse
      if (config.scale) {
        timeline.to(target.scale, {
          x: target.scale.x * config.scale.factor,
          y: target.scale.y * config.scale.factor,
          duration: config.scale.duration,
          ease: config.scale.ease || 'elastic.out',
          yoyo: true,
          repeat: config.scale.repeat || 0,
          delay
        }, 0);
      }
      
      // Rotation
      if (config.rotation) {
        timeline.to(target, {
          rotation: target.rotation + config.rotation.angle,
          duration: config.rotation.duration,
          ease: config.rotation.ease || 'power2.inOut',
          delay
        }, 0);
      }
      
      // Particle effects
      if (config.particles) {
        this.createParticleEffect(target, config.particles);
      }
    });
    
    this.activeAnimations.set(animId, timeline);
    
    // Auto-clear after duration if specified
    if (config.autoClear) {
      setTimeout(() => {
        this.stopAnimation(animId);
        targets.forEach(target => {
          target.filters = [];
        });
      }, config.duration * 1000);
    }
    
    await timeline.then();
  }
  
  async playTransition(
    from: PIXI.DisplayObject,
    to: PIXI.DisplayObject,
    config: TransitionAnimation
  ): Promise<void> {
    const animId = `transition_${Date.now()}`;
    this.state = 'playing';
    
    const timeline = gsap.timeline({
      onComplete: () => {
        this.activeAnimations.delete(animId);
        if (this.activeAnimations.size === 0) {
          this.state = 'idle';
        }
      }
    });
    
    switch (config.type) {
      case 'fade':
        to.alpha = 0;
        timeline
          .to(from, {
            alpha: 0,
            duration: config.duration / 2,
            ease: config.ease || 'power2.inOut'
          })
          .set(to, { alpha: 0 })
          .to(to, {
            alpha: 1,
            duration: config.duration / 2,
            ease: config.ease || 'power2.inOut'
          });
        break;
        
      case 'slide':
        const direction = config.direction || { x: 0, y: -1 };
        const distance = config.distance || 100;
        
        to.x = from.x - direction.x * distance;
        to.y = from.y - direction.y * distance;
        
        timeline
          .to(from, {
            x: from.x + direction.x * distance,
            y: from.y + direction.y * distance,
            duration: config.duration,
            ease: config.ease || 'power2.inOut'
          })
          .to(to, {
            x: from.x,
            y: from.y,
            duration: config.duration,
            ease: config.ease || 'power2.inOut'
          }, 0);
        break;
        
      case 'scale':
        to.scale.set(0);
        timeline
          .to(from.scale, {
            x: 0,
            y: 0,
            duration: config.duration / 2,
            ease: config.ease || 'back.in'
          })
          .to(to.scale, {
            x: 1,
            y: 1,
            duration: config.duration / 2,
            ease: config.ease || 'back.out'
          });
        break;
    }
    
    this.activeAnimations.set(animId, timeline);
    await timeline.then();
  }
  
  stopAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.kill();
      this.activeAnimations.delete(id);
    }
    
    if (this.activeAnimations.size === 0) {
      this.state = 'idle';
    }
  }
  
  stopAllAnimations(): void {
    this.activeAnimations.forEach(animation => {
      animation.kill();
    });
    this.activeAnimations.clear();
    this.state = 'idle';
  }
  
  pauseAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.pause();
      this.state = 'paused';
    }
  }
  
  resumeAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.resume();
      this.state = 'playing';
    }
  }
  
  getAnimationState(): AnimationState {
    return this.state;
  }
  
  isAnimating(): boolean {
    return this.activeAnimations.size > 0;
  }
  
  private setupDefaultConfigs(): void {
    // Default spin animation
    this.animationConfigs.set('spin', {
      type: 'spin',
      duration: 1000,
      ease: 'power2.inOut'
    });
    
    // Default win animation
    this.animationConfigs.set('win', {
      type: 'win',
      duration: 2000,
      ease: 'elastic.out'
    });
    
    // Default transition
    this.animationConfigs.set('transition', {
      type: 'transition',
      duration: 500,
      ease: 'power2.inOut'
    });
  }
  
  private createParticleEffect(
    target: PIXI.DisplayObject,
    config: any
  ): void {
    // Create particle container
    const particleContainer = new PIXI.Container();
    particleContainer.x = target.x;
    particleContainer.y = target.y;
    
    if (target.parent) {
      target.parent.addChild(particleContainer);
    }
    
    // Create particles
    const particles: PIXI.Graphics[] = [];
    for (let i = 0; i < config.count; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(config.color || 0xFFD700);
      particle.drawCircle(0, 0, config.size || 2);
      particle.endFill();
      
      particleContainer.addChild(particle);
      particles.push(particle);
    }
    
    // Animate particles
    particles.forEach((particle, index) => {
      const angle = (index / config.count) * Math.PI * 2;
      const distance = config.spread || 100;
      
      gsap.to(particle, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        alpha: 0,
        duration: config.duration || 1,
        ease: config.ease || 'power2.out',
        onComplete: () => {
          particle.destroy();
          if (particleContainer.children.length === 0) {
            particleContainer.destroy();
          }
        }
      });
    });
  }
}