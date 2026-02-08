/**
 * animationPresets.ts
 * 
 * Registry of named animation presets for the AnimationManager.
 * Provides default animation configurations that can be triggered
 * via playFX calls or Step 7 builder configurations.
 */

export interface AnimationPreset {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Easing function name or custom function */
  easing?: string | Function;
  /** Animation-specific parameters */
  params?: Record<string, any>;
  /** Delay before starting animation */
  delay?: number;
  /** Loop count (0 = infinite, 1 = once) */
  loop?: number;
  /** Animation description for UI builders */
  description?: string;
  /** Category for grouping in UI */
  category?: string;
}

/**
 * Core animation presets registry
 * 
 * These presets define the visual effects available to the slot engine.
 * Each preset can be customized via the AnimationManager configuration
 * or overridden by Step 7 builder settings.
 */
export const animationPresets: Record<string, AnimationPreset> = {
  // === ENTRANCE ANIMATIONS ===
  
  /**
   * Blur fade-in effect for spin start
   */
  blurIn: {
    duration: 400,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    params: {
      from: { opacity: 0, filter: 'blur(8px)' },
      to: { opacity: 1, filter: 'blur(0px)' }
    },
    description: 'Smooth blur fade-in transition',
    category: 'entrance'
  },

  /**
   * Fade in effect
   */
  fadeIn: {
    duration: 300,
    easing: 'ease-out',
    params: {
      from: { opacity: 0 },
      to: { opacity: 1 }
    },
    description: 'Simple opacity fade-in',
    category: 'entrance'
  },

  /**
   * Pop-in scale effect
   */
  popIn: {
    duration: 250,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    params: {
      from: { scale: 0, opacity: 0 },
      to: { scale: 1, opacity: 1 }
    },
    description: 'Bouncy scale-in animation',
    category: 'entrance'
  },

  /**
   * Slide in from top
   */
  slideInTop: {
    duration: 350,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    params: {
      from: { y: -100, opacity: 0 },
      to: { y: 0, opacity: 1 }
    },
    description: 'Slide down from top',
    category: 'entrance'
  },

  // === REEL ANIMATIONS ===

  /**
   * Bounce effect for reel stop
   */
  bounce: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    params: {
      keyframes: [
        { scale: 1 },
        { scale: 1.1 },
        { scale: 0.95 },
        { scale: 1.05 },
        { scale: 1 }
      ]
    },
    description: 'Elastic bounce on reel stop',
    category: 'reel'
  },

  /**
   * Shake effect for emphasis
   */
  shake: {
    duration: 500,
    easing: 'ease-in-out',
    params: {
      keyframes: [
        { x: 0 },
        { x: -5 },
        { x: 5 },
        { x: -3 },
        { x: 3 },
        { x: 0 }
      ]
    },
    description: 'Horizontal shake motion',
    category: 'reel'
  },

  /**
   * Spin start effect
   */
  spinStart: {
    duration: 200,
    easing: 'ease-in',
    params: {
      from: { filter: 'blur(0px)' },
      to: { filter: 'blur(3px)' }
    },
    description: 'Motion blur for spin start',
    category: 'reel'
  },

  /**
   * Reel stop effect
   */
  reelStop: {
    duration: 300,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    params: {
      from: { filter: 'blur(3px)', scale: 1.02 },
      to: { filter: 'blur(0px)', scale: 1 }
    },
    description: 'Clear focus on reel stop',
    category: 'reel'
  },

  // === WIN ANIMATIONS ===

  /**
   * Small win highlight
   */
  smallWin: {
    duration: 800,
    easing: 'ease-in-out',
    loop: 2,
    params: {
      keyframes: [
        { filter: 'brightness(1)' },
        { filter: 'brightness(1.3)' },
        { filter: 'brightness(1)' }
      ]
    },
    description: 'Gentle brightness pulse for small wins',
    category: 'win'
  },

  /**
   * Big win with glow effect
   */
  bigWin: {
    duration: 1200,
    easing: 'ease-in-out',
    loop: 3,
    params: {
      keyframes: [
        { filter: 'brightness(1) drop-shadow(0 0 5px gold)', scale: 1 },
        { filter: 'brightness(1.5) drop-shadow(0 0 15px gold)', scale: 1.1 },
        { filter: 'brightness(1) drop-shadow(0 0 5px gold)', scale: 1 }
      ]
    },
    description: 'Golden glow with scale for big wins',
    category: 'win'
  },

  /**
   * Mega win explosion effect
   */
  megaWin: {
    duration: 2000,
    easing: 'ease-out',
    loop: 5,
    params: {
      keyframes: [
        { 
          filter: 'brightness(1) drop-shadow(0 0 10px #fff)', 
          scale: 1,
          rotation: 0
        },
        { 
          filter: 'brightness(2) drop-shadow(0 0 30px #fff)', 
          scale: 1.2,
          rotation: 5
        },
        { 
          filter: 'brightness(1) drop-shadow(0 0 10px #fff)', 
          scale: 1,
          rotation: 0
        }
      ]
    },
    description: 'Explosive white glow with rotation for mega wins',
    category: 'win'
  },

  /**
   * Coin burst particle effect
   */
  coinBurst: {
    duration: 1500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    params: {
      particleCount: 20,
      particleImage: '/assets/effects/coin.png',
      spread: 360,
      velocity: 50,
      gravity: 0.8
    },
    description: 'Animated coin particles for wins',
    category: 'win'
  },

  /**
   * Simple highlight for winning symbols
   */
  highlight: {
    duration: 500,
    easing: 'ease-in-out',
    loop: 3,
    params: {
      keyframes: [
        { backgroundColor: 'transparent' },
        { backgroundColor: 'rgba(255, 215, 0, 0.3)' },
        { backgroundColor: 'transparent' }
      ]
    },
    description: 'Golden background highlight pulse',
    category: 'win'
  },

  // === SPECIAL EFFECTS ===

  /**
   * Lightning flash effect
   */
  lightning: {
    duration: 100,
    easing: 'linear',
    params: {
      keyframes: [
        { filter: 'brightness(1)' },
        { filter: 'brightness(5) hue-rotate(60deg)' },
        { filter: 'brightness(1)' }
      ]
    },
    description: 'Quick lightning flash',
    category: 'special'
  },

  /**
   * Rainbow color cycle
   */
  rainbow: {
    duration: 2000,
    easing: 'linear',
    loop: 0, // Infinite
    params: {
      keyframes: [
        { filter: 'hue-rotate(0deg)' },
        { filter: 'hue-rotate(360deg)' }
      ]
    },
    description: 'Continuous rainbow color rotation',
    category: 'special'
  },

  /**
   * Pulse effect
   */
  pulse: {
    duration: 1000,
    easing: 'ease-in-out',
    loop: 0, // Infinite
    params: {
      keyframes: [
        { scale: 1, opacity: 1 },
        { scale: 1.05, opacity: 0.8 },
        { scale: 1, opacity: 1 }
      ]
    },
    description: 'Gentle breathing pulse',
    category: 'special'
  },

  /**
   * Glitch effect
   */
  glitch: {
    duration: 300,
    easing: 'linear',
    params: {
      keyframes: [
        { filter: 'hue-rotate(0deg) saturate(1)' },
        { filter: 'hue-rotate(90deg) saturate(2)', x: 2 },
        { filter: 'hue-rotate(180deg) saturate(1)', x: -2 },
        { filter: 'hue-rotate(270deg) saturate(2)', x: 1 },
        { filter: 'hue-rotate(360deg) saturate(1)', x: 0 }
      ]
    },
    description: 'Digital glitch distortion',
    category: 'special'
  },

  // === TRANSITION ANIMATIONS ===

  /**
   * Spin complete effect
   */
  spinComplete: {
    duration: 400,
    easing: 'ease-out',
    params: {
      from: { filter: 'blur(1px)' },
      to: { filter: 'blur(0px)' }
    },
    description: 'Clear focus when all reels stop',
    category: 'transition'
  },

  /**
   * No win animation
   */
  noWin: {
    duration: 200,
    easing: 'ease-out',
    params: {
      keyframes: [
        { opacity: 1 },
        { opacity: 0.7 },
        { opacity: 1 }
      ]
    },
    description: 'Subtle fade for no win spins',
    category: 'transition'
  },

  /**
   * Game start intro
   */
  gameStart: {
    duration: 1000,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    params: {
      from: { scale: 0.8, opacity: 0, filter: 'blur(5px)' },
      to: { scale: 1, opacity: 1, filter: 'blur(0px)' }
    },
    description: 'Game initialization intro',
    category: 'transition'
  },

  // === UI ANIMATIONS ===

  /**
   * Button press effect
   */
  buttonPress: {
    duration: 150,
    easing: 'ease-out',
    params: {
      keyframes: [
        { scale: 1 },
        { scale: 0.95 },
        { scale: 1 }
      ]
    },
    description: 'Button press feedback',
    category: 'ui'
  },

  /**
   * Modal appear
   */
  modalAppear: {
    duration: 300,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    params: {
      from: { scale: 0.7, opacity: 0 },
      to: { scale: 1, opacity: 1 }
    },
    description: 'Modal window appearance',
    category: 'ui'
  },

  /**
   * Toast notification
   */
  toast: {
    duration: 400,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    params: {
      from: { y: -50, opacity: 0 },
      to: { y: 0, opacity: 1 }
    },
    description: 'Notification slide-in',
    category: 'ui'
  }
};

