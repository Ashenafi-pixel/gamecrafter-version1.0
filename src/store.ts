import { create } from 'zustand';
import { GameConfig, AnimationWorkspace, DeviceProfile, MaskPreviewMode, CrashConfig } from './types';
import { CONFIG_DEFAULTS } from './utils/configDefaults';
import { DEFAULT_CLASSIC_SYMBOLS } from './utils/predefinedSymbols';
import BambooImage from './assets/WinDisplay/bamboo.png'
import { packs } from './components/visual-journey/steps-working/Step11_EnhancedAudio/data';

export type UiDesigns = "modern" | "ultimate" | "normal" | "simple";

export interface Studio {
  id: string;
  name: string;
  logo: string; // URL or base64
  description: string;
  createdAt: Date;
  settings?: {
    preloader?: any; // Default preloader config for games in this studio
  };
}
const defaultAudioVolumes = packs.reduce((acc, pack) => {
  const key = pack.key === 'reel' ? 'reels' : pack.key;
  acc[key as string] = pack.defaultVolume ?? 0.5;
  return acc;
}, {} as Record<string, number>);

interface GameStore {
  // UI State
  currentStep: number;
  totalSteps: number;
  setTotalSteps: (steps: number) => void;
  // Studio State
  studios: Studio[];
  activeStudio: Studio | null;
  fetchStudios: () => Promise<void>;
  selectStudio: (studioId: string) => void;
  createStudio: (studio: Omit<Studio, 'id' | 'createdAt'>) => Promise<void>;
  updateStudio: (id: string, updates: Partial<Studio>) => void;
  viewMode: 'simple' | 'advanced';
  isSpinning: boolean;
  gameType: string | null;
  scratchAssetStep: number; // Deprecated
  scratchMechanicStep: number;
  scratchMathStep: number; // Deprecated
  scratchAestheticStep: number;
  scratchGameplayStep: number;
  scratchProductionStep: number;
  currentQuestion: number;
  answers: Record<string, any>;
  isMobileView: boolean;
  showPreview: boolean;
  previewFullscreen: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  // Ui Designs
  uiType: UiDesigns;
  setUiType: (type: UiDesigns) => void;
  resetUiDesignType: () => void;

  // Modal State
  showStandaloneGameModal: boolean;

  // Hold & Spin Bonus State
  holdSpinState: {
    isActive: boolean;
    lockedSymbols: Array<{
      reel: number;
      row: number;
      symbol: string;
      value: number;
    }>;
    spinsRemaining: number;
    totalWin: number;
    showModal: boolean;
  };

  // Animation State
  animationTrigger: {
    type: 'small-win' | 'big-win' | 'mega-win' | 'freespins' | null;
    timestamp: number;
    isPlaying: boolean;
  };
  generatedAnimations: any | null;

  // Game Configuration
  config: Partial<GameConfig>;
  setConfig: (config: Partial<GameConfig>) => void; // [NEW] Added for draft hydration
  savedProgress: Record<string, any>;

  // Win Animation Configuration
  winAnimationType: 'lines' | 'squares' | 'both';

  // Loading Experience Assets
  loadingAssets: {
    studioLogo: {
      url: string | null;
      size: number;
      x: number;
      y: number;
    };
    loadingSprite: {
      url: string | null;
      size: number;
      animation: string;
      position: string;
    };
    progressBar: {
      x: number;
      y: number;
      width: number;
      display: string;
      color: string;
    };
    customMessage: {
      text: string;
      x: number;
      y: number;
      size: number;
    };
    percentagePosition: string;
  };

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
  balance: number;
  betAmount: number;
  winAmount: number;

  // UI Buttons
  isAutoplayActive: boolean;
  showSettings: boolean;
  showMenu: boolean;
  isSoundEnabled: boolean;
  volume: number;
  turboMode: boolean;
  showAnimations: boolean;

  // Sounds And Audio
  currentAudioTab: string;
  setCurrentAudioTab: (currentAudioTab: string) => void;
  audioAnswers: Record<string, any>;
  setAudioAnswers: (answers: Record<string, any>) => void;
  skipSound: boolean;
  setSkipSound: (skip: boolean) => void;
  selectSoundContent: boolean;
  setSelectSoundContent: (selectSoundContent: boolean) => void;
  individualControl: boolean;
  setIndividualControl: (individualControl: boolean) => void;
  isAudioGenerating: boolean;
  setIsAudioGenerating: (isAudioGenerating: boolean) => void;
  setBalance: (balance: number) => void;
  setBetAmount: (betAmount: number) => void;
  setWinAmount: (winAmount: number) => void;

