import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { registerGlowFilter } from './GlowFilter';

// Default grid layout constants
const DEFAULT_COLS = 5;
const DEFAULT_ROWS = 3;
const DEFAULT_EXTRA_SYMBOLS = 4; // Extra symbols for smooth scrolling

// Define the props for the component
interface PixiSlotMachineProps {
  symbols: string[];
  onSpinComplete?: () => void;
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
  gridSize?: {
    rows?: number;
    cols?: number;
  };
  debug?: boolean;
}

// Reel class for handling reel animations and symbols
class Reel {
  container: PIXI.Container;
  symbols: PIXI.Sprite[];
  symbolTypes: string[];
  position: number;
  previousPosition: number;
  speed: number;
  cellHeight: number;
  reelWidth: number;
  spinning: boolean;
  numVisibleRows: number;
  glowFilter: PIXI.filters.GlowFilter | null = null;
  reelIndex: number;
  highlightOverlay: PIXI.Graphics | null = null;

  constructor(
    textures: Record<string, PIXI.Texture>, 
    reelIndex: number, 
    reelWidth: number, 
    cellHeight: number, 
    numVisibleRows: number, 
    initialSymbols: string[] = []
  ) {
    this.container = new PIXI.Container();
    this.container.x = reelIndex * reelWidth;
    this.reelIndex = reelIndex;
    
    this.symbols = [];
    this.symbolTypes = [];
    this.position = 0;
    this.previousPosition = 0;
    this.speed = 0;
    this.spinning = false;
    this.numVisibleRows = numVisibleRows;
    this.cellHeight = cellHeight;
    this.reelWidth = reelWidth;

    // Create symbols (visible rows + extras for smooth scrolling)
    const totalSymbols = numVisibleRows + DEFAULT_EXTRA_SYMBOLS;
    
    // Add highlight overlay for stop effect (initially invisible)
    this.highlightOverlay = new PIXI.Graphics();
    this.highlightOverlay.beginFill(0xFFFFFF, 0.2);
    this.highlightOverlay.drawRect(0, 0, reelWidth, numVisibleRows * cellHeight);
    this.highlightOverlay.endFill();
    this.highlightOverlay.alpha = 0;
    this.container.addChild(this.highlightOverlay);
    
    // Add symbols to the reel
    for (let i = 0; i < totalSymbols; i++) {
      // Use provided initialSymbols if available, otherwise random
      let symbolType;
      if (initialSymbols.length > 0 && i < initialSymbols.length) {
        symbolType = initialSymbols[i % initialSymbols.length];
      } else {
        symbolType = Object.keys(textures)[Math.floor(Math.random() * Object.keys(textures).length)];
      }
      
      this.symbolTypes.push(symbolType);
      
      const symbol = new PIXI.Sprite(textures[symbolType]);
      symbol.y = i * cellHeight;
      symbol.x = 0;
      symbol.width = reelWidth;
      symbol.height = cellHeight;
      
      // Center the image within the cell for visual consistency
      symbol.anchor.set(0.5, 0.5);
      symbol.position.set(reelWidth / 2, i * cellHeight + cellHeight / 2);
      
      // Scale the symbol to fit within the cell with padding
      this.fitSymbolToCell(symbol, 0.9); // 90% of cell size
      
      this.container.addChild(symbol);
      this.symbols.push(symbol);
    }
  }

  // Helper to fit symbol within cell bounds with consistent scaling
  fitSymbolToCell(symbol: PIXI.Sprite, scaleFactor: number = 0.9) { // Slightly reduced to ensure symbols fit within cells
    // Calculate scale to maintain aspect ratio
    const maxWidth = this.reelWidth * scaleFactor;
    const maxHeight = this.cellHeight * scaleFactor;
    
    // Original texture dimensions
    const texWidth = symbol.texture.width;
    const texHeight = symbol.texture.height;
    
    // Calculate scale that preserves aspect ratio
    let scale = Math.min(maxWidth / texWidth, maxHeight / texHeight);
    
    // Apply scale
    symbol.scale.set(scale, scale);
    
    // Enhance rendering quality
    symbol.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR; // Smooth scaling
    
    // MSAA might not be supported in all versions of PIXI, so we'll add a safety check
    try {
      symbol.texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.ON; // Better quality when scaled down
      
      // Apply anti-aliasing if resource is available
      if (symbol.texture.baseTexture.resource) {
        // @ts-ignore: MSAA is not in type definitions but exists in modern PIXI
        if (typeof PIXI.MSAA_QUALITY !== 'undefined') {
          symbol.texture.baseTexture.resource.multisample = PIXI.MSAA_QUALITY.HIGH;
        }
      }
    } catch (e) {
      // Continue anyway if we hit compatibility issues
      console.warn("Enhanced texture options not supported in this PIXI version");
    }
    
    // Add very subtle drop shadow for depth, but only if filters are available
    try {
      symbol.filters = [
        new PIXI.filters.DropShadowFilter({
          distance: 1,
          angle: Math.PI / 4,
          color: 0x000000,
          alpha: 0.2,
          blur: 1,
          quality: 3
        })
      ];
    } catch (e) {
      // Continue without filters if not supported
      console.warn("Filters not available in this PIXI version");
    }
  }

  // Start spin animation with GSAP
  spin(duration = 2, delay = 0) {
    // Reset position to ensure smooth animation
    this.symbols.forEach((symbol, i) => {
      symbol.position.y = i * this.cellHeight + this.cellHeight / 2;
      // Clear any previous effects or filters
      symbol.filters = [];
      symbol.scale.set(symbol.scale.x, symbol.scale.x); // Reset any scale animations
    });
    
    // Reset position and state
    this.position = 0;
    this.previousPosition = 0;
    this.spinning = true;
    
    // Acceleration phase
    gsap.to(this, {
      speed: 50,
      duration: 0.5,
      delay,
      ease: "power1.in",
      onComplete: () => {
        // Constant speed phase
        gsap.to(this, {
          speed: 50,
          duration: duration - 1,
          ease: "none",
          onComplete: () => {
            // Deceleration phase
            gsap.to(this, {
              speed: 0,
              duration: 0.5,
              ease: "power3.out",
              onComplete: () => {
                this.spinning = false;
                this.bounce();
              }
            });
          }
        });
      }
    });
  }

