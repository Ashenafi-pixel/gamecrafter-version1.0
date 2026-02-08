import { DetectedElement, ElementType, AnimationPotential } from './universalAnimationDetection';

export interface UniversalKeyframe {
  time: number;
  properties: Record<string, number>;
  easing: string;
}

export interface UniversalAnimation {
  elementId: string;
  elementType: ElementType;
  keyframes: UniversalKeyframe[];
  duration: number;
  priority: number; // Higher priority animations take precedence
}

export interface UniversalAnimationPreset {
  id: string;
  name: string;
  description: string;
  animations: UniversalAnimation[];
  totalDuration: number;
  complexity: 'low' | 'medium' | 'high';
  performance: {
    estimatedFPS: number;
    mobileOptimized: boolean;
  };
}

class UniversalAnimationEngine {
  
  /**
   * Generate animations for any detected elements
   */
  generateUniversalAnimations(elements: DetectedElement[], animationType: string = 'idle'): UniversalAnimationPreset {
    console.log(`🎭 Generating universal ${animationType} animations for ${elements.length} elements...`);
    
    const animations: UniversalAnimation[] = [];
    let maxDuration = 3; // Default duration
    
    for (const element of elements) {
      const animation = this.createAnimationForElement(element, animationType);
      animations.push(animation);
      maxDuration = Math.max(maxDuration, animation.duration);
    }
    
    const complexity = this.calculateComplexity(animations);
    const performance = this.estimatePerformance(animations);
    
    const preset: UniversalAnimationPreset = {
      id: `universal-${animationType}-${Date.now()}`,
      name: `${this.capitalizeFirst(animationType)} Animation`,
      description: `Universal ${animationType} animation for ${elements.length} detected elements`,
      animations,
      totalDuration: maxDuration,
      complexity,
      performance
    };
    
    console.log(`✅ Generated universal preset: ${preset.name} (${preset.complexity} complexity)`);
    return preset;
  }
  
  /**
   * Create appropriate animation based on element type
   */
  private createAnimationForElement(element: DetectedElement, animationType: string): UniversalAnimation {
    console.log(`🎨 Creating ${animationType} animation for ${element.type}: ${element.name}`);
    
    let keyframes: UniversalKeyframe[];
    let duration = 3;
    let priority = this.getElementPriority(element.animationPotential);
    
    // Generate keyframes based on element type and animation type
    switch (element.type) {
      case 'wings':
        keyframes = this.createWingsAnimation(element, animationType);
        duration = animationType === 'idle' ? 2 : 3;
        break;
        
      case 'tail':
        keyframes = this.createTailAnimation(element, animationType);
        duration = animationType === 'idle' ? 4 : 3;
        break;
        
      case 'limbs':
      case 'legs':
        keyframes = this.createLimbsAnimation(element, animationType);
        duration = animationType === 'idle' ? 3 : 2;
        break;
        
      case 'flowing':
        keyframes = this.createFlowingAnimation(element, animationType);
        duration = animationType === 'idle' ? 5 : 3;
        break;
        
      case 'appendage':
        keyframes = this.createAppendageAnimation(element, animationType);
        duration = animationType === 'idle' ? 3 : 2;
        break;
        
      case 'decorative':
        keyframes = this.createDecorativeAnimation(element, animationType);
        duration = animationType === 'idle' ? 6 : 4;
        break;
        
      case 'effects':
        keyframes = this.createEffectsAnimation(element, animationType);
        duration = animationType === 'idle' ? 2 : 1.5;
        break;
        
      case 'facial':
        keyframes = this.createFacialAnimation(element, animationType);
        duration = animationType === 'idle' ? 4 : 2;
        break;
        
      case 'accessory':
        keyframes = this.createAccessoryAnimation(element, animationType);
        duration = animationType === 'idle' ? 3 : 2;
        break;
        
      case 'body':
      default:
        keyframes = this.createBodyAnimation(element, animationType);
        duration = animationType === 'idle' ? 4 : 3;
        break;
    }
    
    return {
      elementId: element.id,
      elementType: element.type,
      keyframes,
      duration,
      priority
    };
  }
  
  /**
   * Wings animation (birds, insects, dragons, etc.)
   */
  private createWingsAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    const constraints = element.movementConstraints;
    const maxRotation = Math.min(constraints.maxRotation, 60) * (Math.PI / 180); // Convert to radians
    const isLeftWing = element.id.includes('left') || element.attachmentPoint.x < 50;
    const wingMultiplier = isLeftWing ? 1 : -1;
    
