import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';

// Interface for symbols extracted from a spin with texture and position
interface ExtractedSymbol {
  texture: PIXI.Texture;
  rowIndex: number;
  colIndex: number;
}

// Configuration for frame positioning and scaling
interface FrameConfig {
  xOffset?: number;
  yOffset?: number;
  scale?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

// Component props
interface FinalSymbolGridProps {
  symbols?: ExtractedSymbol[]; // Extracted symbols from a spin (with texture)
  defaultSymbols?: string[]; // Fallback image paths if no extracted symbols
  frameConfig?: FrameConfig; // Positioning and scaling options
  dimensions?: { width: number; height: number }; // Container sizing
  rows?: number; // Grid row count
  cols?: number; // Grid column count
  hasIdleAnimation?: boolean; // Control idle animations
  showGrid?: boolean; // Show grid lines
  onGridReady?: () => void; // Callback when grid is ready
  winningCombinations?: { row: number; col: number }[]; // Highlight winning symbols
  debug?: boolean; // Enable debug logging
}

const FinalSymbolGrid: React.FC<FinalSymbolGridProps> = ({
  symbols,
  defaultSymbols = [],
  frameConfig = {},
  dimensions,
  rows = 3,
  cols = 5,
  hasIdleAnimation = false,
  showGrid = false,
  onGridReady,
  winningCombinations = [],
  debug = true, // Enable debug by default for this enhanced version
}) => {
  // Refs for container and PIXI app
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const animationsRef = useRef<gsap.core.Tween[]>([]);
  const spritesRef = useRef<PIXI.Sprite[]>([]);
  const loadedTexturesRef = useRef<PIXI.Texture[]>([]);
  const gridContainerRef = useRef<PIXI.Container | null>(null);
  
  // State for tracking initialization and errors
  const [hasInitialized, setHasInitialized] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasSufficientSize, setHasSufficientSize] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [textureLoadFailed, setTextureLoadFailed] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  // Debug logging function
  const debugLog = (message: string, data?: any) => {
    if (debug) {
      console.debug(`[FinalSymbolGrid] ${message}`, data !== undefined ? data : '');
    }
  };

  // Update debug info for display
  const updateDebugInfo = (info: Record<string, any>) => {
    setDebugInfo(prev => ({ ...prev, ...info }));
  };

  // Container size polling effect
  useEffect(() => {
    debugLog("Component mounted, starting size polling...");
    let sizeCheckCount = 0;
    let useDefaultSize = false;
    
    const sizeCheckInterval = setInterval(() => {
      sizeCheckCount++;
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        debugLog(`Size check #${sizeCheckCount}: ${width}x${height}`);
        setContainerSize({ width, height });
        updateDebugInfo({ 
          containerWidth: width, 
          containerHeight: height,
          sizeCheckCount
        });
        
        // Check if dimensions are sufficient
        if (width > 100 && height > 100) {
          debugLog(`Found sufficient container size: ${width}x${height}`);
          setHasSufficientSize(true);
          clearInterval(sizeCheckInterval);
        } 
        // After 20 attempts (5 seconds), fall back to default size
        else if (sizeCheckCount >= 20 && !useDefaultSize) {
          debugLog("Size polling timed out, falling back to default dimensions 800x600");
          setContainerSize({ width: 800, height: 600 });
          setHasSufficientSize(true);
          useDefaultSize = true;
          clearInterval(sizeCheckInterval);
        }
      }
    }, 250); // Poll every 250ms as requested
    
    return () => {
      debugLog("Clearing size check interval");
      clearInterval(sizeCheckInterval);
    };
  }, []);

  // Initialize PIXI application when container size is sufficient
  useEffect(() => {
    if (!hasSufficientSize || hasInitialized) return;
    
    const initializePixi = () => {
      try {
        setInitializationAttempts(prev => prev + 1);
        const width = dimensions?.width || containerSize.width;
        const height = dimensions?.height || containerSize.height;
        
        // Always log the specific initialization message
        console.info(`[FinalSymbolGrid] Initialization triggered with dimensions: ${width}x${height}`);
        debugLog(`Attempt #${initializationAttempts + 1} to initialize PIXI app with dimensions: ${width}x${height}`);
        
        if (width < 100 || height < 100) {
          debugLog("Dimensions too small, aborting initialization");
          setErrorState("Container dimensions too small");
          return;
        }
        
        updateDebugInfo({ 
          appWidth: width, 
          appHeight: height,
          initAttempt: initializationAttempts + 1,
          gridRows: rows,
          gridCols: cols,
          symbolCount: symbols?.length || defaultSymbols.length
        });
        
        // Create PIXI application
        if (containerRef.current) {
          // Destroy any existing app
          if (appRef.current) {
            debugLog("Destroying existing PIXI app before re-initialization");
            appRef.current.destroy(true);
          }
          
          // Create new PIXI app
          const app = new PIXI.Application({
            width,
            height,
            backgroundColor: 0x000000,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
          });
          
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(app.view as HTMLCanvasElement);
          appRef.current = app;
          
          // Create the symbol grid
          createSymbolGrid(width, height);
          setHasInitialized(true);
          
          if (onGridReady) {
            onGridReady();
          }
        }
      } catch (error) {
        console.error("[FinalSymbolGrid] Error initializing PIXI application:", error);
        setErrorState(`Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        updateDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };
    
    initializePixi();
  }, [hasSufficientSize, containerSize, dimensions, hasInitialized]);

  // Create the symbol grid with the provided dimensions
  const createSymbolGrid = async (width: number, height: number) => {
    if (!appRef.current) {
      debugLog("Cannot create grid: PIXI app not initialized");
      return;
    }
    
    try {
      debugLog("Creating symbol grid with dimensions:", { width, height, rows, cols });
      
      // Calculate grid and cell dimensions
      const { 
        xOffset = 0, 
        yOffset = 0, 
        scale = 1, 
        marginTop = 0, 
        marginBottom = 0, 
        marginLeft = 0, 
        marginRight = 0 
      } = frameConfig;
      
      const gridWidth = width - marginLeft - marginRight;
      const gridHeight = height - marginTop - marginBottom;
      const cellWidth = gridWidth / cols;
      const cellHeight = gridHeight / rows;
      
      updateDebugInfo({ 
        gridWidth, 
        gridHeight, 
        cellWidth, 
        cellHeight 
      });
      
      debugLog("Grid dimensions calculated:", { 
        gridWidth, gridHeight, cellWidth, cellHeight, 
        xOffset, yOffset, scale 
      });
      
      // Create grid container
      const gridContainer = new PIXI.Container();
      gridContainer.x = width / 2 + xOffset;
      gridContainer.y = height / 2 + yOffset;
      gridContainer.scale.set(scale);
      appRef.current.stage.addChild(gridContainer);
      gridContainerRef.current = gridContainer;
      
      // Show grid lines if requested
      if (showGrid) {
        debugLog("Drawing grid lines");
        const gridGraphics = new PIXI.Graphics();
        gridGraphics.lineStyle(2, 0xFFFFFF, 0.3);
        
        // Draw horizontal lines
        for (let r = 0; r <= rows; r++) {
          const y = r * cellHeight - (gridHeight / 2);
          gridGraphics.moveTo(-gridWidth / 2, y);
          gridGraphics.lineTo(gridWidth / 2, y);
        }
        
        // Draw vertical lines
        for (let c = 0; c <= cols; c++) {
          const x = c * cellWidth - (gridWidth / 2);
          gridGraphics.moveTo(x, -gridHeight / 2);
          gridGraphics.lineTo(x, gridHeight / 2);
        }
        
        gridContainer.addChild(gridGraphics);
      }
      
      // Load and create symbols
      let hasCreatedGrid = false;
      
      // First attempt with extracted symbols (if available)
      if (symbols && symbols.length > 0) {
        debugLog(`Creating grid from ${symbols.length} extracted symbols`);
        try {
          createSymbolsFromExtracted(gridContainer, symbols, cellWidth, cellHeight);
          hasCreatedGrid = true;
          updateDebugInfo({ symbolSource: 'extracted', symbolCount: symbols.length });
        } catch (error) {
          console.error("[FinalSymbolGrid] Error creating extracted symbols:", error);
          updateDebugInfo({ extractedSymbolError: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      // Try with default symbols if no extracted symbols or they failed
      if (!hasCreatedGrid && defaultSymbols && defaultSymbols.length > 0) {
        debugLog(`Creating grid from ${defaultSymbols.length} default symbol URLs`);
        try {
          await createSymbolsFromUrls(gridContainer, defaultSymbols, cellWidth, cellHeight);
          hasCreatedGrid = true;
          updateDebugInfo({ symbolSource: 'default', symbolCount: defaultSymbols.length });
        } catch (error) {
          console.error("[FinalSymbolGrid] Error creating symbols from URLs:", error);
          setTextureLoadFailed(true);
          updateDebugInfo({ defaultSymbolError: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      // If no symbols could be created, create test cells
      if (!hasCreatedGrid || textureLoadFailed) {
        debugLog("No valid symbols available, creating TEST CELL placeholders");
        createTestCellGrid(gridContainer, cellWidth, cellHeight);
        hasCreatedGrid = true;
        updateDebugInfo({ symbolSource: 'test_cells' });
      }
      
      // Highlight winning combinations if provided
      if (winningCombinations && winningCombinations.length > 0) {
        debugLog(`Highlighting ${winningCombinations.length} winning combinations`);
        highlightWinningCombinations(gridContainer, cellWidth, cellHeight, winningCombinations);
      }
      
    } catch (error) {
      console.error("[FinalSymbolGrid] Error in createSymbolGrid:", error);
      setErrorState(`Grid creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Create test cells as fallback if grid creation fails
      if (appRef.current && gridContainerRef.current) {
        debugLog("Creating emergency TEST CELL grid after error");
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        createTestCellGrid(gridContainerRef.current, cellWidth, cellHeight);
        updateDebugInfo({ symbolSource: 'emergency_test_cells' });
      }
    }
  };

  // Create symbols from extracted symbols (with textures)
  const createSymbolsFromExtracted = (
    gridContainer: PIXI.Container,
    extractedSymbols: ExtractedSymbol[],
    cellWidth: number,
    cellHeight: number
  ) => {
    debugLog(`Creating ${extractedSymbols.length} symbols from extracted textures`);
    
    const symbolSprites: PIXI.Sprite[] = [];
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Find the matching symbol for this position
        const symbol = extractedSymbols.find(
          (s) => s.rowIndex === r && s.colIndex === c
        );
        
        if (symbol && symbol.texture) {
          debugLog(`Creating sprite for extracted symbol at (${c},${r})`);
          const sprite = createSymbolSprite(
            symbol.texture,
            cellWidth,
            cellHeight,
            c,
            r,
            cols,
            rows
          );
          
          gridContainer.addChild(sprite);
          symbolSprites.push(sprite);
          
          // Apply idle animation if enabled
          if (hasIdleAnimation) {
            applyIdleAnimation(sprite);
          }
        } else {
          // Create test cell if no texture for this position
          debugLog(`No extracted symbol for position (${c},${r}), creating test cell`);
          createTestCell(
            gridContainer,
            c,
            r,
            cellWidth,
            cellHeight,
            cols,
            rows
          );
        }
      }
    }
    
    spritesRef.current = symbolSprites;
  };

  // Create symbols from URLs (loading textures)
  const createSymbolsFromUrls = async (
    gridContainer: PIXI.Container,
    symbolUrls: string[],
    cellWidth: number,
    cellHeight: number
  ) => {
    try {
      debugLog(`Loading ${symbolUrls.length} textures from URLs`);
      updateDebugInfo({ loadingTextures: symbolUrls.length });
      
      // Load all textures
      const textures: PIXI.Texture[] = [];
      
      // Track load success/failure
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < symbolUrls.length; i++) {
        try {
          debugLog(`Loading texture for URL ${i + 1}/${symbolUrls.length}: ${symbolUrls[i].substring(0, 30)}...`);
          const texture = await PIXI.Assets.load(symbolUrls[i]);
          textures.push(texture);
          successCount++;
        } catch (error) {
          debugLog(`Failed to load texture at index ${i}: ${error}`);
          failureCount++;
          // Push a null to maintain the index position
          textures.push(null as any);
        }
      }
      
      updateDebugInfo({ 
        textureLoadSuccess: successCount,
        textureLoadFailure: failureCount
      });
      
      if (successCount === 0) {
        debugLog("All texture loads failed, cannot create grid from URLs");
        throw new Error("All texture loads failed");
      }
      
      // Store loaded textures for cleanup
      loadedTexturesRef.current = textures.filter(Boolean);
      
      // Create sprites for each grid position
      const symbolSprites: PIXI.Sprite[] = [];
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Calculate symbol index based on position
          const symbolIndex = (r * cols + c) % textures.length;
          const texture = textures[symbolIndex];
          
          if (texture) {
            debugLog(`Creating sprite for URL texture at (${c},${r}), using symbol index ${symbolIndex}`);
            const sprite = createSymbolSprite(
              texture,
              cellWidth,
              cellHeight,
              c,
              r,
              cols,
              rows
            );
            
            gridContainer.addChild(sprite);
            symbolSprites.push(sprite);
            
            // Apply idle animation if enabled
            if (hasIdleAnimation) {
              applyIdleAnimation(sprite);
            }
          } else {
            // Create test cell if texture load failed
            debugLog(`No valid texture for position (${c},${r}), creating test cell`);
            createTestCell(
              gridContainer,
              c,
              r,
              cellWidth,
              cellHeight,
              cols,
              rows
            );
          }
        }
      }
      
      spritesRef.current = symbolSprites;
      
    } catch (error) {
      console.error("[FinalSymbolGrid] Error loading textures:", error);
      setTextureLoadFailed(true);
      throw error;
    }
  };

  // Create a test cell at the specified position (for debugging)
  const createTestCell = (
    gridContainer: PIXI.Container,
    col: number,
    row: number,
    cellWidth: number,
    cellHeight: number,
    totalCols: number,
    totalRows: number
  ) => {
    debugLog(`Creating TEST CELL at (${col},${row})`);
    
    // Create a container for the cell
    const cellContainer = new PIXI.Container();
    
    // Position the cell
    const x = (col - (totalCols - 1) / 2) * cellWidth;
    const y = (row - (totalRows - 1) / 2) * cellHeight;
    cellContainer.position.set(x, y);
    
    // Create a bright background rectangle
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(3, 0xFFFFFF, 1);
    graphics.beginFill(0xFF3333, 0.7);
    graphics.drawRect(-cellWidth/2 * 0.9, -cellHeight/2 * 0.9, cellWidth * 0.9, cellHeight * 0.9);
    graphics.endFill();
    
    // Add TEST CELL text
    const text = new PIXI.Text(`TEST CELL\n(${col},${row})`, {
      fontFamily: 'Arial',
      fontSize: cellWidth * 0.12,
      fill: 0xFFFFFF,
      align: 'center',
      fontWeight: 'bold',
    });
    text.anchor.set(0.5);
    
    cellContainer.addChild(graphics);
    cellContainer.addChild(text);
    gridContainer.addChild(cellContainer);
    
    return cellContainer;
  };

  // Create a grid of test cells (when no valid symbols are available)
  const createTestCellGrid = (
    gridContainer: PIXI.Container,
    cellWidth: number,
    cellHeight: number
  ) => {
    debugLog("Creating complete TEST CELL grid");
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        createTestCell(
          gridContainer,
          c,
          r,
          cellWidth,
          cellHeight,
          cols,
          rows
        );
      }
    }
  };

  // Create a sprite for a symbol with proper scaling and positioning
  const createSymbolSprite = (
    texture: PIXI.Texture,
    cellWidth: number,
    cellHeight: number,
    col: number,
    row: number,
    totalCols: number,
    totalRows: number
  ): PIXI.Sprite => {
    const sprite = new PIXI.Sprite(texture);
    
    // Position the sprite
    const x = (col - (totalCols - 1) / 2) * cellWidth;
    const y = (row - (totalRows - 1) / 2) * cellHeight;
    sprite.position.set(x, y);
    
    // Set the anchor to center
    sprite.anchor.set(0.5);
    
    // Calculate scale to fit the cell
    const maxScale = 0.9; // Leave some space around the symbol
    const scaleX = (cellWidth * maxScale) / sprite.width;
    const scaleY = (cellHeight * maxScale) / sprite.height;
    const scale = Math.min(scaleX, scaleY); // Use the smaller scale to maintain aspect ratio
    
    sprite.scale.set(scale);
    
    return sprite;
  };

  // Apply idle animation to a symbol (subtle floating effect)
  const applyIdleAnimation = (sprite: PIXI.Sprite) => {
    if (!hasIdleAnimation) return;
    
    const tween = gsap.to(sprite, {
      y: sprite.y + 5,
      duration: 1 + Math.random(),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    
    animationsRef.current.push(tween);
  };

  // Highlight winning combinations
  const highlightWinningCombinations = (
    gridContainer: PIXI.Container,
    cellWidth: number,
    cellHeight: number,
    winningCombinations: { row: number; col: number }[]
  ) => {
    for (const combo of winningCombinations) {
      const { row, col } = combo;
      
      // Create a highlight effect
      const highlight = new PIXI.Graphics();
      const x = (col - (cols - 1) / 2) * cellWidth;
      const y = (row - (rows - 1) / 2) * cellHeight;
      
      highlight.beginFill(0xFFFF00, 0.3);
      highlight.lineStyle(4, 0xFFFF00, 0.8);
      highlight.drawRect(
        -cellWidth / 2 * 0.95,
        -cellHeight / 2 * 0.95,
        cellWidth * 0.95,
        cellHeight * 0.95
      );
      highlight.endFill();
      highlight.position.set(x, y);
      
      gridContainer.addChild(highlight);
      
      // Add a pulsing animation
      gsap.to(highlight, {
        alpha: 0.2,
        duration: 0.7,
        repeat: -1,
        yoyo: true,
      });
    }
  };

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      debugLog("Component unmounting, cleaning up resources");
      
      // Stop all animations
      animationsRef.current.forEach((anim) => {
        anim.kill();
      });
      animationsRef.current = [];
      
      // Destroy sprites
      spritesRef.current.forEach((sprite) => {
        if (sprite && !sprite.destroyed) {
          sprite.destroy({ children: true, texture: false, baseTexture: false });
        }
      });
      spritesRef.current = [];
      
      // Destroy textures
      loadedTexturesRef.current.forEach((texture) => {
        if (texture && !texture.destroyed) {
          texture.destroy(true);
        }
      });
      loadedTexturesRef.current = [];
      
      // Destroy grid container
      if (gridContainerRef.current) {
        gridContainerRef.current.destroy({ children: true });
        gridContainerRef.current = null;
      }
      
      // Destroy PIXI application
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
      data-testid="final-symbol-grid"
    >
      {/* Size warning overlay for insufficient dimensions */}
      {(!hasSufficientSize || containerSize.width < 100 || containerSize.height < 100) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255, 0, 0, 0.7)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            fontSize: '16px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <strong style={{ fontSize: '20px', marginBottom: '10px' }}>
            FinalSymbolGrid failed to get valid container dimensions
          </strong>
          <div>Current size: {containerSize.width}x{containerSize.height}</div>
          <div>Attempt: {initializationAttempts}</div>
          <div style={{ marginTop: '10px' }}>
            Waiting for sufficient container size...
          </div>
        </div>
      )}

      {/* Error state overlay */}
      {errorState && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            fontSize: '14px',
            zIndex: 15,
          }}
        >
          <strong>Error:</strong> {errorState}
        </div>
      )}

      {/* Diagnostic overlay */}
      {debug && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'lime',
            padding: '10px',
            fontSize: '12px',
            fontFamily: 'monospace',
            maxWidth: '300px',
            maxHeight: '80%',
            overflowY: 'auto',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div><strong>FinalSymbolGrid Diagnostic</strong></div>
          <div>Initialized: {hasInitialized ? 'Yes' : 'No'}</div>
          <div>Size: {containerSize.width}x{containerSize.height}</div>
          <div>Sufficient: {hasSufficientSize ? 'Yes' : 'No'}</div>
          <div>Attempts: {initializationAttempts}</div>
          <div>Grid: {rows}x{cols}</div>
          <div>Error: {errorState || 'None'}</div>
          <div>Texture Load Failed: {textureLoadFailed ? 'Yes' : 'No'}</div>
          
          {/* Additional debug info */}
          {Object.entries(debugInfo).map(([key, value]) => (
            <div key={key}>
              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FinalSymbolGrid;