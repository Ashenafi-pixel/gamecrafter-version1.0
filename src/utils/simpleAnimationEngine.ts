/**
 * Simple Animation Engine
 * AI-powered animation generation for Simple Mode
 */

interface AnimationKeyframe {
  time: number;
  properties: {
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    alpha?: number;
  };
  ease?: string;
}

interface SpriteAnimation {
  spriteId: string;
  duration: number;
  loop: boolean;
  keyframes: AnimationKeyframe[];
}

interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  baseAnimation: (sprite: any, index: number) => SpriteAnimation;
}

class SimpleAnimationEngine {
  private presets: Map<string, AnimationPreset> = new Map();

  constructor() {
    this.initializePresets();
  }

  private initializePresets() {
    // Gem Slot Preset - Subtle sparkle and bounce
    this.presets.set('gem_slot', {
      id: 'gem_slot',
      name: 'Gem Slot',
      description: 'Sparkling gems with subtle bounces',
      baseAnimation: (sprite: any, index: number) => ({
        spriteId: sprite.name,
        duration: 2000 + (index * 200), // Staggered timing
        loop: true,
        keyframes: [
          {
            time: 0,
            properties: { y: 0, scaleX: 1, scaleY: 1, alpha: 1 },
            ease: 'power2.inOut'
          },
          {
            time: 0.3,
            properties: { y: -8, scaleX: 1.05, scaleY: 1.05, alpha: 1 },
            ease: 'power2.out'
          },
          {
            time: 0.6,
            properties: { y: 0, scaleX: 1, scaleY: 1, alpha: 0.9 },
            ease: 'bounce.out'
          },
          {
            time: 1,
            properties: { y: 0, scaleX: 1, scaleY: 1, alpha: 1 },
            ease: 'power2.inOut'
          }
        ]
      })
    });

    // Character Slot Preset - Breathing and personality
    this.presets.set('character_slot', {
      id: 'character_slot',
      name: 'Character Slot',
      description: 'Breathing characters with personality',
      baseAnimation: (sprite: any, index: number) => ({
        spriteId: sprite.name,
        duration: 3000 + (index * 150),
        loop: true,
        keyframes: [
          {
            time: 0,
            properties: { scaleX: 1, scaleY: 1, rotation: 0 },
            ease: 'power1.inOut'
          },
          {
            time: 0.4,
            properties: { scaleX: 1.02, scaleY: 0.98, rotation: 1 },
            ease: 'power1.inOut'
          },
          {
            time: 0.8,
            properties: { scaleX: 0.98, scaleY: 1.02, rotation: -1 },
            ease: 'power1.inOut'
          },
          {
            time: 1,
            properties: { scaleX: 1, scaleY: 1, rotation: 0 },
            ease: 'power1.inOut'
          }
        ]
      })
    });

    // Scatter Text Preset - Wave reveal
    this.presets.set('scatter_text', {
      id: 'scatter_text',
      name: 'Scatter Text',
      description: 'Bouncy wave text reveals',
      baseAnimation: (sprite: any, index: number) => ({
        spriteId: sprite.name,
        duration: 1500,
        loop: true,
        keyframes: [
          {
            time: 0,
            properties: { y: 20, alpha: 0, scaleX: 0.8, scaleY: 0.8 },
            ease: 'back.out(1.7)'
          },
          {
            time: 0.2 + (index * 0.1), // Wave effect
            properties: { y: -10, alpha: 1, scaleX: 1.1, scaleY: 1.1 },
            ease: 'back.out(1.7)'
          },
          {
            time: 0.4 + (index * 0.1),
            properties: { y: 0, alpha: 1, scaleX: 1, scaleY: 1 },
            ease: 'elastic.out(1, 0.5)'
          },
          {
            time: 1,
            properties: { y: 0, alpha: 1, scaleX: 1, scaleY: 1 },
            ease: 'power2.inOut'
          }
        ]
      })
    });

    // Wild Symbol Preset - Power and energy
    this.presets.set('wild_symbol', {
      id: 'wild_symbol',
      name: 'Wild Symbol',
      description: 'Powerful glow and energy effects',
      baseAnimation: (sprite: any, index: number) => ({
        spriteId: sprite.name,
        duration: 2500 + (index * 100),
        loop: true,
        keyframes: [
          {
            time: 0,
            properties: { scaleX: 1, scaleY: 1, alpha: 1, rotation: 0 },
            ease: 'power2.inOut'
          },
          {
            time: 0.2,
            properties: { scaleX: 1.15, scaleY: 1.15, alpha: 0.8, rotation: 2 },
            ease: 'power2.out'
          },
          {
            time: 0.5,
            properties: { scaleX: 0.95, scaleY: 0.95, alpha: 1, rotation: -1 },
            ease: 'power2.inOut'
          },
          {
            time: 0.8,
            properties: { scaleX: 1.05, scaleY: 1.05, alpha: 0.9, rotation: 1 },
            ease: 'power2.inOut'
          },
          {
            time: 1,
            properties: { scaleX: 1, scaleY: 1, alpha: 1, rotation: 0 },
            ease: 'power2.inOut'
          }
        ]
      })
    });

    // Classic Fruit Preset - Simple pulses
    this.presets.set('classic_fruit', {
      id: 'classic_fruit',
      name: 'Classic Fruit',
      description: 'Simple pulses and gentle movement',
      baseAnimation: (sprite: any, index: number) => ({
        spriteId: sprite.name,
        duration: 4000 + (index * 300),
        loop: true,
        keyframes: [
          {
            time: 0,
            properties: { scaleX: 1, scaleY: 1, alpha: 1 },
            ease: 'sine.inOut'
          },
          {
            time: 0.5,
            properties: { scaleX: 1.03, scaleY: 1.03, alpha: 0.95 },
            ease: 'sine.inOut'
          },
          {
            time: 1,
            properties: { scaleX: 1, scaleY: 1, alpha: 1 },
            ease: 'sine.inOut'
          }
        ]
      })
    });

    // Bonus Special Preset - Celebration bursts
    this.presets.set('bonus_special', {
      id: 'bonus_special',
      name: 'Bonus Special',
      description: 'Exciting burst and celebration',
      baseAnimation: (sprite: any, index: number) => ({
        spriteId: sprite.name,
        duration: 1800 + (index * 200),
        loop: true,
        keyframes: [
          {
            time: 0,
            properties: { scaleX: 1, scaleY: 1, rotation: 0, alpha: 1 },
            ease: 'back.out(1.7)'
          },
          {
            time: 0.15,
            properties: { scaleX: 1.3, scaleY: 1.3, rotation: 5, alpha: 0.8 },
            ease: 'back.out(2)'
          },
          {
            time: 0.3,
            properties: { scaleX: 0.9, scaleY: 0.9, rotation: -3, alpha: 1 },
            ease: 'elastic.out(1, 0.3)'
          },
          {
            time: 0.6,
            properties: { scaleX: 1.1, scaleY: 1.1, rotation: 2, alpha: 0.9 },
            ease: 'power2.inOut'
          },
          {
            time: 1,
            properties: { scaleX: 1, scaleY: 1, rotation: 0, alpha: 1 },
            ease: 'power2.inOut'
          }
        ]
      })
    });
  }

