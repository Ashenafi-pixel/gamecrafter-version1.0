import React from 'react';

interface MobileLandscapeUIProps {
  /** Handler for spin button click */
  onSpin?: () => void;
  /** Handler for autoplay toggle */
  onAutoplayToggle?: () => void;
  /** Handler for hamburger menu click */
  onMenuToggle?: () => void;
  /** Handler for sound toggle */
  onSoundToggle?: () => void;
  /** Handler for bet settings */
  onBetChange?: () => void;
  /** Current balance value */
  balance?: number;
  /** Current bet value */
  bet?: number;
  /** Current win value */
  win?: number;
  /** Whether currently spinning */
  isSpinning?: boolean;
  /** Whether win animation is playing */
  isWinAnimationPlaying?: boolean;
  /** Additional class names */
  className?: string;
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
 * Mobile Landscape UI Component - TIER 1 Touch Slot Game Reference
 * 
 * Specialized UI component designed specifically for mobile devices in landscape orientation.
 * Features a vertical control panel on the right side and informational bars at the bottom.
 * All UI elements are contained within the mobile mockup frame.
 * 
 * IMPORTANT: This component is designed to fit inside the phone mockup screen area
 * in the GridPreviewWrapper when in landscape orientation.
 */
const MobileLandscapeUI: React.FC<MobileLandscapeUIProps> = ({
  onSpin = () => {},
  onAutoplayToggle = () => {},
  onMenuToggle = () => {},
  onSoundToggle = () => {},
  onBetChange = () => {},
  balance = 1000.00,
  bet = 1.00,
  win = 0.00,
  isSpinning = false,
  isWinAnimationPlaying = false,
  className = '',
  customButtons
}) => {
  const isButtonDisabled = isSpinning || isWinAnimationPlaying;
  // Debug log to check if buttons are received
  React.useEffect(() => {
    console.log('[MobileLandscapeUI] Component mounted/updated');
    console.log('[MobileLandscapeUI] customButtons:', customButtons);
  }, [customButtons]);

  // Format currency with 2 decimal places
  const formatCurrency = (value: number): string => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Main Game Area - Takes up all space except for the bottom UI elements */}
      <div className="flex-grow relative">
        {/* Game grid area with right padding for controls */}
        <div className="w-full h-full pr-14">
          {/* Game content goes here - the grid is rendered by the parent component */}
        </div>
        
        {/* RIGHT PANEL - Vertical Button Stack */}
        <div className="absolute right-0 top-[10%] bottom-[12%] w-14 flex flex-col justify-between items-center z-50 pointer-events-auto">
          {/* 1. Sound Toggle Button */}
          <button 
            className={`h-10 w-10 mx-auto rounded-full ${customButtons?.soundButton ? '' : 'bg-zinc-800'} text-white flex items-center justify-center shadow-lg hover:bg-zinc-700 transition-colors overflow-hidden`}
            onClick={onSoundToggle}
            aria-label="Toggle Sound"
          >
            {customButtons?.soundButton ? (
              <img src={customButtons.soundButton} alt="Sound" className="w-full h-full object-contain" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          
          {/* 2. Bet Settings Button */}
          <button 
            className={`h-10 w-10 mx-auto rounded-full ${customButtons?.settingsButton ? '' : 'bg-zinc-800'} text-white flex items-center justify-center shadow-lg hover:bg-zinc-700 transition-colors`}
            onClick={onBetChange}
            aria-label="Bet Settings"
          >
            {customButtons?.settingsButton ? (
              <img src={customButtons.settingsButton} alt="Settings" className="w-full h-full object-contain" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          
          {/* 3. Spin Button (larger than others) */}
          <button 
            className={`h-12 w-12 mx-auto rounded-full ${customButtons?.spinButton ? '' : 'bg-white'} text-black flex items-center justify-center shadow-xl transform hover:scale-105 transition-all duration-200 overflow-hidden ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={onSpin}
            disabled={isButtonDisabled}
            aria-label="Spin"
          >
            {customButtons?.spinButton ? (
              <img src={customButtons.spinButton} alt="Spin" className="w-full h-full object-contain" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
          
          {/* 4. Autoplay Button */}
          <button 
            className={`h-10 w-10 mx-auto rounded-full ${customButtons?.autoplayButton ? '' : 'bg-zinc-800'} text-white flex items-center justify-center shadow-lg hover:bg-zinc-700 transition-colors overflow-hidden`}
            onClick={onAutoplayToggle}
            aria-label="Auto Spin"
          >
            {customButtons?.autoplayButton ? (
              <img src={customButtons.autoplayButton} alt="Autoplay" className="w-full h-full object-contain" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
          
          {/* 5. Hamburger Menu Button */}
          <button 
            className={`h-10 w-10 mx-auto rounded-full ${customButtons?.menuButton ? '' : 'bg-zinc-800'} text-white flex items-center justify-center shadow-lg hover:bg-zinc-700 transition-colors overflow-hidden`}
            onClick={onMenuToggle}
            aria-label="Menu"
          >
            {customButtons?.menuButton ? (
              <img src={customButtons.menuButton} alt="Menu" className="w-full h-full object-contain" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Bottom UI Section - Fixed size, non-compressing elements */}
      <div className="flex-shrink-0 flex flex-col">
        {/* HUD - Info Row (WIN/BET/BALANCE) */}
        <div className="h-[30px] flex justify-between items-end px-2 mb-1 text-white z-40">
          {/* Win Value */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase font-semibold">WIN</div>
            <div className="text-[11px] font-bold text-yellow-400">{formatCurrency(win)}</div>
          </div>
          
          {/* Bet Value */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase font-semibold">BET</div>
            <div className="text-[11px] font-bold">{formatCurrency(bet)}</div>
          </div>
          
          {/* Balance Value */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase font-semibold">BALANCE</div>
            <div className="text-[11px] font-bold">{formatCurrency(balance)}</div>
          </div>
        </div>
        
        {/* Footer Bar - Natural flow at the bottom */}
        <div className="h-[22px] bg-gray-900 text-white text-xs px-2 flex items-center justify-start rounded-b-md shadow-inner z-40 border-t border-gray-800">
          <img 
            src="/assets/brand/logo-small.svg" 
            alt="Game Crafter Logo" 
            className="h-3 w-auto mr-1 invert" /* invert makes it white */
          />
          <span className="font-semibold">Premium Game | Game Crafter</span>
        </div>
      </div>
    </div>
  );
};

export default MobileLandscapeUI;