/**
 * Animation categories for UI organization
 */
export const animationCategories = {
  entrance: 'Entrance Effects',
  reel: 'Reel Animations', 
  win: 'Win Celebrations',
  special: 'Special Effects',
  transition: 'Transitions',
  ui: 'User Interface'
};

/**
 * Get all presets in a specific category
 */
export function getPresetsByCategory(category: string): Record<string, AnimationPreset> {
  return Object.fromEntries(
    Object.entries(animationPresets).filter(([_, preset]) => preset.category === category)
  );
}

/**
 * Get preset names for a category
 */
export function getPresetNames(category?: string): string[] {
  if (!category) {
    return Object.keys(animationPresets);
  }
  return Object.keys(getPresetsByCategory(category));
}

/**
 * Validate animation preset configuration
 */
export function validatePreset(preset: AnimationPreset): boolean {
  // Basic validation
  if (preset.duration && preset.duration < 0) return false;
  if (preset.loop && preset.loop < 0) return false;
  if (preset.delay && preset.delay < 0) return false;
  
  return true;
}

/**
 * Create a custom preset by merging with existing one
 */
export function createCustomPreset(
  baseName: string, 
  overrides: Partial<AnimationPreset>
): AnimationPreset | null {
  const basePreset = animationPresets[baseName];
  if (!basePreset) return null;
  
  return {
    ...basePreset,
    ...overrides,
    params: {
      ...basePreset.params,
      ...overrides.params
    }
  };
}

export default animationPresets;