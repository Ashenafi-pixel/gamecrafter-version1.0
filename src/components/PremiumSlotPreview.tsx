import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

interface PremiumSlotPreviewProps {
  reels?: number;
  rows?: number;
  width?: number;
  height?: number;
  symbolImages?: string[];
  generatedSymbols?: Record<string, string>;
  gridConfig?: {
    reels: number;
    rows: number;
    layout?: string;
    paylines?: number;
  };
  onSpin?: () => void;
  balance?: number;
  bet?: number;
  win?: number;
  refreshKey?: string | number;
}

type ViewMode = 'desktop' | 'mobile-portrait' | 'mobile-landscape';

/**
 * EnhancedPremiumSlotPreview
 * 
 * Full PIXI.js + GSAP-based slot preview system replicating exact layout, spacing, fonts,
 * button styles, mobile mockups, and grid configurations from specifications.
 * 
 * Features:
 * - Dynamic 5x3 grid by default, synced live with Step 3 Grid Layout
 * - Full responsive desktop and mobile canvas rendering
 * - Transparent symbol fallbacks with professional styling
 * - Complete PIXI.js UI implementation matching CSS layouts
 * - GSAP animations for interactive elements
 * - Comprehensive fallback system (PIXI.js → Canvas2D → DOM)
 * - Debug tooling and development overlays
 * 
 * Specifications:
 * - Default Grid: 5x3 with dynamic updates from Step 3
 * - Resolution: 1200x800 crisp rendering
 * - Symbol Style: Transparent blocks with white borders and text labels
 * - Desktop Layout: 85% width grid area, professional footer UI
 * - Mobile Mockups: Realistic phone frames (320x640 portrait, 580x320 landscape)
 * - Animations: Spin button pulse, click feedback effects
 */
