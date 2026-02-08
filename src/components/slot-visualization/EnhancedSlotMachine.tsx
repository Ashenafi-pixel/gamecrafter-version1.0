import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Particle } from '@pixi/particle-emitter';

// Constants for slot machine layout
const REEL_WIDTH = 160;
const SYMBOL_SIZE = 140;
const SYMBOL_PADDING = 10;
const MAX_REELS = 5;
const MAX_ROWS = 3;

// Win line definitions (for a 5x3 grid)
const WIN_LINES = [
  // Horizontal lines
  [{reel: 0, row: 0}, {reel: 1, row: 0}, {reel: 2, row: 0}, {reel: 3, row: 0}, {reel: 4, row: 0}], // Top row
  [{reel: 0, row: 1}, {reel: 1, row: 1}, {reel: 2, row: 1}, {reel: 3, row: 1}, {reel: 4, row: 1}], // Middle row
  [{reel: 0, row: 2}, {reel: 1, row: 2}, {reel: 2, row: 2}, {reel: 3, row: 2}, {reel: 4, row: 2}], // Bottom row
  
  // V-shape
  [{reel: 0, row: 0}, {reel: 1, row: 1}, {reel: 2, row: 2}, {reel: 3, row: 1}, {reel: 4, row: 0}],
  
  // Inverted V-shape
  [{reel: 0, row: 2}, {reel: 1, row: 1}, {reel: 2, row: 0}, {reel: 3, row: 1}, {reel: 4, row: 2}],
  
  // Zigzag
  [{reel: 0, row: 0}, {reel: 1, row: 1}, {reel: 2, row: 0}, {reel: 3, row: 1}, {reel: 4, row: 0}],
  [{reel: 0, row: 2}, {reel: 1, row: 1}, {reel: 2, row: 2}, {reel: 3, row: 1}, {reel: 4, row: 2}],
  
  // W shape
  [{reel: 0, row: 0}, {reel: 1, row: 2}, {reel: 2, row: 0}, {reel: 3, row: 2}, {reel: 4, row: 0}],
  
  // M shape
  [{reel: 0, row: 2}, {reel: 1, row: 0}, {reel: 2, row: 2}, {reel: 3, row: 0}, {reel: 4, row: 2}],
];

// Symbol weights and payouts (used for win determination)
const SYMBOL_CONFIG = {
  'wild': { weight: 1, payouts: {3: 50, 4: 200, 5: 500}, isWild: true },
  'scatter': { weight: 1, payouts: {3: 25, 4: 100, 5: 250}, isScatter: true },
  'high_1': { weight: 2, payouts: {3: 20, 4: 50, 5: 200} },
  'high_2': { weight: 2, payouts: {3: 15, 4: 40, 5: 150} },
  'high_3': { weight: 3, payouts: {3: 10, 4: 30, 5: 100} },
  'mid_1': { weight: 4, payouts: {3: 8, 4: 20, 5: 80} },
  'mid_2': { weight: 5, payouts: {3: 5, 4: 15, 5: 60} },
  'low_1': { weight: 6, payouts: {3: 3, 4: 10, 5: 40} },
  'low_2': { weight: 7, payouts: {3: 2, 4: 8, 5: 30} },
  'low_3': { weight: 8, payouts: {3: 1, 4: 5, 5: 20} }
};

// Reel class for handling reel animations and symbols
class Reel {
  container: PIXI.Container;
  symbols: PIXI.Sprite[];
  symbolTypes: string[];
  position: number;
  previousPosition: number;
  speed: number;
  stopPosition: number;
  spinning: boolean;
  numSymbols: number;
  finalSymbols: string[] = [];

