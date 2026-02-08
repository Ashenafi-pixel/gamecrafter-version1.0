/**
 * SimpleStepNavigator.tsx
 * 
 * A clean, simplified step navigation system without the complexity
 * of the previous implementation. This component follows SOLID principles
 * and avoids the race conditions that caused navigation problems.
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useGameStore } from '../../../store';
import LoadLimiter from '../../LoadLimiter';

// Step component imports - using existing step components
import EnhancedStep1_ThemeSelection from './steps/EnhancedStep1_ThemeSelection';
import Step2_GameTypeSelector from './steps-working/Step2_GameTypeSelector';
import Step3_ReelConfiguration from './steps-working/Step3_ReelConfiguration';
import Step4_SymbolGeneration from './steps/Step4_SymbolGeneration';
import Step5_GameAssets from './steps/Step5_GameAssets';
import { Step6_AnimationStudioIntegration } from './steps/Step6_AnimationStudioIntegration';
import Step7_WinAnimationWorkshop from './steps/Step7_WinAnimationWorkshop';
import AudioComponent from '../../AudioComponent';
import Step8_BonusFeatures from './steps/Step8_BonusFeatures';
import Step9_MathLab from './steps-working/Step13_MathLab';

interface StepConfig {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
}

// Define steps with explicit step numbers to avoid index confusion
const STEPS: StepConfig[] = [
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
    id: 'symbol-generator',
    title: 'Symbol Generator',
    description: 'Generate and customize game symbols',
    component: Step4_SymbolGeneration
  },
  {
    id: 'game-assets',
    title: 'Game Assets',
    description: 'Customize backgrounds, frames, and UI elements',
    component: Step5_GameAssets
  },
  {
    id: 'animation-studio',
    title: 'Animation & Masking Studio',
    description: 'Configure real-time animations, masking, and visual effects',
    component: Step6_AnimationStudioIntegration
  },
  {
    id: 'win-animation',
    title: 'Win Animation Workshop',
    description: 'Create dazzling animations for winning combinations',
    component: Step7_WinAnimationWorkshop
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
  }
];

const SimpleStepNavigator: React.FC = () => {
  // Use local state to manage steps to avoid dependency on global state for rendering
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Get global state for saving data, but don't depend on it for UI
  const { updateConfig, config, saveProgress } = useGameStore();

  // Initialize from URL parameter on first load
  useEffect(() => {
    // Check for step URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    
    if (stepParam) {
      const parsedStep = parseInt(stepParam, 10);
      if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep < STEPS.length) {
        setCurrentStepIndex(parsedStep);
        updateUrlParam(parsedStep);
      }
    }
  }, []);

  // Clean, simple navigation functions
  const goToNextStep = () => {
    console.log(`[SimpleNav] goToNextStep called - currentStepIndex: ${currentStepIndex}, total steps: ${STEPS.length}, isTransitioning: ${isTransitioning}`);
    
    if (currentStepIndex < STEPS.length - 1) {
      // Perform any validation needed here
      if (currentStepIndex === 0 && !config.gameId) {
        console.warn("[SimpleNav] Validation failed: Missing gameId");
        alert("Please enter a game name to continue.");
        return;
      }
      
      if (isTransitioning) {
        console.warn("[SimpleNav] Navigation blocked: Currently transitioning");
        return;
      }
      
      // Log navigation for debugging
      console.log(`[SimpleNav] Moving from step ${currentStepIndex} to ${currentStepIndex + 1}`);
      
      // Save current progress
      saveProgress();
      
      // Set transitioning state for animations
      setIsTransitioning(true);
      
      // Use timeout to avoid immediate state updates
      setTimeout(() => {
        // Move to next step
        setCurrentStepIndex(prevStep => prevStep + 1);
        
        // Update URL to reflect new step
        updateUrlParam(currentStepIndex + 1);
        
        // Reset transition state
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 50);
    } else {
      console.log(`[SimpleNav] At last step (${currentStepIndex}), cannot proceed further`);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      // Log navigation for debugging
      console.log(`[SimpleNav] Moving from step ${currentStepIndex} to ${currentStepIndex - 1}`);
      
      // Save current progress
      saveProgress();
      
      // Set transitioning state for animations
      setIsTransitioning(true);
      
      // Use timeout to avoid immediate state updates
      setTimeout(() => {
        // Move to previous step
        setCurrentStepIndex(prevStep => prevStep - 1);
        
        // Update URL to reflect new step
        updateUrlParam(currentStepIndex - 1);
        
        // Reset transition state
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 50);
    }
  };

  const goToSpecificStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length && stepIndex !== currentStepIndex) {
      // Log navigation for debugging
      console.log(`[SimpleNav] Direct navigation from step ${currentStepIndex} to ${stepIndex}`);
      
      // Save current progress
      saveProgress();
      
      // Set transitioning state for animations
      setIsTransitioning(true);
      
      // Use timeout to avoid immediate state updates
      setTimeout(() => {
        // Set new step
        setCurrentStepIndex(stepIndex);
        
        // Update URL to reflect new step
        updateUrlParam(stepIndex);
        
        // Reset transition state
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 50);
    }
  };

  // Helper to update URL without causing navigation
  const updateUrlParam = (stepIndex: number) => {
    // Use history API to update URL without refreshing
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('step', stepIndex.toString());
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Get current step configuration
  const currentStep = STEPS[currentStepIndex];
  const CurrentStepComponent = currentStep.component;

  // Calculate progress percentage
  const progressPercentage = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  return (
    <div className="simple-step-navigator p-4 md:p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{currentStep.title}</h1>
          <div className="text-sm font-medium">
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">{currentStep.description}</p>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Step dots navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStepIndex 
                  ? 'bg-blue-600 transform scale-125'
                  : index < currentStepIndex
                    ? 'bg-blue-400'
                    : 'bg-gray-300'
              }`}
              onClick={() => goToSpecificStep(index)}
              title={`Go to ${step.title}`}
            />
          ))}
        </div>
      </div>
      
      {/* Current Step Content with LoadLimiter wrapper */}
      <div 
        className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        <LoadLimiter
          id={`step-${currentStepIndex}-${currentStep.id}`}
          priority="high"
          placeholder={
            <div className="animate-pulse p-8 flex flex-col space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
          }
        >
          <CurrentStepComponent />
        </LoadLimiter>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-10 pt-6 border-t border-gray-200">
        <button
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg
            ${currentStepIndex === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors'}
          `}
        >
          Previous
        </button>
        
        <button
          onClick={goToNextStep}
          disabled={isTransitioning || currentStepIndex >= STEPS.length - 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
            isTransitioning || currentStepIndex >= STEPS.length - 1
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isTransitioning ? 'Loading...' : currentStepIndex < STEPS.length - 1 ? 'Next' : 'Complete'}
        </button>
      </div>
    </div>
  );
};

export default SimpleStepNavigator;