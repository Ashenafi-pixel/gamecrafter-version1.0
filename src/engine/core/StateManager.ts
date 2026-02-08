/**
 * StateManager - Manages the game state with proper transitions and validation
 */

import { GameState, GameStatus, StateListener } from './interfaces';

export class StateManager {
  private state: GameState;
  private listeners: Set<StateListener> = new Set();
  private stateHistory: GameState[] = [];
  private maxHistorySize: number = 10;

  constructor(initialState?: Partial<GameState>) {
    // Initialize with default state
    this.state = {
      config: null as any,
      status: 'initializing',
      currentSymbols: [],
      reelPositions: [],
      isSpinning: false,
      currentSpinId: null,
      lastWin: null,
      totalWin: 0,
      consecutiveWins: 0,
      balance: 1000,
      currentBet: 1,
      activeFeatures: [],
      freeSpinsRemaining: 0,
      currentMultiplier: 1,
      ...initialState
    };
  }

  /**
   * Get current state
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Get specific state value by path
   */
  getStateValue<T>(path: string): T {
    const keys = path.split('.');
    let value: any = this.state;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        throw new Error(`State path "${path}" not found`);
      }
    }
    
    return value as T;
  }

  /**
   * Update state with partial updates
   */
  setState(updates: Partial<GameState>): void {
    const previousState = { ...this.state };
    
    // Validate status transitions
    if (updates.status && !this.canTransition(updates.status)) {
      console.error(`Invalid state transition: ${this.state.status} → ${updates.status}`);
      return;
    }
    
    // Update state
    this.state = {
      ...this.state,
      ...updates
    };
    
    // Add to history
    this.addToHistory(previousState);
    
    // Notify listeners
    this.notifyListeners(this.state, previousState);
  }

  /**
   * Update nested state value by path
   */
  updateState(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    // Navigate to parent object
    let target: any = this.state;
    for (const key of keys) {
      if (!target[key]) {
        target[key] = {};
      }
      target = target[key];
    }
    
    // Store previous state
    const previousState = { ...this.state };
    
    // Update value
    target[lastKey] = value;
    
    // Notify listeners
    this.notifyListeners(this.state, previousState);
  }

  /**
   * Transition to a new status
   */
  async transition(to: GameStatus): Promise<void> {
    if (!this.canTransition(to)) {
      throw new Error(`Cannot transition from ${this.state.status} to ${to}`);
    }
    
    console.log(`🔄 State transition: ${this.state.status} → ${to}`);
    
    // Perform any async operations needed for transition
    switch (to) {
      case 'ready':
        // Ensure everything is ready
        if (!this.state.config) {
          throw new Error('Cannot transition to ready without configuration');
        }
        break;
        
      case 'spinning':
        // Ensure we can spin
        if (this.state.balance < this.state.currentBet) {
          throw new Error('Insufficient balance');
        }
        break;
    }
    
    this.setState({ status: to });
  }

  /**
   * Check if transition is valid
   */
  canTransition(to: GameStatus): boolean {
    const from = this.state.status;
    
    // Define valid transitions
    const validTransitions: Record<GameStatus, GameStatus[]> = {
      'initializing': ['ready', 'error'],
      'ready': ['spinning', 'error'],
      'spinning': ['stopping', 'error'],
      'stopping': ['evaluating', 'error'],
      'evaluating': ['showing_win', 'ready', 'error'],
      'showing_win': ['ready', 'feature_active', 'error'],
      'feature_active': ['ready', 'showing_win', 'error'],
      'error': ['initializing', 'ready']
    };
    
    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to specific path changes
   */
  subscribeToPath(path: string, listener: StateListener): () => void {
    const wrappedListener: StateListener = (state, prevState) => {
      // Check if the specific path changed
      try {
        const currentValue = this.getValueByPath(state, path);
        const previousValue = this.getValueByPath(prevState, path);
        
        if (currentValue !== previousValue) {
          listener(state, prevState);
        }
      } catch (error) {
        // Path doesn't exist, ignore
      }
    };
    
    return this.subscribe(wrappedListener);
  }

  /**
   * Get value by path from object
   */
  private getValueByPath(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(state: GameState, previousState: GameState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state, previousState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Add state to history
   */
  private addToHistory(state: GameState): void {
    this.stateHistory.push(state);
    
    // Limit history size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Get state history
   */
  getHistory(): GameState[] {
    return [...this.stateHistory];
  }

  /**
   * Clear state history
   */
  clearHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Reset to initial state
   */
  reset(initialState?: Partial<GameState>): void {
    const previousState = { ...this.state };
    
    this.state = {
      config: null as any,
      status: 'initializing',
      currentSymbols: [],
      reelPositions: [],
      isSpinning: false,
      currentSpinId: null,
      lastWin: null,
      totalWin: 0,
      consecutiveWins: 0,
      balance: 1000,
      currentBet: 1,
      activeFeatures: [],
      freeSpinsRemaining: 0,
      currentMultiplier: 1,
      ...initialState
    };
    
    this.clearHistory();
    this.notifyListeners(this.state, previousState);
  }

  /**
   * Serialize state to JSON
   */
  serialize(): string {
    return JSON.stringify(this.state);
  }

  /**
   * Deserialize state from JSON
   */
  deserialize(json: string): void {
    try {
      const previousState = { ...this.state };
      this.state = JSON.parse(json);
      this.notifyListeners(this.state, previousState);
    } catch (error) {
      console.error('Failed to deserialize state:', error);
      throw error;
    }
  }

  /**
   * Destroy the state manager and clean up
   */
  destroy(): void {
    this.listeners.clear();
    this.stateHistory = [];
    this.reset();
  }
}