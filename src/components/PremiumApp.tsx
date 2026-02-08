import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../store';
import PremiumLayout from './layout/PremiumLayout';
import EnhancedGameCrafterDashboard from './EnhancedGameCrafterDashboard';
import ConfigModal from './ConfigModal';
import StandaloneGameModal from './modals/StandaloneGameModal';
import { Loader, Sparkles } from 'lucide-react';
import { useWarningPopup } from './popups';

// Import step components
import ThemeExplorer from './visual-journey/ThemeExplorer';
import Step2_GameTypeSelector from './visual-journey/steps-working/Step2_GameTypeSelector';
import Step3_ReelConfiguration from './visual-journey/steps-working/Step3_ReelConfiguration';
import Step5_SymbolAnimation from './visual-journey/steps-working/Step6_SymbolAnimation';
import Step6_GameAssets from './visual-journey/steps-working/Step4_GameAssets';
import { Step7_AnimationStudioIntegration } from './visual-journey/steps-working/Step7_AnimationStudioIntegration';
import Step8_WinAnimationWorkshop from './visual-journey/steps-working/Step8_WinAnimationWorkshop';
import Step9_LoadingExperience from './visual-journey/steps-working/Step9_LoadingExperience';
import BonusFeatures from './visual-journey/steps-working/Step12_BonusFeatures';
import Step10_DeepSimulation from './visual-journey/steps-working/Step14_DeepSimulation';
import MarketCompliance from './visual-journey/MarketCompliance';
import Step12_APIExport from './visual-journey/steps-working/API_Export';

// Custom Theme Explorer
import EnhancedThemeExplorer from './visual-journey/steps-working/Step1_EnhancedThemeExplorer';
import Step11_EnhancedAudio from './visual-journey/steps-working/Step11_EnhancedAudio';
import Step10ComingSoon from './visual-journey/steps-working/step10_coming_soon';
import { MathWizard } from './visual-journey/steps-working/MathModal';
import Step5_SymbolGenerationNe from './visual-journey/steps-working/Step5_SymbolGenerationNew';

// Import Scratch Steps
// Import Scratch Steps
import Step2_MechanicsAndMath from './visual-journey/scratch-steps/MechanicsFlow';
import Step3_CardAesthetics from './visual-journey/scratch-steps/AestheticsFlow';
import Step4_GameplayAssets from './visual-journey/scratch-steps/AssetsFlow';
import Step5_Production from './visual-journey/scratch-steps/ProductionFlow';
import Step7_Export from './visual-journey/scratch-steps/Step7_Export';


// Single source of truth for all steps
const SLOT_STEPS = [
  {
    id: 'theme-selection',
    title: 'Theme Selection',
    description: 'Choose the perfect visual theme',
    component: EnhancedThemeExplorer || ThemeExplorer,
    showCanvas: false
  },
  {
    id: 'game-type',
    title: 'Game Type',
    description: 'Select your game mechanics',
    component: Step2_GameTypeSelector,
    showCanvas: false
  },
  {
    id: 'reel-config',
    title: 'Grid Layout',
    description: 'Configure your game grid',
    component: Step3_ReelConfiguration,
    showCanvas: true
  },
  {
    id: 'game-assets',
    title: 'Game Assets',
    description: 'Customize backgrounds, frames, and UI elements',
    component: Step6_GameAssets,
    showCanvas: true
  },
  {
    id: 'symbol-creation',
    title: 'Symbol Creation',
    description: 'Create expressive game symbols',
    component: Step5_SymbolGenerationNe,
    showCanvas: true
  },
  {
    id: 'symbol-animation',
    title: 'Symbol Animation',
    description: 'Animate symbols with professional effects',
    component: Step5_SymbolAnimation,
    showCanvas: true
  },
  {
    id: 'animation-studio',
    title: 'Animation & Masking Studio',
    description: 'Configure real-time animations, masking, and visual effects',
    component: Step7_AnimationStudioIntegration,
    showCanvas: true
  },
  {
    id: 'win-animations',
    title: 'Win Animations',
    description: 'Create exciting win celebrations',
    component: Step8_WinAnimationWorkshop,
    showCanvas: true
  },
  {
    id: 'loading-experience',
    title: 'Loading Experience',
    description: 'Design professional loading screens and progress indicators',
    component: Step9_LoadingExperience,
    showCanvas: false
  },
  {
    id: 'splash-screen',
    title: 'Game Splash & Branding',
    description: 'Design game introduction screen and branding elements',
    component: Step10ComingSoon,
    showCanvas: false
  },
  {
    id: 'audio',
    title: 'Audio & Experience',
    description: 'Add sounds and music',
    component: Step11_EnhancedAudio,
    showCanvas: true
  },
  {
    id: 'bonus-features',
    title: 'Bonus Features',
    description: 'Design special gameplay mechanics',
    component: BonusFeatures,
    showCanvas: true
  },
  {
    id: 'math-model',
    title: 'Math Model',
    description: 'Configure RTP and volatility',
    component: MathWizard,
    showCanvas: false
  },
  {
    id: 'simulation',
    title: 'Game Simulation',
    description: 'Test your game with thousands of spins',
    component: Step10_DeepSimulation,
    showCanvas: true
  },
  {
    id: 'compliance',
    title: 'Market Compliance',
    description: 'Ensure your game meets regulatory requirements for different markets.',
    component: MarketCompliance,
    showCanvas: false
  },
  {
    id: 'api-export',
    title: 'API Export',
    description: 'Export your game for deployment',
    component: Step12_APIExport,
    showCanvas: false
  }
];