  // Update symbols during animation
  update() {
    if (!this.spinning && this.speed === 0) return;

    this.previousPosition = this.position;
    // Update position based on speed
    this.position += this.speed;
    
    // Calculate total strip height
    const stripHeight = this.cellHeight * this.symbols.length;
    
    // Update each symbol's position based on the current position
    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      
      // Calculate new Y position while maintaining center anchor point
      const baseY = (i * this.cellHeight) + this.position;
      const moduloY = baseY % stripHeight;
      
      // Center the symbol within its cell
      symbol.position.y = moduloY + this.cellHeight / 2;
      
      // If symbol goes above the reel view, move it to the bottom
      if (symbol.position.y - this.cellHeight / 2 < 0) {
        symbol.position.y += stripHeight;
      }
      
      // Add blur based on speed for realistic motion effect
      if (this.speed > 20) {
        const blurAmount = Math.min(this.speed / 10, 5);
        symbol.filters = [new PIXI.filters.BlurFilter(0, blurAmount)];
      } else if (this.speed > 0) {
        // Progressively reduce blur as reel slows down
        const blurAmount = Math.max(this.speed / 10, 0.5);
        symbol.filters = [new PIXI.filters.BlurFilter(0, blurAmount)];
      } else {
        symbol.filters = [];
      }
    }
  }

  // Add bounce effect at the end of spin
  bounce() {
    // Get the nearest cell position to align symbols properly
    const finalPosition = Math.round(this.position / this.cellHeight) * this.cellHeight;
    
    // Show highlight effect when reel stops
    if (this.highlightOverlay) {
      // Set to full opacity
      gsap.to(this.highlightOverlay, {
        alpha: 0.8,
        duration: 0.1,
        onComplete: () => {
          // Fade out after 200ms
          gsap.to(this.highlightOverlay, {
            alpha: 0,
            duration: 0.3,
            delay: 0.1
          });
        }
      });
    }
    
    // Bounce animation sequence
    gsap.to(this, {
      position: finalPosition + 10, // Overshoot
      duration: 0.1,
      ease: "power1.out",
      onComplete: () => {
        gsap.to(this, {
          position: finalPosition,
          duration: 0.3,
          ease: "elastic.out(1, 0.5)", // Elastic bounce back for realistic feel
          onComplete: () => {
            // After bounce completes, check for bonus symbols
            this.checkForBonusSymbols();
          }
        });
      }
    });
  }
  
  // Check for bonus symbols and apply effects
  checkForBonusSymbols() {
    // Get visible symbol indices
    const visibleIndices = this.getVisibleSymbolIndices();
    
    // Check each visible symbol for bonus effects
    visibleIndices.forEach((symbolIndex, rowIndex) => {
      const symbolType = this.symbolTypes[symbolIndex];
      
      // Check if this is a wild or scatter (treated as bonus symbols)
      const isBonus = symbolType.includes('wild') || symbolType.includes('scatter');
      
      if (isBonus) {
        const symbol = this.symbols[symbolIndex];
        
        // Apply glow filter - color depends on symbol type
        // Wilds get golden glow, scatters get purple glow
        this.glowFilter = new PIXI.filters.GlowFilter({
          distance: 15,
          outerStrength: 2,
          color: symbolType.includes('wild') ? 0xffcc00 : 0xff00ff,
          quality: 0.5
        });
        
        // Apply filters - combine with any existing filters
        symbol.filters = [this.glowFilter];
        
        // Add pulsating glow animation
        gsap.to(this.glowFilter, {
          outerStrength: 4,
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        
        // Add scale animation for emphasis
        gsap.to(symbol.scale, {
          x: symbol.scale.x * 1.05,
          y: symbol.scale.y * 1.05,
          duration: 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    });
  }

  // Get indices of currently visible symbols
  getVisibleSymbolIndices(): number[] {
    const indices = [];
    const offset = Math.floor(this.position / this.cellHeight) % this.symbols.length;
    
    // Find the visible symbols based on current position
    for (let i = 0; i < this.numVisibleRows; i++) {
      const index = (offset + i) % this.symbols.length;
      indices.push(index);
    }
    
    return indices;
  }

  // Get the reels container for the PIXI stage
  getReelContainer() {
    return this.container;
  }
}

// Main PixiSlotMachine component
const PixiSlotMachine: React.FC<PixiSlotMachineProps> = ({
  symbols,
  onSpinComplete,
  frameConfig = {},
  dimensions = {},
  gridSize = {},
  debug = false
}) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const reelsRef = useRef<Reel[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const [bonusTriggered, setBonusTriggered] = useState(false);
  
  // Setup PIXI application and reels
  useEffect(() => {
    // Initialize sounds
    spinSoundRef.current = new Audio('/sounds/tick.mp3');
    spinSoundRef.current.volume = 0.5;
    
    winSoundRef.current = new Audio('/sounds/select.mp3');
    winSoundRef.current.volume = 0.7;
    
    // Clean up any previous application
    if (appRef.current) {
      appRef.current.destroy(true, true);
      appRef.current = null;
    }
    
    if (pixiContainerRef.current) {
      pixiContainerRef.current.innerHTML = '';
    }
    
    // Register the GlowFilter before creating the application
    registerGlowFilter();
    
    // Create PIXI application
    if (!pixiContainerRef.current) return;
    
    // Calculate optimal size based on container dimensions or provided dimensions
    const containerWidth = dimensions.width || pixiContainerRef.current.clientWidth;
    const containerHeight = dimensions.height || pixiContainerRef.current.clientHeight;
    
    console.log("PixiSlotMachine - Container dimensions:", {
      containerWidth,
      containerHeight,
      providedWidth: dimensions.width,
      providedHeight: dimensions.height,
      clientWidth: pixiContainerRef.current.clientWidth,
      clientHeight: pixiContainerRef.current.clientHeight
    });
    
    // Create the application with the container size
    const app = new PIXI.Application({
      width: containerWidth,
      height: containerHeight,
      backgroundColor: 0x000000,
      backgroundAlpha: 0, // Make background fully transparent 
      antialias: true,
      transparent: true,
      resolution: window.devicePixelRatio || 1, // Improve rendering quality
    });
    
    pixiContainerRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;
    
    // Use provided grid size or defaults
    const rows = gridSize.rows || DEFAULT_ROWS;
    const cols = gridSize.cols || DEFAULT_COLS;
    
    // Calculate transparent area for the frame - using exact values from frameConfig
    const transparentArea = frameConfig.transparentArea || {
      top: 28,
      right: 22,
      bottom: 28,
      left: 22
    };
    
    console.log("Using frame configuration:", JSON.stringify(frameConfig));
    
    // Calculate the transparent area inside the frame based on percentages
    // This defines where the symbols should be placed within the frame
    const leftMargin = containerWidth * ((transparentArea.left || 0) / 100);
    const rightMargin = containerWidth * ((transparentArea.right || 0) / 100);
    const topMargin = containerHeight * ((transparentArea.top || 0) / 100);
    const bottomMargin = containerHeight * ((transparentArea.bottom || 0) / 100);
    
    // Calculate available space for the reels
    const availableWidth = containerWidth - leftMargin - rightMargin;
    const availableHeight = containerHeight - topMargin - bottomMargin;
    
    // Calculate cell dimensions based on available space and grid size
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    // Total reel area dimensions
    const reelAreaWidth = cellWidth * cols;
    const reelAreaHeight = cellHeight * rows;
    
    // Log the exact transparent area calculations for debugging
    console.log("Transparent area calculation:", {
      containerWidth, 
      containerHeight,
      leftMargin, 
      rightMargin, 
      topMargin, 
      bottomMargin,
      availableWidth, 
      availableHeight
    });
    
    // Create main container for centralized positioning
    const mainContainer = new PIXI.Container();
    mainContainer.position.set(containerWidth / 2, containerHeight / 2);
    
    // Log the exact positioning being used
    console.log("PIXI Positioning - Container size:", { width: containerWidth, height: containerHeight });
    console.log("PIXI Positioning - Frame config:", frameConfig);
    console.log("PIXI Positioning - Available dimensions:", { 
      availableWidth, 
      availableHeight,
      cellWidth,
      cellHeight,
      reelAreaWidth,
      reelAreaHeight
    });
    
    app.stage.addChild(mainContainer);
    
    // Create reels viewport container
    const reelsViewport = new PIXI.Container();
    
    // Center the reels exactly in the transparent area of the frame
    // Calculate the offset from center based on the transparent area configuration
    const xOffset = (leftMargin - rightMargin) / 2;
    const yOffset = (topMargin - bottomMargin) / 2;
    
    console.log("Positioning offset calculations:", { xOffset, yOffset });
    
    // Center the reels in the container and adjust for the transparent area
    reelsViewport.position.set(
      -reelAreaWidth / 2 + xOffset, 
      -reelAreaHeight / 2 + yOffset
    );
    
    // Apply frame configuration exactly as specified in Step 5
    // This ensures symbols are positioned precisely where configured in Step 5
    if (frameConfig) {
      // Compute the frame's center position in container coordinates
      const frameCenterX = 0; // container center is at 0,0 in PIXI coordinates after centered
      const frameCenterY = 0;
      
      // Apply position offset directly from Step 5 config
      if (frameConfig.position) {
        const posX = frameConfig.position.x || 0;
        const posY = frameConfig.position.y || 0;
        
        console.log(`Applying position offset from Step 5: x=${posX}, y=${posY}`);
        
        // Apply the position to the reels viewport
        reelsViewport.position.x += posX;
        reelsViewport.position.y += posY;
      }
      
      // Apply scale from Step 5 config (as percentage)
      if (frameConfig.scale) {
        const scale = frameConfig.scale / 100;
        console.log(`Applying scale from Step 5: ${scale}`);
        reelsViewport.scale.set(scale, scale);
      }
      
      // Apply stretch from Step 5 config (as percentage for x/y independently)
      if (frameConfig.stretch) {
        const stretchX = (frameConfig.stretch.x || 100) / 100;
        const stretchY = (frameConfig.stretch.y || 100) / 100;
        
        console.log(`Applying stretch from Step 5: x=${stretchX}, y=${stretchY}`);
        reelsViewport.scale.x *= stretchX;
        reelsViewport.scale.y *= stretchY;
      }
      
      // Detailed log of final position and scale
      console.log("Final reel viewport positioning:", {
        x: reelsViewport.position.x,
        y: reelsViewport.position.y,
        scaleX: reelsViewport.scale.x,
        scaleY: reelsViewport.scale.y,
        width: reelAreaWidth,
        height: reelAreaHeight,
        rotation: reelsViewport.rotation
      });
    }
    
    mainContainer.addChild(reelsViewport);
    
    // Add background panel behind reels (transparent glass effect)
    // Using much lower alpha values to ensure transparency
    const glassPanel = new PIXI.Graphics();
    glassPanel.beginFill(0xFFFFFF, 0.02); // Almost completely transparent
    glassPanel.lineStyle(1, 0xFFFFFF, 0.05); // Very subtle border
    glassPanel.drawRect(0, 0, reelAreaWidth, reelAreaHeight);
    glassPanel.endFill();
    
    // Subtle glass reflection with minimal opacity
    const reflection = new PIXI.Graphics();
    reflection.beginFill(0xFFFFFF, 0.01); // Almost imperceptible
    reflection.moveTo(0, 0);
    reflection.lineTo(reelAreaWidth, 0);
    reflection.lineTo(reelAreaWidth * 0.8, reelAreaHeight * 0.3);
    reflection.lineTo(0, reelAreaHeight * 0.4);
    reflection.endFill();
    
    // Add to reels viewport as first layer (behind the reels)
    glassPanel.addChild(reflection);
    reelsViewport.addChild(glassPanel);
    
    // Create a container for the actual reels (all reels in a single container)
    const reelContainer = new PIXI.Container();
    reelsViewport.addChild(reelContainer);
    
    // Create mask for reels (to prevent overflow)
    const mask = new PIXI.Graphics();
    mask.beginFill(0xFFFFFF);
    mask.drawRect(0, 0, reelAreaWidth, reelAreaHeight);
    mask.endFill();
    reelsViewport.addChild(mask);
    reelContainer.mask = mask;
    
    // Create textures from the symbol images
    const textures: Record<string, PIXI.Texture> = {};
    
    // Pre-processing step: wait for all symbols to be available
    const loadSymbolTextures = async () => {
      // Make sure we have symbols to work with
      if (symbols.length === 0) {
        console.warn('No symbols provided for PixiSlotMachine');
        return;
      }
      
      // Dynamically create textures from the provided symbol URLs
      for (let i = 0; i < symbols.length; i++) {
        const symbolPath = symbols[i];
        const symbolName = `symbol_${i}`;
        
        try {
          const texture = await PIXI.Assets.load(symbolPath);
          textures[symbolName] = texture;
        } catch (err) {
          console.error(`Failed to load texture for symbol: ${symbolPath}`, err);
          
          // Create a fallback texture with a colored rectangle
          const fallbackGraphic = new PIXI.Graphics();
          fallbackGraphic.beginFill(0xCCCCCC);
          fallbackGraphic.drawRect(0, 0, cellWidth, cellHeight);
          fallbackGraphic.endFill();
          
          textures[symbolName] = app.renderer.generateTexture(fallbackGraphic);
        }
      }
      
      // Once textures are loaded, create the reels
      reelsRef.current = [];
      
      // For each reel, create a subset of symbols to display initially
      for (let i = 0; i < cols; i++) {
        const reelSymbols: string[] = [];
        
        // For each position in the reel, pick a random symbol
        for (let j = 0; j < rows + DEFAULT_EXTRA_SYMBOLS; j++) {
          const symbolIndex = Math.floor(Math.random() * Object.keys(textures).length);
          reelSymbols.push(Object.keys(textures)[symbolIndex]);
        }
        
        // Create the reel with the selected symbols
        const reel = new Reel(textures, i, cellWidth, cellHeight, rows, reelSymbols);
        reelsRef.current.push(reel);
        reelContainer.addChild(reel.getReelContainer());
      }
      
      // Create a grid overlay container (appears in front of reels)
      const gridOverlay = new PIXI.Container();
      reelsViewport.addChild(gridOverlay);
      
      // Add extremely subtle reel separator lines (almost invisible)
      for (let i = 1; i < cols; i++) {
        const separator = new PIXI.Graphics();
        separator.lineStyle(1, 0xFFFFFF, 0.03); // Much lower opacity (0.03 vs 0.15)
        separator.moveTo(i * cellWidth, 0);
        separator.lineTo(i * cellWidth, rows * cellHeight);
        gridOverlay.addChild(separator);
      }
      
      // Add extremely subtle row separator lines (almost invisible)
      for (let i = 1; i < rows; i++) {
        const separator = new PIXI.Graphics();
        separator.lineStyle(1, 0xFFFFFF, 0.03); // Much lower opacity (0.03 vs 0.15)
        separator.moveTo(0, i * cellHeight);
        separator.lineTo(cols * cellWidth, i * cellHeight);
        gridOverlay.addChild(separator);
      }
      
      // Add extremely subtle shine/reflection effect to the glass overlay
      const glassOverlay = new PIXI.Graphics();
      glassOverlay.beginFill(0xFFFFFF, 0.01); // Much lower opacity (0.01 vs 0.03)
      glassOverlay.drawRect(0, 0, reelAreaWidth, reelAreaHeight);
      glassOverlay.endFill();
      
      // Add very subtle light reflection on the glass
      const overlayReflection = new PIXI.Graphics();
      overlayReflection.beginFill(0xFFFFFF, 0.01); // Lower opacity (0.01 vs 0.03)
      overlayReflection.drawRect(0, 0, reelAreaWidth, 8);
      overlayReflection.endFill();
      
      // Add to viewport as topmost layer
      gridOverlay.addChild(glassOverlay);
      gridOverlay.addChild(overlayReflection);
    };
    
    loadSymbolTextures();
    
    // Animation loop with proper cleanup and safety checks
    const animate = () => {
      // Safety check - don't continue if component is unmounting or app is destroyed
      if (!appRef.current || !reelsRef.current.length) {
        return;
      }
      
      // Update all reels
      reelsRef.current.forEach(reel => reel.update());
      
      // Request next frame only if we're still mounted
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Clear any existing animation frames first to prevent duplicates
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Debug mode - add info text
    if (debug) {
      const debugText = new PIXI.Text('Debug Mode', {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xFFFFFF,
        align: 'center',
      });
      debugText.position.set(10, 10);
      app.stage.addChild(debugText);
    }
    
    // Cleanup
    return () => {
      // First, stop the animation loop to prevent further updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clear all GSAP animations that might be running
      gsap.killTweensOf(reelsRef.current.map(reel => reel.container));
      
      // Stop all ticker animations if using PIXI ticker
      if (appRef.current && appRef.current.ticker) {
        appRef.current.ticker.stop();
      }
      
      // Clean up all textures explicitly
      if (appRef.current) {
        // Force texture garbage collection
        PIXI.utils.clearTextureCache();
        
        // Destroy app with complete cleanup
        appRef.current.destroy(true, { 
          children: true, 
          texture: true, 
          baseTexture: true 
        });
        appRef.current = null;
      }
      
      // Empty the container
      if (pixiContainerRef.current) {
        pixiContainerRef.current.innerHTML = '';
      }
      
      // Cleanup audio
      if (spinSoundRef.current) {
        spinSoundRef.current.pause();
        spinSoundRef.current = null;
      }
      if (winSoundRef.current) {
        winSoundRef.current.pause();
        winSoundRef.current = null;
      }
      
      // Clear reel references
      reelsRef.current = [];
    };
  }, [symbols, debug, frameConfig, dimensions, gridSize]);
  
  // Function to start spinning animation
  const spinReels = () => {
    if (isSpinning || reelsRef.current.length === 0) return;
    
    setIsSpinning(true);
    setBonusTriggered(false);
    
    // Play spin sound
    if (spinSoundRef.current) {
      spinSoundRef.current.currentTime = 0;
      spinSoundRef.current.play();
    }
    
    // Set up a repeating sound effect during spin
    const tickInterval = setInterval(() => {
      if (spinSoundRef.current && isSpinning) {
        spinSoundRef.current.currentTime = 0;
        spinSoundRef.current.play();
      }
    }, 200);
    
    // Start spinning each reel with progressive delays
    reelsRef.current.forEach((reel, index) => {
      const delay = index * 0.2; // Progressive delay for each reel
      reel.spin(2, delay);
    });
    
    // Calculate total spin duration including delays
    const totalSpinDuration = 2.5 + ((reelsRef.current.length - 1) * 0.2);
    
    // Check for bonus symbols after all reels have stopped
    setTimeout(() => {
      clearInterval(tickInterval);
      
      // Play win sound
      if (winSoundRef.current) {
        winSoundRef.current.currentTime = 0;
        winSoundRef.current.play();
      }
      
      // Check if any reel has bonus symbols
      let bonusCount = 0;
      reelsRef.current.forEach(reel => {
        const visibleIndices = reel.getVisibleSymbolIndices();
        visibleIndices.forEach(symbolIndex => {
          const symbolType = reel.symbolTypes[symbolIndex];
          if (symbolType.includes('wild') || symbolType.includes('scatter')) {
            bonusCount++;
          }
        });
      });
      
      // If we have multiple bonus symbols, create additional effects
      if (bonusCount >= 2) {
        setBonusTriggered(true);
        
        // Shake the entire game frame for excitement with better animation management
        if (appRef.current && appRef.current.stage.children[0]) {
          const mainContainer = appRef.current.stage.children[0];
          
          // Store animation references for proper cleanup
          const shakeAnimation = gsap.to(mainContainer, {
            x: "+=10",
            duration: 0.1,
            repeat: 5,
            yoyo: true,
            ease: "elastic.out(1, 0.3)",
            onComplete: () => {
              // Ensure we still have a valid app reference before continuing
              if (!appRef.current) return;
              
              const resetAnim = gsap.to(mainContainer, {
                x: appRef.current.screen.width / 2,
                duration: 0.3
              });
              
              // Store for cleanup
              if (!appRef.current.userData) {
                appRef.current.userData = { animations: [] };
              }
              appRef.current.userData.animations = [...(appRef.current.userData.animations || []), resetAnim];
            }
          });
          
          // Flash the background with proper resource management
          const background = new PIXI.Graphics();
          background.beginFill(0xFFCC00, 0.3);
          background.drawRect(0, 0, appRef.current.screen.width, appRef.current.screen.height);
          background.endFill();
          appRef.current.stage.addChild(background);
          
          const flashAnimation = gsap.to(background, {
            alpha: 0,
            duration: 0.5,
            repeat: 3,
            yoyo: true,
            onComplete: () => {
              // Ensure we still have valid references before cleanup
              if (!appRef.current || !background.parent) return;
              
              appRef.current.stage.removeChild(background);
              background.destroy({ children: true, texture: true });
            }
          });
          
          // Store all animations for proper cleanup
          if (!appRef.current.userData) {
            appRef.current.userData = { animations: [] };
          }
          appRef.current.userData.animations = [
            ...(appRef.current.userData.animations || []),
            shakeAnimation,
            flashAnimation
          ];
        }
      }
      
      setIsSpinning(false);
      
      // Notify parent component that spin is complete
      if (onSpinComplete) {
        onSpinComplete();
      }
    }, totalSpinDuration * 1000);
  };
  
  return (
    <div className="pixi-container relative">
      <div 
        ref={pixiContainerRef} 
        className="w-full h-full"
        style={{ 
          minHeight: '400px',
          position: 'relative'
        }}
      />
      
      {/* Removed Spin button to let parent component handle spins */}
      
      {/* Bonus trigger indicator */}
      {bonusTriggered && (
        <div className="absolute top-4 left-0 right-0 text-center">
          <div className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-full font-bold text-lg animate-pulse">
            BONUS TRIGGERED!
          </div>
        </div>
      )}
    </div>
  );
};

export default PixiSlotMachine;