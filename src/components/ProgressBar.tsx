import React, { useCallback, useEffect } from 'react';
import { useGameStore } from '../store';
import { 
  Palette, // Theme & Concept
  Shapes, // Core Mechanics & Symbols
  Trophy, // Bonus Features & Game Rules
  Calculator, // Math Model
  Layout, // UI/UX & Mobile
  Music, // Audio & Player Experience
  BarChart3, // Analytics & Certification
  Store, // API & Export
} from 'lucide-react';

// Slot Machine steps with combined functionality
export const SLOT_STEPS = [
  { 
    id: 'theme-concept', 
    title: 'Choose Your Theme', 
    icon: Palette,
    description: 'Select from 9 available themes for your game'
  },
  { 
    id: 'core-symbols', 
    title: 'Mechanics & Symbols', 
    icon: Shapes,
    description: 'Configure game mechanics, grid layout, and symbols'
  },
  { 
    id: 'bonus-rules', 
    title: 'Features & Rules', 
    icon: Trophy,
    description: 'Set up bonus features and game rules'
  },
  { 
    id: 'math-model', 
    title: 'Math Model', 
    icon: Calculator,
    description: 'Configure RTP, volatility, and payout structure'
  },
  { 
    id: 'ui-mobile', 
    title: 'UI & Mobile', 
    icon: Layout,
    description: 'Design user interface and mobile optimization'
  },
  { 
    id: 'audio-experience', 
    title: 'Audio & Experience', 
    icon: Music,
    description: 'Set up audio and player experience settings'
  },
  { 
    id: 'analytics-certification', 
    title: 'Analytics & Compliance', 
    icon: BarChart3,
    description: 'Configure analytics and prepare for certification'
  },
  { 
    id: 'api-export', 
    title: 'API & Export', 
    icon: Store,
    description: 'Connect API and export your game'
  }
];

// Scratch Card steps
export const SCRATCH_STEPS = [
  { 
    id: 'theme-selection', 
    title: 'Theme Selection', 
    icon: Palette,
    description: 'Choose the theme and style for your scratch card'
  },
  { 
    id: 'card-design', 
    title: 'Card Design', 
    icon: Layout,
    description: 'Design the layout and visual elements of your scratch card'
  },
  { 
    id: 'prize-structure', 
    title: 'Prize Structure', 
    icon: Calculator,
    description: 'Configure prizes, odds, and payout structure'
  },
  { 
    id: 'game-rules', 
    title: 'Game Rules', 
    icon: Trophy,
    description: 'Define rules, win conditions, and gameplay mechanics'
  },
  { 
    id: 'visual-effects', 
    title: 'Visual Effects', 
    icon: Shapes,
    description: 'Add animations, effects, and interactive elements'
  },
  { 
    id: 'test-export', 
    title: 'Test & Export', 
    icon: Store,
    description: 'Test your scratch card game and export for distribution'
  }
];

// Default steps - will be dynamically selected based on game type
export const STEPS = SLOT_STEPS;

// Modern, simplified progress bar - updated with red accent
export const ProgressBar: React.FC = () => {
  const { currentStep, totalSteps } = useGameStore();
  
  // Ensure progress is calculated correctly
  const progress = Math.max(0, Math.min(100, (currentStep / (totalSteps - 1)) * 100));
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-500">Progress</span>
        <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Accessible, responsive step indicator - updated with red accent
export const GamePathProgress: React.FC = () => {
  const { currentStep, setStep, isMobileView, hasUnsavedChanges, gameType } = useGameStore();
  
  // Select step set based on game type
  const steps = gameType === 'scratch' ? SCRATCH_STEPS : SLOT_STEPS;
  
  // Calculate progress percentage
  const progressPercentage = (currentStep / (steps.length - 1)) * 100;
  
  // Handle navigation between steps
  const handleStepClick = useCallback((index: number) => {
    if (index === currentStep) return; // Already on this step
    
    // Update the step in the store
    setStep(index);
    
    // Update URL parameters without page reload
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('step', index.toString());
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.error("Failed to update URL:", e);
    }
    
    // Scroll to top 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, setStep]);
  
  // Update URL when step changes
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('step') !== currentStep.toString()) {
        url.searchParams.set('step', currentStep.toString());
        window.history.pushState({}, '', url.toString());
      }
    } catch (e) {
      console.error("Failed to update URL:", e);
    }
  }, [currentStep]);
  
  return (
    <div className="w-full px-1 md:px-2 py-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
      {/* Progress bar for visual feedback */}
      <div className="px-4 mb-4">
        <div className="w-full">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Progress</span>
            <span className="text-sm font-medium text-red-700">
              Step {currentStep + 1} of {steps.length} ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Step indicators - horizontal pills with clear active states */}
      <div className="flex overflow-x-auto scrollbar-hide py-1 gap-1 px-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = isCompleted || index === currentStep || index === currentStep + 1;
          
          return (
            <button
              key={step.id}
              onClick={() => isClickable && handleStepClick(index)}
              disabled={!isClickable}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
                ${isActive ? 'bg-red-600 text-white shadow-md' : ''}
                ${isCompleted ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-500' : ''}
                ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${hasUnsavedChanges && isActive ? 'ring-2 ring-yellow-400' : ''}
                min-w-fit flex-shrink-0
              `}
              aria-current={isActive ? 'step' : undefined}
              title={step.description}
            >
              <step.icon className={`w-4 h-4 ${isActive ? 'text-white' : isCompleted ? 'text-red-600' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">{step.title}</span>
              
              {/* Completed indicator */}
              {isCompleted && (
                <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
              
              {/* Current step indicator */}
              {isActive && !isMobileView && (
                <span className="ml-1 text-xs bg-white text-red-700 px-1.5 py-0.5 rounded-full">
                  {index + 1}/{steps.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Current step details for better context */}
      <div className="px-4 mt-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{steps[currentStep].title}</h2>
          <p className="text-sm text-gray-500">{steps[currentStep].description}</p>
        </div>
        
        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && (
          <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            Unsaved changes
          </div>
        )}
      </div>
    </div>
  );
};