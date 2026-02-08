import React from 'react';
import { useGameStore } from '../../store';
import CSSSlotMockup from './CSSSlotMockup';
import { Volume2, VolumeX } from 'lucide-react';

interface CSSPreviewWrapperProps {
  className?: string;
  stepSource?: string;
}

const CSSPreviewWrapper: React.FC<CSSPreviewWrapperProps> = ({
  className = '',
  stepSource = 'unknown'
}) => {
  const { currentStep, config } = useGameStore();
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile' | 'mobile-landscape'>('desktop');
  const [isMuted, setIsMuted] = React.useState(false);
  const [symbolsVersion, setSymbolsVersion] = React.useState(0); // Force re-render trigger
  
  // Get current grid configuration
  const reels = config?.reels?.layout?.reels || 5;
  const rows = config?.reels?.layout?.rows || 3;
  const gameName = config?.name || 'Slot Game';
  
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
  const frame = config?.frame?.frameImage || config?.frameImage;
  
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
      console.log('[CSSPreviewWrapper] Symbols changed event received:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render
    };

    const handleLayoutChanged = (event: any) => {
      console.log('[CSSPreviewWrapper] Layout changed event received:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render to reflect layout changes
    };

    window.addEventListener('symbolsChanged', handleSymbolsChanged);
    window.addEventListener('layoutChanged', handleLayoutChanged);
    return () => {
      window.removeEventListener('symbolsChanged', handleSymbolsChanged);
      window.removeEventListener('layoutChanged', handleLayoutChanged);
    };
  }, []);

  // Debug logging and grid change tracking
  React.useEffect(() => {
    console.log('[CSSPreviewWrapper] Grid config changed:', { reels, rows, currentStep, stepSource });
    console.log('[CSSPreviewWrapper] Symbols:', symbols.length, 'Background:', !!background, 'Frame:', !!frame);
  }, [reels, rows, currentStep, stepSource, symbols.length, background, frame, symbolsVersion]);
  
  // Add a key prop to force re-render when grid changes (like GridPreviewWrapper)
  const gridKey = `css-grid-${reels}x${rows}-${currentStep}-${viewMode}-${symbolsVersion}`;

  return (
    <div className={`css-preview-wrapper ${className}`} style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      
      {/* Header with title - Exact same styling as GridPreviewWrapper */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-gray-300 text-sm font-medium">Premium Slot Preview</span>
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
      
      {/* Game preview area with CSS mockup */}
      <div className="flex-1 relative bg-black overflow-auto flex flex-col rounded-b-lg">
        {/* Device/Browser Mockup Container - Fill entire space like PixiJS */}
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
            // MATCH PIXIJS CANVAS: Fill the entire available space like PixiJS does
            width: viewMode === 'desktop' ? '100%' : viewMode === 'mobile-landscape' ? '700px' : '450px',
            height: viewMode === 'desktop' ? '100%' : viewMode === 'mobile-landscape' ? '400px' : '80%',
            // No constraints - let it fill the space
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
                <div className="px-6 pb-1 flex items-center justify-between text-white text-xs mt-6">
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
                    <div style={{ position: 'relative', height: '100%' }}>
                      <CSSSlotMockup
                        key={gridKey}
                        cols={reels}
                        rows={rows}
                        symbols={symbols}
                        background={background}
                        frame={frame}
                        showControls={true}  // ALWAYS show controls to match PixiJS
                        isMobile={true}
                        orientation="portrait"
                        customOffset={{ x: 0, y: reels >= 7 ? -120 : reels >= 6 ? -100 : reels >= 5 ? -80 : -60 }} // Dynamic offset based on grid size
                        {...logoData}
                      />
                    </div>
                    
                    {/* All UI controls (spin buttons, WIN/BET/BALANCE displays, etc.) are integrated into CSSSlotMockup */}
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
                {/* Samsung Punch Hole Camera - Top center between clock and battery */}
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
                  {/* Game Area */}
                  <div className="h-full rounded-2xl overflow-hidden relative">
                    <div style={{ position: 'relative', height: '100%' }}>
                      <CSSSlotMockup
                        key={gridKey}
                        cols={reels}
                        rows={rows}
                        symbols={symbols}
                        background={background}
                        frame={frame}
                        showControls={true}  // ALWAYS show controls to match PixiJS
                        isMobile={true}
                        orientation="landscape"
                        customOffset={{ x: 0, y: reels >= 7 ? -60 : reels >= 6 ? -50 : reels >= 5 ? -40 : -30 }} // Move grids more up for better centering
                        {...logoData}
                      />
                    </div>

                    {/* WIN/BET/BALANCE displays and GameCrafter branding are integrated into CSSSlotMockup */}
                  </div>
                </div>
              </div>
            ) : (
              // Desktop Direct Canvas - No browser frame to match PixiJS exactly
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CSSSlotMockup
                  key={gridKey}
                  cols={reels}
                  rows={rows}
                  symbols={symbols}
                  background={background}
                  frame={frame}
                  showControls={true}  // ALWAYS show controls to match PixiJS
                  isMobile={false}
                  orientation="landscape"
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

export default CSSPreviewWrapper;