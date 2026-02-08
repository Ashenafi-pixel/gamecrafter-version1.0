import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfessionalAtlasResult } from '../utils/professionalSpriteAtlas';

export type AnimationLabMode = 'simple' | 'advanced';

interface AnimationLabStore {
  // Core state
  mode: AnimationLabMode;
  atlasResult: ProfessionalAtlasResult | null;
  isProcessing: boolean;
  
  // Enhanced state for React 19
  history: Array<{
    id: string;
    mode: AnimationLabMode;
    atlasResult: ProfessionalAtlasResult | null;
    timestamp: Date;
  }>;
  
  // Performance tracking
  lastProcessingTime: number;
  processingStats: {
    totalProcessed: number;
    averageTime: number;
    lastError: string | null;
  };
  
  // Actions
  setMode: (mode: AnimationLabMode) => void;
  toggleMode: () => void;
  setAtlasResult: (result: ProfessionalAtlasResult | null) => void;
  setIsProcessing: (processing: boolean) => void;
  
  // Enhanced actions
  startProcessing: () => void;
  completeProcessing: (result: ProfessionalAtlasResult | null, error?: string) => void;
  saveToHistory: () => void;
  clearHistory: () => void;
  resetStore: () => void;
  
  // Utility actions
  getProcessingStats: () => AnimationLabStore['processingStats'];
  canUndo: () => boolean;
  undo: () => void;
}

export const useAnimationLabStore = create<AnimationLabStore>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'simple',
      atlasResult: null,
      isProcessing: false,
      history: [],
      lastProcessingTime: 0,
      processingStats: {
        totalProcessed: 0,
        averageTime: 0,
        lastError: null
      },

      // Core actions
      setMode: (mode: AnimationLabMode) => {
        console.log(`[AnimationLabStore] Setting mode to: ${mode}`);
        set({ mode });
      },

      toggleMode: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'simple' ? 'advanced' : 'simple';
        console.log(`[AnimationLabStore] Toggling mode from ${currentMode} to ${newMode}`);
        set({ mode: newMode });
      },

      setAtlasResult: (result: ProfessionalAtlasResult | null) => {
        console.log('[AnimationLabStore] Setting atlas result:', result ? 'with data' : 'null');
        set({ atlasResult: result });
      },

      setIsProcessing: (processing: boolean) => {
        console.log(`[AnimationLabStore] Setting processing state: ${processing}`);
        set({ isProcessing: processing });
      },

      // Enhanced actions
      startProcessing: () => {
        console.log('[AnimationLabStore] Starting processing');
        const startTime = Date.now();
        set({
          isProcessing: true,
          lastProcessingTime: startTime,
          processingStats: {
            ...get().processingStats,
            lastError: null
          }
        });
      },

      completeProcessing: (result: ProfessionalAtlasResult | null, error?: string) => {
        const { lastProcessingTime, processingStats } = get();
        const processingDuration = Date.now() - lastProcessingTime;
        
        console.log(`[AnimationLabStore] Processing completed in ${processingDuration}ms`, {
          hasResult: !!result,
          hasError: !!error
        });

        // Update processing statistics
        const newStats = {
          totalProcessed: processingStats.totalProcessed + 1,
          averageTime: Math.round(
            (processingStats.averageTime * processingStats.totalProcessed + processingDuration) /
            (processingStats.totalProcessed + 1)
          ),
          lastError: error || null
        };

        set({
          isProcessing: false,
          atlasResult: result,
          processingStats: newStats
        });

        // Auto-save to history if successful
        if (result && !error) {
          get().saveToHistory();
        }
      },

      saveToHistory: () => {
        const { mode, atlasResult, history } = get();
        
        if (!atlasResult) return;

        const historyEntry = {
          id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          mode,
          atlasResult,
          timestamp: new Date()
        };

        // Keep only last 10 history entries for performance
        const updatedHistory = [historyEntry, ...history].slice(0, 10);
        
        console.log('[AnimationLabStore] Saving to history:', historyEntry.id);
        set({ history: updatedHistory });
      },

      clearHistory: () => {
        console.log('[AnimationLabStore] Clearing history');
        set({ history: [] });
      },

      resetStore: () => {
        console.log('[AnimationLabStore] Resetting store to initial state');
        set({
          mode: 'simple',
          atlasResult: null,
          isProcessing: false,
          history: [],
          lastProcessingTime: 0,
          processingStats: {
            totalProcessed: 0,
            averageTime: 0,
            lastError: null
          }
        });
      },

      // Utility actions
      getProcessingStats: () => {
        return get().processingStats;
      },

      canUndo: () => {
        return get().history.length > 1;
      },

      undo: () => {
        const { history } = get();
        if (history.length <= 1) {
          console.log('[AnimationLabStore] Cannot undo - no history available');
          return;
        }

        // Get the previous state (skip current, take previous)
        const previousState = history[1];
        const newHistory = history.slice(1); // Remove current state from history

        console.log('[AnimationLabStore] Undoing to previous state:', previousState.id);
        set({
          mode: previousState.mode,
          atlasResult: previousState.atlasResult,
          history: newHistory
        });
      }
    }),
    {
      name: 'animation-lab-store',
      partialize: (state) => ({
        mode: state.mode,
        history: state.history,
        processingStats: state.processingStats
      }),
      version: 1
    }
  )
);

// React 19 - Performance-optimized selectors
export const useAnimationLabMode = () => useAnimationLabStore((state) => state.mode);
export const useAtlasResult = () => useAnimationLabStore((state) => state.atlasResult);
export const useIsProcessing = () => useAnimationLabStore((state) => state.isProcessing);
export const useProcessingStats = () => useAnimationLabStore((state) => state.processingStats);
export const useAnimationLabHistory = () => useAnimationLabStore((state) => state.history);

// React 19 - Action-only selectors
export const useAnimationLabActions = () => useAnimationLabStore((state) => ({
  setMode: state.setMode,
  toggleMode: state.toggleMode,
  setAtlasResult: state.setAtlasResult,
  startProcessing: state.startProcessing,
  completeProcessing: state.completeProcessing,
  saveToHistory: state.saveToHistory,
  clearHistory: state.clearHistory,
  resetStore: state.resetStore,
  undo: state.undo
}));

// Backward compatibility hook for existing components
export const useAnimationLab = () => {
  const mode = useAnimationLabMode();
  const atlasResult = useAtlasResult();
  const isProcessing = useIsProcessing();
  const { setMode, toggleMode, setAtlasResult, setIsProcessing } = useAnimationLabActions();

  return {
    mode,
    setMode,
    toggleMode,
    atlasResult,
    setAtlasResult,
    isProcessing,
    setIsProcessing
  };
};