/**
 * Sophisticated Animation Orchestrator
 * Creates and manages complex, contextually appropriate animations
 */

import { DetectedElement } from '../ai/AIElementDetector';

export interface AnimationRule {
  elementId: string;
  animation: {
    type: 'rotate' | 'pulse' | 'sparkle' | 'flow' | 'cascade' | 'swing' | 'orbit' | 'illuminate';
    duration: number;
    intensity: number;
    easing: string;
    triggers: string[];
    physics?: {
      velocity?: { x: number; y: number };
      acceleration?: { x: number; y: number };
      rotation?: number;
      scale?: { x: number; y: number };
    };
  };
}

export class SophisticatedAnimationOrchestrator {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private elements: DetectedElement[] = [];
  private animationRules: AnimationRule[] = [];
  private isRunning = false;
  private animationFrame: number | null = null;
  private startTime = 0;
  private symbolImage: HTMLImageElement | null = null;

  /**
   * Initialize the animation engine
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Failed to get canvas context');
    }

    console.log('✨ [Animation Orchestrator] Initialized');
  }

  /**
   * Load symbol and elements for animation
   */
  async loadSymbol(symbolImageBase64: string, elements: DetectedElement[]): Promise<void> {
    this.elements = elements;
    
    // Load the symbol image
    this.symbolImage = new Image();
    this.symbolImage.onload = () => {
      console.log('🖼️ [Animation Orchestrator] Symbol image loaded');
    };
    this.symbolImage.src = symbolImageBase64;

    console.log(`🎯 [Animation Orchestrator] Loaded ${elements.length} elements`);
  }

  /**
   * Generate sophisticated animation rules based on element analysis
   */
  async generateAnimationRules(elements: DetectedElement[]): Promise<AnimationRule[]> {
    console.log('🎬 [Animation Orchestrator] Generating sophisticated animation rules...');

    const rules: AnimationRule[] = [];

    for (const element of elements) {
      const rule = this.createAnimationRule(element, elements);
      rules.push(rule);
    }

    console.log(`✅ [Animation Orchestrator] Generated ${rules.length} animation rules`);
    return rules;
  }

  /**
   * Create an animation rule for a specific element
   */
  private createAnimationRule(element: DetectedElement, allElements: DetectedElement[]): AnimationRule {
    const energy = element.properties.energy || 5;
    const relationships = element.relationships;

    // Base animation based on element type
    let baseAnimation = this.getBaseAnimation(element);

    // Modify animation based on relationships
    if (relationships.length > 0) {
      baseAnimation = this.enhanceAnimationWithRelationships(baseAnimation, relationships, element);
    }

    // Adjust intensity based on energy level
    baseAnimation.intensity *= (energy / 5);
    
    // Adjust duration based on physics properties
    if (element.properties.physics === 'energy') {
      baseAnimation.duration *= 0.7; // Faster for energy elements
    } else if (element.properties.physics === 'solid') {
      baseAnimation.duration *= 1.3; // Slower for solid elements
    }

    return {
      elementId: element.id,
      animation: baseAnimation
    };
  }

