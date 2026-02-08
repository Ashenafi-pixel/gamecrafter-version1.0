import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { GameConfig, AnimationWorkspace, DeviceProfile, MaskPreviewMode } from '../types';
import { CONFIG_DEFAULTS } from '../utils/configDefaults';

// Saved game configuration interface
interface SavedGameConfig {
  id: string;
  name: string;
  createdAt: string;
  config: Partial<GameConfig>;
}

// Enhanced interface for React 19 compatibility
interface GameStore {
  // UI State
  currentStep: number;
  totalSteps: number;
  viewMode: 'simple' | 'advanced';
  isSpinning: boolean;
  gameType: string | null;
  currentQuestion: number;
  answers: Record<string, any>;
  isMobileView: boolean;
  showPreview: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  
  // Animation State
  animationTrigger: {
    type: 'small-win' | 'big-win' | 'mega-win' | 'freespins' | null;
    timestamp: number;
    isPlaying: boolean;
  };
  generatedAnimations: any | null;
  
  // Game Configuration
  config: Partial<GameConfig>;
  savedProgress: Record<string, any>;
  
  // Saved Game Configurations
  savedGameConfigs: SavedGameConfig[];
  
  // Animation Studio State
  animationWorkspace: AnimationWorkspace;
  
  // Enhanced Animation Features
  animationProfiles: Array<{
    id: string;
    name: string;
    settings: Record<string, any>;
    isFavorite?: boolean;
    createdAt: Date;
  }>;
  aiSuggestionsEnabled: boolean;
  performanceMode: 'auto' | 'manual';
  usabilityTracking: boolean;
  
  // React 19 - Enhanced Actions with better typing
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setGameType: (type: string) => void;
  updateConfig: (updates: Partial<GameConfig>) => void;
  saveProgress: () => void;
  toggleSpinning: () => void;
  setViewMode: (mode: 'simple' | 'advanced') => void;
  setAnimationTrigger: (trigger: GameStore['animationTrigger']) => void;
  updateAnimationWorkspace: (updates: Partial<AnimationWorkspace>) => void;
  
  // Game Config Management Actions
  saveGameConfig: (name: string) => void;
  loadGameConfig: (id: string) => void;
  deleteGameConfig: (id: string) => void;
  
  // React 19 - New concurrent-safe actions
  updateAnswer: (questionId: string, answer: any) => void;
  resetAnswers: () => void;
  markUnsavedChanges: () => void;
  clearUnsavedChanges: () => void;
  addAnimationProfile: (profile: Omit<GameStore['animationProfiles'][0], 'id' | 'createdAt'>) => void;
  removeAnimationProfile: (id: string) => void;
  
  // Utility actions
  resetStore: () => void;
  getStoreSnapshot: () => Partial<GameStore>;
}

// Initial configuration
const initialConfig: Partial<GameConfig> = {
  ...CONFIG_DEFAULTS,
  theme: 'modern',
  reels: {
    count: 5,
    symbols: 3,
    ...CONFIG_DEFAULTS?.reels
  }
};