  constructor(textures: Record<string, PIXI.Texture>, x: number, numSymbols: number) {
    this.container = new PIXI.Container();
    this.container.x = x;
    
    this.symbols = [];
    this.symbolTypes = [];
    this.position = 0;
    this.previousPosition = 0;
    this.speed = 0;
    this.stopPosition = 0;
    this.spinning = false;
    this.numSymbols = numSymbols;

    // Create symbols (visible symbols + extras for smooth scrolling)
    const totalSymbols = numSymbols + 2;
    
    for (let i = 0; i < totalSymbols; i++) {
      // Select symbol type based on weights
      const symbolType = this.getRandomSymbolType();
      this.symbolTypes.push(symbolType);
      
      const symbol = new PIXI.Sprite(textures[symbolType]);
      symbol.y = i * SYMBOL_SIZE;
      symbol.x = 0;
      symbol.width = SYMBOL_SIZE;
      symbol.height = SYMBOL_SIZE;
      this.container.addChild(symbol);
      this.symbols.push(symbol);
    }
  }

  // Get a random symbol type based on weights
  getRandomSymbolType(): string {
    const symbolTypes = Object.keys(SYMBOL_CONFIG);
    const totalWeight = symbolTypes.reduce((sum, type) => sum + SYMBOL_CONFIG[type].weight, 0);
    
    let random = Math.random() * totalWeight;
    for (const type of symbolTypes) {
      random -= SYMBOL_CONFIG[type].weight;
      if (random <= 0) {
        return type;
      }
    }
    
    return symbolTypes[0]; // Fallback
  }

  // Prepare result symbols in advance (for deterministic outcome)
  prepareResults(forcedSymbols?: string[]) {
    this.finalSymbols = [];
    
    // If forced symbols provided, use them
    if (forcedSymbols && forcedSymbols.length >= this.numSymbols) {
      this.finalSymbols = forcedSymbols.slice(0, this.numSymbols);
    } else {
      // Otherwise generate random symbols
      for (let i = 0; i < this.numSymbols; i++) {
        this.finalSymbols.push(this.getRandomSymbolType());
      }
    }
  }