// UPDATED SCRATCH STEPS (Domain Model Aligned)

// Import Crash Steps
import Step1_CrashMechanics from './visual-journey/crash-steps/Step1_CrashMechanics';
import Step2_CrashVisuals from './visual-journey/crash-steps/Step2_CrashVisuals';
import Step3_CrashSocial from './visual-journey/crash-steps/Step3_CrashSocial';
import Step4_CrashExport from './visual-journey/crash-steps/Step4_CrashExport';

// CRASH GAMES STEPS
const CRASH_STEPS = [
  {
    id: 'theme-selection',
    title: 'Theme Selection',
    description: 'Choose the perfect visual theme',
    component: EnhancedThemeExplorer || ThemeExplorer,
    showCanvas: false
  },
  {
    id: 'crash-mechanics',
    title: 'Game Mechanics',
    description: 'Configure multiplier curve and crash probability',
    component: Step1_CrashMechanics,
    showCanvas: false
  },
  {
    id: 'crash-visuals',
    title: 'Visual Customization',
    description: 'Design the graph, background, and object assets',
    component: Step2_CrashVisuals,
    showCanvas: false
  },
  {
    id: 'crash-social',
    title: 'Social Features',
    description: 'Configure multiplayer feed, chat, and leaderboards',
    component: Step3_CrashSocial,
    showCanvas: false
  },
  {
    id: 'crash-export',
    title: 'Export & Launch',
    description: 'Generate manifest and export game bundle',
    component: Step4_CrashExport,
    showCanvas: false
  }
];

// UPDATED SCRATCH STEPS (Refactored 6-Step Flow)
const SCRATCH_STEPS = [
  {
    id: 'theme-selection',
    title: 'Theme & Concept',
    description: 'Choose your card theme and style',
    component: EnhancedThemeExplorer || ThemeExplorer,
    showCanvas: false
  },
  {
    id: 'scratch-mechanics-math',
    title: 'Mechanics & Math',
    description: 'Configure gameplay logic, grid, and math model',
    component: Step2_MechanicsAndMath,
    showCanvas: true
  },
  {
    id: 'scratch-aesthetics',
    title: 'Card Design',
    description: 'Design the visual look: Backgrounds, Foil, Logos',
    component: Step3_CardAesthetics,
    showCanvas: true
  },
  {
    id: 'scratch-gameplay',
    title: 'Gameplay Assets',
    description: 'Interactive elements: Brushes, Symbols, Audio',
    component: Step4_GameplayAssets,
    showCanvas: true
  },
  {
    id: 'scratch-production',
    title: 'Production & Polish',
    description: 'Loading screens, rules, and marketing assets',
    component: Step5_Production,
    showCanvas: false
  },
  {
    id: 'scratch-export',
    title: 'Export',
    description: 'Final review and export',
    component: Step7_Export,
    showCanvas: false
  }
];

// INSTANT GAMES STEPS
const INSTANT_STEPS = [
  {
    id: 'instant-selector',
    title: 'Game Selection',
    description: 'Choose your instant game type',
    component: React.lazy(() => import('./visual-journey/instant-steps/Step2_InstantGameSelector')),
    showCanvas: false
  },
  {
    id: 'theme-selection',
    title: 'Theme & Concept',
    description: 'Choose your game theme and visuals',
    component: EnhancedThemeExplorer || ThemeExplorer,
    showCanvas: false
  },
  {
    id: 'instant-mechanics',
    title: 'Mechanics',
    description: 'Configure game rules and logic',
    component: React.lazy(() => import('./visual-journey/instant-steps/Step3_InstantMechanics')),
    showCanvas: false // We handle preview internally
  },
  {
    id: 'instant-assets',
    title: 'Visual Assets',
    description: 'Customize balls, mines, and coins',
    component: React.lazy(() => import('./visual-journey/instant-steps/Step4_InstantAssets')),
    showCanvas: false
  },
  {
    id: 'instant-production',
    title: 'Production',
    description: 'Finalize and export',
    component: Step7_Export,
    showCanvas: false
  }
];

const PremiumApp: React.FC = () => {
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [, setForceUpdateCounter] = useState(0);
  const forceUpdate = useCallback(() => setForceUpdateCounter(prev => prev + 1), []);

  const {
    gameType,
    setGameType,
    currentStep,
    setStep,
    hasUnsavedChanges,
    saveProgress,
    config
  } = useGameStore();

  // --- LOAD DRAFT LOGIC ---
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get('draftId');
  const stepParam = searchParams.get('step');
  const [isHydrating, setIsHydrating] = useState(false);

  useEffect(() => {
    // Check for gameType in URL
    const gameTypeParam = searchParams.get('gameType');
    if (gameTypeParam) {
      console.log('[PremiumApp] Setting game type from URL:', gameTypeParam);
      useGameStore.getState().setGameType(gameTypeParam);
    }

    if (draftIdParam && !isHydrating) {
      setIsHydrating(true);
      console.log('[PremiumApp] Loading draft:', draftIdParam);

      fetch('/api/rgs/drafts')
        .then(res => res.json())
        .then(drafts => {
          const draft = drafts.find((d: any) => d.draftId === draftIdParam);
          if (draft && draft.config) {
            // Hydrate Store
            const { setConfig, setGameType, setStep } = useGameStore.getState();

            console.log('[PremiumApp] Hydrating config:', draft.config);

            // 1. Set Game Type first to ensure correct steps are loaded
            if (draft.config.gameType) {
              setGameType(draft.config.gameType);
            }

            // 2. Set Config
            setConfig(draft.config);

            // 3. Jump to Step
            if (stepParam) {
              const targetStep = parseInt(stepParam);
              setStep(targetStep);
            } else if (typeof draft.currentStep === 'number') {
              setStep(draft.currentStep);
            }
          }
        })
        .catch(err => console.error('Failed to load draft', err))
        .finally(() => setIsHydrating(false));
    }
  }, [draftIdParam, stepParam, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // --- WORKSHOP AUTO-SAVE LOGIC ---
  useEffect(() => {
    // Determine a stable ID for the draft
    const draftIdToSend = config.gameId || 'user_session_current';

    const saveDraft = async () => {
      try {
        const payload = {
          draftId: draftIdToSend,
          userName: 'Creator User',
          gameName: config.displayName || config.gameId || 'Untitled Game',
          description: (config as any).themeDescription || 'Work in progress',
          lastUpdated: new Date().toISOString(),
          currentStep: currentStep,
          config: config
        };

        const payloadSize = new Blob([JSON.stringify(payload)]).size;
        console.log(`[Workshop] Saving draft via PremiumApp... ID: ${draftIdToSend}, Size: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`);

        const res = await fetch('/api/rgs/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          console.log('[Workshop] Draft saved successfully:', draftIdToSend);
        } else {
          console.error('[Workshop] Failed to save draft:', res.status);
        }
      } catch (e) {
        console.error('[Workshop] Error saving draft:', e);
      }
    };

    // Debounce save (1s) to avoid flooding the server
    const timeout = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timeout);
  }, [currentStep, config]); // Re-run on step change or config update

  const steps = React.useMemo(() => {
    switch (gameType) {
      case 'crash':
        return CRASH_STEPS;
      case 'scratch':
        return SCRATCH_STEPS;
      case 'instant':
        return INSTANT_STEPS;
      case 'slots':
      case 'visual_journey':
      default:
        return SLOT_STEPS;
    }
  }, [gameType]);

  useEffect(() => {
    useGameStore.getState().setTotalSteps(steps.length);
    try {
      localStorage.setItem('slotai_last_step', currentStep.toString());
    } catch (e) { }
  }, [currentStep, steps.length]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  }, [currentStep, setStep]);

  const handleNextStep = useCallback(async () => {
    // 1. Theme Selection Check (Step 0)
    if (currentStep === 0) {
      if (!config?.theme?.selectedThemeId) {
        alert('Please select a theme before continuing to the next step.');
        return;
      }
      if (!config.gameId || !config.displayName) {
        alert('Please enter a game name before continuing to the next step.');
        return;
      }
      saveProgress();

      try {
        const { createFoldersForCurrentGame } = await import('../utils/folderCreator');
        console.log('Creating folders for game:', config.gameId);
        await createFoldersForCurrentGame();
      } catch (error) {
        console.error('Error creating game folders:', error);
      }
      setStep(currentStep + 1);
      return;
    }

    // 2. Normal Transition for all other steps
    if (currentStep < steps.length - 1) {
      saveProgress();
      setStep(currentStep + 1);
    }
  }, [currentStep, config, saveProgress, setStep, steps.length]);

  const togglePreview = useCallback(() => {
    setPreviewFullscreen(prev => !prev);
  }, []);

  if (!gameType) {
    return (
      <>
        <AnimatePresence>
          {showIntro && (
            <motion.div
              className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center text-white">
                <Sparkles className="w-24 h-24 text-red-500 mx-auto" />
                <h1 className="text-4xl font-bold mt-6">SlotAI Game Crafter</h1>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={showIntro ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
          <EnhancedGameCrafterDashboard
            setGameType={setGameType}
            setStep={setStep}
            setShowConfig={setShowConfig}
          />
        </div>

        {showConfig && (
          <ConfigModal
            isOpen={showConfig}
            onClose={() => setShowConfig(false)}
          />
        )}
      </>
    );
  }

  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData?.component || React.Fragment;

  const StepComponentWithKey = React.useMemo(() => {
    return function StepRenderer() {
      return (
        <div key={`step-container-${currentStep}`} className="w-full h-full">
          {currentStepData ? (
            <CurrentStepComponent key={`step-${currentStep}`} />
          ) : (
            <div className="p-8 text-center text-red-600 border-2 border-red-200 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Missing Component</h3>
              <p>No component found for step {currentStep}.</p>
            </div>
          )}
        </div>
      );
    };
  }, [currentStep, currentStepData, CurrentStepComponent]);

  const shouldShowCanvas = currentStepData?.showCanvas ?? false;

  return (
    <>
      <PremiumLayout
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
        stepTitle={currentStepData?.title || 'Game Creation'}
        stepDescription={currentStepData?.description || 'Building your game'}
        onPrevStep={handlePrevStep}
        onNextStep={handleNextStep}
        onSave={saveProgress}
        onPreview={togglePreview}
        showCanvas={shouldShowCanvas}
        hasUnsavedChanges={hasUnsavedChanges}
        gameId={config?.gameId || ''}
        gameName={config?.displayName || 'New Game'}
      >
        <Suspense fallback={<PremiumLoader message={`Loading ${currentStepData?.title || 'content'}`} />}>
          <StepComponentWithKey />
        </Suspense>
      </PremiumLayout>

      {showConfig && (
        <ConfigModal
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
        />
      )}

      <StandaloneGameModal />
    </>
  );
};

const PremiumLoader: React.FC<{ message?: string }> = ({ message = 'Loading' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
};

export default PremiumApp;