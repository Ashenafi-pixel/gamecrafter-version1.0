/**
 * PixiJS Animation System for Sprite Sheets
 * Handles creation and management of animated sprites from 5x5 sprite sheets
 */

import * as PIXI from 'pixi.js';

export interface AnimatedSpriteConfig {
  spriteSheetUrl: string;
  frameWidth: number;
  frameHeight: number;
  animationSpeed?: number;
  loop?: boolean;
  autoPlay?: boolean;
}

export interface AnimatedSpriteResult {
  success: boolean;
  animatedSprite?: PIXI.AnimatedSprite;
  frameTextures?: PIXI.Texture[];
  error?: string;
}

/**
 * Create an animated sprite from a 5x5 sprite sheet
 */
export const createAnimatedSprite = async (config: AnimatedSpriteConfig): Promise<AnimatedSpriteResult> => {
  try {
    console.log('🎬 Creating animated sprite from sprite sheet:', config.spriteSheetUrl);

    // Load the sprite sheet texture
    const spriteSheetTexture = await PIXI.Assets.load(config.spriteSheetUrl);
    
    if (!spriteSheetTexture) {
      throw new Error('Failed to load sprite sheet texture');
    }

    // Calculate frame dimensions from the sprite sheet
    const frameWidth = config.frameWidth || spriteSheetTexture.width / 5;
    const frameHeight = config.frameHeight || spriteSheetTexture.height / 5;

    console.log('🎬 Sprite sheet dimensions:', {
      totalWidth: spriteSheetTexture.width,
      totalHeight: spriteSheetTexture.height,
      frameWidth,
      frameHeight
    });

    // Extract 25 frames from the 5x5 grid
    const frameTextures: PIXI.Texture[] = [];
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const frameTexture = new PIXI.Texture(
          spriteSheetTexture,
          new PIXI.Rectangle(
            col * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight
          )
        );
        frameTextures.push(frameTexture);
      }
    }

    console.log('🎬 Extracted', frameTextures.length, 'frames from sprite sheet');

    // Create the animated sprite
    const animatedSprite = new PIXI.AnimatedSprite(frameTextures);
    
    // Configure animation properties
    animatedSprite.animationSpeed = config.animationSpeed || 0.2;
    animatedSprite.loop = config.loop !== false; // Default to true
    
    if (config.autoPlay !== false) {
      animatedSprite.play();
    }

    console.log('✅ Animated sprite created successfully');

    return {
      success: true,
      animatedSprite,
      frameTextures
    };

  } catch (error) {
    console.error('❌ Failed to create animated sprite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Update an existing animated sprite with new configuration
 */
export const updateAnimatedSprite = (
  animatedSprite: PIXI.AnimatedSprite,
  config: Partial<AnimatedSpriteConfig>
): void => {
  if (config.animationSpeed !== undefined) {
    animatedSprite.animationSpeed = config.animationSpeed;
  }
  
  if (config.loop !== undefined) {
    animatedSprite.loop = config.loop;
  }
  
  if (config.autoPlay !== undefined) {
    if (config.autoPlay) {
      animatedSprite.play();
    } else {
      animatedSprite.stop();
    }
  }
};

/**
 * Create a static sprite from the first frame of a sprite sheet
 * Used as fallback when animation is disabled
 */
export const createStaticSpriteFromSheet = async (
  spriteSheetUrl: string,
  frameWidth?: number,
  frameHeight?: number
): Promise<PIXI.Sprite | null> => {
  try {
    const spriteSheetTexture = await PIXI.Assets.load(spriteSheetUrl);
    
    if (!spriteSheetTexture) {
      return null;
    }

    const actualFrameWidth = frameWidth || spriteSheetTexture.width / 5;
    const actualFrameHeight = frameHeight || spriteSheetTexture.height / 5;

    // Create texture for the first frame (top-left)
    const firstFrameTexture = new PIXI.Texture(
      spriteSheetTexture,
      new PIXI.Rectangle(0, 0, actualFrameWidth, actualFrameHeight)
    );

    return new PIXI.Sprite(firstFrameTexture);

  } catch (error) {
    console.error('❌ Failed to create static sprite from sheet:', error);
    return null;
  }
};

/**
 * Check if a symbol has animation data
 */
export const hasAnimationData = (symbol: any): boolean => {
  return !!(symbol.animationType === 'animation' && symbol.spriteSheetUrl);
};

/**
 * Get the appropriate sprite for a symbol (animated or static)
 */
export const createSpriteForSymbol = async (
  symbol: any,
  symbolSize: number,
  enableAnimation: boolean = true
): Promise<PIXI.DisplayObject | null> => {
  try {
    if (hasAnimationData(symbol) && enableAnimation) {
      // Create animated sprite (let the system calculate frame dimensions from sprite sheet)
      const result = await createAnimatedSprite({
        spriteSheetUrl: symbol.spriteSheetUrl,
        frameWidth: 0, // Will be calculated automatically from sprite sheet dimensions
        frameHeight: 0, // Will be calculated automatically from sprite sheet dimensions
        animationSpeed: 0.15,
        loop: true,
        autoPlay: true
      });

      if (result.success && result.animatedSprite) {
        result.animatedSprite.width = symbolSize * 0.8;
        result.animatedSprite.height = symbolSize * 0.8;
        return result.animatedSprite;
      }
    }

    // Fallback to static sprite
    const imageUrl = symbol.spriteSheetUrl || symbol.imageUrl;
    if (!imageUrl) {
      return null;
    }

    let sprite: PIXI.Sprite;

    if (symbol.spriteSheetUrl && !symbol.imageUrl) {
      // Create static sprite from first frame of sprite sheet
      const staticSprite = await createStaticSpriteFromSheet(symbol.spriteSheetUrl);
      if (!staticSprite) {
        return null;
      }
      sprite = staticSprite;
    } else {
      // Create regular sprite from image URL
      const texture = await PIXI.Assets.load(imageUrl);
      sprite = new PIXI.Sprite(texture);
    }

    sprite.width = symbolSize * 0.8;
    sprite.height = symbolSize * 0.8;
    return sprite;

  } catch (error) {
    console.error('❌ Failed to create sprite for symbol:', error);
    return null;
  }
};

/**
 * Dispose of animated sprite resources
 */
export const disposeAnimatedSprite = (animatedSprite: PIXI.AnimatedSprite): void => {
  try {
    animatedSprite.stop();
    animatedSprite.destroy();
  } catch (error) {
    console.warn('⚠️ Error disposing animated sprite:', error);
  }
};
