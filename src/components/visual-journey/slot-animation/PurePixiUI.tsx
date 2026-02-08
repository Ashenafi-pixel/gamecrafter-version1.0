import React, { useState } from 'react';
import { Play, RotateCcw, Volume2, Settings, Menu, Info } from 'lucide-react';
import { useGameStore } from '../../../store';

/**
 * PurePixiUI Component
 * ====================
 * 
 * Clean, minimal UI overlay for PIXI.js slot games.
 * Only provides UI controls - no grid rendering.
 * Designed to overlay on top of PIXI canvas.
 */

interface PurePixiUIProps {
  balance?: number;
  bet?: number;
  win?: number;
  onSpin?: () => void;
  onAutoplay?: () => void;
  onMenu?: () => void;
  onSound?: () => void;
  onSettings?: () => void;
  onInfo?: () => void;
  spinButtonImage?: string;
  autoplayButtonImage?: string;
  menuButtonImage?: string;
  soundButtonImage?: string;
  settingsButtonImage?: string;
  infoButtonImage?: string;
  isSpinning?: boolean;
}

export const PurePixiUI: React.FC<PurePixiUIProps> = ({
  balance = 1000.00,
  bet = 1.00,
  win = 0,
  onSpin = () => console.log('Spin clicked'),
  onAutoplay = () => console.log('Autoplay clicked'),
  onMenu = () => console.log('Menu clicked'),
  onSound = () => console.log('Sound clicked'),
  onSettings = () => console.log('Settings clicked'),
  onInfo = () => console.log('Info clicked'),
  spinButtonImage,
  autoplayButtonImage,
  menuButtonImage,
  soundButtonImage,
  settingsButtonImage,
  infoButtonImage,
  isSpinning = false
}) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const { config } = useGameStore();
  
  const gameName = config?.theme?.name || 'Premium Slot';
  
  const handleSoundToggle = () => {
    setIsSoundEnabled(!isSoundEnabled);
    onSound();
  };
  
  const handleAutoplayToggle = () => {
    setIsAutoplay(!isAutoplay);
    onAutoplay();
  };
  
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
      {/* Main Game Area - Most of the screen */}
      <div className="flex-1 relative">
        {/* Top Bar with Menu and Info */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-auto">
          {/* Left side - Menu */}
          <button
            onClick={onMenu}
            className="w-10 h-10 bg-gray-800/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-gray-700/80 transition-colors"
          >
            {menuButtonImage ? (
              <img src={menuButtonImage} alt="Menu" className="w-6 h-6" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
          
          {/* Right side - Info */}
          <button
            onClick={onInfo}
            className="w-10 h-10 bg-gray-800/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-gray-700/80 transition-colors"
          >
            {infoButtonImage ? (
              <img src={infoButtonImage} alt="Info" className="w-6 h-6" />
            ) : (
              <Info className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
      
      {/* Bottom UI Bar */}
      <div className="pointer-events-auto">
        {/* Main Control Bar */}
        <div className="bg-black/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left Section - Balance & Bet */}
            <div className="flex items-center gap-6">
              <div className="text-white">
                <div className="text-xs text-gray-400 uppercase">Balance</div>
                <div className="text-lg font-bold">{formatCurrency(balance)}</div>
              </div>
              <div className="text-white">
                <div className="text-xs text-gray-400 uppercase">Bet</div>
                <div className="text-lg font-bold">{formatCurrency(bet)}</div>
              </div>
            </div>
            
            {/* Center Section - Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Autoplay Button */}
              <button
                onClick={handleAutoplayToggle}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                  isAutoplay ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {autoplayButtonImage ? (
                  <img src={autoplayButtonImage} alt="Autoplay" className="w-8 h-8" />
                ) : (
                  <RotateCcw className="w-5 h-5 text-white" />
                )}
              </button>
              
              {/* Spin Button */}
              <button
                onClick={onSpin}
                disabled={isSpinning}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                  isSpinning
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 shadow-lg'
                }`}
              >
                {spinButtonImage ? (
                  <img src={spinButtonImage} alt="Spin" className="w-12 h-12" />
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-10 w-10 text-black ${isSpinning ? 'animate-spin' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
              
              {/* Max Bet / Quick Spin */}
              <button
                onClick={() => console.log('Max bet clicked')}
                className="w-12 h-12 bg-gray-700 rounded-lg flex flex-col items-center justify-center hover:bg-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
                <span className="text-xs text-white mt-0.5">MAX</span>
              </button>
            </div>
            
            {/* Right Section - Win & Sound/Settings */}
            <div className="flex items-center gap-4">
              {/* Win Display */}
              <div className="text-white">
                <div className="text-xs text-gray-400 uppercase">Win</div>
                <div className={`text-lg font-bold ${win > 0 ? 'text-yellow-400' : ''}`}>
                  {formatCurrency(win)}
                </div>
              </div>
              
              {/* Sound Button */}
              <button
                onClick={handleSoundToggle}
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                {soundButtonImage ? (
                  <img src={soundButtonImage} alt="Sound" className="w-6 h-6" />
                ) : (
                  <Volume2 className={`w-5 h-5 text-white ${!isSoundEnabled ? 'opacity-50' : ''}`} />
                )}
              </button>
              
              {/* Settings Button */}
              <button
                onClick={onSettings}
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                {settingsButtonImage ? (
                  <img src={settingsButtonImage} alt="Settings" className="w-6 h-6" />
                ) : (
                  <Settings className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Label - Logo and Game Name */}
        <div className="bg-gray-900 border-t border-gray-800 px-6 py-2 flex items-center">
          <img 
            src="/assets/brand/logo-small.svg" 
            alt="Game Crafter Logo" 
            className="h-4 w-auto mr-3 invert"
          />
          <span className="text-white text-xs font-semibold">
            {gameName} | Game Crafter
          </span>
        </div>
      </div>
    </div>
  );
};

export default PurePixiUI;