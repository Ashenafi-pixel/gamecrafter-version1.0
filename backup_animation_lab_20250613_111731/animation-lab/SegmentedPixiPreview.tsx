import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';

interface SegmentationResult {
  body: string;
  leftWing: string;
  rightWing: string;
  segments: Array<{
    id: string;
    name: string;
    image: string;
    anchorPoint: { x: number; y: number };
    attachmentPoint: { x: number; y: number };
    zIndex: number;
  }>;
}

interface AnimationConfig {
  type: 'idle' | 'win' | 'scatter' | 'wild';
  format: 'pixi' | 'spine2d' | 'lottie';
  elements: Array<{
    id: string;
    name: string;
    animation: string;
    duration: number;
    delay: number;
    easing: string;
  }>;
  globalSettings: {
    loop: boolean;
    intensity: 'subtle' | 'medium' | 'intense';
    style: 'casino' | 'fantasy' | 'modern';
  };
}

interface SegmentedPixiPreviewProps {
  segmentationResult: SegmentationResult | null;
  animationConfig: AnimationConfig | null;
  isPlaying: boolean;
}

const SegmentedPixiPreview: React.FC<SegmentedPixiPreviewProps> = ({
  segmentationResult,
  animationConfig,
  isPlaying
}) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const segmentSpritesRef = useRef<Record<string, PIXI.Sprite>>({});
  const animationTweensRef = useRef<any[]>([]);
  const [animationStatus, setAnimationStatus] = useState<'idle' | 'playing' | 'paused'>('idle');

  useEffect(() => {
    if (!pixiContainerRef.current) return;

    // Initialize PIXI Application
    const app = new PIXI.Application({
      width: 600,
      height: 400,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    pixiAppRef.current = app;
    const canvas = app.view as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    pixiContainerRef.current.appendChild(canvas);

    // Setup scene
    setupScene(app);

    return () => {
      // Cleanup animations
      animationTweensRef.current.forEach(tween => {
        if (tween.cleanup) tween.cleanup();
      });
      animationTweensRef.current = [];

      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, {
          children: true,
          texture: true,
          baseTexture: true
        });
        pixiAppRef.current = null;
      }
    };
  }, []);

  // Load segmented sprites when segmentation result changes
  useEffect(() => {
    if (segmentationResult && pixiAppRef.current) {
      loadSegmentedSprites(pixiAppRef.current, segmentationResult);
    }
  }, [segmentationResult]);

  // Handle animation play/pause
  useEffect(() => {
    if (animationConfig && Object.keys(segmentSpritesRef.current).length > 0) {
      if (isPlaying) {
        startSegmentedAnimation();
        setAnimationStatus('playing');
      } else {
        pauseAnimation();
        setAnimationStatus('paused');
      }
    }
  }, [isPlaying, animationConfig]);

  const setupScene = (app: PIXI.Application) => {
    // Clear existing stage
    app.stage.removeChildren();

    // Background
    const background = new PIXI.Graphics();
    background.beginFill(0x1a1a2e);
    background.drawRect(0, 0, app.view.width, app.view.height);
    background.endFill();
    app.stage.addChild(background);

    // Grid pattern for reference
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0x333333, 0.3);
    for (let i = 0; i <= app.view.width; i += 50) {
      grid.moveTo(i, 0);
      grid.lineTo(i, app.view.height);
    }
    for (let i = 0; i <= app.view.height; i += 50) {
      grid.moveTo(0, i);
      grid.lineTo(app.view.width, i);
    }
    app.stage.addChild(grid);

    // Center crosshair
    const crosshair = new PIXI.Graphics();
    crosshair.lineStyle(2, 0xffd700, 0.8);
    crosshair.moveTo(app.view.width / 2 - 20, app.view.height / 2);
    crosshair.lineTo(app.view.width / 2 + 20, app.view.height / 2);
    crosshair.moveTo(app.view.width / 2, app.view.height / 2 - 20);
    crosshair.lineTo(app.view.width / 2, app.view.height / 2 + 20);
    app.stage.addChild(crosshair);
  };

  const loadSegmentedSprites = async (app: PIXI.Application, segmentation: SegmentationResult) => {
    try {
      // Clear existing sprites
      Object.values(segmentSpritesRef.current).forEach(sprite => {
        if (sprite.parent) {
          sprite.parent.removeChild(sprite);
        }
      });
      segmentSpritesRef.current = {};

      // Create container for all segments
      const symbolContainer = new PIXI.Container();
      symbolContainer.x = app.view.width / 2;
      symbolContainer.y = app.view.height / 2;

      // Load and create sprites for each segment
      for (const segment of segmentation.segments) {
        const texture = await PIXI.Texture.fromURL(segment.image);
        const sprite = new PIXI.Sprite(texture);
        
        // Scale to fit nicely in preview
        const maxSize = 200;
        const scale = Math.min(maxSize / texture.width, maxSize / texture.height);
        sprite.scale.set(scale);
        
        // Set anchor point for rotation
        sprite.anchor.set(segment.anchorPoint.x, segment.anchorPoint.y);
        
        // Position sprites to reconstruct the original image
        if (segment.id === 'body') {
          // Body at center
          sprite.x = 0;
          sprite.y = 0;
        } else if (segment.id === 'leftWing') {
          // Left wing - position to connect with body
          sprite.x = 0; // Same center as body
          sprite.y = 0; // Same center as body
        } else if (segment.id === 'rightWing') {
          // Right wing - position to connect with body
          sprite.x = 0; // Same center as body
          sprite.y = 0; // Same center as body
        } else {
          // Default positioning for other segments
          sprite.x = 0;
          sprite.y = 0;
        }
        
        // Set z-index (wings behind body)
        sprite.zIndex = segment.zIndex;
        
        segmentSpritesRef.current[segment.id] = sprite;
        symbolContainer.addChild(sprite);

        // Add glow filter for better visibility (PIXI v7 compatible)
        try {
          if (PIXI.filters && PIXI.filters.GlowFilter) {
            const glowFilter = new PIXI.filters.GlowFilter();
            glowFilter.distance = 5;
            glowFilter.outerStrength = 0.5;
            glowFilter.innerStrength = 0;
            glowFilter.color = 0xffd700;
            glowFilter.quality = 0.5;
            sprite.filters = [glowFilter];
          }
        } catch (error) {
          // Silently skip if filter not available
        }
      }

      // Sort children by zIndex
      symbolContainer.children.sort((a, b) => (a as any).zIndex - (b as any).zIndex);
      
      // Safely add to stage
      if (app && app.stage && app.stage.addChild) {
        app.stage.addChild(symbolContainer);
      } else {
        console.warn('PIXI app or stage not available - retrying...');
        // Retry after a short delay
        setTimeout(() => {
          if (pixiAppRef.current && pixiAppRef.current.stage) {
            pixiAppRef.current.stage.addChild(symbolContainer);
          }
        }, 100);
      }

    } catch (error) {
      console.warn('Failed to load segmented sprites:', error);
    }
  };

  const startSegmentedAnimation = () => {
    if (!animationConfig || Object.keys(segmentSpritesRef.current).length === 0) return;

    // Clear existing animations
    stopAnimation();

    // Get sprites
    const bodySprite = segmentSpritesRef.current['body'];
    const leftWingSprite = segmentSpritesRef.current['leftWing'];
    const rightWingSprite = segmentSpritesRef.current['rightWing'];

    if (!bodySprite || !leftWingSprite || !rightWingSprite) return;

    // Create different animation types
    switch (animationConfig.type) {
      case 'idle':
        createSegmentedIdleAnimation(bodySprite, leftWingSprite, rightWingSprite);
        break;
      case 'win':
        createSegmentedWinAnimation(bodySprite, leftWingSprite, rightWingSprite);
        break;
      case 'scatter':
        createSegmentedScatterAnimation(bodySprite, leftWingSprite, rightWingSprite);
        break;
      case 'wild':
        createSegmentedWildAnimation(bodySprite, leftWingSprite, rightWingSprite);
        break;
    }
  };

  const createSegmentedIdleAnimation = (body: PIXI.Sprite, leftWing: PIXI.Sprite, rightWing: PIXI.Sprite) => {
    // Store original values
    const originalBodyY = body.y;
    const originalBodyScale = body.scale.x;
    const originalLeftWingY = leftWing.y;
    const originalRightWingY = rightWing.y;
    
    let time = 0;

    const animateSegmentedIdle = () => {
      time += 0.02;
      
      // Body floating
      body.y = originalBodyY + Math.sin(time) * 3;
      
      // Body breathing
      const breathingScale = originalBodyScale + Math.sin(time * 0.75) * 0.01;
      body.scale.set(breathingScale);
      
      // Realistic wing flapping - wings rotate from their attachment points
      const wingFlapAngle = Math.sin(time * 6) * 0.4; // 23 degrees max flap
      leftWing.rotation = wingFlapAngle;
      rightWing.rotation = -wingFlapAngle; // Mirror motion
      
      // Wings follow body floating motion
      const bodyFloatOffset = Math.sin(time) * 3;
      leftWing.y = originalLeftWingY + bodyFloatOffset;
      rightWing.y = originalRightWingY + bodyFloatOffset;
    };

    const ticker = pixiAppRef.current?.ticker;
    if (ticker) {
      ticker.add(animateSegmentedIdle);
      animationTweensRef.current = [{ ticker, animate: animateSegmentedIdle, cleanup: () => ticker.remove(animateSegmentedIdle) }];
    }
  };

  const createSegmentedWinAnimation = (body: PIXI.Sprite, leftWing: PIXI.Sprite, rightWing: PIXI.Sprite) => {
    const originalBodyScale = body.scale.x;
    const originalBodyY = body.y;
    
    let time = 0;
    let phase = 0;

    const animateSegmentedWin = () => {
      time += 0.08;
      
      if (phase === 0 && time < 1.5) {
        // Phase 1: Explosive celebration
        const scale = originalBodyScale + Math.sin(time * Math.PI) * 0.3;
        body.scale.set(scale);
        body.rotation = Math.sin(time * 5) * 0.2;
        
        // Intense wing flapping
        const intenseFlapAngle = Math.sin(time * 20) * 0.8; // 45+ degrees
        leftWing.rotation = intenseFlapAngle;
        rightWing.rotation = -intenseFlapAngle;
        
        // Wings spread wider during win
        const wingSpread = Math.sin(time * 3) * 10;
        leftWing.x = -wingSpread;
        rightWing.x = wingSpread;
        
      } else if (phase === 0) {
        phase = 1;
        time = 0;
      }

      if (phase === 1 && time < 1) {
        // Phase 2: Settle back to normal
        const settleScale = originalBodyScale + (1 - time) * 0.1;
        body.scale.set(settleScale);
        body.rotation = (1 - time) * 0.1;
        
        // Wings settle
        const settleAngle = (1 - time) * 0.3;
        leftWing.rotation = settleAngle;
        rightWing.rotation = -settleAngle;
        
        leftWing.x = (1 - time) * -5;
        rightWing.x = (1 - time) * 5;
        
      } else if (phase === 1) {
        // Reset for loop
        phase = 0;
        time = 0;
        body.scale.set(originalBodyScale);
        body.rotation = 0;
        leftWing.rotation = 0;
        rightWing.rotation = 0;
        leftWing.x = 0;
        rightWing.x = 0;
      }
    };

    const ticker = pixiAppRef.current?.ticker;
    if (ticker) {
      ticker.add(animateSegmentedWin);
      animationTweensRef.current = [{ ticker, animate: animateSegmentedWin, cleanup: () => ticker.remove(animateSegmentedWin) }];
    }
  };

  const createSegmentedScatterAnimation = (body: PIXI.Sprite, leftWing: PIXI.Sprite, rightWing: PIXI.Sprite) => {
    const originalBodyScale = body.scale.x;
    let time = 0;

    const animateSegmentedScatter = () => {
      time += 0.025;
      
      // Mystical body pulsing
      body.alpha = 0.8 + Math.sin(time * 3) * 0.2;
      const pulseScale = originalBodyScale + Math.sin(time * 2) * 0.05;
      body.scale.set(pulseScale);
      
      // Gentle spinning
      body.rotation += 0.01;
      
      // Ethereal wing motion - slower, more graceful
      const etherealFlapAngle = Math.sin(time * 3) * 0.3;
      leftWing.rotation = etherealFlapAngle;
      rightWing.rotation = -etherealFlapAngle;
      
      // Wings glow in sync
      leftWing.alpha = 0.8 + Math.sin(time * 3 + 0.5) * 0.2;
      rightWing.alpha = 0.8 + Math.sin(time * 3 + 1) * 0.2;
    };

    const ticker = pixiAppRef.current?.ticker;
    if (ticker) {
      ticker.add(animateSegmentedScatter);
      animationTweensRef.current = [{ ticker, animate: animateSegmentedScatter, cleanup: () => ticker.remove(animateSegmentedScatter) }];
    }
  };

  const createSegmentedWildAnimation = (body: PIXI.Sprite, leftWing: PIXI.Sprite, rightWing: PIXI.Sprite) => {
    const originalBodyScale = body.scale.x;
    let time = 0;

    const animateSegmentedWild = () => {
      time += 0.1;
      
      // Dynamic body transformation
      body.rotation = Math.sin(time) * 0.4;
      const morphScale = originalBodyScale + Math.sin(time * 1.5) * 0.15;
      body.scale.set(morphScale);
      
      // Color transformation
      const tint = Math.sin(time) * 0.5 + 0.5;
      body.tint = PIXI.utils.rgb2hex([1, tint, tint]);
      
      // Erratic wing motion - asymmetrical
      const leftWingAngle = Math.sin(time * 7) * 0.6;
      const rightWingAngle = Math.cos(time * 5) * 0.5;
      leftWing.rotation = leftWingAngle;
      rightWing.rotation = -rightWingAngle;
      
      // Wings also transform color
      leftWing.tint = PIXI.utils.rgb2hex([tint, 1, tint]);
      rightWing.tint = PIXI.utils.rgb2hex([tint, tint, 1]);
    };

    const ticker = pixiAppRef.current?.ticker;
    if (ticker) {
      ticker.add(animateSegmentedWild);
      animationTweensRef.current = [{ ticker, animate: animateSegmentedWild, cleanup: () => ticker.remove(animateSegmentedWild) }];
    }
  };

  const pauseAnimation = () => {
    animationTweensRef.current.forEach(tween => {
      if (tween.cleanup) {
        tween.cleanup();
      }
    });
  };

  const stopAnimation = () => {
    pauseAnimation();
    
    // Reset all sprites to original state
    Object.values(segmentSpritesRef.current).forEach(sprite => {
      sprite.rotation = 0;
      sprite.alpha = 1;
      sprite.tint = 0xffffff;
      sprite.x = 0;
      sprite.y = 0;
    });
    
    animationTweensRef.current = [];
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          🎭 Segmented Animation Preview
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            animationStatus === 'playing' ? 'bg-green-500' : 
            animationStatus === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
          <span className="text-xs text-gray-500 capitalize">{animationStatus}</span>
        </div>
      </div>

      {/* PIXI Canvas Container */}
      <div className="flex-1 bg-gray-900 relative">
        <div 
          ref={pixiContainerRef}
          className="absolute inset-0 w-full h-full overflow-hidden"
        />
        
        {/* Overlay Info */}
        {!segmentationResult && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🔧</div>
              <p className="text-sm">Segment your symbol to see professional animation</p>
            </div>
          </div>
        )}

        {segmentationResult && !animationConfig && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
            Segments loaded - Choose animation style
          </div>
        )}

        {animationConfig && segmentationResult && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
            <div className="font-medium">🎭 SEGMENTED {animationConfig.type.toUpperCase()}</div>
            <div className="text-xs opacity-75">
              {segmentationResult.segments.length} parts • Professional quality
            </div>
          </div>
        )}
      </div>

      {/* Segment Info */}
      {segmentationResult && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <strong>Active Segments:</strong> {segmentationResult.segments.map(s => s.name).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentedPixiPreview;