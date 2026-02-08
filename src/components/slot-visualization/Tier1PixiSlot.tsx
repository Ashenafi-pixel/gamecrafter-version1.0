import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePixiApp } from '../../hooks/usePixiApp';
import { useGameStore } from '../../store';
import PurePixiUI from '../visual-journey/slot-animation/PurePixiUI';

interface Tier1PixiSlotProps {
  width?: number;
  height?: number;
  className?: string;
  /** Handler for spin button click */
  onSpin?: () => void;
  /** Custom UI button images */
  customButtons?: {
    spinButton?: string;
    autoplayButton?: string;
    menuButton?: string;
    soundButton?: string;
    settingsButton?: string;
  };
}

/**
 * Tier 1 Professional PIXI.js Slot Component
 * Single instance, never destroyed, updates only
 */
export const Tier1PixiSlot: React.FC<Tier1PixiSlotProps> = ({
  width,
  height,
  className = '',
  onSpin,
  customButtons
}) => {
  // Use container dimensions if width/height not provided
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 1200, height: 800 });
  
  // Observe container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    updateDimensions(); // Initial measurement
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Use provided dimensions or container dimensions
  const actualWidth = width || containerDimensions.width;
  const actualHeight = height || containerDimensions.height;
  // Get configuration from store with proper subscription
  const reels = useGameStore(state => state.config?.reels?.layout?.reels || 5);
  const rows = useGameStore(state => state.config?.reels?.layout?.rows || 3);
  const config = useGameStore(state => state.config);
  
  // Process symbols from config - MUST be defined before any useEffect that uses it
  const symbols = useMemo(() => {
    const symbolList = [];
    
    console.log('🔍 [Tier1PixiSlot] Looking for symbols in config:', {
      generatedSymbols: config?.theme?.generated?.symbols,
      uploadedSymbols: config?.symbols?.uploaded
    });
    
    // Add generated symbols
    if (config?.theme?.generated?.symbols) {
      console.log('✅ Found generated symbols:', config.theme.generated.symbols.length);
      config.theme.generated.symbols.forEach((url, index) => {
        // Try to determine symbol type from URL or position
        let symbolType: string;
        const lowerUrl = url.toLowerCase();
        
        if (lowerUrl.includes('wild')) {
          symbolType = 'wild';
        } else if (lowerUrl.includes('scatter')) {
          symbolType = 'scatter';
        } else if (lowerUrl.includes('high') || index < 3) {
          symbolType = 'high';
        } else if (lowerUrl.includes('medium') || index < 5) {
          symbolType = 'medium';
        } else {
          symbolType = 'low';
        }
        
        symbolList.push({
          id: `generated-${index}`,
          url,
          type: symbolType
        });
      });
    }
    
    // Add uploaded symbols if no generated ones
    if (symbolList.length === 0 && config?.symbols?.uploaded) {
      // Found uploaded symbols
      Object.entries(config.symbols.uploaded).forEach(([type, urls]) => {
        if (Array.isArray(urls)) {
          urls.forEach((url, index) => {
            symbolList.push({
              id: `${type}-${index}`,
              url,
              type: type as any
            });
          });
        }
      });
    }
    
    // Don't add default symbols - let the grid show numbered placeholders instead
    if (symbolList.length === 0) {
      // No symbols configured - will show numbered placeholders
    }
    
    // Total symbols ready
    console.log('📊 [Tier1PixiSlot] Total symbols processed:', symbolList.length, symbolList);
    return symbolList;
  }, [config?.theme?.generated?.symbols, config?.symbols?.uploaded]);
  
  // Initialize PIXI app with hook
  const {
    canvasRef,
    isReady,
    updateGrid,
    updateSymbols,
    setBackground,
    setFrame,
    playWinAnimation,
    spinReels,
    setGridAdjustments,
    setShowSymbolBackgrounds
  } = usePixiApp({
    width: actualWidth,
    height: actualHeight,
    backgroundColor: 0x0a0a0a,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2)
  });
  
  // State for spin animation
  const [isSpinning, setIsSpinning] = useState(false);
  
  // State for pending grid update
  const [pendingGrid, setPendingGrid] = useState<{reels: number, rows: number} | null>(null);
  
  // Update grid when reels/rows change
  useEffect(() => {
    if (isReady && updateGrid) {
      console.log(`🎰 [Tier1PixiSlot] Grid configuration changed: ${reels}x${rows}`);
      
      // Only update grid if we have symbols or if it's not a 5x3 configuration
      // For 5x3, we need symbols to create the professional slot machine
      if (symbols.length > 0 || (reels !== 5 || rows !== 3)) {
        updateGrid(reels, rows, true).then(() => {
          console.log(`✅ Grid updated successfully to ${reels}x${rows}`);
          
          // Force symbol update after grid change
          if (symbols.length > 0) {
            console.log('🔄 Reapplying symbols after grid change');
            updateSymbols(symbols).catch(error => {
              console.error('Failed to update symbols after grid change:', error);
            });
          }
        }).catch(error => {
          console.error('Failed to update grid:', error);
        });
      } else {
        console.log(`⚠️ Delaying grid update for ${reels}x${rows} until symbols are available`);
        // Store the pending grid configuration to apply when symbols are ready
        setPendingGrid({ reels, rows });
      }
    }
  }, [reels, rows, isReady, updateGrid, symbols, updateSymbols]);
  
  // Initialize scene when PIXI is ready with initial symbols
  useEffect(() => {
    if (!isReady) return;
    
    // Initial symbol load only
    if (symbols.length > 0) {
      console.log('🎨 [Tier1PixiSlot] Initial symbol load');
      updateSymbols(symbols).catch(console.error);
    }
  }, [isReady]); // Only run once when PIXI is ready
  
  // Update symbols when they change
  useEffect(() => {
    if (!isReady) return;
    
    if (symbols.length === 0) {
      console.log('⚠️ [Tier1PixiSlot] No symbols available, skipping update');
      return;
    }
    
    console.log('🔄 [Tier1PixiSlot] Symbols changed, updating PIXI scene with', symbols.length, 'symbols');
    updateSymbols(symbols).catch(console.error);
    
    // Check if we have a pending grid update
    if (pendingGrid && updateGrid) {
      console.log(`📊 Applying pending grid update: ${pendingGrid.reels}x${pendingGrid.rows}`);
      updateGrid(pendingGrid.reels, pendingGrid.rows, true).then(() => {
        console.log(`✅ Pending grid update completed`);
        setPendingGrid(null);
      }).catch(error => {
        console.error('Failed to apply pending grid update:', error);
      });
    }
  }, [symbols, isReady, updateSymbols, pendingGrid, updateGrid]);
  
  // Update background
  useEffect(() => {
    if (!isReady) return;
    
    const backgroundUrl = config?.background?.backgroundImage || config?.backgroundImage || null;
    // Background updated
    setBackground(backgroundUrl).catch(console.error);
  }, [config?.background?.backgroundImage, config?.backgroundImage, isReady, setBackground]);
  
  // Update frame with adjustments
  useEffect(() => {
    if (!isReady) return;
    
    const frameUrl = config?.frame || null;
    const frameAdjustments = {
      scale: config?.frameScale || 100,
      position: config?.framePosition || { x: 0, y: 0 },
      stretch: config?.frameStretch || { x: 100, y: 100 }
    };
    
    // Frame updated
    setFrame(frameUrl, frameAdjustments).catch(console.error);
  }, [config?.frame, config?.frameScale, config?.framePosition, config?.frameStretch, isReady, setFrame]);
  
  // Update grid adjustments (position, scale, and stretch)
  useEffect(() => {
    if (!isReady) return;
    
    const gridAdjustments = {
      position: config?.gridPosition || { x: 0, y: 0 },
      scale: config?.gridScale || 100,
      stretch: config?.gridStretch || { x: 100, y: 100 }
    };
    
    // Grid adjustments updated
    setGridAdjustments(gridAdjustments);
  }, [config?.gridPosition, config?.gridScale, config?.gridStretch, isReady, setGridAdjustments]);
  
  // Update symbol backgrounds visibility
  useEffect(() => {
    if (!isReady) return;
    
    const showBackgrounds = config?.showSymbolBackgrounds !== false;
    // Symbol backgrounds updated
    setShowSymbolBackgrounds(showBackgrounds);
  }, [config?.showSymbolBackgrounds, isReady, setShowSymbolBackgrounds]);
  
  // No demo win animation - removed to prevent symbols "popping up like a moon"
  
  const handleSpin = async () => {
    if (isSpinning) return;
    
    console.log('🎰 Spin button clicked in Tier1PixiSlot');
    setIsSpinning(true);
    
    try {
      // Trigger PIXI reel spinning animation
      await spinReels();
      // Also call the parent onSpin if provided
      if (onSpin) {
        onSpin();
      }
    } finally {
      // Reset spinning state after animation
      setTimeout(() => setIsSpinning(false), 2000);
    }
  };
  
  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {/* Slot Machine Canvas - Full size */}
      <div 
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          backgroundColor: '#0a0a0a'
        }}
      />
      
      {/* Game UI Overlay */}
      <PurePixiUI 
        onSpin={handleSpin}
        onAutoplay={() => console.log('Autoplay clicked')}
        onMenu={() => console.log('Menu clicked')}
        onSound={() => console.log('Sound clicked')}
        onSettings={() => console.log('Settings clicked')}
        onInfo={() => console.log('Info clicked')}
        balance={1000}
        bet={1.00}
        win={0.00}
        isSpinning={isSpinning}
        spinButtonImage={customButtons?.spinButton}
        autoplayButtonImage={customButtons?.autoplayButton}
        menuButtonImage={customButtons?.menuButton}
        soundButtonImage={customButtons?.soundButton}
        settingsButtonImage={customButtons?.settingsButton}
      />
    </div>
  );
};