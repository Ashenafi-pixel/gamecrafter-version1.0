import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { motion } from 'framer-motion';

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

interface PixiAnimationPreviewProps {
  symbolImage: string | null;
  animationConfig: AnimationConfig | null;
  isPlaying: boolean;
  analysisResult: any;
}

const PixiAnimationPreview: React.FC<PixiAnimationPreviewProps> = ({
  symbolImage,
  animationConfig,
  isPlaying,
  analysisResult
}) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const symbolSpriteRef = useRef<PIXI.Sprite | null>(null);
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
      // Cleanup tweens
      animationTweensRef.current.forEach(tween => {
        if (tween && tween.kill) tween.kill();
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

  // Load symbol when image changes
  useEffect(() => {
    if (symbolImage && pixiAppRef.current) {
      loadSymbolSprite(pixiAppRef.current, symbolImage);
    }
  }, [symbolImage]);

  // Handle animation play/pause
  useEffect(() => {
    if (animationConfig && symbolSpriteRef.current) {
      if (isPlaying) {
        startAnimation();
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

  const loadSymbolSprite = async (app: PIXI.Application, imageUrl: string) => {
    try {
      // Remove existing symbol sprite
      if (symbolSpriteRef.current) {
        app.stage.removeChild(symbolSpriteRef.current);
      }

      const texture = await PIXI.Texture.fromURL(imageUrl);
      const sprite = new PIXI.Sprite(texture);
      
      // Scale to fit nicely in preview
      const maxSize = 200;
      const scale = Math.min(maxSize / texture.width, maxSize / texture.height);
      sprite.scale.set(scale);
      
      // Center the sprite
      sprite.anchor.set(0.5);
      sprite.x = app.view.width / 2;
      sprite.y = app.view.height / 2;
      
      symbolSpriteRef.current = sprite;
      app.stage.addChild(sprite);

      // Add glow filter for better visibility (PIXI v7 compatible)
      try {
        const glowFilter = new PIXI.filters.GlowFilter();
        glowFilter.distance = 10;
        glowFilter.outerStrength = 1;
        glowFilter.innerStrength = 0;
        glowFilter.color = 0xffd700;
        glowFilter.quality = 0.5;
        sprite.filters = [glowFilter];
      } catch (error) {
        console.warn('GlowFilter not available, skipping filter');
      }

    } catch (error) {
      console.warn('Failed to load symbol texture:', error);
    }
  };

  const startAnimation = () => {
    if (!animationConfig || !symbolSpriteRef.current) return;

    // Clear existing animations
    stopAnimation();

    const sprite = symbolSpriteRef.current;
    const config = animationConfig;

    // Create different animation types
    switch (config.type) {
      case 'idle':
        createIdleAnimation(sprite, config);
        break;
      case 'win':
        createWinAnimation(sprite, config);
        break;
      case 'scatter':
        createScatterAnimation(sprite, config);
        break;
      case 'wild':
        createWildAnimation(sprite, config);
        break;
    }
  };

  const createIdleAnimation = (sprite: PIXI.Sprite, config: AnimationConfig) => {
    // Store original values
    const originalY = sprite.y;
    const originalScale = sprite.scale.x;
    
    // Animation state
    let time = 0;

    // Create animation function with wing flapping effect
    const animateIdle = () => {
      time += 0.02;
      
      // Subtle floating
      sprite.y = originalY + Math.sin(time) * 5;
      
      // Wing flapping effect - faster oscillation for wings
      const wingFlapIntensity = Math.sin(time * 8) * 0.08; // Fast wing flap
      sprite.skew.x = wingFlapIntensity; // Horizontal skew to simulate wing movement
      
      // Gentle body rotation
      sprite.rotation = Math.sin(time * 0.25) * 0.05;
      
      // Breathing scale with slight wing emphasis
      const baseScale = originalScale + Math.sin(time * 0.75) * 0.02;
      const wingScale = baseScale + Math.abs(wingFlapIntensity) * 0.01; // Wings affect overall scale
      sprite.scale.set(wingScale);
    };

    // Start animation loop
    const ticker = pixiAppRef.current?.ticker;
    if (ticker) {
      ticker.add(animateIdle);
      // Store reference for cleanup
      animationTweensRef.current = [{ ticker, animate: animateIdle, cleanup: () => ticker.remove(animateIdle) }];
    }
  };

  const createWinAnimation = (sprite: PIXI.Sprite, config: AnimationConfig) => {
    const originalScale = sprite.scale.x;
    const originalX = sprite.x;
    const originalY = sprite.y;
    
    let time = 0;
    let phase = 0;

    const animateWin = () => {
      time += 0.05;
      
      if (phase === 0 && time < 1) {
        // Phase 1: Scale up dramatically with intense wing flapping
        const scale = originalScale + Math.sin(time * Math.PI) * 0.5;
        sprite.scale.set(scale);
        sprite.rotation = time * 2;
        
        // Intense wing flapping during win
        const intenseFlapIntensity = Math.sin(time * 15) * 0.15;
        sprite.skew.x = intenseFlapIntensity;
        sprite.skew.y = Math.sin(time * 12) * 0.05; // Add vertical wing motion
      } else if (phase === 0) {
        phase = 1;
        time = 0;
      }

      if (phase === 1 && time < 2) {
        // Phase 2: Explosive shake and glow with continued wing action
        sprite.x = originalX + (Math.random() - 0.5) * 10;
        sprite.y = originalY + (Math.random() - 0.5) * 10;
        sprite.alpha = 0.8 + Math.sin(time * 10) * 0.2;
        
        // Chaotic wing flapping
        sprite.skew.x = Math.sin(time * 20) * 0.2;
        sprite.skew.y = Math.cos(time * 18) * 0.1;
      } else if (phase === 1) {
        // Reset to normal
        sprite.scale.set(originalScale);
        sprite.rotation = 0;
        sprite.x = originalX;
        sprite.y = originalY;
        sprite.alpha = 1;
        sprite.skew.set(0, 0);
        phase = 0;
        time = 0;
      }
    };

    const ticker = pixiAppRef.current?.ticker;
    if (ticker) {
      ticker.add(animateWin);
      animationTweensRef.current = [{ ticker, animate: animateWin, cleanup: () => ticker.remove(animateWin) }];
    }
  };

  const createScatterAnimation = (sprite: PIXI.Sprite, config: AnimationConfig) => {
    const originalScale = sprite.scale.x;
    let time = 0;

    const animateScatter = () => {
      time += 0.03;
      
      // Mystical glow pulsing
      sprite.alpha = 0.7 + Math.sin(time * 2) * 0.3;
      
      // Gentle spinning
      sprite.rotation += 0.02;
      
      // Scale pulsing
      const scale = originalScale + Math.sin(time * 3) * 0.1;
      sprite.scale.set(scale);
      
      // Mystical wing flutter - slower and more ethereal
      const mysticalFlapIntensity = Math.sin(time * 4) * 0.06;
      sprite.skew.x = mysticalFlapIntensity;
      sprite.skew.y = Math.sin(time * 3) * 0.03; // Gentle wave motion
    };

    const ticker = pixiAppRef.current?.ticker;
    if (ticker) {
      ticker.add(animateScatter);
      animationTweensRef.current = [{ ticker, animate: animateScatter, cleanup: () => ticker.remove(animateScatter) }];
    }
  };

  const createWildAnimation = (sprite: PIXI.Sprite, config: AnimationConfig) => {
    const originalScale = sprite.scale.x;
    let time = 0;

    const animateWild = () => {
      time += 0.08;
      
      // Dynamic transformation
      sprite.rotation = Math.sin(time) * 0.3;
      
      // Morphing scale
      const scaleX = originalScale + Math.sin(time * 2) * 0.2;
      const scaleY = originalScale + Math.cos(time * 2) * 0.2;
      sprite.scale.set(scaleX, scaleY);
      
      // Color tinting
      const tint = Math.sin(time) * 0.5 + 0.5;
      sprite.tint = PIXI.utils.rgb2hex([1, tint, tint]);
      
      // Wild transformation wing effect - erratic and dynamic
      const wildFlapIntensity = Math.sin(time * 10) * 0.12;
      const wildVerticalFlap = Math.cos(time * 8) * 0.08;
      sprite.skew.x = wildFlapIntensity;
      sprite.skew.y = wildVerticalFlap;
    };

    const ticker = pixiAppRef.current?.ticker;
    if (ticker) {
      ticker.add(animateWild);
      animationTweensRef.current = [{ ticker, animate: animateWild, cleanup: () => ticker.remove(animateWild) }];
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
    
    // Reset sprite to original state
    if (symbolSpriteRef.current) {
      symbolSpriteRef.current.rotation = 0;
      symbolSpriteRef.current.alpha = 1;
      symbolSpriteRef.current.tint = 0xffffff;
      symbolSpriteRef.current.skew.set(0, 0); // Reset wing flapping
      // Keep position and scale as they were set during loading
    }
    
    animationTweensRef.current = [];
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          PIXI.js Animation Preview
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
        {!symbolImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🎭</div>
              <p className="text-sm">Generate or upload a symbol to begin</p>
            </div>
          </div>
        )}

        {symbolImage && !animationConfig && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
            Symbol loaded - Choose animation style
          </div>
        )}

        {animationConfig && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
            <div className="font-medium">{animationConfig.type.toUpperCase()} Animation ({animationConfig.format.toUpperCase()})</div>
            <div className="text-xs opacity-75">
              {animationConfig.elements.length} elements • {animationConfig.globalSettings.intensity} intensity
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <strong>Detected Elements:</strong> {analysisResult.identifiedElements.map((e: any) => e.name).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default PixiAnimationPreview;