  // Start spin animation with GSAP
  spin(duration = 2, delay = 0) {
    // Reset position to ensure smooth animation
    this.symbols.forEach((symbol, i) => {
      symbol.y = i * SYMBOL_SIZE;
    });
    this.position = 0;
    this.previousPosition = 0;
    
    this.spinning = true;
    
    // Acceleration phase
    gsap.to(this, {
      speed: 40,
      duration: 0.5,
      delay,
      ease: "power2.in",
      onComplete: () => {
        // Constant speed phase
        gsap.to(this, {
          speed: 40,
          duration: 1,
          onComplete: () => {
            // Deceleration phase
            gsap.to(this, {
              speed: 0,
              duration: duration - 1.5,
              ease: "power3.out",
              onComplete: () => {
                this.spinning = false;
                this.bounce();
                this.updateFinalSymbols();
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

  // Add bounce effect at the end of spin
  bounce() {
    // Get the nearest full position to align symbols properly
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

  // Update symbols to match final results
  updateFinalSymbols() {
    if (!this.finalSymbols.length) return;
    
    // Wait until spinning is complete
    if (this.spinning) {
      setTimeout(() => this.updateFinalSymbols(), 100);
      return;
    }
    
    // Update symbols to match final results
    // We need to arrange visible symbols to match finalSymbols
    const visibleIndices = this.getVisibleSymbolIndices();
    
    for (let i = 0; i < this.finalSymbols.length; i++) {
      const symbolIndex = visibleIndices[i];
      if (symbolIndex !== undefined) {
        // Update symbol type and texture
        this.symbolTypes[symbolIndex] = this.finalSymbols[i];
        
        // Update sprite texture (would need the textures reference here)
        // this.symbols[symbolIndex].texture = textures[this.finalSymbols[i]];
      }
    }
  }

  // Get indices of currently visible symbols
  getVisibleSymbolIndices(): number[] {
    const indices = [];
    const offset = Math.floor(this.position / SYMBOL_SIZE) % this.symbols.length;
    
    // Find the visible symbols based on current position
    for (let i = 0; i < this.numSymbols; i++) {
      const index = (offset + i) % this.symbols.length;
      indices.push(index);
    }
    
    return indices;
  }

  // Get the symbol types currently visible in the reel
  getVisibleSymbols(): string[] {
    const visibleIndices = this.getVisibleSymbolIndices();
    return visibleIndices.map(index => this.symbolTypes[index]);
  }

  // Highlight winning symbols
  highlightSymbol(symbolIndex: number, color?: string) {
    const visibleIndices = this.getVisibleSymbolIndices();
    if (symbolIndex < 0 || symbolIndex >= visibleIndices.length) return;
    
    const index = visibleIndices[symbolIndex];
    const symbol = this.symbols[index];
    
    // Create highlight effect
    gsap.to(symbol, {
      alpha: 0.5,
      duration: 0.2,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        gsap.to(symbol, { alpha: 1, duration: 0.2 });
      }
    });
  }

  getReelContainer() {
    return this.container;
  }
}

// Props interface
interface EnhancedSlotMachineProps {
  numReels?: number;
  numRows?: number;
  className?: string;
  initialBalance?: number;
  showWinLines?: boolean;
}

const EnhancedSlotMachine: React.FC<EnhancedSlotMachineProps> = ({
  numReels = 5,
  numRows = 3,
  className = '',
  initialBalance = 1000,
  showWinLines = true
}) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const reelsRef = useRef<Reel[]>([]);
  const winLinesRef = useRef<PIXI.Graphics[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [balance, setBalance] = useState(initialBalance);
  const [betAmount, setBetAmount] = useState(10);
  const [winAmount, setWinAmount] = useState(0);
  const [winLineIndex, setWinLineIndex] = useState<number | null>(null);
  const texturesRef = useRef<Record<string, PIXI.Texture>>({});
  
  // Clamp to supported values
  const safeNumReels = Math.min(MAX_REELS, Math.max(3, numReels));
  const safeNumRows = Math.min(MAX_ROWS, Math.max(3, numRows));
  
  // Setup PIXI application and reels
  useEffect(() => {
    // Clean up any previous application
    if (appRef.current) {
      appRef.current.destroy(true, true);
      appRef.current = null;
    }
    
    if (pixiContainerRef.current) {
      pixiContainerRef.current.innerHTML = '';
    }
    
    // Create PIXI application
    if (!pixiContainerRef.current) return;
    
    // Calculate optimal size based on reels and rows
    const reelHeight = safeNumRows * SYMBOL_SIZE + 40;
    
    const app = new PIXI.Application({
      width: REEL_WIDTH * safeNumReels + 40,
      height: reelHeight,
      backgroundColor: 0x2C3E50, // Dark blue background
      resolution: window.devicePixelRatio || 1,
      antialias: true,
    });
    
    pixiContainerRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;
    
    // Create container for reels
    const reelContainer = new PIXI.Container();
    reelContainer.x = 20;
    reelContainer.y = 20;
    app.stage.addChild(reelContainer);
    
    // Create mask for reels (only show visible rows)
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(reelContainer.x, reelContainer.y, REEL_WIDTH * safeNumReels, SYMBOL_SIZE * safeNumRows);
    mask.endFill();
    app.stage.addChild(mask);
    reelContainer.mask = mask;
    
    // Create container for win lines
    const winLineContainer = new PIXI.Container();
    winLineContainer.x = reelContainer.x;
    winLineContainer.y = reelContainer.y;
    app.stage.addChild(winLineContainer);
    
    // Load textures for symbols
    const symbolTextures: Record<string, PIXI.Texture> = {};
    const fallbackTextures: Record<string, PIXI.Texture> = {};
    
    // Symbol image paths
    const symbolImages = {
      'wild': '/assets/symbols/wild.png',
      'scatter': '/assets/symbols/scatter.png',
      'high_1': '/assets/symbols/high_1.png',
      'high_2': '/assets/symbols/high_2.png',
      'high_3': '/assets/symbols/high_3.png',
      'mid_1': '/assets/symbols/mid_1.png',
      'mid_2': '/assets/symbols/mid_2.png',
      'low_1': '/assets/symbols/low_1.png',
      'low_2': '/assets/symbols/low_2.png',
      'low_3': '/assets/symbols/low_3.png'
    };
    
    // Try Western mockup assets as backup
    const mockupImages = {
      'wild': '/assets/mockups/western/symbols/wild.png',
      'scatter': '/assets/mockups/western/symbols/scatter.png',
      'high_1': '/assets/mockups/western/symbols/high_1.png',
      'high_2': '/assets/mockups/western/symbols/high_2.png',
      'high_3': '/assets/mockups/western/symbols/high_3.png',
      'mid_1': '/assets/mockups/western/symbols/mid_1.png',
      'mid_2': '/assets/mockups/western/symbols/mid_2.png',
      'low_1': '/assets/mockups/western/symbols/low_1.png',
      'low_2': '/assets/mockups/western/symbols/low_2.png',
      'low_3': '/assets/mockups/western/symbols/low_3.png'
    };
    
    // Colors for fallback symbols if images fail to load
    const fallbackColors = {
      'wild': 0xFFD700, // Gold
      'scatter': 0x9C27B0, // Purple
      'high_1': 0xF44336, // Red
      'high_2': 0xE91E63, // Pink
      'high_3': 0x9C27B0, // Purple
      'mid_1': 0x3F51B5, // Indigo
      'mid_2': 0x2196F3, // Blue
      'low_1': 0x4CAF50, // Green
      'low_2': 0xFF9800, // Orange
      'low_3': 0xFF5722  // Deep Orange
    };
    
    // Create fallback textures with colored rectangles and labels
    Object.keys(SYMBOL_CONFIG).forEach(symbolType => {
      const fallbackGraphic = new PIXI.Graphics();
      fallbackGraphic.beginFill(fallbackColors[symbolType] || 0xCCCCCC);
      fallbackGraphic.drawRect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE);
      fallbackGraphic.endFill();
      
      const label = new PIXI.Text(symbolType.toUpperCase(), {
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
      fallbackTextures[symbolType] = texture;
      symbolTextures[symbolType] = texture; // Use fallback initially
    });
    
    // Store textures in ref for later use
    texturesRef.current = symbolTextures;
    
    // Load actual symbol images
    const loadTextures = async () => {
      try {
        // Try to load symbol images first
        for (const [symbolType, imagePath] of Object.entries(symbolImages)) {
          try {
            const texture = await PIXI.Assets.load(imagePath);
            symbolTextures[symbolType] = texture;
          } catch (err) {
            console.log(`Failed to load ${imagePath}, trying mockup...`);
            // Try mockup image as fallback
            try {
              const mockupTexture = await PIXI.Assets.load(mockupImages[symbolType]);
              symbolTextures[symbolType] = mockupTexture;
            } catch (mockupErr) {
              console.log(`Failed to load mockup for ${symbolType}, using fallback`);
              // Keep using the fallback texture
            }
          }
        }
        
        // Update textures ref with loaded textures
        texturesRef.current = symbolTextures;
        
        // Create reels with loaded textures
        reelsRef.current = [];
        for (let i = 0; i < safeNumReels; i++) {
          const reel = new Reel(symbolTextures, i * REEL_WIDTH, safeNumRows);
          reelsRef.current.push(reel);
          reelContainer.addChild(reel.getReelContainer());
        }
      } catch (error) {
        console.error("Error loading textures:", error);
        
        // Create reels with fallback textures
        reelsRef.current = [];
        for (let i = 0; i < safeNumReels; i++) {
          const reel = new Reel(fallbackTextures, i * REEL_WIDTH, safeNumRows);
          reelsRef.current.push(reel);
          reelContainer.addChild(reel.getReelContainer());
        }
      }
    };
    
    loadTextures();
    
    // Create win lines if needed
    if (showWinLines) {
      createWinLines(winLineContainer);
    }
    
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
  }, [safeNumReels, safeNumRows, showWinLines]);
  
  // Create win lines visualization
  const createWinLines = (container: PIXI.Container) => {
    // Clear previous win lines
    winLinesRef.current.forEach(line => {
      container.removeChild(line);
    });
    winLinesRef.current = [];
    
    // Define colors for win lines
    const winLineColors = [
      0xff0000, 0x00ff00, 0x0000ff, 
      0xffff00, 0xff00ff, 0x00ffff,
      0xff8000, 0x8000ff, 0x00ff80
    ];
    
    // Create a line for each win pattern
    WIN_LINES.forEach((line, index) => {
      const graphics = new PIXI.Graphics();
      const color = winLineColors[index % winLineColors.length];
      
      graphics.lineStyle(3, color, 0.8);
      
      // Draw the line connecting symbols
      if (line.length > 0) {
        const startX = line[0].reel * REEL_WIDTH + REEL_WIDTH / 2;
        const startY = line[0].row * SYMBOL_SIZE + SYMBOL_SIZE / 2;
        
        graphics.moveTo(startX, startY);
        
        for (let i = 1; i < line.length; i++) {
          const x = line[i].reel * REEL_WIDTH + REEL_WIDTH / 2;
          const y = line[i].row * SYMBOL_SIZE + SYMBOL_SIZE / 2;
          graphics.lineTo(x, y);
        }
      }
      
      // Hide initially
      graphics.alpha = 0;
      
      container.addChild(graphics);
      winLinesRef.current.push(graphics);
    });
  };
  
  // Start the slot machine spin
  const handleSpin = () => {
    if (isSpinning) return;
    
    // Deduct bet amount from balance
    if (balance < betAmount) return; // Not enough balance
    setBalance(prevBalance => prevBalance - betAmount);
    
    setIsSpinning(true);
    setWinAmount(0);
    
    // Hide any active win lines
    hideWinLines();
    
    // Prepare result symbols for each reel (can be random or predetermined)
    reelsRef.current.forEach(reel => {
      reel.prepareResults(); // Random results
    });
    
    // Spin each reel with a slight delay
    reelsRef.current.forEach((reel, i) => {
      reel.spin(2, i * 0.2);
    });
    
    // Check for wins after all reels have stopped
    const spinDuration = 2 + (reelsRef.current.length - 1) * 0.2 + 0.5; // Additional 0.5s for safety
    
    setTimeout(() => {
      checkWins();
      setIsSpinning(false);
    }, spinDuration * 1000);
  };
  
  // Check for winning combinations
  const checkWins = () => {
    let totalWin = 0;
    let winningLineIndex = -1;
    
    // Convert reel results to a 2D grid for easier win checking
    const grid: string[][] = [];
    for (let row = 0; row < safeNumRows; row++) {
      grid[row] = [];
      for (let reel = 0; reel < reelsRef.current.length; reel++) {
        const symbols = reelsRef.current[reel].getVisibleSymbols();
        grid[row][reel] = symbols[row];
      }
    }
    
    // Check each win line
    WIN_LINES.forEach((line, lineIndex) => {
      // Only check win lines that match our grid dimensions
      if (line.some(pos => pos.reel >= safeNumReels || pos.row >= safeNumRows)) {
        return; // Skip this win line
      }
      
      const lineSymbols: string[] = [];
      line.forEach(position => {
        const { reel, row } = position;
        lineSymbols.push(grid[row][reel]);
      });
      
      // Evaluate win
      const winAmount = evaluateWin(lineSymbols);
      if (winAmount > 0) {
        totalWin += winAmount * betAmount;
        
        // Track the highest paying win line for highlighting
        if (winningLineIndex === -1 || winAmount > evaluateWin(WIN_LINES[winningLineIndex].map(pos => grid[pos.row][pos.reel]))) {
          winningLineIndex = lineIndex;
        }
      }
    });
    
    // Update balance and win amount
    if (totalWin > 0) {
      setBalance(prevBalance => prevBalance + totalWin);
      setWinAmount(totalWin);
      
      // Highlight the winning line
      showWinLine(winningLineIndex);
      
      // Highlight winning symbols
      if (winningLineIndex >= 0) {
        const winLine = WIN_LINES[winningLineIndex];
        winLine.forEach(position => {
          const { reel, row } = position;
          if (reelsRef.current[reel]) {
            reelsRef.current[reel].highlightSymbol(row);
          }
        });
      }
      
      // Play win animation effect (big, medium, small)
      playWinAnimation(totalWin);
    }
  };
  
  // Evaluate a specific symbol combination for wins
  const evaluateWin = (symbols: string[]): number => {
    if (symbols.length < 3) return 0;
    
    // Count sequence of matching symbols from left to right
    const firstSymbol = symbols[0];
    let count = 1;
    
    for (let i = 1; i < symbols.length; i++) {
      const currentSymbol = symbols[i];
      
      // Check if current symbol matches or is a wild
      const isMatch = currentSymbol === firstSymbol || 
                      (SYMBOL_CONFIG[currentSymbol]?.isWild) || 
                      (SYMBOL_CONFIG[firstSymbol]?.isWild);
      
      if (isMatch) {
        count++;
      } else {
        break; // No more matches
      }
    }
    
    // Get win amount from paytable based on count
    // For wilds, use their own paytable, otherwise use the first symbol's paytable
    const symbolType = SYMBOL_CONFIG[firstSymbol]?.isWild ? 'wild' : firstSymbol;
    
    // Return the win amount if it exists in the paytable, otherwise 0
    return SYMBOL_CONFIG[symbolType]?.payouts[count] || 0;
  };
  
  // Show a specific win line
  const showWinLine = (lineIndex: number) => {
    if (lineIndex < 0 || lineIndex >= winLinesRef.current.length) return;
    
    // Hide all win lines first
    hideWinLines();
    
    // Show and animate the selected win line
    const line = winLinesRef.current[lineIndex];
    gsap.to(line, { alpha: 1, duration: 0.3 });
    
    // Pulse animation
    gsap.to(line, {
      alpha: 0.4,
      duration: 0.5,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        gsap.to(line, { alpha: 0, duration: 0.3 });
      }
    });
    
    setWinLineIndex(lineIndex);
  };
  
  // Hide all win lines
  const hideWinLines = () => {
    winLinesRef.current.forEach(line => {
      gsap.to(line, { alpha: 0, duration: 0.3 });
    });
    setWinLineIndex(null);
  };
  
  // Play win animation based on win amount
  const playWinAnimation = (amount: number) => {
    const winMultiplier = amount / betAmount;
    
    // Different animation based on win size
    if (winMultiplier >= 20) {
      // Big win
      playBigWinAnimation();
    } else if (winMultiplier >= 10) {
      // Medium win
      playMediumWinAnimation();
    } else {
      // Small win
      playSmallWinAnimation();
    }
  };
  
  // Big win animation with particles and text
  const playBigWinAnimation = () => {
    if (!appRef.current) return;
    
    // Create big win text
    const bigWinText = new PIXI.Text('BIG WIN!', {
      fontFamily: 'Arial',
      fontSize: 60,
      fontWeight: 'bold',
      fill: ['#FFD700', '#FFA500'], // Gold gradient
      strokeThickness: 5,
      stroke: '#000000',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowDistance: 3
    });
    
    bigWinText.anchor.set(0.5);
    bigWinText.x = appRef.current.screen.width / 2;
    bigWinText.y = appRef.current.screen.height / 2;
    bigWinText.alpha = 0;
    
    appRef.current.stage.addChild(bigWinText);
    
    // Animate text
    gsap.to(bigWinText, {
      alpha: 1,
      duration: 0.5,
      ease: 'bounce.out',
      onComplete: () => {
        gsap.to(bigWinText, {
          scale: 1.2,
          duration: 1,
          yoyo: true,
          repeat: 2,
          ease: 'elastic.inOut(1, 0.3)',
          onComplete: () => {
            gsap.to(bigWinText, {
              alpha: 0,
              duration: 0.5,
              onComplete: () => {
                appRef.current?.stage.removeChild(bigWinText);
              }
            });
          }
        });
      }
    });
    
    // Add coin particle effects throughout the animation
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        createCoinParticle();
      }, i * 100);
    }
  };
  
  // Medium win animation
  const playMediumWinAnimation = () => {
    if (!appRef.current) return;
    
    // Create medium win text
    const mediumWinText = new PIXI.Text('GREAT WIN!', {
      fontFamily: 'Arial',
      fontSize: 40,
      fontWeight: 'bold',
      fill: ['#4FC3F7', '#2196F3'], // Blue gradient
      strokeThickness: 4,
      stroke: '#000000'
    });
    
    mediumWinText.anchor.set(0.5);
    mediumWinText.x = appRef.current.screen.width / 2;
    mediumWinText.y = appRef.current.screen.height / 2;
    mediumWinText.alpha = 0;
    
    appRef.current.stage.addChild(mediumWinText);
    
    // Animate text
    gsap.to(mediumWinText, {
      alpha: 1,
      duration: 0.3,
      onComplete: () => {
        gsap.to(mediumWinText, {
          scale: 1.1,
          duration: 0.8,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.to(mediumWinText, {
              alpha: 0,
              duration: 0.3,
              onComplete: () => {
                appRef.current?.stage.removeChild(mediumWinText);
              }
            });
          }
        });
      }
    });
    
    // Add a few particle effects
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        createCoinParticle();
      }, i * 150);
    }
  };
  
  // Small win animation
  const playSmallWinAnimation = () => {
    if (!appRef.current) return;
    
    // Create small win text
    const smallWinText = new PIXI.Text('WIN!', {
      fontFamily: 'Arial',
      fontSize: 30,
      fontWeight: 'bold',
      fill: ['#FFEB3B', '#FFC107'], // Yellow gradient
      strokeThickness: 3,
      stroke: '#000000'
    });
    
    smallWinText.anchor.set(0.5);
    smallWinText.x = appRef.current.screen.width / 2;
    smallWinText.y = appRef.current.screen.height / 2;
    smallWinText.alpha = 0;
    
    appRef.current.stage.addChild(smallWinText);
    
    // Animate text
    gsap.to(smallWinText, {
      alpha: 1,
      duration: 0.2,
      onComplete: () => {
        gsap.to(smallWinText, {
          scale: 1.05,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: 'power1.inOut',
          onComplete: () => {
            gsap.to(smallWinText, {
              alpha: 0,
              duration: 0.2,
              onComplete: () => {
                appRef.current?.stage.removeChild(smallWinText);
              }
            });
          }
        });
      }
    });
    
    // Just a few particles for small win
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        createCoinParticle();
      }, i * 200);
    }
  };
  
