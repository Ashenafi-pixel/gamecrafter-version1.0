import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lazy } from 'react';
import { gsap } from 'gsap';
// Remove GlowFilter import to see if it's causing the hook issue
// import { registerGlowFilter } from './GlowFilter';
import BlackBarUI from './BlackBarUI'; // Import the BlackBarUI component for consistent UI
import { DirectSpinController } from './DirectSpinController'; // Only import the controller, not the hook 
import { ExtractedSymbol } from './slotTypes'; // Import from shared types file

// Import the two main components for the slot machine using lazy loading
const EndlessReelPreview = lazy(() => import('./EndlessReelPreview'));
const FinalSymbolGrid = lazy(() => import('../steps/FinalSymbolGrid'));

// Interface for component props
interface SlotMachineIntegrationProps {
  symbols: string[];
  isEmbedded?: boolean;
  onSpinStart?: () => void;
  onSpinComplete?: () => void;
  spinEnabled?: boolean;
  frameConfig?: {
    transparentArea?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    position?: {
      x?: number;
      y?: number;
    };
    scale?: number;
    stretch?: {
      x?: number;
      y?: number;
    };
  };
  dimensions?: {
    width?: number;
    height?: number;
  };
  rows?: number;
  cols?: number;
}

/**
 * SlotMachineIntegration - A component that integrates the spinning animation (EndlessReelPreview)
 * and final static display (FinalSymbolGrid) with smooth transitions between them.
 * This follows a professional slot machine architecture where the spinning reels and 
 * final display are separate components to ensure optimal performance and visual quality.
 */