  // UI Buttons
  setIsAutoplayActive: (isAutoPlayActive: boolean) => void;
  setVolume: (volume: number) => void;
  audioChannelVolumes: Record<string, number>;
  setAudioChannelVolume: (category: string, volume: number) => void;
  setTurboMode: (turboMode: boolean) => void;
  setShowAnimations: (showAnimations: boolean) => void;
  setIsSoundEnabled: (isSoundEnabled: boolean) => void;
  setShowSettings: (showSettings: boolean) => void;
  setShowMenu: (showMenu: boolean) => void;

  // Audio Files Storage
  audioFiles: {
    background: Record<string, { url: string; audioData: ArrayBuffer; metadata?: any }>;
    reels: Record<string, { url: string; audioData: ArrayBuffer; metadata?: any }>;
    ui: Record<string, { url: string; audioData: ArrayBuffer; metadata?: any }>;
    wins: Record<string, { url: string; audioData: ArrayBuffer; metadata?: any }>;
    bonus: Record<string, { url: string; audioData: ArrayBuffer; metadata?: any }>;
    features: Record<string, { url: string; audioData: ArrayBuffer; metadata?: any }>;
    ambience: Record<string, { url: string; audioData: ArrayBuffer; metadata?: any }>;
  };
  setAudioFile: (category: string, name: string, audioData: { url: string; audioData: ArrayBuffer; metadata?: any }) => void;

  // Audio generation and storage
  generateAudio: (prompt: string, audioType: 'MusicBed' | 'AlternateLoop') => Promise<void>;
  // Navigation actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // UI state actions
  setViewMode: (mode: 'simple' | 'advanced') => void;
  setIsSpinning: (spinning: boolean) => void;
  setIsMobileView: (isMobile: boolean) => void;
  togglePreview: () => void;
  setPreviewFullscreen: (fullscreen: boolean) => void;
  setUseVisualJourney: (useVisual: boolean) => void;

  // Modal actions
  setShowStandaloneGameModal: (show: boolean) => void;

  // Hold & Spin actions
  setHoldSpinState: (state: Partial<GameStore['holdSpinState']>) => void;
  triggerHoldSpin: (lockedSymbols: Array<{ reel: number; row: number; symbol: string; value: number }>) => void;
  addLockedSymbol: (symbol: { reel: number; row: number; symbol: string; value: number }) => void;
  updateHoldSpinWin: (additionalWin: number) => void;
  endHoldSpin: () => void;

  // Game configuration actions
  setGameType: (type: string | null) => void;
  setScratchAssetStep: (step: number) => void;
  setScratchMechanicStep: (step: number) => void;
  setScratchMathStep: (step: number) => void;
  setScratchAestheticStep: (step: number) => void;
  setScratchGameplayStep: (step: number) => void;
  setScratchProductionStep: (step: number) => void;
  setAnswer: (questionId: string, answer: any) => void;
  updateConfig: (update: Partial<GameConfig>) => void;
  updateCrashConfig: (updates: Partial<CrashConfig>) => void; // Add Crash Config updater
  saveProgress: () => void;
  resetConfig: () => void;

  // Win Animation actions
  setWinAnimationType: (type: 'lines' | 'squares' | 'both') => void;

  // Grid layout actions
  setGridOrientation: (orientation: 'landscape' | 'portrait') => void;

  // Animation actions
  triggerAnimation: (type: 'small-win' | 'big-win' | 'mega-win' | 'freespins') => void;
  setGeneratedAnimations: (animations: any) => void;
  clearAnimationTrigger: () => void;

  // Animation Studio actions
  setAnimationPreset: (preset: string) => void;
  setMaskEditMode: (enabled: boolean) => void;
  setMaskPreviewMode: (mode: MaskPreviewMode) => void;
  setPerformanceMode: (mode: DeviceProfile) => void;
  toggleEasingCurve: () => void;

  // Enhanced Animation actions
  addAnimationProfile: (profile: { id: string; name: string; settings: Record<string, any> }) => void;
  removeAnimationProfile: (profileId: string) => void;
  toggleProfileFavorite: (profileId: string) => void;
  setAISuggestionsEnabled: (enabled: boolean) => void;
  setUsabilityTracking: (enabled: boolean) => void;

  // Loading Experience actions
  setStudioLogo: (logo: string | null) => void;
  setLoadingSprite: (sprite: string | null) => void;
  updateStudioLogoPosition: (x: number, y: number) => void;
  updateStudioLogoSize: (size: number) => void;
  updateLoadingSpriteConfig: (config: Partial<{ size: number; animation: string; position: string }>) => void;
  updateProgressBarConfig: (config: Partial<{ x: number; y: number; width: number; display: string; color: string }>) => void;
  updateCustomMessageConfig: (config: Partial<{ text: string; x: number; y: number; size: number }>) => void;
  updatePercentagePosition: (config: Partial<{ percentagePosition: string }>) => void;

