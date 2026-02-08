import React from 'react';
import { UnifiedSlotPreview } from '../slot-engine/UnifiedSlotPreview';

interface PremiumSlotPreviewProps {
  reels?: number;
  rows?: number;
  showDebug?: boolean;
  refreshKey?: string | number;
  className?: string;
  // Legacy props maintained for compatibility
  width?: number;
  height?: number;
  stepSource?: 'step3' | 'step4' | 'step5' | 'step6' | 'step7';
  showDevOverlay?: boolean;
  symbolImages?: string[];
  generatedSymbols?: Record<string, string>;
  gridConfig?: {
    reels: number;
    rows: number;
    layout?: string;
    paylines?: number;
  };
  onSpin?: () => void;
  balance?: number;
  bet?: number;
  win?: number;
  /** Custom UI button images */
  customButtons?: {
    spinButton?: string;
    autoplayButton?: string;
    menuButton?: string;
    soundButton?: string;
    settingsButton?: string;
  };
}

/**
 * Premium Slot Preview Component
 * Now using the new unified GameEngine implementation
 * 
 * Features:
 * - Centralized state management through GameEngine
 * - Proper lifecycle management
 * - No more grid switching issues
 * - Professional memory management
 * - Smooth animations and transitions
 * - Single source of truth for game state
 */
export const PremiumSlotPreview: React.FC<PremiumSlotPreviewProps> = ({
  reels,
  rows,
  showDebug = false,
  showDevOverlay = false,
  refreshKey,
  className = '',
  width = 1200,
  height = 800,
  onSpin,
  customButtons,
  stepSource = 'step3',
  symbolImages,
  generatedSymbols,
  ...legacyProps
}) => {
  // Convert legacy symbol props to unified format
  const symbols = React.useMemo(() => {
    if (symbolImages && symbolImages.length > 0) {
      return symbolImages;
    }
    if (generatedSymbols) {
      return Object.values(generatedSymbols);
    }
    return [];
  }, [symbolImages, generatedSymbols]);

  return (
    <div className={`premium-slot-preview ${className}`} style={{ width: '100%', height: '100%' }}>
      <UnifiedSlotPreview
        key={refreshKey}
        stepSource={stepSource}
        symbolsOverride={symbols}
        className="w-full h-full"
        width={width}
        height={height}
        hideControls={false}
      />
      
      {(showDebug || showDevOverlay) && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
          <div className="font-bold text-green-400">Game Engine v2.0</div>
          <div>Grid: {reels || 5}×{rows || 3}</div>
          <div>Unified State Management</div>
          <div className="text-yellow-400">Professional Quality</div>
        </div>
      )}
    </div>
  );
};