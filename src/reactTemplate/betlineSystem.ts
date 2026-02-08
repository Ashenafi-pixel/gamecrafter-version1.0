/**
 * Betline System for React Slot Machine Export
 * Provides the same betline animations as the GridPreviewWrapper
 */

export const generateBetlineSystem = () => `
/**
 * BetlineRenderer - Handles betline drawing and animations
 */
export class BetlineRenderer {
  private app: PIXI.Application;
  private betlineContainer: PIXI.Container;
  private activeBetlines: PIXI.Graphics[] = [];
  private betlinePatterns: number[][] = [];
  private gridConfig: { cols: number; rows: number; symbolWidth: number; symbolHeight: number; symbolPadding: number };
  
  constructor(app: PIXI.Application, gridConfig: any) {
    this.app = app;
    this.gridConfig = gridConfig;
    this.betlineContainer = new PIXI.Container();
    this.betlineContainer.name = 'betlines';
    this.betlineContainer.zIndex = 100; // Above symbols but below UI
    
    // Add to stage
    this.app.stage.addChild(this.betlineContainer);
    this.app.stage.sortableChildren = true;
    
    // Generate default betline patterns
    this.generateBetlinePatterns();
  }
  
  /**
   * Generate betline patterns based on grid size
   */
  private generateBetlinePatterns(): void {
    const { cols, rows } = this.gridConfig;
    const patterns: number[][] = [];
    const center = Math.floor(rows / 2);
    
    // Basic lines
    patterns.push(Array(cols).fill(center)); // Middle line
    patterns.push(Array(cols).fill(0)); // Top line
    patterns.push(Array(cols).fill(rows - 1)); // Bottom line
    
    // Diagonal lines
    if (rows >= 3) {
      // Top-left to bottom-right
      patterns.push(Array(cols).fill(0).map((_, i) => Math.min(rows - 1, Math.floor(i * (rows - 1) / (cols - 1)))));
      // Bottom-left to top-right
      patterns.push(Array(cols).fill(0).map((_, i) => Math.max(0, rows - 1 - Math.floor(i * (rows - 1) / (cols - 1)))));
    }
    
    // Zigzag patterns
    patterns.push(Array(cols).fill(0).map((_, i) => i % 2 === 0 ? 0 : 1));
    patterns.push(Array(cols).fill(0).map((_, i) => i % 2 === 0 ? rows - 1 : rows - 2));
    
    // V patterns
    const mid = Math.floor(cols / 2);
    patterns.push(Array(cols).fill(0).map((_, i) => i <= mid ? i : cols - 1 - i));
    patterns.push(Array(cols).fill(0).map((_, i) => i <= mid ? rows - 1 - i : i - mid));
    
    // Generate more patterns up to 20 lines
    while (patterns.length < 20) {
      // Random patterns
      const pattern = Array(cols).fill(0).map(() => Math.floor(Math.random() * rows));
      patterns.push(pattern);
    }
    
    this.betlinePatterns = patterns.slice(0, 20);
    console.log(\`Generated \${this.betlinePatterns.length} betline patterns\`);
  }
  
  /**
   * Draw a single betline
   */
  private drawBetline(pattern: number[], lineIndex: number, color: number = 0xFFD700): PIXI.Graphics {
    const line = new PIXI.Graphics();
    line.lineStyle(4, color, 1);
    
    const points: { x: number; y: number }[] = [];
    
    // Calculate points for each reel position
    for (let col = 0; col < pattern.length; col++) {
      const row = pattern[col];
      const x = col * (this.gridConfig.symbolWidth + this.gridConfig.symbolPadding) + this.gridConfig.symbolWidth / 2;
      const y = row * (this.gridConfig.symbolHeight + this.gridConfig.symbolPadding) + this.gridConfig.symbolHeight / 2;
      points.push({ x, y });
    }
    
    // Draw smooth curve through points
    if (points.length > 0) {
      line.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        if (i === points.length - 1) {
          // Last point - draw straight line
          line.lineTo(points[i].x, points[i].y);
        } else {
          // Smooth curve to next point
          const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.5;
          const cp1y = points[i - 1].y;
          const cp2x = points[i].x - (points[i + 1].x - points[i].x) * 0.3;
          const cp2y = points[i].y;
          
          line.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
        }
      }
    }
    
    // Add line number indicator
    if (points.length > 0) {
      const textStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 16,
        fill: color,
        fontWeight: 'bold',
        stroke: 0x000000,
        strokeThickness: 2
      });
      
      const lineNumber = new PIXI.Text(\`\${lineIndex + 1}\`, textStyle);
      lineNumber.anchor.set(0.5);
      lineNumber.x = points[0].x - 30;
      lineNumber.y = points[0].y;
      line.addChild(lineNumber);
    }
    
    line.alpha = 0; // Start invisible
    line.name = \`betline_\${lineIndex}\`;
    
    return line;
  }
  
  /**
   * Show winning betlines with animation
   */
  async showWinningBetlines(winData: { line: number; positions: { reel: number; row: number }[] }[]): Promise<void> {
    console.log('Showing winning betlines:', winData);
    
    // Clear existing betlines
    this.clearBetlines();
    
    // Colors for different win types
    const colors = [0xFFD700, 0xFF6B35, 0x00FF00, 0xFF1493, 0x00BFFF, 0xFF4500];
    
    // Draw and animate each winning betline
    for (let i = 0; i < winData.length; i++) {
      const win = winData[i];
      const color = colors[i % colors.length];
      
      // Use the actual betline pattern or create from positions
      let pattern: number[];
      if (win.line < this.betlinePatterns.length) {
        pattern = this.betlinePatterns[win.line];
      } else {
        // Create pattern from win positions
        pattern = Array(this.gridConfig.cols).fill(-1);
        win.positions.forEach(pos => {
          if (pos.reel < pattern.length) {
            pattern[pos.reel] = pos.row;
          }
        });
      }
      
      const betline = this.drawBetline(pattern, win.line, color);
      this.betlineContainer.addChild(betline);
      this.activeBetlines.push(betline);
      
      // Animate betline appearance with delay
      await new Promise<void>(resolve => {
        gsap.to(betline, {
          alpha: 1,
          duration: 0.5,
          ease: "power2.out",
          delay: i * 0.2,
          onComplete: resolve
        });
      });
      
      // Add pulsing animation
      gsap.to(betline, {
        alpha: 0.7,
        duration: 0.8,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.clearBetlines();
    }, 5000);
  }
  
  /**
   * Show all betlines for preview (like in BetLinesSetup)
   */
  async showAllBetlines(): Promise<void> {
    this.clearBetlines();
    
    for (let i = 0; i < Math.min(this.betlinePatterns.length, 10); i++) {
      const pattern = this.betlinePatterns[i];
      const betline = this.drawBetline(pattern, i, 0x4A90E2);
      this.betlineContainer.addChild(betline);
      this.activeBetlines.push(betline);
      
      // Animate appearance
      gsap.to(betline, {
        alpha: 0.6,
        duration: 0.3,
        ease: "power2.out",
        delay: i * 0.1
      });
    }
  }
  
  /**
   * Show betlines one by one (animated preview)
   */
  async showBetlinesSequentially(): Promise<void> {
    this.clearBetlines();
    
    for (let i = 0; i < this.betlinePatterns.length; i++) {
      // Clear previous
      this.clearBetlines();
      
      const pattern = this.betlinePatterns[i];
      const betline = this.drawBetline(pattern, i, 0xFFD700);
      this.betlineContainer.addChild(betline);
      this.activeBetlines.push(betline);
      
      // Animate appearance
      await new Promise<void>(resolve => {
        gsap.to(betline, {
          alpha: 1,
          duration: 0.5,
          ease: "power2.out",
          onComplete: resolve
        });
      });
      
      // Hold for 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  /**
   * Clear all betlines
   */
  clearBetlines(): void {
    this.activeBetlines.forEach(betline => {
      gsap.killTweensOf(betline);
      if (betline.parent) {
        betline.parent.removeChild(betline);
      }
      betline.destroy();
    });
    this.activeBetlines = [];
  }
  
  /**
   * Update grid configuration
   */
  updateGridConfig(gridConfig: any): void {
    this.gridConfig = gridConfig;
    this.generateBetlinePatterns();
    this.clearBetlines();
  }
  
  /**
   * Set custom betline patterns
   */
  setBetlinePatterns(patterns: number[][]): void {
    this.betlinePatterns = patterns;
    console.log(\`Updated betline patterns: \${patterns.length} lines\`);
  }
  
  /**
   * Get current betline patterns
   */
  getBetlinePatterns(): number[][] {
    return [...this.betlinePatterns];
  }
  
  /**
   * Destroy the betline renderer
   */
  destroy(): void {
    this.clearBetlines();
    if (this.betlineContainer.parent) {
      this.betlineContainer.parent.removeChild(this.betlineContainer);
    }
    this.betlineContainer.destroy();
  }
}

/**
 * Win Detection System with Betline Support
 */
export class WinDetector {
  private betlinePatterns: number[][];
  private symbols: string[][];
  private paytable: { [symbol: string]: number[] };
  
  constructor(betlinePatterns: number[][], paytable?: { [symbol: string]: number[] }) {
    this.betlinePatterns = betlinePatterns;
    this.paytable = paytable || this.getDefaultPaytable();
  }
  
  private getDefaultPaytable(): { [symbol: string]: number[] } {
    return {
      'wild': [0, 0, 10, 50, 200],
      'scatter': [0, 0, 5, 25, 100],
      'high1': [0, 0, 5, 20, 80],
      'high2': [0, 0, 4, 15, 60],
      'high3': [0, 0, 3, 12, 50],
      'medium1': [0, 0, 2, 8, 30],
      'medium2': [0, 0, 2, 6, 25],
      'medium3': [0, 0, 1, 5, 20],
      'low1': [0, 0, 1, 4, 15],
      'low2': [0, 0, 1, 3, 12],
      'low3': [0, 0, 1, 2, 10]
    };
  }
  
  /**
   * Detect wins on all active betlines
   */
  detectWins(symbols: string[][], activeBetlines: number = 20): { 
    wins: { line: number; symbol: string; count: number; amount: number; positions: { reel: number; row: number }[] }[];
    totalWin: number;
  } {
    const wins: any[] = [];
    let totalWin = 0;
    
    // Check each active betline
    for (let lineIndex = 0; lineIndex < Math.min(activeBetlines, this.betlinePatterns.length); lineIndex++) {
      const pattern = this.betlinePatterns[lineIndex];
      const win = this.checkBetlineWin(symbols, pattern, lineIndex);
      
      if (win) {
        wins.push(win);
        totalWin += win.amount;
      }
    }
    
    return { wins, totalWin };
  }
  
  /**
   * Check a single betline for wins
   */
  private checkBetlineWin(symbols: string[][], pattern: number[], lineIndex: number): any | null {
    if (pattern.length === 0 || symbols.length === 0) return null;
    
    // Get symbols on this betline
    const lineSymbols: string[] = [];
    const positions: { reel: number; row: number }[] = [];
    
    for (let reel = 0; reel < Math.min(pattern.length, symbols.length); reel++) {
      const row = pattern[reel];
      if (row >= 0 && row < symbols[reel].length) {
        lineSymbols.push(symbols[reel][row]);
        positions.push({ reel, row });
      }
    }
    
    if (lineSymbols.length < 3) return null;
    
    // Check for winning combinations (left to right)
    const firstSymbol = lineSymbols[0];
    let matchCount = 1;
    
    // Count consecutive matches (including wilds)
    for (let i = 1; i < lineSymbols.length; i++) {
      const currentSymbol = lineSymbols[i];
      if (currentSymbol === firstSymbol || currentSymbol === 'wild' || firstSymbol === 'wild') {
        matchCount++;
      } else {
        break;
      }
    }
    
    // Check if we have a winning combination (3+ symbols)
    if (matchCount >= 3) {
      const paySymbol = firstSymbol === 'wild' && matchCount < lineSymbols.length ? lineSymbols[1] : firstSymbol;
      const payout = this.paytable[paySymbol] || [0, 0, 1, 2, 5];
      const amount = payout[Math.min(matchCount, payout.length - 1)] || 0;
      
      if (amount > 0) {
        return {
          line: lineIndex,
          symbol: paySymbol,
          count: matchCount,
          amount,
          positions: positions.slice(0, matchCount)
        };
      }
    }
    
    return null;
  }
  
  /**
   * Update betline patterns
   */
  updateBetlinePatterns(patterns: number[][]): void {
    this.betlinePatterns = patterns;
  }
  
  /**
   * Update paytable
   */
  updatePaytable(paytable: { [symbol: string]: number[] }): void {
    this.paytable = paytable;
  }
}
`;