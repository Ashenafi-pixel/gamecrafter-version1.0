import React, { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '../../store';
import { 
  calculatePixiMockupDimensions, 
  generatePixiPlaceholderSymbols, 
  createSymbolCellTexture,
  loadTextureFromUrl,
  pixiMockupStyles 
} from './pixiMockupUtils';

interface PixiSlotMockupProps {
  cols: number;
  rows: number;
  symbols?: string[];
  background?: string;
  frame?: string;
  className?: string;
  showControls?: boolean;
  isMobile?: boolean;
  orientation?: 'portrait' | 'landscape';
  customOffset?: { x: number; y: number };
  // Grid adjustment props
  gridAdjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    stretch?: { x: number; y: number };
  };
  // Frame adjustment props
  frameAdjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    stretch?: { x: number; y: number };
  };
  // Background adjustment props
  backgroundAdjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  };
  // UI button adjustment props
  uiButtonAdjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    visibility?: boolean;
  };
  // Logo props
  logo?: string;
  logoPosition?: { x: number; y: number };
  logoScale?: number;
  logoPositioningMode?: boolean;
  onLogoPositionChange?: (position: { x: number; y: number }) => void;
  onLogoScaleChange?: (scale: number) => void;
}

/**
 * PixiJS Slot Mockup Component
 * 
 * Replicates the exact visual appearance of the CSS Slot Mockup
 * using PixiJS for better performance and consistency.
 */
