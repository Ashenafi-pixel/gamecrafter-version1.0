// Shared store for loading journey configuration that transfers between steps
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LoadingJourneyConfig {
  // Step 8: Loading Experience
  loadingExperience: {
    studioLogo: string | null;
    studioLogoSize: number;
    studioLogoPrompt?: string; // Added for AI generation context
    studioLogoPosition: { x: number; y: number };
    progressStyle: 'bar' | 'circular';
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    loadingSprite: string | null;
    spriteAnimation: 'roll' | 'spin' | 'bounce' | 'pulse' | 'slide';
    spriteSize: number;
    spritePosition: 'in-bar' | 'above-bar' | 'below-bar' | 'left-side' | 'right-side';
    loadingTips: string[];
    audioEnabled: boolean;
    minimumDisplayTime: number;
    showPercentage: boolean;
    percentagePosition: 'above' | 'below' | 'right' | 'center';
    progressBarPosition: { x: number; y: number };
    progressBarWidth: number;
    customMessage: string;
    customMessagePosition: { x: number; y: number };
    customMessageSize: number;
  };

  // Step 9: Game Splash & Branding
  splashExperience: {
    gameLogo: string | null;
    gameLogoSize: number;
    gameLogoPosition: { x: number; y: number };
    gameLogoAnimation: 'fade' | 'scale' | 'bounce' | 'spin';
    gameTitle: string;
    gameSubtitle: string;
    splashBackground: string;
    splashBackgroundImage: string | null;
    splashTextColor: string;
    splashDuration: number;
    continueButton: string | null;
    continueButtonSize: number;
    continueButtonPosition: { x: number; y: number };
    featureHighlights: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }>;
  };

  // Journey Preview Settings
  journeyPreview: {
    deviceMode: 'desktop' | 'mobile';
    mobileOrientation: 'portrait' | 'landscape';
    showFullJourney: boolean;
    autoplayJourney: boolean;
  };
}

interface LoadingJourneyStore {
  config: LoadingJourneyConfig;
  updateLoadingExperience: (updates: Partial<LoadingJourneyConfig['loadingExperience']>) => void;
  updateSplashExperience: (updates: Partial<LoadingJourneyConfig['splashExperience']>) => void;
  updateJourneyPreview: (updates: Partial<LoadingJourneyConfig['journeyPreview']>) => void;
  resetJourney: () => void;
  exportJourneyConfig: () => LoadingJourneyConfig;
  importJourneyConfig: (config: LoadingJourneyConfig) => void;
}

// Default configuration following slot industry standards
const defaultConfig: LoadingJourneyConfig = {
  loadingExperience: {
    studioLogo: null,
    studioLogoSize: 80,
    studioLogoPosition: { x: 50, y: 15 },
    progressStyle: 'bar',
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    loadingSprite: null,
    spriteAnimation: 'roll',
    spriteSize: 40,
    spritePosition: 'in-bar',
    loadingTips: [
      'Look for scatter symbols to trigger bonus rounds!',
      'Wild symbols substitute for all symbols except scatters',
      'Higher bets unlock bigger win potential',
      'Free spins can be retriggered during bonus rounds'
    ],
    audioEnabled: true,
    minimumDisplayTime: 3000,
    showPercentage: true,
    percentagePosition: 'above',
    progressBarPosition: { x: 50, y: 65 },
    progressBarWidth: 60,
    customMessage: 'GameStudio™ - 2024',
    customMessagePosition: { x: 50, y: 90 },
    customMessageSize: 14,
  },
  splashExperience: {
    gameLogo: null,
    gameLogoSize: 120,
    gameLogoPosition: { x: 50, y: 30 },
    gameLogoAnimation: 'scale',
    gameTitle: 'Epic Slots Adventure',
    gameSubtitle: 'The Ultimate Gaming Experience',
    splashBackground: '#2D1B69',
    splashBackgroundImage: null,
    splashTextColor: '#ffffff',
    splashDuration: 3000,
    continueButton: null,
    continueButtonSize: 200,
    continueButtonPosition: { x: 50, y: 85 },
    featureHighlights: [
      {
        id: 'wilds',
        title: 'Wild Symbols',
        description: 'Substitute for any symbol',
        icon: '🌟',
        position: { x: 25, y: 25 },
        size: { width: 200, height: 120 }
      },
      {
        id: 'scatters',
        title: 'Scatter Bonuses',
        description: 'Trigger free spins',
        icon: '💎',
        position: { x: 75, y: 25 },
        size: { width: 200, height: 120 }
      },
      {
        id: 'multipliers',
        title: 'Multipliers',
        description: 'Boost your winnings',
        icon: '✨',
        position: { x: 25, y: 75 },
        size: { width: 200, height: 120 }
      },
      {
        id: 'jackpot',
        title: 'Progressive Jackpot',
        description: 'Win the ultimate prize',
        icon: '🎰',
        position: { x: 75, y: 75 },
        size: { width: 200, height: 120 }
      }
    ]
  },
  journeyPreview: {
    deviceMode: 'desktop',
    mobileOrientation: 'portrait',
    showFullJourney: false,
    autoplayJourney: false,
  }
};

export const useLoadingJourneyStore = create<LoadingJourneyStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,

      updateLoadingExperience: (updates) => set((state) => ({
        config: {
          ...state.config,
          loadingExperience: {
            ...state.config.loadingExperience,
            ...updates
          }
        }
      })),

      updateSplashExperience: (updates) => set((state) => ({
        config: {
          ...state.config,
          splashExperience: {
            ...state.config.splashExperience,
            ...updates
          }
        }
      })),

      updateJourneyPreview: (updates) => set((state) => ({
        config: {
          ...state.config,
          journeyPreview: {
            ...state.config.journeyPreview,
            ...updates
          }
        }
      })),

      resetJourney: () => set({ config: defaultConfig }),

      exportJourneyConfig: () => get().config,

      importJourneyConfig: (config) => set({ config }),
    }),
    {
      name: 'loading-journey-storage',
      version: 1,
      // Exclude large binary data from localStorage to prevent quota exceeded errors
      partialize: (state) => ({
        ...state,
        config: {
          ...state.config,
          loadingExperience: {
            ...state.config.loadingExperience,
            // Don't persist large images in localStorage
            studioLogo: null,
            loadingSprite: null,
          },
          splashExperience: {
            ...state.config.splashExperience,
            // Don't persist large images in localStorage
            gameLogo: null,
            splashBackgroundImage: null,
            continueButton: null,
            featureHighlights: state.config.splashExperience.featureHighlights?.map(highlight => ({
              ...highlight,
              // Don't persist icon images
              icon: ''
            })) || []
          }
        }
      }),
      // Handle localStorage quota exceeded errors gracefully
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate loading journey store from localStorage:', error);
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, clearing loading journey storage');
            try {
              localStorage.removeItem('loading-journey-storage');
            } catch (e) {
              console.warn('Failed to clear localStorage:', e);
            }
          }
        }
      }
    }
  )
);

// Hook for transferring config between steps
export const useJourneyTransfer = () => {
  const store = useLoadingJourneyStore();

  return {
    // Transfer loading config TO the journey store (from Step 9)
    transferFromLoadingStep: (loadingConfig: any) => {
      store.updateLoadingExperience({
        // Exclude large images from transfer to prevent localStorage issues
        // studioLogo: loadingConfig.studioLogo, // Not transferred to avoid localStorage quota issues
        studioLogoSize: loadingConfig.studioLogoSize,
        studioLogoPosition: loadingConfig.studioLogoPosition,
        progressStyle: loadingConfig.progressStyle,
        backgroundColor: loadingConfig.backgroundColor,
        textColor: loadingConfig.textColor,
        accentColor: loadingConfig.accentColor,
        // loadingSprite: loadingConfig.loadingSprite, // Not transferred to avoid localStorage quota issues
        spriteAnimation: loadingConfig.spriteAnimation,
        spriteSize: loadingConfig.spriteSize,
        spritePosition: loadingConfig.spritePosition,
        loadingTips: loadingConfig.loadingTips,
        audioEnabled: loadingConfig.audioEnabled,
        minimumDisplayTime: loadingConfig.minimumDisplayTime,
        showPercentage: loadingConfig.showPercentage,
        percentagePosition: loadingConfig.percentagePosition,
        progressBarPosition: loadingConfig.progressBarPosition,
        progressBarWidth: loadingConfig.progressBarWidth,
        customMessage: loadingConfig.customMessage,
        customMessagePosition: loadingConfig.customMessagePosition,
        customMessageSize: loadingConfig.customMessageSize,
      });
    },

    // Get loading config FROM the journey store (for Step 9)
    getLoadingConfig: () => store.config.loadingExperience,

    // Transfer splash config TO the journey store (from Step 9)
    transferFromSplashStep: (splashConfig: any) => {
      store.updateSplashExperience({
        // Exclude large images from transfer to prevent localStorage issues
        // gameLogo: splashConfig.gameLogo, // Not transferred to avoid localStorage quota issues
        gameLogoSize: splashConfig.gameLogoSize,
        gameLogoPosition: splashConfig.gameLogoPosition,
        gameLogoAnimation: splashConfig.gameLogoAnimation,
        gameTitle: splashConfig.gameTitle,
        gameSubtitle: splashConfig.gameSubtitle,
        splashBackground: splashConfig.splashBackground,
        // splashBackgroundImage: splashConfig.splashBackgroundImage, // Not transferred to avoid localStorage quota issues
        splashTextColor: splashConfig.splashTextColor,
        splashDuration: splashConfig.splashDuration,
        // continueButton: splashConfig.continueButton, // Not transferred to avoid localStorage quota issues
        continueButtonSize: splashConfig.continueButtonSize,
        continueButtonPosition: splashConfig.continueButtonPosition,
        featureHighlights: splashConfig.featureHighlights?.map((highlight: any) => ({
          ...highlight,
          // icon: highlight.icon // Not transferred to avoid localStorage quota issues
        })) || []
      });
    },

    // Get splash config FROM the journey store
    getSplashConfig: () => store.config.splashExperience,

    // Get complete journey for full preview
    getCompleteJourney: () => store.config,

    // Update journey preview settings
    updatePreviewSettings: store.updateJourneyPreview,
  };
};