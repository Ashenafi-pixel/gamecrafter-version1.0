/**
 * Expandable Atlas System for Professional Frame-Based Animations
 * Handles generation of animation frame sequences and atlas expansion
 */

import { enhancedOpenaiClient } from './enhancedOpenaiClient';
import { SpriteAtlas } from './spriteDecomposer';

export interface AnimationFrame {
  name: string;
  imageUrl: string; // Base64 data URL
  frameNumber: number;
  description: string;
}

export interface FrameSequenceResult {
  success: boolean;
  frames: AnimationFrame[];
  animationType: string;
  spriteName: string;
  error?: string;
}

/**
 * Generate animation frame sequence for complex animations
 */
export async function generateAnimationFrameSequence(
  spriteAtlas: SpriteAtlas,
  sprite: any,
  animationType: string
): Promise<FrameSequenceResult> {
  try {
    console.log(`🎬 Generating ${animationType} frame sequence for ${sprite.name}...`);
    
    // Define frame count and prompts based on animation type
    const animationConfig = getAnimationConfig(animationType);
    const frames: AnimationFrame[] = [];
    
    // Extract the sprite region from the original atlas for reference
    const spriteReference = await extractSpriteForReference(spriteAtlas, sprite);
    
    // Generate each frame of the animation sequence
    for (let i = 0; i < animationConfig.frameCount; i++) {
      const frameNumber = i + 1;
      const progress = i / (animationConfig.frameCount - 1); // 0 to 1
      
      console.log(`🎨 Generating frame ${frameNumber}/${animationConfig.frameCount} for ${sprite.name} ${animationType}`);
      
      const framePrompt = createFramePrompt(
        sprite,
        animationType,
        frameNumber,
        progress,
        animationConfig,
        spriteReference
      );
      
      // Generate the frame using GPT-image-1
      const frameResult = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: framePrompt,
        count: 1,
        targetSymbolId: `${sprite.name}_${animationType}_frame_${frameNumber}`,
        gameId: 'expandable_atlas_animation'
      });
      
      if (frameResult.success && frameResult.images && frameResult.images.length > 0) {
        frames.push({
          name: `${sprite.name}_${animationType}_${frameNumber.toString().padStart(3, '0')}`,
          imageUrl: frameResult.images[0],
          frameNumber,
          description: `${sprite.description} - ${animationType} animation frame ${frameNumber}`
        });
        
        console.log(`✅ Generated frame ${frameNumber} for ${sprite.name}`);
      } else {
        throw new Error(`Failed to generate frame ${frameNumber}: ${frameResult.error}`);
      }
      
      // Small delay between frames to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return {
      success: true,
      frames,
      animationType,
      spriteName: sprite.name
    };
    
  } catch (error) {
    console.error(`Failed to generate frame sequence for ${sprite.name}:`, error);
    return {
      success: false,
      frames: [],
      animationType,
      spriteName: sprite.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Expand sprite atlas to include new animation frames
 */
export async function expandSpriteAtlas(
  originalAtlas: SpriteAtlas,
  animationFrames: AnimationFrame[],
  spriteName: string,
  animationType: string
): Promise<SpriteAtlas> {
  try {
    console.log(`📏 Expanding atlas to accommodate ${animationFrames.length} new frames...`);
    
    // Create new expanded canvas
    const originalCanvas = await loadImageToCanvas(originalAtlas.atlasImage);
    const expandedCanvas = createExpandedCanvas(originalCanvas, animationFrames.length);
    
    // Draw original atlas onto expanded canvas
    const expandedCtx = expandedCanvas.getContext('2d')!;
    expandedCtx.drawImage(originalCanvas, 0, 0);
    
    // Calculate positions for new frames
    const framePositions = calculateFramePositions(
      originalCanvas,
      expandedCanvas,
      animationFrames.length
    );
    
    // Draw animation frames onto expanded canvas
    const newSprites = [];
    for (let i = 0; i < animationFrames.length; i++) {
      const frame = animationFrames[i];
      const position = framePositions[i];
      
      // Load frame image and draw it
      const frameImage = await loadImageFromDataURL(frame.imageUrl);
      expandedCtx.drawImage(
        frameImage,
        position.x,
        position.y,
        position.width,
        position.height
      );
      
      // Add sprite metadata
      newSprites.push({
        name: frame.name,
        description: frame.description,
        bounds: {
          x: (position.x / expandedCanvas.width) * 100,
          y: (position.y / expandedCanvas.height) * 100,
          width: (position.width / expandedCanvas.width) * 100,
          height: (position.height / expandedCanvas.height) * 100
        },
        zIndex: 10 + i, // Higher z-index for animation frames
        animationPotential: 'frame_sequence',
        frameSequence: {
          parentSprite: spriteName,
          animationType,
          frameNumber: frame.frameNumber,
          totalFrames: animationFrames.length
        }
      });
    }
    
    // Convert expanded canvas to data URL
    const expandedImageUrl = expandedCanvas.toDataURL('image/png', 1.0);
    
    // Create new sprite atlas with expanded data
    const expandedAtlas: SpriteAtlas = {
      ...originalAtlas,
      atlasImage: expandedImageUrl,
      metadata: {
        ...originalAtlas.metadata,
        width: expandedCanvas.width,
        height: expandedCanvas.height,
        expandedAt: new Date().toISOString(),
        expansionReason: `Added ${animationFrames.length} frames for ${spriteName} ${animationType} animation`
      },
      sprites: [
        ...originalAtlas.sprites,
        ...newSprites
      ],
      animations: [
        ...originalAtlas.animations,
        {
          layerId: spriteName,
          animationType: `${animationType}_sequence`,
          description: `${animationType} animation using ${animationFrames.length} frame sequence`
        }
      ]
    };
    
    console.log(`✅ Atlas expanded successfully - new size: ${expandedCanvas.width}x${expandedCanvas.height}`);
    return expandedAtlas;
    
  } catch (error) {
    console.error('Failed to expand sprite atlas:', error);
    throw error;
  }
}

/**
 * Get animation configuration for different animation types
 */
function getAnimationConfig(animationType: string) {
  const configs = {
    spin: {
      frameCount: 8,
      description: 'Spinning motion with shape deformation',
      keywords: ['rotating', 'spinning', 'twisting', 'dynamic rotation']
    },
    wiggle: {
      frameCount: 6,
      description: 'Wiggling back and forth motion',
      keywords: ['wiggling', 'shaking', 'wobbling', 'oscillating']
    },
    wave: {
      frameCount: 5,
      description: 'Wave-like flowing motion',
      keywords: ['waving', 'flowing', 'undulating', 'rippling']
    },
    breathe: {
      frameCount: 4,
      description: 'Breathing expansion and contraction',
      keywords: ['breathing', 'expanding', 'contracting', 'pulsing organically']
    },
    celebrate: {
      frameCount: 6,
      description: 'Celebration gesture sequence',
      keywords: ['celebrating', 'cheering', 'triumphant', 'victory pose']
    }
  };
  
  return configs[animationType as keyof typeof configs] || configs.wiggle;
}

/**
 * Create detailed prompt for animation frame generation
 */
function createFramePrompt(
  sprite: any,
  animationType: string,
  frameNumber: number,
  progress: number,
  config: any,
  spriteReference: string
): string {
  const angle = progress * 360; // For rotation-based animations
  const intensity = Math.sin(progress * Math.PI * 2); // For oscillating animations
  
  return `Create frame ${frameNumber} of a ${animationType} animation sequence for ${sprite.description}.

ANIMATION TYPE: ${animationType.toUpperCase()}
FRAME: ${frameNumber} of ${config.frameCount}
PROGRESS: ${(progress * 100).toFixed(1)}%

SPECIFIC ANIMATION INSTRUCTIONS:
${getAnimationInstructions(animationType, progress, intensity, angle)}

QUALITY SPECIFICATIONS:
- Ultra-high resolution 4K quality finished graphics
- Professional game-ready artwork with crisp details
- Perfect edge definition and clean vector-style clarity
- Premium visual polish suitable for commercial slot games
- Consistent art style matching the original sprite
- Transparent background
- Isolated sprite element (no background or other elements)

CRITICAL REQUIREMENTS:
- ONLY the ${sprite.name} element - no other sprites or background
- Maintain exact same art style and lighting as the original
- Professional slot game quality animation frame
- Clean transparent background
- Properly cropped to sprite bounds
- High quality, detailed artwork suitable for frame-by-frame animation

The result should be a single animation frame showing the ${sprite.name} in the specified ${animationType} motion state.`;
}

/**
 * Get specific animation instructions based on type and progress
 */
function getAnimationInstructions(animationType: string, progress: number, intensity: number, angle: number): string {
  switch (animationType) {
    case 'spin':
      return `- Rotate the sprite ${angle.toFixed(0)} degrees from its original orientation
- Show natural deformation that occurs during spinning motion
- Maintain the sprite's core features while showing rotational dynamics
- Add subtle motion blur or dynamic effects if appropriate for the spin state`;
      
    case 'wiggle':
      const wiggleOffset = intensity * 15; // 15 degree max wiggle
      return `- Rotate/tilt the sprite ${wiggleOffset.toFixed(1)} degrees from center
- Show the natural flexibility and movement of the sprite
- Maintain structural integrity while showing wiggle deformation
- Express the back-and-forth wiggling motion naturally`;
      
    case 'wave':
      const waveOffset = Math.sin(progress * Math.PI * 4) * 10;
      return `- Show wave-like deformation with ${waveOffset.toFixed(1)} units of wave offset
- Create flowing, undulating motion through the sprite
- Show natural wave propagation through the sprite's structure
- Maintain organic, fluid wave movement`;
      
    case 'breathe':
      const breatheScale = 1 + (intensity * 0.15); // 15% breathing expansion
      return `- Scale the sprite to ${breatheScale.toFixed(2)}x of its normal size
- Show natural breathing expansion/contraction
- Maintain proportions while showing organic size changes
- Express natural, living breathing motion`;
      
    case 'celebrate':
      const celebrationPose = Math.floor(progress * 3); // 3 different celebration poses
      return `- Show celebration pose variation ${celebrationPose + 1}
- Express joyful, triumphant motion and energy
- Show dynamic celebration gesture or movement
- Convey excitement and victory through body language and positioning`;
      
    default:
      return `- Show natural ${animationType} motion at ${(progress * 100).toFixed(1)}% completion
- Maintain sprite integrity while expressing the animation
- Create smooth, professional animation frame
- Express the motion naturally and organically`;
  }
}

// Helper functions
async function loadImageToCanvas(dataURL: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = dataURL;
  });
}

