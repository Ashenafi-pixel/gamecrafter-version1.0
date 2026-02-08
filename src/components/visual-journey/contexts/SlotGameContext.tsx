import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

// Game state interface
interface SlotGameState {
  balance: number;
  bet: number;
  win: number;
  isSpinning: boolean;
  isAutoplayActive: boolean;
  autoplayCount: number;
  isSoundEnabled: boolean;
  volume: number;
  showSettings: boolean;
  showMenu: boolean;
  turboMode: boolean;
  showAnimations: boolean;
}

// Action types
type SlotGameAction =
  | { type: 'SPIN_START' }
  | { type: 'SPIN_END'; payload: { win: number } }
  | { type: 'SET_BET'; payload: number }
  | { type: 'SET_BALANCE'; payload: number }
  | { type: 'TOGGLE_AUTOPLAY' }
  | { type: 'SET_AUTOPLAY_COUNT'; payload: number }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'TOGGLE_MENU' }
  | { type: 'SET_TURBO_MODE'; payload: boolean }
  | { type: 'TOGGLE_ANIMATIONS' };

// Initial state
const initialState: SlotGameState = {
  balance: 1000,
  bet: 1,
  win: 0,
  isSpinning: false,
  isAutoplayActive: false,
  autoplayCount: 0,
  isSoundEnabled: true,
  volume: 50,
  showSettings: false,
  showMenu: false,
  turboMode: false,
  showAnimations: true,
};

// Reducer
function slotGameReducer(state: SlotGameState, action: SlotGameAction): SlotGameState {
  switch (action.type) {
    case 'SPIN_START':
      return {
        ...state,
        isSpinning: true,
        balance: state.balance - state.bet,
        win: 0,
      };
    
    case 'SPIN_END':
      return {
        ...state,
        isSpinning: false,
        balance: state.balance + action.payload.win,
        win: action.payload.win,
        autoplayCount: state.isAutoplayActive ? Math.max(0, state.autoplayCount - 1) : 0,
        isAutoplayActive: state.isAutoplayActive && state.autoplayCount > 1,
      };
    
    case 'SET_BET':
      return {
        ...state,
        bet: action.payload,
      };
    
    case 'SET_BALANCE':
      return {
        ...state,
        balance: action.payload,
      };
    
    case 'TOGGLE_AUTOPLAY':
      return {
        ...state,
        isAutoplayActive: !state.isAutoplayActive,
        autoplayCount: !state.isAutoplayActive ? 10 : 0, // Default to 10 spins
      };
    
    case 'SET_AUTOPLAY_COUNT':
      return {
        ...state,
        autoplayCount: action.payload,
      };
    
    case 'TOGGLE_SOUND':
      return {
        ...state,
        isSoundEnabled: !state.isSoundEnabled,
      };
    
    case 'SET_VOLUME':
      return {
        ...state,
        volume: action.payload,
      };
    
    case 'TOGGLE_SETTINGS':
      return {
        ...state,
        showSettings: !state.showSettings,
      };
    
    case 'TOGGLE_MENU':
      return {
        ...state,
        showMenu: !state.showMenu,
      };
    
    case 'SET_TURBO_MODE':
      return {
        ...state,
        turboMode: action.payload,
      };
    
    case 'TOGGLE_ANIMATIONS':
      return {
        ...state,
        showAnimations: !state.showAnimations,
      };
    
    default:
      return state;
  }
}

// Context
interface SlotGameContextType {
  state: SlotGameState;
  dispatch: React.Dispatch<SlotGameAction>;
  spin: () => void;
  toggleAutoplay: () => void;
  toggleSound: () => void;
  toggleSettings: () => void;
  toggleMenu: () => void;
  setBet: (bet: number) => void;
  setTurboMode: (turbo: boolean) => void;
}

export const SlotGameContext = createContext<SlotGameContextType | undefined>(undefined);

// Provider props
interface SlotGameProviderProps {
  children: ReactNode;
  customButtons?: any;
}

// Provider component
export const SlotGameProvider: React.FC<SlotGameProviderProps> = ({ children, customButtons }) => {
  const [state, dispatch] = useReducer(slotGameReducer, initialState);

  // Helper functions
  const spin = () => {
    if (!state.isSpinning && state.balance >= state.bet) {
      dispatch({ type: 'SPIN_START' });
      
      // Simulate spin duration
      const spinDuration = state.turboMode ? 1000 : 2500;
      
      setTimeout(() => {
        // Simulate win calculation (simplified)
        const random = Math.random();
        let winAmount = 0;
        
        if (random > 0.7) {
          winAmount = state.bet * (2 + Math.floor(Math.random() * 10));
        }
        
        dispatch({ type: 'SPIN_END', payload: { win: winAmount } });
      }, spinDuration);
    }
  };

  const toggleAutoplay = () => {
    dispatch({ type: 'TOGGLE_AUTOPLAY' });
  };

  const toggleSound = () => {
    dispatch({ type: 'TOGGLE_SOUND' });
  };

  const toggleSettings = () => {
    dispatch({ type: 'TOGGLE_SETTINGS' });
  };

  const toggleMenu = () => {
    dispatch({ type: 'TOGGLE_MENU' });
  };

  const setBet = (bet: number) => {
    dispatch({ type: 'SET_BET', payload: bet });
  };

  const setTurboMode = (turbo: boolean) => {
    dispatch({ type: 'SET_TURBO_MODE', payload: turbo });
  };

  // Auto-spin effect
  useEffect(() => {
    if (state.isAutoplayActive && !state.isSpinning && state.autoplayCount > 0) {
      const timer = setTimeout(() => {
        spin();
      }, 500); // Small delay between auto-spins
      
      return () => clearTimeout(timer);
    }
  }, [state.isAutoplayActive, state.isSpinning, state.autoplayCount]);

  // Sound effect
  useEffect(() => {
    if (state.isSoundEnabled && state.isSpinning) {
      // Play spin sound - using try/catch to prevent errors
      try {
        const audio = new Audio('/sounds/tick.mp3');
        audio.volume = state.volume / 100;
        audio.play().catch(() => {
          // Silently ignore sound errors
        });
      } catch (e) {
        // Ignore any audio creation errors
      }
    }
  }, [state.isSpinning, state.isSoundEnabled, state.volume]);

  const value: SlotGameContextType = {
    state,
    dispatch,
    spin,
    toggleAutoplay,
    toggleSound,
    toggleSettings,
    toggleMenu,
    setBet,
    setTurboMode,
  };

  return (
    <SlotGameContext.Provider value={value}>
      {children}
    </SlotGameContext.Provider>
  );
};

// Hook
export const useSlotGame = () => {
  const context = useContext(SlotGameContext);
  if (!context) {
    throw new Error('useSlotGame must be used within a SlotGameProvider');
  }
  return context;
};