  // Create a single coin particle effect
  const createCoinParticle = () => {
    if (!appRef.current) return;
    
    // Create a coin sprite
    const coin = new PIXI.Graphics();
    coin.beginFill(0xFFD700);
    coin.drawCircle(0, 0, 10);
    coin.endFill();
    
    // Add inner detail to make it look like a coin
    coin.lineStyle(1, 0xFFA500);
    coin.drawCircle(0, 0, 6);
    
    // Random position near the center
    const centerX = appRef.current.screen.width / 2;
    const centerY = appRef.current.screen.height / 2;
    
    coin.x = centerX + (Math.random() - 0.5) * 100;
    coin.y = centerY + (Math.random() - 0.5) * 100;
    
    appRef.current.stage.addChild(coin);
    
    // Random velocity
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    // Animate the coin
    gsap.to(coin, {
      x: coin.x + vx * 40,
      y: coin.y + vy * 40,
      rotation: Math.random() * Math.PI * 4,
      alpha: 0,
      duration: 1 + Math.random(),
      ease: 'power1.out',
      onComplete: () => {
        appRef.current?.stage.removeChild(coin);
      }
    });
  };
  
  // Handle bet amount changes
  const adjustBet = (amount: number) => {
    const newBet = Math.max(1, Math.min(100, betAmount + amount));
    setBetAmount(newBet);
  };
  
