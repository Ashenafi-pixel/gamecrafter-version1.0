import React from 'react';

interface MobilePortraitUIProps {
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
 * Mobile Portrait UI Component
 * 
 * Special UI component designed specifically for mobile devices in portrait orientation.
 * Features a horizontal control panel at the bottom and stacked layout, similar to Premium-style games.
 */
const MobilePortraitUI: React.FC<MobilePortraitUIProps> = ({
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
    console.log('[MobilePortraitUI] Component mounted/updated');
    console.log('[MobilePortraitUI] customButtons:', customButtons);
  }, [customButtons]);

  // Format currency with 2 decimal places
  const formatCurrency = (value: number): string => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className={`h-full w-full flex flex-col ${className}`}>
      {/* Game Grid Area - flex-grow to fill available space */}
      <div className="flex-grow">
        {/* Game content is rendered by the parent component */}
      </div>
      
      {/* HUD Row - fixed height */}
      <div className="w-full h-[30px] flex justify-between items-center px-4 text-white text-[11px] font-semibold bg-black/80 z-40">
        {/* Win Value */}
        <div className="flex flex-col items-center">
          <div className="uppercase">WIN</div>
          <div className="font-bold text-yellow-400">{formatCurrency(win)}</div>
        </div>
        
        {/* Bet Value */}
        <div className="flex flex-col items-center">
          <div className="uppercase">BET</div>
          <div className="font-bold">{formatCurrency(bet)}</div>
        </div>
        
        {/* Balance Value */}
        <div className="flex flex-col items-center">
          <div className="uppercase">BALANCE</div>
          <div className="font-bold">{formatCurrency(balance)}</div>
        </div>
      </div>
      
      {/* Button Row - NetEnt-style layout */}
      <div className="w-full h-[88px] bg-black/70 flex items-center justify-around px-4 z-50">
        {/* Menu Button */}
        <button 
          className={`w-12 h-12 rounded-full ${customButtons?.menuButton ? '' : 'bg-white'} text-black flex items-center justify-center shadow-md`}
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          {customButtons?.menuButton ? (
            <img src={customButtons.menuButton} alt="Menu" className="w-full h-full object-contain" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        
        {/* Autoplay Button */}
        <button 
          className={`w-12 h-12 rounded-full ${customButtons?.autoplayButton ? '' : 'bg-white'} text-black flex items-center justify-center shadow-md`}
          onClick={onAutoplayToggle}
          aria-label="Auto Spin"
        >
          {customButtons?.autoplayButton ? (
            <img src={customButtons.autoplayButton} alt="Autoplay" className="w-full h-full object-contain" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
        
        {/* Spin Button (Center, Larger) - NetEnt-style positioning */}
        <button 
          className={`w-14 h-14 rounded-full ${customButtons?.spinButton ? '' : 'bg-white'} text-black flex items-center justify-center shadow-lg overflow-hidden ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={onSpin}
          disabled={isButtonDisabled}
          aria-label="Spin"
        >
          {customButtons?.spinButton ? (
            <img src={customButtons.spinButton} alt="Spin" className="w-full h-full object-contain" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>
        
        {/* Bet Settings Button */}
        <button 
          className={`w-12 h-12 rounded-full ${customButtons?.settingsButton ? '' : 'bg-white'} text-black flex items-center justify-center shadow-md`}
          onClick={onBetChange}
          aria-label="Bet Settings"
        >
          {customButtons?.settingsButton ? (
            <img src={customButtons.settingsButton} alt="Settings" className="w-full h-full object-contain" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        {/* Sound Toggle Button */}
        <button 
          className={`w-12 h-12 rounded-full ${customButtons?.soundButton ? '' : 'bg-white'} text-black flex items-center justify-center shadow-md`}
          onClick={onSoundToggle}
          aria-label="Toggle Sound"
        >
          {customButtons?.soundButton ? (
            <img src={customButtons.soundButton} alt="Sound" className="w-full h-full object-contain" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Footer Bar - fixed height */}
      <div className="w-full h-[22px] bg-gray-900 text-white text-xs px-2 flex items-center justify-start rounded-b-md shadow-inner z-40 border-t border-gray-800">
        <img 
          src="/assets/brand/logo-small.svg" 
          alt="Game Crafter Logo" 
          className="h-3 w-auto mr-1 invert" /* invert makes it white */
        />
        <span className="font-semibold">Premium Game | Game Crafter</span>
      </div>
    </div>
  );
};

export default MobilePortraitUI;