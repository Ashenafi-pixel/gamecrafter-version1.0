import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { useGameStore } from '../../store';

// Canvas dimensions
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

interface PremiumSlotMachineProps {
  /** Initial balance amount */
  initialBalance?: number;
  /** Callback when a win occurs */
  onWin?: (amount: number, type: string) => void;
  /** Label text for the Spin button */
  spinButtonLabel?: string;
  /** Initial bet amount */
  initialBet?: number;
  /** Minimum bet amount */
  minBet?: number;
  /** Maximum bet amount */
  maxBet?: number;
  /** Bet increment step */
  betStep?: number;
  /** Orientation of the slot machine (landscape or portrait) */
  orientation?: 'landscape' | 'portrait';
  /** Optional canvas width (pixels) */
  width?: number;
  /** Optional canvas height (pixels) */
  height?: number;
  /** Optional debug mode */
  debug?: boolean;
}

// Animation keyframes for UI animations
const animations = `
@keyframes value-update {
  0% {
    opacity: 0.6;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-value-update {
  animation: value-update 0.3s ease-out;
}
`;

// Add animation styles once
const addAnimationStyles = () => {
  if (typeof document !== 'undefined') {
    // Check if we've already added these styles
    const existingStyles = document.getElementById('slot-animations-style');
    if (!existingStyles) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'slot-animations-style';
      styleSheet.type = 'text/css';
      styleSheet.innerText = animations;
      document.head.appendChild(styleSheet);
    }
  }
};

