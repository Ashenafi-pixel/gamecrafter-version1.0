import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import Professional1to1PixiSlot from './Professional1to1PixiSlot';

/**
 * Step-Aware Premium Slot Preview Wrapper
 * 
 * This component manages the preview state based on the current step,
 * ensuring proper updates without WebGL context corruption.
 * 
 * Step-specific behavior:
 * - Step 3: Shows grid configuration changes
 * - Step 4: Shows generated/uploaded symbols
 * - Step 5: Shows background, frame, and UI elements
 * - Step 6: Shows audio configuration (visual indicators)
 * - Step 7: Shows win animations
 */
const StepAwarePremiumSlotPreview: React.FC = () => {
  const currentStep = useSelector((state: RootState) => state.currentStep);
  const gridConfig = useSelector((state: RootState) => state.gridConfig);
  const generatedSymbols = useSelector((state: RootState) => state.generatedSymbols);
  const uploadedSymbols = useSelector((state: RootState) => state.uploadedSymbols);
  const background = useSelector((state: RootState) => state.background);
  const frame = useSelector((state: RootState) => state.frame);
  const uiElements = useSelector((state: RootState) => state.uiElements);
  const audioConfig = useSelector((state: RootState) => state.audioConfig);
  const animationConfig = useSelector((state: RootState) => state.animationConfig);
  
  // Track previous values to detect actual changes
  const [prevReels, setPrevReels] = useState(gridConfig?.reels || 5);
  const [prevRows, setPrevRows] = useState(gridConfig?.rows || 3);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Detect grid changes
  useEffect(() => {
    const currentReels = gridConfig?.reels || 5;
    const currentRows = gridConfig?.rows || 3;
    
    if (currentReels !== prevReels || currentRows !== prevRows) {
      console.log(`🎮 Grid changed: ${prevReels}x${prevRows} → ${currentReels}x${currentRows}`);
      setPrevReels(currentReels);
      setPrevRows(currentRows);
      // Increment refresh key to force re-initialization
      setRefreshKey(prev => prev + 1);
    }
  }, [gridConfig, prevReels, prevRows]);
  
  // Get effective symbol images based on current step
  const symbolImages = useMemo(() => {
    if (currentStep >= 4) {
      // Step 4+: Use generated or uploaded symbols
      if (generatedSymbols && Object.keys(generatedSymbols).length > 0) {
        return Object.values(generatedSymbols);
      }
      if (uploadedSymbols && uploadedSymbols.length > 0) {
        return uploadedSymbols;
      }
    }
    // Default: empty array (will show placeholder symbols)
    return [];
  }, [currentStep, generatedSymbols, uploadedSymbols]);
  
  // Get background and frame paths based on current step
  const backgroundPath = useMemo(() => {
    if (currentStep >= 5 && background?.path) {
      return background.path;
    }
    return null;
  }, [currentStep, background]);
  
  const framePath = useMemo(() => {
    if (currentStep >= 5 && frame?.path) {
      return frame.path;
    }
    return null;
  }, [currentStep, frame]);
  
  // Show UI elements based on current step
  const showUIElements = currentStep >= 5;
  
  // Show audio indicators based on current step
  const showAudioIndicators = currentStep >= 6 && audioConfig?.enabled;
  
  // Show win animations based on current step
  const showWinAnimations = currentStep >= 7 && animationConfig?.enabled;
  
  // Calculate dimensions
  const width = 1200;
  const height = 800;
  
  // Debug logging
  useEffect(() => {
    console.log(`📍 Current Step: ${currentStep}`);
    console.log(`🎲 Grid: ${gridConfig?.reels || 5}x${gridConfig?.rows || 3}`);
    console.log(`🎨 Symbols: ${symbolImages.length} images`);
    console.log(`🖼️ Background: ${backgroundPath ? 'Set' : 'None'}`);
    console.log(`🖼️ Frame: ${framePath ? 'Set' : 'None'}`);
    console.log(`🎵 Audio: ${showAudioIndicators ? 'Enabled' : 'Disabled'}`);
    console.log(`✨ Animations: ${showWinAnimations ? 'Enabled' : 'Disabled'}`);
  }, [currentStep, gridConfig, symbolImages, backgroundPath, framePath, showAudioIndicators, showWinAnimations]);
  
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <Professional1to1PixiSlot
        reels={gridConfig?.reels || 5}
        rows={gridConfig?.rows || 3}
        width={width}
        height={height}
        symbolImages={symbolImages}
        showCellBackgrounds={false}
        framePath={framePath}
        backgroundPath={backgroundPath}
        gridConfig={gridConfig}
        generatedSymbols={generatedSymbols}
        refreshKey={refreshKey}
        balance={1000}
        bet={1.00}
        win={0.00}
      />
      
      {/* Step indicator overlay */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
        Step {currentStep}
      </div>
      
      {/* Audio indicator (Step 6+) */}
      {showAudioIndicators && (
        <div className="absolute bottom-4 right-4 bg-green-500 bg-opacity-75 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
          <span>🔊</span>
          <span>Audio Enabled</span>
        </div>
      )}
      
      {/* Animation indicator (Step 7+) */}
      {showWinAnimations && (
        <div className="absolute bottom-4 left-4 bg-purple-500 bg-opacity-75 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
          <span>✨</span>
          <span>Win Animations Active</span>
        </div>
      )}
    </div>
  );
};

export default StepAwarePremiumSlotPreview;