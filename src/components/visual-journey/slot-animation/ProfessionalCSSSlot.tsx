import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface ProfessionalCSSSlotProps {
  /** Reels count (width) */
  reels: number;
  /** Rows count (height) */
  rows: number;
  /** Available symbol images */
  symbolImages: string[];
  /** Whether to show cell backgrounds */
  showCellBackgrounds?: boolean;
  /** Frame path for overlay */
  framePath?: string | null;
  /** Background path */
  backgroundPath?: string | null;
  /** Spin handler */
  onSpin?: () => void;
  /** Game values */
  balance?: number;
  bet?: number;
  win?: number;
}

/**
 * Professional CSS + GSAP Slot Machine
 * 
 * AAA-quality slot machine using pure CSS + GSAP animations
 * No PixiJS dependency - works everywhere
 */
const ProfessionalCSSSlot: React.FC<ProfessionalCSSSlotProps> = ({
  reels,
  rows,
  symbolImages,
  showCellBackgrounds = false,
  framePath = null,
  backgroundPath = null,
  onSpin,
  balance = 1000,
  bet = 1.00,
  win = 0.00
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reelRefs = useRef<HTMLDivElement[]>([]);
  const symbolRefs = useRef<HTMLDivElement[][]>([]);
  const isSpinningRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [currentSymbols, setCurrentSymbols] = useState<string[][]>([]);
  
  // Initialize the slot machine
  useEffect(() => {
    // Generate initial symbols
    const initialSymbols: string[][] = [];
    for (let reel = 0; reel < reels; reel++) {
      const reelSymbols: string[] = [];
      for (let row = 0; row < rows; row++) {
        const randomSymbol = symbolImages[Math.floor(Math.random() * symbolImages.length)] || '/assets/symbols/placeholder.png';
        reelSymbols.push(randomSymbol);
      }
      initialSymbols.push(reelSymbols);
    }
    setCurrentSymbols(initialSymbols);
    setIsReady(true);
  }, [reels, rows, symbolImages]);
  
  // Professional AAA slot machine spin function using GSAP
  const performSpin = async () => {
    if (isSpinningRef.current || !isReady) return;
    
    console.log('🎰 Starting Professional CSS + GSAP slot machine spin...');
    isSpinningRef.current = true;
    
    // Call original spin handler
    if (onSpin) {
      onSpin();
    }
    
    // Generate final spin results
    const spinResults: string[][] = [];
    for (let reel = 0; reel < reels; reel++) {
      const reelResult: string[] = [];
      for (let row = 0; row < rows; row++) {
        const randomSymbol = symbolImages[Math.floor(Math.random() * symbolImages.length)] || '/assets/symbols/placeholder.png';
        reelResult.push(randomSymbol);
      }
      spinResults.push(reelResult);
    }
    
    // Animate each reel with professional timing
    const reelAnimations = reelRefs.current.map((reelElement, reelIndex) => {
      if (!reelElement) return Promise.resolve();
      
      return new Promise<void>((resolve) => {
        const timeline = gsap.timeline();
        
        // Phase 1: Acceleration (0.3s)
        timeline.to(reelElement, {
          duration: 0.3,
          rotationX: '+=180',
          ease: 'power2.in',
          onUpdate: () => {
            // Add blur effect during acceleration
            reelElement.style.filter = 'blur(3px)';
            reelElement.style.transform += ' scale(0.98)';
          }
        });
        
        // Phase 2: Fast spinning (1.5s + stagger)
        const constantDuration = 1.5 + (reelIndex * 0.3);
        timeline.to(reelElement, {
          duration: constantDuration,
          rotationX: `+=${constantDuration * 720}`, // Fast spinning
          ease: 'none',
          onUpdate: () => {
            // Maintain blur during spinning
            reelElement.style.filter = 'blur(4px)';
          }
        });
        
        // Phase 3: Deceleration with anticipation (0.8s)
        timeline.to(reelElement, {
          duration: 0.8,
          rotationX: '+=90',
          ease: 'power3.out',
          onUpdate: () => {
            // Gradually reduce blur
            const progress = timeline.progress();
            const blurAmount = 4 * (1 - progress);
            reelElement.style.filter = `blur(${Math.max(blurAmount, 0)}px)`;
            reelElement.style.transform = reelElement.style.transform.replace(/scale\\([^)]*\\)/, `scale(${0.98 + (progress * 0.02)})`);
          },
          onComplete: () => {
            // Set final symbols and clean up
            reelElement.style.filter = 'none';
            reelElement.style.transform = reelElement.style.transform.replace(/scale\\([^)]*\\)/, 'scale(1)');
            
            // Update symbols to final result
            const symbolElements = reelElement.querySelectorAll('.symbol');
            symbolElements.forEach((symbolEl, symbolIndex) => {
              if (spinResults[reelIndex] && spinResults[reelIndex][symbolIndex]) {
                const imgEl = symbolEl.querySelector('img') as HTMLImageElement;
                if (imgEl) {
                  imgEl.src = spinResults[reelIndex][symbolIndex];
                }
              }
            });
            
            // Add bounce effect
            gsap.fromTo(reelElement, {
              scaleY: 0.95
            }, {
              scaleY: 1,
              duration: 0.3,
              ease: 'back.out(1.7)',
              onComplete: () => resolve()
            });
          }
        });
      });
    });
    
    // Wait for all reels to finish
    await Promise.all(reelAnimations);
    
    // Update state with final results
    setCurrentSymbols(spinResults);
    isSpinningRef.current = false;
    console.log('🎰 Professional CSS + GSAP spin complete!');
  };
  
  return (
    <div className="relative w-full h-full bg-slate-900" ref={containerRef}>
      {/* Background */}
      {backgroundPath && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{ backgroundImage: `url(${backgroundPath})` }}
        />
      )}
      
      {/* Slot Grid */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <div 
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${reels}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            maxWidth: '80%',
            maxHeight: '60%',
            aspectRatio: `${reels}/${rows}`
          }}
        >
          {Array.from({ length: reels }, (_, reelIndex) => (
            <div
              key={`reel-${reelIndex}`}
              ref={el => {
                if (el) reelRefs.current[reelIndex] = el;
              }}
              className="reel-column flex flex-col gap-1 perspective-1000"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {Array.from({ length: rows }, (_, rowIndex) => {
                const symbolSrc = currentSymbols[reelIndex]?.[rowIndex] || '/assets/symbols/placeholder.png';
                
                return (
                  <div
                    key={`symbol-${reelIndex}-${rowIndex}`}
                    className={`symbol relative flex items-center justify-center rounded-lg overflow-hidden ${
                      showCellBackgrounds ? 'bg-slate-800/80' : ''
                    }`}
                    style={{
                      aspectRatio: '1',
                      border: '1px solid rgba(55, 65, 81, 0.7)',
                      minHeight: '60px'
                    }}
                  >
                    <img
                      src={symbolSrc}
                      alt={`Symbol ${reelIndex}-${rowIndex}`}
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Frame Overlay */}
        {framePath && (
          <div 
            className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-90 pointer-events-none"
            style={{ backgroundImage: `url(${framePath})` }}
          />
        )}
      </div>
      
      {/* Spin Button */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <button
          onClick={performSpin}
          disabled={isSpinningRef.current || !isReady}
          className="spin-btn bg-white text-black rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
          aria-label="Spin"
        >
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 7l5 5m0 0l-5 5m5-5H6" 
            />
          </svg>
        </button>
      </div>
      
      {/* Game UI */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-90 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm">BET: {bet.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">WIN: {win.toFixed(2)}</span>
          <span className="text-sm">BALANCE: {balance.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Loading State */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white">Loading Professional Slot...</div>
        </div>
      )}
      
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .reel-column {
          transform-style: preserve-3d;
        }
        
        .symbol {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
};

export default ProfessionalCSSSlot;