const SlotMachineIntegration: React.FC<SlotMachineIntegrationProps> = ({
  symbols,
  isEmbedded = false,
  onSpinStart,
  onSpinComplete,
  spinEnabled = true,
  frameConfig = {},
  dimensions = {},
  rows = 3,
  cols = 5
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasBonus, setHasBonus] = useState(false);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // State to track which component is visible
  const [showReelAnimation, setShowReelAnimation] = useState(false);
  const [showFinalGrid, setShowFinalGrid] = useState(true);
  
  // State to store extracted symbols after spin completes
  const [extractedSymbols, setExtractedSymbols] = useState<ExtractedSymbol[]>([]);
  
  // Store persistent container dimensions to avoid reading from DOM during render
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  // COMPLETELY REMOVED debug state functionality that was causing infinite loops
  
  // Initialize audio - removed PIXI filters registration
  useEffect(() => {
    // Commenting out registerGlowFilter to see if it's causing the hook issue
    // registerGlowFilter();
    
    spinAudioRef.current = new Audio('/sounds/tick.mp3');
    spinAudioRef.current.volume = 0.5;
    
    winAudioRef.current = new Audio('/sounds/select.mp3');
    winAudioRef.current.volume = 0.7;
    
    return () => {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current = null;
      }
      if (winAudioRef.current) {
        winAudioRef.current.pause();
        winAudioRef.current = null;
      }
    };
  }, []);
  
  // Setup container dimensions and ResizeObserver - once on mount
  useEffect(() => {
    if (containerRef.current) {
      // Set initial dimensions
      const width = containerRef.current.clientWidth || 0;
      const height = containerRef.current.clientHeight || 0;
      
      // Store these dimensions in state for use in render
      setContainerDimensions({ width, height });
      
      console.log("SlotMachineIntegration - Initial dimensions set:", { width, height });
      
      // Setup ResizeObserver to update dimensions when container resizes
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          
          // Update dimensions state (safely) when size changes
          setContainerDimensions(prev => {
            // Only update if different to avoid unnecessary renders
            if (prev.width !== width || prev.height !== height) {
              console.log("Container dimensions updated:", { width, height });
              return { width, height };
            }
            return prev;
          });
        }
      });
      
      resizeObserver.observe(containerRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []); // Empty dependency array - run only once at mount
  
  // Use a dedicated effect for monitoring isSpinning prop directly
  const isSpinningRef = useRef(false);
  const lastTimeStampRef = useRef(0);
  
  // Effect to handle global window variables for direct communication
  useEffect(() => {
    // Check for global spin command every 100ms
    const interval = setInterval(() => {
      try {
        // @ts-ignore - Check if the global spin flag is set
        if (window.__SLOT_MACHINE_SPINNING === true) {
          // @ts-ignore - Get the timestamp to avoid duplicate spins
          const timestamp = window.__SPIN_TIMESTAMP || 0;
          
          // Only process if this is a new spin command
          if (timestamp > lastTimeStampRef.current && !isSpinning) {
            console.log("Global spin command detected!");
            lastTimeStampRef.current = timestamp;
            
            // Force a spin animation
            setIsSpinning(true);
            setShowReelAnimation(true);
            setShowFinalGrid(false);
            
            // Play sound
            if (spinAudioRef.current) {
              spinAudioRef.current.currentTime = 0;
              spinAudioRef.current.play().catch(err => console.log("Sound play error:", err));
            }
            
            // Notify parent
            if (onSpinStart) {
              onSpinStart();
            }
            
            // Reset the global flag
            // @ts-ignore
            window.__SLOT_MACHINE_SPINNING = false;
          }
        }
      } catch (e) {
        console.log("Error checking global spin flag:", e);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isSpinning, onSpinStart]);
  
  // Simplified effect to prevent re-rendering cascades
  useEffect(() => {
    // Create a local timestamp reference (no useRef hook outside component)
    let lastSpinTime = 0;
    
    // Only process if this is a new spin state
    if (isSpinning && !isSpinningRef.current) {
      // Mark as handled immediately to prevent duplicate processing
      isSpinningRef.current = true;
      
      // Generate a unique timestamp for this spin
      const spinTimestamp = Date.now();
      
      // Skip if we've already processed this timestamp (debounce)
      if (spinTimestamp - lastSpinTime < 500) {
        return;
      }
      
      // Update our timestamp reference
      lastSpinTime = spinTimestamp;
      
      // Update UI state once
      setIsSpinning(true);
      setShowReelAnimation(true);
      setShowFinalGrid(false);
      
      // Play sound (simple, direct approach)
      try {
        if (spinAudioRef.current) {
          spinAudioRef.current.currentTime = 0;
          spinAudioRef.current.play().catch(() => {});
        }
      } catch (e) {
        // Silent catch
      }
      
      // Single notification to parent
      if (onSpinStart) {
        onSpinStart();
      }
      
      // Simple DOM updates for immediate visual feedback
      try {
        const reelPreview = document.querySelector('[data-component="EndlessReelPreview"]');
        if (reelPreview instanceof HTMLElement) {
          reelPreview.style.display = 'block';
          reelPreview.style.opacity = '1';
          reelPreview.style.zIndex = '50';
        }
        
        const finalGrid = document.querySelector('[data-component="FinalSymbolGrid"]');
        if (finalGrid instanceof HTMLElement) {
          finalGrid.style.opacity = '0';
        }
      } catch (e) {
        // Silent catch for DOM errors
      }
    } else if (!isSpinning && isSpinningRef.current) {
      // Reset the ref when spinning stops
      isSpinningRef.current = false;
    }
  }, [isSpinning]);
  
  // Handle spin completion from EndlessReelPreview
  const handleSpinComplete = (symbols: ExtractedSymbol[]) => {
    // Store the extracted symbols without logging
    setExtractedSymbols(symbols);
    
    // Simple transition sequence with minimal delays:
    // 1. Make final grid visible
    // 2. Then hide spinning animation
    // 3. Update spinning state and trigger game logic
    
    // First step - show final symbols
    setShowFinalGrid(true);
    
    // Second step after a short delay
    setTimeout(() => {
      // Update all state in one batch
      setIsSpinning(false);
      setShowReelAnimation(false);
      
      // Process win logic
      processWinLogic();
      
      // Notify parent
      if (onSpinComplete) {
        onSpinComplete();
      }
    }, 250);
  };
  
  // Process win logic after spin completes
  const processWinLogic = () => {
    // Randomly decide if this is a winning spin (40% chance)
    const isWin = Math.random() < 0.4;
    
    if (isWin) {
      // Generate a random win amount between 1 and 100
      const amount = Math.floor(Math.random() * 100) + 1;
      setWinAmount(amount);
      
      // Play win sound
      if (winAudioRef.current) {
        winAudioRef.current.currentTime = 0;
        winAudioRef.current.play();
      }
      
      // Hide win amount after a delay
      setTimeout(() => {
        setWinAmount(null);
      }, 3000);
      
      // Randomly decide if this is a bonus win (20% chance)
      const isBonus = Math.random() < 0.2;
      if (isBonus) {
        setHasBonus(true);
        
        // Hide bonus notification after a delay
        setTimeout(() => {
          setHasBonus(false);
        }, 5000);
      }
    }
  };
  
  // ULTRA RELIABLE SPIN HANDLER - uses every possible method to ensure spin works
  const handleSpin = () => {
    // Safety check 
    if (isSpinning || !spinEnabled) {
      console.log("Spin blocked - already spinning or disabled");
      return;
    }
    
    console.log("✨✨✨ SPIN INITIATED - SlotMachineIntegration with maximum reliability");
    
    try {
      // 1. Reset win state
      setWinAmount(null);
      setHasBonus(false);
      
      // 2. Critical state updates - do this FIRST for faster visual feedback
      setIsSpinning(true);
      setShowReelAnimation(true);
      setShowFinalGrid(false);
      
      // 3. MOST IMPORTANTLY: Use the Direct Controller to broadcast the spin command
      // This will trigger all components that listen for the directSpinStart event
      try {
        console.log("Calling DirectSpinController.startSpin()...");
        const result = DirectSpinController.startSpin();
        console.log("DirectSpinController result:", result);
      } catch (controllerError) {
        console.error("Error in DirectSpinController:", controllerError);
        
        // Fallback to manual custom event
        try {
          console.log("Fallback: Creating custom event manually");
          const spinEvent = new CustomEvent('directSpinStart', { 
            detail: { timestamp: Date.now() } 
          });
          document.dispatchEvent(spinEvent);
        } catch (eventError) {
          console.error("Error creating manual event:", eventError);
        }
      }
      
      // 4. Set global variables as another fallback
      try {
        // @ts-ignore
        window.__SLOT_MACHINE_SPINNING = true;
        // @ts-ignore
        window.__SPIN_TIMESTAMP = Date.now();
        console.log("Set global spin variables");
      } catch (globalVarError) {
        console.error("Error setting global variables:", globalVarError);
      }
      
      // 5. Play sound immediately for user feedback
      try {
        if (spinAudioRef.current) {
          spinAudioRef.current.currentTime = 0;
          spinAudioRef.current.play().catch(e => console.warn("Sound play error:", e));
        }
      } catch (soundError) {
        console.warn("Error playing sound:", soundError);
      }
      
      // 6. Visual shake feedback
      if (pixiRef.current) {
        gsap.to(pixiRef.current, {
          x: '+=3',
          duration: 0.05,
          repeat: 5,
          yoyo: true,
          ease: "power1.inOut",
          onComplete: () => {
            gsap.to(pixiRef.current, {
              x: 0,
              duration: 0.2
            });
          }
        });
      }
      
      // 7. Direct DOM manipulation to force animation visibility
      try {
        // Find the animation component directly
        const reelPreview = document.querySelector('[data-component="EndlessReelPreview"]');
        if (reelPreview && reelPreview instanceof HTMLElement) {
          console.log("Found EndlessReelPreview, forcing visibility");
          reelPreview.style.display = 'block';
          reelPreview.style.opacity = '1';
          reelPreview.style.zIndex = '50';
        }
        
        // Hide final grid
        const finalGrid = document.querySelector('[data-component="FinalSymbolGrid"]');
        if (finalGrid && finalGrid instanceof HTMLElement) {
          console.log("Found FinalSymbolGrid, hiding it");
          finalGrid.style.opacity = '0';
        }
      } catch (domError) {
        console.error("Error with DOM manipulation:", domError);
      }
      
      // 8. Notify parent component
      if (onSpinStart) {
        onSpinStart();
      }
      
      console.log("Spin initiation complete!");
    } catch (err) {
      console.error("Critical error in spin handler:", err);
      
      // Last resort emergency attempt
      try {
        // Try the simplest approach possible
        setIsSpinning(true);
        DirectSpinController.startSpin();
        
        // Force a visual update
        if (containerRef.current) {
          const display = containerRef.current.style.display;
          containerRef.current.style.display = 'none';
          containerRef.current.offsetHeight; // Force reflow
          containerRef.current.style.display = display;
        }
      } catch (emergencyError) {
        console.error("Emergency spin attempt failed:", emergencyError);
      }
    }
    
    // Set a safety timeout to reset spinning state if animation doesn't complete
    setTimeout(() => {
      if (isSpinning) {
        console.log("SAFETY: Spin didn't complete in time, forcing completion");
        
        // Stop all active spin animation
        DirectSpinController.stopSpin();
        setIsSpinning(false);
        setShowReelAnimation(false);
        setShowFinalGrid(true);
        
        // Clear global variables
        try {
          // @ts-ignore
          window.__SLOT_MACHINE_SPINNING = false;
        } catch (e) {
          // Ignore error
        }
      }
    }, 6000); // 6-second safety timeout
  };
  
  // Generate a message based on win amount
  const getWinMessage = (amount: number): string => {
    if (amount >= 80) return "MEGA WIN!";
    if (amount >= 50) return "BIG WIN!";
    if (amount >= 20) return "GREAT WIN!";
    return "WIN!";
  };
  
  return (
    <div 
      ref={containerRef}
      className={`relative ${isEmbedded ? 'h-full w-full' : 'h-80 w-full max-w-2xl mx-auto rounded-lg shadow-lg'}`}
      style={{ 
        background: isEmbedded ? 'transparent' : 'linear-gradient(to bottom, #1a1a2e, #16213e)',
        border: isEmbedded ? 'none' : '2px solid rgba(255, 255, 255, 0.1)',
        zIndex: 10,
        pointerEvents: 'auto',
        margin: '0',
        padding: '0',
        position: 'relative',
        overflow: 'visible', // Allow content to extend beyond boundaries
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* PIXI Slot Machine Container */}
      <div ref={pixiRef} className="relative flex-grow w-full pointer-events-auto" style={{ overflow: 'visible' }}>
        
        {/* EndlessReelPreview for spin animation - forced visibility when spinning */}
        <div 
          data-component="EndlessReelPreview" 
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'absolute',
            inset: 0,
            opacity: showReelAnimation ? 1 : 0,
            display: showReelAnimation ? 'block' : 'none',
            zIndex: showReelAnimation ? 50 : -1,
            transition: 'opacity 0.2s ease'
          }}
        >
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          }>
            <EndlessReelPreview
              symbols={symbols}
              isEmbedded={true}
              isSpinning={isSpinning}
              onSpinStart={() => {
                console.log("Spin started!");
              }}
              onSpinComplete={handleSpinComplete}
              frameConfig={frameConfig}
              keepSymbolsVisible={true}
              rows={rows}
              cols={cols}
              dimensions={dimensions.width && dimensions.height ? dimensions : containerDimensions}
            />
          </Suspense>
        </div>
        
        {/* FinalSymbolGrid for static display - simplified visibility control */}
        <div 
          data-component="FinalSymbolGrid" 
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            inset: 0,
            opacity: showFinalGrid ? 1 : 0,
            display: showFinalGrid ? 'block' : 'none',
            zIndex: showFinalGrid ? 10 : -1,
            transition: 'opacity 0.3s ease'
          }}
        >
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          }>
            <FinalSymbolGrid
              symbols={extractedSymbols.length > 0 ? extractedSymbols : undefined}
              defaultSymbols={symbols}
              frameConfig={frameConfig}
              rows={rows}
              cols={cols}
              dimensions={dimensions.width && dimensions.height ? dimensions : containerDimensions}
              hasIdleAnimation={false} // Disabled idle animations as requested
            />
          </Suspense>
        </div>
        
        {/* Core slot machine controls - exposed but visually hidden */}
        <div style={{ 
          position: 'absolute', 
          bottom: '100px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          opacity: 0.001, // Nearly invisible but present in DOM
          pointerEvents: 'auto',
          width: '80px',
          height: '80px',
          zIndex: 9999
        }}>
          {/* This element is essential for tracking spin state changes */}
          <div data-spinning={isSpinning ? 'true' : 'false'} data-show-animation={showReelAnimation ? 'true' : 'false'} />
          
          {/* Exposed internal spin button that can be triggered directly */}
          <button 
            id="internal-spin-btn" 
            onClick={handleSpin}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: 0,
              borderRadius: '50%'
            }}
            aria-label="Spin reels"
          />
          
          {/* Win tracking */}
          {winAmount !== null && (
            <span id="win-amount-tracker" data-amount={winAmount} />
          )}
        </div>
        
        {/* Win celebration overlay */}
        <AnimatePresence>
          {winAmount !== null && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              <div className="flex flex-col items-center">
                <motion.div 
                  className="text-4xl sm:text-5xl font-bold text-center p-6 rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,204,0,0.9), rgba(255,140,0,0.9))',
                    color: 'white',
                    textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                    boxShadow: '0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.4)'
                  }}
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.4)',
                      '0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,215,0,0.6)',
                      '0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.4)'
                    ]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    repeatType: "mirror" 
                  }}
                >
                  {getWinMessage(winAmount)}
                  <div className="text-5xl sm:text-6xl font-bold mt-2">
                    €{winAmount.toFixed(2)}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Bonus feature notification */}
        <AnimatePresence>
          {hasBonus && (
            <motion.div
              className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none z-20"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              <motion.div 
                className="bg-purple-600 text-white px-8 py-3 rounded-full text-lg sm:text-xl font-bold shadow-lg"
                style={{
                  boxShadow: '0 0 20px rgba(147, 51, 234, 0.7)',
                  border: '2px solid rgba(255, 255, 255, 0.7)'
                }}
                animate={{ 
                  y: [0, -5, 0],
                  boxShadow: [
                    '0 0 20px rgba(147, 51, 234, 0.7)',
                    '0 0 30px rgba(147, 51, 234, 0.9)',
                    '0 0 20px rgba(147, 51, 234, 0.7)'
                  ]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  repeatType: "mirror" 
                }}
              >
                BONUS FEATURE UNLOCKED!
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SlotMachineIntegration;