  /**
   * Apply preset animation to sprites
   */
  applyPreset(presetId: string, sprites: any[]): SpriteAnimation[] {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    return sprites.map((sprite, index) => preset.baseAnimation(sprite, index));
  }

  /**
   * Auto-animate with AI analysis
   */
  autoAnimate(sprites: any[]): SpriteAnimation[] {
    // Analyze sprite types and suggest best animations
    const spriteTypes = this.analyzeSpriteTypes(sprites);
    const recommendations = this.getAnimationRecommendations(spriteTypes);

    console.log('🤖 AI Analysis:', { spriteTypes, recommendations });

    return sprites.map((sprite, index) => {
      const spriteType = sprite.type || 'object';
      const recommendedPreset = recommendations[spriteType] || 'classic_fruit';
      
      const preset = this.presets.get(recommendedPreset);
      if (!preset) {
        // Fallback to default animation
        return this.createDefaultAnimation(sprite, index);
      }

      return preset.baseAnimation(sprite, index);
    });
  }

  /**
   * Analyze sprite types from atlas result
   */
  private analyzeSpriteTypes(sprites: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    
    sprites.forEach(sprite => {
      const type = sprite.type || 'object';
      types[type] = (types[type] || 0) + 1;
    });

    return types;
  }

  /**
   * Get animation recommendations based on sprite analysis
   */
  private getAnimationRecommendations(spriteTypes: Record<string, number>): Record<string, string> {
    const recommendations: Record<string, string> = {};

    // Smart preset selection based on sprite composition
    if (spriteTypes.letter && spriteTypes.letter > 3) {
      recommendations.letter = 'scatter_text';
    } else if (spriteTypes.letter) {
      recommendations.letter = 'wild_symbol';
    }

    if (spriteTypes.character) {
      recommendations.character = 'character_slot';
    }

    if (spriteTypes.object) {
      // Analyze if objects might be gems, fruits, or special symbols
      if (spriteTypes.object <= 3 && !spriteTypes.letter) {
        recommendations.object = 'gem_slot';
      } else if (spriteTypes.object > 5) {
        recommendations.object = 'classic_fruit';
      } else {
        recommendations.object = 'bonus_special';
      }
    }

    return recommendations;
  }

