/**
 * Step 4 PixiJS Preview Integration
 * 
 * Replaces the CSS preview with PixiJS Premium Slot Preview for Step 4.
 * Automatically pulls symbols from Animation Lab and shows real-time animations.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UnifiedSlotPreview } from '../slot-engine/UnifiedSlotPreview';
import { useGameStore } from '../../store';

interface Step4PixiPreviewProps {
  className?: string;
  stepSource?: string;
}

const Step4PixiPreview: React.FC<Step4PixiPreviewProps> = ({
  className = '',
  stepSource = 'step4'
}) => {
  const { config } = useGameStore();
  const [symbolsFromAnimationLab, setSymbolsFromAnimationLab] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'mobile-landscape'>('desktop');
  const [isMuted, setIsMuted] = useState(false);

  // Get grid configuration
  const reels = config?.reels?.layout?.reels || 5;
  const rows = config?.reels?.layout?.rows || 3;

  // Listen for symbols and template changes from Animation Lab
  useEffect(() => {
    const handleSymbolsChanged = (event: any) => {
      console.log('[Step4PixiPreview] Animation Lab symbols changed:', event.detail);
      
      if (event.detail.symbols && Array.isArray(event.detail.symbols)) {
        setSymbolsFromAnimationLab(event.detail.symbols);
      }
    };

    const handleLayoutChanged = (event: any) => {
      console.log('[Step4PixiPreview] Layout template changed:', event.detail);
      
      // Update game store with layout template information
      if (event.detail.template && event.detail.symbolId) {
        const { updateConfig, config: currentConfig } = useGameStore.getState();
        const currentSymbolConfigs = currentConfig?.theme?.generated?.symbolConfigs || [];
        
        // Update the specific symbol's layout template in the store
        const updatedSymbolConfigs = currentSymbolConfigs.map((symbolConfig: any) => 
          symbolConfig.id === event.detail.symbolId 
            ? { ...symbolConfig, layoutTemplate: event.detail.template, spriteElements: event.detail.spriteElements }
            : symbolConfig
        );
        
        updateConfig({
          theme: {
            ...currentConfig?.theme,
            generated: {
              ...currentConfig?.theme?.generated,
              symbolConfigs: updatedSymbolConfigs,
              lastLayoutUpdate: Date.now() // Force re-render
            }
          }
        });
        
        console.log('[Step4PixiPreview] Updated store with layout template:', event.detail.template);
      }
    };

    const handleAnimationChanged = (event: any) => {
      console.log('[Step4PixiPreview] Animation template changed:', event.detail);
      // PixiJS preview will automatically handle animation changes
    };

    const handleBackgroundChanged = (event: any) => {
      console.log('[Step4PixiPreview] Background changed:', event.detail);
      // Update game store with new background
      if (event.detail.backgroundUrl) {
        const { updateConfig, config: currentConfig } = useGameStore.getState();
        updateConfig({
          theme: {
            ...currentConfig?.theme,
            generated: {
              ...currentConfig?.theme?.generated,
              background: event.detail.backgroundUrl,
              lastBackgroundUpdate: Date.now()
            }
          }
        });
      }
    };

    const handleFrameChanged = (event: any) => {
      console.log('[Step4PixiPreview] Frame changed:', event.detail);
      // Update game store with new frame
      if (event.detail.frameUrl) {
        const { updateConfig, config: currentConfig } = useGameStore.getState();
        updateConfig({
          theme: {
            ...currentConfig?.theme,
            generated: {
              ...currentConfig?.theme?.generated,
              frame: event.detail.frameUrl,
              lastFrameUpdate: Date.now()
            }
          }
        });
      }
    };

    // Listen for changes from Animation Lab and Game Assets
    window.addEventListener('symbolsChanged', handleSymbolsChanged);
    window.addEventListener('layoutChanged', handleLayoutChanged);
    window.addEventListener('animationTemplateChanged', handleAnimationChanged);
    window.addEventListener('backgroundChanged', handleBackgroundChanged);
    window.addEventListener('frameChanged', handleFrameChanged);
    
    // Initial load from game store if available
    const storeSymbols = config?.theme?.generated?.symbols || [];
    if (storeSymbols.length > 0) {
      setSymbolsFromAnimationLab(storeSymbols.map((symbol: any) => {
        if (typeof symbol === 'string') {
          return symbol;
        }
        return symbol.url || symbol.imageUrl;
      }).filter(Boolean));
    }

    return () => {
      window.removeEventListener('symbolsChanged', handleSymbolsChanged);
      window.removeEventListener('layoutChanged', handleLayoutChanged);
      window.removeEventListener('animationTemplateChanged', handleAnimationChanged);
      window.removeEventListener('backgroundChanged', handleBackgroundChanged);
      window.removeEventListener('frameChanged', handleFrameChanged);
    };
  }, [config?.theme?.generated?.symbols]);

  return (
    <div className={`step4-pixi-preview ${className}`} style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header matching CSSPreviewWrapper style */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-gray-300 text-sm font-medium">🎮 PixiJS Animation Preview</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-gray-500 text-xs">
            {reels}×{rows} grid • {symbolsFromAnimationLab.length} symbols • {viewMode === 'desktop' ? 'Desktop' : viewMode === 'mobile' ? 'Mobile Portrait' : 'Mobile Landscape'} mode
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
            {isMuted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* PixiJS Preview Area */}
      <div className="flex-1 relative bg-black overflow-hidden rounded-b-lg">
        <UnifiedSlotPreview
          stepSource={stepSource}
          symbolsOverride={symbolsFromAnimationLab}
          className="w-full h-full"
          orientation={viewMode === 'mobile-landscape' ? 'landscape' : 'portrait'}
          isMobile={viewMode !== 'desktop'}
          hideControls={false} // Show controls for full slot machine experience
        />
        
        {/* Status overlay */}
        {symbolsFromAnimationLab.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center text-white">
              <div className="text-3xl mb-3">🎮</div>
              <div className="text-lg font-semibold mb-2">PixiJS Animation Preview</div>
              <div className="text-sm text-gray-300 mb-1">Generate symbols in Animation Lab to see live animations</div>
              <div className="text-xs text-gray-400">Layout and animation templates will be applied in real-time</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4PixiPreview;