  /**
   * Get base animation for element type
   */
  private getBaseAnimation(element: DetectedElement) {
    const baseIntensity = 1.0;
    const baseDuration = 2000;

    switch (element.type) {
      case 'gem':
        return {
          type: 'rotate' as const,
          duration: baseDuration,
          intensity: baseIntensity,
          easing: 'ease-in-out',
          triggers: ['sparkle', 'illuminate'],
          physics: {
            rotation: 0.02,
            scale: { x: 1, y: 1 }
          }
        };

      case 'star':
        return {
          type: 'pulse' as const,
          duration: baseDuration * 0.8,
          intensity: baseIntensity * 1.2,
          easing: 'ease-out',
          triggers: ['illuminate'],
          physics: {
            scale: { x: 1.1, y: 1.1 },
            rotation: 0.01
          }
        };

      case 'sparkle':
        return {
          type: 'sparkle' as const,
          duration: baseDuration * 0.5,
          intensity: baseIntensity * 1.5,
          easing: 'ease-in-out',
          triggers: ['cascade'],
          physics: {
            velocity: { x: Math.random() - 0.5, y: Math.random() - 0.5 },
            scale: { x: 0.8, y: 0.8 }
          }
        };

      case 'fire':
        return {
          type: 'flow' as const,
          duration: baseDuration * 0.6,
          intensity: baseIntensity * 1.8,
          easing: 'linear',
          triggers: ['sparkle', 'illuminate'],
          physics: {
            velocity: { x: 0, y: -0.5 },
            scale: { x: 1.2, y: 1.2 }
          }
        };

      case 'beam':
        return {
          type: 'illuminate' as const,
          duration: baseDuration * 1.5,
          intensity: baseIntensity * 0.8,
          easing: 'ease-in-out',
          triggers: ['sweep'],
          physics: {
            scale: { x: 1, y: 3 },
            rotation: 0
          }
        };

      case 'character':
        return {
          type: 'swing' as const,
          duration: baseDuration * 1.2,
          intensity: baseIntensity * 0.7,
          easing: 'ease-in-out',
          triggers: ['weapon_swing'],
          physics: {
            rotation: 0.005,
            scale: { x: 1, y: 1 }
          }
        };

      case 'weapon':
        return {
          type: 'swing' as const,
          duration: baseDuration,
          intensity: baseIntensity,
          easing: 'ease-out',
          triggers: ['attached_swing'],
          physics: {
            rotation: 0.1,
            velocity: { x: 0.2, y: 0 }
          }
        };

      default:
        return {
          type: 'pulse' as const,
          duration: baseDuration,
          intensity: baseIntensity,
          easing: 'ease-in-out',
          triggers: [],
          physics: {
            scale: { x: 1.05, y: 1.05 }
          }
        };
    }
  }

  /**
   * Enhance animation based on element relationships
   */
  private enhanceAnimationWithRelationships(
    baseAnimation: any, 
    relationships: DetectedElement['relationships'],
    element: DetectedElement
  ) {
    const enhanced = { ...baseAnimation };

    for (const relationship of relationships) {
      switch (relationship.type) {
        case 'attracts':
          enhanced.intensity *= (1 + relationship.strength * 0.5);
          enhanced.triggers.push('magnetic_pull');
          break;

        case 'orbits':
          enhanced.type = 'orbit';
          enhanced.duration *= (1 + relationship.strength);
          enhanced.physics = {
            ...enhanced.physics,
            velocity: { 
              x: relationship.strength * 0.3, 
              y: relationship.strength * 0.3 
            }
          };
          break;

        case 'sparkles_from':
          enhanced.triggers.push('cascade', 'sparkle_burst');
          enhanced.intensity *= (1 + relationship.strength * 0.8);
          break;

        case 'illuminates':
          enhanced.triggers.push('glow', 'light_wave');
          enhanced.physics = {
            ...enhanced.physics,
            scale: { 
              x: 1 + relationship.strength * 0.3, 
              y: 1 + relationship.strength * 0.3 
            }
          };
          break;

        case 'attached_to':
          enhanced.type = 'swing';
          enhanced.physics = {
            ...enhanced.physics,
            rotation: relationship.strength * 0.05
          };
          break;
      }
    }

    return enhanced;
  }

  /**
   * Apply animation rules to elements
   */
  async applyAnimationRules(rules: AnimationRule[]): Promise<void> {
    this.animationRules = rules;
    console.log(`🎪 [Animation Orchestrator] Applied ${rules.length} animation rules`);
  }

  /**
   * Start the animation orchestration
   */
  startOrchestration(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = Date.now();
    this.animate();
    
    console.log('🎭 [Animation Orchestrator] Orchestration started');
  }