  /**
   * Create default animation fallback
   */
  private createDefaultAnimation(sprite: any, index: number): SpriteAnimation {
    return {
      spriteId: sprite.name,
      duration: 3000 + (index * 200),
      loop: true,
      keyframes: [
        {
          time: 0,
          properties: { scaleX: 1, scaleY: 1, alpha: 1 },
          ease: 'power2.inOut'
        },
        {
          time: 0.5,
          properties: { scaleX: 1.02, scaleY: 1.02, alpha: 0.95 },
          ease: 'power2.inOut'
        },
        {
          time: 1,
          properties: { scaleX: 1, scaleY: 1, alpha: 1 },
          ease: 'power2.inOut'
        }
      ]
    };
  }

  /**
   * Get available presets
   */
  getAvailablePresets(): string[] {
    return Array.from(this.presets.keys());
  }

  /**
   * Get preset info
   */
  getPresetInfo(presetId: string): AnimationPreset | undefined {
    return this.presets.get(presetId);
  }

  /**
   * Generate GSAP timeline code from animations
   */
  generateGSAPCode(animations: SpriteAnimation[]): string {
    let code = `// Generated by SlotAI Animation Lab 2.0\nconst tl = gsap.timeline({ repeat: -1 });\n\n`;

    animations.forEach((anim, index) => {
      code += `// Animation for ${anim.spriteId}\n`;
      code += `const sprite${index} = document.querySelector('[data-sprite="${anim.spriteId}"]');\n`;
      
      anim.keyframes.forEach((keyframe, kIndex) => {
        if (kIndex === 0) {
          code += `tl.set(sprite${index}, ${JSON.stringify(keyframe.properties, null, 2)}, ${keyframe.time})\n`;
        } else {
          code += `  .to(sprite${index}, {\n`;
          code += `    duration: ${keyframe.time - (anim.keyframes[kIndex - 1]?.time || 0)},\n`;
          code += `    ease: "${keyframe.ease || 'power2.inOut'}",\n`;
          Object.entries(keyframe.properties).forEach(([prop, value]) => {
            code += `    ${prop}: ${value},\n`;
          });
          code += `  }, ${keyframe.time})\n`;
        }
      });
      code += '\n';
    });

    return code;
  }
}

export const simpleAnimationEngine = new SimpleAnimationEngine();
export type { SpriteAnimation, AnimationKeyframe };