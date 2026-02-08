import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { ExtractedSymbol } from './slotTypes';

// Props interface with strict typing
interface EndlessReelPreviewProps {
  symbols: string[];              // Symbol image URLs
  isEmbedded?: boolean;           // Is this embedded in another component?
  frameConfig?: {                 // Frame configuration
    transparentArea?: {           // Transparent area margins
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    position?: {                  // Frame position
      x?: number;
      y?: number;
    };
    scale?: number;               // Frame scale (percentage)
    stretch?: {                   // Frame stretch
      x?: number;
      y?: number;
    };
  };
  dimensions?: {                  // Container dimensions
    width?: number;
    height?: number;
  };
  rows?: number;                  // Number of rows
  cols?: number;                  // Number of columns
  onSpinStart?: () => void;       // Spin start callback
  onSpinComplete?: (extractedSymbols: ExtractedSymbol[]) => void; // Spin complete callback with extracted symbols
  isSpinning?: boolean;           // Is spinning
  keepSymbolsVisible?: boolean;   // Force symbols to stay visible even after animation
}

// Constants
const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 5;
const SPIN_DURATION = 2.0; // seconds
const SPIN_BLUR_INTENSITY = 0.9;
const SPIN_DELAY_BETWEEN_COLUMNS = 300; // milliseconds
const SPIN_EXTRA_SYMBOLS = 40;
const SPIN_SPEED = 65; // Pixels per frame
const DEBUG = false; // Disable debug mode

// Utility function to log only in debug mode
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};

/**
 * EndlessReelPreview - A component that displays a grid of symbols and animates spinning.
 */