  /**
   * Stop the animation orchestration
   */
  stopOrchestration(): void {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    console.log('⏹️ [Animation Orchestrator] Orchestration stopped');
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw base symbol
    if (this.symbolImage && this.symbolImage.complete) {
      this.ctx.drawImage(this.symbolImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    // Apply sophisticated animations to each element
    for (const rule of this.animationRules) {
      this.applyElementAnimation(rule, elapsed);
    }

    // Continue animation loop
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  /**
   * Apply animation to a specific element
   */
  private applyElementAnimation(rule: AnimationRule, elapsed: number): void {
    const element = this.elements.find(e => e.id === rule.elementId);
    if (!element || !this.ctx) return;

    const { animation } = rule;
    const progress = (elapsed % animation.duration) / animation.duration;
    const easedProgress = this.applyEasing(progress, animation.easing);

    // Calculate animation transforms
    const transforms = this.calculateTransforms(animation, easedProgress, elapsed);

    // Draw animated element
    this.drawAnimatedElement(element, transforms);
  }

  /**
   * Calculate animation transforms
   */
  private calculateTransforms(animation: any, progress: number, elapsed: number) {
    const transforms = {
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      alpha: 1
    };

    switch (animation.type) {
      case 'rotate':
        transforms.rotation = progress * Math.PI * 2 * animation.intensity;
        break;

      case 'pulse':
        const pulse = Math.sin(progress * Math.PI * 2) * animation.intensity;
        transforms.scaleX = 1 + pulse * 0.2;
        transforms.scaleY = 1 + pulse * 0.2;
        transforms.alpha = 0.7 + pulse * 0.3;
        break;

      case 'sparkle':
        transforms.alpha = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
        transforms.scaleX = 0.8 + Math.sin(progress * Math.PI * 3) * 0.4;
        transforms.scaleY = transforms.scaleX;
        break;

      case 'orbit':
        const angle = progress * Math.PI * 2;
        const radius = 30 * animation.intensity;
        transforms.x = Math.cos(angle) * radius;
        transforms.y = Math.sin(angle) * radius;
        break;

      case 'swing':
        const swing = Math.sin(progress * Math.PI * 2) * animation.intensity;
        transforms.rotation = swing * 0.3;
        transforms.x = swing * 10;
        break;

      case 'flow':
        transforms.y = -progress * 50 * animation.intensity;
        transforms.alpha = 1 - progress * 0.5;
        break;

      case 'illuminate':
        const glow = Math.sin(progress * Math.PI) * animation.intensity;
        transforms.scaleX = 1 + glow * 0.5;
        transforms.scaleY = 1 + glow * 0.5;
        transforms.alpha = 0.8 + glow * 0.2;
        break;
    }

    return transforms;
  }

  /**
   * Draw an animated element
   */
  private drawAnimatedElement(element: DetectedElement, transforms: any): void {
    if (!this.ctx) return;

    this.ctx.save();

    // Apply transforms
    this.ctx.translate(
      element.position.x + transforms.x,
      element.position.y + transforms.y
    );
    this.ctx.rotate(transforms.rotation);
    this.ctx.scale(transforms.scaleX, transforms.scaleY);
    this.ctx.globalAlpha = transforms.alpha;

    // Draw element based on type
    this.drawElementShape(element);

    this.ctx.restore();
  }

  /**
   * Draw element shape based on type
   */
  private drawElementShape(element: DetectedElement): void {
    if (!this.ctx) return;

    const size = Math.min(element.bounds.width, element.bounds.height) || 20;
    
    this.ctx.beginPath();

    switch (element.type) {
      case 'gem':
        // Draw diamond shape
        this.ctx.moveTo(0, -size/2);
        this.ctx.lineTo(size/2, 0);
        this.ctx.lineTo(0, size/2);
        this.ctx.lineTo(-size/2, 0);
        this.ctx.closePath();
        this.ctx.fillStyle = element.properties.color || '#4FC3F7';
        this.ctx.fill();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        break;

      case 'star':
        // Draw star shape
        this.drawStar(0, 0, size/2, size/4, 5);
        this.ctx.fillStyle = element.properties.color || '#FFD700';
        this.ctx.fill();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        break;

      case 'sparkle':
        // Draw sparkle
        this.ctx.arc(0, 0, size/4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
        break;

      case 'fire':
        // Draw flame shape
        this.ctx.ellipse(0, 0, size/3, size/2, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.fill();
        break;

      default:
        // Draw circle
        this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        this.ctx.fillStyle = element.properties.color || '#90A4AE';
        this.ctx.fill();
        break;
    }
  }

  /**
   * Draw star shape
   */
  private drawStar(cx: number, cy: number, outerRadius: number, innerRadius: number, points: number): void {
    if (!this.ctx) return;

    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / points;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < points; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }

    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
  }

  /**
   * Apply easing function
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'linear':
      default:
        return t;
    }
  }
}