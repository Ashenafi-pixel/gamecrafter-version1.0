import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import { Palette, Settings } from 'lucide-react';
import GridPreviewWrapper from './GridPreviewWrapper';

interface Step5PreviewWrapperProps {
  viewMode?: 'preset' | 'advanced';
  onViewModeChange?: (mode: 'preset' | 'advanced') => void;
}

/**
 * Step5PreviewWrapper - Right panel preview component for Step 5 (Game Frame Designer)
 * Extends GridPreviewWrapper with the preset/advanced toggle functionality
 */
const Step5PreviewWrapper: React.FC<Step5PreviewWrapperProps> = ({
  viewMode = 'preset',
  onViewModeChange
}) => {
  // Local state for view mode if not provided from parent
  const [localViewMode, setLocalViewMode] = useState<'preset' | 'advanced'>(viewMode);
  
  // Determine which view mode to use (props take precedence)
  const effectiveViewMode = onViewModeChange ? viewMode : localViewMode;
  
  // Handle view mode toggle
  const handleViewModeToggle = () => {
    const newMode = effectiveViewMode === 'preset' ? 'advanced' : 'preset';
    if (onViewModeChange) {
      onViewModeChange(newMode);
    } else {
      setLocalViewMode(newMode);
    }
    
    // Dispatch a custom event to notify parent components of the change
    window.dispatchEvent(new CustomEvent('step5ViewModeChanged', {
      detail: { mode: newMode }
    }));
  };
  
  // Listen for external view mode changes
  useEffect(() => {
    // Update the DOM attribute for parent components to read
    const viewModeEl = document.getElementById('step5-view-mode');
    if (viewModeEl) {
      viewModeEl.setAttribute('data-mode', effectiveViewMode);
    }
  }, [effectiveViewMode]);
  
  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header with view mode toggle */}
      <div className="p-3 bg-gray-200 border-b border-gray-300 flex justify-between items-center">
        <div className="text-sm font-medium flex items-center">
          <Palette size={16} className="mr-1.5 text-blue-600" />
          <span>Premium Slot Preview</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className={`text-xs ${effectiveViewMode === 'preset' ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
            Preset
          </span>
          <div 
            className="relative inline-block w-8 h-4 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleViewModeToggle}
          >
            <div 
              className={`absolute w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-300 top-[1px] ${
                effectiveViewMode === 'advanced' ? 'translate-x-4 bg-blue-600' : 'translate-x-0.5'
              }`}
            ></div>
            <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${
              effectiveViewMode === 'advanced' ? 'bg-blue-400' : ''
            }`}></div>
          </div>
          <span className={`text-xs ${effectiveViewMode === 'advanced' ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
            Advanced
          </span>
        </div>
      </div>
      
      {/* Main content - Grid Preview Wrapper */}
      <div className="flex-1 overflow-hidden">
        <GridPreviewWrapper 
          className="h-full"
          showCellBackgrounds={false}
        />
      </div>
      
      {/* Hidden element to communicate view mode to parent component */}
      <div 
        id="step5-view-mode" 
        data-mode={effectiveViewMode} 
        style={{ display: 'none' }}
      ></div>
    </div>
  );
};

export default Step5PreviewWrapper;