  // Max bet function
  const maxBet = () => {
    const maxPossibleBet = Math.min(100, balance);
    setBetAmount(maxPossibleBet);
  };
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Game canvas */}
      <div className="relative mb-4">
        <div 
          ref={pixiContainerRef} 
          className="border-4 border-gray-800 rounded-lg overflow-hidden shadow-lg" 
          style={{
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.3)',
            background: 'linear-gradient(to bottom, #1a2a38, #2c3e50)',
            width: `${REEL_WIDTH * safeNumReels + 40}px`,
            height: `${safeNumRows * SYMBOL_SIZE + 40}px`
          }}
        ></div>
        
        {/* Win amount overlay */}
        {winAmount > 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
            <span className="text-yellow-400 font-bold text-2xl animate-pulse">
              WIN: ${winAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      {/* Game controls */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xl bg-gray-800 p-4 rounded-lg shadow-md">
        {/* Balance display */}
        <div className="col-span-1 bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">BALANCE</div>
          <div className="text-white font-bold text-xl">${balance.toFixed(2)}</div>
        </div>
        
        {/* Bet controls */}
        <div className="col-span-1 bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">BET</div>
          <div className="flex items-center">
            <button 
              onClick={() => adjustBet(-1)} 
              disabled={isSpinning || betAmount <= 1}
              className={`w-8 h-8 flex items-center justify-center rounded 
                ${isSpinning || betAmount <= 1 ? 'bg-gray-600 text-gray-400' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
            >-</button>
            <div className="flex-1 text-center text-white font-bold">
              ${betAmount.toFixed(2)}
            </div>
            <button 
              onClick={() => adjustBet(1)} 
              disabled={isSpinning || betAmount >= 100 || betAmount >= balance}
              className={`w-8 h-8 flex items-center justify-center rounded 
                ${isSpinning || betAmount >= 100 || betAmount >= balance ? 'bg-gray-600 text-gray-400' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
            >+</button>
          </div>
        </div>
        
        {/* Win display */}
        <div className="col-span-1 bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">WIN</div>
          <div className={`text-white font-bold text-xl ${winAmount > 0 ? 'text-yellow-400' : ''}`}>
            ${winAmount.toFixed(2)}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={maxBet}
              disabled={isSpinning || balance <= 0}
              className={`px-4 py-2 rounded-lg text-white text-sm font-bold
                ${isSpinning || balance <= 0 ? 'bg-gray-600' : 'bg-yellow-700 hover:bg-yellow-600'}`}
            >
              MAX BET
            </button>
            <button
              onClick={() => adjustBet(5)}
              disabled={isSpinning || betAmount >= 100 || betAmount + 5 > balance}
              className={`px-4 py-2 rounded-lg text-white text-sm font-bold
                ${isSpinning || betAmount >= 100 || betAmount + 5 > balance ? 'bg-gray-600' : 'bg-green-700 hover:bg-green-600'}`}
            >
              +5
            </button>
          </div>
        </div>
        
        {/* Spin button */}
        <div className="col-span-1">
          <button
            onClick={handleSpin}
            disabled={isSpinning || betAmount > balance}
            className={`w-full h-full px-4 py-2 text-xl font-bold text-white rounded-lg shadow-lg 
              transform transition-all duration-150
              ${isSpinning || betAmount > balance
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:bg-red-800 active:scale-95'
              }`}
            style={{
              boxShadow: isSpinning 
                ? '0 4px 6px rgba(0, 0, 0, 0.1)' 
                : '0 10px 15px rgba(0, 0, 0, 0.2), 0 0 8px rgba(255, 0, 0, 0.4)'
            }}
          >
            {isSpinning ? 'SPINNING' : 'SPIN'}
          </button>
        </div>
      </div>
      
      {/* Win lines guide (optional) */}
      {showWinLines && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg w-full max-w-xl">
          <div className="text-gray-300 text-sm mb-2">Win Lines:</div>
          <div className="grid grid-cols-3 gap-2">
            {WIN_LINES.slice(0, 9).map((_, index) => (
              <button
                key={index}
                onClick={() => !isSpinning && showWinLine(index)}
                className={`px-2 py-1 text-xs rounded-md 
                  ${winLineIndex === index ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Line {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSlotMachine;