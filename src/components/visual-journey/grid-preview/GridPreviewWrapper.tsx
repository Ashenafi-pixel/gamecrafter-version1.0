import React from 'react';
import { UnifiedSlotPreview } from '../../slot-engine/UnifiedSlotPreview';
import { useGameStore } from '../../../store';
import { Volume2, VolumeX, Info, Menu } from 'lucide-react';

/**
 * GridPreviewWrapper Component
 * ============================
 * 
 * Updated to use the new UnifiedSlotPreview with GameEngine
 * This ensures consistent grid rendering across all steps with proper state management
 */

interface GridPreviewWrapperProps {
  className?: string;
  showMockups?: boolean;
}

const GridPreviewWrapper: React.FC<GridPreviewWrapperProps> = ({
  className = '',
  showMockups = true
}) => {
  const { currentStep, config } = useGameStore();
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');
  const [isMuted, setIsMuted] = React.useState(false);
  
  // Get current grid configuration
  const reels = config?.reels?.layout?.reels || 5;
  const rows = config?.reels?.layout?.rows || 3;
  const gameName = config?.name || 'Slot Game';
  
  // Determine step source based on current step (1-indexed steps)
  const stepSource = currentStep === 1 ? 'step2' :
                     currentStep === 2 ? 'step3' : 
                     currentStep === 3 ? 'step4' : 
                     currentStep === 4 ? 'step5' : 
                     currentStep === 5 ? 'step6' :
                     currentStep === 6 ? 'step7' : 'unknown';
  
  // Debug logging
  React.useEffect(() => {
    console.log('[GridPreviewWrapper] Grid config:', { reels, rows, currentStep, stepSource });
  }, [reels, rows, currentStep, stepSource]);

  // Listen for background adjustments from Step 6
  React.useEffect(() => {
    const handleBackgroundAdjustments = (event: CustomEvent) => {
      const { position, scale, fit, backgroundUrl } = event.detail;
      console.log('🎯 [GridPreviewWrapper] Background adjustments received:', { position, scale, fit, backgroundUrl });

      // Update the game store with background adjustments
      const { updateConfig, config: currentConfig } = useGameStore.getState();
      updateConfig({
        backgroundPosition: position,
        backgroundScale: scale,
        backgroundFit: fit,
        theme: {
          ...currentConfig?.theme,
          generated: {
            ...currentConfig?.theme?.generated,
            background: backgroundUrl || currentConfig?.theme?.generated?.background
          }
        }
      });

      console.log('🎯 [GridPreviewWrapper] Store updated with background adjustments');
    };

    console.log('🎯 [GridPreviewWrapper] Setting up background adjustments listener');
    window.addEventListener('backgroundAdjustmentsUpdated', handleBackgroundAdjustments as EventListener);

    return () => {
      console.log('🎯 [GridPreviewWrapper] Removing background adjustments listener');
      window.removeEventListener('backgroundAdjustmentsUpdated', handleBackgroundAdjustments as EventListener);
    };
  }, []);

  // Listen for device mode changes from Step 6
  React.useEffect(() => {
    const handleDeviceModeChanged = (event: CustomEvent) => {
      const { mode, orientation } = event.detail;
      console.log('📱 [GridPreviewWrapper] Device mode change received:', { mode, orientation });

      // Update view mode based on device mode
      if (mode === 'desktop') {
        setViewMode('desktop');
        console.log('📱 [GridPreviewWrapper] Switched to desktop view');
      } else if (mode === 'mobile') {
        setViewMode('mobile');
        console.log('📱 [GridPreviewWrapper] Switched to mobile view');
      }
    };

    console.log('📱 [GridPreviewWrapper] Setting up device mode listener');
    window.addEventListener('deviceModeChanged', handleDeviceModeChanged as EventListener);

    return () => {
      console.log('📱 [GridPreviewWrapper] Removing device mode listener');
      window.removeEventListener('deviceModeChanged', handleDeviceModeChanged as EventListener);
    };
  }, []);

  return (
    <div className={`grid-preview-wrapper ${className}`} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with title */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-gray-300 text-sm font-medium">Premium Slot Preview</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-gray-500 text-xs">
            {reels}×{rows} grid • {viewMode === 'desktop' ? 'Desktop' : 'Mobile'} mode
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded ${viewMode === 'desktop' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Desktop view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 14H11M8 11V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded ${viewMode === 'mobile' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Mobile view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="2" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Game preview area */}
      {/* <div className="flex-1 relative bg-black overflow-hidden">
        <UnifiedSlotPreview 
          key={`step-${currentStep}`}
          stepSource={stepSource}
          className="w-full h-full"
          hideControls={false}
          orientation={viewMode === 'desktop' ? 'landscape' : 'portrait'}
          isMobile={viewMode === 'mobile'}
        />
      </div> */}
    </div>
  );
};

export default GridPreviewWrapper;