async function loadImageFromDataURL(dataURL: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}

function createExpandedCanvas(originalCanvas: HTMLCanvasElement, frameCount: number): HTMLCanvasElement {
  const expandedCanvas = document.createElement('canvas');
  
  // Calculate new dimensions - expand horizontally to fit animation frames
  const frameSize = Math.min(originalCanvas.width, originalCanvas.height) * 0.3; // 30% of original size
  const framesPerRow = Math.ceil(Math.sqrt(frameCount));
  const additionalWidth = framesPerRow * frameSize;
  
  expandedCanvas.width = originalCanvas.width + additionalWidth;
  expandedCanvas.height = Math.max(originalCanvas.height, Math.ceil(frameCount / framesPerRow) * frameSize);
  
  return expandedCanvas;
}

function calculateFramePositions(
  originalCanvas: HTMLCanvasElement,
  expandedCanvas: HTMLCanvasElement,
  frameCount: number
) {
  const frameSize = Math.min(originalCanvas.width, originalCanvas.height) * 0.3;
  const startX = originalCanvas.width + 10; // Start after original content with padding
  const startY = 10;
  const framesPerRow = Math.floor((expandedCanvas.width - startX) / frameSize);
  
  return Array.from({ length: frameCount }, (_, i) => {
    const row = Math.floor(i / framesPerRow);
    const col = i % framesPerRow;
    
    return {
      x: startX + (col * frameSize),
      y: startY + (row * frameSize),
      width: frameSize,
      height: frameSize
    };
  });
}

async function extractSpriteForReference(spriteAtlas: SpriteAtlas, sprite: any): Promise<string> {
  // This could extract the specific sprite region for reference, but for now return empty
  // In a full implementation, you'd crop the sprite region from the atlas
  return '';
}