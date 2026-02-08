import { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '../store';
import { SlotAnimationController } from '../utils/slotAnimations';

interface UsePixiSlotAnimationsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  reels: number;
  rows: number;
  symbols?: string[];
}

export const usePixiSlotAnimations = ({ 
  containerRef, 
  reels, 
  rows, 
  symbols = [] 
}: UsePixiSlotAnimationsProps) => {
  const appRef = useRef<PIXI.Application | null>(null);
  const animationControllerRef = useRef<SlotAnimationController | null>(null);
  const reelContainersRef = useRef<PIXI.Container[]>([]);
  const { animationTrigger, clearAnimationTrigger } = useGameStore();

  // Initialize PixiJS app and create slot grid
  const initializePixiApp = useCallback(() => {
    if (!containerRef.current || appRef.current) return;

    const container = containerRef.current;
    const width = Math.max(container.clientWidth, 400); // Minimum width
    const height = Math.max(container.clientHeight, 300); // Minimum height

    console.log(`🎰 Initializing PixiJS with dimensions: ${width}x${height}`);

    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x041022,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Add canvas to container
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // Create reel containers
    const reelContainers: PIXI.Container[] = [];
    const symbolWidth = app.screen.width / reels;
    const symbolHeight = app.screen.height / rows;

    for (let reelIndex = 0; reelIndex < reels; reelIndex++) {
      const reelContainer = new PIXI.Container();
      reelContainer.x = reelIndex * symbolWidth;
      
      // Create symbols for this reel (extra symbols for spinning effect)
      const totalSymbols = rows + 10; // Extra symbols for smooth spinning
      
      for (let symbolIndex = 0; symbolIndex < totalSymbols; symbolIndex++) {
        const symbolSprite = createSymbolSprite(symbolWidth, symbolHeight, symbols);
        symbolSprite.y = symbolIndex * symbolHeight - (5 * symbolHeight); // Start with offset
        reelContainer.addChild(symbolSprite);
      }

      reelContainers.push(reelContainer);
      app.stage.addChild(reelContainer);
    }

    reelContainersRef.current = reelContainers;

    // Initialize animation controller with symbols
    animationControllerRef.current = new SlotAnimationController(app, reelContainers, symbols);

    console.log('🎰 PixiJS slot machine initialized with GSAP animations and', symbols.length, 'symbols');

  }, [containerRef, reels, rows, symbols]);

  // Update symbols when they change
  useEffect(() => {
    if (animationControllerRef.current && symbols.length > 0) {
      animationControllerRef.current.updateSymbols(symbols);
      console.log('🎰 Updated animation controller with', symbols.length, 'symbols');
    }
  }, [symbols]);

  // Create a symbol sprite with actual symbol texture
  const createSymbolSprite = (width: number, height: number, availableSymbols: string[]) => {
    if (availableSymbols.length > 0) {
      // Use actual symbol texture
      const randomSymbolUrl = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];

      try {
        const sprite = PIXI.Sprite.from(randomSymbolUrl);

        // Scale to fit the cell
        const scaleX = (width - 10) / sprite.texture.width;
        const scaleY = (height - 10) / sprite.texture.height;
        const scale = Math.min(scaleX, scaleY);

        sprite.scale.set(scale);
        sprite.x = 5;
        sprite.y = 5;

        return sprite;
      } catch (error) {
        console.warn('Failed to load symbol texture:', randomSymbolUrl, error);
      }
    }

    // Fallback to colored rectangle if no symbols or loading fails
    const graphics = new PIXI.Graphics();
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0x6c5ce7, 0xa55eea];
    const color = colors[Math.floor(Math.random() * colors.length)];

    graphics.beginFill(color);
    graphics.drawRoundedRect(5, 5, width - 10, height - 10, 8);
    graphics.endFill();

    // Add border
    graphics.lineStyle(2, 0xffffff, 0.8);
    graphics.drawRoundedRect(5, 5, width - 10, height - 10, 8);

    return graphics;
  };

  // Handle animation triggers from store
  useEffect(() => {
    if (animationTrigger.type && animationTrigger.isPlaying && animationControllerRef.current) {
      console.log(`🎰 Playing ${animationTrigger.type} GSAP animation`);
      
      const controller = animationControllerRef.current;
      
      // Start spin animation with win celebration
      controller.playSpinAnimation(animationTrigger.type, () => {
        // Animation complete callback
        setTimeout(() => {
          clearAnimationTrigger();
        }, 1000);
      });
    }
  }, [animationTrigger, clearAnimationTrigger]);

  // Initialize when container is ready
  useEffect(() => {
    if (containerRef.current && !appRef.current) {
      // Small delay to ensure container has dimensions
      setTimeout(initializePixiApp, 100);
    }

    return () => {
      // Cleanup
      if (animationControllerRef.current) {
        animationControllerRef.current.destroy();
        animationControllerRef.current = null;
      }
      
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      
      reelContainersRef.current = [];
    };
  }, [initializePixiApp]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (appRef.current && containerRef.current) {
        const app = appRef.current;
        app.renderer.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manual trigger function for spin button
  const triggerSpin = useCallback((winType?: string) => {
    if (animationControllerRef.current) {
      console.log(`🎰 Manual spin triggered${winType ? ` with ${winType}` : ''}`);
      animationControllerRef.current.playSpinAnimation(winType);
    }
  }, []);

  return {
    triggerSpin,
    isReady: !!appRef.current && !!animationControllerRef.current
  };
};