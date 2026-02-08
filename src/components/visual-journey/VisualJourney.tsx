
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store';
import { ChevronLeft, ChevronRight, Save, Play, Check, AlertTriangle } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';

import EnhancedStep1_ThemeSelection from './steps/EnhancedStep1_ThemeSelection';
import Step2_GameTypeSelector from './steps/Step2_GameTypeSelector';
import Step3_ReelConfiguration from './steps/Step3_ReelConfiguration';
import { Step6_AnimationStudioIntegration } from './steps/Step6_AnimationStudioIntegration';
import AudioComponent from '../AudioComponent';
import Step8_SplashPreloader from './steps/Step8_SplashPreloader';
import Step9_LoadingExperience from './steps/Step9_LoadingExperience';
import Step8_BonusFeatures from './steps/Step8_BonusFeatures';
import Step9_MathLab from './steps/Step9_MathLab';
import Step10_DeepSimulation from './steps/Step10_DeepSimulation';
import Step11_MarketCompliance from './steps/Step11_MarketCompliance';
import Step12_APIExport from './steps/Step12_APIExport';
import StepNavigationFix from './StepNavigationFix';
import DebugNavigationTracker from './debugging/DebugNavigationTracker';
import FixedNavigationHandler from './FixedNavigationHandler';
import NavigationLogger from './NavigationLogger';

import Step2_InstantGameSelector from './instant-steps/Step2_InstantGameSelector';
import Step3_InstantMechanics from './instant-steps/Step3_InstantMechanics';
import Step4_InstantAssets from './instant-steps/Step4_InstantAssets';

import Step1_CrashMechanics from './crash-steps/Step1_CrashMechanics';
import Step2_CrashVisuals from './crash-steps/Step2_CrashVisuals';
import Step2_CrashVisuals from './crash-steps/Step2_CrashVisuals';
import Step4_CrashExport from './crash-steps/Step4_CrashExport';

import { SLOT_STEPS_V2 } from './slots-new/steps-config';

// Define the steps for Slot Games
const SLOT_STEPS = [
  {
    id: 'theme-design',
    title: 'Design Your Theme',
    description: 'Select and customize your game\'s visual theme',
    component: EnhancedStep1_ThemeSelection
  },
  {
    id: 'game-type',
    title: 'Choose Game Type',
    description: 'Select the type of slot game you want to create',
    component: Step2_GameTypeSelector
  },
  {
    id: 'grid-layout',
    title: 'Create Game Grid',
    description: 'Design your game grid and pay mechanism',
    component: Step3_ReelConfiguration
  },
  {
    id: 'animation-studio',
    title: 'Animation & Masking Studio',
    description: 'Configure real-time animations, masking, and visual effects',
    component: Step6_AnimationStudioIntegration
  },
  {
    id: 'loading-experience',
    title: 'Loading Experience',
    description: 'Design professional loading screens and progress indicators',
    component: Step9_LoadingExperience
  },
  {
    id: 'splash-screen',
    title: 'Game Splash & Branding',
    description: 'Design game introduction screen and branding elements',
    component: Step8_SplashPreloader
  },
  {
    id: 'audio-experience',
    title: 'Audio & Experience',
    description: 'Compose theme music and sound effects',
    component: AudioComponent
  },
  {
    id: 'bonus-features',
    title: 'Feature Selection',
    description: 'Configure free spins, bonus games and special features',
    component: Step8_BonusFeatures
  },
  {
    id: 'math-model',
    title: 'Math Laboratory',
    description: 'Configure RTP, volatility and optimize symbol weights',
    component: Step9_MathLab
  },
  {
    id: 'deep-simulation',
    title: 'Deep Simulation',
    description: 'Run comprehensive simulations to verify math model',
    component: Step10_DeepSimulation
  },
  {
    id: 'market-compliance',
    title: 'Market Compliance',
    description: 'Ensure game compliance with different market regulations',
    component: Step11_MarketCompliance
  },
  {
    id: 'api-export',
    title: 'API Export',
    description: 'Export configuration to API and RGS',
    component: Step12_APIExport
  }
];

// Define the steps for Crash Games
const CRASH_STEPS = [
  {
    id: 'crash-mechanics',
    title: 'Game Mechanics',
    description: 'Configure multiplier curve and crash probability',
    component: Step1_CrashMechanics
  },
  {
    id: 'crash-visuals',
    title: 'Visual Customization',
    description: 'Design the graph, background, and object assets',
    component: Step2_CrashVisuals
  },
  {
    id: 'crash-social',
    title: 'Social Features',
    description: 'Configure chat, leaderboards and social feed',
    component: React.lazy(() => import('./crash-steps/Step3_CrashSocial'))
  },
  {
    id: 'crash-ultimate',
    title: 'Ultimate Polish',
    description: 'Configure particles, camera effects, and skins',
    component: React.lazy(() => import('./crash-steps/Step5_CrashUltimate'))
  },
  {
    id: 'crash-analytics',
    title: 'Analytics & Math',
    description: 'Verify RTP and run simulations',
    component: React.lazy(() => import('./crash-steps/Step6_CrashAnalytics'))
  },
  {
    id: 'crash-export',
    title: 'Export & Launch',
    description: 'Generate manifest and export game bundle',
    component: Step4_CrashExport
  }
];

// Define the steps for Instant Games (Plinko, Mines, etc.)
const INSTANT_STEPS = [
  {
    id: 'theme-design',
    title: 'Design Your Theme',
    description: 'Select and customize your game\'s visual theme',
    component: EnhancedStep1_ThemeSelection
  },
  {
    id: 'game-type',
    title: 'Instant Game Selection',
    description: 'Choose your instant win mechanic',
    component: Step2_InstantGameSelector
  },
  {
    id: 'mechanics',
    title: 'Mechanics & Physics',
    description: 'Tune the physics, math, and logic of your game',
    component: Step3_InstantMechanics
  },
  {
    id: 'visual-assets',
    title: 'Visual Assets',
    description: 'Customize balls, bombs, coins and other assets',
    component: Step4_InstantAssets
  },
  {
    id: 'audio-experience',
    title: 'Audio & Experience',
    description: 'Compose theme music and sound effects',
    component: AudioComponent
  },
  {
    id: 'api-export',
    title: 'API Export',
    description: 'Export configuration to API and RGS',
    component: Step12_APIExport
  }
];

// StepIndicator component for visual journey navigation
const StepIndicator: React.FC<{
  currentStep: number;
  totalSteps: number;
  steps: Array<{ id: string, title: string }>;
  onStepClick: (step: number) => void;
}> = ({ currentStep, totalSteps, steps, onStepClick }) => {
  // Memoize the step indicators to prevent unnecessary re-renders
  const stepIndicators = React.useMemo(() => {
    return Array.from({ length: totalSteps }).map((_, index) => {
      // A step is completed if we've moved past it
      const isCompleted = index < currentStep;
      // Current step is active
      const isActive = index === currentStep;
      // Allow clicking on completed steps or the next available step
      const isClickable = index <= currentStep;

      return (
        <React.Fragment key={index}>
          {/* Connector line between circles */}
          {index > 0 && (
            <div
              className={`w - 12 h - 1 ${index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                } `}
            />
          )}

          {/* Step circle - with added padding and margin */}
          <button
            onClick={() => isClickable && onStepClick(index)}
            title={`Go to step ${index + 1}: ${steps[index]?.title} `}
            className={`
w - 10 h - 10 rounded - full flex items - center justify - center
transition - all duration - 300 transform 
              ${isActive ? 'scale-110 ring-4 ring-blue-200' : ''}
              ${isCompleted
                ? 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600'
                : isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
m - 1 p - 0.5
  `}
          >
            {isCompleted ? (
              <Check className="w-5 h-5" />
            ) : (
              <span className="font-medium">{index + 1}</span>
            )}

            {/* Small tooltip on hover - visible only on larger screens */}
            <span className="absolute bottom-full mb-2 whitespace-nowrap text-xs bg-gray-800 text-white py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transform -translate-x-1/2 left-1/2 hidden sm:block">
              {steps[index]?.title}
            </span>
          </button>
        </React.Fragment>
      );
    });
  }, [currentStep, totalSteps, steps, onStepClick]);

  return (
    <div className="flex justify-center mb-8 overflow-x-auto py-2">
      <div className="flex items-center min-w-max h-16">
        {stepIndicators}
      </div>
    </div>
  );
};

// Error boundary for VisualJourney component
class VisualJourneyErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorMessage: string, errorComponentStack: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      errorComponentStack: ''
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorMessage: error.message,
      errorComponentStack: ''
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console for debugging
    console.error("Error in VisualJourney component:", error, errorInfo);

    // Save the component stack to state
    this.setState({
      errorComponentStack: errorInfo.componentStack || ''
    });

    // Log additional diagnostics
    console.log("Error caught by VisualJourneyErrorBoundary:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  safeNavigateToStep = (step: number) => {
    try {
      // Use setTimeout and direct window location instead of React state updates
      // to avoid further React errors during error recovery
      setTimeout(() => {
        console.log("Error recovery - navigating to step:", step);
        try {
          window.location.href = window.location.pathname + `? step = ${step} `;
        } catch (e) {
          console.error("Failed to navigate via URL update:", e);
          window.location.reload();
        }
      }, 100);
    } catch (error) {
      console.error("Error during safe navigation recovery:", error);
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // Improved fallback UI with more detailed error reporting and safer recovery
      return (
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-800 mb-4">Navigation Error</h2>
          <p className="text-amber-700 mb-4">
            {this.state.errorMessage || "An error occurred during navigation"}
          </p>
          <p className="text-gray-600 mb-6">
            There was an error navigating between steps. This could be due to
            a state management issue or component unmounting problem.
          </p>

          {/* Error details collapsible section */}
          {this.state.errorComponentStack && (
            <details className="mb-6 text-left bg-white p-3 rounded-lg">
              <summary className="cursor-pointer text-blue-700 font-medium">Technical Error Details</summary>
              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto text-gray-700 max-h-32">
                {this.state.errorComponentStack}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => this.safeNavigateToStep(1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg"
            >
              Go to First Step
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component with error boundary
const VisualJourney: React.FC = () => {
  return (
    <VisualJourneyErrorBoundary>
      <VisualJourneyContent />
    </VisualJourneyErrorBoundary>
  );
};

// Main VisualJourney content component
const VisualJourneyContent: React.FC = () => {
  const {
    config,
    updateConfig,
    nextStep: goToNextGlobalStep,
    hasUnsavedChanges,
    saveProgress
  } = useGameStore();

  // Determine which steps to use
  // We check if the selected game type matches known instant games
  const isInstantGame = React.useMemo(() => {
    const type = config.selectedGameType || config.instantGameType;
    return ['plinko', 'mines', 'coin_flip', 'scratch'].includes(type || '');
  }, [config.selectedGameType, config.instantGameType]);

  const isCrashGame = config.selectedGameType === 'grid' || config.selectedGameType === 'crash';

  const isSlotsV2 = config.selectedGameType === 'slots_v2';

  const VISUAL_STEPS = isSlotsV2
    ? SLOT_STEPS_V2
    : (isCrashGame ? CRASH_STEPS : (isInstantGame ? INSTANT_STEPS : SLOT_STEPS));

  // Local state for visual journey steps
  const [currentVisualStep, setCurrentVisualStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [animationDirection, setAnimationDirection] = useState(1); // 1 for forward, -1 for backward
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Initialize visual journey progress state
  useEffect(() => {
    // Initialize the visualJourney config if it doesn't exist
    if (!config.visualJourney) {
      updateConfig({
        visualJourney: {
          currentStep: currentVisualStep,
          totalSteps: VISUAL_STEPS.length,
          progress: 0,
          completedSteps: {}
        }
      });
    } else {
      // If switching between Slot <-> Instant, reset if step count mismatch or invalid step
      if (config.visualJourney.currentStep >= VISUAL_STEPS.length) {
        setCurrentVisualStep(0);
      } else {
        setCurrentVisualStep(config.visualJourney.currentStep);
      }
    }

    // Calculate initial progress
    updateProgressPercentage(currentVisualStep);
  }, [isInstantGame]); // Re-run init if game type changes class (Slot vs Instant)


  // --- WORKSHOP AUTO-SAVE ---
  useEffect(() => {
    // Determine a stable ID for the draft
    // If gameId is set (after naming), use that. Otherwise use a session placeholder.
    // ACTUALLY: We want to keep the same ID while editing the same session, even if gameId changes.
    // But if we want the "Workshop" to see "Churrita", we should key off the gameId ideally, 
    // OR we just update the metadata in the existing draft file.
    // Let's use a persistent session ID stored in a ref if possible, or just config.gameId if available.
    // Simple approach: Use config.gameId if available, else 'new_draft'.
    // Better: If we use 'user_session_current' it overwrites. 
    // Let's try to use the gameId if it exists, otherwise fall back to a session key.

    const draftIdToSend = config.gameId || 'user_session_current';

    const saveDraft = async () => {
      try {
        console.log('[Workshop] Saving draft...', draftIdToSend);

        const payload = {
          draftId: draftIdToSend,
          userName: 'Creator User',
          gameName: config.displayName || config.gameId || 'Untitled Game',
          description: config.theme?.description || 'Work in progress',
          lastUpdated: new Date().toISOString(),
          currentStep: currentVisualStep,
          config: config
        };

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

    // Debounce save (1s)
    const timeout = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timeout);
  }, [currentVisualStep, config]);

  // Update progress percentage whenever currentVisualStep changes
  const updateProgressPercentage = (stepIndex: number) => {
    const calculatedPercentage = VISUAL_STEPS.length <= 1
      ? 100
      : Math.round((stepIndex / (VISUAL_STEPS.length - 1)) * 100);

    setProgressPercentage(calculatedPercentage);

    // Also update in the global config
    const currentJourney = config.visualJourney;

    updateConfig({
      visualJourney: {
        completedSteps: currentJourney?.completedSteps || {},
        currentStep: stepIndex,
        totalSteps: VISUAL_STEPS.length,
        progress: calculatedPercentage,
      }
    });
  };

  // Track completion status of each step
  useEffect(() => {
    // Update progress percentage
    updateProgressPercentage(currentVisualStep);

    // Mark previous step as complete
    if (currentVisualStep > 0) {
      const stepId = VISUAL_STEPS[currentVisualStep - 1].id;
      const updatedCompletedSteps = {
        ...completedSteps,
        [stepId]: true
      };

      setCompletedSteps(updatedCompletedSteps);

      // Update in global config
      updateConfig({
        visualJourney: {
          completedSteps: updatedCompletedSteps,
          currentStep: currentVisualStep,
          totalSteps: VISUAL_STEPS.length,
          progress: Math.round((currentVisualStep / (VISUAL_STEPS.length - 1)) * 100)
        }
      });
    }
  }, [currentVisualStep]);

  // Enhanced navigation functions with error handling
  const goToNextStep = () => {
    try {
      // Special handling for Step 1 (Theme Selection)
      if (currentVisualStep === 0) {
        // Validate game name exists
        if (!config.gameId) {
          alert("Please enter a game name to continue.");
          return;
        }

        // Show a notification about the game ID
        const gameId = config.gameId;
        const displayName = config.displayName || (gameId ? gameId.split('_')[0].replace(/-/g, ' ') : '');

        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 transform transition-all duration-500 translate-y-20 opacity-0';

        const notificationText = displayName
          ? `Game ID "${gameId}" has been set for "${displayName}"!`
          : `Game ID "${gameId}" has been set!`;

        notification.innerHTML = `
  < svg xmlns = "http://www.w3.org/2000/svg" class="h-5 w-5" viewBox = "0 0 20 20" fill = "currentColor" >
    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg >
  <span>${notificationText}</span>
`;
        document.body.appendChild(notification);

        // Animate notification
        setTimeout(() => {
          notification.style.transform = 'translateY(0)';
          notification.style.opacity = '1';
        }, 100);

        setTimeout(() => {
          notification.style.transform = 'translateY(20px)';
          notification.style.opacity = '0';

          setTimeout(() => {
            document.body.removeChild(notification);
          }, 500);
        }, 2000);
      }

      if (currentVisualStep < VISUAL_STEPS.length - 1) {
        // Save important state before navigation
        const currentSelectedGameType = config.selectedGameType;
        console.log("Moving to next step - preserving game type:", currentSelectedGameType);

        // First update animation direction and mark step as complete
        setAnimationDirection(1);

        // Use a safer approach to update local state
        const nextStepIndex = currentVisualStep + 1;
        const currentStepId = VISUAL_STEPS[currentVisualStep].id;

        // Update completed steps in a way that doesn't depend on previous state
        const updatedCompletedSteps = {
          ...completedSteps,
          [currentStepId]: true
        };

        // Set all state updates in a single batch
        setTimeout(() => {
          // First update local state
          setCompletedSteps(updatedCompletedSteps);
          setCurrentVisualStep(nextStepIndex);

          // Then update global config in a way that preserves selections
          setTimeout(() => {
            updateConfig({
              visualJourney: {
                completedSteps: updatedCompletedSteps,
                currentStep: nextStepIndex,
                totalSteps: VISUAL_STEPS.length,
                progress: Math.round((nextStepIndex / (VISUAL_STEPS.length - 1)) * 100),
              },
              // Always preserve the game type selection
              selectedGameType: currentSelectedGameType
            });

            // Add final verification after all state updates
            setTimeout(() => {
              const updatedConfig = useGameStore.getState().config;
              if (updatedConfig.selectedGameType !== currentSelectedGameType) {
                console.warn("Selection was lost after navigation - forcing update");
                useGameStore.getState().updateConfig({
                  selectedGameType: currentSelectedGameType
                });
              }
            }, 100);
          }, 50);
        }, 10);
      } else {
        // When visual journey is complete, safely move to next global step
        setTimeout(() => {
          goToNextGlobalStep();
        }, 50);
      }
    } catch (error) {
      console.error("Error in goToNextStep:", error);
      // In case of error, try to recover by using our safe navigation helper
      const nextStep = Math.min(currentVisualStep + 1, VISUAL_STEPS.length - 1);
      safeNavigate(nextStep, "forward");
    }
  };

  const goToPrevStep = () => {
    try {
      if (currentVisualStep > 0) {
        // Store important state before navigation
        const currentSelectedGameType = config.selectedGameType;
        console.log("Going back - preserving game type:", currentSelectedGameType);

        // Calculate next step index safely
        const prevStepIndex = Math.max(0, currentVisualStep - 1);

        // Update animation direction first
        setAnimationDirection(-1);

        // Use timeouts to separate state updates and reduce risk of React errors
        setTimeout(() => {
          // Update local state
          setCurrentVisualStep(prevStepIndex);

          // Then update global state 
          setTimeout(() => {
            updateConfig({
              visualJourney: {
                completedSteps: config.visualJourney?.completedSteps || {},
                currentStep: prevStepIndex,
                totalSteps: VISUAL_STEPS.length,
                progress: Math.round((prevStepIndex / (VISUAL_STEPS.length - 1)) * 100)
              },
              // Always preserve the game type selection
              selectedGameType: currentSelectedGameType
            });

            // Verify and fix if needed after all state updates
            setTimeout(() => {
              const updatedConfig = useGameStore.getState().config;
              if (updatedConfig.selectedGameType !== currentSelectedGameType) {
                console.warn("Selection was lost - forcing update");
                useGameStore.getState().updateConfig({
                  selectedGameType: currentSelectedGameType
                });
              }

              // If returning to game type selection, ensure UI reflects selection
              if (prevStepIndex === 0 && currentSelectedGameType) {
                console.log("Returning to game type selection - refreshing UI");
                setTimeout(() => {
                  try {
                    const selectedCard = document.querySelector(`[data - game - type= "${currentSelectedGameType}"]`);
                    if (selectedCard) {
                      selectedCard.classList.add('ring-4', 'ring-green-500', 'shadow-lg', 'scale-[1.02]');
                    }
                  } catch (e) {
                    console.warn("Could not update UI:", e);
                  }
                }, 150);
              }
            }, 100);
          }, 50);
        }, 10);
      }
    } catch (error) {
      console.error("Error in goToPrevStep:", error);
      // Recover using our safe navigation helper
      const prevStep = Math.max(0, currentVisualStep - 1);
      safeNavigate(prevStep, "backward");
    }
  };

  const goToStep = (stepIndex: number) => {
    try {
      if (stepIndex === currentVisualStep) return; // Don't re-render if clicking current step

      // Store important state
      const currentSelectedGameType = config.selectedGameType;
      console.log("Direct navigation to step", stepIndex, "- preserving game type:", currentSelectedGameType);

      // Determine animation direction
      const direction = stepIndex > currentVisualStep ? 1 : -1;
      setAnimationDirection(direction);

      // Use timeouts to separate state updates
      setTimeout(() => {
        // Update local state
        setCurrentVisualStep(stepIndex);

        // Then update global state
        setTimeout(() => {
          updateConfig({
            visualJourney: {
              completedSteps: config.visualJourney?.completedSteps || {},
              currentStep: stepIndex,
              totalSteps: VISUAL_STEPS.length,
              progress: Math.round((stepIndex / (VISUAL_STEPS.length - 1)) * 100)
            },
            // Always preserve game type selection
            selectedGameType: currentSelectedGameType
          });

          // Verify state after updates
          setTimeout(() => {
            const updatedConfig = useGameStore.getState().config;
            if (updatedConfig.selectedGameType !== currentSelectedGameType) {
              console.warn("Selection was lost - forcing update");
              useGameStore.getState().updateConfig({
                selectedGameType: currentSelectedGameType
              });
            }

            // Update UI if going to game type selection screen
            if (stepIndex === 0 && currentSelectedGameType) {
              setTimeout(() => {
                try {
                  const selectedCard = document.querySelector(`[data - game - type= "${currentSelectedGameType}"]`);
                  if (selectedCard) {
                    selectedCard.classList.add('ring-4', 'ring-green-500', 'shadow-lg', 'scale-[1.02]');
                  }
                } catch (e) {
                  console.warn("Could not update UI:", e);
                }
              }, 150);
            }
          }, 100);
        }, 50);
      }, 10);
    } catch (error) {
      console.error("Error in goToStep:", error);
      // Recover using our safe navigation helper
      safeNavigate(stepIndex, stepIndex > currentVisualStep ? "forward" : "backward");
    }
  };

  // Get current component to render
  const CurrentStepComponent = VISUAL_STEPS[currentVisualStep].component;

  // Animation variants
  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0
    })
  };

  // Handle save progress
  const handleSaveProgress = () => {
    saveProgress();
  };

  // Get completion percentage from state - ensures it's reactive and consistent
  const completionPercentage = progressPercentage;

  return (
    <div className="visual-journey-container">
      {/* Prioritized comprehensive fixed navigation handler */}
      <FixedNavigationHandler key={`fixed - nav - ${currentVisualStep} `} />

      {/* Legacy navigation fixes - as fallback */}
      <StepNavigationFix />
      <DebugNavigationTracker />

      {/* Persistent navigation logger */}
      <NavigationLogger />

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            {VISUAL_STEPS[currentVisualStep].title}
          </h1>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-600">
              Step {currentVisualStep + 1} of {VISUAL_STEPS.length}
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="text-blue-700 font-semibold">{completionPercentage}%</div>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          {VISUAL_STEPS[currentVisualStep].description}
        </p>

        {/* Visual progress bar - enhanced with ProgressIndicator component */}
        <ProgressIndicator
          progress={completionPercentage}
          showPercentage={false}
          height={6}
          color="bg-blue-600"
          className="w-full"
        />

        {/* Backup traditional progress bar in case the component has issues */}
        <div className="h-0 invisible">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
              style={{ width: `${completionPercentage}% ` }}
            />
          </div>
        </div>
      </div>

      {/* Step indicator circles */}
      <StepIndicator
        currentStep={currentVisualStep}
        totalSteps={VISUAL_STEPS.length}
        steps={VISUAL_STEPS}
        onStepClick={goToStep}
      />

      {/* Content area with animations */}
      <AnimatePresence initial={false} custom={animationDirection} mode="wait">
        <motion.div
          key={VISUAL_STEPS[currentVisualStep].id}
          custom={animationDirection}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="min-h-[500px]"
        >
          <CurrentStepComponent />
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
        <button
          onClick={goToPrevStep}
          disabled={currentVisualStep === 0}
          className={`
            flex items - center gap - 2 px - 6 py - 3 rounded - lg
            ${currentVisualStep === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors'
            }
`}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveProgress}
            className={`
px - 4 py - 2 rounded - lg border flex items - center gap - 2
              ${hasUnsavedChanges
                ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 animate-pulse'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }
`}
          >
            <Save className="w-4 h-4" />
            Save Progress
          </button>

          <button
            onClick={() => alert('Game preview feature coming soon!')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Play className="w-4 h-4" />
            Preview
          </button>
        </div>

        <button
          onClick={(e) => {
            console.log('🔄 Next button clicked - enforcing reliable navigation');
            // Set a data attribute on the button to mark it as clicked - helps FixedNavigationHandler identify it
            const btn = e.currentTarget;
            btn.setAttribute('data-next-clicked', 'true');
            btn.setAttribute('data-next-timestamp', Date.now().toString());

            // Store current state for navigation
            const store = useGameStore.getState();
            const beforeStep = store.currentStep;
            const beforeVisualStep = currentVisualStep;

            // Primary navigation - try goToNextStep first
            goToNextStep();

            // Enhanced reliability for all steps, not just step 0->1
            setTimeout(() => {
              // Check if local visual step was updated
              const visualStepUpdated = currentVisualStep !== beforeVisualStep;
              // Check if global step was updated 
              const globalStepUpdated = useGameStore.getState().currentStep !== beforeStep;

              console.log(`🔄 Navigation check: Visual step updated: ${visualStepUpdated}, Global step updated: ${globalStepUpdated} `);

              // If either navigation system failed, apply direct fixes
              if (!visualStepUpdated || !globalStepUpdated) {
                console.log('🔄 Navigation incomplete, applying direct state updates');

                // 1. Update global store first
                const targetGlobalStep = beforeStep + 1;
                useGameStore.setState(state => ({
                  ...state,
                  currentStep: targetGlobalStep,
                  savedProgress: {
                    ...state.savedProgress,
                    [beforeStep]: {
                      config: state.config,
                      timestamp: new Date()
                    }
                  }
                }));

                // 2. Directly update visual step if needed
                if (!visualStepUpdated) {
                  // Force the local state update
                  console.log('🔄 Forcing visual step update');
                  setCurrentVisualStep(beforeVisualStep + 1);
                }

                // 3. Final verification for critical steps
                setTimeout(() => {
                  const finalGlobalStep = useGameStore.getState().currentStep;
                  if (finalGlobalStep !== targetGlobalStep) {
                    console.log('🔄 All direct updates failed, using URL redirect as last resort');
                    // Use URL-based navigation as absolute last resort
                    window.location.href = `/? step = ${targetGlobalStep}& force=true & t=${Date.now()} `;
                  }
                }, 200);
              }
            }, 300);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          data-next-button="true"
        >
          {currentVisualStep < VISUAL_STEPS.length - 1 ? (
            <>
              Next
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Complete
              <Check className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Add safer navigation methods to be used across components
export const safeNavigate = (targetStep: number, direction: "forward" | "backward" = "forward") => {
  try {
    console.log(`Using fail - safe page reload navigation to step ${targetStep} (${direction})`);

    // Don't attempt to use React for navigation - this is the source of the errors
    // Instead, use full page reload with URL parameters which completely bypasses React

    // First save any important state to localStorage for later retrieval
    try {
      const currentStore = useGameStore.getState();
      localStorage.setItem('slotai_preserved_config', JSON.stringify({
        timestamp: Date.now(),
        config: currentStore.config,
        lastStep: currentStore.currentStep,
        targetStep: targetStep
      }));
      console.log("Preserved game state for navigation");
    } catch (stateError) {
      console.error("Failed to preserve state:", stateError);
    }

    // Create navigation parameters
    const navParams = new URLSearchParams();
    navParams.set('step', targetStep.toString());
    navParams.set('t', Date.now().toString());
    navParams.set('clean', 'true');
    navParams.set('reset', 'true');
    navParams.set('visual', 'true'); // Ensure we stay in visual mode

    // Use a short timeout to avoid immediate navigation which might interact with React
    setTimeout(() => {
      try {
        // Force a full page reload by setting document.location
        document.location.href = '/?' + navParams.toString();
      } catch (navError) {
        console.error("Navigation failed:", navError);

        // Absolute last resort - use simpler URL with fewer parameters
        window.location.href = '/?step=' + targetStep + '&visual=true';
      }
    }, 50);

    return true;
  } catch (error) {
    console.error("Navigation system completely failed:", error);

    // Last resort emergency navigation
    try {
      window.location.href = '/?step=' + targetStep + '&emergency=true';
    } catch {
      // If all else fails, reload the page
      window.location.reload();
    }

    return false;
  }
};

export default VisualJourney;