  selectedFeatureTemplate: string | null;
  setSelectedFeatureTemplate: (key: string | null) => void;
}

// Initial config without default game type selection
const initialConfig = {
  ...CONFIG_DEFAULTS,
  selectedGameType: null, // No default selection
  reels: {
    ...CONFIG_DEFAULTS.reels,
    layout: {
      ...CONFIG_DEFAULTS.reels?.layout,
      reels: 5,
      rows: 3,
      orientation: 'landscape',
      payMechanism: 'betlines'
    }
  },
  theme: {
    ...CONFIG_DEFAULTS.theme,
    generated: {
      ...CONFIG_DEFAULTS.theme?.generated,
      symbols: DEFAULT_CLASSIC_SYMBOLS
    }
  },
  winDisplayImage: BambooImage,
} as any;



// Create the store without persistence to avoid quota issues
export const useGameStore = create<GameStore>()((set, get) => ({
  // State
  currentStep: 0,
  totalSteps: 16, // Default to 16 steps for slots game type
  // Studio State Implementation
  studios: [],
  activeStudio: null,
  fetchStudios: async () => {
    try {
      const response = await fetch('/api/rgs/studios');
      if (response.ok) {
        const studios = await response.json();
        set({ studios });
      }
    } catch (error) {
      console.error('Failed to fetch studios:', error);
    }
  },
  selectStudio: (studioId) => set((state) => ({
    activeStudio: state.studios.find(s => s.id === studioId) || null
  })),
  createStudio: async (studioData) => {
    try {
      const response = await fetch('/api/rgs/studios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studioData)
      });

      if (response.ok) {
        const newStudio = await response.json();
        set((state) => ({
          studios: [...state.studios, newStudio],
          activeStudio: newStudio
        }));
      }
    } catch (error) {
      console.error('Failed to create studio:', error);
      // Fallback optimistic update
      const newStudio: Studio = {
        ...studioData,
        id: `studio_${Date.now()}`,
        createdAt: new Date()
      };
      set((state) => ({
        studios: [...state.studios, newStudio],
        activeStudio: newStudio
      }));
    }
  },
  updateStudio: (id, updates) => {
    set((state) => {
      const updatedStudios = state.studios.map(s =>
        s.id === id ? { ...s, ...updates } : s
      );
      // Also update activeStudio if it's the one being modified
      const activeStudio = state.activeStudio?.id === id
        ? { ...state.activeStudio, ...updates }
        : state.activeStudio;

      return {
        studios: updatedStudios,
        activeStudio
      };
    });
  },
  viewMode: 'simple',
  isSpinning: false,
  gameType: 'slots', // Default to slots game type
  scratchAssetStep: 0,
  scratchMechanicStep: 0,
  scratchMathStep: 0,
  scratchAestheticStep: 0,
  scratchGameplayStep: 0,
  scratchProductionStep: 0,

  currentQuestion: 0,
  answers: {},
  config: initialConfig,
  setConfig: (config) => set({ config }),
  savedProgress: {},
  isMobileView: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  showPreview: false,
  previewFullscreen: false,
  hasUnsavedChanges: false,
  lastSaved: null,
  balance: 1000,
  betAmount: 2,
  winAmount: 0,

  updateConfig: (update) => set((state) => ({
    config: { ...state.config, ...update }
  })),

  updateCrashConfig: (updates) => set((state) => ({
    config: {
      ...state.config,
      crash: {
        // Default values if undefined
        growthRate: 0.1,
        houseEdge: 4,
        minMultiplier: 1.0,
        maxMultiplier: 1000,
        visuals: {
          lineColor: '#EF4444',
          gridColor: '#334155',
          textColor: '#F8FAFC',
          objectType: 'rocket'
        },
        ...state.config.crash,
        ...updates
      }
    }
  })),

  // UI buttons
  isAutoplayActive: false,
  showSettings: false,
  showMenu: false,
  isSoundEnabled: true,
  volume: 100,
  turboMode: false,
  showAnimations: true,

  // Ui Designs
  uiType: "normal", // default
  setUiType: (type: UiDesigns) => set({ uiType: type }),
  resetUiDesignType: () => set({ uiType: "normal" }),
  // Modal state
  showStandaloneGameModal: false,

  // Hold & Spin state
  holdSpinState: {
    isActive: false,
    lockedSymbols: [],
    spinsRemaining: 0,
    totalWin: 0,
    showModal: false
  },

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
    previewMode: 'normal',
    performanceMode: 'desktop',
    showEasingCurve: false
  },

  // Enhanced Animation Features state
  animationProfiles: [],
  aiSuggestionsEnabled: true,
  performanceMode: 'auto',
  usabilityTracking: true,

  // Win Animation state
  winAnimationType: 'both',
  // Audio state
  currentAudioTab: 'Background',
  setCurrentAudioTab: (currentAudioTab: string) => set({ currentAudioTab }),
  audioAnswers: {},
  setAudioAnswers: (answers: Record<string, any>) => set({ audioAnswers: answers }),
  skipSound: false,
  setSkipSound: (skip: boolean) => set({ skipSound: skip }),
  selectSoundContent: false,
  individualControl: false,
  isAudioGenerating: false,
  setSelectSoundContent: (selectSoundContent: boolean) => set({ selectSoundContent }),
  setIndividualControl: (individualControl: boolean) => set({ individualControl }),
  setIsAudioGenerating: (isAudioGenerating: boolean) => set({ isAudioGenerating }),
  setBalance: (balance: number) => set({ balance }),
  setBetAmount: (betAmount: number) => set({ betAmount }),
  setWinAmount: (winAmount: number) => set({ winAmount }),

  // UI buttons
  setIsAutoplayActive: (isAutoplayActive: boolean) => set({ isAutoplayActive }),
  setVolume: (volume: number) => set({ volume }),
  audioChannelVolumes: defaultAudioVolumes,
  setAudioChannelVolume: (category: string, volume: number) => set((state) => ({
    audioChannelVolumes: { ...state.audioChannelVolumes, [category]: volume }
  })),
  setTurboMode: (turboMode: boolean) => set({ turboMode }),
  setShowAnimations: (showAnimations: boolean) => set({ showAnimations }),
  setIsSoundEnabled: (isSoundEnabled: boolean) => set({ isSoundEnabled }),
  setShowSettings: (showSettings: boolean) => set({ showSettings }),
  setShowMenu: (showMenu: boolean) => set({ showMenu }),
  // Audio Files Storage
  audioFiles: {
    background: {},
    reels: {},
    ui: {},
    wins: {},
    bonus: {},
    features: {},
    ambience: {}
  },

  setAudioFile: (category: string, name: string, audioData: { url: string; audioData: ArrayBuffer; metadata?: any }) => {
    set((state) => ({
      audioFiles: {
        ...state.audioFiles,
        [category]: {
          ...state.audioFiles[category as keyof typeof state.audioFiles],
          [name]: audioData
        }
      }
    }));
  },

  // Audio generation and storage actions
  generateAudio: async (prompt: string, audioType: 'MusicBed' | 'AlternateLoop') => {
    try {
      const { elevenLabsClient } = await import('./utils/elevenLabsClient');
      const response = await elevenLabsClient.generateSoundEffect({
        text: prompt,
        duration_seconds: audioType === 'MusicBed' ? 2.2 : 1.1,
        prompt_influence: 0.3
      });

      if (response.audio_url && !response.error) {
        const duration = audioType === 'MusicBed' ? '2.2s' : '1.1s';
        // Store in new audioFiles structure
        get().setAudioFile('background', audioType, {
          url: response.audio_url,
          audioData: response.audio_data || new ArrayBuffer(0),
          metadata: { duration, prompt, generatedAt: new Date() }
        });

        // Also store in old config structure for backward compatibility
        const currentBackgroundMusic = get().config.audio?.backgroundMusic || { MusicBed: null, AlternateLoop: null };
        set((state) => ({
          config: {
            ...state.config,
            audio: {
              ...state.config.audio,
              backgroundMusic: {
                ...currentBackgroundMusic,
                [audioType]: { url: response.audio_url, duration }
              },
              // Ensure required properties are present or fall back
              spinSound: state.config.audio?.spinSound || 'assets/sounds/spin.mp3',
              winSounds: state.config.audio?.winSounds || {
                small: 'assets/sounds/win-small.mp3',
                medium: 'assets/sounds/win-medium.mp3',
                big: 'assets/sounds/win-big.mp3',
                mega: 'assets/sounds/win-mega.mp3'
              },
              featureSounds: state.config.audio?.featureSounds || {},
              soundIntensity: state.config.audio?.soundIntensity || 'medium',
              enableVoiceover: state.config.audio?.enableVoiceover ?? true
            }
          }
        }));
      } else {
        console.error('Audio generation failed:', response.error);
      }
    } catch (error) {
      console.error('Audio generation error:', error);
    }
  },

  // Loading Experience Assets state
  loadingAssets: {
    studioLogo: {
      url: null,
      size: 80,
      x: 50,
      y: 15,
      customSet: []
    },
    mascot: {
      enabled: false,
      source: 'none',
      position: 'bottom-right',
      scale: 1,
    },
    prizes: [],
    // Tier-1 Defaults
    layers: {
      scene: { zIndex: 0, visible: true, type: 'color', value: 'transparent' }, // Default to transparent so app bg shows
      card: { zIndex: 10, visible: true, type: 'color', value: '#ffffff' },
      shape: { zIndex: 20, visible: true, shape: 'rounded', padding: 20 },
      foil: { zIndex: 50, visible: true, texture: 'silver', opacity: 1, revealMode: 'brush' },
      overlay: { zIndex: 60, visible: true, mascots: [], logos: [] }
    },
    loadingSprite: {
      url: null,
      size: 40,
      animation: 'roll',
      position: 'in-bar',
    },
    progressBar: {
      x: 50,
      y: 65,
      width: 60,
      display: 'bar',
      color: '#ffd700'
    },
    customMessage: {
      text: 'GameStudio™ - 2024',
      x: 50,
      y: 90,
      size: 14,
    },
    percentagePosition: 'below'
  },

  // Navigation actions
  setStep: (step) => set((state) => {
    // Direct setStep called

    // Safety check - ensure step is within valid range
    if (step < 0) step = 0;
    if (step >= state.totalSteps) step = state.totalSteps - 1;

    // Special handling for critical Step 0 -> Step 1 transition
    if (state.currentStep === 0 && step === 1) {
      // Critical step transition: 0 -> 1

      // Ensure we preserve the selected theme and game type
      // const preservedTheme = state.config?.theme?.selectedThemeId;
      // const preservedGameType = state.config.selectedGameType || 'classic-reels';

      // Preserving selections:
      // theme: preservedTheme,
      // gameType: preservedGameType

      // Extra verification - Force classic-reels as fallback
      if (!state.config.selectedGameType) {
        // No game type selected, forcing classic-reels
        // Update will be merged below
      }
    }

    // Save current step progress before changing - with more complete data
    const updatedSavedProgress = {
      ...state.savedProgress,
      [state.currentStep]: {
        config: state.config,
        answers: state.answers,
        timestamp: new Date(),
        savedDetails: {
          stepName: state.currentStep === 0 ? 'Theme Selection' :
            state.currentStep === 1 ? 'Game Type' : `Step ${state.currentStep + 1}`,
          selectedGameType: state.config.selectedGameType,
          selectedTheme: state.config?.theme?.selectedThemeId
        }
      }
    };
    return {
      currentStep: step,
      savedProgress: updatedSavedProgress,
      hasUnsavedChanges: true
    };
  }),

  setTotalSteps: (steps) => set({ totalSteps: steps }),

  nextStep: () => {
    const { currentStep, totalSteps, setStep, config } = get();
    // nextStep() called

    if (currentStep < totalSteps - 1) {
      // Calculate target step
      const targetStep = currentStep + 1;
      // Moving to next step

      // Special handling for Step 0 -> Step 1 transition
      if (currentStep === 0) {
        // Critical step 0 -> 1 transition, using synchronous update

        // Save current state to localStorage as backup
        try {
          localStorage.setItem('slotai_navigation_backup', JSON.stringify({
            timestamp: Date.now(),
            targetStep: 1,
            themeId: config?.theme?.selectedThemeId,
            gameId: config?.gameId,
            selectedGameType: config.selectedGameType || 'classic-reels'
          }));
        } catch (e) {
          // Ignore localStorage errors
        }

        // Directly update state - no timeouts to avoid race conditions
        setStep(targetStep);

        // Add verification check
        const verifyInterval = setInterval(() => {
          const currentState = get();
          if (currentState.currentStep === targetStep) {
            // Navigation verified successful
            clearInterval(verifyInterval);
          }
        }, 100);

        // Clear interval after maximum time
        setTimeout(() => clearInterval(verifyInterval), 2000);
      } else {
        // For non-critical transitions, use standard approach
        setStep(targetStep);
      }
    } else {
      console.warn('🔄 Already at last step, cannot proceed further');
    }
  },

  prevStep: () => {
    const { currentStep, setStep } = get();
    // prevStep() called

    if (currentStep > 0) {
      const targetStep = currentStep - 1;
      // Moving back to previous step

      // Directly update state - no timeouts for more reliable navigation
      setStep(targetStep);
    } else {
      console.warn('🔄 Already at first step, cannot go back');
    }
  },

  // UI state actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsSpinning: (spinning) => set({ isSpinning: spinning }),
  setIsMobileView: (isMobile) => set({ isMobileView: isMobile }),
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  setPreviewFullscreen: (fullscreen) => set({ previewFullscreen: fullscreen }),
  setUseVisualJourney: (_useVisual: boolean) => set({ /* implementation if needed */ }),

  // Modal actions
  setShowStandaloneGameModal: (show) => set({ showStandaloneGameModal: show }),

  // Hold & Spin actions
  setHoldSpinState: (state) => set((currentState) => ({
    holdSpinState: { ...currentState.holdSpinState, ...state }
  })),

  triggerHoldSpin: (lockedSymbols) => {
    const { config } = get();
    const initialRespins = config.bonus?.holdAndSpin?.initialRespins || 3;

    set((state) => ({
      holdSpinState: {
        isActive: true,
        lockedSymbols,
        spinsRemaining: initialRespins,
        totalWin: lockedSymbols.reduce((sum, symbol) => sum + symbol.value, 0),
        showModal: true
      }
    }));
  },

  addLockedSymbol: (symbol) => set((state) => ({
    holdSpinState: {
      ...state.holdSpinState,
      lockedSymbols: [...state.holdSpinState.lockedSymbols, symbol],
      totalWin: state.holdSpinState.totalWin + symbol.value
    }
  })),

  updateHoldSpinWin: (additionalWin) => set((state) => ({
    holdSpinState: {
      ...state.holdSpinState,
      totalWin: state.holdSpinState.totalWin + additionalWin
    }
  })),

  endHoldSpin: () => set((state) => ({
    holdSpinState: {
      isActive: false,
      lockedSymbols: [],
      spinsRemaining: 0,
      totalWin: 0,
      showModal: false
    }
  })),

  // Game configuration actions
  setGameType: (type) => {
    set({ gameType: type });
    if (type === 'scratch') {
      set({
        scratchAssetStep: 0,
        scratchMechanicStep: 0,
        scratchMathStep: 0,
        scratchAestheticStep: 0,
        scratchGameplayStep: 0,
        scratchProductionStep: 0
      });
    }
    // Always reset config when switching game types
    if (type) {
      // Set total steps based on game type
      const totalSteps = type === 'slots' ? 16 :
        type === 'scratch' ? 6 :
          type === 'instant' ? 4 :
            type === 'grid' ? 5 : 16;

      set({
        currentStep: 0,
        currentQuestion: 0,
        answers: {},
        config: initialConfig,
        savedProgress: {},
        hasUnsavedChanges: false,
        lastSaved: null,
        totalSteps
      });
    }
  },

  setScratchAssetStep: (step) => set({ scratchAssetStep: step }),
  setScratchMechanicStep: (step) => set({ scratchMechanicStep: step }),
  setScratchMathStep: (step) => set({ scratchMathStep: step }),
  setScratchAestheticStep: (step) => set({ scratchAestheticStep: step }),
  setScratchGameplayStep: (step) => set({ scratchGameplayStep: step }),
  setScratchProductionStep: (step) => set({ scratchProductionStep: step }),

  setAnswer: (questionId, answer) => set((state) => {
    const newAnswers = { ...state.answers, [questionId]: answer };
    let configUpdate = {};

    if (questionId === 'payMechanism') {
      configUpdate = {
        reels: {
          ...state.config.reels,
          payMechanism: answer as "betlines" | "ways" | "cluster",
          ...(answer === 'cluster' ? {
            cluster: {
              minSymbols: 5,
              diagonalAllowed: false,
              payouts: {
                5: 5,
                8: 20,
                12: 100
              },
              overlay: {
                image: '',
                texture: 'silver',
                color: '#C0C0C0',
                opacity: 1,
                shape: 'square',
                customShapeImage: undefined
              },
              effects: {
                particles: true,
                confetti: true,
                parallax: true
              },
              audio: {
                scratch: '',
                win: '',
                bgm: ''
              }
            }
          } : {})
        } as any // Cast to any to bypass strict Partial deep merge issues for now
      };
    } else if (questionId === 'gridSize') {
      const gridConfig = answer.config || { reels: 5, rows: 3 };
      configUpdate = {
        reels: {
          ...state.config.reels,
          layout: {
            ...state.config.reels?.layout,
            reels: gridConfig.reels,
            rows: gridConfig.rows
          }
        }
      };
    }

    return {
      answers: newAnswers,
      currentQuestion: state.currentQuestion < 2 ? state.currentQuestion + 1 : state.currentQuestion,
      config: {
        ...state.config,
        ...configUpdate
      }
    };
  }),

  saveProgress: () => set((state) => {
    try {
      const gameId = state.config.gameId || `game_${Date.now()}`;

      // Create a version without the large image data to avoid quota issues
      const minimalConfig = { ...state.config };

      // Remove ALL large image data from config to avoid quota issues
      if (minimalConfig.theme?.generated) {
        minimalConfig.theme = {
          ...minimalConfig.theme,
          generated: {
            ...minimalConfig.theme.generated,
            // Replace with minimal indicators instead of large base64 strings
            symbols: Array.isArray(minimalConfig.theme.generated.symbols) ?
              minimalConfig.theme.generated.symbols.map(() => 'symbol-exists') : [],
            background: minimalConfig.theme.generated.background ? 'background-exists' : '',
            // logo: minimalConfig.theme.generated.logo ? 'logo-exists' : ''
          }
        };
      }
      if (state.config.scratch?.mascot?.image) {
        // Preload mascot if needed
      };

      // Also clean up any step data with large images
      const cleanAnswers = { ...state.answers };
      Object.keys(cleanAnswers).forEach(stepKey => {
        const stepData = cleanAnswers[stepKey];
        if (stepData && typeof stepData === 'object') {
          // Remove any base64 image data from answers
          Object.keys(stepData).forEach(key => {
            const value = stepData[key];
            if (typeof value === 'string' && value.startsWith('data:image/')) {
              stepData[key] = 'image-data-removed';
            }
          });
        }
      });

      const saveData = {
        gameType: state.gameType,
        config: minimalConfig, // Use minimal config
        currentStep: state.currentStep,
        answers: cleanAnswers, // Use cleaned answers
        savedAt: new Date().toISOString()
      };

      // Clear old saves before saving new one to prevent quota issues
      try {
        // Get all localStorage keys
        const keys = Object.keys(localStorage);
        const slotaiKeys = keys.filter(key => key.startsWith('slotai_save_'));

        // If we have more than 5 saves, remove the oldest ones
        if (slotaiKeys.length > 5) {
          // Sort by timestamp (gameId includes timestamp)
          slotaiKeys.sort();
          // Remove all but the 4 most recent
          const keysToRemove = slotaiKeys.slice(0, slotaiKeys.length - 4);
          keysToRemove.forEach(key => localStorage.removeItem(key));
          console.log(`🧹 Cleared ${keysToRemove.length} old saves to free up space`);
        }


        // Create minimal save data without large base64 images
        const minimalSaveData = {
          ...saveData
          // Removed manual filtering of non-existent properties
        };

        // Save minimal data to localStorage
        localStorage.setItem(`slotai_save_${gameId}`, JSON.stringify(minimalSaveData));
        console.log('✅ Game progress saved successfully');
      } catch (quotaError) {
        console.warn('📦 Storage quota exceeded, trying gradual cleanup...');

        // First try: remove just old saves (more than 2)
        const slotaiKeys = Object.keys(localStorage)
          .filter(key => key.startsWith('slotai_save_'))
          .sort();

        if (slotaiKeys.length > 2) {
          const keysToRemove = slotaiKeys.slice(0, slotaiKeys.length - 2);
          keysToRemove.forEach(key => localStorage.removeItem(key));
          console.log(`🧹 Gradual cleanup: removed ${keysToRemove.length} old saves`);

          try {
            localStorage.setItem(`slotai_save_${gameId}`, JSON.stringify(saveData));
            console.log('✅ Game progress saved after gradual cleanup');
            return {
              hasUnsavedChanges: false,
              lastSaved: new Date(),
              savedProgress: {
                ...state.savedProgress,
                [state.currentStep]: {
                  config: state.config,
                  answers: state.answers,
                  timestamp: new Date()
                }
              }
            };
          } catch (retryError) {
            console.warn('⚠️ Gradual cleanup insufficient, trying aggressive cleanup...');
          }
        }

        // Last resort: clear all slotai saves if quota still exceeded
        slotaiKeys.forEach(key => localStorage.removeItem(key));
        console.warn('🧹 Aggressive cleanup: cleared all saves');

        // Try one more time
        try {
          localStorage.setItem(`slotai_save_${gameId}`, JSON.stringify(saveData));
          console.log('✅ Game progress saved after aggressive cleanup');
        } catch (finalError) {
          console.error('❌ Failed to save even after clearing all data:', finalError);
          // Don't throw - just continue without saving to prevent crashes
          console.warn('⚠️ Continuing without saving to localStorage');
        }
      }

      return {
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        savedProgress: {
          ...state.savedProgress,
          [state.currentStep]: {
            config: state.config, // Keep full config in memory
            answers: state.answers,
            timestamp: new Date()
          }
        }
      };
    } catch (e) {
      console.error('Failed to save progress:', e);
      return state;
    }
  }),

  resetConfig: () => set({
    // Preserve the "classic-reels" selection even when resetting
    config: {
      ...initialConfig
    },
    currentStep: 0,
    gameType: 'slots',
    currentQuestion: 0,
    answers: {},
    savedProgress: {},
    hasUnsavedChanges: false,
    lastSaved: null
  }),

  // Win Animation actions
  setWinAnimationType: (type) => set({ winAnimationType: type }),

  // Grid layout actions
  setGridOrientation: (orientation) => set((state) => {
    // Get current reels and rows
    const currentReels = state.config.reels?.layout?.reels || 5;
    const currentRows = state.config.reels?.layout?.rows || 3;

    // Update config with new orientation while preserving grid dimensions
    return {
      config: {
        ...state.config,
        reels: {
          ...state.config.reels,
          layout: {
            ...state.config.reels?.layout,
            reels: currentReels,
            rows: currentRows,
            orientation
          }
        } as any
      }
    };
  }),

  // Animation actions
  triggerAnimation: (type) => set({
    animationTrigger: {
      type,
      timestamp: Date.now(),
      isPlaying: true,
    }
  }),

  setGeneratedAnimations: (animations) => set({ generatedAnimations: animations }),

  clearAnimationTrigger: () => set((state) => ({
    animationTrigger: {
      ...state.animationTrigger,
      type: null,
      isPlaying: false,
    }
  })),

  // Animation Studio actions
  setAnimationPreset: (preset) => set((state) => ({
    animationWorkspace: {
      ...state.animationWorkspace,
      selectedPreset: preset
    }
  })),

  setMaskEditMode: (enabled) => set((state) => ({
    animationWorkspace: {
      ...state.animationWorkspace,
      maskEditMode: enabled
    }
  })),

  setMaskPreviewMode: (mode) => set((state) => ({
    animationWorkspace: {
      ...state.animationWorkspace,
      previewMode: mode
    }
  })),

  setPerformanceMode: (mode) => set((state) => ({
    animationWorkspace: {
      ...state.animationWorkspace,
      performanceMode: mode
    }
  })),

  toggleEasingCurve: () => set((state) => ({
    animationWorkspace: {
      ...state.animationWorkspace,
      showEasingCurve: !state.animationWorkspace.showEasingCurve
    }
  })),

  selectedFeatureTemplate: null,

  setSelectedFeatureTemplate: (key) =>
    set({
      selectedFeatureTemplate: key,
    }),

  // Enhanced Animation actions
  addAnimationProfile: (profile) => set((state) => ({
    animationProfiles: [...state.animationProfiles, { ...profile, createdAt: new Date() }]
  })),

  removeAnimationProfile: (profileId) => set((state) => ({
    animationProfiles: state.animationProfiles.filter(p => p.id !== profileId)
  })),

  toggleProfileFavorite: (profileId) => set((state) => ({
    animationProfiles: state.animationProfiles.map(p =>
      p.id === profileId ? { ...p, isFavorite: !p.isFavorite } : p
    )
  })),

  setAISuggestionsEnabled: (enabled) => set({ aiSuggestionsEnabled: enabled }),

  setUsabilityTracking: (enabled) => set({ usabilityTracking: enabled }),

  // Loading Experience actions
  setStudioLogo: (logo) => set((state) => ({
    loadingAssets: {
      ...state.loadingAssets,
      studioLogo: {
        ...state.loadingAssets.studioLogo,
        url: logo
      }
    }
  })),

  setLoadingSprite: (sprite) => set((state) => ({
    loadingAssets: {
      ...state.loadingAssets,
      loadingSprite: {
        ...state.loadingAssets.loadingSprite,
        url: sprite
      }
    }
  })),

  updateStudioLogoPosition: (x, y) => set((state) => ({
    loadingAssets: {
      ...state.loadingAssets,
      studioLogo: {
        ...state.loadingAssets.studioLogo,
        x,
        y
      }
    }
  })),

  updateStudioLogoSize: (size) => set((state) => ({
    loadingAssets: {
      ...state.loadingAssets,
      studioLogo: {
        ...state.loadingAssets.studioLogo,
        size
      }
    }
  })),

  updateLoadingSpriteConfig: (config) => set((state) => ({
    loadingAssets: {
      ...state.loadingAssets,
      loadingSprite: {
        ...state.loadingAssets.loadingSprite,
        ...config
      }
    }
  })),

  updateProgressBarConfig: (config) => set((state) => ({
    loadingAssets: {
      ...state.loadingAssets,
      progressBar: {
        ...state.loadingAssets.progressBar,
        ...config
      }
    }
  })),

  updateCustomMessageConfig: (config) => set((state) => ({
    loadingAssets: {
      ...state.loadingAssets,
      customMessage: {
        ...state.loadingAssets.customMessage,
        ...config
      }
    }
  })),
  updatePercentagePosition: (config) => set((state) => ({
    loadingAssets: {
      ...state.loadingAssets,
      ...config
    }
  })),
}));

// Expose store to window for global access (helps with emergency navigation and home button)
if (typeof window !== 'undefined') {
  (window as any).useGameStore = useGameStore;
}