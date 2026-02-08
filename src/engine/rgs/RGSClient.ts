import { 
  IRGSClient, 
  SpinRequest, 
  SpinResponse, 
  GameState,
  BetConfiguration,
  PlayerBalance,
  GameSession,
  RGSConfig
} from '../core/interfaces';

/**
 * Mock RGS Client for MVP
 * In production, this would communicate with a real RGS server
 */
export class RGSClient implements IRGSClient {
  private config: RGSConfig;
  private session: GameSession | null = null;
  private mockBalance: PlayerBalance = {
    currency: 'USD',
    cash: 1000.00,
    bonus: 0,
    total: 1000.00
  };
  private betConfig: BetConfiguration = {
    minBet: 0.10,
    maxBet: 100.00,
    defaultBet: 1.00,
    availableBets: [0.10, 0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00],
    coinValues: [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00],
    defaultCoinValue: 0.10,
    maxLines: 20,
    defaultLines: 20
  };
  
  constructor(config: RGSConfig) {
    this.config = config;
  }
  
  async connect(): Promise<void> {
    console.log('🔌 Connecting to RGS...');
    
    // Simulate connection delay
    await this.delay(500);
    
    // Create mock session
    this.session = {
      id: this.generateSessionId(),
      gameId: this.config.gameId,
      playerId: this.config.playerId || 'demo-player',
      currency: 'USD',
      startTime: new Date(),
      lastActivity: new Date()
    };
    
    console.log('✅ Connected to RGS');
  }
  
  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting from RGS...');
    
    await this.delay(200);
    this.session = null;
    