// Enhanced store with React 19 optimizations
export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial State
        currentStep: 0,
        totalSteps: 9,
        viewMode: 'simple',
        isSpinning: false,
        gameType: 'slots',
        currentQuestion: 0,
        answers: {},
        config: initialConfig,
        savedProgress: {},
        savedGameConfigs: [],
        isMobileView: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
        showPreview: false,
        hasUnsavedChanges: false,
        lastSaved: null,
        
        // Animation state
        animationTrigger: {
          type: null,
          timestamp: 0,
          isPlaying: false,
        },
        generatedAnimations: null,
        
        // Animation Studio state
        animationWorkspace: {
          selectedPreset: 'modern',
          maskEditMode: false,
          previewMode: 'normal' as MaskPreviewMode,
          performanceMode: 'desktop' as DeviceProfile,
          showEasingCurve: false
        },
        
        // Enhanced Animation Features
        animationProfiles: [],
        aiSuggestionsEnabled: true,
        performanceMode: 'auto',
        usabilityTracking: true,

        // Navigation Actions
        setStep: (step: number) => set((state) => {
          const safeStep = Math.max(0, Math.min(step, state.totalSteps - 1));
          console.log(`[GameStore] Setting step to ${safeStep}`);
          return {
            currentStep: safeStep,
            hasUnsavedChanges: true
          };
        }),

        nextStep: () => set((state) => {
          const nextStep = Math.min(state.currentStep + 1, state.totalSteps - 1);
          console.log(`[GameStore] Moving to next step: ${nextStep}`);
          return {
            currentStep: nextStep,
            hasUnsavedChanges: true
          };
        }),

        prevStep: () => set((state) => {
          const prevStep = Math.max(state.currentStep - 1, 0);
          console.log(`[GameStore] Moving to previous step: ${prevStep}`);
          return {
            currentStep: prevStep,
            hasUnsavedChanges: true
          };
        }),

        // Game Actions
        setGameType: (type: string) => set(() => {
          console.log(`[GameStore] Setting game type to: ${type}`);
          return {
            gameType: type,
            hasUnsavedChanges: true
          };
        }),

        updateConfig: (updates: Partial<GameConfig>) => set((state) => {
          console.log('[GameStore] Updating config:', updates);
          return {
            config: { ...state.config, ...updates },
            hasUnsavedChanges: true
          };
        }),

        saveProgress: () => set((state) => {
          const snapshot = {
            currentStep: state.currentStep,
            gameType: state.gameType,
            config: state.config,
            answers: state.answers,
            animationProfiles: state.animationProfiles
          };
          
          console.log('[GameStore] Saving progress');
          return {
            savedProgress: snapshot,
            hasUnsavedChanges: false,
            lastSaved: new Date()
          };
        }),

        toggleSpinning: () => set((state) => {
          console.log(`[GameStore] Toggling spinning: ${!state.isSpinning}`);
          return { isSpinning: !state.isSpinning };
        }),

        setViewMode: (mode: 'simple' | 'advanced') => set(() => {
          console.log(`[GameStore] Setting view mode to: ${mode}`);
          return { viewMode: mode };
        }),

        setAnimationTrigger: (trigger) => set(() => {
          console.log('[GameStore] Setting animation trigger:', trigger);
          return { animationTrigger: trigger };
        }),

        updateAnimationWorkspace: (updates: Partial<AnimationWorkspace>) => set((state) => {
          console.log('[GameStore] Updating animation workspace:', updates);
          return {
            animationWorkspace: { ...state.animationWorkspace, ...updates },
            hasUnsavedChanges: true
          };
        }),

        // Game Config Management Actions
        saveGameConfig: (name: string) => set((state) => {
          const newConfig: SavedGameConfig = {
            id: Date.now().toString(),
            name,
            createdAt: new Date().toISOString(),
            config: { ...state.config }
          };
          console.log('[GameStore] Saving game config:', name);
          return {
            savedGameConfigs: [...state.savedGameConfigs, newConfig],
            hasUnsavedChanges: true
          };
        }),

        loadGameConfig: (id: string) => set((state) => {
          const savedConfig = state.savedGameConfigs.find(c => c.id === id);
          if (savedConfig) {
            console.log('[GameStore] Loading game config:', savedConfig.name);
            return {
              config: { ...savedConfig.config },
              hasUnsavedChanges: true
            };
          }
          return state;
        }),

        deleteGameConfig: (id: string) => set((state) => {
          console.log('[GameStore] Deleting game config:', id);
          return {
            savedGameConfigs: state.savedGameConfigs.filter(c => c.id !== id),
            hasUnsavedChanges: true
          };
        }),

        // React 19 - Concurrent-safe actions
        updateAnswer: (questionId: string, answer: any) => set((state) => {
          console.log(`[GameStore] Updating answer for ${questionId}:`, answer);
          return {
            answers: { ...state.answers, [questionId]: answer },
            hasUnsavedChanges: true
          };
        }),

        resetAnswers: () => set(() => {
          console.log('[GameStore] Resetting all answers');
          return {
            answers: {},
            hasUnsavedChanges: true
          };
        }),

        markUnsavedChanges: () => set(() => ({
          hasUnsavedChanges: true
        })),

        clearUnsavedChanges: () => set(() => ({
          hasUnsavedChanges: false,
          lastSaved: new Date()
        })),

        addAnimationProfile: (profile) => set((state) => {
          const newProfile = {
            ...profile,
            id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date()
          };
          
          console.log('[GameStore] Adding animation profile:', newProfile.name);
          return {
            animationProfiles: [...state.animationProfiles, newProfile],
            hasUnsavedChanges: true
          };
        }),

        removeAnimationProfile: (id: string) => set((state) => {
          console.log(`[GameStore] Removing animation profile: ${id}`);
          return {
            animationProfiles: state.animationProfiles.filter(p => p.id !== id),
            hasUnsavedChanges: true
          };
        }),

        // Utility Actions
        resetStore: () => set(() => {
          console.log('[GameStore] Resetting store to initial state');
          return {
            currentStep: 0,
            totalSteps: 9,
            viewMode: 'simple',
            isSpinning: false,
            gameType: 'slots',
            currentQuestion: 0,
            answers: {},
            config: initialConfig,
            savedProgress: {},
            savedGameConfigs: [],
            showPreview: false,
            hasUnsavedChanges: false,
            lastSaved: null,
            animationTrigger: {
              type: null,
              timestamp: 0,
              isPlaying: false,
            },
            generatedAnimations: null,
            animationWorkspace: {
              selectedPreset: 'modern',
              maskEditMode: false,
              previewMode: 'normal' as MaskPreviewMode,
              performanceMode: 'desktop' as DeviceProfile,
              showEasingCurve: false
            },
            animationProfiles: [],
            aiSuggestionsEnabled: true,
            performanceMode: 'auto',
            usabilityTracking: true
          };
        }),

        getStoreSnapshot: () => {
          const state = get();
          return {
            currentStep: state.currentStep,
            gameType: state.gameType,
            config: state.config,
            answers: state.answers,
            animationProfiles: state.animationProfiles,
            animationWorkspace: state.animationWorkspace,
            lastSaved: state.lastSaved
          };
        }
      }),
      {
        name: 'game-store',
        partialize: (state) => ({
          currentStep: state.currentStep,
          gameType: state.gameType,
          config: {
            ...state.config,
            // Exclude large images from localStorage persistence to prevent quota exceeded errors
            studioLogo: null,
            loadingSprite: null,
            gameLogo: null,
            splashBackgroundImage: null,
            continueButton: null,
            winDisplayImage: null,
            // Also exclude other potentially large assets
            theme: {
              ...state.config.theme,
              generated: {
                ...state.config.theme?.generated,
                symbolImages: {},
                backgroundImages: {},
                logoImages: {}
              }
            }
          },
          answers: state.answers,
          savedProgress: state.savedProgress,
          savedGameConfigs: state.savedGameConfigs,
          animationProfiles: state.animationProfiles,
          animationWorkspace: state.animationWorkspace,
          lastSaved: state.lastSaved
        }),
        version: 1,
        // Handle localStorage quota exceeded errors gracefully
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.warn('Failed to rehydrate game store from localStorage:', error);
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              console.warn('localStorage quota exceeded, clearing game storage');
              try {
                localStorage.removeItem('game-store');
              } catch (e) {
                console.warn('Failed to clear localStorage:', e);
              }
            }
          }
        }
      }
    )
  )
);

// React 19 - Enhanced selectors for better performance
export const useCurrentStep = () => useGameStore((state) => state.currentStep);
export const useGameType = () => useGameStore((state) => state.gameType);
export const useGameConfig = () => useGameStore((state) => state.config);
export const useAnimationWorkspace = () => useGameStore((state) => state.animationWorkspace);
export const useHasUnsavedChanges = () => useGameStore((state) => state.hasUnsavedChanges);

// React 19 - Action-only selectors for better performance
export const useGameActions = () => useGameStore((state) => ({
  setStep: state.setStep,
  nextStep: state.nextStep,
  prevStep: state.prevStep,
  setGameType: state.setGameType,
  updateConfig: state.updateConfig,
  saveProgress: state.saveProgress,
  updateAnswer: state.updateAnswer,
  resetAnswers: state.resetAnswers
}));