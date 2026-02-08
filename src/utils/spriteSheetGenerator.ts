/**
 * Sprite Sheet Generator for Animation Lab
 * Generates 5x5 sprite sheets for animated symbols using OpenAI API
 */

import { enhancedOpenaiClient } from './enhancedOpenaiClient';

export interface SpriteSheetConfig {
  prompt: string;
  symbolType: 'block' | 'contour';
  contentType: 'symbol-only' | 'symbol-wild' | 'symbol-scatter' | 'symbol-bonus' | 'symbol-free' | 'symbol-jackpot' | 'text-only';
  animationComplexity: 'simple' | 'medium' | 'complex';
  layoutTemplate?: 'text-top' | 'text-bottom' | 'text-overlay';
}

export interface SpriteSheetResult {
  success: boolean;
  spriteSheetUrl?: string;
  error?: string;
}

// ───────────────────────────────────────────────────
// Horizontal strip configuration matching gem sprite sheet
const COLS         = 32;  // 32 frames like the gem image
const ROWS         = 1;   // Single row horizontal strip
const SYMBOL_SIZE  = 48;  // Small square frames for very wide layout
const GUTTER       = 0;   // No gaps for seamless cutting
const OUTER_MARGIN = 0;   // No margins for precise cutting

// Derived:
const SPRITE_WIDTH  = SYMBOL_SIZE * COLS;  // 1536px wide
const SPRITE_HEIGHT = SYMBOL_SIZE * ROWS;  // 48px tall
// ───────────────────────────────────────────────────


/**
 * Generate animation prompts based on complexity level
 */
const getAnimationDescription = (complexity: 'simple' | 'medium' | 'complex'): string => {
  const descriptions = {
    simple: 'gentle floating motion, subtle glow variations, soft breathing effect',
    medium: 'dynamic movement with rotation, pulsing energy, color shifts, particle effects',
    complex: 'elaborate transformation sequence, magical effects, multiple animation layers, dramatic lighting changes'
  };
  return descriptions[complexity];
};

/**
 * Generate content-specific animation details
 */
const getContentAnimationDetails = (contentType: string): string => {
  const contentAnimations = {
    'symbol-wild': 'WILD text glowing and pulsing, symbol radiating energy',
    'symbol-scatter': 'SCATTER text sparkling, symbol with magical aura',
    'symbol-bonus': 'BONUS text bouncing, symbol with celebration effects',
    'symbol-free': 'FREE text floating, symbol with liberation effects',
    'symbol-jackpot': 'JACKPOT text shimmering, symbol with golden rays',
    'symbol-only': 'symbol with natural movement and energy',
    'text-only': 'text with dynamic typography effects'
  };
  return contentAnimations[contentType] || 'symbol with smooth animation';
};

/**
 * Generate a horizontal strip sprite sheet for animation
 */
export const generateSpriteSheet = async (config: SpriteSheetConfig): Promise<SpriteSheetResult> => {
  try {
    console.log('🎬 Generating 5x5 grid sprite sheet for animation...');
    
    const animationDesc = getAnimationDescription(config.animationComplexity);
    const contentAnimationDesc = getContentAnimationDetails(config.contentType);
    
    // Create enhanced prompt for precise 5x5 grid sprite sheet
    const spriteSheetPrompt = `
    Create a **1024×1024 PNG sprite sheet** (RGBA, transparent background) containing exactly **25 animation frames** arranged in a **5×5 grid**:

1. **Canvas & Grid Layout**  
   - Canvas: 1024×1024 px  
   - Outer margin: 0 px (no extra border)  
   - Grid: 5 columns × 5 rows, each frame slot is exactly 204.8×204.8 px (1024÷5).  
   - ** grid lines important**, **no spacing**—frames abut edge-to-edge.

2. **Frame Slot & Symbol Positioning**  
   - Symbol area in each frame should be 180×180 px 
   - Slot centers coordinates (px) for key frames:  
     - Frame 1 (top-left): (102.4, 102.4)  
     - Frame 5 (top-right): (921.6, 102.4)  
     - Frame 21 (bottom-left): (102.4, 921.6)  
     - Frame 25 (bottom-right): (921.6, 921.6)  
   - **All symbols identical size** ( exactly 180×180 px), **identically centered** in every frame.

3. **Looping & Continuity**  
   - Sequence: 1 → 2 → … → 24 → 25 → (loops back to 1).  
   - Frame 25 must match Frame 1 at **96–100% similarity** (aside from subtle animated effect) to ensure a perfect loop.

4. **Animation Specifications**  
   - Symbol description: ${config.prompt}
   - Animation complexity: ${config.animationComplexity}
   - Progression details:  
     
    
     ${contentAnimationDesc}
     
   - **Allowed changes** per frame: rotation, glow, particle effects.  
   - **Forbidden changes**: size, position, lighting, color palette, transparency.

5. **Visual Consistency & Quality**  
   - Identical symbol size, positioning, lighting direction/intensity, and color palette across all frames.  
   - Professional-quality slot‑machine art: crisp, sharp at 180 px symbol size; vibrant, consistent contrast.

6. **Transparency & Background**  
   - **100% transparent background** (only symbols visible).  
   - No backgrounds, gradients, or environmental elements.

7. **Fixed Layout Guarantee**  
   - **Layout is immutable**: whenever you regenerate the sprite sheet—regardless of ${config.prompt}—the 5×5 grid, frame sizes, centers, and transparency stay exactly as specified. Only the symbol/animation changes.
**Final deliverable:**  
One 1024×1024 PNG with 25 animation frames in a seamless, fixed 5×5 grid—ready for immediate use in any slot‑machine or looping animation system.`;

    console.log('🎨 Enhanced 5x5 grid prompt:', spriteSheetPrompt.substring(0, 200) + '...');

    // Generate the sprite sheet using OpenAI with optimal settings
    const response = await enhancedOpenaiClient.generateImageWithConfig({
      prompt: spriteSheetPrompt,
      targetSymbolId: `spritesheet_${Date.now()}`,
      gameId: 'animation-lab-sprites'
    });

    if (response.success && response.images && response.images.length > 0) {
      console.log('✅ 5x5 grid sprite sheet generated successfully');
      return {
        success: true,
        spriteSheetUrl: response.images[0]
      };
    } else {
      throw new Error(response.error || 'Failed to generate 5x5 grid sprite sheet');
    }

  } catch (error) {
    console.error('❌ 5x5 grid generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Extract individual frames from a horizontal strip sprite sheet
 * This function will be used by the PixiJS animation system
 */
export const extractFramesFromSpriteSheet = (
  spriteSheetTexture: any, // PIXI.Texture
  frameWidth: number,
  frameHeight: number
): any[] => {
  const frames = [];

  // Extract 32 frames from horizontal strip (32x1)
  for (let col = 0; col < 32; col++) {
    const frameTexture = new (window as any).PIXI.Texture(
      spriteSheetTexture,
      new (window as any).PIXI.Rectangle(
        col * frameWidth,
        0, // Single row, so Y is always 0
        frameWidth,
        frameHeight
      )
    );
    frames.push(frameTexture);
  }

  return frames;
};