const PremiumSlotPreview: React.FC<PremiumSlotPreviewProps> = ({
  reels = 5,
  rows = 3,
  width = 1200,
  height = 800,
  symbolImages = [],
  generatedSymbols,
  gridConfig,
  onSpin,
  balance = 1000,
  bet = 1.00,
  win = 0.00,
  refreshKey
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spinButtonRef = useRef<PIXI.Container | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [renderMethod, setRenderMethod] = useState<'PIXI.js' | 'DOM Fallback'>('PIXI.js');

  // Dynamic grid configuration from Step 3 with live updates
  const effectiveReels = gridConfig?.reels || reels || 5;
  const effectiveRows = gridConfig?.rows || rows || 3;

  /**
   * Debug logging utility with view mode context
   */
  const debugLog = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎰 [EnhancedPremiumSlot:${viewMode}] ${message}`, data || '');
    }
  }, [viewMode]);

  /**
   * Symbol Path Resolution with Priority System
   * Priority: Generated Symbols > Uploaded Images > Transparent Fallback
   */
  const getSymbolPaths = useCallback(() => {
    debugLog(`Symbol check: generated=${generatedSymbols ? Object.keys(generatedSymbols).length : 0}, uploaded=${symbolImages.length}`);
    
    if (generatedSymbols && Object.keys(generatedSymbols).length > 0) {
      const paths = Object.values(generatedSymbols);
      debugLog(`Using ${paths.length} generated symbols`);
      return paths;
    }
    if (symbolImages.length > 0) {
      debugLog(`Using ${symbolImages.length} uploaded symbols`);
      return symbolImages;
    }
    debugLog('No symbols found, creating transparent fallbacks');
    return []; // Will create transparent fallback symbols
  }, [generatedSymbols, symbolImages, debugLog]);

  /**
   * DOM Fallback System
   * Complete fallback implementation for hardware compatibility
   */
  const createDOMFallback = useCallback((mockupEnabled: boolean, orientation: ViewMode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRenderMethod('DOM Fallback');
    debugLog(`Creating DOM fallback: mockupEnabled=${mockupEnabled}, orientation=${orientation}`);

    // Clear existing DOM elements
    document.querySelectorAll('.premium-slot-fallback').forEach(el => el.remove());

    const container = canvas.parentElement;
    if (!container) return;

    if (mockupEnabled && (orientation === 'mobile-portrait' || orientation === 'mobile-landscape')) {
      createDOMMobileMockup(container, orientation);
    } else {
      createDOMDesktopLayout(container);
    }
  }, []);

  /**
   * DOM Mobile Mockup Creation
   * Replicates mobile layouts with exact specifications
   */
  const createDOMMobileMockup = (container: HTMLElement, orientation: ViewMode) => {
    const isPortrait = orientation === 'mobile-portrait';
    
    const mockupContainer = document.createElement('div');
    mockupContainer.className = 'premium-slot-fallback mobile-mockup';
    mockupContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${isPortrait ? '320px' : '580px'};
      height: ${isPortrait ? '640px' : '320px'};
      background: linear-gradient(145deg, #2a2a2e, #1a1a1e);
      border-radius: ${isPortrait ? '40px' : '20px'};
      border: 3px solid #444447;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      z-index: 10;
    `;

    // Screen area
    const screen = document.createElement('div');
    screen.style.cssText = `
      position: absolute;
      top: ${isPortrait ? '30px' : '15px'};
      left: 20px;
      right: 20px;
      bottom: ${isPortrait ? '45px' : '25px'};
      background: #000;
      border-radius: ${isPortrait ? '25px' : '15px'};
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.style.cssText = `
      height: ${isPortrait ? '30px' : '20px'};
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 15px;
      color: white;
      font-size: ${isPortrait ? '12px' : '10px'};
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: bold;
    `;
    statusBar.innerHTML = '<span>9:41</span><span>100%</span>';

    // Game area
    const gameArea = document.createElement('div');
    gameArea.style.cssText = `
      flex: 1;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${isPortrait ? '25px' : '20px'};
    `;

    // Grid container with transparent symbols
    const gridContainer = document.createElement('div');
    const symbolSize = isPortrait ? 45 : 35;
    gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${effectiveReels}, ${symbolSize}px);
      grid-template-rows: repeat(${effectiveRows}, ${symbolSize}px);
      gap: 6px;
      padding: 8px;
      border-radius: 8px;
    `;

    // Create transparent symbols
    const symbolLabels = ['W', 'S', 'H1', 'H2', 'H3', 'M1', 'M2', 'L1', 'L2'];
    for (let reel = 0; reel < effectiveReels; reel++) {
      for (let row = 0; row < effectiveRows; row++) {
        const symbolIndex = (reel * effectiveRows + row) % symbolLabels.length;
        const symbol = document.createElement('div');
        symbol.style.cssText = `
          width: ${symbolSize}px;
          height: ${symbolSize}px;
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${isPortrait ? '10px' : '8px'};
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `;
        symbol.textContent = symbolLabels[symbolIndex];
        gridContainer.appendChild(symbol);
      }
    }

    // Mobile footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      height: ${isPortrait ? '50px' : '30px'};
      background: rgba(0,0,0,0.95);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${isPortrait ? '12px' : '10px'};
      font-weight: bold;
    `;

    const balanceEl = document.createElement('span');
    balanceEl.style.color = '#22c55e';
    balanceEl.textContent = `$${balance.toFixed(0)}`;

    const spinBtn = document.createElement('button');
    spinBtn.style.cssText = `
      width: ${isPortrait ? '35px' : '25px'};
      height: ${isPortrait ? '35px' : '25px'};
      background: #3b82f6;
      border: none;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      font-size: ${isPortrait ? '14px' : '10px'};
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    spinBtn.innerHTML = '▶';
    spinBtn.onclick = () => onSpin?.();

    const winEl = document.createElement('span');
    winEl.style.color = win > 0 ? '#22c55e' : '#ffffff';
    winEl.textContent = `$${win.toFixed(0)}`;

    footer.appendChild(balanceEl);
    footer.appendChild(spinBtn);
    footer.appendChild(winEl);

    gameArea.appendChild(gridContainer);
    screen.appendChild(statusBar);
    screen.appendChild(gameArea);
    screen.appendChild(footer);
    mockupContainer.appendChild(screen);
    container.appendChild(mockupContainer);

    debugLog(`DOM mobile mockup created: ${orientation}`);
  };

  /**
   * DOM Desktop Layout Creation
   * Matches exact CSS layout specifications
   */
  const createDOMDesktopLayout = (container: HTMLElement) => {
    const desktopContainer = document.createElement('div');
    desktopContainer.className = 'premium-slot-fallback desktop-layout';
    desktopContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    // Grid container
    const gridContainer = document.createElement('div');
    const symbolSize = Math.min(120, (width * 0.85 - (effectiveReels - 1) * 12) / effectiveReels);
    gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${effectiveReels}, ${symbolSize}px);
      grid-template-rows: repeat(${effectiveRows}, ${symbolSize}px);
      gap: 12px 12px;
      margin-bottom: 60px;
    `;

    // Create transparent symbols
    const symbolLabels = ['W', 'S', 'H1', 'H2', 'H3', 'M1', 'M2', 'L1', 'L2'];
    for (let reel = 0; reel < effectiveReels; reel++) {
      for (let row = 0; row < effectiveRows; row++) {
        const symbolIndex = (reel * effectiveRows + row) % symbolLabels.length;
        const symbol = document.createElement('div');
        symbol.style.cssText = `
          width: ${symbolSize}px;
          height: ${symbolSize}px;
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `;
        symbol.textContent = symbolLabels[symbolIndex];
        
        // Add debug overlay in development
        if (process.env.NODE_ENV === 'development') {
          const debugOverlay = document.createElement('div');
          debugOverlay.style.cssText = `
            position: absolute;
            top: 2px;
            left: 2px;
            font-size: 8px;
            color: #00ff00;
            pointer-events: none;
          `;
          debugOverlay.textContent = `${reel},${row}`;
          symbol.style.position = 'relative';
          symbol.appendChild(debugOverlay);
        }
        
        gridContainer.appendChild(symbol);
      }
    }

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 100px;
      background: rgba(26, 26, 26, 0.95);
      border-top: 2px solid rgba(59, 130, 246, 0.8);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 50px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    // Balance section
    const balanceSection = document.createElement('div');
    balanceSection.innerHTML = `
      <div style="font-size: 14px; color: #9ca3af; font-weight: bold; letter-spacing: 1px; margin-bottom: 5px;">BALANCE</div>
      <div style="font-size: 28px; color: #22c55e; font-weight: bold; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);">$${balance.toFixed(2)}</div>
    `;

    // Spin button
    const spinBtn = document.createElement('button');
    spinBtn.style.cssText = `
      width: 76px;
      height: 76px;
      background: linear-gradient(145deg, #3b82f6, #60a5fa);
      border: none;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2);
      transition: transform 0.1s;
    `;
    spinBtn.innerHTML = '▶';
    spinBtn.onclick = () => onSpin?.();
    spinBtn.onmousedown = () => spinBtn.style.transform = 'scale(0.9)';
    spinBtn.onmouseup = () => spinBtn.style.transform = 'scale(1)';

    // Stats section
    const statsSection = document.createElement('div');
    statsSection.innerHTML = `
      <div style="display: flex; gap: 40px;">
        <div>
          <div style="font-size: 14px; color: #9ca3af; font-weight: bold; letter-spacing: 1px; margin-bottom: 5px;">BET</div>
          <div style="font-size: 20px; color: #fbbf24; font-weight: bold; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">$${bet.toFixed(2)}</div>
        </div>
        <div>
          <div style="font-size: 14px; color: #9ca3af; font-weight: bold; letter-spacing: 1px; margin-bottom: 5px;">WIN</div>
          <div style="font-size: 20px; color: ${win > 0 ? '#22c55e' : '#ffffff'}; font-weight: bold; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">$${win.toFixed(2)}</div>
        </div>
      </div>
    `;

    // Subfooter
    const subfooter = document.createElement('div');
    subfooter.style.cssText = `
      position: fixed;
      bottom: 15px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: #6b7280;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      opacity: 0.7;
    `;
    subfooter.textContent = 'Premium Game | Game Crafter';

    footer.appendChild(balanceSection);
    footer.appendChild(spinBtn);
    footer.appendChild(statsSection);

    desktopContainer.appendChild(gridContainer);
    container.appendChild(desktopContainer);
    container.appendChild(subfooter);

    debugLog('DOM desktop layout created');
  };

  /**
   * Enhanced PIXI.js Application Initialization
   * High-resolution rendering with comprehensive fallback system
   */
  const initializePixi = useCallback(async () => {
    if (!canvasRef.current || appRef.current) return;

    try {
      debugLog('Initializing EnhancedPremiumSlotPreview...');
      setRenderMethod('PIXI.js');

      let app;
      const devicePixelRatio = window.devicePixelRatio || 1;

      try {
        // WebGL with high resolution
        app = new PIXI.Application({
          view: canvasRef.current,
          width: width,
          height: height,
          backgroundColor: 0x0f172a,
          antialias: true,
          resolution: Math.min(devicePixelRatio, 2),
          autoDensity: true
        });
        debugLog('WebGL renderer initialized');
      } catch (webglError) {
        debugLog('WebGL failed, trying Canvas 2D:', webglError);
        // Canvas 2D fallback
        app = new PIXI.Application({
          view: canvasRef.current,
          width: width,
          height: height,
          backgroundColor: 0x0f172a,
          forceCanvas: true,
          antialias: true,
          resolution: Math.min(devicePixelRatio, 2),
          autoDensity: true
        });
        debugLog('Canvas 2D renderer initialized');
      }

      appRef.current = app;

      // Create and render symbols
      const symbolTextures = await createTransparentSymbols(app);
      await renderSlotMachine(app, symbolTextures);

      app.start();
      setIsReady(true);
      debugLog('EnhancedPremiumSlotPreview ready!');

    } catch (error) {
      console.error('❌ PIXI.js initialization failed:', error);
      // DOM fallback
      setTimeout(() => {
        createDOMFallback(
          viewMode === 'mobile-portrait' || viewMode === 'mobile-landscape',
          viewMode
        );
      }, 100);
      setIsReady(true);
    }
  }, [width, height, viewMode, createDOMFallback]);

  /**
   * Transparent Symbol Creation
   * Creates professional transparent symbols with exact specifications
   */
  const createTransparentSymbols = async (app: PIXI.Application): Promise<PIXI.Texture[]> => {
    const symbolPaths = getSymbolPaths();
    const symbolTextures: PIXI.Texture[] = [];

    // Load actual symbol images if available
    if (symbolPaths.length > 0) {
      for (const path of symbolPaths) {
        try {
          const texture = await PIXI.Assets.load(path);
          symbolTextures.push(texture);
          debugLog(`Loaded symbol: ${path.split('/').pop()}`);
        } catch (error) {
          debugLog(`Failed to load symbol: ${path}`);
        }
      }
    }

    // Create transparent fallback symbols with exact specifications
    const symbolLabels = ['W', 'S', 'H1', 'H2', 'H3', 'M1', 'M2', 'L1', 'L2', 'L3'];
    const totalSymbolsNeeded = Math.max(15, effectiveReels * effectiveRows);
    const symbolsNeeded = totalSymbolsNeeded - symbolTextures.length;
    
    debugLog(`Creating symbols: needed=${symbolsNeeded}, total required=${totalSymbolsNeeded}, grid=${effectiveReels}x${effectiveRows}`);

    for (let i = 0; i < symbolsNeeded; i++) {
      const symbolContainer = new PIXI.Container();

      // Transparent background with 2px white border at 30% opacity
      const background = new PIXI.Graphics();
      background.lineStyle(2, 0xffffff, 0.3);
      background.beginFill(0x000000, 0); // Completely transparent background
      background.drawRoundedRect(0, 0, 100, 100, 8);
      background.endFill();

      // Drop shadow for depth
      const shadow = new PIXI.Graphics();
      shadow.beginFill(0x000000, 0.2);
      shadow.drawRoundedRect(2, 2, 100, 100, 8);
      shadow.endFill();
      symbolContainer.addChild(shadow);
      symbolContainer.addChild(background);

      // Text label with exact specifications
      const text = new PIXI.Text(symbolLabels[i % symbolLabels.length], {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        align: 'center',
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowBlur: 4,
        dropShadowDistance: 1
      });
      text.anchor.set(0.5);
      text.x = 50;
      text.y = 50;
      symbolContainer.addChild(text);

      symbolTextures.push(app.renderer.generateTexture(symbolContainer));
    }

    debugLog(`Created ${symbolTextures.length} symbol textures`);
    return symbolTextures;
  };

  /**
   * Main Slot Machine Renderer
   * Routes to appropriate layout based on view mode
   */
  const renderSlotMachine = useCallback(async (app: PIXI.Application, symbolTextures: PIXI.Texture[]) => {
    // Clear existing stage
    app.stage.removeChildren();

    debugLog(`Rendering in ${viewMode} mode`);
    debugLog(`Grid: ${effectiveReels}x${effectiveRows}, Canvas: ${app.screen.width}x${app.screen.height}`);

    // Full-screen background
    const background = new PIXI.Graphics();
    background.beginFill(0x0f172a);
    background.drawRect(0, 0, app.screen.width, app.screen.height);
    background.endFill();
    app.stage.addChild(background);

    if (viewMode === 'desktop') {
      await renderDesktopLayout(app, symbolTextures);
    } else {
      await renderMobileLayout(app, symbolTextures);
    }

    app.render();
    debugLog('Rendering complete');
  }, [viewMode, effectiveReels, effectiveRows, debugLog]);

  /**
   * Desktop Layout Renderer
   * Matches exact CSS specifications with 85% width grid area
   */
  const renderDesktopLayout = async (app: PIXI.Application, symbolTextures: PIXI.Texture[]) => {
    debugLog('Rendering desktop layout');

    const canvasWidth = app.screen.width;
    const canvasHeight = app.screen.height;

    // Layout calculations matching specifications
    const footerHeight = 100;
    const paddingTop = 60;
    const availableWidth = canvasWidth * 0.85; // 85% width as specified
    const availableHeight = canvasHeight - footerHeight - paddingTop;

    // Calculate symbol size with max 120px limit
    const maxSymbolWidth = (availableWidth - (effectiveReels - 1) * 12) / effectiveReels;
    const maxSymbolHeight = (availableHeight - (effectiveRows - 1) * 8) / effectiveRows;
    const symbolSize = Math.min(maxSymbolWidth, maxSymbolHeight, 120);

    // Grid positioning
    const reelGap = 12;
    const rowGap = 8;
    const gridWidth = effectiveReels * symbolSize + (effectiveReels - 1) * reelGap;
    const gridHeight = effectiveRows * symbolSize + (effectiveRows - 1) * rowGap;
    const gridStartX = (canvasWidth - gridWidth) / 2;
    const gridStartY = paddingTop + (availableHeight - gridHeight) / 2;

    debugLog(`Desktop grid: ${gridWidth.toFixed(0)}x${gridHeight.toFixed(0)} at (${gridStartX.toFixed(0)},${gridStartY.toFixed(0)}), symbolSize: ${symbolSize.toFixed(0)}`);

    // Render symbol grid
    for (let reel = 0; reel < effectiveReels; reel++) {
      const reelContainer = new PIXI.Container();
      reelContainer.x = gridStartX + reel * (symbolSize + reelGap);
      reelContainer.y = gridStartY;
      app.stage.addChild(reelContainer);

      for (let row = 0; row < effectiveRows; row++) {
        const symbolY = row * (symbolSize + rowGap);
        const symbolIndex = (reel * effectiveRows + row) % symbolTextures.length;

        const symbol = new PIXI.Sprite(symbolTextures[symbolIndex]);
        symbol.width = symbolSize;
        symbol.height = symbolSize;
        symbol.x = 0;
        symbol.y = symbolY;
        reelContainer.addChild(symbol);

        // Debug overlay in development
        if (process.env.NODE_ENV === 'development') {
          const debugBorder = new PIXI.Graphics();
          debugBorder.lineStyle(1, 0x00ff00, 0.3);
          debugBorder.drawRect(0, symbolY, symbolSize, symbolSize);

          const indexText = new PIXI.Text(`${reel},${row}`, {
            fontSize: 10,
            fill: 0x00ff00,
            fontFamily: 'Arial'
          });
          indexText.x = 5;
          indexText.y = symbolY + 5;
          reelContainer.addChild(debugBorder);
          reelContainer.addChild(indexText);
        }
      }
    }

    // Desktop footer UI
    await createDesktopFooterUI(app, canvasWidth, canvasHeight, footerHeight);
  };

  /**
   * Mobile Layout Renderer
   * Creates realistic phone mockups with exact frame specifications
   */
  const renderMobileLayout = async (app: PIXI.Application, symbolTextures: PIXI.Texture[]) => {
    const isPortrait = viewMode === 'mobile-portrait';
    debugLog(`Rendering mobile layout: ${isPortrait ? 'portrait' : 'landscape'}`);

    const canvasWidth = app.screen.width;
    const canvasHeight = app.screen.height;

    // Phone frame specifications
    const phoneWidth = isPortrait ? 320 : 580;
    const phoneHeight = isPortrait ? 640 : 320;
    const borderRadius = isPortrait ? 40 : 20;
    const phoneX = (canvasWidth - phoneWidth) / 2;
    const phoneY = (canvasHeight - phoneHeight) / 2;

    // Phone frame with shadow
    const phoneFrame = new PIXI.Graphics();
    phoneFrame.beginFill(0x000000, 0.3);
    phoneFrame.drawRoundedRect(phoneX + 8, phoneY + 8, phoneWidth, phoneHeight, borderRadius);
    phoneFrame.endFill();

    phoneFrame.beginFill(0x2a2a2e);
    phoneFrame.drawRoundedRect(phoneX, phoneY, phoneWidth, phoneHeight, borderRadius);
    phoneFrame.endFill();

    phoneFrame.lineStyle(3, 0x444447);
    phoneFrame.drawRoundedRect(phoneX, phoneY, phoneWidth, phoneHeight, borderRadius);
    app.stage.addChild(phoneFrame);

    // Screen area calculations
    const padding = 20;
    const screenX = phoneX + padding;
    const screenY = phoneY + padding + (isPortrait ? 30 : 15);
    const screenWidth = phoneWidth - (padding * 2);
    const screenHeight = phoneHeight - (padding * 2) - (isPortrait ? 45 : 25);

    const screen = new PIXI.Graphics();
    screen.beginFill(0x000000);
    screen.drawRoundedRect(screenX, screenY, screenWidth, screenHeight, isPortrait ? 25 : 15);
    screen.endFill();
    app.stage.addChild(screen);

    // Status bar
    await createMobileStatusBar(app, screenX, screenY, screenWidth, isPortrait);

    // Mobile game area
    const gameAreaY = screenY + (isPortrait ? 30 : 20);
    const gameAreaHeight = screenHeight - (isPortrait ? 80 : 50);
    await createMobileGameArea(app, symbolTextures, screenX, gameAreaY, screenWidth, gameAreaHeight, isPortrait);

    // Mobile footer
    const footerHeight = isPortrait ? 50 : 30;
    await createMobileFooterUI(app, screenX, screenY + screenHeight - footerHeight, screenWidth, footerHeight);
  };

  /**
   * Desktop Footer UI Creation
   * Complete PIXI.js implementation matching exact specifications
   */
  const createDesktopFooterUI = async (app: PIXI.Application, canvasWidth: number, canvasHeight: number, footerHeight: number) => {
    const footerY = canvasHeight - footerHeight;

    // Footer background
    const footerBg = new PIXI.Graphics();
    footerBg.beginFill(0x1a1a1a, 0.95);
    footerBg.drawRect(0, footerY, canvasWidth, footerHeight);
    footerBg.endFill();

    // Top border line
    footerBg.lineStyle(2, 0x3b82f6, 0.8);
    footerBg.moveTo(0, footerY);
    footerBg.lineTo(canvasWidth, footerY);
    app.stage.addChild(footerBg);

    // Balance section (left)
    const balanceContainer = new PIXI.Container();
    balanceContainer.x = 50;
    balanceContainer.y = footerY + 25;

    const balanceLabel = new PIXI.Text('BALANCE', {
      fontSize: 14,
      fill: 0x9ca3af,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      letterSpacing: 1
    });
    balanceContainer.addChild(balanceLabel);

    const balanceValue = new PIXI.Text(`$${balance.toFixed(2)}`, {
      fontSize: 28,
      fill: 0x22c55e,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 2
    });
    balanceValue.y = 20;
    balanceContainer.addChild(balanceValue);
    app.stage.addChild(balanceContainer);

    // Spin button (center) with GSAP pulse animation
    const spinContainer = new PIXI.Container();
    spinContainer.x = canvasWidth / 2;
    spinContainer.y = footerY + footerHeight / 2;

    // Outer glow for pulse effect
    const outerGlow = new PIXI.Graphics();
    outerGlow.beginFill(0x3b82f6, 0.3);
    outerGlow.drawCircle(0, 0, 45);
    outerGlow.endFill();
    spinContainer.addChild(outerGlow);

    // Main button
    const spinButton = new PIXI.Graphics();
    spinButton.beginFill(0x3b82f6);
    spinButton.drawCircle(0, 0, 38);
    spinButton.endFill();

    spinButton.beginFill(0x60a5fa, 0.8);
    spinButton.drawCircle(0, 0, 32);
    spinButton.endFill();

    spinButton.eventMode = 'static';
    spinButton.cursor = 'pointer';
    spinButton.on('pointertap', () => {
      onSpin?.();
      // Button feedback animation
      gsap.to(spinButton.scale, { 
        x: 0.9, y: 0.9, 
        duration: 0.1, 
        yoyo: true, 
        repeat: 1 
      });
    });

    spinContainer.addChild(spinButton);

    // Arrow
    const arrow = new PIXI.Graphics();
    arrow.beginFill(0xffffff);
    arrow.moveTo(-15, -10);
    arrow.lineTo(18, 0);
    arrow.lineTo(-15, 10);
    arrow.closePath();
    arrow.endFill();
    arrow.x = 3;
    spinContainer.addChild(arrow);

    // GSAP pulse animation
    gsap.to(outerGlow.scale, {
      x: 1.2,
      y: 1.2,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });

    spinButtonRef.current = spinContainer;
    app.stage.addChild(spinContainer);

    // Stats section (right)
    const statsContainer = new PIXI.Container();
    statsContainer.x = canvasWidth - 220;
    statsContainer.y = footerY + 25;

    // Bet section
    const betLabel = new PIXI.Text('BET', {
      fontSize: 14,
      fill: 0x9ca3af,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      letterSpacing: 1
    });
    statsContainer.addChild(betLabel);

    const betValue = new PIXI.Text(`$${bet.toFixed(2)}`, {
      fontSize: 20,
      fill: 0xfbbf24,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 2,
      dropShadowDistance: 1
    });
    betValue.y = 18;
    statsContainer.addChild(betValue);

    // Win section
    const winLabel = new PIXI.Text('WIN', {
      fontSize: 14,
      fill: 0x9ca3af,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      letterSpacing: 1
    });
    winLabel.x = 120;
    statsContainer.addChild(winLabel);

    const winValue = new PIXI.Text(`$${win.toFixed(2)}`, {
      fontSize: 20,
      fill: win > 0 ? 0x22c55e : 0xffffff,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 2,
      dropShadowDistance: 1
    });
    winValue.x = 120;
    winValue.y = 18;
    statsContainer.addChild(winValue);

    app.stage.addChild(statsContainer);

    // Subfooter
    const subfooter = new PIXI.Text('Premium Game | Game Crafter', {
      fontSize: 12,
      fill: 0x6b7280,
      fontFamily: 'Arial, sans-serif',
      alpha: 0.7
    });
    subfooter.anchor.set(0.5, 0);
    subfooter.x = canvasWidth / 2;
    subfooter.y = canvasHeight - 20;
    app.stage.addChild(subfooter);

    debugLog('Desktop footer UI created');
  };

  /**
   * Mobile Status Bar Creation
   */
  const createMobileStatusBar = async (app: PIXI.Application, x: number, y: number, width: number, isPortrait: boolean) => {
    const statusHeight = isPortrait ? 30 : 20;

    const statusBg = new PIXI.Graphics();
    statusBg.beginFill(0x000000, 0.8);
    statusBg.drawRect(x, y, width, statusHeight);
    statusBg.endFill();
    app.stage.addChild(statusBg);

    // Time
    const timeText = new PIXI.Text('9:41', {
      fontSize: isPortrait ? 14 : 12,
      fill: 0xffffff,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });
    timeText.x = x + 15;
    timeText.y = y + (statusHeight - timeText.height) / 2;
    app.stage.addChild(timeText);

    // Battery
    const batteryText = new PIXI.Text('100%', {
      fontSize: isPortrait ? 14 : 12,
      fill: 0xffffff,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });
    batteryText.x = x + width - batteryText.width - 15;
    batteryText.y = y + (statusHeight - batteryText.height) / 2;
    app.stage.addChild(batteryText);

    // Signal and WiFi indicators
    const indicators = new PIXI.Graphics();
    indicators.beginFill(0xffffff);
    // Signal bars
    for (let i = 0; i < 4; i++) {
      indicators.drawRect(x + width - 100 + i * 6, y + statusHeight - 5 - (i + 1) * 2, 4, (i + 1) * 2);
    }
    indicators.endFill();
    app.stage.addChild(indicators);
  };

  /**
   * Mobile Game Area Creation
   */
  const createMobileGameArea = async (app: PIXI.Application, symbolTextures: PIXI.Texture[], x: number, y: number, width: number, height: number, isPortrait: boolean) => {
    // Game background
    const gameBg = new PIXI.Graphics();
    gameBg.beginFill(0x0f172a);
    gameBg.drawRect(x, y, width, height);
    gameBg.endFill();
    app.stage.addChild(gameBg);

    // Mobile grid calculations
    const padding = isPortrait ? 25 : 20;
    const availableWidth = width - (padding * 2);
    const availableHeight = height - (padding * 2);

    const maxSymbolWidth = (availableWidth - (effectiveReels - 1) * 6) / effectiveReels;
    const maxSymbolHeight = (availableHeight - (effectiveRows - 1) * 4) / effectiveRows;
    const symbolSize = Math.min(maxSymbolWidth, maxSymbolHeight, isPortrait ? 50 : 40);

    const gap = 6;
    const gridWidth = effectiveReels * symbolSize + (effectiveReels - 1) * gap;
    const gridHeight = effectiveRows * symbolSize + (effectiveRows - 1) * gap;

    const startX = x + (width - gridWidth) / 2;
    const startY = y + (height - gridHeight) / 2;

    // Create mobile grid
    for (let reel = 0; reel < effectiveReels; reel++) {
      for (let row = 0; row < effectiveRows; row++) {
        const symbolX = startX + reel * (symbolSize + gap);
        const symbolY = startY + row * (symbolSize + gap);
        const symbolIndex = (reel * effectiveRows + row) % symbolTextures.length;

        const symbol = new PIXI.Sprite(symbolTextures[symbolIndex]);
        symbol.width = symbolSize;
        symbol.height = symbolSize;
        symbol.x = symbolX;
        symbol.y = symbolY;
        app.stage.addChild(symbol);
      }
    }

    debugLog(`Mobile grid: ${gridWidth.toFixed(0)}x${gridHeight.toFixed(0)}, symbolSize: ${symbolSize.toFixed(0)}`);
  };

  /**
   * Mobile Footer UI Creation
   */
  const createMobileFooterUI = async (app: PIXI.Application, x: number, y: number, width: number, height: number) => {
    // Footer background
    const footerBg = new PIXI.Graphics();
    footerBg.beginFill(0x000000, 0.95);
    footerBg.drawRect(x, y, width, height);
    footerBg.endFill();
    app.stage.addChild(footerBg);

    // Mobile balance
    const mobileBalance = new PIXI.Text(`$${balance.toFixed(0)}`, {
      fontSize: 16,
      fill: 0x22c55e,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });
    mobileBalance.x = x + 15;
    mobileBalance.y = y + (height - mobileBalance.height) / 2;
    app.stage.addChild(mobileBalance);

    // Mobile spin button
    const mobileSpinBtn = new PIXI.Graphics();
    mobileSpinBtn.beginFill(0x3b82f6);
    mobileSpinBtn.drawCircle(x + width / 2, y + height / 2, 20);
    mobileSpinBtn.endFill();
    mobileSpinBtn.eventMode = 'static';
    mobileSpinBtn.cursor = 'pointer';
    mobileSpinBtn.on('pointertap', () => {
      onSpin?.();
      gsap.to(mobileSpinBtn.scale, { x: 0.9, y: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
    });
    app.stage.addChild(mobileSpinBtn);

    // Mobile arrow
    const mobileArrow = new PIXI.Graphics();
    mobileArrow.beginFill(0xffffff);
    mobileArrow.moveTo(-8, -5);
    mobileArrow.lineTo(10, 0);
    mobileArrow.lineTo(-8, 5);
    mobileArrow.closePath();
    mobileArrow.endFill();
    mobileArrow.x = x + width / 2 + 2;
    mobileArrow.y = y + height / 2;
    app.stage.addChild(mobileArrow);

    // Mobile win
    const mobileWin = new PIXI.Text(`$${win.toFixed(0)}`, {
      fontSize: 16,
      fill: win > 0 ? 0x22c55e : 0xffffff,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });
    mobileWin.x = x + width - mobileWin.width - 15;
    mobileWin.y = y + (height - mobileWin.height) / 2;
    app.stage.addChild(mobileWin);
  };

  // Re-render when configuration changes (live Step 3 sync)
  useEffect(() => {
    if (appRef.current && isReady) {
      debugLog(`Re-rendering: viewMode=${viewMode}, grid=${effectiveReels}x${effectiveRows}, refreshKey=${refreshKey}`);

      // Dispose existing animations
      gsap.killTweensOf("*");

      if (appRef.current) {
        createTransparentSymbols(appRef.current).then(symbolTextures => {
          if (appRef.current) {
            renderSlotMachine(appRef.current, symbolTextures);
          }
        }).catch(error => {
          console.error('❌ Failed to create symbols:', error);
          debugLog('Symbol creation failed, trying fallback');
        });
      }
    }
  }, [viewMode, effectiveReels, effectiveRows, refreshKey, isReady, debugLog]);

  // Initialize PIXI.js application
  useEffect(() => {
    if (appRef.current) {
      debugLog('PIXI.js already initialized');
      return;
    }

    const timeoutId = setTimeout(() => {
      initializePixi();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (appRef.current) {
        debugLog('Cleaning up PIXI.js application');
        gsap.killTweensOf("*");
        appRef.current.destroy(true, true);
        appRef.current = null;
        spinButtonRef.current = null;
        setIsReady(false);
      }
      // Clean up DOM fallbacks
      document.querySelectorAll('.premium-slot-fallback').forEach(el => el.remove());
    };
  }, [width, height, refreshKey, initializePixi, debugLog]);

  return (
    <div className="relative w-full h-full">
      {/* View Mode Controls */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        <button
          onClick={() => {
            setViewMode('desktop');
            setTimeout(() => {
              document.querySelectorAll('.premium-slot-fallback').forEach(el => el.remove());
              if (renderMethod === 'DOM Fallback') {
                createDOMFallback(false, 'desktop');
              }
            }, 100);
          }}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            viewMode === 'desktop' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          🖥️ Desktop
        </button>
        <button
          onClick={() => {
            setViewMode('mobile-portrait');
            setTimeout(() => {
              document.querySelectorAll('.premium-slot-fallback').forEach(el => el.remove());
              if (renderMethod === 'DOM Fallback') {
                createDOMFallback(true, 'mobile-portrait');
              }
            }, 100);
          }}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            viewMode === 'mobile-portrait' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          📱 Portrait
        </button>
        <button
          onClick={() => {
            setViewMode('mobile-landscape');
            setTimeout(() => {
              document.querySelectorAll('.premium-slot-fallback').forEach(el => el.remove());
              if (renderMethod === 'DOM Fallback') {
                createDOMFallback(true, 'mobile-landscape');
              }
            }, 100);
          }}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            viewMode === 'mobile-landscape' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          📱 Landscape
        </button>
      </div>

      {/* PIXI.js Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a',
          imageRendering: 'auto'
        }}
      />

      {/* Loading State */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-lg font-medium">
            Loading Enhanced Premium Slot Preview...
          </div>
        </div>
      )}

      {/* Debug Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && isReady && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded font-mono">
          <div>Mode: <span className="text-blue-400">{viewMode}</span></div>
          <div>Grid: <span className="text-green-400">{effectiveReels}×{effectiveRows}</span></div>
          <div>Renderer: <span className="text-yellow-400">{renderMethod}</span></div>
          <div>Resolution: <span className="text-purple-400">{width}×{height}</span></div>
          <div>Ready: <span className="text-green-400">{isReady ? 'Yes' : 'No'}</span></div>
        </div>
      )}
    </div>
  );
};

export default PremiumSlotPreview;