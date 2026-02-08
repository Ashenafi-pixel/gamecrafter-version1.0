import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../../store';
import { calculateMockupDimensions, mockupStyles, generatePlaceholderSymbols } from './mockupUtils';

interface CSSSlotMockupProps {
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
  // Logo props
  logo?: string;
  logoPosition?: { x: number; y: number };
  logoScale?: number;
  logoPositioningMode?: boolean;
  onLogoPositionChange?: (position: { x: number; y: number }) => void;
  onLogoScaleChange?: (scale: number) => void;
}

/**
 * CSS Slot Mockup Component
 * 
 * Replicates the exact visual appearance of the PIXI Premium Slot Preview
 * using pure CSS for Steps 3-5. Matches dimensions, colors, and layout precisely.
 */
const CSSSlotMockup: React.FC<CSSSlotMockupProps> = ({
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
  logo,
  logoPosition = { x: 0, y: -50 },
  logoScale = 100,
  logoPositioningMode = false,
  onLogoPositionChange,
  onLogoScaleChange
}) => {
  const { config } = useGameStore();
  
  // Auto-retrieve assets from store if not passed as props (for complete slot machine view)
  const finalLogo = logo || config?.logo || config?.gameName; // Fallback to game name if no logo
  const finalBackground = background || config?.background?.backgroundImage || config?.backgroundImage;
  const finalFrame = frame || config?.frame?.frameImage || config?.frameImage;
  const finalSymbols = symbols.length > 0 ? symbols : config?.theme?.generated?.symbols || [];
  
  // DYNAMIC MATCH TO PIXIJS: Use container-based dimensions like PixiJS does
  // PixiJS adapts to its container size, so CSS should do the same
  const [containerDimensions, setContainerDimensions] = React.useState({ width: 800, height: 600 });
  const internalWidth = containerDimensions.width;
  const internalHeight = containerDimensions.height;
  
  // DEBUG: Log canvas dimensions
  console.log(`CSS Canvas dimensions: ${internalWidth}x${internalHeight}`);
  
  // Calculate scale factor to stretch internal canvas to fill container (like PixiJS objectFit: 'fill')
  const [scaleX, setScaleX] = React.useState(1);
  const [scaleY, setScaleY] = React.useState(1);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        
        // MATCH PIXIJS BEHAVIOR: Use container size as internal dimensions
        // This makes CSS canvas adapt to container size like PixiJS does
        setContainerDimensions({ width: rect.width, height: rect.height });
        
        // Since internal dimensions now match container, scale is always 1:1
        const newScaleX = 1;
        const newScaleY = 1;
        
        setScaleX(newScaleX);
        setScaleY(newScaleY);
        setContainerSize({ width: rect.width, height: rect.height });
        
        console.log('[CSSSlotMockup] Container-based sizing (MATCH PIXIJS):', { 
          containerDimensions: { width: rect.width, height: rect.height },
          internalDimensions: { internalWidth, internalHeight }, 
          scaleX: newScaleX, 
          scaleY: newScaleY,
          behavior: 'Dynamic sizing like PixiJS'
        });
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  
  console.log('[CSSSlotMockup] Asset debug:', {
    logo: finalLogo ? 'HAS LOGO' : 'NO LOGO',
    background: finalBackground ? 'HAS BACKGROUND' : 'NO BACKGROUND',
    symbols: finalSymbols.length,
    allAssets: { finalLogo, finalBackground, finalFrame, symbolCount: finalSymbols.length }
  });
  
  console.log('[CSSSlotMockup] Logo positioning debug:', {
    logoPosition,
    logoScale,
    logoScaleDecimal: logoScale / 100,
    adjustedScale: logoScale / 100 * 2.5,  // 2.5x multiplier to better match PixiJS size
    basePosition: { left: '50%', top: '10%' },
    finalTransform: `translate(-50%, -50%) translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoScale / 100 * 2.5})`,
    canvasDimensions: { width: internalWidth, height: internalHeight },
    basePixelPosition: { x: internalWidth * 0.5, y: internalHeight * 0.1 }
  });
  
  // EXACT MATCH TO PIXIJS: Calculate grid dimensions using PixiJS internal dimensions
  const gridDimensions = calculateMockupDimensions({
    cols,
    rows,
    // MATCH PIXIJS CANVAS: Use exact same internal dimensions as PixiJS
    containerWidth: internalWidth,   // Use PixiJS internal width
    containerHeight: internalHeight, // Use PixiJS internal height
    isMobile,
    orientation
  });
  const { symbolSize, gridWidth, gridHeight, gridX, gridY, symbolPadding } = gridDimensions;
  
  // Smart symbol population: fill grid progressively as symbols are added
  const generateDisplaySymbols = () => {
    const totalCells = cols * rows;
    const displaySymbols = [];
    const symbolsToUse = finalSymbols;
    
    if (symbolsToUse.length === 0) {
      // No symbols - use placeholders
      return generatePlaceholderSymbols(cols, rows, 'default');
    } else if (symbolsToUse.length === 1) {
      // Single symbol - replicate across all cells
      for (let i = 0; i < totalCells; i++) {
        displaySymbols.push(symbolsToUse[0]);
      }
    } else {
      // Multiple symbols - distribute cyclically across grid
      for (let i = 0; i < totalCells; i++) {
        // Handle both string URLs and object formats
        const symbol = symbolsToUse[i % symbolsToUse.length];
        const symbolUrl = typeof symbol === 'string' ? symbol : (symbol?.url || symbol?.imageUrl);
        displaySymbols.push(symbolUrl);
      }
    }
    
    return displaySymbols;
  };
  
  const displaySymbols = generateDisplaySymbols();
  
  // Logo drag state for interactive positioning
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isResizingLogo, setIsResizingLogo] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [startScale, setStartScale] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  // Logo drag handlers for interactive positioning
  const handleLogoMouseDown = useCallback((e: React.MouseEvent) => {
    if (!logoPositioningMode || !onLogoPositionChange) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingLogo(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    setStartPosition({
      x: logoPosition.x,
      y: logoPosition.y
    });
    
    console.log('[CSSSlotMockup] Logo drag started at:', { x: e.clientX, y: e.clientY });
  }, [logoPositioningMode, onLogoPositionChange, logoPosition]);

  const handleLogoMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingLogo || !onLogoPositionChange) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const newPosition = {
      x: startPosition.x + deltaX,
      y: startPosition.y + deltaY
    };
    
    // Allow movement across entire canvas with generous bounds
    newPosition.x = Math.max(-1000, Math.min(1000, newPosition.x));
    newPosition.y = Math.max(-800, Math.min(800, newPosition.y));
    
    onLogoPositionChange(newPosition);
  }, [isDraggingLogo, dragStart, startPosition, onLogoPositionChange]);

  const handleLogoMouseUp = useCallback(() => {
    if (isDraggingLogo) {
      console.log('[CSSSlotMockup] Logo drag ended');
      setIsDraggingLogo(false);
    }
    if (isResizingLogo) {
      console.log('[CSSSlotMockup] Logo resize ended');
      setIsResizingLogo(false);
    }
  }, [isDraggingLogo, isResizingLogo]);

  // Logo resize handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!logoPositioningMode || !onLogoScaleChange) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizingLogo(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    setStartScale(logoScale);
    
    console.log('[CSSSlotMockup] Logo resize started');
  }, [logoPositioningMode, onLogoScaleChange, logoScale]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingLogo || !onLogoScaleChange) return;
    
    // Calculate distance from start point
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Use the larger of the two deltas for uniform scaling
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const direction = deltaX + deltaY > 0 ? 1 : -1; // Positive for growing, negative for shrinking
    
    // Scale factor: 1 pixel of movement = 1% scale change
    const scaleChange = direction * distance * 0.5; // Reduced sensitivity for better control
    const newScale = Math.max(20, Math.min(200, startScale + scaleChange)); // Constrain between 20% and 200%
    
    onLogoScaleChange(newScale);
  }, [isResizingLogo, dragStart, startScale, onLogoScaleChange]);

  // Set up global mouse event listeners for logo dragging and resizing
  useEffect(() => {
    if (isDraggingLogo || isResizingLogo) {
      const mouseMoveHandler = isDraggingLogo ? handleLogoMouseMove : handleResizeMouseMove;
      const cursor = isDraggingLogo ? 'grabbing' : 'nw-resize';
      
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', handleLogoMouseUp);
      document.body.style.cursor = cursor;
      
      return () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', handleLogoMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDraggingLogo, isResizingLogo, handleLogoMouseMove, handleResizeMouseMove, handleLogoMouseUp]);
  
  // Create symbol grid
  const renderSymbolGrid = () => {
    const cells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        const symbol = displaySymbols[index];
        
        cells.push(
          <div
            key={`${col}-${row}`}
            className="symbol-cell"
            style={{
              width: `${symbolSize}px`,
              height: `${symbolSize}px`,
              ...mockupStyles.symbolCell
            }}
          >
            {symbol ? (
              <img
                src={symbol}
                alt={`Symbol ${index + 1}`}
                style={mockupStyles.symbolImage}
                onError={(e) => {
                  // Fallback to transparent placeholder if image fails
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div style={mockupStyles.placeholderSymbol} />
            )}
          </div>
        );
      }
    }
    return cells;
  };
  
  // Debug log to check if component is rendering
  console.log('[CSSSlotMockup] Rendering with:', { 
    cols, rows, symbolSize, gridWidth, gridHeight, gridX, gridY, 
    inputSymbols: symbols.length,
    totalSymbols: displaySymbols.length,
    expectedSymbols: cols * rows,
    symbolPopulationMode: symbols.length === 0 ? 'placeholders' : symbols.length === 1 ? 'single-replicated' : 'multi-cyclic'
  });
  
  return (
    // Container that fills the preview area (like PixiJS container)
    <div 
      ref={wrapperRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}>
      {/* BACKGROUND LAYER - Gets stretched to fill space */}
      <div 
        ref={containerRef}
        className={`css-slot-mockup-background ${className}`} 
        style={{
          // EXACT MATCH TO PIXIJS: Internal canvas dimensions scaled to fill
          width: `${internalWidth}px`,     // Internal dimensions like PixiJS canvas
          height: `${internalHeight}px`,   // Internal dimensions like PixiJS canvas
          // Stretch to fill container like PixiJS objectFit: 'fill'
          position: 'absolute',
          top: '0',
          left: '0',
          // Modern dark elegant background to match PixiJS
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 70%, #1e293b 100%)',
          borderRadius: '0px',
          // EXACT MATCH TO PIXIJS: Use fill behavior (stretch to exact dimensions like PixiJS objectFit: 'fill')
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'top left'
        }}>
      {/* Background Layer - MATCH PIXIJS COVER SCALING */}
      {finalBackground && (
        <div style={{
          ...mockupStyles.backgroundLayer,
          backgroundImage: `url(${finalBackground})`,
          // EXACT MATCH TO PIXIJS: Use cover scaling like PixiJS Math.max() 
          backgroundSize: 'cover', // Zoom to fill (crop excess) like PixiJS
          backgroundPosition: 'center' // Center like PixiJS anchor.set(0.5)
        }} />
      )}
      </div>
      
      {/* SYMBOLS LAYER - NOT TRANSFORMED, maintains square aspect ratio */}
      <div
        className="symbol-grid"
        style={{
          ...mockupStyles.symbolGrid,
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${Math.min(scaleX, scaleY)})`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
          gridTemplateColumns: `repeat(${cols}, ${symbolSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${symbolSize}px)`,
          gap: `${symbolPadding}px`,
          zIndex: 2
        }}
      >
        {renderSymbolGrid()}
      </div>
      
      {/* Frame Layer */}
      {finalFrame && (
        <div style={{
          ...mockupStyles.frameLayer,
          backgroundImage: `url(${finalFrame})`
        }} />
      )}
      
      {/* Logo Overlay - Always show for testing positioning */}
      {(finalLogo || true) && (
        <>
          {/* Positioning mode overlay */}

          {/* Game Logo - EXACT MATCH TO PIXIJS positioning system */}
          <div 
            style={{
              position: 'absolute',
              // EXACT MATCH TO PIXIJS: Use same base positioning as PixiJS Renderer.ts
              // PixiJS: baseX = screen.width * 0.5, baseY = screen.height * 0.1
              left: '50%',  // 50% = center horizontally (matches PixiJS baseX)
              top: '10%',   // 10% = top offset (matches PixiJS baseY)
              // EXACT MATCH TO PIXIJS: translate(-50%, -50%) + user offset + scale
              transform: `translate(-50%, -50%) translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoScale / 100 * 2.5})`,
              maxWidth: '300px',  // Adjusted to better match PixiJS size
              maxHeight: '150px',
              zIndex: 20,
              pointerEvents: logoPositioningMode ? 'auto' : 'none',
              cursor: logoPositioningMode ? (isDraggingLogo ? 'grabbing' : isResizingLogo ? 'nw-resize' : 'grab') : 'default',
              transition: (isDraggingLogo || isResizingLogo) ? 'none' : 'transform 0.1s ease'
            }}
            onMouseDown={handleLogoMouseDown}
          >
            {finalLogo ? (
              <img
                src={finalLogo}
                alt="Game Logo"
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  filter: `drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5)) ${(isDraggingLogo || isResizingLogo) ? 'brightness(1.1)' : ''}`,
                  borderRadius: '8px',
                  border: logoPositioningMode ? 
                    ((isDraggingLogo || isResizingLogo) ? '1px solid rgba(255, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.3)') : 
                    '1px solid transparent'
                }}
                onError={(e) => {
                  console.error('[CSSSlotMockup] Failed to load game logo:', finalLogo);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => console.log('[CSSSlotMockup] Game logo loaded successfully')}
                draggable={false}
              />
            ) : null}
            
            {/* Resize handles - only show in positioning mode */}
            {logoPositioningMode && (
              <>
                {/* Corner resize handles */}
                {[
                  { position: 'top-left', cursor: 'nw-resize', top: '-4px', left: '-4px' },
                  { position: 'top-right', cursor: 'ne-resize', top: '-4px', right: '-4px' },
                  { position: 'bottom-left', cursor: 'sw-resize', bottom: '-4px', left: '-4px' },
                  { position: 'bottom-right', cursor: 'se-resize', bottom: '-4px', right: '-4px' }
                ].map((handle) => (
                  <div
                    key={handle.position}
                    style={{
                      position: 'absolute',
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.3)',
                      borderRadius: '50%',
                      cursor: handle.cursor,
                      zIndex: 25,
                      ...Object.fromEntries(
                        Object.entries(handle).filter(([key]) => ['top', 'right', 'bottom', 'left'].includes(key))
                      ),
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                    }}
                    onMouseDown={handleResizeMouseDown}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
                  />
                ))}
              </>
            )}
            
            {/* Position/Scale indicator during drag or resize */}
            {(isDraggingLogo || isResizingLogo) && (
              <div style={{
                position: 'absolute',
                bottom: '-32px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 30
              }}>
                <div style={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap'
                }}>
                  {isDraggingLogo ? 
                    `x: ${logoPosition.x}, y: ${logoPosition.y}` :
                    `Scale: ${Math.round(logoScale)}%`
                  }
                </div>
              </div>
            )}
          </div>

        </>
      )}
      
      
      {/* Bottom UI Bar - EXACT MATCH to PixiJS SlotGameUI (h-20 = 80px) */}
      <div style={{
        position: 'absolute',
        bottom: '16px',  // Position above the thin branding strip
        left: '0',
        right: '0',
        height: '55px',  // Thicker to match PixiJS UI bar
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 10
      }}>
        
        {/* Left Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Hamburger Menu - EXACT MATCH to PixiJS w-6 h-6 (24px) icons */}
          <button style={{
            width: '32px', height: '32px',  // Larger to match thicker UI bar
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            borderRadius: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          
          {/* Info Button - EXACT MATCH to PixiJS w-6 h-6 */}
          <button style={{
            width: '32px', height: '32px',  // Larger to match thicker UI bar
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            borderRadius: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </button>
          
          {/* BET Section - Proportional sizing */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: '40px',  // Proportional to thicker UI
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '8px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>BET</div>
            <div style={{ fontSize: '12px', color: 'white', fontWeight: 'bold', marginTop: '1px' }}>1.00</div>
          </div>
        </div>
        
        {/* Center Section - Spin Controls - smaller to match PixiJS */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'  // Proportional spacing
        }}>
          {/* Auto Spin Button - EXACT MATCH to PixiJS p-3 rounded-full */}
          <button style={{
            width: '28px', height: '28px',  // Larger sizing
            borderRadius: '50%',
            background: '#1F2937',  // bg-gray-800
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          
          {/* Main Spin Button - EXACT MATCH to PixiJS p-6 (96px total) */}
          <button style={{
            width: '40px', height: '40px',  // Larger main button
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',  // green-500 to green-600
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
            <div style={{
              position: 'absolute',
              inset: '0',
              borderRadius: '50%',
              background: '#10B981',
              opacity: '0',
              transition: 'opacity 0.2s'
            }}></div>
          </button>
          
          {/* Quick Spin Button - Compact sizing */}
          <button style={{
            width: '28px', height: '28px',  // Larger sizing
            borderRadius: '50%',
            background: '#1F2937',  // bg-gray-800
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"/>
            </svg>
          </button>
        </div>
        
        {/* Right Section - EXACT MATCH to PixiJS gap-6 (24px) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'end', gap: '8px' }}>
          {/* WIN Display - Proportional sizing */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: '35px',  // Proportional
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '8px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>WIN</div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 'bold', marginTop: '1px' }}>0.00</div>
          </div>
          
          {/* BALANCE Display - Proportional sizing */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: '55px',  // Proportional
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '8px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>BALANCE</div>
            <div style={{ fontSize: '11px', color: 'white', fontWeight: 'bold', marginTop: '1px' }}>1,000.00</div>
          </div>
          
          {/* Sound Button - EXACT MATCH to PixiJS w-6 h-6 */}
          <button style={{
            width: '32px', height: '32px',  // Larger to match thicker UI bar
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            borderRadius: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
            </svg>
          </button>
          
          {/* Settings Button - EXACT MATCH to PixiJS w-6 h-6 */}
          <button style={{
            width: '32px', height: '32px',  // Larger to match thicker UI bar
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            borderRadius: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Bottom Label - GameCrafter branding - thinner to match PixiJS */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '16px',  // SUPER thin to match PixiJS
        background: 'rgba(17, 24, 39, 1)',
        borderTop: '1px solid rgba(75, 85, 99, 1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',  // Less padding
        zIndex: 11
      }}>
        <span style={{
          color: 'white',
          fontSize: '7px',  // Tiny text to match PixiJS
          fontWeight: 'bold'
        }}>
          Premium Game | Game Crafter
        </span>
      </div>
      
    </div>
  );
};

export default CSSSlotMockup;