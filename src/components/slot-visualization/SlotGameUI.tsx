import React, { useState } from 'react';
import { useGameStore } from '../../store';
import { Menu, Info, Volume2, VolumeX, Play, SkipForward, Zap } from 'lucide-react';

interface SlotGameUIProps {
  onSpin?: () => void;
  onAutoPlay?: () => void;
  onQuickSpin?: () => void;
  className?: string;
}

export const SlotGameUI: React.FC<SlotGameUIProps> = ({
  onSpin,
  onAutoPlay,
  onQuickSpin,
  className = ''
}) => {
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isQuickSpin, setIsQuickSpin] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [bet, setBet] = useState(1.00);
  const [win, setWin] = useState(0.00);
  const [balance, setBalance] = useState(1000.00);
  
  const config = useGameStore(state => state.config);
  const gameName = config?.gameInfo?.name || config?.theme?.name || 'Slot Game';

  const handleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
    onAutoPlay?.();
  };

  const handleQuickSpin = () => {
    setIsQuickSpin(!isQuickSpin);
    onQuickSpin?.();
  };

  const handleSpin = () => {
    if (balance >= bet) {
      setBalance(balance - bet);
      onSpin?.();
    }
  };

  return (
    <div className={`slot-game-ui ${className}`}>
      {/* Main UI Bar */}
      <div className="bg-gray-900 border-t-2 border-gray-800">
        <div className="grid grid-cols-3 items-center px-4 h-20">
          {/* Left Section */}
          <div className="flex items-center gap-6">
            {/* Hamburger Menu */}
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Menu className="w-6 h-6 text-gray-400" />
            </button>
            
            {/* Info Button */}
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Info className="w-6 h-6 text-gray-400" />
            </button>
            
            {/* Bet Display */}
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">BET</div>
              <div className="text-xl font-bold text-white mt-1 min-w-[80px]">{bet.toFixed(2)}</div>
            </div>
          </div>

          {/* Center Section - Spin Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* AutoPlay Button */}
            <button
              onClick={handleAutoPlay}
              className={`p-3 rounded-full transition-all ${
                isAutoPlay 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
              title="Auto Play"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            
            {/* Main Spin Button */}
            <button
              onClick={handleSpin}
              disabled={balance < bet}
              className="relative p-6 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                       rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all
                       disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed"
            >
              <Play className="w-8 h-8 text-white fill-white" />
              <div className="absolute inset-0 rounded-full animate-pulse bg-green-400 opacity-0 hover:opacity-20"></div>
            </button>
            
            {/* QuickSpin Button */}
            <button
              onClick={handleQuickSpin}
              className={`p-3 rounded-full transition-all ${
                isQuickSpin 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
              title="Quick Spin"
            >
              <Zap className="w-5 h-5" />
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center justify-end gap-6">
            {/* Win Display */}
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">WIN</div>
              <div className="text-xl font-bold text-green-400 mt-1 min-w-[80px]">{win.toFixed(2)}</div>
            </div>
            
            {/* Balance Display */}
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">BALANCE</div>
              <div className="text-xl font-bold text-white mt-1 min-w-[100px]">{balance.toFixed(2)}</div>
            </div>
            
            {/* Sound Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6 text-gray-400" />
              ) : (
                <Volume2 className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar with Game Info */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="flex items-center justify-between h-10 px-4">
          {/* Left aligned logo and game info */}
          <div className="flex items-center gap-3 text-sm">
            {/* GameCrafter Logo */}
            <img 
              src="/assets/brand/logo-small.svg" 
              alt="GameCrafter" 
              className="h-6 w-auto"
            />
            <span className="text-gray-400">
              <span className="font-semibold text-white">{gameName}</span>
              <span className="mx-2 text-gray-600">|</span>
              <span>Game Crafter</span>
            </span>
          </div>
          
          {/* Right side can be used for additional info if needed */}
          <div className="text-xs text-gray-500">
            {/* Future: Version info, RTP, etc */}
          </div>
        </div>
      </div>
    </div>
  );
};