import React from 'react';
import { useGameStore } from '../store';
import { ChevronLeft, ChevronRight, Save, Play, Home } from 'lucide-react';
import { STEPS } from './ProgressBar';

interface StepNavigationProps {
  onSave?: () => void;
  onPreview?: () => void;
  onHome?: () => void;
  className?: string;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({ 
  onSave, 
  onPreview, 
  onHome,
  className = ''
}) => {
  const { 
    currentStep, 
    nextStep,
    prevStep,
    totalSteps, 
    hasUnsavedChanges,
    saveProgress,
    togglePreview
  } = useGameStore();
  
  // Use the totalSteps from the store
  const steps = STEPS;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Handle save action
  const handleSave = () => {
    saveProgress();
    if (onSave) onSave();
  };
  
  // Handle preview action
  const handlePreview = () => {
    togglePreview();
    if (onPreview) onPreview();
  };
  
  // Handle home action
  const handleHome = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave this page?');
      if (!confirmed) return;
    }
    if (onHome) onHome();
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-white border-t border-gray-200 ${className}`}>
      <div>
        <button
          onClick={handleHome}
          className="px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md flex items-center gap-1 text-sm transition-colors"
          title="Return to dashboard"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Save button - always visible but accented when changes exist */}
        <button
          onClick={handleSave}
          className={`
            px-3 py-1.5 border rounded-md flex items-center gap-1 text-sm transition-colors
            ${hasUnsavedChanges 
              ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 animate-pulse' 
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'}
          `}
          title="Save progress"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </button>
        
        {/* Preview button */}
        <button
          onClick={handlePreview}
          className="px-3 py-1.5 border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 rounded-md flex items-center gap-1 text-sm transition-colors"
          title="Preview game"
        >
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">Preview</span>
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Previous step button */}
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          className={`
            px-4 py-2 rounded-md flex items-center gap-2 transition-colors text-sm
            ${isFirstStep 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}
          `}
          title="Previous step"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        
        {/* Next step button */}
        <button
          onClick={nextStep}
          disabled={isLastStep}
          className={`
            px-4 py-2 rounded-md flex items-center gap-2 transition-colors text-sm
            ${isLastStep 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}
          `}
          title="Next step"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};