    if (type === 'idle') {
      // Natural wing flutter
      return [
        { time: 0, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.2, properties: { rotation: maxRotation * 0.7 * wingMultiplier, scaleX: 1.1, scaleY: 0.95, alpha: 0.95 }, easing: 'ease-out' },
        { time: 0.4, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.6, properties: { rotation: -maxRotation * 0.5 * wingMultiplier, scaleX: 0.95, scaleY: 1.05, alpha: 0.98 }, easing: 'ease-in' },
        { time: 1, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' }
      ];
    } else if (type === 'win') {
      // Celebration wing spread
      return [
        { time: 0, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-out' },
        { time: 0.3, properties: { rotation: maxRotation * 1.2 * wingMultiplier, scaleX: 1.3, scaleY: 1.2, alpha: 1 }, easing: 'ease-out' },
        { time: 0.7, properties: { rotation: maxRotation * 0.8 * wingMultiplier, scaleX: 1.2, scaleY: 1.1, alpha: 0.9 }, easing: 'ease-in-out' },
        { time: 1, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in' }
      ];
    }
    
    // Default gentle animation
    return [
      { time: 0, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
      { time: 0.5, properties: { rotation: maxRotation * 0.3 * wingMultiplier, scaleX: 1.05, scaleY: 1.05, alpha: 0.95 }, easing: 'ease-in-out' },
      { time: 1, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Tail animation (cats, dogs, dragons, etc.)
   */
  private createTailAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    const constraints = element.movementConstraints;
    const maxRotation = Math.min(constraints.maxRotation, 45) * (Math.PI / 180);
    
    if (type === 'idle') {
      // Natural tail sway
      return [
        { time: 0, properties: { rotation: 0, x: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.25, properties: { rotation: maxRotation * 0.6, x: 3, scaleX: 1.02, alpha: 1 }, easing: 'ease-out' },
        { time: 0.5, properties: { rotation: 0, x: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.75, properties: { rotation: -maxRotation * 0.4, x: -2, scaleX: 0.98, alpha: 1 }, easing: 'ease-in' },
        { time: 1, properties: { rotation: 0, x: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' }
      ];
    } else if (type === 'win') {
      // Excited tail wagging
      return [
        { time: 0, properties: { rotation: 0, x: 0, scaleY: 1, alpha: 1 }, easing: 'ease-out' },
        { time: 0.15, properties: { rotation: maxRotation * 1.2, x: 5, scaleY: 1.1, alpha: 1 }, easing: 'ease-out' },
        { time: 0.3, properties: { rotation: -maxRotation * 1.2, x: -5, scaleY: 1.1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.45, properties: { rotation: maxRotation * 1.0, x: 4, scaleY: 1.05, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.6, properties: { rotation: -maxRotation * 1.0, x: -4, scaleY: 1.05, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.8, properties: { rotation: maxRotation * 0.5, x: 2, scaleY: 1.02, alpha: 1 }, easing: 'ease-in' },
        { time: 1, properties: { rotation: 0, x: 0, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' }
      ];
    }
    
    // Default gentle sway
    return [
      { time: 0, properties: { rotation: 0, x: 0, alpha: 1 }, easing: 'ease-in-out' },
      { time: 0.5, properties: { rotation: maxRotation * 0.3, x: 2, alpha: 1 }, easing: 'ease-in-out' },
      { time: 1, properties: { rotation: 0, x: 0, alpha: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Limbs animation (legs, arms, etc.)
   */
  private createLimbsAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    if (type === 'idle') {
      // Subtle limb movement
      return [
        { time: 0, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.5, properties: { rotation: 0.1, scaleX: 1.02, scaleY: 0.98, alpha: 1 }, easing: 'ease-in-out' },
        { time: 1, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' }
      ];
    } else if (type === 'win') {
      // Celebration movement
      return [
        { time: 0, properties: { rotation: 0, y: 0, scaleX: 1, alpha: 1 }, easing: 'ease-out' },
        { time: 0.3, properties: { rotation: 0.2, y: -5, scaleX: 1.1, alpha: 1 }, easing: 'ease-out' },
        { time: 0.6, properties: { rotation: -0.1, y: 2, scaleX: 0.95, alpha: 1 }, easing: 'ease-in-out' },
        { time: 1, properties: { rotation: 0, y: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in' }
      ];
    }
    
    return [
      { time: 0, properties: { rotation: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' },
      { time: 1, properties: { rotation: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Flowing elements (hair, mane, fabric, etc.)
   */
  private createFlowingAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    if (type === 'idle') {
      // Gentle flowing motion
      return [
        { time: 0, properties: { rotation: 0, x: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.3, properties: { rotation: 0.15, x: 2, scaleX: 1.03, scaleY: 0.98, alpha: 1 }, easing: 'ease-out' },
        { time: 0.7, properties: { rotation: -0.1, x: -1, scaleX: 0.98, scaleY: 1.02, alpha: 1 }, easing: 'ease-in-out' },
        { time: 1, properties: { rotation: 0, x: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in' }
      ];
    }
    
    return [
      { time: 0, properties: { rotation: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' },
      { time: 0.5, properties: { rotation: 0.1, scaleX: 1.02, alpha: 1 }, easing: 'ease-in-out' },
      { time: 1, properties: { rotation: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Generic appendage animation
   */
  private createAppendageAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    const constraints = element.movementConstraints;
    const maxRotation = Math.min(constraints.maxRotation, 30) * (Math.PI / 180);
    
    if (type === 'idle') {
      return [
        { time: 0, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.4, properties: { rotation: maxRotation * 0.5, scaleX: 1.05, scaleY: 0.98, alpha: 1 }, easing: 'ease-out' },
        { time: 0.8, properties: { rotation: -maxRotation * 0.3, scaleX: 0.98, scaleY: 1.02, alpha: 1 }, easing: 'ease-in' },
        { time: 1, properties: { rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' }
      ];
    }
    
    return [
      { time: 0, properties: { rotation: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' },
      { time: 0.5, properties: { rotation: maxRotation * 0.3, scaleX: 1.03, alpha: 1 }, easing: 'ease-in-out' },
      { time: 1, properties: { rotation: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Decorative elements animation
   */
  private createDecorativeAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    if (type === 'idle') {
      // Very subtle movement
      return [
        { time: 0, properties: { alpha: 1, scaleX: 1, scaleY: 1 }, easing: 'ease-in-out' },
        { time: 0.5, properties: { alpha: 0.95, scaleX: 1.01, scaleY: 1.01 }, easing: 'ease-in-out' },
        { time: 1, properties: { alpha: 1, scaleX: 1, scaleY: 1 }, easing: 'ease-in-out' }
      ];
    } else if (type === 'win') {
      // Sparkling effect
      return [
        { time: 0, properties: { alpha: 1, scaleX: 1, scaleY: 1, rotation: 0 }, easing: 'ease-out' },
        { time: 0.2, properties: { alpha: 1.2, scaleX: 1.1, scaleY: 1.1, rotation: 0.1 }, easing: 'ease-out' },
        { time: 0.5, properties: { alpha: 0.8, scaleX: 0.9, scaleY: 0.9, rotation: -0.05 }, easing: 'ease-in-out' },
        { time: 0.8, properties: { alpha: 1.1, scaleX: 1.05, scaleY: 1.05, rotation: 0.05 }, easing: 'ease-in' },
        { time: 1, properties: { alpha: 1, scaleX: 1, scaleY: 1, rotation: 0 }, easing: 'ease-in-out' }
      ];
    }
    
    return [
      { time: 0, properties: { alpha: 1, scaleX: 1 }, easing: 'ease-in-out' },
      { time: 1, properties: { alpha: 1, scaleX: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Effects animation (magical auras, energy, etc.)
   */
  private createEffectsAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    if (type === 'idle') {
      // Pulsing effect
      return [
        { time: 0, properties: { alpha: 0.7, scaleX: 1, scaleY: 1 }, easing: 'ease-in-out' },
        { time: 0.5, properties: { alpha: 1, scaleX: 1.05, scaleY: 1.05 }, easing: 'ease-in-out' },
        { time: 1, properties: { alpha: 0.7, scaleX: 1, scaleY: 1 }, easing: 'ease-in-out' }
      ];
    } else if (type === 'win') {
      // Explosive effect
      return [
        { time: 0, properties: { alpha: 0.5, scaleX: 1, scaleY: 1, rotation: 0 }, easing: 'ease-out' },
        { time: 0.3, properties: { alpha: 1.5, scaleX: 1.3, scaleY: 1.3, rotation: 0.2 }, easing: 'ease-out' },
        { time: 0.7, properties: { alpha: 1, scaleX: 1.1, scaleY: 1.1, rotation: -0.1 }, easing: 'ease-in' },
        { time: 1, properties: { alpha: 0.8, scaleX: 1, scaleY: 1, rotation: 0 }, easing: 'ease-in-out' }
      ];
    }
    
    return [
      { time: 0, properties: { alpha: 0.8, scaleX: 1 }, easing: 'ease-in-out' },
      { time: 0.5, properties: { alpha: 1, scaleX: 1.02 }, easing: 'ease-in-out' },
      { time: 1, properties: { alpha: 0.8, scaleX: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Facial features animation
   */
  private createFacialAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    if (type === 'idle') {
      // Subtle blinking or expression change
      return [
        { time: 0, properties: { scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.9, properties: { scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.95, properties: { scaleY: 0.1, alpha: 0.8 }, easing: 'ease-in' },
        { time: 1, properties: { scaleY: 1, alpha: 1 }, easing: 'ease-out' }
      ];
    }
    
    return [
      { time: 0, properties: { alpha: 1, scaleX: 1 }, easing: 'ease-in-out' },
      { time: 1, properties: { alpha: 1, scaleX: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Accessory animation
   */
  private createAccessoryAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    if (type === 'idle') {
      return [
        { time: 0, properties: { rotation: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.5, properties: { rotation: 0.05, scaleX: 1.02, alpha: 1 }, easing: 'ease-in-out' },
        { time: 1, properties: { rotation: 0, scaleX: 1, alpha: 1 }, easing: 'ease-in-out' }
      ];
    }
    
    return [
      { time: 0, properties: { scaleX: 1, alpha: 1 }, easing: 'ease-in-out' },
      { time: 1, properties: { scaleX: 1, alpha: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Body animation (usually minimal)
   */
  private createBodyAnimation(element: DetectedElement, type: string): UniversalKeyframe[] {
    if (type === 'idle') {
      // Subtle breathing
      return [
        { time: 0, properties: { scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
        { time: 0.5, properties: { scaleX: 1.02, scaleY: 1.02, alpha: 0.98 }, easing: 'ease-in-out' },
        { time: 1, properties: { scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' }
      ];
    } else if (type === 'win') {
      // Celebration pulse
      return [
        { time: 0, properties: { scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-out' },
        { time: 0.3, properties: { scaleX: 1.1, scaleY: 1.1, alpha: 1 }, easing: 'ease-out' },
        { time: 0.7, properties: { scaleX: 1.05, scaleY: 1.05, alpha: 0.95 }, easing: 'ease-in' },
        { time: 1, properties: { scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' }
      ];
    }
    
    return [
      { time: 0, properties: { scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' },
      { time: 1, properties: { scaleX: 1, scaleY: 1, alpha: 1 }, easing: 'ease-in-out' }
    ];
  }
  
  /**
   * Helper methods
   */
  private getElementPriority(potential: AnimationPotential): number {
    switch (potential) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }
  
  private calculateComplexity(animations: UniversalAnimation[]): 'low' | 'medium' | 'high' {
    const totalKeyframes = animations.reduce((sum, anim) => sum + anim.keyframes.length, 0);
    const highPriorityCount = animations.filter(anim => anim.priority >= 3).length;
    
    if (totalKeyframes > 20 || highPriorityCount > 3) return 'high';
    if (totalKeyframes > 10 || highPriorityCount > 1) return 'medium';
    return 'low';
  }
  
  private estimatePerformance(animations: UniversalAnimation[]) {
    const complexity = this.calculateComplexity(animations);
    const elementCount = animations.length;
    
    let estimatedFPS = 60;
    if (complexity === 'high' || elementCount > 5) estimatedFPS = 45;
    if (complexity === 'high' && elementCount > 5) estimatedFPS = 30;
    
    return {
      estimatedFPS,
      mobileOptimized: estimatedFPS >= 45 && complexity !== 'high'
    };
  }
  
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const universalAnimationEngine = new UniversalAnimationEngine();