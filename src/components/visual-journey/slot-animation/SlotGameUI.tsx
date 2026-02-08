import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { SlotGameContext } from '../contexts/SlotGameContext';
import { useGameStore } from '../../../store';
import { detectDeviceType, onDeviceTypeChange, DeviceType } from '../../../utils/deviceDetection';
import { NormalDesign } from './uiDesigns/NormalDesign';
import { ModernUI } from './uiDesigns/ModernDesign';
import { UltimateDesign } from './uiDesigns/UltimateDesign';

interface SlotGameUIProps {
  onSpin?: () => void;
  onAutoplayToggle?: () => void;
  onMaxBet?: () => void;
  onSlamStop?: (reelIndex?: number) => void;
  slamStopStatus?: { [reelIndex: number]: { canStop: boolean, isSpinning: boolean, isStopped: boolean } };
  showSlamStop?: boolean;
  balance?: number;
  bet?: number;
  win?: number;
  isSpinning?: boolean;
  isWinAnimationPlaying?: boolean;
  spinButtonSvg?: string;
  spinButtonImageUrl?: string;
  className?: string;
  customButtons?: {
    spinButton?: string;
    autoplayButton?: string;
    menuButton?: string;
    soundButton?: string;
    settingsButton?: string;
  };
  gameLogo?: string;
  logoPosition?: { x: number; y: number };
  logoScale?: number;
  logoPositioningMode?: boolean;
  onLogoPositionChange?: (position: { x: number; y: number }) => void;
}
const SlotGameUI: React.FC<SlotGameUIProps> = ({
  onSpin,
  onAutoplayToggle,
  onMaxBet,
  customButtons,
  gameLogo,
  logoPosition = { x: 0, y: -50 },
  logoScale = 100,
  logoPositioningMode = false,
  onLogoPositionChange,
}) => {
  // Get game state and actions from context - but handle case when provider is not available
  const contextData = useContext(SlotGameContext);

  // Local state for when context is not available
  const [localState, setLocalState] = useState({
    showSettings: false,
    showMenu: false,
    isSoundEnabled: true,
    isAutoplayActive: false,
    volume: 100,
    turboMode: false,
    showAnimations: true
  });

  // Logo drag state for interactive positioning
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [currentDevice, setCurrentDevice] = useState<DeviceType>(detectDeviceType());
  const containerRef = useRef<HTMLDivElement>(null);

  // If context is not available, use default values and local state
  const defaultState = {
    bet: 1,
    win: 0,
    ...localState
  };

  const {
    state = defaultState,
    spin = () => {
      console.log('[SlotGameUI] Using external spin handler');
      if (onSpin) onSpin();
    },
    toggleAutoplay = () => {
      setLocalState(prev => ({ ...prev, isAutoplayActive: !prev.isAutoplayActive }));
      if (onAutoplayToggle) onAutoplayToggle();
    },
    toggleSound = () => {
      setLocalState(prev => ({ ...prev, isSoundEnabled: !prev.isSoundEnabled }));
    },
    toggleSettings = () => {
      setLocalState(prev => ({ ...prev, showSettings: !prev.showSettings }));
    },
    toggleMenu = () => {
      setLocalState(prev => ({ ...prev, showMenu: !prev.showMenu }));
    },
    setTurboMode = (enabled: boolean) => {
      setLocalState(prev => ({ ...prev, turboMode: enabled }));
    },
    dispatch = () => console.log('[SlotGameUI] Default dispatch handler')
  } = contextData || {};

  // Get UI customization config
  const { config, betAmount, setBetAmount, isSpinning, balance, uiType } = useGameStore();

  // Get button layout and metadata from config
  const buttonLayout = config?.uiButtonLayout || [];
  const buttonMetadata = config?.uiButtonMetadata || {};

  const isAutoplayActive = state.isAutoplayActive;
  const isSoundEnabled = state.isSoundEnabled;

  // Device detection for logo positioning
  useEffect(() => {
    const cleanup = onDeviceTypeChange((newDeviceType: DeviceType) => {
      console.log('[SlotGameUI] Device type changed to:', newDeviceType);
      setCurrentDevice(newDeviceType);
    });

    return cleanup;
  }, []);
  const betValues = [0.25, 0.5, 1, 2, 5, 10, 20, 30, 50, 100, 200, 300, 500];


  const handleIncreaseBet = React.useCallback(() => {
    const currentIndex = betValues.indexOf(betAmount);
    const nextIndex = (currentIndex + 1) % betValues.length;
    setBetAmount(betValues[nextIndex]);
  }, [betAmount, setBetAmount]);

  const handleDecreaseBet = React.useCallback(() => {
    const currentIndex = betValues.indexOf(betAmount);
    const prevIndex = (currentIndex - 1 + betValues.length) % betValues.length;
    setBetAmount(betValues[prevIndex]);
  }, [betAmount, setBetAmount]);

  // Get device-specific logo position and scale from game config
  const deviceLogoPosition = config?.logoPositions?.[currentDevice] || logoPosition;
  const deviceLogoScale = config?.logoScales?.[currentDevice] || logoScale;

  // Debug log to check spinning state and logo
  console.log('[SlotGameUI] Component state:', {
    finalIsSpinning: isSpinning,
    balance: balance,
    bet: betAmount,
    gameLogo,
    logoPositioningMode,
    deviceLogoPosition,
    deviceLogoScale,
    currentDevice,
    configLogoPositions: config?.logoPositions,
    configLogoScales: config?.logoScales
  });


  // Debug log to check if buttons are received
  React.useEffect(() => {
    console.log('[SlotGameUI] Component mounted/updated');
    console.log('[SlotGameUI] customButtons:', customButtons);
    console.log('[SlotGameUI] buttonLayout:', buttonLayout);
    console.log('[SlotGameUI] buttonMetadata:', buttonMetadata);
    if (customButtons) {
      console.log('[SlotGameUI] spinButton:', customButtons.spinButton);
      console.log('[SlotGameUI] autoplayButton:', customButtons.autoplayButton);
      console.log('[SlotGameUI] soundButton:', customButtons.soundButton);

      // Test loading each button image
      Object.entries(customButtons).forEach(([key, value]) => {
        if (value) {
          // Check if it's a blob URL
          const isBlobUrl = value.startsWith('blob:') || value.startsWith('data:');
          if (isBlobUrl) {
            console.log(`[SlotGameUI] Using blob/data URL for ${key}`);
          }

          const img = new window.Image();
          img.onload = () => {
            console.log(`[SlotGameUI] ✓ ${key} loaded successfully from:`, value.substring(0, 50) + '...');
          };
          img.onerror = () => {
            console.error(`[SlotGameUI] ✗ Failed to load ${key} from:`, value);
            // Try alternative paths only for non-blob URLs
            if (!isBlobUrl) {
              const altPath1 = value.startsWith('/') ? value.substring(1) : '/' + value;
              const altPath2 = value.startsWith('/') ? '.' + value : './' + value;
              console.log(`[SlotGameUI] Alternative paths: ${altPath1}, ${altPath2}`);
            }
          };
          img.src = value;
        }
      });
    }
  }, [customButtons]);

  const handleLogoMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingLogo || !onLogoPositionChange) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const newPosition = {
      x: startPosition.x + deltaX,
      y: startPosition.y + deltaY
    };

    // Constrain to reasonable bounds
    newPosition.x = Math.max(-400, Math.min(400, newPosition.x));
    newPosition.y = Math.max(-300, Math.min(300, newPosition.y));

    onLogoPositionChange(newPosition);
  }, [isDraggingLogo, dragStart, startPosition, onLogoPositionChange]);

  const handleLogoMouseUp = useCallback(() => {
    if (isDraggingLogo) {
      console.log('[SlotGameUI] Logo drag ended');
      setIsDraggingLogo(false);
    }
  }, [isDraggingLogo]);

  // Set up global mouse event listeners for logo dragging
  useEffect(() => {
    if (isDraggingLogo) {
      document.addEventListener('mousemove', handleLogoMouseMove);
      document.addEventListener('mouseup', handleLogoMouseUp);
      document.body.style.cursor = 'grabbing';

      return () => {
        document.removeEventListener('mousemove', handleLogoMouseMove);
        document.removeEventListener('mouseup', handleLogoMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDraggingLogo, handleLogoMouseMove, handleLogoMouseUp]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col relative no-select"
      style={{
        position: 'relative',
        overflow: 'visible' // Always allow overflow for spin button
      }}
    >
      {/* Positioning mode overlay */}
      {logoPositioningMode && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Grid overlay for positioning reference */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <pattern
                id="positioning-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#positioning-grid)" />
          </svg>

          {/* Center reference lines */}
          <div
            className="absolute bg-blue-400 opacity-40"
            style={{
              left: '50%',
              top: '0',
              width: '2px',
              height: '100%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }}
          />
          <div
            className="absolute bg-blue-400 opacity-40"
            style={{
              left: '0',
              top: '50%',
              width: '100%',
              height: '2px',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
        </div>
      )}


      {/* Positioning mode instructions */}
      {logoPositioningMode && gameLogo && (
        <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
          <div className="bg-blue-600 bg-opacity-90 text-white text-xs px-3 py-2 rounded-md text-center">
            🎯 Positioning Mode ({currentDevice}): Drag the logo to position it
          </div>
        </div>
      )}

      {/* Main UI Bar - Full width horizontal bar with customizable style */}
      <div className='w-full'>
        {uiType === "modern" && (
        <ModernUI
          onSpin={onSpin}
          BET_VALUES={betValues}
          toggleMenu={toggleMenu}
          handleDecreaseBet={handleDecreaseBet}
          handleIncreaseBet={handleIncreaseBet}
          isAutoplayActive={isAutoplayActive}
          toggleAutoplay={toggleAutoplay}
          spin={spin}
          onAutoplayToggle={onAutoplayToggle}
          onMaxBet={onMaxBet}
          toggleSound={toggleSound}
          isSoundEnabled={isSoundEnabled}
          toggleSettings={toggleSettings}
          customButtons={customButtons}
        />
        )}
        {uiType === "normal" && (
        <NormalDesign
        onSpin={onSpin}
        toggleMenu={toggleMenu}
        handleDecreaseBet={handleDecreaseBet}
        handleIncreaseBet={handleIncreaseBet}
        isAutoplayActive={isAutoplayActive}
        toggleAutoplay={toggleAutoplay}
        onAutoplayToggle={onAutoplayToggle}
        onMaxBet={onMaxBet}
        toggleSound={toggleSound}
        isSoundEnabled={isSoundEnabled}
        toggleSettings={toggleSettings}
        customButtons={customButtons}
        />
        )}
        {uiType === "ultimate" && (
        <UltimateDesign
        onSpin={onSpin}
        toggleMenu={toggleMenu}
        handleDecreaseBet={handleDecreaseBet}
        handleIncreaseBet={handleIncreaseBet}
        isAutoplayActive={isAutoplayActive}
        toggleAutoplay={toggleAutoplay}
        onAutoplayToggle={onAutoplayToggle}
        toggleSound={toggleSound}
        isSoundEnabled={isSoundEnabled}
        toggleSettings={toggleSettings}
        customButtons={customButtons}
        />
        )}
      </div>




      {/* Settings Modal */}
      {state.showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-white text-xl font-bold mb-4">Game Settings</h2>

            {/* Sound Volume */}
            <div className="mb-4">
              <label className="text-white text-sm mb-2 block">Sound Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={state.volume}
                onChange={(e) => {
                  if (contextData) {
                    dispatch({ type: 'SET_VOLUME', payload: parseInt(e.target.value) });
                  } else {
                    setLocalState(prev => ({ ...prev, volume: parseInt(e.target.value) }));
                  }
                }}
                className="w-full"
              />
            </div>

            {/* Turbo Mode */}
            <div className="mb-4">
              <label className="text-white flex items-center">
                <input
                  type="checkbox"
                  checked={state.turboMode || false}
                  onChange={() => setTurboMode(!state.turboMode)}
                  className="mr-2"
                />
                Turbo Mode
              </label>
            </div>

            {/* Show Animations */}
            <div className="mb-4">
              <label className="text-white flex items-center">
                <input
                  type="checkbox"
                  checked={state.showAnimations}
                  onChange={() => {
                    if (contextData) {
                      dispatch({ type: 'TOGGLE_ANIMATIONS' });
                    } else {
                      setLocalState(prev => ({ ...prev, showAnimations: !prev.showAnimations }));
                    }
                  }}
                  className="mr-2"
                />
                Show Win Animations
              </label>
            </div>

            <button
              onClick={toggleSettings}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Menu Modal */}
      {state.showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-white text-xl font-bold mb-4">Game Menu</h2>

            <div className="space-y-3">
              <button className="w-full bg-gray-700 text-white py-3 rounded hover:bg-gray-600 text-left px-4">
                Game Rules
              </button>
              <button className="w-full bg-gray-700 text-white py-3 rounded hover:bg-gray-600 text-left px-4">
                Paytable
              </button>
              <button className="w-full bg-gray-700 text-white py-3 rounded hover:bg-gray-600 text-left px-4">
                Game History
              </button>
              <button className="w-full bg-gray-700 text-white py-3 rounded hover:bg-gray-600 text-left px-4">
                Help & Support
              </button>
            </div>

            <button
              onClick={toggleMenu}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotGameUI;