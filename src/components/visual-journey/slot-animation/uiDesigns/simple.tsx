import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useGameStore } from "../../../../store";

interface SimpleDesignProps {
    onSpin?: () => void;
    className?: string;
    toggleMenu?: () => void;
    customButtons?: {
        spinButton?: string;
        autoplayButton?: string;
        menuButton?: string;
        soundButton?: string;
        settingsButton?: string;
    };
    handleDecreaseBet?: () => void;
    handleIncreaseBet?: () => void;
    isAutoplayActive?: boolean;
    toggleAutoplay?: () => void;
    onAutoplayToggle?: () => void;
    toggleSound?: () => void;
    isSoundEnabled?: boolean;
    toggleSettings?: () => void;
    buttonScale?: number;
    buttonScales?: {
        spinButton?: number;
        autoplayButton?: number;
        menuButton?: number;
        soundButton?: number;
        settingsButton?: number;
    };
    buttonPositions?: {
        spinButton?: { x: number; y: number };
        autoplayButton?: { x: number; y: number };
        menuButton?: { x: number; y: number };
        soundButton?: { x: number; y: number };
        settingsButton?: { x: number; y: number };
    };
}

export const SimpleDesign: React.FC<SimpleDesignProps> = ({
    onSpin,
    toggleMenu,
    customButtons,
    handleDecreaseBet,
    handleIncreaseBet,
    isAutoplayActive = false,
    toggleAutoplay,
    onAutoplayToggle,
    toggleSound,
    isSoundEnabled = true,
    toggleSettings,
    buttonScale = 100,
    buttonScales,
    buttonPositions,
}) => {
    const { betAmount, balance, isSpinning ,winAmount } = useGameStore();
    const scaleMultiplier = buttonScale / 100;
    
    // Get individual button scales, fallback to global scale if not provided
    const getButtonScale = (buttonName: keyof NonNullable<typeof buttonScales>) => {
        if (buttonScales && buttonScales[buttonName] !== undefined) {
            return buttonScales[buttonName]! / 100;
        }
        return scaleMultiplier;
    };

    // Get individual button positions, fallback to {0, 0} if not provided
    const getButtonPosition = (buttonName: keyof NonNullable<typeof buttonPositions>) => {
        if (buttonPositions && buttonPositions[buttonName]) {
            return buttonPositions[buttonName]!;
        }
        return { x: 0, y: 0 };
    };
    
    const menuScale = getButtonScale('menuButton');
    const autoplayScale = getButtonScale('autoplayButton');
    const spinScale = getButtonScale('spinButton');
    const soundScale = getButtonScale('soundButton');
    const settingsScale = getButtonScale('settingsButton');

    const menuPosition = getButtonPosition('menuButton');
    const autoplayPosition = getButtonPosition('autoplayButton');
    const spinPosition = getButtonPosition('spinButton');
    const soundPosition = getButtonPosition('soundButton');
    const settingsPosition = getButtonPosition('settingsButton');

    return (
            
            <div
        data-testid="slot-ui"
        className="slot-game-ui w-full px-4 py-3 text-white relative bg-gradient-to-b from-slate-800 to-slate-900 border-t-4 border-cyan-500"
        style={{
          height: '100px',
          zIndex: 100,
          pointerEvents: 'auto',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,188,212,0.3)'
        }}
      >
        <div className="h-full flex items-center justify-between gap-2">
          
          {/* Left Section - Menu & Info */}
          <div className="flex items-center">
            <button
              onClick={toggleMenu}
              className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
              style={{ transform: `scale(${menuScale}) translate(${menuPosition.x}px, ${menuPosition.y}px)` }}
              aria-label="Menu"
            >
              {customButtons?.menuButton ? (
                <img src={customButtons.menuButton} alt="Menu" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 group-hover:text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                </svg>
              )}
            </button>

            <button className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group" aria-label="Info">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 group-hover:text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </button>
          </div>

          {/* Center-Left - Balance & Bet */}
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2 backdrop-blur-sm border border-cyan-500/30">
            <div className="text-center">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Last Win</div>
              <div className="text-lg font-bold text-green-600">${winAmount.toFixed(2)}</div>
            </div>
            <div className="w-0.5 h-10 bg-gradient-to-b from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"></div>

            <div className="text-center">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Balance</div>
              <div className="text-lg font-bold text-emerald-400">${balance.toFixed(2)}</div>
            </div>
            <div className="w-0.5 h-10 bg-gradient-to-b from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"></div>
            <div className="text-center">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Bet</div>
              <div className="text-lg font-bold text-amber-400">${betAmount}</div>
            </div>
          </div>

          {/* Center - Bet Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecreaseBet}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-lg"
              aria-label="Decrease Bet"
            >
              <Minus className="w-5 h-5" />
            </button>

            {/* Spin Button */}
            <button
              onClick={onSpin}
              disabled={isSpinning}
              className={`relative w-23 h-23 rounded-full shadow-2xl transform transition-all duration-300
                ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-cyan-500/50 active:scale-95'}
                ${customButtons?.spinButton ? 'bg-transparent' : 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 border-4 border-cyan-700'}`}
              style={{ transform: `scale(${spinScale}) translate(${spinPosition.x}px, ${spinPosition.y}px)` }}
              aria-label="Spin"
            >
              {customButtons?.spinButton ? (
                <img src={customButtons.spinButton} alt="Spin" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white m-auto drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleIncreaseBet}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-lg"
              aria-label="Increase Bet"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Center-Right - Autoplay */}
          <button
            onClick={() => {
              toggleAutoplay?.();
              onAutoplayToggle?.();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
              ${isAutoplayActive ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-600 text-gray-200 hover:bg-slate-500'}`}
            style={{ transform: `scale(${autoplayScale}) translate(${autoplayPosition.x}px, ${autoplayPosition.y}px)` }}
            aria-label="Autoplay"
          >
            {customButtons?.autoplayButton ? (
              <img src={customButtons.autoplayButton} alt="Autoplay" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            ) : (
              'AUTO'
            )}
          </button>

          {/* Right Section - Sound & Settings */}
          <div className="flex items-center">
            <button
              onClick={toggleSound}
              className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
              style={{ transform: `scale(${soundScale}) translate(${soundPosition.x}px, ${soundPosition.y}px)` }}
              aria-label="Sound Toggle"
            >
              {customButtons?.soundButton ? (
                <img src={customButtons.soundButton} alt="Sound" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 group-hover:text-cyan-400 ${!isSoundEnabled ? 'opacity-30' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d={isSoundEnabled ? "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" : "M16.692 6.61a.75.75 0 10-1.06 1.06L19.879 12l-4.247 4.33a.75.75 0 101.06 1.06l4.879-4.96a.75.75 0 000-1.06l-4.879-4.96z"} />
                </svg>
              )}
            </button>

            <button
              onClick={toggleSettings}
              className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
              style={{ transform: `scale(${settingsScale}) translate(${settingsPosition.x}px, ${settingsPosition.y}px)` }}
              aria-label="Settings"
            >
              {customButtons?.settingsButton ? (
                <img src={customButtons.settingsButton} alt="Settings" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 group-hover:text-cyan-400 group-hover:rotate-90 transition-all" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l1.72-1.35c.15-.12.19-.34.1-.51l-1.63-2.83c-.12-.22-.37-.29-.59-.22l-2.03.81c-.42-.32-.9-.6-1.44-.78l-.38-2.15C14.4 2.18 14.23 2 14 2h-4c-.23 0-.39.18-.41.41l-.38 2.15c-.54.18-1.02.46-1.44.78l-2.03-.81c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.21-.08.44.1.51l1.72 1.35c-.05.3-.07.62-.07.94s.02.64.07.94l-1.72 1.35c-.15.12-.19.34-.1.51l1.63 2.83c.12.22.37.29.59.22l2.03-.81c.42.32.9.6 1.44.78l.38 2.15c.05.23.22.41.41.41h4c.23 0 .39-.18.41-.41l.38-2.15c.54-.18 1.02-.46 1.44-.78l2.03.81c.22.09.47 0 .59-.22l1.63-2.83c.12-.22.07-.44-.1-.51l-1.72-1.35zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
};
