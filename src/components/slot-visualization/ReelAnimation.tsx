import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

const REEL_WIDTH = 120; // Smaller width to fit more reels
const SYMBOL_SIZE = 100;
const SYMBOL_PADDING = 10; // Padding between symbols
const MAX_REELS = 7; // Maximum number of reels supported

class Reel {
  container: PIXI.Container;
  symbols: PIXI.Sprite[];
  position: number;
  speed: number;
  stopPosition: number;
  spinning: boolean;
  numSymbols: number;

  constructor(textures: PIXI.Texture[], x: number, numSymbols: number) {
    this.container = new PIXI.Container();
    this.container.x = x;
    
    this.symbols = [];
    this.position = 0;
    this.speed = 0;
    this.stopPosition = 0;
    this.spinning = false;
    this.numSymbols = numSymbols;

    // Create symbols (we need more than visible rows for smooth scrolling)
    // Add 2 more symbols than visible for smooth scrolling
    const totalSymbols = numSymbols + 2;
    
    for (let i = 0; i < totalSymbols; i++) {
      const symbolIndex = Math.floor(Math.random() * textures.length);
      const symbol = new PIXI.Sprite(textures[symbolIndex]);
      symbol.y = i * SYMBOL_SIZE;
      symbol.x = 0;
      symbol.width = SYMBOL_SIZE;
      symbol.height = SYMBOL_SIZE;
      this.container.addChild(symbol);
      this.symbols.push(symbol);
    }
  }

  spin(duration = 2, delay = 0) {
    // Reset position to ensure smooth animation
    this.symbols.forEach((symbol, i) => {
      symbol.y = i * SYMBOL_SIZE;
    });
    this.position = 0;
    
    this.spinning = true;
    
    // Acceleration
    gsap.to(this, {
      speed: 40,
      duration: 0.5,
      delay,
      ease: "power2.in",
      onComplete: () => {
        // Maintain speed, then decelerate
        gsap.to(this, {
          speed: 0,
          duration: duration,
          delay: 1,
          ease: "power3.out",
          onComplete: () => {
            this.spinning = false;
            this.bounce();
          }
        });
      }
    });
  }

  update() {
    if (!this.spinning) return;

    // Update position based on speed
    this.position += this.speed;
    
    // Update symbols based on position
    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      symbol.y = ((i * SYMBOL_SIZE) + this.position) % (SYMBOL_SIZE * this.symbols.length);
      
      // If symbol goes above the reel view, move it to the bottom
      if (symbol.y < 0) {
        symbol.y += SYMBOL_SIZE * this.symbols.length;
      }
    }
  }

  bounce() {
    // Add a little bounce effect at the end
    const finalPosition = Math.round(this.position / SYMBOL_SIZE) * SYMBOL_SIZE;
    gsap.to(this, {
      position: finalPosition + 10, // Overshoot
      duration: 0.1,
      ease: "power1.out",
      onComplete: () => {
        gsap.to(this, {
          position: finalPosition,
          duration: 0.3,
          ease: "elastic.out(3, 0.5)" // Elastic bounce back
        });
      }
    });
  }

  getReelContainer() {
    return this.container;
  }
}

// Props interface
interface ReelAnimationProps {
  numReels?: number;
  numRows?: number;
  className?: string;
}

// Export interface for ref
export interface ReelAnimationRef {
  spin: () => void;
}

