import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { ProfessionalReelStrip } from './ProfessionalReelStrip';
import { GlowFilter } from '@pixi/filter-glow';

/**
 * Professional Slot Machine Controller
 * Manages multiple reel strips and coordinates animations
 * 
 * Features:
 * - Coordinated reel spinning with staggered stops
 * - Win detection and celebration animations
 * - Anticipation effects for special symbols
 * - Free spins transitions
 * - Big win celebrations
 */
export class ProfessionalSlotMachine {
  private reelStrips: ProfessionalReelStrip[] = [];
  private reelsContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;
  private particleContainer: PIXI.ParticleContainer;
  
  // Mock reel strips for visual preview
  private mockReelStrips = [
    ['WILD', 'A', 'K', 'SCATTER', 'Q', 'J', '10', '9', 'A', 'K'],
    ['K', 'Q', 'WILD', 'A', 'J', '10', '9', 'SCATTER', 'K', 'Q'],
    ['A', 'SCATTER', 'K', 'Q', 'J', 'WILD', '10', '9', 'A', 'K'],
    ['Q', 'J', '10', 'WILD', '9', 'A', 'K', 'SCATTER', 'Q', 'J'],
    ['WILD', 'K', 'Q', 'J', '10', '9', 'A', 'SCATTER', 'K', 'WILD']
  ];
  
  // Animation state
  private isSpinning = false;
  private currentWin = 0;
  private spinCount = 0;
  
  // Configuration
  private config = {
    reels: 5,
    rows: 3,
    symbolWidth: 140,
    symbolHeight: 140,
    reelSpacing: 10
  };
  
  constructor(
    private app: PIXI.Application,
    private container: PIXI.Container,
    private symbolTextures: Map<string, PIXI.Texture>
  ) {
    console.log(`🎰 ProfessionalSlotMachine constructor - textures: ${symbolTextures.size}`);
    
    // Log texture details
    symbolTextures.forEach((texture, id) => {
      console.log(`  - ${id}: ${texture.valid ? 'valid' : 'loading'} (${texture.width}x${texture.height})`);
    });
    
    // Create containers
    this.reelsContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
    this.particleContainer = new PIXI.ParticleContainer(10000, {
      scale: true,
      position: true,
      rotation: true,
      uvs: true,
      alpha: true
    });
    
    // Add in correct order
    this.container.addChild(this.reelsContainer);
    this.container.addChild(this.effectsContainer);
    this.container.addChild(this.particleContainer);
    
    // Initialize reels
    this.createReels();
    
    // Listen for reel stop events
    this.setupEventListeners();
  }
  
  /**
   * Create reel strips
   */
  private createReels(): void {
    console.log(`🎰 Creating ${this.config.reels} reels...`);
    
    const totalWidth = this.config.reels * this.config.symbolWidth + 
                      (this.config.reels - 1) * this.config.reelSpacing;
    const startX = -totalWidth / 2;
    
    for (let i = 0; i < this.config.reels; i++) {
      const x = startX + i * (this.config.symbolWidth + this.config.reelSpacing);
      const y = -this.config.symbolHeight * this.config.rows / 2;
      
      const reel = new ProfessionalReelStrip(
        i,
        this.config.symbolWidth,
        this.config.symbolHeight,
        x,
        y
      );
      
      // Set textures for this reel
      const reelTextures = this.getTexturesForReel(i);
      console.log(`🎨 Setting ${reelTextures.length} textures for reel ${i}`);
      reel.setSymbolTextures(reelTextures);
      
      this.reelStrips.push(reel);
      this.reelsContainer.addChild(reel.getContainer());
    }
    
    console.log(`✅ Created ${this.reelStrips.length} reels`);
    console.log(`📏 Reels container position: ${this.reelsContainer.x}, ${this.reelsContainer.y}`);
    console.log(`📏 Reels container children: ${this.reelsContainer.children.length}`);
  }
  