const PremiumSlotMachine: React.FC<PremiumSlotMachineProps> = ({
  initialBalance = 1000,
  onWin,
  spinButtonLabel = 'SPIN',
  initialBet = 0.75,
  minBet = 0.20,
  maxBet = 100.00,
  betStep = 0.25,
  orientation = 'landscape',
  width: widthProp,
  height: heightProp,
  debug = false,
}) => {
  // State variables for UI interaction
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [canvasSize, setCanvasSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  
  // Game state
  const [balance, setBalance] = useState<number>(initialBalance);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(initialBet);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Preload audio elements
  const spinAudio = useRef<HTMLAudioElement>(typeof Audio !== 'undefined' ? new Audio('/sounds/tick.mp3') : null);
  const buttonAudio = useRef<HTMLAudioElement>(typeof Audio !== 'undefined' ? new Audio('/sounds/select.mp3') : null);
  
  // Value update tracking for animations
  const [updateBalance, setUpdateBalance] = useState<boolean>(false);
  const [updateWin, setUpdateWin] = useState<boolean>(false);
  
  // References for canvas
  const pixiContainerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  
  // Function to draw a plain background - define first to avoid circular dependencies
  const drawBackground = useCallback(() => {
    if (!appRef.current) return;
    
    // Clear stage
    while (appRef.current.stage.children.length > 0) {
      appRef.current.stage.removeChildAt(0);
    }
    
    // Create a background graphic
    const background = new PIXI.Graphics();
    background.beginFill(0x0f172a); // Dark blue background (#0f172a)
    background.drawRect(0, 0, appRef.current.renderer.width, appRef.current.renderer.height);
    background.endFill();
    appRef.current.stage.addChild(background);
  }, []);
  
  // Helper function to resize the canvas
  const resizeCanvas = useCallback(() => {
    if (!appRef.current || !pixiContainerRef.current) return;
    
    // Update canvas size
    const canvasEl = appRef.current.view as HTMLCanvasElement;
    canvasEl.style.width = '100%';
    canvasEl.style.height = '100%';
    
    // Redraw background to fill the canvas
    drawBackground();
  }, [drawBackground]);
  
  // Fullscreen toggle function
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Enter fullscreen mode
      const gameContainer = document.getElementById('slot-game-container');
      if (gameContainer && gameContainer.requestFullscreen) {
        // Save original dimensions before going fullscreen
        setOriginalDimensions({
          width: canvasSize.width,
          height: canvasSize.height
        });
        
        gameContainer.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
            
            // Apply fullscreen changes
            setTimeout(() => {
              const screenWidth = window.innerWidth;
              const screenHeight = window.innerHeight;
              setCanvasSize({ width: screenWidth, height: screenHeight });
              
              // Resize PIXI app if it exists
              if (appRef.current) {
                appRef.current.renderer.resize(screenWidth, screenHeight);
                resizeCanvas();
              }
            }, 100);
          })
          .catch(() => {
            // Handle error silently
          });
      }
    } else if (document.exitFullscreen) {
      // Exit fullscreen mode
      document.exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          
          // Apply changes after a short delay
          setTimeout(() => {
            setCanvasSize({
              width: originalDimensions.width,
              height: originalDimensions.height
            });
            
            // Resize PIXI app if it exists
            if (appRef.current) {
              appRef.current.renderer.resize(
                originalDimensions.width,
                originalDimensions.height
              );
              resizeCanvas();
            }
          }, 100);
        })
        .catch(() => {
          // Handle error silently
        });
    }
  }, [canvasSize.width, canvasSize.height, originalDimensions.width, originalDimensions.height, resizeCanvas]);

  // Initialize PIXI application
  useEffect(() => {
    // Add animation styles once
    addAnimationStyles();
    
    if (!pixiContainerRef.current) return;
    
    // Set initial canvas size
    const width = widthProp || DEFAULT_WIDTH;
    const height = heightProp || DEFAULT_HEIGHT;
    setCanvasSize({ width, height });
    
    // Only create PIXI app if it doesn't exist
    if (!appRef.current) {
      // Create PIXI Application with a dark background
      const app = new PIXI.Application({
        width,
        height,
        backgroundColor: 0x0f172a, // Dark blue background (#0f172a)
        resolution: window.devicePixelRatio || 1,
        antialias: true,
      });
      
      // Clear container and add the canvas
      pixiContainerRef.current.innerHTML = '';
      pixiContainerRef.current.appendChild(app.view as unknown as Node);
      
      // Set canvas to scale to its container
      const canvasEl = app.view as HTMLCanvasElement;
      canvasEl.style.width = '100%';
      canvasEl.style.height = '100%';
      appRef.current = app;
      
      // Draw the background
      drawBackground();
    }
    
    // Clean up on unmount
    return () => {
      // Kill any GSAP animations
      gsap.killTweensOf('.spin-button');
      
      // Stop ticker and destroy app
      if (appRef.current) {
        if (appRef.current.ticker) {
          appRef.current.ticker.stop();
        }
        
        // Destroy the PIXI application
        appRef.current.destroy(true, { 
          children: true, 
          texture: true, 
          baseTexture: true 
        });
        appRef.current = null;
      }
      
      // Clear container
      if (pixiContainerRef.current) {
        pixiContainerRef.current.innerHTML = '';
      }
    };
  }, []);
  
  // Resize canvas when dimensions change
  useEffect(() => {
    if (!appRef.current) return;
    
    appRef.current.renderer.resize(canvasSize.width, canvasSize.height);
    resizeCanvas();
  }, [canvasSize.width, canvasSize.height]);
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      
      // Handle dimensions when exiting fullscreen via Esc key
      if (!isInFullscreen && originalDimensions.width && originalDimensions.height) {
        setCanvasSize({
          width: originalDimensions.width,
          height: originalDimensions.height
        });
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [originalDimensions.width, originalDimensions.height]);
  
  // Function to handle win animation
  const handleWin = useCallback((winAmount: number) => {
    // Update win amount with animation
    setLastWinAmount(winAmount);
    setUpdateWin(true);
    
    // Reset animation flag after animation completes
    setTimeout(() => setUpdateWin(false), 500);
    
    // Call onWin callback if provided
    if (onWin) {
      onWin(winAmount, winAmount > 500 ? 'big' : 'small');
    }
    
    // Play sound effect if not muted
    if (!isMuted && spinAudio.current) {
      try {
        spinAudio.current.play();
      } catch (e) {
        console.warn('Could not play win sound');
      }
    }
  }, [isMuted, onWin]);
  
  // Function to handle spin button click
  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Play sound effect if not muted
    if (!isMuted && spinAudio.current) {
      try {
        spinAudio.current.play();
      } catch (e) {
        // Error silently - audio might not be allowed yet
      }
    }
    
    // Simulate spin duration
    setTimeout(() => {
      setIsSpinning(false);
      
      // Random chance to generate a win
      if (Math.random() > 0.6) {
        const winAmount = Math.floor(Math.random() * 100) * 5; // Random win amount in $5 increments
        handleWin(winAmount);
      }
      
      // Handle auto spin
      if (autoSpinCount > 0) {
        setAutoSpinCount(prevCount => {
          const newCount = prevCount - 1;
          // If we still have auto spins remaining, trigger another spin
          if (newCount > 0) {
            setTimeout(() => handleSpin(), 500);
          }
          return newCount;
        });
      }
    }, 2000); // 2 second spin animation
  }, [isSpinning, isMuted, autoSpinCount, handleWin]);
  
  // Function to toggle auto spin
  const toggleAutoSpin = useCallback(() => {
    if (autoSpinCount > 0) {
      // Cancel auto spins
      setAutoSpinCount(0);
    } else {
      // Start 10 auto spins
      setAutoSpinCount(10);
      if (!isSpinning) {
        handleSpin();
      }
    }
  }, [autoSpinCount, isSpinning, handleSpin]);

  // Return the component JSX
  return (
    <div id="slot-game-container" className="slot-game-container relative w-full h-full">
      <div ref={pixiContainerRef} className="pixi-container absolute inset-0 pb-[88px]"></div>
      
      {/* Minimal Professional Slot UI Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[88px] bg-[#121212] flex items-center px-6 justify-between z-[9999]">
        {/* Left Section - Menu Icon Only */}
        <div className="flex items-center gap-4">
          <button 
            className="text-white text-2xl w-8 h-8 flex items-center justify-center"
            onClick={() => {}}
          >
            ≡
          </button>
        </div>
        
        {/* Center Section - Slot Controls */}
        <div className="flex items-center justify-center gap-6 text-white text-xs">
          {/* Bet display */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] opacity-70">BET ($)</span>
            <span className="text-sm font-semibold">${betAmount.toFixed(2)}</span>
          </div>
          
          {/* Auto-play icon */}
          <button 
            className="text-xl opacity-80"
            onClick={toggleAutoSpin}
          >
            {autoSpinCount > 0 ? '⏸' : '🧑‍✈️'}
          </button>
          
          {/* Reset icon */}
          <button 
            className="text-xl opacity-80"
            onClick={() => {
              setBetAmount(initialBet);
            }}
          >
            🔄
          </button>
          
          {/* Circular Spin button */}
          <button 
            className="bg-white text-black font-bold text-xl w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              transform: isSpinning ? "scale(0.95)" : "scale(1)"
            }}
            onClick={handleSpin}
            disabled={isSpinning}
          >
            {isSpinning ? '...' : '⭯'}
          </button>
          
          {/* Sound icon */}
          <button 
            className="text-xl opacity-80"
            onClick={() => setIsMuted(prev => !prev)}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
        
        {/* Right Section - WIN + BALANCE */}
        <div className="flex flex-col gap-1 text-right text-xs text-white">
          <div>
            <span className="opacity-70">WIN ($)</span>
            <span className={`text-yellow-400 font-semibold ml-2 ${updateWin ? 'animate-value-update' : ''}`}>
              ${lastWinAmount.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="opacity-70">BALANCE ($)</span>
            <span className={`text-green-400 font-semibold ml-2 ${updateBalance ? 'animate-value-update' : ''}`}>
              ${balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumSlotMachine;