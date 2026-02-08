import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { SlotEngine } from '../../engine/core/SlotEngine';
import { GameConfig, SlotEngineEvents } from '../../engine/types/types';
import { useGameStore } from '../../store';
import { useStoredSymbols } from '../../utils/symbolStorage';

interface PremiumSlotEngineProps {
  width?: number;
  height?: number;
  className?: string;
  viewMode?: 'desktop' | 'mobile-portrait' | 'mobile-landscape';
  onSpin?: () => void;
  balance?: number;
  bet?: number;
  win?: number;
  hideControls?: boolean; // New prop to hide internal controls
}

/**
 * Premium Slot Engine Component
 * 
 * A comprehensive slot preview system that integrates:
 * 1. The modular slot engine for game logic
 * 2. PIXI.js for high-performance rendering
 * 3. Proper lifecycle management to prevent WebGL issues
 * 4. Responsive layouts for desktop and mobile
 * 5. Symbol fallback system with transparent placeholders
 * 
 * Key improvements:
 * - Uses a single shared canvas instance
 * - Proper cleanup on grid changes
 * - Canvas2D fallback for stability
 * - Integration with the slot engine modules
 */
export const PremiumSlotEngine: React.FC<PremiumSlotEngineProps> = ({
  width = 1200,
  height = 800,
  className = '',
  viewMode: initialViewMode = 'desktop',
  onSpin,
  balance = 1000,
  bet = 1.00,
  win = 0.00,
  hideControls = false
}) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const engineRef = useRef<SlotEngine | null>(null);
  const symbolTexturesRef = useRef<Map<string, PIXI.Texture>>(new Map());
  const reelContainersRef = useRef<PIXI.Container[]>([]);
  const symbolSpritesRef = useRef<PIXI.Sprite[][]>([]);
  
  // State
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWin, setCurrentWin] = useState(win);
  
  // Store integration
  const { config } = useGameStore();
  const symbolStore = useStoredSymbols();
  
  // Get effective grid configuration
  const effectiveReels = config?.reels?.layout?.reels || 5;
  const effectiveRows = config?.reels?.layout?.rows || 3;
  
  // Debug logging
  const debugLog = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎰 [PremiumSlotEngine] ${message}`, data || '');
    }
  }, []);
  
  /**
   * Get symbol paths from various sources
   */
  const getSymbolData = useCallback(() => {
    const symbolData: Array<{ id: string; path: string }> = [];
    
    // Priority 1: Symbol store
    if (symbolStore.symbols && symbolStore.symbols.length > 0) {
      symbolStore.symbols.forEach((symbol, index) => {
        if (symbol.image) {
          symbolData.push({
            id: symbol.name || `symbol_${index}`,
            path: symbol.image
          });
        }
      });
    }
    
    // Priority 2: Generated symbols from config
    if (symbolData.length === 0 && config?.theme?.generated?.symbols) {
      const generated = config.theme.generated.symbols as string[];
      generated.forEach((path, index) => {
        if (path) {
          symbolData.push({
            id: `generated_${index}`,
            path: path
          });
        }
      });
    }
    
    // Add default symbols if needed
    const requiredSymbols = effectiveReels * effectiveRows;
    const defaultSymbols = ['wild', 'scatter', 'high_1', 'high_2', 'high_3', 'mid_1', 'mid_2', 'low_1', 'low_2'];
    
    while (symbolData.length < requiredSymbols) {
      const index = symbolData.length;
      const symbolId = defaultSymbols[index % defaultSymbols.length];
      symbolData.push({
        id: symbolId,
        path: '' // Will create transparent fallback
      });
    }
    
    return symbolData;
  }, [symbolStore.symbols, config?.theme?.generated?.symbols, effectiveReels, effectiveRows]);
  
  /**
   * Create game configuration for the slot engine
   */
  const createGameConfig = useCallback((): GameConfig => {
    const symbolData = getSymbolData();
    
    return {
      grid: {
        reels: effectiveReels,
        rows: effectiveRows
      },
      symbols: symbolData.map(({ id, path }) => ({
        id,
        type: id.includes('wild') ? 'wild' : id.includes('scatter') ? 'scatter' : 'regular',
        texture: path,
        payoutMultiplier: 1
      })),
      animation: {
        spinSpeed: 1500,
        easing: 'power2.inOut',
        reelStartFX: 'spinStart',
        reelStopFX: 'reelStop',
        symbolLandFX: 'symbolLand',
        winFX: 'winReveal',
        anticipationEnabled: true,
        reelStagger: 100,
        reelStopStagger: 150
      },
      rtp: config?.math?.rtp || 96,
      volatility: 'medium'
    };
  }, [getSymbolData, effectiveReels, effectiveRows, config?.math?.rtp]);
  
  /**
   * Create transparent fallback symbol texture
   */
  const createFallbackSymbol = useCallback((app: PIXI.Application, label: string): PIXI.Texture => {
    const container = new PIXI.Container();
    
    // Transparent background with border
    const bg = new PIXI.Graphics();
    bg.lineStyle(2, 0xffffff, 0.3);
    bg.beginFill(0x000000, 0.05);
    bg.drawRoundedRect(0, 0, 100, 100, 8);
    bg.endFill();
    
    // Drop shadow
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.2);
    shadow.drawRoundedRect(2, 2, 100, 100, 8);
    shadow.endFill();
    
    container.addChild(shadow);
    container.addChild(bg);
    
    // Label text
    const text = new PIXI.Text(label.toUpperCase(), {
      fontSize: 16,
      fill: 0xffffff,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 1
    });
    text.anchor.set(0.5);
    text.x = 50;
    text.y = 50;
    container.addChild(text);
    
    return app.renderer.generateTexture(container);
  }, []);
  
  /**
   * Load symbol textures
   */
  const loadSymbolTextures = useCallback(async (app: PIXI.Application) => {
    const symbolData = getSymbolData();
    symbolTexturesRef.current.clear();
    
    for (const { id, path } of symbolData) {
      try {
        if (path) {
          const texture = await PIXI.Assets.load(path);
          symbolTexturesRef.current.set(id, texture);
          debugLog(`Loaded symbol texture: ${id}`);
        } else {
          // Create fallback
          const label = id.replace(/_/g, ' ').substring(0, 3);
          const texture = createFallbackSymbol(app, label);
          symbolTexturesRef.current.set(id, texture);
          debugLog(`Created fallback for: ${id}`);
        }
      } catch (error) {
        // Create fallback on error
        const label = id.replace(/_/g, ' ').substring(0, 3);
        const texture = createFallbackSymbol(app, label);
        symbolTexturesRef.current.set(id, texture);
        debugLog(`Created fallback for failed load: ${id}`);
      }
    }
    
    debugLog(`Loaded ${symbolTexturesRef.current.size} symbol textures`);
  }, [getSymbolData, createFallbackSymbol, debugLog]);
  
  /**
   * Create reel containers and initial symbols
   */
  const createReels = useCallback((app: PIXI.Application) => {
    // Clear existing reels
    reelContainersRef.current.forEach(container => {
      container.destroy({ children: true });
    });
    reelContainersRef.current = [];
    symbolSpritesRef.current = [];
    
    const symbolData = getSymbolData();
    const canvasWidth = app.screen.width;
    const canvasHeight = app.screen.height;
    
    // Layout calculations
    const footerHeight = hideControls ? 0 : (viewMode === 'desktop' ? 100 : 50);
    const topPadding = viewMode === 'desktop' ? 60 : 40;
    const availableWidth = canvasWidth * (viewMode === 'desktop' ? 0.85 : 0.9);
    const availableHeight = canvasHeight - footerHeight - topPadding;
    
    // Symbol size calculation
    const maxSymbolWidth = (availableWidth - (effectiveReels - 1) * 12) / effectiveReels;
    const maxSymbolHeight = (availableHeight - (effectiveRows - 1) * 8) / effectiveRows;
    const symbolSize = Math.min(maxSymbolWidth, maxSymbolHeight, viewMode === 'desktop' ? 120 : 80);
    
    const reelGap = viewMode === 'desktop' ? 12 : 8;
    const rowGap = viewMode === 'desktop' ? 8 : 6;
    
    // Grid positioning
    const gridWidth = effectiveReels * symbolSize + (effectiveReels - 1) * reelGap;
    const gridHeight = effectiveRows * symbolSize + (effectiveRows - 1) * rowGap;
    const gridStartX = (canvasWidth - gridWidth) / 2;
    const gridStartY = topPadding + (availableHeight - gridHeight) / 2;
    
    // Create reels
    for (let reel = 0; reel < effectiveReels; reel++) {
      const reelContainer = new PIXI.Container();
      reelContainer.x = gridStartX + reel * (symbolSize + reelGap);
      reelContainer.y = gridStartY;
      
      const reelSymbols: PIXI.Sprite[] = [];
      
      // Create symbols for this reel
      for (let row = 0; row < effectiveRows; row++) {
        const symbolIndex = (reel * effectiveRows + row) % symbolData.length;
        const symbolId = symbolData[symbolIndex].id;
        const texture = symbolTexturesRef.current.get(symbolId);
        
        if (texture) {
          const symbol = new PIXI.Sprite(texture);
          symbol.width = symbolSize;
          symbol.height = symbolSize;
          symbol.x = 0;
          symbol.y = row * (symbolSize + rowGap);
          
          reelContainer.addChild(symbol);
          reelSymbols.push(symbol);
        }
      }
      
      app.stage.addChild(reelContainer);
      reelContainersRef.current.push(reelContainer);
      symbolSpritesRef.current.push(reelSymbols);
    }
    
    debugLog(`Created ${effectiveReels} reels with ${effectiveRows} rows each`);
  }, [getSymbolData, effectiveReels, effectiveRows, viewMode, debugLog, hideControls]);
  
  /**
   * Create UI elements (footer, buttons, etc.)
   */
  const createUI = useCallback((app: PIXI.Application) => {
    // Skip UI creation if controls are hidden
    if (hideControls) {
      debugLog('UI controls hidden, skipping UI creation');
      return;
    }
    
    const canvasWidth = app.screen.width;
    const canvasHeight = app.screen.height;
    
    if (viewMode === 'desktop') {
      // Desktop footer
      const footerHeight = 100;
      const footerY = canvasHeight - footerHeight;
      
      // Footer background
      const footerBg = new PIXI.Graphics();
      footerBg.beginFill(0x1a1a1a, 0.95);
      footerBg.drawRect(0, footerY, canvasWidth, footerHeight);
      footerBg.endFill();
      
      // Top border
      footerBg.lineStyle(2, 0x3b82f6, 0.8);
      footerBg.moveTo(0, footerY);
      footerBg.lineTo(canvasWidth, footerY);
      app.stage.addChild(footerBg);
      
      // Balance text
      const balanceText = new PIXI.Text(`BALANCE\n$${balance.toFixed(2)}`, {
        fontSize: 24,
        fill: 0x22c55e,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        align: 'left'
      });
      balanceText.x = 50;
      balanceText.y = footerY + 20;
      app.stage.addChild(balanceText);
      
      // Spin button
      const spinButton = new PIXI.Graphics();
      spinButton.beginFill(0x3b82f6);
      spinButton.drawCircle(canvasWidth / 2, footerY + footerHeight / 2, 38);
      spinButton.endFill();
      spinButton.eventMode = 'static';
      spinButton.cursor = 'pointer';
      spinButton.on('pointerdown', handleSpin);
      app.stage.addChild(spinButton);
      
      // Spin arrow
      const arrow = new PIXI.Graphics();
      arrow.beginFill(0xffffff);
      arrow.moveTo(-15, -10);
      arrow.lineTo(18, 0);
      arrow.lineTo(-15, 10);
      arrow.closePath();
      arrow.endFill();
      arrow.x = canvasWidth / 2 + 3;
      arrow.y = footerY + footerHeight / 2;
      app.stage.addChild(arrow);
      
      // Win text
      const winText = new PIXI.Text(`WIN\n$${currentWin.toFixed(2)}`, {
        fontSize: 24,
        fill: currentWin > 0 ? 0x22c55e : 0xffffff,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        align: 'right'
      });
      winText.anchor.set(1, 0);
      winText.x = canvasWidth - 50;
      winText.y = footerY + 20;
      app.stage.addChild(winText);
    } else {
      // Mobile UI (simplified)
      const footerHeight = 50;
      const footerY = canvasHeight - footerHeight;
      
      const footerBg = new PIXI.Graphics();
      footerBg.beginFill(0x000000, 0.95);
      footerBg.drawRect(0, footerY, canvasWidth, footerHeight);
      footerBg.endFill();
      app.stage.addChild(footerBg);
      
      // Mobile spin button
      const spinButton = new PIXI.Graphics();
      spinButton.beginFill(0x3b82f6);
      spinButton.drawCircle(canvasWidth / 2, footerY + footerHeight / 2, 20);
      spinButton.endFill();
      spinButton.eventMode = 'static';
      spinButton.cursor = 'pointer';
      spinButton.on('pointerdown', handleSpin);
      app.stage.addChild(spinButton);
    }
  }, [viewMode, balance, currentWin, hideControls, debugLog]);
  
  /**
   * Handle spin button click
   */
  const handleSpin = useCallback(async () => {
    if (!engineRef.current || isSpinning) return;
    
    setIsSpinning(true);
    onSpin?.();
    
    try {
      await engineRef.current.startSpin(bet);
    } catch (error) {
      debugLog('Spin error:', error);
      setIsSpinning(false);
    }
  }, [isSpinning, bet, onSpin, debugLog]);
  
  /**
   * Initialize PIXI application
   */
  const initializePixi = useCallback(async () => {
    if (!canvasRef.current) return;
    
    // Clean up existing app
    if (appRef.current) {
      debugLog('Cleaning up existing PIXI app');
      appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
    }
    
    try {
      // Create new PIXI app with Canvas2D for stability
      const app = new PIXI.Application({
        view: canvasRef.current,
        width,
        height,
        backgroundColor: 0x0f172a,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        forceCanvas: true, // Force Canvas2D to avoid WebGL issues
        preserveDrawingBuffer: true
      });
      
      appRef.current = app;
      
      // Set up background
      const bg = new PIXI.Graphics();
      bg.beginFill(0x0f172a);
      bg.drawRect(0, 0, width, height);
      bg.endFill();
      app.stage.addChild(bg);
      
      // Load textures and create UI
      await loadSymbolTextures(app);
      createReels(app);
      createUI(app);
      
      app.start();
      setIsReady(true);
      debugLog('PIXI app initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize PIXI:', error);
      setIsReady(false);
    }
  }, [width, height, loadSymbolTextures, createReels, createUI, debugLog]);
  
  /**
   * Initialize slot engine
   */
  const initializeEngine = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    
    const gameConfig = createGameConfig();
    const engine = new SlotEngine(gameConfig, process.env.NODE_ENV === 'development');
    
    // Set up event listeners
    engine.on('reel:start', (data) => {
      debugLog('Reel started spinning:', data);
      
      // Start visual spinning animation
      if (appRef.current && reelContainersRef.current[data.reelIndex]) {
        const reelContainer = reelContainersRef.current[data.reelIndex];
        const sprites = symbolSpritesRef.current[data.reelIndex] || [];
        
        // Create spinning animation
        sprites.forEach((sprite, index) => {
          // Add blur effect for motion
          const blurFilter = new PIXI.filters.BlurFilter();
          blurFilter.blurY = 8;
          sprite.filters = [blurFilter];
          
          // Animate position for spinning effect
          gsap.to(sprite, {
            y: `+=${height}`,
            duration: 0.1,
            repeat: -1,
            ease: 'none',
            onUpdate: () => {
              // Wrap around when sprite goes off screen
              if (sprite.y > height) {
                sprite.y -= height + 100;
              }
            }
          });
        });
      }
    });
    
    engine.on('reel:stop', (data) => {
      debugLog('Reel stopped:', data);
      
      // Update visual representation
      if (appRef.current && reelContainersRef.current[data.reelIndex]) {
        const reelContainer = reelContainersRef.current[data.reelIndex];
        const sprites = symbolSpritesRef.current[data.reelIndex] || [];
        const symbols = data.symbols;
        
        // Stop all animations
        sprites.forEach((sprite) => {
          gsap.killTweensOf(sprite);
          sprite.filters = []; // Remove blur
        });
        
        // Update symbol textures and positions
        symbols.forEach((symbolId, row) => {
          const sprite = sprites[row];
          const texture = symbolTexturesRef.current.get(symbolId);
          
          if (sprite && texture) {
            sprite.texture = texture;
            const symbolSize = sprite.width;
            const rowGap = viewMode === 'desktop' ? 8 : 6;
            sprite.y = row * (symbolSize + rowGap);
          }
        });
        
        // Animate reel stop bounce
        gsap.to(reelContainer, {
          y: reelContainer.y + 5,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        });
      }
    });
    
    engine.on('spin:complete', (data) => {
      debugLog('Spin complete:', data);
      setIsSpinning(false);
      
      // Update symbols based on result
      const { matrix } = data.result;
      
      if (appRef.current) {
        for (let reel = 0; reel < matrix.length; reel++) {
          for (let row = 0; row < matrix[reel].length; row++) {
            const symbolId = matrix[reel][row];
            const sprite = symbolSpritesRef.current[reel]?.[row];
            const texture = symbolTexturesRef.current.get(symbolId);
            
            if (sprite && texture) {
              sprite.texture = texture;
            }
          }
        }
      }
      
      // Emit spin complete event for other components (like Step 7)
      window.dispatchEvent(new CustomEvent('spin:complete', {
        detail: data
      }));
    });
    
    engine.on('win:reveal', (data) => {
      debugLog('Win revealed:', data);
      setCurrentWin(data.totalWin);
      
      // Highlight winning symbols
      if (appRef.current) {
        data.wins.forEach(win => {
          win.positions.forEach(({ reel, row }) => {
            const sprite = symbolSpritesRef.current[reel]?.[row];
            if (sprite) {
              gsap.to(sprite, {
                pixi: { brightness: 1.5 },
                duration: 0.5,
                yoyo: true,
                repeat: 3,
                ease: 'power2.inOut'
              });
            }
          });
        });
      }
    });
    
    engine.setBalance(balance);
    engineRef.current = engine;
    
    debugLog('Slot engine initialized');
  }, [createGameConfig, balance, debugLog]);
  
  // Initialize on mount
  useEffect(() => {
    initializePixi();
    initializeEngine();
    
    // Listen for external spin events (from Step 7)
    const handleExternalSpin = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🎰 PremiumSlotEngine: Received external spin event', customEvent.detail);
      handleSpin();
    };
    
    // Listen for win events to track statistics
    const handleExternalWin = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🎰 PremiumSlotEngine: Win event', customEvent.detail);
      // The win handling is already done in the engine events
    };
    
    window.addEventListener('slotSpin', handleExternalSpin);
    window.addEventListener('slotWin', handleExternalWin);
    
    return () => {
      window.removeEventListener('slotSpin', handleExternalSpin);
      window.removeEventListener('slotWin', handleExternalWin);
      
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [handleSpin]);
  
  // Handle grid changes
  useEffect(() => {
    if (!isReady) return;
    
    debugLog(`Grid changed to ${effectiveReels}x${effectiveRows}`);
    
    // Reinitialize everything
    setIsReady(false);
    initializePixi();
    initializeEngine();
  }, [effectiveReels, effectiveRows]);
  
  // Handle view mode changes
  useEffect(() => {
    if (!isReady || !appRef.current) return;
    
    debugLog(`View mode changed to ${viewMode}`);
    
    // Just recreate the UI elements
    appRef.current.stage.removeChildren();
    
    const bg = new PIXI.Graphics();
    bg.beginFill(0x0f172a);
    bg.drawRect(0, 0, width, height);
    bg.endFill();
    appRef.current.stage.addChild(bg);
    
    createReels(appRef.current);
    createUI(appRef.current);
  }, [viewMode, isReady]);
  
  // Handle symbol updates
  useEffect(() => {
    if (!isReady || !appRef.current) return;
    
    debugLog('Symbols updated, reloading textures');
    
    const reloadSymbols = async () => {
      await loadSymbolTextures(appRef.current!);
      
      // Update existing sprites with new textures
      const symbolData = getSymbolData();
      for (let reel = 0; reel < effectiveReels; reel++) {
        for (let row = 0; row < effectiveRows; row++) {
          const symbolIndex = (reel * effectiveRows + row) % symbolData.length;
          const symbolId = symbolData[symbolIndex].id;
          const texture = symbolTexturesRef.current.get(symbolId);
          const sprite = symbolSpritesRef.current[reel]?.[row];
          
          if (sprite && texture) {
            sprite.texture = texture;
          }
        }
      }
    };
    
    reloadSymbols();
  }, [symbolStore.symbols, config?.theme?.generated?.symbols, isReady]);
  
  return (
    <div className={`relative ${className}`}>
      {/* View mode selector */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        <button
          onClick={() => setViewMode('desktop')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            viewMode === 'desktop' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          🖥️ Desktop
        </button>
        <button
          onClick={() => setViewMode('mobile-portrait')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            viewMode === 'mobile-portrait' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          📱 Portrait
        </button>
        <button
          onClick={() => setViewMode('mobile-landscape')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            viewMode === 'mobile-landscape' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          📱 Landscape
        </button>
      </div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a'
        }}
      />
      
      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-lg">Loading slot engine...</div>
        </div>
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && isReady && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Engine: {engineRef.current ? 'Ready' : 'Not initialized'}</div>
          <div>Grid: {effectiveReels}×{effectiveRows}</div>
          <div>Symbols: {symbolTexturesRef.current.size}</div>
          <div>Spinning: {isSpinning ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default PremiumSlotEngine;