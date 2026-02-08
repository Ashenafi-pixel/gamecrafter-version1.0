import React, { useState, useRef, useEffect } from 'react';
import { DirectSpinController } from './DirectSpinController';

// Minimal interface for props
interface SimpleSlotMachineIntegrationProps {
  symbols: string[];
  isEmbedded?: boolean;
  isSpinning?: boolean;
  spinEnabled?: boolean;
  onSpinStart?: () => void;
  onSpinComplete?: () => void;
  frameConfig?: any;
  dimensions?: any;
  rows?: number;
  cols?: number;
  uiPosition?: {
    x: number;
    y: number;
  };
  gridCellsVisible?: boolean; // Controls visibility of cell backgrounds
}

// A simplified version of SlotMachineIntegration with basic symbol display and animation
const SimpleSlotMachineIntegration: React.FC<SimpleSlotMachineIntegrationProps> = ({
  symbols,
  isEmbedded = false,
  isSpinning: externalSpinning,
  spinEnabled = true,
  onSpinStart,
  onSpinComplete,
  frameConfig = {},
  dimensions = {},
  rows = 3,
  cols = 5,
  uiPosition = { x: 0, y: 0 },
  gridCellsVisible = true
}) => {
  // Use basic React state, with option to control from parent
  const [internalSpinning, setInternalSpinning] = useState(false);
  // Use either external or internal spinning state
  const isSpinning = externalSpinning !== undefined ? externalSpinning : internalSpinning;
  const [symbolPositions, setSymbolPositions] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  // Store default symbols as a ref to avoid recreating them on each render
  const defaultSymbolsRef = useRef([
    '/assets/symbols/high_1.png',
    '/assets/symbols/high_2.png',
    '/assets/symbols/high_3.png',
    '/assets/symbols/mid_1.png',
    '/assets/symbols/mid_2.png',
    '/assets/symbols/low_1.png',
    '/assets/symbols/low_2.png',
    '/assets/symbols/low_3.png',
    '/assets/symbols/wild.png',
    '/assets/symbols/scatter.png'
  ]);
  
  // Create a ref for the actual symbols to use to avoid useEffect dependencies
  const symbolsToUseRef = useRef<string[]>(symbols.length > 0 ? [...symbols] : [...defaultSymbolsRef.current]);
  
  // Initialize symbol positions and audio
  useEffect(() => {
    console.log("Symbols received:", symbols);
    
    // Update our ref with new symbols if they change
    symbolsToUseRef.current = symbols.length > 0 ? [...symbols] : [...defaultSymbolsRef.current];
    
    console.log("Actually using symbols:", symbolsToUseRef.current);
    
    // Create an array of positions for all symbols in the grid
    const positions = Array(rows * cols).fill(0).map((_, i) => i % symbolsToUseRef.current.length);
    setSymbolPositions(positions);
    
    // Initialize audio
    spinAudioRef.current = new Audio('/sounds/tick.mp3');
    spinAudioRef.current.volume = 0.5;
    
    return () => {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [rows, cols, symbols.length]);
  
  // Listen for direct spin events
  useEffect(() => {
    const handleDirectSpinStart = (event: Event) => {
      console.log("Received directSpinStart event in SimpleSlotMachineIntegration");
      handleSpin();
    };
    
    document.addEventListener('directSpinStart', handleDirectSpinStart);
    return () => {
      document.removeEventListener('directSpinStart', handleDirectSpinStart);
    };
  }, []);
  
  // Enhanced spin handler with external state support
  const handleSpin = () => {
    // Check if we can spin
    if (isSpinning || !spinEnabled) {
      console.log("Spin blocked - already spinning or disabled");
      return;
    }
    
    // Start spinning - use internal state if external not provided
    if (externalSpinning === undefined) {
      setInternalSpinning(true);
    }
    
    // Notify parent component
    if (onSpinStart) onSpinStart();
    
    // Play sound for immediate feedback
    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.play().catch(() => {});
    }
    
    // Also use the direct controller for coordinated animation
    DirectSpinController.startSpin();
    
    // Log that this component received the spin request
    console.log("SimpleSlotMachineIntegration received spin request");
    
    // Animate symbol positions
    let spinCount = 0;
    const maxSpins = 20 + Math.floor(Math.random() * 10); // Random number of spins
    
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    intervalRef.current = window.setInterval(() => {
      // Shift all symbols down
      setSymbolPositions(prev => {
        const newPositions = [...prev];
        for (let i = 0; i < newPositions.length; i++) {
          newPositions[i] = (newPositions[i] + 1) % symbolsToUseRef.current.length;
        }
        return newPositions;
      });
      
      // Play tick sound occasionally
      if (spinCount % 3 === 0 && spinAudioRef.current) {
        spinAudioRef.current.currentTime = 0;
        spinAudioRef.current.play().catch(() => {});
      }
      
      spinCount++;
      
      // Stop after reaching max spins
      if (spinCount >= maxSpins) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        
        // Stop spinning - use internal state if external not provided
        if (externalSpinning === undefined) {
          setInternalSpinning(false);
        }
        
        // Notify parent component
        if (onSpinComplete) onSpinComplete();
        
        // Also use the direct controller for coordinated stopping
        DirectSpinController.stopSpin();
      }
    }, 100); // Adjust speed as needed
  };
  
  // Calculate grid cell size dynamically based on container size and transparentArea
  const calculateCellDimensions = () => {
    // Get container dimensions
    const containerWidth = dimensions.width || 500;
    const containerHeight = dimensions.height || 400;
    
    // Calculate available space based on transparentArea
    const leftMargin = frameConfig.transparentArea?.left || 0;
    const rightMargin = frameConfig.transparentArea?.right || 0;
    const topMargin = frameConfig.transparentArea?.top || 0;
    const bottomMargin = frameConfig.transparentArea?.bottom || 0;
    
    // Calculate available width and height as percentages
    const availableWidthPercent = 100 - leftMargin - rightMargin;
    const availableHeightPercent = 100 - topMargin - bottomMargin;
    
    // Convert percentages to pixels
    const availableWidth = (containerWidth * availableWidthPercent) / 100;
    const availableHeight = (containerHeight * availableHeightPercent) / 100;
    
    // Calculate cell dimensions to fit available space
    const cellWidth = Math.floor((availableWidth / cols) * 0.98); // 98% to add a little gap
    const cellHeight = Math.floor((availableHeight / rows) * 0.98); // 98% to add a little gap
    
    return { cellWidth, cellHeight };
  };
  
  // Get dynamic cell dimensions - using useMemo to recalculate when deps change
  const { cellWidth, cellHeight } = React.useMemo(() => {
    const dims = calculateCellDimensions();
    console.log("Calculated cell dimensions:", dims, "from transparentArea:", frameConfig.transparentArea);
    return dims;
  }, [
    dimensions.width, 
    dimensions.height, 
    frameConfig.transparentArea?.top,
    frameConfig.transparentArea?.right,
    frameConfig.transparentArea?.bottom,
    frameConfig.transparentArea?.left,
    rows,
    cols
  ]);
  
  // Add debug log for position updates
  React.useEffect(() => {
    console.log("UI Position updated:", uiPosition);
  }, [uiPosition.x, uiPosition.y]);

  return (
    <div 
      ref={containerRef}
      className="relative rounded-lg overflow-visible"
      style={{ 
        height: dimensions.height || 500,
        width: dimensions.width || '100%',
        maxWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '4.375rem', // 70px → 4.375rem // Space for the UI bar
        position: 'relative', // Ensure proper positioning context
        boxSizing: 'border-box', // Ensure padding is included in dimensions
        zIndex: 1 // Base z-index
      }}
      data-ui-position-x={uiPosition.x}
      data-ui-position-y={uiPosition.y}
    >
      {/* Render the slot grid */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{
          // Create a positioning container that respects transparent area margins
          padding: frameConfig.transparentArea ? 
            `${frameConfig.transparentArea.top || 0}% ${frameConfig.transparentArea.right || 0}% ${frameConfig.transparentArea.bottom || 0}% ${frameConfig.transparentArea.left || 0}%` : 
            '0',
          boxSizing: 'border-box'
        }}
      >
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${cellWidth / 16}rem)`,
            gridTemplateRows: `repeat(${rows}, ${cellHeight / 16}rem)`,
            gap: '0.25rem', // 4px → 0.25rem
            backgroundColor: gridCellsVisible ? 'rgba(0, 0, 0, 0.2)' : 'transparent', // Optional grid background
            padding: '0.5rem', // 8px → 0.5rem
            borderRadius: '0.5rem', // 8px → 0.5rem
            boxShadow: gridCellsVisible ? '0 0 1.25rem rgba(0, 0, 0, 0.3)' : 'none', // 20px → 1.25rem
            transform: `translate(${(frameConfig.position?.x || 0) / 16}rem, ${(frameConfig.position?.y || 0) / 16}rem)`,
            zIndex: 10, // Set lower z-index to ensure background shows through
            width: 'auto', // Let the grid size be determined by cells
            height: 'auto', // Let the grid size be determined by cells
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {/* Render symbols */}
          {symbolPositions.map((symbolIndex, cellIndex) => {
            const rowIndex = Math.floor(cellIndex / cols);
            const colIndex = cellIndex % cols;
            
            // Get symbol image URL - safely handle case where symbols array might be empty
            const symbolUrl = symbolsToUseRef.current[symbolIndex % symbolsToUseRef.current.length];
            
            // Add animation classes
            const animationClass = isSpinning 
              ? `animate-spin-${(colIndex + 1) * 100}` // Each column has slightly different timing
              : '';
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="relative flex items-center justify-center rounded-md overflow-hidden"
                style={{
                  width: cellWidth,
                  height: cellHeight,
                  transition: 'transform 0.3s ease',
                  transform: isSpinning ? `translateY(${Math.sin(Date.now() / 100 + colIndex) * 5}px)` : 'none',
                  backgroundColor: gridCellsVisible ? 'rgba(0, 0, 0, 0.2)' : 'transparent', // Optional cell background
                  backdropFilter: gridCellsVisible ? 'blur(1px)' : 'none' // Optional blur effect
                }}
              >
                <img 
                  src={symbolUrl} 
                  alt={`Symbol ${symbolIndex}`}
                  className={`max-w-full max-h-full object-contain ${animationClass}`}
                  style={{
                    width: '80%', // Slightly smaller
                    height: '80%', // Slightly smaller
                    filter: isSpinning ? 'blur(1px)' : 'none',
                    transition: 'all 0.3s ease',
                    animation: isSpinning ? `${0.1 + colIndex * 0.05}s infinite symbol-bounce` : 'none',
                    mixBlendMode: 'multiply', // Help blend with background
                    opacity: 0.9 // Slightly transparent
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Black bar UI at the very bottom of the game background - with enhanced position control */}
      <div 
        className="black-bar-container"
        style={{
          position: 'absolute',
          bottom: `${uiPosition.y / 16}rem`, // Use y position control converted to rem
          left: 0,
          right: 0,
          transform: `translateX(${uiPosition.x / 16}rem)`, // Use x position control converted to rem
          height: '4.375rem', // 70px → 4.375rem
          backgroundColor: 'rgba(0, 0, 0, 0.95)', // Slightly transparent for better blending
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 1.25rem', // 20px → 1.25rem
          borderTop: '0.0625rem solid rgba(255, 255, 255, 0.1)', // 1px → 0.0625rem
          borderRadius: '0 0 0.5rem 0.5rem', // 8px → 0.5rem // Rounded corners at bottom
          zIndex: 99999, // Ultra high z-index to ensure it's always on top
          width: '100%', // Ensure full width
          boxSizing: 'border-box', // Ensure padding doesn't increase width
          boxShadow: '0 -0.25rem 0.75rem rgba(0, 0, 0, 0.2)', // -4px 12px → -0.25rem 0.75rem // Shadow at top for depth
          backdropFilter: 'blur(0.1875rem)' // 3px → 0.1875rem // Subtle blur effect for modern UI
        }}
        data-ui-position-x={uiPosition.x}
        data-ui-position-y={uiPosition.y}
      >
        {/* Left side - Balance */}
        <div>
          <span style={{ 
            fontSize: '0.75rem', // 12px → 0.75rem
            color: '#999',
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.03125rem' // 0.5px → 0.03125rem // Better spacing for readability
          }}>BALANCE</span>
          <span style={{ 
            fontSize: '1.25rem', // 20px → 1.25rem
            color: 'white',
            fontWeight: 'bold',
            textShadow: '0 0.0625rem 0.125rem rgba(0,0,0,0.5)' // 1px 2px → 0.0625rem 0.125rem // Subtle text shadow for depth
          }}>€1,000.00</span>
        </div>
        
        {/* Center area reserved for spin button */}
        <div style={{ width: '5rem' }}></div> {/* 80px → 5rem */}
        
        {/* Right side - Bet controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}> {/* 12px → 0.75rem */}
          <button
            style={{
              width: '2.25rem', // 36px → 2.25rem
              height: '2.25rem', // 36px → 2.25rem
              borderRadius: '50%',
              backgroundColor: '#444',
              border: '0.0625rem solid rgba(255,255,255,0.1)', // 1px → 0.0625rem
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.375rem', // 22px → 1.375rem
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,0.3)', // 2px 4px → 0.125rem 0.25rem // Add shadow for depth
              transition: 'all 0.15s ease' // Smooth transition for hover/active states
            }}
          >−</button>
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: '0.75rem', // 12px → 0.75rem
              color: '#999',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.03125rem' // 0.5px → 0.03125rem // Better spacing for readability
            }}>TOTAL BET</span>
            <span style={{
              fontSize: '1.25rem', // 20px → 1.25rem
              color: 'white',
              fontWeight: 'bold',
              textShadow: '0 0.0625rem 0.125rem rgba(0,0,0,0.5)' // 1px 2px → 0.0625rem 0.125rem // Subtle text shadow for depth
            }}>€5.00</span>
          </div>
          <button
            style={{
              width: '2.25rem', // 36px → 2.25rem
              height: '2.25rem', // 36px → 2.25rem
              borderRadius: '50%',
              backgroundColor: '#444',
              border: '0.0625rem solid rgba(255,255,255,0.1)', // 1px → 0.0625rem
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.375rem', // 22px → 1.375rem
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,0.3)', // 2px 4px → 0.125rem 0.25rem // Add shadow for depth
              transition: 'all 0.15s ease' // Smooth transition for hover/active states
            }}
          >+</button>
        </div>
      </div>
      
      {/* Spin button centered on top of the black bar - with enhanced positioning */}
      <div 
        className="absolute left-0 right-0 flex justify-center spin-button-container" 
        style={{ 
          bottom: `calc(${uiPosition.y / 16}rem + 2.1875rem)`, // uiPosition.y in rem + 35px as 2.1875rem // Position above UI bar with offset
          transform: `translateX(${uiPosition.x / 16}rem)`, // uiPosition.x in rem // Horizontal positioning
          zIndex: 100000, // Ultra high z-index
          filter: 'drop-shadow(0 0.25rem 0.5rem rgba(0,0,0,0.4))' // 4px 8px → 0.25rem 0.5rem // Drop shadow for depth
        }}
        data-ui-spin-position-x={uiPosition.x}
        data-ui-spin-position-y={uiPosition.y}
      >
        <button 
          onClick={handleSpin}
          disabled={isSpinning || !spinEnabled}
          className={`rounded-full flex items-center justify-center transition-all
            ${isSpinning 
              ? 'bg-gray-500 cursor-not-allowed' 
              : spinEnabled 
                ? 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95' 
                : 'bg-gray-500 cursor-not-allowed opacity-70'}`}
          style={{
            width: '5rem', // 80px → 5rem
            height: '5rem', // 80px → 5rem
            boxShadow: '0 0 1.25rem rgba(0, 0, 0, 0.5), inset 0 0 0.625rem rgba(255, 255, 255, 0.2)', // 20px 10px → 1.25rem 0.625rem
            border: '0.25rem solid rgba(255, 255, 255, 0.2)', // 4px → 0.25rem
            transition: 'all 0.2s ease-in-out',
            transform: isSpinning ? 'scale(0.95)' : 'scale(1)'
          }}
        >
          <svg 
            viewBox="0 0 24 24"
            width="2rem" /* 32px → 2rem */
            height="2rem" /* 32px → 2rem */ 
            fill="white"
            style={{
              filter: 'drop-shadow(0 0.0625rem 0.125rem rgba(0,0,0,0.3))' // 1px 2px → 0.0625rem 0.125rem
            }}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes symbol-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(0.1875rem); } /* 3px → 0.1875rem */
        }
      `}</style>
    </div>
  );
};

export default SimpleSlotMachineIntegration;