const EndlessReelPreview: React.FC<EndlessReelPreviewProps> = ({
  symbols = [],
  isEmbedded = false,
  frameConfig = {},
  dimensions = {},
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  onSpinStart,
  onSpinComplete,
  isSpinning = false,
  keepSymbolsVisible = false
}) => {
  // Refs and state
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const gridContainerRef = useRef<PIXI.Container | null>(null);
  const symbolSpritesRef = useRef<PIXI.Sprite[][]>([]);
  const cleanupTickersRef = useRef<Function | null>(null);
  const reelContainersRef = useRef<PIXI.Container[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [internalSpinning, setInternalSpinning] = useState(false);
  
  // Define refs for tracking spin state
  const isSpinningRef = useRef(isSpinning);
  const internalSpinningRef = useRef(internalSpinning);
  
  // Initialize PIXI application and setup grid
  useEffect(() => {
    if (!containerRef.current) return;
    
    debugLog('Initializing PIXI application');
    
    // Cleanup previous instance if it exists
    if (appRef.current) {
      appRef.current.destroy(true);
      appRef.current = null;
    }
    
    // Clear container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    // Get container dimensions
    const containerWidth = dimensions.width || containerRef.current.clientWidth || 800;
    const containerHeight = dimensions.height || containerRef.current.clientHeight || 600;
    
    // Create PIXI application
    const app = new PIXI.Application({
      width: containerWidth,
      height: containerHeight,
      backgroundAlpha: 0,
      antialias: true
    });
    
    // Start the ticker manually
    if (app.ticker) {
      app.ticker.start();
    }
    
    // Add canvas to container
    containerRef.current.appendChild(app.view as any);
    appRef.current = app;
    
    // Create main container
    const stage = new PIXI.Container();
    stage.position.set(containerWidth / 2, containerHeight / 2);
    app.stage.addChild(stage);
    
    // Create grid container
    const gridContainer = new PIXI.Container();
    gridContainerRef.current = gridContainer;
    stage.addChild(gridContainer);
    
    // Calculate grid size
    const baseGridWidth = containerWidth * 0.8;
    const baseGridHeight = (baseGridWidth / cols) * rows;
    
    // Calculate cell size - ensure cells are perfectly square if possible
    const idealCellSize = Math.min(baseGridWidth / cols, baseGridHeight / rows);
    const cellWidth = idealCellSize;
    const cellHeight = idealCellSize;
    
    // Calculate the actual grid dimensions
    const actualGridWidth = cellWidth * cols;
    const actualGridHeight = cellHeight * rows;
    
    // Create an invisible container for the grid
    const gridBg = new PIXI.Graphics();
    gridBg.beginFill(0x000000, 0); // Completely transparent
    gridBg.lineStyle(0); // No border
    gridBg.drawRect(-actualGridWidth/2, -actualGridHeight/2, actualGridWidth, actualGridHeight);
    gridBg.endFill();
    gridContainer.addChild(gridBg);
    
    // Load symbols and create grid
    const loadAndCreateSymbols = async () => {
      try {
        // Generate placeholder symbol textures if no symbols are provided
        let textures = [];
        
        if (!symbols.length) {
          // Create placeholder symbols
          const placeholderTextures = [];
          const colors = [0xFF5555, 0x55FF55, 0x5555FF, 0xFFFF55, 0xFF55FF, 0x55FFFF, 0xFFAAAA, 0xAAFFAA, 0xAAAAFF, 0xFFFFFF];
          
          for (let i = 0; i < 10; i++) {
            const g = new PIXI.Graphics();
            g.beginFill(colors[i % colors.length], 0.8);
            g.drawRoundedRect(0, 0, 100, 100, 15);
            g.endFill();
            g.lineStyle(3, 0xFFFFFF, 0.5);
            g.drawRoundedRect(0, 0, 100, 100, 15);
            
            const symbol = new PIXI.Text(i === 0 ? 'W' : i === 1 ? 'S' : i < 5 ? 'H' : 'L', {
              fontFamily: 'Arial',
              fontSize: 40,
              fill: 0xFFFFFF,
              align: 'center'
            });
            symbol.anchor.set(0.5);
            symbol.position.set(50, 50);
            g.addChild(symbol);
            
            placeholderTextures.push(app.renderer.generateTexture(g));
          }
          
          textures = placeholderTextures;
        } else {
          // Regular symbol loading if symbols are provided
          const texturePromises = symbols.map(url => 
            PIXI.Assets.load(url)
              .catch(error => {
                debugLog(`Failed to load texture: ${url}`, error);
                
                // Create fallback texture
                const g = new PIXI.Graphics();
                g.beginFill(0x555555, 0.9);
                g.drawRoundedRect(0, 0, 100, 100, 15);
                g.endFill();
                g.lineStyle(3, 0xFFFFFF, 0.8);
                g.drawRoundedRect(5, 5, 90, 90, 12);
                
                // Add a "?" character
                const text = new PIXI.Text('?', {
                  fontFamily: 'Arial',
                  fontSize: 50,
                  fontWeight: 'bold',
                  fill: 0xFFFFFF,
                  align: 'center'
                });
                text.anchor.set(0.5);
                text.position.set(50, 50);
                g.addChild(text);
                
                return app.renderer.generateTexture(g);
              })
          );
          
          textures = await Promise.all(texturePromises);
        }
        
        // Create symbol grid
        const symbolGrid: PIXI.Sprite[][] = [];
        
        for (let colIndex = 0; colIndex < cols; colIndex++) {
          const column: PIXI.Sprite[] = [];
          symbolGrid.push(column);
          
          for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
            // Pick texture - cycle through textures
            const textureIndex = (colIndex * rows + rowIndex) % textures.length;
            const texture = textures[textureIndex];
            
            // Calculate position within grid
            const x = -actualGridWidth/2 + colIndex * cellWidth + cellWidth/2;
            const y = -actualGridHeight/2 + rowIndex * cellHeight + cellHeight/2;
            
            // Create sprite
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5); // Center the sprite
            sprite.position.set(x, y);
            
            // Set name to identify special symbols
            const symbolName = symbols[textureIndex]?.split('/').pop()?.split('.')[0] || '';
            sprite.name = symbolName;
            
            // Scale to fill more of the cell
            const maxDimension = Math.min(cellWidth, cellHeight) * 0.95;
            const scale = Math.min(
              maxDimension / texture.width,
              maxDimension / texture.height
            );
            
            sprite.scale.set(scale);
            
            // Add to container and array
            gridContainer.addChild(sprite);
            column.push(sprite);
          }
        }
        
        // Save reference to symbols
        symbolSpritesRef.current = symbolGrid;
        
        // Apply initial controls
        applyControls(frameConfig);
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error creating symbol grid:", error);
      }
    };
    
    loadAndCreateSymbols();
    
    // Cleanup on unmount
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [symbols, dimensions.width, dimensions.height, cols, rows]);
  
  // Apply controls to the grid container
  const applyControls = (config: EndlessReelPreviewProps['frameConfig']) => {
    if (!gridContainerRef.current || !config) return;
    
    const gridContainer = gridContainerRef.current;
    
    // Reset transforms
    gridContainer.scale.set(1);
    
    // Calculate container dimensions for proper scaling
    const containerWidth = dimensions.width || 800;
    const containerHeight = dimensions.height || 600;
    
    // Base scale factor
    const baseScaleFactor = 0.7;
    
    // Apply transparent area calculation
    let spaceMultiplierX = 1;
    let spaceMultiplierY = 1;
    let offsetX = 0;
    let offsetY = 0;
    
    if (config.transparentArea) {
      const leftMargin = config.transparentArea.left || 15;
      const rightMargin = config.transparentArea.right || 15;
      const topMargin = config.transparentArea.top || 15;
      const bottomMargin = config.transparentArea.bottom || 15;
      
      // Calculate available space percentage
      const availableSpaceX = (100 - leftMargin - rightMargin) / 100;
      const availableSpaceY = (100 - topMargin - bottomMargin) / 100;
      
      // Calculate multiplier to fill the available space
      spaceMultiplierX = availableSpaceX / 0.7;
      spaceMultiplierY = availableSpaceY / 0.7;
      
      // Calculate offset based on margin difference
      offsetX = (rightMargin - leftMargin) * 2;
      offsetY = (bottomMargin - topMargin) * 2;
    }
    
    // Set the base scale
    const baseScale = baseScaleFactor;
    gridContainer.scale.set(baseScale);
    
    // Apply manual scale control from UI
    if (config.scale) {
      const scaleValue = config.scale / 100;
      gridContainer.scale.x *= scaleValue;
      gridContainer.scale.y *= scaleValue;
    }
    
    // Apply stretch factors (separate X and Y scaling)
    if (config.stretch) {
      const stretchX = (config.stretch.x || 100) / 100;
      const stretchY = (config.stretch.y || 100) / 100;
      
      gridContainer.scale.x *= stretchX;
      gridContainer.scale.y *= stretchY;
    }
    
    // Apply transparent area scaling
    gridContainer.scale.x *= spaceMultiplierX;
    gridContainer.scale.y *= spaceMultiplierY;
    
    // Apply position with offsets
    const posX = (config.position?.x || 0) - offsetX;
    const posY = (config.position?.y || 0) - offsetY;
    
    gridContainer.position.set(posX, posY);
  };
  
  // Update when controls change
  useEffect(() => {
    if (!isInitialized) return;
    
    applyControls(frameConfig);
  }, [
    isInitialized,
    frameConfig?.position?.x,
    frameConfig?.position?.y,
    frameConfig?.scale,
    frameConfig?.stretch?.x,
    frameConfig?.stretch?.y,
    frameConfig?.transparentArea?.top,
    frameConfig?.transparentArea?.right,
    frameConfig?.transparentArea?.bottom,
    frameConfig?.transparentArea?.left
  ]);
  
  // Extract visible symbols for final grid
  const extractVisibleSymbols = (): ExtractedSymbol[] => {
    const extractedSymbols: ExtractedSymbol[] = [];
    
    // Use the original symbol grid if no extracted symbols exist
    symbolSpritesRef.current.forEach((column, colIndex) => {
      column.forEach((sprite, rowIndex) => {
        extractedSymbols.push({
          texture: sprite.texture,
          rowIndex: rowIndex,
          colIndex: colIndex,
          isBonus: sprite.name?.includes('Wild') || sprite.name?.includes('Scatter'),
          name: sprite.name,
          // Default subtle animation for all symbols
          animationData: {
            scale: 0.03,
            rotation: 0.005,
            alpha: 0
          }
        });
      });
    });
    
    return extractedSymbols;
  };
  
  // Handle direct spin events and update states
  useEffect(() => {
    if (!isInitialized) return;
    
    // Update refs with current state
    isSpinningRef.current = isSpinning;
    internalSpinningRef.current = internalSpinning;
    
    // Handler for direct spin events
    const handleDirectSpinStart = () => {
      if (!internalSpinningRef.current) {
        setInternalSpinning(true);
        internalSpinningRef.current = true;
        
        if (onSpinStart) {
          onSpinStart();
        }
      }
    };
    
    // Handle prop changes for isSpinning
    if (isSpinning && !internalSpinning) {
      setInternalSpinning(true);
      
      if (onSpinStart) {
        onSpinStart();
      }
    }
    
    // Register event handler
    document.addEventListener('directSpinStart', handleDirectSpinStart);
    
    // Handle completion of spinning
    if (!isSpinning && internalSpinning) {
      // Extract visible symbols
      const extractedSymbols = extractVisibleSymbols();
      
      // Update state to finish spinning
      setInternalSpinning(false);
      
      // Notify parent component
      if (onSpinComplete) {
        onSpinComplete(extractedSymbols);
      }
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('directSpinStart', handleDirectSpinStart);
    };
  }, [isInitialized, isSpinning, internalSpinning, onSpinStart, onSpinComplete]);
  
  // Component render
  return (
    <div 
      ref={containerRef}
      className="w-full h-full"
      style={{
        position: 'relative',
        overflow: 'hidden'
      }}
      data-component="EndlessReelPreview"
    />
  );
};

export default EndlessReelPreview;