const ReelAnimation = forwardRef<ReelAnimationRef, ReelAnimationProps>(({
  numReels = 3,
  numRows = 3,
  className = ''
}, ref) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const reelsRef = useRef<Reel[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Clamp to supported values
  const safeNumReels = Math.min(MAX_REELS, Math.max(3, numReels));
  const safeNumRows = Math.min(5, Math.max(3, numRows));
  
  // Expose the spin method to parent components via ref
  useImperativeHandle(ref, () => ({
    spin: handleSpin
  }));
  
  // Clear reels ref whenever reels or rows change
  useEffect(() => {
    reelsRef.current = [];
  }, [safeNumReels, safeNumRows]);
  
  // Update to rebuild animation whenever reels or rows change
  useEffect(() => {
    // Clean up any previous application before creating a new one
    if (appRef.current) {
      appRef.current.destroy(true, true);
      appRef.current = null;
    }
    
    if (pixiContainerRef.current) {
      pixiContainerRef.current.innerHTML = '';
    }
    
    // Create PIXI application
    if (!pixiContainerRef.current) return;
    
    // Calculate optimal height based on number of rows 
    const reelHeight = safeNumRows * SYMBOL_SIZE + 40; // Add padding
    
    const app = new PIXI.Application({
      width: REEL_WIDTH * safeNumReels + 40,
      height: reelHeight,
      backgroundColor: 0x2C3E50, // Dark blue background
      resolution: window.devicePixelRatio || 1,
      antialias: true, // Smoother edges
    });
    
    pixiContainerRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;
    
    // Create a container for reels
    const reelContainer = new PIXI.Container();
    reelContainer.x = 20;
    reelContainer.y = 50;
    app.stage.addChild(reelContainer);
    
    // Create mask for reels - only show visible rows
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(reelContainer.x, reelContainer.y, REEL_WIDTH * safeNumReels, SYMBOL_SIZE * safeNumRows);
    mask.endFill();
    app.stage.addChild(mask);
    reelContainer.mask = mask;
    
    // Load textures for symbols - we'll use some colored rectangles with text as fallback
    const symbolTextures: PIXI.Texture[] = [];
    const symbolImages = [
      '/assets/symbols/wild.png',
      '/assets/symbols/scatter.png',
      '/assets/symbols/high_1.png',
      '/assets/symbols/high_2.png',
      '/assets/symbols/high_3.png',
      '/assets/symbols/mid_1.png',
      '/assets/symbols/mid_2.png',
      '/assets/symbols/low_1.png',
      '/assets/symbols/low_2.png'
    ];
    
    // Fallback to theme images if needed
    const themeImages = [
      '/themes/ancient-egypt.png',
      '/themes/cosmic-adventure.png',
      '/themes/deep-ocean.png',
      '/themes/enchanted-forest.png',
      '/themes/golden-vegas.png',
      '/themes/wild-west.png',
      '/themes/candy-land.png',
      '/themes/fantasy-kingdom.png'
    ];
    
    // Colors for fallback symbols
    const colors = [0xED6A5A, 0xF4F1BB, 0x9BC1BC, 0x5CA4A9, 0xE6EBE0, 0xF0B67F, 0xFE5F55, 0xD6D1B1];
    const labels = ['7', 'BAR', 'Wild', 'Scatter', 'Cherry', 'Bell', 'Lemon', 'Plum'];
    
    // Create fallback textures with colored rectangles and labels
    for (let i = 0; i < 8; i++) {
      const fallbackGraphic = new PIXI.Graphics();
      fallbackGraphic.beginFill(colors[i]);
      fallbackGraphic.drawRect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE);
      fallbackGraphic.endFill();
      
      const label = new PIXI.Text(labels[i], {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xFFFFFF,
        align: 'center',
      });
      label.anchor.set(0.5);
      label.x = SYMBOL_SIZE / 2;
      label.y = SYMBOL_SIZE / 2;
      fallbackGraphic.addChild(label);
      
      const texture = app.renderer.generateTexture(fallbackGraphic);
      symbolTextures.push(texture);
    }
    
    // Try to load actual images
    // We'll keep the fallback textures in case the image loading fails
    const loadTextures = async () => {
      try {
        // First try to load symbol images
        const loadedSymbolTextures = await Promise.all(
          symbolImages.map(image => PIXI.Assets.load(image).catch(err => null))
        );
        
        // Replace fallback textures with loaded symbol images when available
        loadedSymbolTextures.forEach((texture, index) => {
          if (texture) {
            symbolTextures[index] = texture;
          }
        });
        
        // If we don't have enough symbols, load theme images as backup
        if (loadedSymbolTextures.filter(t => t !== null).length < 5) {
          const loadedThemeTextures = await Promise.all(
            themeImages.map(image => PIXI.Assets.load(image).catch(err => null))
          );
          
          // Add any successfully loaded theme textures
          loadedThemeTextures.forEach((texture, index) => {
            if (texture) {
              // Only add if we don't exceed 8 textures
              if (symbolTextures.length < 8) {
                symbolTextures.push(texture);
              }
            }
          });
        }
      } catch (error) {
        console.error("Error loading textures:", error);
        // Continue with fallback textures
      }
      
      // Create reels based on configured number
      for (let i = 0; i < safeNumReels; i++) {
        const reel = new Reel(symbolTextures, i * REEL_WIDTH, safeNumRows);
        reelsRef.current.push(reel);
        reelContainer.addChild(reel.getReelContainer());
      }
    };
    
    loadTextures();
    
    // Animation loop
    const animate = () => {
      // Update all reels
      reelsRef.current.forEach(reel => reel.update());
      
      // Request next frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
    };
  }, [safeNumReels, safeNumRows]); // Rebuild when configuration changes
  
  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Spin each reel with a slight delay between them
    reelsRef.current.forEach((reel, i) => {
      reel.spin(2, i * 0.3);
    });
    
    // Reset spinning state after the animation completes
    setTimeout(() => {
      setIsSpinning(false);
    }, 4000); // Enough time for all reels to complete their spin and bounce
  };
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <div 
          ref={pixiContainerRef} 
          className="mb-4 border-4 border-gray-800 rounded-lg overflow-hidden shadow-lg" 
          style={{
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.3)',
            background: 'linear-gradient(to bottom, #1a2a38, #2c3e50)',
            width: `${REEL_WIDTH * safeNumReels + 40}px`,
            height: `${safeNumRows * SYMBOL_SIZE + 40}px`
          }}
        ></div>
        <div className="absolute top-0 left-0 right-0 p-2 text-center">
          <div className="inline-block bg-gray-900 bg-opacity-70 px-3 py-1 rounded-full text-yellow-400 font-bold text-sm">
            {safeNumReels}x{safeNumRows} Slot
          </div>
        </div>
      </div>
      
      <button
        onClick={handleSpin}
        disabled={isSpinning}
        className={`px-8 py-4 text-xl font-bold text-white rounded-full shadow-lg 
          transform transition-all duration-150
          ${isSpinning 
            ? 'bg-gray-500 cursor-not-allowed scale-95' 
            : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:bg-red-800 active:scale-95'
          }`}
        style={{
          boxShadow: isSpinning 
            ? '0 4px 6px rgba(0, 0, 0, 0.1)' 
            : '0 10px 15px rgba(0, 0, 0, 0.2), 0 0 8px rgba(255, 0, 0, 0.4)'
        }}
      >
        {isSpinning ? 'Spinning...' : 'SPIN!'}
      </button>
    </div>
  );
});

export default ReelAnimation;