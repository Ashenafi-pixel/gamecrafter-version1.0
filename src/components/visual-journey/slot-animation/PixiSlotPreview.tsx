 import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { useGameStore } from '../../../store';
import { calculatePixiMockupDimensions, generatePixiPlaceholderSymbols, createSymbolCellTexture, loadTextureFromUrl } from '../../mockups/pixiMockupUtils';
import PickAndClickAnnouncementModal from '../../modals/PickAndClickAnnouncementModal';

interface PixiSlotPreviewProps {
  className?: string;
  onSpin?: () => void;
  // Restore PixiSlotMockup props for full compatibility
  cols?: number;
  rows?: number;
  symbols?: string[];
  background?: string;
  frame?: string;
  showControls?: boolean;
  isMobile?: boolean;
  orientation?: 'portrait' | 'landscape';
  customOffset?: { x: number; y: number };
  gridAdjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    stretch?: { x: number; y: number };
  };
  frameAdjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    stretch?: { x: number; y: number };
  };
  backgroundAdjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  };
  uiButtonAdjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    visibility?: boolean;
  };
  logo?: string;
  logoPosition?: { x: number; y: number };
  logoScale?: number;
  logoPositioningMode?: boolean;
  onLogoPositionChange?: (position: { x: number; y: number }) => void;
  onLogoScaleChange?: (scale: number) => void;
}

