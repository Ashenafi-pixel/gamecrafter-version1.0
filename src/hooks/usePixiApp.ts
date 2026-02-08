import { useRef, useEffect, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { SlotScene } from '../engine/pixi/SlotScene';

interface UsePixiAppOptions {
  width: number;
  height: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
}

interface UsePixiAppReturn {
  canvasRef: React.RefObject<HTMLDivElement>;
  isReady: boolean;
  updateGrid: (reels: number, rows: number, animate?: boolean) => Promise<void>;
  updateSymbols: (symbols: Array<{ id: string; url: string; type: string }>) => Promise<void>;
  setBackground: (url: string | null) => Promise<void>;
  setFrame: (url: string | null) => Promise<void>;
  playWinAnimation: (positions: Array<{ reel: number; row: number }>) => Promise<void>;
  spinReels: () => Promise<void>;
}

/**
 * Professional PIXI.js React Hook for Tier 1 Slot Games
 * Manages a single persistent PIXI application instance
 */
export function usePixiApp(options: UsePixiAppOptions): UsePixiAppReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const sceneRef = useRef<SlotScene | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize PIXI application
  const initializeApp = useCallback(async () => {
    if (!containerRef.current) {
      console.warn('❌ Container ref not available');
      return;
    }

    if (appRef.current) {
      console.log('✅ PIXI app already exists, skipping initialization');
      return;
    }

    try {
      console.log('🚀 Starting PIXI initialization (v8)...');

      // Create application
      const app = new PIXI.Application();
      await app.init({
        width: options.width,
        height: options.height,
        backgroundAlpha: options.backgroundColor === undefined ? 0 : 1, // If color provided, opacity 1, else 0??? Actually backgroundAlpha is deprecated? use background: 'transparent' or color object?
        backgroundColor: options.backgroundColor || 0x0a0a0a,
        antialias: options.antialias !== false,
        resolution: options.resolution || window.devicePixelRatio || 1,
        autoDensity: true,
        preference: 'webgl',
        // sharedTicker: false, // removed in v8 init? or ok?
        // sharedLoader: false, // removed?
      });

      if (!containerRef.current) {
        app.destroy();
        return;
      }

      // Add canvas to container
      // v8 uses app.canvas
      containerRef.current.appendChild(app.canvas);

      // Style the canvas
      const canvas = app.canvas;
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      // Log container dimensions
      const rect = containerRef.current.getBoundingClientRect();
      console.log(`📐 Container dimensions: ${rect.width}x${rect.height}`);

      // Create scene
      const scene = new SlotScene(app);

      // Store references
      appRef.current = app;
      sceneRef.current = scene;

      // Set ready state
      setIsReady(true);

      console.log('✅ PIXI Application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize PIXI:', error);
      throw error;
    }
  }, [options.width, options.height, options.backgroundColor, options.antialias, options.resolution]);

  // Track mount count to handle StrictMode
  const mountCountRef = useRef(0);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize on mount
  useEffect(() => {
    mountCountRef.current++;
    console.log(`🔄 Component mount #${mountCountRef.current}`);

    // Clear any pending cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Initialize only once
    if (!initPromiseRef.current) {
      initPromiseRef.current = initializeApp();
    }

    // Cleanup on unmount with delay to handle StrictMode
    return () => {
      console.log(`🔄 Component unmount #${mountCountRef.current}`);

      // Delay cleanup to see if component remounts (StrictMode behavior)
      cleanupTimeoutRef.current = setTimeout(() => {
        if (appRef.current) {
          console.log('🧹 Cleaning up PIXI application (delayed)');

          // Destroy scene
          if (sceneRef.current) {
            sceneRef.current.destroy();
            sceneRef.current = null;
          }

          // Destroy app
          appRef.current.destroy({ removeView: true }, {
            children: true,
            texture: true,
            textureSource: true
          });
          appRef.current = null;
          setIsReady(false);
          initPromiseRef.current = null;
        }
      }, 100); // 100ms delay to handle StrictMode double-mount
    };
  }, []); // Empty deps - only run once

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (appRef.current && sceneRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        console.log(`🎮 Resizing PIXI: ${width}x${height}`);
        sceneRef.current.resize(width, height);
      }
    };

    // Watch for container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also handle fullscreen changes
    const handleFullscreenChange = () => {
      console.log('🖥️ Fullscreen change detected');
      // Force immediate resize
      handleResize();
      // Also resize after browser updates layout
      setTimeout(handleResize, 50);
      setTimeout(handleResize, 150);
      setTimeout(handleResize, 300);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Also listen for window resize
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Public API methods
  const updateGrid = useCallback(async (reels: number, rows: number, animate = true) => {
    await initPromiseRef.current;
    if (!sceneRef.current) {
      console.warn('Scene not ready for updateGrid');
      return;
    }
    await sceneRef.current.updateGrid(reels, rows, animate);
  }, []);

  const updateSymbols = useCallback(async (symbols: Array<{ id: string; url: string; type: string }>) => {
    await initPromiseRef.current;
    if (!sceneRef.current) {
      console.warn('Scene not ready for updateSymbols');
      return;
    }
    await sceneRef.current.updateSymbols(symbols as any);
  }, []);

  const setBackground = useCallback(async (url: string | null) => {
    await initPromiseRef.current;
    if (!sceneRef.current) {
      console.warn('Scene not ready for setBackground');
      return;
    }
    await sceneRef.current.setBackground(url);
  }, []);

  const setFrame = useCallback(async (
    url: string | null,
    adjustments?: {
      scale?: number;
      position?: { x: number; y: number };
      stretch?: { x: number; y: number };
    }
  ) => {
    await initPromiseRef.current;
    if (!sceneRef.current) {
      console.warn('Scene not ready for setFrame');
      return;
    }
    await sceneRef.current.setFrame(url, adjustments);
  }, []);

  const playWinAnimation = useCallback(async (positions: Array<{ reel: number; row: number }>) => {
    await initPromiseRef.current;
    if (!sceneRef.current) {
      console.warn('Scene not ready for playWinAnimation');
      return;
    }
    await sceneRef.current.playWinAnimation(positions);
  }, []);

  const setGridAdjustments = useCallback((adjustments: { position?: { x: number; y: number }; scale?: number }) => {
    if (!sceneRef.current) {
      console.warn('Scene not ready for setGridAdjustments');
      return;
    }
    sceneRef.current.setGridAdjustments(adjustments);
  }, []);

  const setShowSymbolBackgrounds = useCallback((show: boolean) => {
    if (!sceneRef.current) {
      console.warn('Scene not ready for setShowSymbolBackgrounds');
      return;
    }
    sceneRef.current.setShowSymbolBackgrounds(show);
  }, []);

  const spinReels = useCallback(async () => {
    if (!sceneRef.current) {
      console.warn('Scene not ready for spinReels');
      return;
    }
    console.log('🎰 Triggering reel spin animation...');
    // Call the spin method on the scene
    await sceneRef.current.spinReels();
  }, []);

  return {
    canvasRef: containerRef,
    isReady,
    updateGrid,
    updateSymbols,
    setBackground,
    setFrame,
    playWinAnimation,
    spinReels,
    setGridAdjustments,
    setShowSymbolBackgrounds
  };
}