import React from 'react';
import { useGameStore } from '../../store';
import PixiSlotMockup from './PixiSlotMockup';
import { Volume2, VolumeX } from 'lucide-react';

interface PixiPreviewWrapperProps {
  className?: string;
  stepSource?: string;
}

const PixiPreviewWrapper: React.FC<PixiPreviewWrapperProps> = ({
  className = '',
  stepSource = 'unknown'
}) => {
  const { currentStep, config } = useGameStore();
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile' | 'mobile-landscape'>('desktop');
  const [isMuted, setIsMuted] = React.useState(false);
  const [symbolsVersion, setSymbolsVersion] = React.useState(0); // Force re-render trigger
  const [gridPosition, setGridPosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [gridScale, setGridScale] = React.useState<number>(100);
  const [gridStretch, setGridStretch] = React.useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [framePosition, setFramePosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [frameScale, setFrameScale] = React.useState<number>(100);
  const [frameStretch, setFrameStretch] = React.useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [backgroundPosition, setBackgroundPosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [backgroundScale, setBackgroundScale] = React.useState<number>(100);
  const [backgroundFit, setBackgroundFit] = React.useState<'cover' | 'contain' | 'fill' | 'scale-down'>('cover');
  const [uiButtonPosition, setUiButtonPosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [uiButtonScale, setUiButtonScale] = React.useState<number>(100);
  const [uiButtonVisibility, setUiButtonVisibility] = React.useState<boolean>(true);
  const [stepChangeKey, setStepChangeKey] = React.useState(0); // Track step changes
  
  // Get current grid configuration
  const reels = config?.reels?.layout?.reels || 5;
  const rows = config?.reels?.layout?.rows || 3;
  const gameName = config?.name || 'Slot Game';

  // Listen for grid adjustment updates
  React.useEffect(() => {
    const handleGridAdjustments = (event: CustomEvent) => {
      const { position, scale, stretch } = event.detail;
      console.log('[PixiPreviewWrapper] Grid adjustments updated:', { position, scale, stretch });

      if (position) setGridPosition(position);
      if (scale) setGridScale(scale);
      if (stretch) setGridStretch(stretch);
    };

    window.addEventListener('gridAdjustmentsUpdated', handleGridAdjustments as EventListener);

    return () => {
      window.removeEventListener('gridAdjustmentsUpdated', handleGridAdjustments as EventListener);
    };
  }, []);

  // Listen for frame adjustment updates
  React.useEffect(() => {
    const handleFrameAdjustments = (event: CustomEvent) => {
      const { position, scale, stretch } = event.detail;
      console.log('[PixiPreviewWrapper] Frame adjustments updated:', { position, scale, stretch });

      if (position) setFramePosition(position);
      if (scale) setFrameScale(scale);
      if (stretch) setFrameStretch(stretch);
    };

    window.addEventListener('frameAdjustmentsUpdated', handleFrameAdjustments as EventListener);

    return () => {
      window.removeEventListener('frameAdjustmentsUpdated', handleFrameAdjustments as EventListener);
    };
  }, []);

  // Pass grid adjustments to all PixiSlotMockup instances
  const gridAdjustments = {
    position: gridPosition,
    scale: gridScale,
    stretch: gridStretch
  };

  // Pass frame adjustments to all PixiSlotMockup instances
  const frameAdjustments = {
    position: framePosition,
    scale: frameScale,
    stretch: frameStretch
  };

  // Pass background adjustments to all PixiSlotMockup instances
  const backgroundAdjustments = {
    position: backgroundPosition,
    scale: backgroundScale,
    fit: backgroundFit
  };

  // Pass UI button adjustments to all PixiSlotMockup instances
  const uiButtonAdjustments = {
    position: uiButtonPosition,
    scale: uiButtonScale,
    visibility: uiButtonVisibility
  };


  // Listen for grid adjustment updates
  React.useEffect(() => {
    const handleGridAdjustments = (event: CustomEvent) => {
      const { position, scale, stretch } = event.detail;
      console.log('[PixiPreviewWrapper] Grid adjustments updated:', { position, scale, stretch });
      
      if (position) setGridPosition(position);
      if (scale) setGridScale(scale);
      if (stretch) setGridStretch(stretch);
    };

    window.addEventListener('gridAdjustmentsUpdated', handleGridAdjustments as EventListener);
    
    return () => {
      window.removeEventListener('gridAdjustmentsUpdated', handleGridAdjustments as EventListener);
    };
  }, []);
  // Get symbols from store
  const getSymbolsForPreview = () => {
    const storeSymbols = config?.theme?.generated?.symbols || [];
    // Handle both formats: string URLs (from Step 4) and objects with url/imageUrl properties
    return storeSymbols.map((symbol: any) => {
      if (typeof symbol === 'string') {
        return symbol; // Direct URL string from Step 4
      }
      return symbol.url || symbol.imageUrl; // Object format
    }).filter(Boolean);
  };
  
  // Get background and frame
  const background = config?.background?.backgroundImage || config?.backgroundImage;
  const frame = config?.frame?.frameImage || config?.frameImage || config?.frame;
  
  // Get current device type based on view mode (not window size)
  const currentDevice = viewMode === 'desktop' ? 'desktop' : 
                       viewMode === 'mobile' ? 'mobilePortrait' : 
                       'mobileLandscape';
  const logoData = {
    logo: config?.logo,
    logoPosition: config?.logoPositions?.[currentDevice] || config?.logoPosition || { x: 0, y: -50 },
    logoScale: config?.logoScales?.[currentDevice] || config?.logoScale || 100,
    logoPositioningMode: stepSource === 'step5', // Enable positioning mode only in Step 5
    onLogoPositionChange: (position: { x: number; y: number }) => {
      // Dispatch logo position change event for Step5 to handle
      window.dispatchEvent(new CustomEvent('logoPositionChanged', {
        detail: { position, device: currentDevice }
      }));
    },
    onLogoScaleChange: (scale: number) => {
      // Dispatch logo scale change event for Step5 to handle
      window.dispatchEvent(new CustomEvent('logoScaleChanged', {
        detail: { scale, device: currentDevice }
      }));
    }
  };
  
  const symbols = getSymbolsForPreview();
  
  // Listen for symbol changes from Step 4
  React.useEffect(() => {
    const handleSymbolsChanged = (event: any) => {
      console.log('[PixiPreviewWrapper] Symbols changed event received:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render
    };

    const handleLayoutChanged = (event: any) => {
      console.log('[PixiPreviewWrapper] Layout changed event received:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render to reflect layout changes
    };

    const handleFrameUpdated = (event: any) => {
      console.log('[PixiPreviewWrapper] Frame updated event received:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render to reflect frame changes
    };

    window.addEventListener('symbolsChanged', handleSymbolsChanged);
    window.addEventListener('layoutChanged', handleLayoutChanged);
    window.addEventListener('frameUpdated', handleFrameUpdated);
    return () => {
      window.removeEventListener('symbolsChanged', handleSymbolsChanged);
      window.removeEventListener('layoutChanged', handleLayoutChanged);
      window.removeEventListener('frameUpdated', handleFrameUpdated);
    };
  }, []);

  // Listen for UI button adjustments from Step 6
  React.useEffect(() => {
    const handleUIButtonAdjustments = (event: CustomEvent) => {
      const { position, scale, visibility } = event.detail;
      console.log('[PixiPreviewWrapper] UI button adjustments updated:', { position, scale, visibility });

      if (position) {
        setUiButtonPosition(position);
        console.log('[PixiPreviewWrapper] UI button position updated to:', position);
      }
      if (scale !== undefined) {
        setUiButtonScale(scale);
        console.log('[PixiPreviewWrapper] UI button scale updated to:', scale);
      }
      if (visibility !== undefined) {
        setUiButtonVisibility(visibility);
        console.log('[PixiPreviewWrapper] UI button visibility updated to:', visibility);
      }
    };

    window.addEventListener('uiButtonAdjustmentsUpdated', handleUIButtonAdjustments as EventListener);

    return () => {
      window.removeEventListener('uiButtonAdjustmentsUpdated', handleUIButtonAdjustments as EventListener);
    };
  }, []);

  // Listen for background adjustments from Step 6
  React.useEffect(() => {
    const handleBackgroundAdjustments = (event: CustomEvent) => {
      const { position, scale, fit, backgroundUrl } = event.detail;
      console.log('[PixiPreviewWrapper] Background adjustments updated:', { position, scale, fit, backgroundUrl });

      // Update local state for background adjustments
      if (position) setBackgroundPosition(position);
      if (scale) setBackgroundScale(scale);
      if (fit) setBackgroundFit(fit);

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

      // Force re-render to apply changes
      setSymbolsVersion(prev => prev + 1);
    };

    window.addEventListener('backgroundAdjustmentsUpdated', handleBackgroundAdjustments as EventListener);

    return () => {
      window.removeEventListener('backgroundAdjustmentsUpdated', handleBackgroundAdjustments as EventListener);
    };
  }, []);

  // Listen for device mode changes from Step 6
  React.useEffect(() => {
    const handleDeviceModeChanged = (event: CustomEvent) => {
      const { mode, orientation } = event.detail;
      console.log('[PixiPreviewWrapper] Device mode changed:', { mode, orientation });

      // Update view mode based on device mode
      if (mode === 'desktop') {
        setViewMode('desktop');
      } else if (mode === 'mobile') {
        setViewMode(orientation === 'landscape' ? 'mobileLandscape' : 'mobile');
      }
    };

    window.addEventListener('deviceModeChanged', handleDeviceModeChanged as EventListener);

    return () => {
      window.removeEventListener('deviceModeChanged', handleDeviceModeChanged as EventListener);
    };
  }, []);

  // Track step changes and force re-render
  React.useEffect(() => {
    console.log('[PixiPreviewWrapper] Step or source changed:', { currentStep, stepSource });
    setStepChangeKey(prev => prev + 1);
  }, [currentStep, stepSource]);

  // Debug logging and grid change tracking
  React.useEffect(() => {
    console.log('[PixiPreviewWrapper] Grid config changed:', { reels, rows, currentStep, stepSource });
    console.log('[PixiPreviewWrapper] Symbols:', symbols.length, 'Background:', !!background, 'Frame:', !!frame);

    // Detailed frame debugging
    console.log('[PixiPreviewWrapper] Frame details:', {
      frameValue: frame,
      configFrame: config?.frame,
      configFrameImage: config?.frame?.frameImage,
      frameImageDirect: config?.frameImage
    });
  }, [reels, rows, currentStep, stepSource, symbols.length, background, frame, symbolsVersion]);

  // Add a key prop to force re-render when grid changes or step navigation occurs
  const gridKey = `pixi-grid-${reels}x${rows}-${currentStep}-${stepSource}-${viewMode}-${symbolsVersion}-${stepChangeKey}`;

  return (
    <div className={`pixi-preview-wrapper ${className}`} style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      
      {/* Header with title - Exact same styling as CSSPreviewWrapper */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-gray-300 text-sm font-medium">Premium Slot Preview (PixiJS)</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-gray-500 text-xs">
            {reels}×{rows} grid • {viewMode === 'desktop' ? 'Desktop' : viewMode === 'mobile' ? 'Mobile Portrait' : 'Mobile Landscape'} mode
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
              title="Mobile portrait view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="2" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('mobile-landscape')}
              className={`p-1.5 rounded ${viewMode === 'mobile-landscape' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Mobile landscape view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="5" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="11.5" cy="8" r="0.5" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
      
      {/* Game preview area with PixiJS mockup */}
      <div className="flex-1 relative bg-black overflow-auto flex flex-col rounded-b-lg">
        {/* Device/Browser Mockup Container - Fill entire space like CSS version */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: viewMode === 'desktop' 
            ? 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f1419 100%)'
            : 'linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #0d0d0d 50%, #1a1a1a 75%, #000000 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            // Fill the entire available space like CSS version
            width: viewMode === 'desktop' ? '100%' : viewMode === 'mobile-landscape' ? '700px' : '450px',
            height: viewMode === 'desktop' ? '100%' : viewMode === 'mobile-landscape' ? '400px' : '80%',
            maxWidth: 'none',
            maxHeight: 'none'
          }}>
            {/* Browser/Device Frame */}
            {viewMode === 'mobile' ? (
              // Samsung Galaxy S23+ Portrait Frame
              <div 
                className="h-full flex flex-col relative"
                style={{
                  background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                  borderRadius: '28px',
                  border: '3px solid #333',
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Samsung Punch Hole Camera */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full border border-gray-600"></div>
                
                {/* Mobile Status Bar */}
                <div className="px-6 pb-1 flex items-center justify-between text-white text-xs mt-4">
                  <span className="font-medium">9:41</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className="w-1 h-3 bg-white rounded-full"></div>
                      <div className="w-1 h-3 bg-white rounded-full"></div>
                      <div className="w-1 h-3 bg-white rounded-full"></div>
                      <div className="w-1 h-3 bg-gray-500 rounded-full"></div>
                    </div>
                    <span className="text-xs">99%</span>
                    <div className="w-6 h-3 border border-white rounded-sm">
                      <div className="w-full h-full bg-green-400 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                
                {/* Game Content Area */}
                <div className="flex-1 px-2 pb-2">
                  <div className="h-full rounded-2xl overflow-hidden relative">
                    <PixiSlotMockup
                      key={gridKey}
                      cols={reels}
                      rows={rows}
                      symbols={symbols}
                      background={background}
                      frame={frame}
                      showControls={true}
                      isMobile={true}
                      orientation="portrait"
                      customOffset={{ x: 0, y: reels >= 7 ? -120 : reels >= 6 ? -100 : reels >= 5 ? -80 : -60 }}
                      gridAdjustments={gridAdjustments}
                      frameAdjustments={frameAdjustments}
                      backgroundAdjustments={backgroundAdjustments}
                      uiButtonAdjustments={uiButtonAdjustments}
                      {...logoData}
                    />
                  </div>
                </div>
              </div>
            ) : viewMode === 'mobile-landscape' ? (
              // Samsung Galaxy S23+ Landscape Frame
              <div 
                className="h-full flex flex-col relative"
                style={{
                  background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                  borderRadius: '22px',
                  border: '3px solid #333',
                  boxShadow: '0 15px 30px -8px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Samsung Punch Hole Camera */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full border border-gray-600"></div>
                
                {/* Mobile Status Bar */}
                <div className="px-6 py-1 flex items-center justify-between text-white text-xs">
                  <span className="font-medium">9:41</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">100%</span>
                    <div className="w-6 h-2 border border-white rounded-sm">
                      <div className="w-full h-full bg-green-400 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                
                {/* Game Content Area */}
                <div className="flex-1 px-2 py-2 pb-4">
                  <div className="h-full rounded-2xl overflow-hidden relative">
                    <PixiSlotMockup
                      key={gridKey}
                      cols={reels}
                      rows={rows}
                      symbols={symbols}
                      background={background}
                      frame={frame}
                      showControls={true}
                      isMobile={true}
                      orientation="landscape"
                      customOffset={{ x: 0, y: reels >= 7 ? -60 : reels >= 6 ? -50 : reels >= 5 ? -40 : -30 }}
                      gridAdjustments={gridAdjustments}
                      frameAdjustments={frameAdjustments}
                      backgroundAdjustments={backgroundAdjustments}
                      uiButtonAdjustments={uiButtonAdjustments}
                      {...logoData}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Desktop Direct Canvas - No browser frame
              <div className='' style={{
                width: '100%',
                height: '100%',
                display: 'flex-1',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PixiSlotMockup
                  key={gridKey}
                  cols={reels}
                  rows={rows}
                  symbols={symbols}
                  background={background}
                  frame={frame}
                  showControls={true}
                  isMobile={false}
                  orientation="landscape"
                  gridAdjustments={gridAdjustments}
                  frameAdjustments={frameAdjustments}
                  backgroundAdjustments={backgroundAdjustments}
                  uiButtonAdjustments={uiButtonAdjustments}
                  {...logoData}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixiPreviewWrapper;
