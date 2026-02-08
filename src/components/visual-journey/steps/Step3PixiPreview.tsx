/**
 * Step 3 PixiJS Preview Component
 * 
 * Replaces the CSS preview with PixiJS Premium Slot Preview for Step 3.
 * Maintains all the same functionality and icons as CSSPreviewWrapper.
 * Updates in real-time with grid configuration changes from Step3_ReelConfiguration.
 */

import React, { useState, useEffect } from 'react';
import { UnifiedSlotPreview } from '../../slot-engine/UnifiedSlotPreview';
import { useGameStore } from '../../../store';
import { Volume2, VolumeX } from 'lucide-react';

interface Step3PixiPreviewProps {
  className?: string;
  stepSource?: string;
}

const Step3PixiPreview: React.FC<Step3PixiPreviewProps> = ({
  className = '',
  stepSource = 'step3'
}) => {
  const { config } = useGameStore();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'mobile-landscape'>('desktop');
  const [isMuted, setIsMuted] = useState(false);
  const [symbolsVersion, setSymbolsVersion] = useState(0); // Force re-render trigger

  // Get current grid configuration - exactly like CSSPreviewWrapper
  const reels = config?.reels?.layout?.reels || 5;
  const rows = config?.reels?.layout?.rows || 3;

  // Get symbols from store - exactly like CSSPreviewWrapper
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

  const symbols = getSymbolsForPreview();

  // Listen for grid configuration changes from Step 3 and other events
  useEffect(() => {
    const handleGridConfigChanged = (event: any) => {
      console.log('[Step3PixiPreview] Grid config changed:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render
    };

    const handleSymbolsChanged = (event: any) => {
      console.log('[Step3PixiPreview] Symbols changed:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render
    };

    const handleLayoutChanged = (event: any) => {
      console.log('[Step3PixiPreview] Layout changed:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render
    };

    const handleBackgroundChanged = (event: any) => {
      console.log('[Step3PixiPreview] Background changed:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render
    };

    const handleFrameChanged = (event: any) => {
      console.log('[Step3PixiPreview] Frame changed:', event.detail);
      setSymbolsVersion(prev => prev + 1); // Force re-render
    };

    // Listen for all the same events as CSSPreviewWrapper
    window.addEventListener('gridConfigChanged', handleGridConfigChanged);
    window.addEventListener('symbolsChanged', handleSymbolsChanged);
    window.addEventListener('layoutChanged', handleLayoutChanged);
    window.addEventListener('backgroundChanged', handleBackgroundChanged);
    window.addEventListener('frameChanged', handleFrameChanged);

    return () => {
      window.removeEventListener('gridConfigChanged', handleGridConfigChanged);
      window.removeEventListener('symbolsChanged', handleSymbolsChanged);
      window.removeEventListener('layoutChanged', handleLayoutChanged);
      window.removeEventListener('backgroundChanged', handleBackgroundChanged);
      window.removeEventListener('frameChanged', handleFrameChanged);
    };
  }, []);

  // Debug logging and grid change tracking - exactly like CSSPreviewWrapper
  useEffect(() => {
    console.log('[Step3PixiPreview] Grid config changed:', { reels, rows, stepSource });
    console.log('[Step3PixiPreview] Symbols:', symbols.length);
  }, [reels, rows, stepSource, symbols.length, symbolsVersion]);

  // Add a key prop to force re-render when grid changes - exactly like CSSPreviewWrapper
  const gridKey = `pixi-grid-${reels}x${rows}-${viewMode}-${symbolsVersion}`;

  return (
    <div className={`step3-pixi-preview ${className}`} style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header - EXACT same styling as CSSPreviewWrapper */}
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

      {/* PixiJS Preview Area */}
      <div className="flex-1 relative bg-black overflow-hidden rounded-b-lg">
        <UnifiedSlotPreview
          key={gridKey}
          stepSource={stepSource}
          symbolsOverride={symbols}
          className="w-full h-full"
          orientation={viewMode === 'mobile-landscape' ? 'landscape' : 'portrait'}
          isMobile={viewMode !== 'desktop'}
          hideControls={false} // Show controls for full slot machine experience
        />

        {/* Status overlay when no symbols */}
        {symbols.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center text-white">
              <div className="text-lg font-semibold mb-2">PixiJS Slot Preview</div>
              <div className="text-sm text-gray-300 mb-1">Configure your grid layout to see the preview</div>
              <div className="text-xs text-gray-400">Grid: {reels}×{rows} • Real-time updates</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3PixiPreview;
