import * as PIXI from 'pixi.js';

// Types for the configuration object
export interface PreviewReelConfig {
  // Reel dimensions and layout
  reelCount: number;
  rowCount: number;
  symbolWidth: number;
  symbolHeight: number;
  symbolPadding: number;
  
  // Animation timing
  spinDuration: number;
  reelStartDelay: number;
  bounceDistance: number;
  bounceDuration: number;
  
  // Visual settings
  blurAmount: number;
  easeInDuration: number;
  easeOutDuration: number;
  
  // Symbol appearance
  symbolBorderColor: string;
  symbolBackgroundColor: string;
  symbolColors: string[];
  
  // Animation settings
  anticipationDuration: number;
  anticipationShakeIntensity: number;
  enableAnticipation: boolean;
  
  // Additional settings for enhanced animations
  glowEnabled?: boolean;
  glowIntensity?: number;
  shakeEnabled?: boolean;
  shakeIntensity?: number;
  easeType?: string; // For GSAP easing functions
}

// Result types
export type WinResultType = 'no-win' | 'small-win' | 'medium-win' | 'big-win' | 'mega-win' | 'feature-trigger';

// Default configurations
export const DEFAULT_REEL_CONFIG: PreviewReelConfig = {
  reelCount: 5,
  rowCount: 3,
  symbolWidth: 100,
  symbolHeight: 100,
  symbolPadding: 10,
  
  spinDuration: 2,
  reelStartDelay: 0.2,
  bounceDistance: 20,
  bounceDuration: 0.5,
  
  blurAmount: 10,
  easeInDuration: 0.5,
  easeOutDuration: 0.7,
  
  symbolBorderColor: '#444444',
  symbolBackgroundColor: '#222222',
  symbolColors: ['#FF5252', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4', '#F44336', '#8BC34A'],
  
  anticipationDuration: 1.5,
  anticipationShakeIntensity: 5,
  enableAnticipation: true
};

export class PreviewReelController {
  // PIXI Container references
  private container: PIXI.Container;
  private reelContainers: PIXI.Container[] = [];
  private symbolContainers: PIXI.Container[][] = [];
  private symbolSprites: PIXI.Sprite[][] = [];
  
  // Configuration
  private config: PreviewReelConfig;
  
  // State tracking
  private isSpinning: boolean = false;
  private completedReels: number = 0;
  private canvasWidth: number;
  private canvasHeight: number;
  
  // Callback references
  private onSpinComplete: (() => void) | null = null;
  
  constructor(
    container: PIXI.Container,
    config: Partial<PreviewReelConfig> = {},
    canvasWidth: number = 800,
    canvasHeight: number = 480
  ) {
    this.container = container;
    this.config = { ...DEFAULT_REEL_CONFIG, ...config };
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    this.setupReels();
  }
  
  // Update configuration without rebuilding everything
  public updateConfig(newConfig: Partial<PreviewReelConfig>): void {
    // Update the configuration
    this.config = { ...this.config, ...newConfig };
    
    // Update visual properties that can be changed on the fly
    this.updateVisualProperties();
  }
  
  // Update visual properties based on current config
  private updateVisualProperties(): void {
    // Update symbol colors, borders, sizes etc.
    for (let reelIndex = 0; reelIndex < this.reelContainers.length; reelIndex++) {
      for (let symbolIndex = 0; symbolIndex < this.symbolContainers[reelIndex].length; symbolIndex++) {
        const symbolContainer = this.symbolContainers[reelIndex][symbolIndex];
        
        // Find background graphic (usually the first child)
        const background = symbolContainer.children.find(
          child => child instanceof PIXI.Graphics
        ) as PIXI.Graphics | undefined;
        
        if (background) {
          // Clear existing graphics
          background.clear();
          
          // Redraw with new colors and styles
          background.beginFill(this.config.symbolBackgroundColor);
          background.lineStyle(2, this.config.symbolBorderColor);
          background.drawRect(0, 0, this.config.symbolWidth, this.config.symbolHeight);
          background.endFill();
        }
        
        // Update symbol sprite if needed
        const symbolSprite = this.symbolSprites[reelIndex][symbolIndex];
        if (symbolSprite) {
          // Update position if size changed
          symbolSprite.x = this.config.symbolWidth / 2;
          symbolSprite.y = this.config.symbolHeight / 2;
        }
      }
    }
    
    // Update reel positions if necessary
    this.updateReelPositions();
  }
  
  // Update reel positions based on current configuration
  private updateReelPositions(): void {
    // Calculate grid dimensions
    const gridWidth = this.config.reelCount * (this.config.symbolWidth + this.config.symbolPadding) - this.config.symbolPadding;
    const gridHeight = this.config.rowCount * (this.config.symbolHeight + this.config.symbolPadding) - this.config.symbolPadding;
    
    // Position the grid in the center of the canvas
    const gridX = (this.canvasWidth - gridWidth) / 2;
    const gridY = (this.canvasHeight - gridHeight) / 2;
    
    // Update each reel position
    for (let reelIndex = 0; reelIndex < this.reelContainers.length; reelIndex++) {
      const reelContainer = this.reelContainers[reelIndex];
      reelContainer.x = gridX + reelIndex * (this.config.symbolWidth + this.config.symbolPadding);
      reelContainer.y = gridY;
    }
  }
  
  // Reset the reel to its initial state
  public reset(): void {
    // Stop any ongoing animations
    this.isSpinning = false;
    this.completedReels = 0;
    
    // Reset all reel positions
    this.updateReelPositions();
    
    // Reset symbols to default state (no highlights, etc.)
    for (let reelIndex = 0; reelIndex < this.reelContainers.length; reelIndex++) {
      for (let symbolIndex = 0; symbolIndex < this.symbolContainers[reelIndex].length; symbolIndex++) {
        const symbolContainer = this.symbolContainers[reelIndex][symbolIndex];
        
        // Reset any transformations
        symbolContainer.scale.set(1);
        symbolContainer.alpha = 1;
        symbolContainer.rotation = 0;
        
        // Reset y position for proper alignment
        symbolContainer.y = symbolIndex * (this.config.symbolHeight + this.config.symbolPadding);
      }
    }
  }
  
  // Set up the initial reel structure
  private setupReels(): void {
    // Calculate grid dimensions
    const gridWidth = this.config.reelCount * (this.config.symbolWidth + this.config.symbolPadding) - this.config.symbolPadding;
    const gridHeight = this.config.rowCount * (this.config.symbolHeight + this.config.symbolPadding) - this.config.symbolPadding;
    
    // Position the grid in the center of the canvas
    const gridX = (this.canvasWidth - gridWidth) / 2;
    const gridY = (this.canvasHeight - gridHeight) / 2;
    
    // Create reel containers
    for (let reelIndex = 0; reelIndex < this.config.reelCount; reelIndex++) {
      // Create reel container
      const reelContainer = new PIXI.Container();
      reelContainer.x = gridX + reelIndex * (this.config.symbolWidth + this.config.symbolPadding);
      reelContainer.y = gridY;
      this.container.addChild(reelContainer);
      this.reelContainers.push(reelContainer);
      
      // Initialize symbol containers and sprites arrays for this reel
      this.symbolContainers[reelIndex] = [];
      this.symbolSprites[reelIndex] = [];
      
      // Create visible symbols (rows) for this reel
      // We create more symbols than visible for the spinning effect
      const totalSymbols = this.config.rowCount + 3; // Extra symbols for seamless scrolling
      
      for (let symbolIndex = 0; symbolIndex < totalSymbols; symbolIndex++) {
        const symbolContainer = new PIXI.Container();
        symbolContainer.y = symbolIndex * (this.config.symbolHeight + this.config.symbolPadding);
        
        // Create symbol background
        const background = new PIXI.Graphics();
        background.beginFill(this.config.symbolBackgroundColor);
        background.lineStyle(2, this.config.symbolBorderColor);
        background.drawRect(0, 0, this.config.symbolWidth, this.config.symbolHeight);
        background.endFill();
        symbolContainer.addChild(background);
        
        // Create symbol sprite with random color
        const symbolSprite = this.createSymbolSprite(symbolIndex % 10); // Use symbol index to make them different
        symbolSprite.x = this.config.symbolWidth / 2;
        symbolSprite.y = this.config.symbolHeight / 2;
        symbolContainer.addChild(symbolSprite);
        
        reelContainer.addChild(symbolContainer);
        this.symbolContainers[reelIndex].push(symbolContainer);
        this.symbolSprites[reelIndex].push(symbolSprite);
      }
    }
  }
  
  // Create a simple symbol sprite (can be replaced with actual images)
  private createSymbolSprite(symbolId: number): PIXI.Sprite {
    const graphics = new PIXI.Graphics();
    const colorIndex = symbolId % this.config.symbolColors.length;
    const color = this.config.symbolColors[colorIndex];
    
    // Draw a basic shape based on symbolId
    graphics.beginFill(color);
    
    if (symbolId % 3 === 0) {
      // Circle
      graphics.drawCircle(0, 0, this.config.symbolWidth * 0.35);
    } else if (symbolId % 3 === 1) {
      // Square
      const size = this.config.symbolWidth * 0.6;
      graphics.drawRect(-size/2, -size/2, size, size);
    } else {
      // Diamond
      const size = this.config.symbolWidth * 0.35;
      graphics.moveTo(0, -size);
      graphics.lineTo(size, 0);
      graphics.lineTo(0, size);
      graphics.lineTo(-size, 0);
      graphics.closePath();
    }
    
    graphics.endFill();
    
    // Create a sprite from the graphics object
    const texture = PIXI.RenderTexture.create({
      width: this.config.symbolWidth,
      height: this.config.symbolHeight
    });
    
    const app = this.container.parent;
    if (app && 'renderer' in app) {
      const renderer = app.renderer as PIXI.Renderer;
      renderer.render(graphics, { renderTexture: texture });
    }
    
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    
    return sprite;
  }
  
  // Update symbol textures based on result
  private updateSymbols(reelIndex: number, symbols: number[]): void {
    // Ensure we have enough symbols
    const symbolCount = Math.min(symbols.length, this.config.rowCount);
    
    // Update the visible symbols
    for (let i = 0; i < symbolCount; i++) {
      const symbolId = symbols[i];
      const sprite = this.symbolSprites[reelIndex][i];
      
      // Replace with new symbol
      const newSymbolSprite = this.createSymbolSprite(symbolId);
      sprite.texture = newSymbolSprite.texture;
    }
  }
  
  // Show a sample spin with predefined result
  public previewSpin(resultType: WinResultType = 'no-win', callback?: () => void): void {
    if (this.isSpinning) return;
    
    this.isSpinning = true;
    this.completedReels = 0;
    this.onSpinComplete = callback || null;
    
    // Predefined sample results based on resultType
    const sampleResults: Record<WinResultType, number[][]> = {
      'no-win': [
        [1, 3, 5],
        [2, 4, 6],
        [3, 5, 7],
        [4, 6, 8],
        [5, 7, 9]
      ],
      'small-win': [
        [1, 1, 1],
        [2, 4, 6],
        [3, 5, 7],
        [4, 6, 8],
        [5, 7, 9]
      ],
      'medium-win': [
        [2, 2, 2],
        [2, 2, 2],
        [3, 5, 7],
        [4, 6, 8],
        [5, 7, 9]
      ],
      'big-win': [
        [3, 3, 3],
        [3, 3, 3],
        [3, 3, 3],
        [4, 6, 8],
        [5, 7, 9]
      ],
      'mega-win': [
        [9, 9, 9],
        [9, 9, 9],
        [9, 9, 9],
        [9, 9, 9],
        [5, 7, 9]
      ],
      'feature-trigger': [
        [10, 4, 10],
        [5, 10, 7],
        [10, 5, 10],
        [4, 10, 8],
        [5, 7, 10]
      ]
    };
    
    const result = sampleResults[resultType];
    
    // Spin with predefined end positions
    this.startSpinAnimation(result);
  }
  
  // Start the spin animation for all reels
  private startSpinAnimation(endResult: number[][]): void {
    // Apply anticipation for feature triggers or big wins if enabled
    if (this.config.enableAnticipation) {
      this.playAnticipationEffect();
    }
    
    // Start spinning each reel with a delay
    for (let i = 0; i < this.reelContainers.length; i++) {
      const delay = i * (this.config.reelStartDelay * 1000);
      
      setTimeout(() => {
        this.spinSingleReel(i, endResult[i]);
      }, delay);
    }
  }
  
  // Play an anticipation effect before revealing the final symbols
  private playAnticipationEffect(): void {
    // Simple shake effect for the entire grid
    let shakeTime = 0;
    const shakeInterval = setInterval(() => {
      shakeTime += 1;
      
      if (shakeTime > this.config.anticipationDuration * 10) {
        clearInterval(shakeInterval);
        this.container.x = 0;
        this.container.y = 0;
        return;
      }
      
      // Apply random shake
      const intensity = this.config.anticipationShakeIntensity;
      this.container.x = (Math.random() - 0.5) * intensity;
      this.container.y = (Math.random() - 0.5) * intensity;
    }, 50);
  }
  
  // Spin a single reel
  private spinSingleReel(reelIndex: number, endSymbols: number[]): void {
    const reel = this.reelContainers[reelIndex];
    
    // Calculate the total distance to travel
    const totalSpinDistance = this.config.symbolHeight * 10; // Spin 10 symbols worth of distance
    
    // Starting position
    const initialY = reel.y;
    
    // We'll manually animate as we don't have GSAP
    let progress = 0;
    let lastTime = performance.now();
    
    // Animation loop
    const animate = () => {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000; // Convert to seconds
      lastTime = now;
      
      progress += deltaTime / this.config.spinDuration;
      
      if (progress < 1) {
        // Easing function for acceleration and deceleration
        let easedProgress = progress;
        
        // Ease in (acceleration)
        if (progress < this.config.easeInDuration / this.config.spinDuration) {
          easedProgress = (progress / (this.config.easeInDuration / this.config.spinDuration)) ** 2;
        } 
        // Ease out (deceleration)
        else if (progress > 1 - (this.config.easeOutDuration / this.config.spinDuration)) {
          const t = (progress - (1 - (this.config.easeOutDuration / this.config.spinDuration))) / 
                    (this.config.easeOutDuration / this.config.spinDuration);
          easedProgress = 1 - ((1 - t) ** 2);
        }
        
        // Apply position
        reel.y = initialY - (totalSpinDistance * easedProgress);
        
        // Add blur based on speed
        // We would apply blur here if PIXI filters were configured
        
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        // Reset position but update symbols to show end result
        reel.y = initialY;
        this.updateSymbols(reelIndex, endSymbols);
        
        // Add bounce effect
        this.addBounceEffect(reelIndex, () => this.onReelComplete(reelIndex));
      }
    };
    
    // Start animation
    animate();
  }
  
  // Add bounce effect after a reel stops
  private addBounceEffect(reelIndex: number, callback: () => void): void {
    const reel = this.reelContainers[reelIndex];
    const bounceAmount = this.config.bounceDistance;
    
    // Bounce animation
    let progress = 0;
    let lastTime = performance.now();
    
    const animate = () => {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      
      progress += deltaTime / this.config.bounceDuration;
      
      if (progress < 1) {
        // Elastic formula
        const t = progress;
        const elasticOut = Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
        
        // Apply bounce
        reel.y = -bounceAmount * (1 - elasticOut);
        
        requestAnimationFrame(animate);
      } else {
        // Bounce complete
        reel.y = 0;
        callback();
      }
    };
    
    // Start bounce animation
    animate();
  }
  
  // Handle reel completion
  private onReelComplete(reelIndex: number): void {
    this.completedReels++;
    
    // Check if all reels have completed
    if (this.completedReels >= this.reelContainers.length) {
      this.isSpinning = false;
      
      // Call completion callback if provided
      if (this.onSpinComplete) {
        this.onSpinComplete();
      }
    }
  }
  
  // Play win animation based on win type
  public playWinAnimation(winType: WinResultType): void {
    // This would integrate with the existing animation system
    if (winType === 'no-win') return;
    
    // Highlight winning symbols
    this.highlightWinningSymbols(winType);
    
    // This would call the appropriate win animation based on type
    console.log(`Playing ${winType} animation`);
  }
  
  // Highlight winning symbols based on win type
  private highlightWinningSymbols(winType: WinResultType): void {
    // Determine which symbols to highlight based on win type
    let rowToHighlight = 1; // Middle row by default
    
    switch (winType) {
      case 'small-win':
        // Highlight the first 3 symbols on the top row
        rowToHighlight = 0;
        this.addGlowToSymbols(rowToHighlight, 0, 3);
        break;
        
      case 'medium-win':
        // Highlight the first 2 rows of symbols on 2 reels
        this.addGlowToSymbols(0, 0, 2);
        this.addGlowToSymbols(1, 0, 2);
        break;
        
      case 'big-win':
        // Highlight all symbols on the middle row
        rowToHighlight = 1;
        this.addGlowToSymbols(rowToHighlight, 0, this.config.reelCount);
        break;
        
      case 'mega-win':
        // Highlight all symbols
        for (let row = 0; row < this.config.rowCount; row++) {
          this.addGlowToSymbols(row, 0, this.config.reelCount);
        }
        break;
        
      case 'feature-trigger':
        // Highlight scatter symbols which would be at specific positions
        this.addGlowToSymbols(0, 0, 1);
        this.addGlowToSymbols(1, 1, 1);
        this.addGlowToSymbols(2, 2, 1);
        break;
    }
  }
  
  // Add glow effect to specific symbols
  private addGlowToSymbols(row: number, startReel: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const reelIndex = startReel + i;
      if (reelIndex < this.reelContainers.length && row < this.symbolContainers[reelIndex].length) {
        const symbolContainer = this.symbolContainers[reelIndex][row];
        
        // Create a pulse animation for the symbol
        let alpha = 0;
        let increasing = true;
        const pulseInterval = setInterval(() => {
          if (increasing) {
            alpha += 0.05;
            if (alpha >= 1) {
              alpha = 1;
              increasing = false;
            }
          } else {
            alpha -= 0.05;
            if (alpha <= 0.3) {
              alpha = 0.3;
              increasing = true;
            }
          }
          
          // Apply glow effect by changing scale slightly
          const scale = 1 + (alpha * 0.1);
          symbolContainer.scale.set(scale);
          
          // We'd add a proper glow filter here if filters were set up
        }, 50);
        
        // Store the interval for cleanup
        setTimeout(() => {
          clearInterval(pulseInterval);
          symbolContainer.scale.set(1);
        }, 3000);
      }
    }
  }
  
  // Clean up resources when done
  public destroy(): void {
    // Remove all containers from the parent
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    
    // Clean up all child containers
    this.reelContainers.forEach(reel => {
      reel.destroy({ children: true });
    });
    
    // Clear arrays
    this.reelContainers = [];
    this.symbolContainers = [];
    this.symbolSprites = [];
  }
}