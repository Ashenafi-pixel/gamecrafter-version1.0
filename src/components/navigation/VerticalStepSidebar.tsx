import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Palette,
  LayoutGrid,
  Grid3X3,
  Image,
  Frame,
  PictureInPicture,
  Sparkles,
  Gift,
  Calculator,
  Play,
  Shield,
  Code,
  Music,
  Settings
} from 'lucide-react';
import { NINTENDO_RED } from '../GameCrafterTheme';

interface StepInfo {
  number: number;
  name: string;
  icon: React.ReactNode;
}

interface VerticalStepSidebarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (stepNumber: number) => void;
} 

const VerticalStepSidebar: React.FC<VerticalStepSidebarProps> = ({
  currentStep,
  totalSteps,
  onStepClick
}) => {  
  // Get step information based on index
  const getStepInfo = (index: number): StepInfo => {
    const stepData = {
      0: { 
        name: 'Theme Selection', 
        icon: <Palette size={12} /> 
      },
      1: { 
        name: 'Game Type', 
        icon: <LayoutGrid size={12} /> 
      },
      2: { 
        name: 'Grid Layout', 
        icon: <Grid3X3 size={12} /> 
      },
      3: { 
        name: 'Symbol Creation', 
        icon: <Image size={12} /> 
      },
      4: { 
        name: 'Symbol Animation', 
        icon: <Settings size={12} /> 
      },
      5: { 
        name: 'Game Assets', 
        icon: <Frame size={12} /> 
      },
      6: { 
        name: 'Animation & Masking Studio', 
        icon: <Settings size={12} /> 
      },
      7: { 
        name: 'Win Animations', 
        icon: <Sparkles size={12} /> 
      },
      8: { 
        name: 'Loading Experience', 
        icon: <Settings size={12} /> 
      },
      9: { 
        name: 'Game Splash & Branding', 
        icon: <PictureInPicture size={12} /> 
      },
      10: { 
        name: 'Audio & Experience', 
        icon: <Music size={12} /> 
      },
      11: { 
        name: 'Bonus Features', 
        icon: <Gift size={12} /> 
      },
      12: { 
        name: 'Math Model', 
        icon: <Calculator size={12} /> 
      },
      13: { 
        name: 'Simulation', 
        icon: <Play size={12} /> 
      },
      14: { 
        name: 'Market Compliance', 
        icon: <Shield size={12} /> 
      },
      15: { 
        name: 'API Export', 
        icon: <Code size={12} /> 
      }
    };

    return {
      number: index + 1,
      name: stepData[index]?.name || `Step ${index + 1}`,
      icon: stepData[index]?.icon || <span>{index + 1}</span>
    };
  };
  
  // Create array of step information objects - ensure full step count
  const steps: StepInfo[] = Array.from({ length: Math.max(totalSteps, 15) }).map((_, i) => 
    getStepInfo(i)
  );
  
  // Handle click on a step indicator
  const handleStepClick = (stepNumber: number) => {
    if (onStepClick) {
      onStepClick(stepNumber);
    }
  };
  
  // Handle keydown for keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent, stepNumber: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent page scroll on space
      handleStepClick(stepNumber);
    }
  };
  
  return (
    <div
      className="w-20 h-full bg-white border-r border-gray-200 shadow-sm flex flex-col items-center z-30"
      data-sidebar-type="vertical"
    >
      {/* Steps List */}
      <div className="flex flex-col items-center space-y-3 mt-4 overflow-y-auto pb-9 flex-1 px-2 w-full custom-scrollbar">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          
          return (
            <div 
              key={`step-${index}`}
              className="relative group w-full flex flex-col items-center mb-1"
            >
              {/* Connector Line (don't show for first step) */}
              {index > 0 && (
                <div 
                  className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[1rem] w-0.5 h-3 
                    ${index <= currentStep ? 'bg-red-400' : 'bg-gray-300'}`}
                  aria-hidden="true"
                />
              )}
              
              {/* Step Circle */}
              <motion.div
                className={`
                  w-7 h-7 uw:w-10 uw:h-10 rounded-full flex items-center justify-center cursor-pointer
                  ${isActive 
                    ? 'bg-red-500 text-white ring-1 ring-red-200 ring-offset-1' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-600'}
                  transition-all duration-200
                `}
                whileHover={{ scale: 1.1, boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStepClick(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                tabIndex={0}
                role="button"
                aria-label={`Step ${step.number}: ${step.name}`}
                aria-current={isActive ? 'step' : undefined}
                style={{ backgroundColor: isActive ? NINTENDO_RED : isCompleted ? '#10B981' : '' }}
              >
                {isCompleted ? (
                  <Check size={12} className="text-white" />
                ) : (
                  <span>{step.icon}</span>
                )}
              </motion.div>
              
              {/* Step Number Below Icon */}
              <div className="text-[9px] font-medium text-center mt-1 text-gray-500">
                {step.number}
              </div>
            </div>
          );
        })}
      </div>

      
      {/* Custom Scrollbar Styles */}
      <style >{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
        }
      `}</style>
    </div>
  );
};

export default VerticalStepSidebar;