  /**
   * Get textures for a specific reel based on mock strips
   */
  private getTexturesForReel(reelIndex: number): PIXI.Texture[] {
    const symbols = this.mockReelStrips[reelIndex];
    const textures: PIXI.Texture[] = [];
    
    console.log(`🎲 Getting textures for reel ${reelIndex}:`);
    
    // If we have very few textures, create a reel strip from what we have
    if (this.symbolTextures.size < 5) {
      console.log(`  ℹ️ Only ${this.symbolTextures.size} textures available, creating simplified reel`);
      
      // Create a reel strip by repeating available textures
      const availableTextures = Array.from(this.symbolTextures.values());
      for (let i = 0; i < 10; i++) {
        textures.push(availableTextures[i % availableTextures.length]);
      }
      
      return textures;
    }
    
    // Otherwise use the normal mock strips but skip missing symbols
    symbols.forEach(symbolId => {
      const texture = this.symbolTextures.get(symbolId);
      if (texture) {
        textures.push(texture);
        console.log(`  ✅ ${symbolId}: found (${texture.valid ? 'valid' : 'loading'})`);
      }
      // Don't add WHITE textures for missing symbols - just skip them
    });
    
    // If we ended up with too few textures, pad with what we have
    if (textures.length < 5) {
      console.log(`  ⚠️ Only ${textures.length} textures for reel, padding...`);
      while (textures.length < 10) {
        textures.push(textures[textures.length % textures.length]);
      }
    }
    
    return textures;
  }
  
  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    let stoppedReels = 0;
    
    window.addEventListener('reelStopped', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      stoppedReels++;
      
      if (stoppedReels === this.config.reels) {
        stoppedReels = 0;
        this.onAllReelsStopped();
      }
    });
  }
  
  /**
   * Spin all reels with professional animation
   */
  async spin(): Promise<void> {
    if (this.isSpinning) return;
    
    this.isSpinning = true;
    this.spinCount++;
    
    // Clear any previous wins
    this.clearWinHighlights();
    
    // Generate random stop positions
    const stopPositions = this.generateStopPositions();
    
    // Check for special upcoming symbols
    const hasScatterWin = this.checkUpcomingScatters(stopPositions);
    const hasWildWin = this.checkUpcomingWilds(stopPositions);
    
    // Start spin animation with staggered timing
    const spinPromises: Promise<void>[] = [];
    
    for (let i = 0; i < this.reelStrips.length; i++) {
      const reel = this.reelStrips[i];
      const stopPosition = stopPositions[i];
      
      // Calculate spin duration with stagger
      let duration = 2 + (i * 0.3); // Each reel spins 0.3s longer
      
      // Add anticipation for special symbols
      if (i >= 2 && (hasScatterWin || hasWildWin)) {
        duration += 0.5; // Slow down last reels for anticipation
      }
      
      // Apply motion blur during spin
      gsap.delayedCall(i * 0.1, () => {
        gsap.to({}, {
          duration: 0.3,
          onUpdate: function() {
            const progress = this.progress();
            reel.setBlur(progress * 8);
          }
        });
      });
      
      // Start spin
      spinPromises.push(
        gsap.delayedCall(i * 0.1, () => reel.spin(stopPosition, duration)).then()
      );
    }
    
    // Play spin sound effect hook
    this.onSpinStart();
    
    // Wait for all reels to complete
    await Promise.all(spinPromises);
  }
  
  /**
   * Quick spin for turbo mode
   */
  async quickSpin(): Promise<void> {
    if (this.isSpinning) return;
    
    this.isSpinning = true;
    const stopPositions = this.generateStopPositions();
    
    const spinPromises = this.reelStrips.map((reel, i) => 
      reel.quickSpin(stopPositions[i])
    );
    
    await Promise.all(spinPromises);
  }
  
  /**
   * Generate random stop positions
   */
  private generateStopPositions(): number[] {
    return this.reelStrips.map((reel, i) => {
      const stripLength = this.mockReelStrips[i].length;
      return Math.floor(Math.random() * stripLength);
    });
  }
  
  /**
   * Check for upcoming scatter symbols
   */
  private checkUpcomingScatters(stopPositions: number[]): boolean {
    let scatterCount = 0;
    
    stopPositions.forEach((pos, reelIndex) => {
      const symbols = this.getSymbolsAtPosition(reelIndex, pos);
      if (symbols.includes('SCATTER')) {
        scatterCount++;
      }
    });
    
    return scatterCount >= 3;
  }
  
  /**
   * Check for upcoming wild symbols
   */
  private checkUpcomingWilds(stopPositions: number[]): boolean {
    let wildCount = 0;
    
    stopPositions.forEach((pos, reelIndex) => {
      const symbols = this.getSymbolsAtPosition(reelIndex, pos);
      if (symbols.includes('WILD')) {
        wildCount++;
      }
    });
    
    return wildCount >= 2;
  }
  
  /**
   * Get symbols at a specific position
   */
  private getSymbolsAtPosition(reelIndex: number, position: number): string[] {
    const strip = this.mockReelStrips[reelIndex];
    const symbols: string[] = [];
    
    for (let i = 0; i < this.config.rows; i++) {
      const index = (position + i) % strip.length;
      symbols.push(strip[index]);
    }
    
    return symbols;
  }
  
  /**
   * Called when all reels have stopped
   */
  private onAllReelsStopped(): void {
    this.isSpinning = false;
    
    // Check for wins
    const winData = this.checkWins();
    
    if (winData.totalWin > 0) {
      this.celebrateWin(winData);
    }
    
    // Emit spin complete event
    window.dispatchEvent(new CustomEvent('spinComplete', {
      detail: { win: winData.totalWin, spinCount: this.spinCount }
    }));
  }
  
  /**
   * Check for winning combinations
   */
  private checkWins(): { totalWin: number; winLines: any[]; winType: string } {
    // Simplified win checking for demo
    const grid = this.getCurrentGrid();
    let totalWin = 0;
    const winLines: any[] = [];
    
    // Check for scatter wins
    let scatterCount = 0;
    grid.forEach(reel => {
      reel.forEach(symbol => {
        if (symbol === 'SCATTER') scatterCount++;
      });
    });
    
    if (scatterCount >= 3) {
      totalWin += 1000 * scatterCount;
      winLines.push({ type: 'scatter', count: scatterCount });
    }
    
    // Check for line wins (simplified)
    const centerLine = grid.map(reel => reel[1]);
    const symbol = centerLine[0];
    let matchCount = 1;
    
    for (let i = 1; i < centerLine.length; i++) {
      if (centerLine[i] === symbol || centerLine[i] === 'WILD') {
        matchCount++;
      } else {
        break;
      }
    }
    
    if (matchCount >= 3) {
      totalWin += 100 * matchCount;
      winLines.push({ type: 'line', symbol, count: matchCount });
    }
    
    // Determine win type
    let winType = 'normal';
    if (totalWin >= 5000) winType = 'mega';
    else if (totalWin >= 2000) winType = 'big';
    else if (scatterCount >= 3) winType = 'freespins';
    
    return { totalWin, winLines, winType };
  }
  
  /**
   * Get current symbol grid
   */
  private getCurrentGrid(): string[][] {
    const grid: string[][] = [];
    
    this.reelStrips.forEach((reel, reelIndex) => {
      const visibleIndices = reel.getVisibleSymbols();
      const symbols = visibleIndices.map(index => 
        this.mockReelStrips[reelIndex][index]
      );
      grid.push(symbols);
    });
    
    return grid;
  }
  
  /**
   * Celebrate win with animations
   */
  private celebrateWin(winData: any): void {
    const { totalWin, winLines, winType } = winData;
    
    // Highlight winning symbols
    this.highlightWinningSymbols(winLines);
    
    // Play win animation based on type
    switch (winType) {
      case 'mega':
        this.playMegaWinAnimation();
        break;
      case 'big':
        this.playBigWinAnimation();
        break;
      case 'freespins':
        this.playFreeSpinsAnimation();
        break;
      default:
        this.playNormalWinAnimation();
    }
    
    // Update win amount
    this.currentWin = totalWin;
  }
  
  /**
   * Highlight winning symbols
   */
  private highlightWinningSymbols(winLines: any[]): void {
    winLines.forEach(line => {
      if (line.type === 'line') {
        // Highlight center row
        for (let i = 0; i < line.count; i++) {
          this.reelStrips[i].highlightSymbol(1); // Center symbol
        }
      } else if (line.type === 'scatter') {
        // Find and highlight all scatters
        const grid = this.getCurrentGrid();
        grid.forEach((reel, reelIndex) => {
          reel.forEach((symbol, rowIndex) => {
            if (symbol === 'SCATTER') {
              this.reelStrips[reelIndex].highlightSymbol(rowIndex);
            }
          });
        });
      }
    });
  }
  
  /**
   * Clear all win highlights
   */
  private clearWinHighlights(): void {
    this.reelStrips.forEach(reel => reel.clearHighlights());
  }
  
  /**
   * Play normal win animation
   */
  private playNormalWinAnimation(): void {
    // Simple coin particles
    this.createCoinBurst(5);
  }
  
  /**
   * Play big win animation
   */
  private playBigWinAnimation(): void {
    // More dramatic effects
    this.createCoinBurst(20);
    this.createStarBurst();
    this.shakeScreen(0.5);
  }
  
  /**
   * Play mega win animation
   */
  private playMegaWinAnimation(): void {
    // Full celebration
    this.createCoinBurst(50);
    this.createStarBurst();
    this.createLightningEffect();
    this.shakeScreen(1);
    
    // Color flash
    const flash = new PIXI.Graphics();
    flash.beginFill(0xffdd00, 0.3);
    flash.drawRect(-2000, -2000, 4000, 4000);
    flash.endFill();
    this.effectsContainer.addChild(flash);
    
    gsap.to(flash, {
      alpha: 0,
      duration: 1,
      ease: "power2.out",
      onComplete: () => flash.destroy()
    });
  }
  
  /**
   * Play free spins animation
   */
  private playFreeSpinsAnimation(): void {
    // Portal effect transition
    const portal = new PIXI.Graphics();
    portal.lineStyle(4, 0x9933ff);
    portal.drawCircle(0, 0, 0);
    this.effectsContainer.addChild(portal);
    
    gsap.to(portal, {
      width: 1000,
      height: 1000,
      alpha: 0,
      duration: 2,
      ease: "power2.out",
      onComplete: () => portal.destroy()
    });
    
    // Mystical particles
    this.createMysticalParticles();
  }
  
  /**
   * Create coin burst effect
   */
  private createCoinBurst(count: number): void {
    const coinTexture = this.createCoinTexture();
    
    for (let i = 0; i < count; i++) {
      const coin = new PIXI.Sprite(coinTexture);
      coin.anchor.set(0.5);
      coin.scale.set(0.5);
      coin.x = (Math.random() - 0.5) * 200;
      coin.y = 0;
      
      this.particleContainer.addChild(coin);
      
      // Animate
      const angle = (Math.PI * 2 * i) / count;
      const distance = 200 + Math.random() * 300;
      
      gsap.to(coin, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 200,
        rotation: Math.random() * Math.PI * 4,
        alpha: 0,
        duration: 2,
        ease: "power2.out",
        onComplete: () => coin.destroy()
      });
    }
  }
  
  /**
   * Create star burst effect
   */
  private createStarBurst(): void {
    const starTexture = this.createStarTexture();
    
    for (let i = 0; i < 30; i++) {
      const star = new PIXI.Sprite(starTexture);
      star.anchor.set(0.5);
      star.scale.set(Math.random() * 0.5 + 0.2);
      star.x = 0;
      star.y = 0;
      star.tint = 0xffdd00;
      
      this.particleContainer.addChild(star);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 300 + Math.random() * 200;
      
      gsap.to(star, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotation: Math.random() * Math.PI * 4,
        scale: 0,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => star.destroy()
      });
    }
  }
  
  /**
   * Create lightning effect
   */
  private createLightningEffect(): void {
    const lightning = new PIXI.Graphics();
    lightning.lineStyle(3, 0xffffff);
    
    // Draw jagged lightning
    const points = [];
    for (let i = 0; i < 10; i++) {
      points.push(
        (Math.random() - 0.5) * 100,
        -200 + (i * 40)
      );
    }
    
    lightning.drawPolygon(points);
    lightning.filters = [new GlowFilter({
      distance: 20,
      outerStrength: 3,
      color: 0x00ddff
    })];
    
    this.effectsContainer.addChild(lightning);
    
    gsap.to(lightning, {
      alpha: 0,
      duration: 0.5,
      repeat: 3,
      yoyo: true,
      onComplete: () => lightning.destroy()
    });
  }
  
  /**
   * Create mystical particles for free spins
   */
  private createMysticalParticles(): void {
    const particleTexture = this.createGlowTexture();
    
    for (let i = 0; i < 50; i++) {
      const particle = new PIXI.Sprite(particleTexture);
      particle.anchor.set(0.5);
      particle.scale.set(Math.random() * 0.3 + 0.1);
      particle.x = (Math.random() - 0.5) * 800;
      particle.y = 300;
      particle.tint = 0x9933ff;
      particle.alpha = 0;
      
      this.particleContainer.addChild(particle);
      
      gsap.to(particle, {
        y: -300,
        alpha: 1,
        duration: 0.5,
        delay: i * 0.05,
        ease: "power2.out"
      });
      
      gsap.to(particle, {
        alpha: 0,
        duration: 0.5,
        delay: 0.5 + i * 0.05,
        ease: "power2.in",
        onComplete: () => particle.destroy()
      });
    }
  }
  
  /**
   * Shake screen effect
   */
  private shakeScreen(intensity: number): void {
    const timeline = gsap.timeline();
    const shakeCount = 10;
    
    for (let i = 0; i < shakeCount; i++) {
      timeline.to(this.container, {
        x: (Math.random() - 0.5) * 20 * intensity,
        y: (Math.random() - 0.5) * 20 * intensity,
        duration: 0.05,
        ease: "none"
      });
    }
    
    timeline.to(this.container, {
      x: 0,
      y: 0,
      duration: 0.1,
      ease: "power2.out"
    });
  }
  
  /**
   * Create coin texture
   */
  private createCoinTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xffdd00);
    graphics.drawCircle(0, 0, 20);
    graphics.endFill();
    graphics.beginFill(0xffaa00);
    graphics.drawCircle(0, 0, 15);
    graphics.endFill();
    
    return this.app.renderer.generateTexture(graphics);
  }
  
  /**
   * Create star texture
   */
  private createStarTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xffffff);
    
    // Draw 5-point star
    const points: number[] = [];
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? 20 : 10;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      points.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      );
    }
    
    graphics.drawPolygon(points);
    graphics.endFill();
    
    return this.app.renderer.generateTexture(graphics);
  }
  
  /**
   * Create glow texture
   */
  private createGlowTexture(): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xffffff);
    graphics.drawCircle(0, 0, 20);
    graphics.endFill();
    graphics.filters = [new PIXI.filters.BlurFilter(10)];
    
    return this.app.renderer.generateTexture(graphics);
  }
  
  /**
   * Hook for spin start
   */
  private onSpinStart(): void {
    window.dispatchEvent(new CustomEvent('slotSpinStart'));
  }
  
  /**
   * Update grid configuration
   */
  updateConfig(reels: number, rows: number): void {
    // Would rebuild reels with new config
    this.config.reels = reels;
    this.config.rows = rows;
    // In production, would recreate reels here
  }
  
  /**
   * Set reel position
   */
  setReelPosition(x: number, y: number): void {
    console.log(`📏 Setting reel position to ${x}, ${y}`);
    this.reelsContainer.x = x;
    this.reelsContainer.y = y;
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.reelStrips.forEach(reel => reel.destroy());
    this.reelsContainer.destroy();
    this.effectsContainer.destroy();
    this.particleContainer.destroy();
  }
}