const PixiSlotMockup: React.FC<PixiSlotMockupProps> = ({
  cols,
  rows,
  symbols = [],
  background,
  frame,
  className = '',
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
  const { config } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const [forceUpdateKey, setForceUpdateKey] = useState(0);

  // Auto-retrieve assets from store if not passed as props
  const finalLogo = logo || (config as any)?.logo || (config as any)?.gameName;
  const finalBackground = background || (config as any)?.background?.backgroundImage || (config as any)?.backgroundImage;
  const finalFrame = frame || (config as any)?.frame?.frameImage || (config as any)?.frameImage || (config as any)?.frame;
  const finalSymbols = symbols.length > 0 ? symbols : config?.theme?.generated?.symbols || [];

  // Debug frame loading
  React.useEffect(() => {
    console.log('[PixiSlotMockup] Frame debug:', {
      frameProp: frame,
      configFrame: (config as any)?.frame,
      configFrameImage: (config as any)?.frame?.frameImage,
      configFrameImageDirect: (config as any)?.frameImage,
      finalFrame: finalFrame
    });
  }, [frame, config, finalFrame]);

  // Logo drag state for interactive positioning
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isResizingLogo, setIsResizingLogo] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [startScale, setStartScale] = useState(100);

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const initPixi = async () => {
      try {
        const rect = containerRef.current!.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });

        // Create PixiJS application
        const app = new PIXI.Application({
          width: rect.width,
          height: rect.height,
          backgroundColor: pixiMockupStyles.backgroundColor,
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

        appRef.current = app;
        
        // Render the slot machine
        await renderSlotMachine(app);
        
        setIsReady(true);
        console.log('[PixiSlotMockup] PixiJS application initialized');
      } catch (error) {
        console.error('[PixiSlotMockup] Failed to initialize PixiJS:', error);
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

  // Listen for individual button updates
  useEffect(() => {
    const handleIndividualButtonsUpdate = (event: CustomEvent) => {
      console.log('[PixiSlotMockup] Received individual buttons update:', event.detail);
      if (appRef.current && isReady) {
        // Force re-render to show new buttons
        renderSlotMachine(appRef.current);
      }
    };

    window.addEventListener('individualButtonsUpdated', handleIndividualButtonsUpdate as EventListener);

    return () => {
      window.removeEventListener('individualButtonsUpdated', handleIndividualButtonsUpdate as EventListener);
    };
  }, [isReady]);

  // Listen for background updates from Step 6
  useEffect(() => {
    const handleBackgroundUpdate = (event: CustomEvent) => {
      console.log('[PixiSlotMockup] Received background update:', event.detail);
      if (appRef.current && isReady) {
        // Force re-render to show new background
        renderSlotMachine(appRef.current);
      }
    };

    window.addEventListener('backgroundUpdated', handleBackgroundUpdate as EventListener);

    return () => {
      window.removeEventListener('backgroundUpdated', handleBackgroundUpdate as EventListener);
    };
  }, [isReady]);

  // Update container dimensions on resize and view mode changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && appRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newDimensions = { width: rect.width, height: rect.height };

        // Always update if app is ready, even if dimensions seem the same
        // This handles cases where the container changes between steps
        if (isReady && (newDimensions.width > 0 && newDimensions.height > 0)) {
          console.log('[PixiSlotMockup] Updating dimensions:', {
            old: containerDimensions,
            new: newDimensions,
            changed: newDimensions.width !== containerDimensions.width || newDimensions.height !== containerDimensions.height
          });

          setContainerDimensions(newDimensions);

          // Resize PixiJS application
          appRef.current.renderer.resize(newDimensions.width, newDimensions.height);

          // Force re-render to ensure UI is positioned correctly
          setTimeout(() => {
            if (appRef.current) {
              renderSlotMachine(appRef.current);
            }
          }, 50); // Small delay to ensure resize is complete
        }
      }
    };

    // Initial update
    updateDimensions();

    // Listen for resize events
    window.addEventListener('resize', updateDimensions);

    // Use ResizeObserver for more accurate container size tracking
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        // Debounce the resize observer
        setTimeout(updateDimensions, 10);
      });
      resizeObserver.observe(containerRef.current);
    }

    // Also update on visibility change (when switching between steps)
    const handleVisibilityChange = () => {
      if (!document.hidden && appRef.current && isReady) {
        console.log('[PixiSlotMockup] Visibility changed, updating dimensions...');
        setTimeout(updateDimensions, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [containerDimensions.width, containerDimensions.height, isReady]);

  // Force re-render when view mode related props change
  useEffect(() => {
    if (appRef.current && isReady) {
      console.log('[PixiSlotMockup] View mode changed, re-rendering...');
      renderSlotMachine(appRef.current);
    }
  }, [isMobile, orientation, isReady]);

  // Listen for step navigation events (same as CSS version)
  useEffect(() => {
    const handleSymbolsChanged = (event: any) => {
      console.log('[PixiSlotMockup] Symbols changed event received:', event.detail);
      if (appRef.current && isReady) {
        renderSlotMachine(appRef.current);
      }
    };

    const handleLayoutChanged = (event: any) => {
      console.log('[PixiSlotMockup] Layout changed event received:', event.detail);
      if (appRef.current && isReady) {
        renderSlotMachine(appRef.current);
      }
    };

    // Listen for step navigation events
    window.addEventListener('symbolsChanged', handleSymbolsChanged);
    window.addEventListener('layoutChanged', handleLayoutChanged);

    return () => {
      window.removeEventListener('symbolsChanged', handleSymbolsChanged);
      window.removeEventListener('layoutChanged', handleLayoutChanged);
    };
  }, [isReady]);

  // Force update when key props change (indicating step navigation)
  useEffect(() => {
    console.log('[PixiSlotMockup] Key props changed, forcing update...');
    setForceUpdateKey(prev => prev + 1);

    // Force a complete re-render after a short delay
    if (appRef.current && isReady) {
      setTimeout(() => {
        if (appRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setContainerDimensions({ width: rect.width, height: rect.height });
            appRef.current.renderer.resize(rect.width, rect.height);
            renderSlotMachine(appRef.current);
          }
        }
      }, 100);
    }
  }, [cols, rows, showControls, isMobile, orientation, isReady]);

  // Re-render when props change OR when navigating between steps
  useEffect(() => {
    if (appRef.current && isReady) {
      console.log('[PixiSlotMockup] Props changed, re-rendering...', {
        cols, rows,
        symbolsCount: finalSymbols.length,
        hasBackground: !!finalBackground,
        hasFrame: !!finalFrame,
        hasLogo: !!finalLogo,
        containerDimensions
      });
      renderSlotMachine(appRef.current);
    }
  }, [cols, rows, finalSymbols, finalBackground, finalFrame, finalLogo, logoPosition, logoScale, gridAdjustments, frameAdjustments, backgroundAdjustments, uiButtonAdjustments, isReady, containerDimensions]);

  // Create default UI buttons (fallback when no AI buttons are generated)
  const createDefaultUIButtons = (app: PIXI.Application) => {
    const defaultButtons = [
      { name: 'SPIN', color: 0xFFD700, x: 0, size: 80, icon: '▶' },
      { name: 'AUTO', color: 0x4169E1, x: 90, size: 60, icon: '⟲' },
      { name: 'MENU', color: 0xFF6347, x: 160, size: 60, icon: '☰' },
      { name: 'SOUND', color: 0x32CD32, x: 230, size: 60, icon: '♪' },
      { name: 'SETTINGS', color: 0x9370DB, x: 300, size: 60, icon: '⚙' }
    ];

    const buttonY = containerDimensions.height - 80;
    const startX = (containerDimensions.width - 360) / 2; // Center the button group

    defaultButtons.forEach((buttonDef) => {
      const button = new PIXI.Graphics();
      button.name = `ui-button-${buttonDef.name.toLowerCase()}`;

      // Draw circular button
      button.beginFill(buttonDef.color, 0.8);
      button.drawCircle(0, 0, buttonDef.size / 2);
      button.endFill();

      // Add border
      button.lineStyle(2, 0xFFFFFF, 0.5);
      button.drawCircle(0, 0, buttonDef.size / 2);

      // Position button
      button.x = startX + buttonDef.x;
      button.y = buttonY;

      // Apply UI button adjustments
      if (uiButtonAdjustments) {
        const { position, scale } = uiButtonAdjustments;

        if (position) {
          button.x += position.x;
          button.y += position.y;
        }

        if (scale && scale !== 100) {
          const scaleValue = scale / 100;
          button.scale.set(scaleValue);
        }
      }

      // Add icon and text label
      const iconText = new PIXI.Text(buttonDef.icon, {
        fontFamily: 'Arial',
        fontSize: buttonDef.size / 3,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      });
      iconText.anchor.set(0.5, 0.3);
      button.addChild(iconText);

      // Add smaller text label below icon
      const labelText = new PIXI.Text(buttonDef.name, {
        fontFamily: 'Arial',
        fontSize: buttonDef.size / 6,
        fill: 0xFFFFFF,
        fontWeight: 'normal'
      });
      labelText.anchor.set(0.5, -0.3);
      button.addChild(labelText);

      app.stage.addChild(button);
    });

    console.log('[PixiSlotMockup] Created default UI buttons:', defaultButtons.map(b => b.name));
  };

  // Create UI buttons from generated UI button sheet or individual buttons
  // const createUIButtons = async (app: PIXI.Application) => {
  //   // Remove existing UI buttons first (including control buttons)
  //   const existingButtons = app.stage.children.filter(child =>
  //     child.name && (child.name.startsWith('ui-button-') || child.name.startsWith('control-button-'))
  //   );
  //   existingButtons.forEach(button => {
  //     app.stage.removeChild(button);
  //     button.destroy();
  //   });

  //   // Check if UI buttons should be visible
  //   if (uiButtonAdjustments?.visibility === false) {
  //     console.log('[PixiSlotMockup] UI buttons hidden by visibility setting');
  //     return;
  //   }

  //   // Get UI buttons from config - check multiple possible locations
  //   const uiButtonsPath = (config as any)?.uiButtonsPath || (config as any)?.theme?.generated?.uiButtons;
  //   const extractedButtons = (config as any)?.extractedUIButtons || (config as any)?.uiElements;

  //   console.log('[PixiSlotMockup] UI Button Debug:', {
  //     uiButtonsPath: !!uiButtonsPath,
  //     extractedButtons: extractedButtons ? Object.keys(extractedButtons) : null,
  //     configKeys: Object.keys(config || {}),
  //     hasUiElements: !!(config as any)?.uiElements,
  //     hasExtractedUIButtons: !!(config as any)?.extractedUIButtons,
  //     uiButtonAdjustments: uiButtonAdjustments
  //   });

  //   // If no AI-generated buttons, show default buttons
  //   if (!uiButtonsPath && !extractedButtons) {
  //     console.log('[PixiSlotMockup] No AI buttons found, showing default buttons');
  //     createDefaultUIButtons(app);
  //     return;
  //   }

  //   try {
  //     // If we have extracted individual buttons, use those
  //     if (extractedButtons && Object.keys(extractedButtons).length > 0) {
  //       console.log('[PixiSlotMockup] Rendering individual UI buttons:', Object.keys(extractedButtons));

  //       // Map button names to match extraction function output
  //       const buttonMapping = [
  //         // { displayName: 'SPIN', extractedName: 'spinButton' },  
  //         // { displayName: 'AUTO', extractedName: 'autoplayButton' },
  //         // { displayName: 'MENU', extractedName: 'menuButton' },
  //         { displayName: 'SOUND', extractedName: 'soundButton' },
  //         { displayName: 'SETTINGS', extractedName: 'settingsButton' }
  //       ];

  //       const buttonSpacing = 90; // Reduced spacing for smaller buttons
  //       const startX = (containerDimensions.width - (buttonMapping.length * buttonSpacing)) / 2;
  //       const buttonY = containerDimensions.height - 80; // Position near bottom

  //       for (let i = 0; i < buttonMapping.length; i++) {
  //         const { displayName, extractedName } = buttonMapping[i];
  //         const buttonUrl = extractedButtons[extractedName] || extractedButtons[displayName] || extractedButtons[displayName.toLowerCase()];

  //         if (buttonUrl) {
  //           try {
  //             const buttonTexture = await loadTextureFromUrl(buttonUrl);
  //             if (buttonTexture) {
  //               const buttonSprite = new PIXI.Sprite(buttonTexture);

  //               // Set button name for identification and cleanup
  //               buttonSprite.name = `ui-button-${displayName.toLowerCase()}`;

  //               // Set base button size
  //               const baseButtonSize = displayName === 'SPIN' ? 80 : 60;

  //               // Apply scale first, then set size
  //               let finalScale = 1;
  //               if (uiButtonAdjustments?.scale && uiButtonAdjustments.scale !== 100) {
  //                 finalScale = uiButtonAdjustments.scale / 100;
  //               }

  //               // Set final button size with scale applied
  //               const finalButtonSize = baseButtonSize * finalScale;
  //               buttonSprite.width = finalButtonSize;
  //               buttonSprite.height = finalButtonSize;

  //               // Position button
  //               buttonSprite.x = startX + (i * buttonSpacing);
  //               buttonSprite.y = buttonY;

  //               // Apply UI button adjustments
  //               if (uiButtonAdjustments) {
  //                 const { position, scale } = uiButtonAdjustments;

  //                 // Apply position adjustments
  //                 if (position) {
  //                   buttonSprite.x += position.x;
  //                   buttonSprite.y += position.y;
  //                 }

  //                 console.log(`[PixiSlotMockup] ${displayName} button adjustments applied:`, {
  //                   baseSize: baseButtonSize,
  //                   scale: scale,
  //                   finalScale: finalScale,
  //                   finalSize: finalButtonSize,
  //                   position: position,
  //                   finalPosition: { x: buttonSprite.x, y: buttonSprite.y }
  //                 });
  //               }

  //               app.stage.addChild(buttonSprite);
  //               console.log(`[PixiSlotMockup] Added ${displayName} button at (${buttonSprite.x}, ${buttonSprite.y})`);
  //             }
  //           } catch (error) {
  //             console.error(`[PixiSlotMockup] Failed to load ${displayName} button:`, error);
  //           }
  //         }
  //       }
  //     }
  //     // Fallback to full button sheet if no extracted buttons
  //     else if (uiButtonsPath) {
  //       console.log('[PixiSlotMockup] Rendering UI button sheet:', uiButtonsPath);

  //       const buttonTexture = await loadTextureFromUrl(uiButtonsPath);
  //       if (buttonTexture) {
  //         const buttonSprite = new PIXI.Sprite(buttonTexture);

  //         // Set button name for identification and cleanup
  //         buttonSprite.name = 'ui-button-sheet';

  //         // Calculate base scale to fit in the UI area
  //         const maxWidth = containerDimensions.width * 0.8;
  //         const maxHeight = 100;
  //         const baseScale = Math.min(maxWidth / buttonTexture.width, maxHeight / buttonTexture.height);

  //         // Apply user scale adjustment
  //         let finalScale = baseScale;
  //         if (uiButtonAdjustments?.scale && uiButtonAdjustments.scale !== 100) {
  //           const userScale = uiButtonAdjustments.scale / 100;
  //           finalScale = baseScale * userScale;
  //         }

  //         // Set final button sheet size
  //         buttonSprite.width = buttonTexture.width * finalScale;
  //         buttonSprite.height = buttonTexture.height * finalScale;

  //         // Position at bottom center
  //         buttonSprite.x = (containerDimensions.width - buttonSprite.width) / 2;
  //         buttonSprite.y = containerDimensions.height - buttonSprite.height - 20;

  //         // Apply UI button adjustments
  //         if (uiButtonAdjustments) {
  //           const { position, scale: adjustScale } = uiButtonAdjustments;

  //           // Apply position adjustments
  //           if (position) {
  //             buttonSprite.x += position.x;
  //             buttonSprite.y += position.y;
  //           }

  //           console.log(`[PixiSlotMockup] Button sheet adjustments applied:`, {
  //             baseScale: baseScale,
  //             userScale: adjustScale,
  //             finalScale: finalScale,
  //             position: position,
  //             finalPosition: { x: buttonSprite.x, y: buttonSprite.y },
  //             finalSize: { width: buttonSprite.width, height: buttonSprite.height }
  //           });
  //         }

  //         app.stage.addChild(buttonSprite);
  //         console.log('[PixiSlotMockup] Added UI button sheet');
  //       }
  //     }
  //   } catch (error) {
  //     console.error('[PixiSlotMockup] Failed to create UI buttons:', error);
  //   }
  // };

  // Render the slot machine using PixiJS
  const renderSlotMachine = async (app: PIXI.Application) => {
    // Clear existing content
    app.stage.removeChildren();

    console.log('[PixiSlotMockup] Rendering with dimensions:', containerDimensions);

    const { width: containerWidth, height: containerHeight } = containerDimensions;

    // Calculate grid dimensions
    const gridDimensions = calculatePixiMockupDimensions({
      cols,
      rows,
      containerWidth,
      containerHeight,
      isMobile,
      orientation
    });

    // Create background
    if (finalBackground) {
      try {
        const backgroundTexture = await loadTextureFromUrl(finalBackground);
        if (backgroundTexture) {
          const backgroundSprite = new PIXI.Sprite(backgroundTexture);

          // Apply background adjustments
          if (backgroundAdjustments) {
            const { position, scale, fit } = backgroundAdjustments;

            // Apply fit mode
            const fitMode = fit || 'cover';
            const textureAspect = backgroundTexture.width / backgroundTexture.height;
            const containerAspect = containerWidth / containerHeight;

            let spriteWidth = containerWidth;
            let spriteHeight = containerHeight;

            switch (fitMode) {
              case 'cover':
                if (textureAspect > containerAspect) {
                  spriteWidth = containerHeight * textureAspect;
                  spriteHeight = containerHeight;
                } else {
                  spriteWidth = containerWidth;
                  spriteHeight = containerWidth / textureAspect;
                }
                break;
              case 'contain':
                if (textureAspect > containerAspect) {
                  spriteWidth = containerWidth;
                  spriteHeight = containerWidth / textureAspect;
                } else {
                  spriteWidth = containerHeight * textureAspect;
                  spriteHeight = containerHeight;
                }
                break;
              case 'fill':
                spriteWidth = containerWidth;
                spriteHeight = containerHeight;
                break;
              case 'scale-down':
                const scaleDownWidth = Math.min(containerWidth, backgroundTexture.width);
                const scaleDownHeight = Math.min(containerHeight, backgroundTexture.height);
                if (textureAspect > containerAspect) {
                  spriteWidth = scaleDownWidth;
                  spriteHeight = scaleDownWidth / textureAspect;
                } else {
                  spriteWidth = scaleDownHeight * textureAspect;
                  spriteHeight = scaleDownHeight;
                }
                break;
            }

            // Apply scale adjustment
            const scaleValue = (scale || 100) / 100;
            spriteWidth *= scaleValue;
            spriteHeight *= scaleValue;

            backgroundSprite.width = spriteWidth;
            backgroundSprite.height = spriteHeight;

            // Center the background and apply position adjustments
            backgroundSprite.anchor.set(0.5);
            backgroundSprite.x = containerWidth / 2 + ((position?.x || 0) * containerWidth / 100);
            backgroundSprite.y = containerHeight / 2 + ((position?.y || 0) * containerHeight / 100);

            console.log('[PixiSlotMockup] Background applied with adjustments:', {
              position: backgroundAdjustments?.position,
              scale: backgroundAdjustments?.scale,
              fit: backgroundAdjustments?.fit,
              finalSize: { width: spriteWidth, height: spriteHeight },
              finalPosition: { x: backgroundSprite.x, y: backgroundSprite.y }
            });
          } else {
            // Default behavior without adjustments
            backgroundSprite.width = containerWidth;
            backgroundSprite.height = containerHeight;
          }

          app.stage.addChild(backgroundSprite);
        }
      } catch (error) {
        console.error('[PixiSlotMockup] Failed to load background:', error);
      }
    }

    // Create symbol grid
    await createSymbolGrid(app, gridDimensions);

    // Create frame overlay
    if (finalFrame) {
      try {
        const frameTexture = await loadTextureFromUrl(finalFrame);
        if (frameTexture) {
          const frameSprite = new PIXI.Sprite(frameTexture);

          // Set initial size to container dimensions
          frameSprite.width = containerWidth;
          frameSprite.height = containerHeight;

          // Apply frame adjustments
          if (frameAdjustments) {
            const { position, scale, stretch } = frameAdjustments;

            // Apply position adjustments
            if (position) {
              frameSprite.x += position.x;
              frameSprite.y += position.y;
            }

            // Apply scale and stretch adjustments with a base scale reduction for smaller frames
            const baseScale = 0.65; // Reduce base frame size by 15%
            const scaleValue = (scale || 100) / 100;
            const stretchX = (stretch?.x || 100) / 100;
            const stretchY = (stretch?.y || 100) / 100;

            frameSprite.scale.set(baseScale * scaleValue * stretchX, baseScale * scaleValue * stretchY);

            // Center the frame after scaling
            frameSprite.anchor.set(0.5);
            frameSprite.x = containerWidth / 2 + (position?.x || 0);
            frameSprite.y = containerHeight / 2 + (position?.y || 0);
          }

          app.stage.addChild(frameSprite);

          console.log('[PixiSlotMockup] Frame applied with adjustments:', {
            position: frameAdjustments?.position,
            scale: frameAdjustments?.scale,
            stretch: frameAdjustments?.stretch,
            finalScale: frameSprite.scale
          });
        }
      } catch (error) {
        console.error('[PixiSlotMockup] Failed to load frame:', error);
      }
    }

    // Create UI buttons
    // await createUIButtons(app);

    // Create programmatic reel dividers (ensures correct number)
    createReelDividers(app);

    // Create logo
    if (finalLogo) {
      await createLogo(app);
    }

    // Create UI controls
    if (showControls) {
      await createUIControls(app);
    }
  };

  // Create symbol grid
  const createSymbolGrid = async (app: PIXI.Application, gridDimensions: any) => {
    const { symbolSize, gridWidth, gridHeight, symbolPadding } = gridDimensions;

    // Generate display symbols
    const displaySymbols = generateDisplaySymbols();

    // Create grid container - CENTER IT PROPERLY like CSS version
    const gridContainer = new PIXI.Container();

    // EXACT MATCH TO CSS: Center the grid in the container
    // CSS uses: top: '40%', left: '50%', transform: 'translate(-50%, -50%)'
    gridContainer.x = containerDimensions.width * 0.5 - gridWidth * 0.5;
    gridContainer.y = containerDimensions.height * 0.4 - gridHeight * 0.5;

    // Apply custom offset for mobile views (same as CSS version)
    if (customOffset) {
      gridContainer.x += customOffset.x;
      gridContainer.y += customOffset.y;
    }

    // Apply grid adjustments from Step 6
    if (gridAdjustments) {
      const { position, scale, stretch } = gridAdjustments;

      // Apply position adjustments
      if (position) {
        gridContainer.x += position.x;
        gridContainer.y += position.y;
      }

      // Apply scale and stretch adjustments
      const scaleValue = (scale || 100) / 100;
      const stretchX = (stretch?.x || 100) / 100;
      const stretchY = (stretch?.y || 100) / 100;

      gridContainer.scale.set(scaleValue * stretchX, scaleValue * stretchY);
    }

    console.log('[PixiSlotMockup] Grid positioned at:', {
      x: gridContainer.x,
      y: gridContainer.y,
      scaleX: gridContainer.scale.x,
      scaleY: gridContainer.scale.y,
      gridWidth,
      gridHeight,
      containerWidth: containerDimensions.width,
      containerHeight: containerDimensions.height,
      customOffset,
      gridAdjustments
    });
    
    // Create symbol cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        const symbol = displaySymbols[index];
        
        const cellX = col * (symbolSize + symbolPadding);
        const cellY = row * (symbolSize + symbolPadding);
        
        // Create cell background
        const cellTexture = createSymbolCellTexture(app, symbolSize);
        const cellSprite = new PIXI.Sprite(cellTexture);
        cellSprite.x = cellX;
        cellSprite.y = cellY;
        gridContainer.addChild(cellSprite);
        
        // Create symbol
        if (symbol) {
          try {
            const symbolTexture = await loadTextureFromUrl(symbol);
            if (symbolTexture) {
              const symbolSprite = new PIXI.Sprite(symbolTexture);
              symbolSprite.width = symbolSize * 0.5;
              symbolSprite.height = symbolSize * 0.6;
              symbolSprite.x = cellX + (symbolSize - symbolSprite.width) * 0.5;
              symbolSprite.y = cellY + (symbolSize - symbolSprite.height) * 0.5;
              gridContainer.addChild(symbolSprite);
            }
          } catch (error) {
            console.error(`[PixiSlotMockup] Failed to load symbol ${symbol}:`, error);
          }
        }
      }
    }
    
    app.stage.addChild(gridContainer);
  };

  // Generate display symbols (same logic as CSS version)
  const generateDisplaySymbols = () => {
    const totalCells = cols * rows;
    const displaySymbols: string[] = [];
    const symbolsToUse = finalSymbols;

    if (symbolsToUse.length === 0) {
      return generatePixiPlaceholderSymbols(cols, rows, 'default');
    } else if (symbolsToUse.length === 1) {
      for (let i = 0; i < totalCells; i++) {
        displaySymbols.push(symbolsToUse[0] as string);
      }
    } else {
      for (let i = 0; i < totalCells; i++) {
        const symbol = symbolsToUse[i % symbolsToUse.length];
        const symbolUrl = typeof symbol === 'string' ? symbol : (symbol as any)?.url || (symbol as any)?.imageUrl;
        displaySymbols.push(symbolUrl);
      }
    }

    return displaySymbols;
  };

  // Create programmatic reel dividers to ensure correct number
  const createReelDividers = (app: PIXI.Application) => {
    // Remove existing reel dividers
    const existingDividers = app.stage.children.filter(child =>
      child.name && child.name.startsWith('reel-divider')
    );
    existingDividers.forEach(divider => {
      app.stage.removeChild(divider);
      divider.destroy();
    });

    // Only create dividers if frame style includes reels
    const frameStyle = (config as any)?.frameStyle;
    if (frameStyle !== 'reel' && frameStyle !== 'both') {
      return;
    }

    // Calculate grid area (same as symbol grid)
    const gridWidth = containerDimensions.width * 0.6;
    const gridHeight = containerDimensions.height * 0.6;
    const gridX = (containerDimensions.width - gridWidth) / 2;
    const gridY = (containerDimensions.height - gridHeight) / 2;

    // Apply grid adjustments and frame adjustments
    const adjustedGridX = gridX + (gridAdjustments?.position?.x || 0) + (frameAdjustments?.position?.x || 0);
    const adjustedGridY = gridY + (gridAdjustments?.position?.y || 0) + (frameAdjustments?.position?.y || 0);
    const gridScale = (gridAdjustments?.scale || 100) / 100;
    const frameScale = (frameAdjustments?.scale || 100) / 100;
    const finalGridWidth = gridWidth * gridScale * frameScale;
    const finalGridHeight = gridHeight * gridScale * frameScale;

    // Create exactly (cols - 1) vertical dividers
    const numDividers = cols - 1;
    const columnWidth = finalGridWidth / cols;

    // Get theme-appropriate divider color
    const themeName = typeof config.theme === 'string' ? config.theme : (config.theme?.mainTheme || 'casino');
    let dividerColor = 0xFFD700; // Default gold
    let dividerAlpha = 0.6;

    // Theme-based divider styling
    if (themeName.includes('space') || themeName.includes('cyber')) {
      dividerColor = 0x00FFFF; // Cyan for space/cyber themes
      dividerAlpha = 0.8;
    } else if (themeName.includes('nature') || themeName.includes('forest')) {
      dividerColor = 0x8B4513; // Brown for nature themes
      dividerAlpha = 0.7;
    } else if (themeName.includes('ocean') || themeName.includes('water')) {
      dividerColor = 0x4169E1; // Blue for ocean themes
      dividerAlpha = 0.7;
    }

    for (let i = 1; i <= numDividers; i++) {
      const divider = new PIXI.Graphics();
      divider.name = `reel-divider-${i}`;

      // Draw a thin vertical line with theme-appropriate styling
      const lineWidth = Math.max(1, Math.min(3, finalGridWidth / 200)); // Responsive line width
      divider.lineStyle(lineWidth, dividerColor, dividerAlpha);
      divider.moveTo(0, 0);
      divider.lineTo(0, finalGridHeight);

      // Position the divider
      const dividerX = adjustedGridX + (i * columnWidth);
      const dividerY = adjustedGridY;

      divider.x = dividerX;
      divider.y = dividerY;

      app.stage.addChild(divider);
    }

    console.log(`[PixiSlotMockup] Created ${numDividers} reel dividers for ${cols} columns`);
  };

  // Create logo
  const createLogo = async (app: PIXI.Application) => {
    if (!finalLogo) return;

    try {
      const logoTexture = await loadTextureFromUrl(finalLogo);
      if (logoTexture) {
        const logoSprite = new PIXI.Sprite(logoTexture);

        // Position logo using same logic as CSS version
        const baseX = containerDimensions.width * 0.5;
        const baseY = containerDimensions.height * 0.1;

        logoSprite.anchor.set(0.5, 0.5);
        logoSprite.x = baseX + logoPosition.x;
        logoSprite.y = baseY + logoPosition.y;
        logoSprite.scale.set(logoScale / 100 * 0.15); // Small base scale since we're using full 1024px image

        // Add interactive behavior if in positioning mode
        if (logoPositioningMode) {
          logoSprite.interactive = true;
          logoSprite.cursor = 'pointer';

          logoSprite.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            setIsDraggingLogo(true);
            const globalPos = event.global;
            setDragStart({ x: globalPos.x, y: globalPos.y });
            setStartPosition({ x: logoPosition.x, y: logoPosition.y });
          });
        }

        app.stage.addChild(logoSprite);
      }
    } catch (error) {
      console.error('[PixiSlotMockup] Failed to load logo:', error);
    }
  };

  // Create UI controls with responsive positioning
  const createUIControls = async (app: PIXI.Application) => {
    const { width: containerWidth, height: containerHeight } = containerDimensions;

    // Remove existing UI container if it exists
    const existingUIContainer = app.stage.children.find(child => child.name === 'uiContainer');
    if (existingUIContainer) {
      app.stage.removeChild(existingUIContainer);
      existingUIContainer.destroy();
    }

    // Create UI container for better management
    const uiContainer = new PIXI.Container();
    uiContainer.name = 'uiContainer';

    // Adjust UI positioning based on view mode and mobile status
    const uiBottomOffset = isMobile ?
      (orientation === 'portrait' ? 80 : 60) :
      71; // Desktop offset

    const brandingHeight = 16;

    // Bottom UI Bar - positioned relative to container bottom
    const uiBar = new PIXI.Graphics();
    uiBar.beginFill(pixiMockupStyles.uiBackgroundColor, pixiMockupStyles.uiBackgroundAlpha);
    uiBar.drawRect(0, containerHeight - uiBottomOffset, containerWidth, 55);
    uiBar.endFill();
    uiContainer.addChild(uiBar);

    // Create UI text elements with responsive positioning
    const textY = containerHeight - uiBottomOffset + 27; // Center in UI bar
    createUIText(uiContainer, 'BET', '1.00', 60, textY, 'left');
    createUIText(uiContainer, 'WIN', '0.00', containerWidth - 180, textY, 'right', pixiMockupStyles.accentColor);
    createUIText(uiContainer, 'BALANCE', '1,000.00', containerWidth - 120, textY, 'right');

    // Create all UI buttons - matching CSS layout
    await createAllUIButtons(uiContainer, containerWidth, textY);

    // Bottom branding strip
    const brandingBar = new PIXI.Graphics();
    brandingBar.beginFill(0x111827, 1);
    brandingBar.drawRect(0, containerHeight - brandingHeight, containerWidth, brandingHeight);
    brandingBar.endFill();
    uiContainer.addChild(brandingBar);

    // Branding text
    const brandingText = new PIXI.Text('Premium Game | Game Crafter', {
      fontFamily: 'Arial',
      fontSize: 7,
      fill: 0xffffff,
      fontWeight: 'bold'
    });
    brandingText.x = 20;
    brandingText.y = containerHeight - brandingHeight + 5; // Center in branding bar
    uiContainer.addChild(brandingText);

    // Add UI container to stage
    app.stage.addChild(uiContainer);

    console.log('[PixiSlotMockup] UI positioned:', {
      containerWidth,
      containerHeight,
      uiBottomOffset,
      textY,
      isMobile,
      orientation
    });
  };

  // Create UI text helper
  const createUIText = (
    container: PIXI.Container,
    label: string,
    value: string,
    x: number,
    y: number,
    align: 'left' | 'right' = 'left',
    valueColor: number = pixiMockupStyles.textColor
  ) => {
    const labelText = new PIXI.Text(label, {
      fontFamily: 'Arial',
      fontSize: 8,
      fill: 0x6b7280,
      fontWeight: 'bold'
    });

    const valueText = new PIXI.Text(value, {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: valueColor,
      fontWeight: 'bold'
    });

    if (align === 'right') {
      labelText.anchor.set(1, 0);
      valueText.anchor.set(1, 0);
    }

    labelText.x = x;
    labelText.y = y - 15;
    valueText.x = x;
    valueText.y = y - 5;

    container.addChild(labelText);
    container.addChild(valueText);
  };

  // Create all UI buttons - matching CSS layout with AI replacement support
  const createAllUIButtons = async (container: PIXI.Container, containerWidth: number, textY: number) => {
    // Remove existing control buttons first
    const existingControlButtons = container.children.filter(child =>
      child.name && child.name.startsWith('control-button-')
    );
    existingControlButtons.forEach(button => {
      container.removeChild(button);
      button.destroy();
    });

    // Get AI-generated buttons
    const extractedButtons = (config as any)?.extractedUIButtons || (config as any)?.uiElements;

    // Button definitions matching CSS layout
    const buttonDefinitions = [
      {
        name: 'AUTO',
        aiKey: 'autoplayButton',
        x: containerWidth / 2 - 60,
        size: 28,
        color: 0x1F2937,
        icon: '⟲'
      },
      {
        name: 'SPIN',
        aiKey: 'spinButton',
        x: containerWidth / 2,
        size: 40,
        color: 0x10B981,
        icon: '▶',
        isMain: true
      },
      {
        name: 'QUICK',
        aiKey: 'quickButton',
        x: containerWidth / 2 + 60,
        size: 28,
        color: 0x1F2937,
        icon: '⏩'
      },
      {
        name: 'SOUND',
        aiKey: 'soundButton',
        x: containerWidth - 80,
        size: 32,
        color: 0x1F2937,
        icon: '♪'
      },
      {
        name: 'SETTINGS',
        aiKey: 'settingsButton',
        x: containerWidth - 40,
        size: 32,
        color: 0x1F2937,
        icon: '⚙'
      }
    ];

    // Create each button
    for (const buttonDef of buttonDefinitions) {
      await createControlButton(container, buttonDef, textY, extractedButtons);
    }

    console.log('[PixiSlotMockup] Created all UI control buttons');
  };

  // Create individual control button with AI replacement support
  const createControlButton = async (
    container: PIXI.Container,
    buttonDef: any,
    y: number,
    extractedButtons: any
  ) => {
    const aiButtonUrl = extractedButtons?.[buttonDef.aiKey] || extractedButtons?.[buttonDef.name];

    if (aiButtonUrl) {
      try {
        // Use AI-generated button
        const buttonTexture = await loadTextureFromUrl(aiButtonUrl);
        if (buttonTexture) {
          const buttonSprite = new PIXI.Sprite(buttonTexture);
          buttonSprite.name = `control-button-${buttonDef.name.toLowerCase()}`;

          // Set size
          buttonSprite.width = buttonDef.size;
          buttonSprite.height = buttonDef.size;

          // Center and position
          buttonSprite.anchor.set(0.5);
          buttonSprite.x = buttonDef.x;
          buttonSprite.y = y;
          buttonSprite.interactive = true;
          buttonSprite.cursor = 'pointer';

          container.addChild(buttonSprite);
          console.log(`[PixiSlotMockup] Using AI-generated ${buttonDef.name} button`);
          return;
        }
      } catch (error) {
        console.error(`[PixiSlotMockup] Failed to load AI ${buttonDef.name} button, using default:`, error);
      }
    }

    // Fallback to default graphics button
    const button = new PIXI.Graphics();
    button.name = `control-button-${buttonDef.name.toLowerCase()}`;

    // Create button background
    button.beginFill(buttonDef.color, buttonDef.isMain ? 1 : 0.8);
    button.drawCircle(0, 0, buttonDef.size / 2);
    button.endFill();

    // Add border for main button
    if (buttonDef.isMain) {
      button.lineStyle(2, 0xFFFFFF, 0.2);
      button.drawCircle(0, 0, buttonDef.size / 2);
    }

    button.x = buttonDef.x;
    button.y = y;
    button.interactive = true;
    button.cursor = 'pointer';

    // Add icon
    const iconText = new PIXI.Text(buttonDef.icon, {
      fontFamily: 'Arial',
      fontSize: buttonDef.size / 3,
      fill: 0xFFFFFF,
      fontWeight: 'bold'
    });
    iconText.anchor.set(0.5);
    button.addChild(iconText);

    container.addChild(button);
    console.log(`[PixiSlotMockup] Using default ${buttonDef.name} button`);
  };



  return (
    <div 
      ref={containerRef}
      className={`pixi-slot-mockup ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    />
  );
};

export default PixiSlotMockup;