    console.log('✅ Disconnected from RGS');
  }
  
  async spin(request: SpinRequest): Promise<SpinResponse> {
    console.log('🎰 Processing spin request:', request);
    
    if (!this.session) {
      throw new Error('Not connected to RGS');
    }
    
    // Validate bet
    if (request.bet < this.betConfig.minBet || request.bet > this.betConfig.maxBet) {
      throw new Error(`Invalid bet amount: ${request.bet}`);
    }
    
    // Check balance
    if (request.bet > this.mockBalance.total) {
      throw new Error('Insufficient balance');
    }
    
    // Simulate server processing
    await this.delay(300);
    
    // Deduct bet
    this.mockBalance.cash -= request.bet;
    this.mockBalance.total = this.mockBalance.cash + this.mockBalance.bonus;
    
    // Generate random result
    const symbols = this.generateRandomSymbols(request.reels, request.rows);
    const wins = this.evaluateWins(symbols, request.bet, request.lines);
    const totalWin = wins.reduce((sum, win) => sum + win.amount, 0);
    
    // Add winnings
    this.mockBalance.cash += totalWin;
    this.mockBalance.total = this.mockBalance.cash + this.mockBalance.bonus;
    
    // Update session
    this.session.lastActivity = new Date();
    
    const response: SpinResponse = {
      success: true,
      transactionId: this.generateTransactionId(),
      symbols,
      wins,
      totalWin,
      balance: { ...this.mockBalance },
      timestamp: new Date(),
      nextState: totalWin > 0 ? 'win' : 'ready',
      features: this.checkFeatures(symbols)
    };
    
    console.log('✅ Spin complete:', response);
    
    return response;
  }
  
  async getGameState(): Promise<GameState> {
    if (!this.session) {
      throw new Error('Not connected to RGS');
    }
    
    return {
      sessionId: this.session.id,
      gameId: this.session.gameId,
      playerId: this.session.playerId,
      balance: { ...this.mockBalance },
      betConfig: { ...this.betConfig },
      currentBet: this.betConfig.defaultBet,
      currentLines: this.betConfig.defaultLines,
      features: {
        freeSpins: 0,
        multiplier: 1,
        wild: true,
        scatter: true,
        bonus: false
      },
      history: []
    };
  }
  
  async getBalance(): Promise<PlayerBalance> {
    if (!this.session) {
      throw new Error('Not connected to RGS');
    }
    
    return { ...this.mockBalance };
  }
  
  async updateBalance(amount: number): Promise<PlayerBalance> {
    if (!this.session) {
      throw new Error('Not connected to RGS');
    }
    
    this.mockBalance.cash += amount;
    this.mockBalance.total = this.mockBalance.cash + this.mockBalance.bonus;
    
    return { ...this.mockBalance };
  }
  
  async getBetConfiguration(): Promise<BetConfiguration> {
    return { ...this.betConfig };
  }
  
  isConnected(): boolean {
    return this.session !== null;
  }
  
  // Mock data generation methods
  
  private generateRandomSymbols(reels: number, rows: number): string[][] {
    const availableSymbols = [
      'wild', 'scatter',
      'high_1', 'high_2', 'high_3',
      'medium_1', 'medium_2',
      'low_1', 'low_2', 'low_3'
    ];
    
    const symbols: string[][] = [];
    
    for (let reel = 0; reel < reels; reel++) {
      const reelSymbols: string[] = [];
      
      for (let row = 0; row < rows; row++) {
        // Weighted random selection
        const random = Math.random();
        let symbol: string;
        
        if (random < 0.02) {
          symbol = 'wild';
        } else if (random < 0.05) {
          symbol = 'scatter';
        } else if (random < 0.15) {
          symbol = availableSymbols[2 + Math.floor(Math.random() * 3)]; // high
        } else if (random < 0.35) {
          symbol = availableSymbols[5 + Math.floor(Math.random() * 2)]; // medium
        } else {
          symbol = availableSymbols[7 + Math.floor(Math.random() * 3)]; // low
        }
        
        reelSymbols.push(symbol);
      }
      
      symbols.push(reelSymbols);
    }
    
    return symbols;
  }
  
  private evaluateWins(symbols: string[][], bet: number, lines: number): any[] {
    const wins: any[] = [];
    
    // Simple line win evaluation (horizontal lines only for MVP)
    for (let row = 0; row < symbols[0].length; row++) {
      const line: string[] = [];
      for (let reel = 0; reel < symbols.length; reel++) {
        line.push(symbols[reel][row]);
      }
      
      // Check for matching symbols
      const firstSymbol = line[0] === 'wild' ? line[1] : line[0];
      let matchCount = 1;
      
      for (let i = 1; i < line.length; i++) {
        if (line[i] === firstSymbol || line[i] === 'wild') {
          matchCount++;
        } else {
          break;
        }
      }
      
      // Award win for 3+ matches
      if (matchCount >= 3) {
        const multiplier = this.getSymbolMultiplier(firstSymbol, matchCount);
        const winAmount = bet * multiplier;
        
        wins.push({
          type: 'line',
          lineId: row + 1,
          symbol: firstSymbol,
          count: matchCount,
          positions: Array.from({ length: matchCount }, (_, i) => ({ reel: i, row })),
          amount: winAmount,
          multiplier
        });
      }
    }
    
    // Check for scatter wins
    const scatterCount = this.countScatters(symbols);
    if (scatterCount >= 3) {
      const multiplier = scatterCount === 3 ? 5 : scatterCount === 4 ? 20 : 100;
      const winAmount = bet * multiplier;
      
      wins.push({
        type: 'scatter',
        symbol: 'scatter',
        count: scatterCount,
        positions: this.getScatterPositions(symbols),
        amount: winAmount,
        multiplier
      });
    }
    
    return wins;
  }
  
  private getSymbolMultiplier(symbol: string, count: number): number {
    const payTable: Record<string, number[]> = {
      'wild': [0, 0, 10, 50, 200],
      'scatter': [0, 0, 5, 20, 100],
      'high_1': [0, 0, 5, 25, 100],
      'high_2': [0, 0, 4, 20, 80],
      'high_3': [0, 0, 3, 15, 60],
      'medium_1': [0, 0, 2, 10, 40],
      'medium_2': [0, 0, 2, 8, 30],
      'low_1': [0, 0, 1, 5, 20],
      'low_2': [0, 0, 1, 4, 15],
      'low_3': [0, 0, 1, 3, 10]
    };
    
    return payTable[symbol]?.[count - 1] || 0;
  }
  
  private countScatters(symbols: string[][]): number {
    let count = 0;
    symbols.forEach(reel => {
      reel.forEach(symbol => {
        if (symbol === 'scatter') count++;
      });
    });
    return count;
  }
  
  private getScatterPositions(symbols: string[][]): Array<{reel: number, row: number}> {
    const positions: Array<{reel: number, row: number}> = [];
    symbols.forEach((reel, reelIndex) => {
      reel.forEach((symbol, rowIndex) => {
        if (symbol === 'scatter') {
          positions.push({ reel: reelIndex, row: rowIndex });
        }
      });
    });
    return positions;
  }
  
  private checkFeatures(symbols: string[][]): any {
    const scatterCount = this.countScatters(symbols);
    
    return {
      triggeredBonus: scatterCount >= 3,
      freeSpinsAwarded: scatterCount >= 3 ? scatterCount * 5 : 0,
      multiplierAwarded: 1
    };
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}