const PixiSlotPreview: React.FC<PixiSlotPreviewProps> = ({
  className = '',
  onSpin,
  // PixiSlotMockup compatibility props
  cols: propCols,
  rows: propRows,
  symbols: propSymbols,
  background,
  frame,
  showControls = true,
  isMobile = false,
  orientation = 'portrait',
  customOffset = { x: 0, y: 0 },
  gridAdjustments = { position: { x: 0, y: 0 }, scale: 100, stretch: { x: 100, y: 100 } },
  frameAdjustments = { position: { x: 0, y: 0 }, scale: 100, stretch: { x: 100, y: 100 } },
  backgroundAdjustments = { position: { x: 0, y: 0 }, scale: 100, fit: 'cover' },
  uiButtonAdjustments = { position: { x: 0, y: 0 }, scale: 100, visibility: true },
  logo,
  logoPosition = { x: 0, y: -50 },
  logoScale = 100,
  logoPositioningMode = false,
  onLogoPositionChange,
  onLogoScaleChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const reelContainersRef = useRef<PIXI.Container[]>([]);
  const [isReady, setIsReady] = useState(false);
  const finalSymbolsRef = useRef<string[][]>([]); // Store final symbols for all reels
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [isFreeSpinMode, setIsFreeSpinMode] = useState(false);
  const backgroundSpriteRef = useRef<PIXI.Sprite | null>(null);

  const { config } = useGameStore();

  // Get grid configuration - prioritize props over config for compatibility
  const reels = propCols || config.reels?.layout?.reels || 5;
  const rows = propRows || config.reels?.layout?.rows || 3;
  const symbols = propSymbols || config.theme?.generated?.symbols || [];

  // Get display symbols with fallback to brand logo
  const getDisplaySymbols = useCallback(() => {
    const totalCells = reels * rows;
    const displaySymbols: string[] = [];

    if (symbols.length === 0) {
      // Use brand logo as fallback
      return generatePixiPlaceholderSymbols(reels, rows, 'default');
    } else if (symbols.length === 1) {
      // Single symbol - replicate across all cells
      for (let i = 0; i < totalCells; i++) {
        displaySymbols.push(symbols[0] as string);
      }
    } else {
      // Multiple symbols - distribute cyclically
      for (let i = 0; i < totalCells; i++) {
        const symbol = symbols[i % symbols.length];
        const symbolUrl = typeof symbol === 'string' ? symbol : (symbol as any)?.url || (symbol as any)?.imageUrl;
        displaySymbols.push(symbolUrl);
      }
    }

    return displaySymbols;
  }, [symbols, reels, rows]);

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const initPixi = async () => {
    
      try {
        console.log('🎰 Initializing PixiJS Slot Preview...');

        const app = new PIXI.Application({
          width: containerRef.current!.clientWidth,
          height: containerRef.current!.clientHeight,
          backgroundColor: 0x000000, // Transparent background for overlay
          backgroundAlpha: 0, // Make background fully transparent
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        });

        // Add canvas to container
        containerRef.current!.appendChild(app.view as HTMLCanvasElement);

        // Style the canvas
        const canvas = app.view as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '1'; // Keep animation canvas below UI controls

        appRef.current = app;

        // Render the slot machine
        await renderSlotMachine(app);

        setIsReady(true);
        console.log('🎰 PixiJS Slot Preview initialized successfully');
      } catch (error) {
        console.error('🎰 Failed to initialize PixiJS:', error);
        setError(error instanceof Error ? error.message : 'Unknown PixiJS error');
      }
    };

    initPixi();

    // Cleanup
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, true);
        appRef.current = null;
        setIsReady(false);
      }
    };
  }, []);

  // Render slot machine grid
  const renderSlotMachine = async (app: PIXI.Application) => {
    const containerDimensions = {
      width: app.screen.width,
      height: app.screen.height
    };

    // Calculate grid dimensions using same logic as PixiSlotMockup
    const gridDimensions = calculatePixiMockupDimensions({
      cols: reels,
      rows,
      containerWidth: containerDimensions.width,
      containerHeight: containerDimensions.height,
      isMobile,
      orientation
    });

    // Render background if provided
    if (background) {
      await renderBackground(app, containerDimensions);
    }

    // Create symbol grid
    await createSymbolGrid(app, gridDimensions);

    // Render frame if provided
    if (frame) {
      await renderFrame(app, containerDimensions, gridDimensions);
    }

    // Render logo if provided
    if (logo) {
      await renderLogo(app, containerDimensions);
    }
  };

  // Render background
  const renderBackground = async (app: PIXI.Application, containerDimensions: any) => {
    try {
      const backgroundTexture = await loadTextureFromUrl(background!);
      if (backgroundTexture) {
        const backgroundSprite = new PIXI.Sprite(backgroundTexture);

        // Apply background adjustments
        const { position = { x: 0, y: 0 }, scale = 100, fit = 'cover' } = backgroundAdjustments;

        // Scale based on fit mode
        if (fit === 'cover') {
          const scaleX = containerDimensions.width / backgroundTexture.width;
          const scaleY = containerDimensions.height / backgroundTexture.height;
          const finalScale = Math.max(scaleX, scaleY) * (scale / 100);
          backgroundSprite.scale.set(finalScale);
        } else if (fit === 'contain') {
          const scaleX = containerDimensions.width / backgroundTexture.width;
          const scaleY = containerDimensions.height / backgroundTexture.height;
          const finalScale = Math.min(scaleX, scaleY) * (scale / 100);
          backgroundSprite.scale.set(finalScale);
        }

        // Center and apply position adjustments
        backgroundSprite.x = (containerDimensions.width - backgroundSprite.width) / 2 + position.x;
        backgroundSprite.y = (containerDimensions.height - backgroundSprite.height) / 2 + position.y;

        app.stage.addChildAt(backgroundSprite, 0); // Add at bottom
        
        // Store reference for Free Spin mode background switching
        backgroundSpriteRef.current = backgroundSprite;
      }
    } catch (error) {
      console.error('Failed to load background:', error);
    }
  };

  // Render frame
  const renderFrame = async (app: PIXI.Application, containerDimensions: any, gridDimensions: any) => {
    try {
      const frameTexture = await loadTextureFromUrl(frame!);
      if (frameTexture) {
        const frameSprite = new PIXI.Sprite(frameTexture);

        // Apply frame adjustments
        const { position = { x: 0, y: 0 }, scale = 100, stretch = { x: 100, y: 100 } } = frameAdjustments;

        // Scale to fit around the grid
        const scaleX = (gridDimensions.gridWidth * 1.2) / frameTexture.width * (stretch.x / 100);
        const scaleY = (gridDimensions.gridHeight * 1.2) / frameTexture.height * (stretch.y / 100);
        frameSprite.scale.set(scaleX * (scale / 100), scaleY * (scale / 100));

        // Center around grid with adjustments
        frameSprite.x = containerDimensions.width * 0.5 - frameSprite.width * 0.5 + position.x;
        frameSprite.y = containerDimensions.height * 0.4 - frameSprite.height * 0.5 + position.y;

        app.stage.addChild(frameSprite);
      }
    } catch (error) {
      console.error('Failed to load frame:', error);
    }
  };

  // Render logo
  const renderLogo = async (app: PIXI.Application, containerDimensions: any) => {
    try {
      const logoTexture = await loadTextureFromUrl(logo!);
      if (logoTexture) {
        const logoSprite = new PIXI.Sprite(logoTexture);

        // Apply logo scale
        const finalScale = logoScale / 100;
        logoSprite.scale.set(finalScale);

        // Position logo
        logoSprite.x = containerDimensions.width * 0.5 - logoSprite.width * 0.5 + logoPosition.x;
        logoSprite.y = containerDimensions.height * 0.1 + logoPosition.y;

        app.stage.addChild(logoSprite);
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
  };

  // Create symbol grid with proper layout and spacing
  const createSymbolGrid = async (app: PIXI.Application, gridDimensions: any) => {
    const { symbolSize, gridWidth, gridHeight, symbolPadding } = gridDimensions;
    const displaySymbols = getDisplaySymbols();

    // Create grid container - CENTER IT PROPERLY like PixiSlotMockup
    const gridContainer = new PIXI.Container();

    // Apply grid adjustments
    const { position = { x: 0, y: 0 }, scale = 100, stretch = { x: 100, y: 100 } } = gridAdjustments;

    // Center the grid in the container with adjustments
    gridContainer.x = app.screen.width * 0.5 - gridWidth * 0.5 + position.x + customOffset.x;
    gridContainer.y = app.screen.height * 0.4 - gridHeight * 0.5 + position.y + customOffset.y;

    // Apply scale and stretch
    gridContainer.scale.set((scale / 100) * (stretch.x / 100), (scale / 100) * (stretch.y / 100));

    // Create reel containers for animation
    const reelContainers: PIXI.Container[] = [];

    for (let col = 0; col < reels; col++) {
      const reelContainer = new PIXI.Container();
      reelContainer.x = col * (symbolSize + symbolPadding);

      for (let row = 0; row < rows; row++) {
        const index = row * reels + col;
        const symbol = displaySymbols[index];

        const cellY = row * (symbolSize + symbolPadding);

        // Create cell background
        const cellTexture = createSymbolCellTexture(app, symbolSize);
        const cellSprite = new PIXI.Sprite(cellTexture);
        cellSprite.x = 0;
        cellSprite.y = cellY;
        reelContainer.addChild(cellSprite);

        // Create symbol
        if (symbol) {
          try {
            const symbolTexture = await loadTextureFromUrl(symbol);
            if (symbolTexture) {
              const symbolSprite = new PIXI.Sprite(symbolTexture);
              symbolSprite.width = symbolSize * 0.8;
              symbolSprite.height = symbolSize * 0.8;
              symbolSprite.x = (symbolSize - symbolSprite.width) * 0.5;
              symbolSprite.y = cellY + (symbolSize - symbolSprite.height) * 0.5;
              reelContainer.addChild(symbolSprite);
            }
          } catch (error) {
            console.error(`Failed to load symbol ${symbol}:`, error);
          }
        }
      }

      reelContainers.push(reelContainer);
      gridContainer.addChild(reelContainer);
    }

    reelContainersRef.current = reelContainers;
    app.stage.addChild(gridContainer);
  };

  // Handle spin with proper game logic
  const handleSpin = useCallback(() => {
    if (isSpinning || !appRef.current || reelContainersRef.current.length === 0) return;

    console.log('🎰 Spin button clicked - starting slot machine spin');
    setIsSpinning(true);

    // Call parent onSpin handler
    if (onSpin) {
      onSpin();
    }

    // Determine win type with realistic probabilities
    const random = Math.random();
    let winType: string;
    let isWin = false;

    if (random < 0.02) { // 2% chance
      winType = 'mega-win';
      isWin = true;
    } else if (random < 0.08) { // 6% chance
      winType = 'big-win';
      isWin = true;
    } else if (random < 0.25) { // 17% chance
      winType = 'small-win';
      isWin = true;
    } else if (random < 0.30) { // 5% chance
      winType = 'freespins';
      isWin = true;
    } else {
      winType = 'no-win';
      isWin = false;
    }

    console.log(`🎰 Spin result: ${winType} (${isWin ? 'WIN' : 'LOSE'})`);

    // Animate the reels
    animateReels(winType, isWin);
  }, [isSpinning, onSpin]);

  // Listen for external spin triggers
 useEffect(() => {
  const handleExternalSpin = () => {
    handleSpin();
  };

  window.addEventListener('pixiSlotSpin', handleExternalSpin);

  return () => {
    window.removeEventListener('pixiSlotSpin', handleExternalSpin);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  // Animate reels with proper slot machine spinning behavior
  const animateReels = (winType: string, isWin: boolean) => {
    const displaySymbols = getDisplaySymbols();

    // Initialize final symbols array
    finalSymbolsRef.current = Array(reels).fill(null).map(() => []);

    reelContainersRef.current.forEach((reel, reelIndex) => {
      const delay = reelIndex * 0.3; // Progressive delay for each reel
      const spinDuration = 2 + delay; // Longer spin for later reels

      // Create extra symbols for continuous spinning effect
      const extraSymbols: PIXI.Sprite[] = [];
      const symbolHeight = reel.children[1] ? (reel.children[1] as PIXI.Sprite).height : 80;
      const symbolSpacing = symbolHeight + 2; // Small padding between symbols

      // Add extra symbols above the visible area for continuous scroll
      for (let i = 0; i < rows * 3; i++) { // 3x more symbols for smooth scrolling
        const randomSymbol = displaySymbols[Math.floor(Math.random() * displaySymbols.length)];
        try {
          const symbolSprite = PIXI.Sprite.from(randomSymbol);
          symbolSprite.width = symbolHeight * 0.8;
          symbolSprite.height = symbolHeight * 0.8;
          symbolSprite.x = (reel.children[0] as PIXI.Sprite).width * 0.1; // Center horizontally
          symbolSprite.y = -symbolSpacing * (i + 1); // Position above visible area

          reel.addChild(symbolSprite);
          extraSymbols.push(symbolSprite);
        } catch (error) {
          console.warn('Failed to create extra symbol:', error);
        }
      }

      // Create spinning timeline for this reel
      const reelTimeline = gsap.timeline();

      // Phase 1: Acceleration (spin faster and faster)
      reelTimeline.to(reel, {
        y: symbolSpacing * 2,
        duration: 0.5,
        ease: "power1.in",
        onUpdate: function() {
          // Wrap symbols that go below visible area back to top
          reel.children.forEach((child) => {
            if (child instanceof PIXI.Sprite && child.y > symbolSpacing * rows) {
              child.y -= symbolSpacing * (rows + extraSymbols.length);
              // Change symbol texture for variety
              const randomSymbol = displaySymbols[Math.floor(Math.random() * displaySymbols.length)];
              try {
                child.texture = PIXI.Texture.from(randomSymbol);
              } catch (error) {
                console.warn('Failed to update symbol texture:', error);
              }
            }
          });
        }
      });

      // Phase 2: Constant speed spinning
      reelTimeline.to(reel, {
        y: `+=${symbolSpacing * 10}`, // Spin many symbols
        duration: spinDuration - 1,
        ease: "none",
        onUpdate: function() {
          // Continue wrapping symbols
          reel.children.forEach((child) => {
            if (child instanceof PIXI.Sprite && child.y > symbolSpacing * rows) {
              child.y -= symbolSpacing * (rows + extraSymbols.length);
              const randomSymbol = displaySymbols[Math.floor(Math.random() * displaySymbols.length)];
              try {
                child.texture = PIXI.Texture.from(randomSymbol);
              } catch (error) {
                console.warn('Failed to update symbol texture:', error);
              }
            }
          });
        }
      });

      // Phase 3: Deceleration and final positioning
      reelTimeline.to(reel, {
        y: 0, // Snap back to original position
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          // Clean up extra symbols
          extraSymbols.forEach(sprite => {
            if (sprite.parent) {
              sprite.parent.removeChild(sprite);
              sprite.destroy();
            }
          });

          // Set final symbols based on win/lose logic
          setFinalSymbols(reel, reelIndex, isWin, winType, displaySymbols);

          // Check if this is the last reel to complete
          if (reelIndex === reelContainersRef.current.length - 1) {
            setIsSpinning(false);

            // Show win effects if applicable
            if (isWin) {
              setTimeout(() => showWinEffects(winType), 200);
            }

            console.log(`🎰 Spin complete - Result: ${winType} (${isWin ? 'WIN' : 'LOSE'})`);
          }
        }
      });

      // Start the timeline with delay
      reelTimeline.delay(delay);
    });
  };

  // Set final symbols for win/lose logic
  const setFinalSymbols = (reel: PIXI.Container, reelIndex: number, isWin: boolean, winType: string, displaySymbols: string[]) => {
    const symbolSprites = reel.children.filter((child, index) =>
      child instanceof PIXI.Sprite && index % 2 === 1 // Only symbol sprites (odd indices are symbols)
    ) as PIXI.Sprite[];

    // Store final symbols for this reel
    const reelFinalSymbols: string[] = [];

    if (isWin && winType !== 'no-win') {
      // For wins, try to create matching symbols in a line
      if (reelIndex === 0) {
        // First reel sets the winning symbol
        const winningSymbol = displaySymbols[Math.floor(Math.random() * displaySymbols.length)];
        symbolSprites.forEach(sprite => {
          try {
            sprite.texture = PIXI.Texture.from(winningSymbol);
            reelFinalSymbols.push(winningSymbol);
          } catch (error) {
            console.warn('Failed to set winning symbol:', error);
            reelFinalSymbols.push(displaySymbols[0]); // Fallback
          }
        });
      } else if (Math.random() < 0.7) { // 70% chance to match for realistic wins
        // Try to match the first reel's symbols
        const firstReelSymbols = reelContainersRef.current[0].children.filter((child, index) =>
          child instanceof PIXI.Sprite && index % 2 === 1
        ) as PIXI.Sprite[];

        symbolSprites.forEach((sprite, index) => {
          if (firstReelSymbols[index]) {
            try {
              sprite.texture = firstReelSymbols[index].texture;
              // Extract symbol URL from texture
              const symbolUrl = (firstReelSymbols[index].texture as any)?.baseTexture?.resource?.url || displaySymbols[0];
              reelFinalSymbols.push(symbolUrl);
            } catch (error) {
              console.warn('Failed to match symbol:', error);
              const randomSymbol = displaySymbols[Math.floor(Math.random() * displaySymbols.length)];
              reelFinalSymbols.push(randomSymbol);
            }
          } else {
            const randomSymbol = displaySymbols[Math.floor(Math.random() * displaySymbols.length)];
            reelFinalSymbols.push(randomSymbol);
          }
        });
      } else {
        // Random symbols for this reel even in win case
        symbolSprites.forEach(sprite => {
          const randomSymbol = displaySymbols[Math.floor(Math.random() * displaySymbols.length)];
          try {
            sprite.texture = PIXI.Texture.from(randomSymbol);
            reelFinalSymbols.push(randomSymbol);
          } catch (error) {
            console.warn('Failed to set random symbol:', error);
            reelFinalSymbols.push(displaySymbols[0]); // Fallback
          }
        });
      }
    } else {
      // For losses, ensure no matching lines
      symbolSprites.forEach(sprite => {
        const randomSymbol = displaySymbols[Math.floor(Math.random() * displaySymbols.length)];
        try {
          sprite.texture = PIXI.Texture.from(randomSymbol);
          reelFinalSymbols.push(randomSymbol);
        } catch (error) {
          console.warn('Failed to set losing symbol:', error);
          reelFinalSymbols.push(displaySymbols[0]); // Fallback
        }
      });
    }

    // Store this reel's final symbols
    finalSymbolsRef.current[reelIndex] = reelFinalSymbols;

    // If this is the last reel, emit all final symbols
    if (reelIndex === reels - 1) {
      // Flatten the 2D array to 1D for easier consumption
      const allFinalSymbols = finalSymbolsRef.current.flat();
      console.log('[PixiSlotPreview] Emitting final spin symbols:', allFinalSymbols);

      // Emit the final symbols to parent component
      window.dispatchEvent(new CustomEvent('finalSpinSymbols', {
        detail: { finalSymbols: allFinalSymbols }
      }));
    }
  };

  // Check for bonus symbols and trigger Free Spin mode
  const checkBonusSymbols = () => {
    const allSymbols = finalSymbolsRef.current.flat();
    console.log('🔍 Checking symbols:', allSymbols);
    
    const scatterCount = allSymbols.filter(symbol => 
      symbol && symbol.toLowerCase().includes('scatter')
    ).length;
    
    const bonusCount = allSymbols.filter(symbol => 
      symbol && symbol.toLowerCase().includes('bonus')
    ).length;
    
    console.log(`📊 Scatter count: ${scatterCount}, Bonus count: ${bonusCount}`);
    
    // Trigger Free Spin mode if 3+ scatter symbols
    if (scatterCount >= 3) {
      console.log('🎰 Free Spin mode triggered!');
      setIsFreeSpinMode(true);
      
      // Dispatch event for PixiSlotMockup background transition
      window.dispatchEvent(new CustomEvent('previewFreespinTransition', {
        detail: {
          direction: 'to-freespin',
          style: 'fade',
          duration: 1.0,
          backgroundImage: (config as any)?.derivedBackgrounds?.freespin || (config as any)?.freeSpinBackgroundImage
        }
      }));
    }
    
    // Show bonus popup for bonus symbols
    if (bonusCount >= 3) {
      setTimeout(() => setShowBonusPopup(true), 500);
    }
  };
  
  // Switch to Free Spin background
  const switchToFreeSpinBackground = async () => {
    console.log('🎨 switchToFreeSpinBackground called');
    console.log('📋 Config:', { 
      derivedBackgrounds: (config as any)?.derivedBackgrounds,
      freeSpinBackgroundImage: (config as any)?.freeSpinBackgroundImage 
    });
    
    if (!appRef.current) {
      console.warn('⚠️ No PIXI app reference');
      return;
    }
    
    if (!backgroundSpriteRef.current) {
      console.warn('⚠️ No background sprite reference');
      return;
    }
    
    // Get Free Spin background from config
    const freeSpinBg = (config as any)?.derivedBackgrounds?.freespin || (config as any)?.freeSpinBackgroundImage;
    
    if (!freeSpinBg) {
      console.warn('⚠️ No Free Spin background configured');
      console.warn('Available config keys:', Object.keys(config));
      return;
    }
    
    try {
      console.log('🎨 Loading Free Spin background:', freeSpinBg.substring(0, 50) + '...');
      const freeSpinTexture = await loadTextureFromUrl(freeSpinBg);
      
      if (freeSpinTexture && backgroundSpriteRef.current) {
        // Fade out current background
        gsap.to(backgroundSpriteRef.current, {
          alpha: 0,
          duration: 0.5,
          onComplete: () => {
            if (!backgroundSpriteRef.current) return;
            
            // Change texture
            backgroundSpriteRef.current.texture = freeSpinTexture;
            
            // Recalculate scale for new texture
            const containerDimensions = {
              width: appRef.current!.screen.width,
              height: appRef.current!.screen.height
            };
            
            const { position = { x: 0, y: 0 }, scale = 100, fit = 'cover' } = backgroundAdjustments;
            
            if (fit === 'cover') {
              const scaleX = containerDimensions.width / freeSpinTexture.width;
              const scaleY = containerDimensions.height / freeSpinTexture.height;
              const finalScale = Math.max(scaleX, scaleY) * (scale / 100);
              backgroundSpriteRef.current.scale.set(finalScale);
            } else if (fit === 'contain') {
              const scaleX = containerDimensions.width / freeSpinTexture.width;
              const scaleY = containerDimensions.height / freeSpinTexture.height;
              const finalScale = Math.min(scaleX, scaleY) * (scale / 100);
              backgroundSpriteRef.current.scale.set(finalScale);
            }
            
            // Recenter
            backgroundSpriteRef.current.x = (containerDimensions.width - backgroundSpriteRef.current.width) / 2 + position.x;
            backgroundSpriteRef.current.y = (containerDimensions.height - backgroundSpriteRef.current.height) / 2 + position.y;
            
            // Fade in new background
            gsap.to(backgroundSpriteRef.current, {
              alpha: 1,
              duration: 0.5
            });
            
            console.log('✅ Free Spin background loaded successfully');
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to load Free Spin background:', error);
    }
  };

  // Show win effects
  const showWinEffects = (winType: string) => {
    console.log(`🎰 Showing ${winType} effects`);

    // Add win effects based on win type
    reelContainersRef.current.forEach(reel => {
      gsap.to(reel.scale, {
        x: 1.1,
        y: 1.1,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        onComplete: () => {
          // Reset to original scale
          gsap.to(reel.scale, {
            x: 1,
            y: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        }
      });
    });
    
    checkBonusSymbols();
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* PixiJS Canvas Container */}
      <div 
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-red-300 text-6xl mb-4">⚠️</div>
            <p className="text-red-200 font-bold mb-2">PixiJS Error</p>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <p className="text-xs text-red-400">Switch to CSS mode in the header</p>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {!error && !isReady && (
        <div className="absolute inset-0 bg-[#041022] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400 mx-auto mb-3"></div>
            <p className="text-blue-300 text-sm">Loading Slot Machine...</p>
          </div>
        </div>
      )}
      
      {/* Spinning Overlay */}
      {/* {isSpinning && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-white text-2xl font-bold animate-pulse">SPINNING...</div>
          </div>
        </div>
      )} */}
      
      {/* Debug Info */}
      {isReady && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-xs">
          <div>PixiJS Slot: {reels}×{rows}</div>
          <div>Symbols: {symbols.length}</div>
          <div>GSAP: Ready</div>
        </div>
      )}
      
      {/* Pick & Click Bonus Announcement */}
      {showBonusPopup && (
        <PickAndClickAnnouncementModal onClose={() => setShowBonusPopup(false)} />
      )}
    </div>
  );
};

export default PixiSlotPreview;