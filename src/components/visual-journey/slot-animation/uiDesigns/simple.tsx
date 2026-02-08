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
    className = '',
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
        <div className="h-full flex items-center justify-between gap-6">
          
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
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-4 py-2 backdrop-blur-sm border border-cyan-500/30">
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


//                   <div
//         data-testid="slot-ui"
//         className="slot-game-ui w-full px-4 py-3 text-white relative bg-gradient-to-b from-slate-800 to-slate-900 border-t-4 border-cyan-500"
//         style={{
//           height: '100px',
//           zIndex: 100,
//           pointerEvents: 'auto',
//           boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,188,212,0.3)'
//         }}
//       >
//         <div className="h-full flex items-center justify-between gap-6">
          
//           {/* Left Section - Menu & Info */}
//           <div className="flex items-center gap-4">
//             <button
//               onClick={toggleMenu}
//               className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
//               style={{ transform: `scale(${menuScale})` }}
//               aria-label="Menu"
//             >
//               {customButtons?.menuButton ? (
//                 <img src={customButtons.menuButton} alt="Menu" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
//               ) : (
//                 <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 group-hover:text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
//                 </svg>
//               )}
//             </button>

//             <button className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group" aria-label="Info">
//               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 group-hover:text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
//                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
//               </svg>
//             </button>
//           </div>

//           {/* Left-Center - Balance & Bet Display */}
//           <div className="flex items-center gap-6 bg-slate-700/50 rounded-lg px-4 py-2 backdrop-blur-sm border border-cyan-500/30">
//             <div className="text-center">
//               <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Balance</div>
//               <div className="text-lg font-bold text-emerald-400">${balance}</div>
//             </div>
//             <div className="w-0.5 h-10 bg-gradient-to-b from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"></div>
//             <div className="text-center">
//               <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Bet</div>
//               <div className="text-lg font-bold text-amber-400">${betAmount}</div>
//             </div>
//           </div>

//           {/* Center - Main Spin Button with Bet Controls */}
//           <div className="flex flex-col items-center gap-2">
//             <button
//               onClick={onSpin}
//               disabled={isSpinning}
//               className={`relative w-22 h-22 rounded-full shadow-2xl transform transition-all duration-300
//                 ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-cyan-500/50 active:scale-95'}
//                 ${customButtons?.spinButton ? 'bg-transparent' : 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 border-4 border-cyan-700'}`}
//               style={{ transform: `scale(${spinScale})` }}
//               aria-label="Spin"
//             >
//               {customButtons?.spinButton ? (
//                 <img src={customButtons.spinButton} alt="Spin" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
//               ) : (
//                 <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white m-auto drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M8 5v14l11-7z" />
//                 </svg>
//               )}
//             </button>

//             <button
//               onClick={() => {
//                 toggleAutoplay?.();
//                 onAutoplayToggle?.();
//               }}
//               className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
//                 ${isAutoplayActive ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-600 text-gray-200 hover:bg-slate-500'}`}
//               style={{ transform: `scale(${autoplayScale})` }}
//               aria-label="Autoplay"
//             >
//               {customButtons?.autoplayButton ? (
//                 <img src={customButtons.autoplayButton} alt="Autoplay" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
//               ) : (
//                 'AUTO'
//               )}
//             </button>
//           </div>

//           {/* Right-Center - Bet Controls */}
//           <div className="flex items-center gap-2">
//             <button
//               onClick={handleDecreaseBet}
//               className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-lg"
//               aria-label="Decrease Bet"
//             >
//               <Minus className="w-5 h-5" />
//             </button>
//             <button
//               onClick={handleIncreaseBet}
//               className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-lg"
//               aria-label="Increase Bet"
//             >
//               <Plus className="w-5 h-5" />
//             </button>
//           </div>

//           {/* Right Section - Sound & Settings */}
//           <div className="flex items-center gap-3">
//             <button
//               onClick={toggleSound}
//               className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
//               style={{ transform: `scale(${soundScale})` }}
//               aria-label="Sound Toggle"
//             >
//               {customButtons?.soundButton ? (
//                 <img src={customButtons.soundButton} alt="Sound" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
//               ) : (
//                 <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 group-hover:text-cyan-400 ${!isSoundEnabled ? 'opacity-30' : ''}`} fill="currentColor" viewBox="0 0 24 24">
//                   <path d={isSoundEnabled ? "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" : "M16.692 6.61a.75.75 0 10-1.06 1.06L19.879 12l-4.247 4.33a.75.75 0 101.06 1.06l4.879-4.96a.75.75 0 000-1.06l-4.879-4.96z"} />
//                 </svg>
//               )}
//             </button>

//             <button
//               onClick={toggleSettings}
//               className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
//               style={{ transform: `scale(${settingsScale})` }}
//               aria-label="Settings"
//             >
//               {customButtons?.settingsButton ? (
//                 <img src={customButtons.settingsButton} alt="Settings" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
//               ) : (
//                 <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 group-hover:text-cyan-400 group-hover:rotate-90 transition-all" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l1.72-1.35c.15-.12.19-.34.1-.51l-1.63-2.83c-.12-.22-.37-.29-.59-.22l-2.03.81c-.42-.32-.9-.6-1.44-.78l-.38-2.15C14.4 2.18 14.23 2 14 2h-4c-.23 0-.39.18-.41.41l-.38 2.15c-.54.18-1.02.46-1.44.78l-2.03-.81c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.21-.08.44.1.51l1.72 1.35c-.05.3-.07.62-.07.94s.02.64.07.94l-1.72 1.35c-.15.12-.19.34-.1.51l1.63 2.83c.12.22.37.29.59.22l2.03-.81c.42.32.9.6 1.44.78l.38 2.15c.05.23.22.41.41.41h4c.23 0 .39-.18.41-.41l.38-2.15c.54-.18 1.02-.46 1.44-.78l2.03.81c.22.09.47 0 .59-.22l1.63-2.83c.12-.22.07-.44-.1-.51l-1.72-1.35zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
//                 </svg>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     );
// };

//          <div
//         data-testid="slot-ui"
//         className="slot-game-ui w-full px-4 py-3 text-white relative bg-gradient-to-b from-slate-800 to-slate-900 border-t-4 border-cyan-500"
//         style={{
//           height: '100px',
//           zIndex: 100,
//           pointerEvents: 'auto',
//           boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,188,212,0.3)'
//         }}
//       >
//         <div className="h-full flex items-center justify-between gap-4">
          
//           {/* Left Controls */}
//           <div className="flex items-center gap-3">
//             {/* Menu Button */}
//             <button
//               onClick={toggleMenu}
//               className="p-2.5 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
//               style={{ transform: `scale(${menuScale})` }}
//               aria-label="Menu"
//             >
//               {customButtons?.menuButton ? (
//                 <img
//                   src={customButtons.menuButton}
//                   alt="Menu"
//                   className="w-6 h-6 object-contain group-hover:brightness-125"
//                   onError={(e) => e.currentTarget.style.display = 'none'}
//                 />
//               ) : (
//                 <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 group-hover:text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
//                 </svg>
//               )}
//             </button>

//             {/* Info Button */}
//             <button
//               className="p-2.5 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
//               aria-label="Info"
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 group-hover:text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
//                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
//               </svg>
//             </button>
//           </div>

//           {/* Balance & Bet - Center Left */}
//           <div className="flex items-center gap-6 bg-slate-700/50 rounded-lg px-4 py-2 backdrop-blur-sm border border-cyan-500/30">
//             <div className="text-center">
//               <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Balance</div>
//               <div className="text-lg font-bold text-emerald-400">${balance}</div>
//             </div>
//             <div className="w-0.5 h-10 bg-gradient-to-b from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"></div>
//             <div className="text-center">
//               <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Bet</div>
//               <div className="text-lg font-bold text-amber-400">${betAmount}</div>
//             </div>
//           </div>

//           {/* Center - Main Spin Button */}
//           <div className="flex flex-col items-center gap-3 -mx-8">
//             {/* Spin Button */}
//             <button
//               onClick={onSpin}
//               disabled={isSpinning}
//               className={`relative w-24 h-24 rounded-full shadow-2xl transform transition-all duration-300
//                 ${isSpinning 
//                   ? 'opacity-50 cursor-not-allowed' 
//                   : 'cursor-pointer hover:shadow-cyan-500/50 active:scale-95'}
//                 ${customButtons?.spinButton 
//                   ? 'bg-transparent' 
//                   : 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 border-4 border-cyan-700 hover:from-cyan-300 hover:to-cyan-500'}`}
//               style={{ 
//                 transform: `scale(${spinScale})`,
//                 boxShadow: isSpinning ? 'none' : '0 0 20px rgba(34, 197, 94, 0.5)'
//               }}
//               aria-label="Spin"
//             >
//               {customButtons?.spinButton ? (
//                 <img
//                   src={customButtons.spinButton}
//                   alt="Spin"
//                   className="w-full h-full object-contain"
//                   onError={(e) => e.currentTarget.style.display = 'none'}
//                 />
//               ) : (
//                 <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white m-auto drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M8 5v14l11-7z" />
//                 </svg>
//               )}
//             </button>

//             {/* Autoplay Button */}
//             <button
//               onClick={() => {
//                 toggleAutoplay?.();
//                 onAutoplayToggle?.();
//               }}
//               className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all transform
//                 ${isAutoplayActive 
//                   ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50' 
//                   : 'bg-slate-600 text-gray-200 hover:bg-slate-500'}`}
//               style={{ transform: `scale(${autoplayScale})` }}
//               aria-label="Autoplay"
//             >
//               {customButtons?.autoplayButton ? (
//                 <img
//                   src={customButtons.autoplayButton}
//                   alt="Autoplay"
//                   className="w-6 h-6 object-contain"
//                   onError={(e) => e.currentTarget.style.display = 'none'}
//                 />
//               ) : (
//                 'AUTO'
//               )}
//             </button>
//           </div>

//           {/* Bet Controls - Left of Spin */}
//           <div className="flex items-center gap-2">
//             {/* Decrease Bet */}
//             <button
//               onClick={handleDecreaseBet}
//               className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all hover:shadow-red-600/50 shadow-lg"
//               aria-label="Decrease Bet"
//             >
//               <Minus className="w-5 h-5" />
//             </button>

//             {/* Increase Bet */}
//             <button
//               onClick={handleIncreaseBet}
//               className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all hover:shadow-emerald-600/50 shadow-lg"
//               aria-label="Increase Bet"
//             >
//               <Plus className="w-5 h-5" />
//             </button>
//           </div>

//           {/* Right Controls */}
//           <div className="flex items-center gap-3">
//             {/* Sound Button */}
//             <button
//               onClick={toggleSound}
//               className="p-2.5 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
//               style={{ transform: `scale(${soundScale})` }}
//               aria-label="Sound Toggle"
//             >
//               {customButtons?.soundButton ? (
//                 <img
//                   src={customButtons.soundButton}
//                   alt="Sound"
//                   className="w-6 h-6 object-contain group-hover:brightness-125"
//                   onError={(e) => e.currentTarget.style.display = 'none'}
//                 />
//               ) : (
//                 <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 transition-all ${!isSoundEnabled ? 'opacity-30 group-hover:text-red-400' : 'group-hover:text-cyan-400'}`} fill="currentColor" viewBox="0 0 24 24">
//                   <path d={isSoundEnabled 
//                     ? "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" 
//                     : "M16.692 6.61a.75.75 0 10-1.06 1.06L19.879 12l-4.247 4.33a.75.75 0 101.06 1.06l4.879-4.96a.75.75 0 000-1.06l-4.879-4.96z"} 
//                   />
//                 </svg>
//               )}
//             </button>

//             {/* Settings Button */}
//             <button
//               onClick={toggleSettings}
//               className="p-2.5 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 group"
//               style={{ transform: `scale(${settingsScale})` }}
//               aria-label="Settings"
//             >
//               {customButtons?.settingsButton ? (
//                 <img
//                   src={customButtons.settingsButton}
//                   alt="Settings"
//                   className="w-6 h-6 object-contain group-hover:brightness-125"
//                   onError={(e) => e.currentTarget.style.display = 'none'}
//                 />
//               ) : (
//                 <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 group-hover:text-cyan-400 transition-all group-hover:rotate-90" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l1.72-1.35c.15-.12.19-.34.1-.51l-1.63-2.83c-.12-.22-.37-.29-.59-.22l-2.03.81c-.42-.32-.9-.6-1.44-.78l-.38-2.15C14.4 2.18 14.23 2 14 2h-4c-.23 0-.39.18-.41.41l-.38 2.15c-.54.18-1.02.46-1.44.78l-2.03-.81c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.21-.08.44.1.51l1.72 1.35c-.05.3-.07.62-.07.94s.02.64.07.94l-1.72 1.35c-.15.12-.19.34-.1.51l1.63 2.83c.12.22.37.29.59.22l2.03-.81c.42.32.9.6 1.44.78l.38 2.15c.05.23.22.41.41.41h4c.23 0 .39-.18.41-.41l.38-2.15c.54-.18 1.02-.46 1.44-.78l2.03.81c.22.09.47 0 .59-.22l1.63-2.83c.12-.22.07-.44-.1-.51l-1.72-1.35zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
//                 </svg>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     );
// };

//            <div
//   data-testid="slot-ui"
//   className="slot-game-ui w-full flex items-center justify-between px-4 py-3 text-white relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"
//   style={{
//     height: '100px',
//     zIndex: 100,
//     pointerEvents: 'auto',
//     overflow: 'visible'
//   }}
// >
//   {/* Left Section - Menu & Controls */}
//   <div className="flex items-center gap-4">
//     {/* Hamburger Menu */}
//     <button
//       onClick={toggleMenu}
//       className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//       aria-label="Menu"
//       style={{ transform: `scale(${menuScale})` }}
//     >
//       {customButtons?.menuButton ? (
//         <img
//           src={customButtons.menuButton}
//           alt="Menu"
//           className="w-7 h-7 object-contain"
//           onError={(e) => e.currentTarget.style.display = 'none'}
//         />
//       ) : (
//         <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
//           <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
//         </svg>
//       )}
//     </button>

//     {/* Info Button */}
//     <button
//       className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//       aria-label="Info"
//     >
//       <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
//       </svg>
//     </button>

//     {/* Balance & Bet Display */}
//     <div className="bg-black/40 rounded-lg px-4 py-2 backdrop-blur-sm border border-white/10">
//       <div className="flex items-center gap-3">
//         <div>
//           <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Balance</div>
//           <div className="text-xl font-bold text-green-400">${balance}</div>
//         </div>
//         <div className="w-px h-8 bg-white/20"></div>
//         <div>
//           <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Bet</div>
//           <div className="text-xl font-bold text-yellow-400">${betAmount}</div>
//         </div>
//       </div>
//     </div>
//   </div>

//   {/* Center Section - Spin Controls */}
//   <div className="flex flex-col items-center gap-2">
//     {/* Spin Button */}
//     <button
//       onClick={onSpin}
//       disabled={isSpinning}
//       className={`relative w-20 h-20 rounded-full shadow-2xl transform transition-all duration-200 
//         ${isSpinning ? 'opacity-60 cursor-not-allowed scale-95' : 'cursor-pointer hover:scale-105 active:scale-95'}
//         ${customButtons?.spinButton ? 'bg-transparent' : 'bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 border-4 border-yellow-700'}`}
//       style={{ transform: `scale(${spinScale})` }}
//       aria-label="Spin"
//     >
//       {customButtons?.spinButton ? (
//         <img
//           src={customButtons.spinButton}
//           alt="Spin"
//           className="w-full h-full object-contain"
//           onError={(e) => e.currentTarget.style.display = 'none'}
//         />
//       ) : (
//         <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-black m-auto" fill="currentColor" viewBox="0 0 24 24">
//           <path d="M8 5v14l11-7z" />
//         </svg>
//       )}
//     </button>

//     {/* Autoplay Button */}
//     <button
//       onClick={() => {
//         toggleAutoplay?.();
//         onAutoplayToggle?.();
//       }}
//       className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
//         ${isAutoplayActive 
//           ? 'bg-green-500 text-white shadow-lg' 
//           : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}
//       style={{ transform: `scale(${autoplayScale})` }}
//       aria-label="Autoplay"
//     >
//       {customButtons?.autoplayButton ? (
//         <img
//           src={customButtons.autoplayButton}
//           alt="Autoplay"
//           className="w-8 h-8 object-contain"
//           onError={(e) => e.currentTarget.style.display = 'none'}
//         />
//       ) : (
//         'AUTO'
//       )}
//     </button>
//   </div>

//   {/* Right Section - Settings & Bet Controls */}
//   <div className="flex items-center gap-3">
//     {/* Bet Decrease */}
//     <button
//       onClick={handleDecreaseBet}
//       className="p-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
//       aria-label="Decrease Bet"
//     >
//       <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M19 13H5v-2h14v2z" />
//       </svg>
//     </button>

//        {/* Sound Button */}
//     <button
//       onClick={toggleSound}
//       className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//       style={{ transform: `scale(${soundScale})` }}
//       aria-label="Sound Toggle"
//     >
//       {customButtons?.soundButton ? (
//         <img
//           src={customButtons.soundButton}
//           alt="Sound"
//           className="w-6 h-6 object-contain"
//           onError={(e) => e.currentTarget.style.display = 'none'}
//         />
//       ) : (
//         <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${!isSoundEnabled ? 'opacity-40' : ''}`} fill="currentColor" viewBox="0 0 24 24">
//           <path d={isSoundEnabled 
//             ? "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" 
//             : "M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L21.714504,3.81161555 C21.5575352,2.86904206 20.9561711,2.08455622 20.1272231,2.08455622 C19.5204372,2.08455622 18.9136513,2.39516674 18.6006128,2.70577721 L1.4164064,11.3305181 C0.9454939,11.5876157 0.9454939,12.1588704 0.99,12.4744748 L1.77946707,18.9154679 C1.89476699,19.397636 2.41,19.716464 2.92524301,19.716464 C3.03521743,19.716464 3.19218622,19.716464 3.34915501,19.5593666 L16.6915026,12.4744748 Z"
//           } fill="currentColor"/>
//         </svg>
//       )}
//     </button>

//     {/* Settings Button */}
//     <button
//       onClick={toggleSettings}
//       className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//       style={{ transform: `scale(${settingsScale})` }}
//       aria-label="Settings"
//     >
//       {customButtons?.settingsButton ? (
//         <img
//           src={customButtons.settingsButton}
//           alt="Settings"
//           className="w-6 h-6 object-contain"
//           onError={(e) => e.currentTarget.style.display = 'none'}
//         />
//       ) : (
//         <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
//           <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l1.72-1.35c.15-.12.19-.34.1-.51l-1.63-2.83c-.12-.22-.37-.29-.59-.22l-2.03.81c-.42-.32-.9-.6-1.44-.78l-.38-2.15C14.4 2.18 14.23 2 14 2h-4c-.23 0-.39.18-.41.41l-.38 2.15c-.54.18-1.02.46-1.44.78l-2.03-.81c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.21-.08.44.1.51l1.72 1.35c-.05.3-.07.62-.07.94s.02.64.07.94l-1.72 1.35c-.15.12-.19.34-.1.51l1.63 2.83c.12.22.37.29.59.22l2.03-.81c.42.32.9.6 1.44.78l.38 2.15c.05.23.22.41.41.41h4c.23 0 .39-.18.41-.41l.38-2.15c.54-.18 1.02-.46 1.44-.78l2.03.81c.22.09.47 0 .59-.22l1.63-2.83c.12-.22.07-.44-.1-.51l-1.72-1.35zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
//         </svg>
//       )}
//     </button>

//     {/* Bet Increase */}
//     <button
//       onClick={handleIncreaseBet}
//       className="p-2.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
//       aria-label="Increase Bet"
//     >
//       <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
//       </svg>
//     </button>
//   </div>
// </div> 
// );  
// };

        // <div
        //     data-testid="slot-ui"
        //     className={`slot-game-ui w-full justify-between flex gap-3 items-center px-3 text-white relative ${className}`}
        //     style={{

        //         backgroundSize: 'cover',
        //         backgroundPosition: 'center',
        //         backgroundRepeat: 'no-repeat',
        //         height: '100px',
        //         zIndex: 100,
        //         pointerEvents: 'auto',
        //         overflow: 'visible'
        //     }}
        // >
        //     {/* Left Section */}
        //     <div className="flex items-center gap-3">
        //         <div className="flex flex-col items-center gap-1">
        //             {/* Hamburger Menu Icon */}
        //             <button
        //                 className="cursor-pointer flex items-center justify-center"
        //                 onClick={toggleMenu}
        //                 style={{
        //                     width: '30px',
        //                     height: '30px',
        //                     background: 'transparent',
        //                     // border: 'none',
        //                     padding: '0',
        //                     transform: `scale(${menuScale})`
        //                 }}
        //             >
        //                 {customButtons?.menuButton ? (
        //                     <img
        //                         src={customButtons.menuButton}
        //                         alt="Menu"
        //                         className="w-full h-full object-contain"
        //                         style={{
        //                             filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        //                         }}
        //                         onError={(e) => {
        //                             console.error('[SlotGameUI] Failed to load menu button:', customButtons.menuButton);
        //                             e.currentTarget.style.display = 'none';
        //                         }}
        //                     />
        //                 ) : (
        //                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        //                     </svg>
        //                 )}
        //             </button>
        //             {/* Sound/Mute Button */}
        //             <button
        //                 className="cursor-pointer"
        //                 onClick={toggleSound}
        //                 style={{
        //                     width: '30px',
        //                     height: '30px',
        //                     backgroundColor: 'transparent',
        //                     // border: 'none',
        //                     display: 'flex',
        //                     alignItems: 'center',
        //                     justifyContent: 'center',
        //                     transform: `scale(${soundScale})`
        //                 }}
        //             >
        //                 {customButtons?.soundButton ? (
        //                     <img
        //                         src={customButtons.soundButton}
        //                         alt="Sound"
        //                         style={{
        //                             width: '100%',
        //                             height: '100%',
        //                             objectFit: 'contain',
        //                             filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        //                         }}
        //                         onError={(e) => {
        //                             console.error('[SlotGameUI] Failed to load sound button:', customButtons.soundButton);
        //                             e.currentTarget.style.display = 'none';
        //                         }}
        //                     />
        //                 ) : (
        //                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${!isSoundEnabled ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSoundEnabled ? "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"} />
        //                     </svg>
        //                 )}
        //             </button>
        //         </div>
        //         {/* Info Button */}
        //         <div className="flex items-center">
        //             <div className="cursor-pointer">
        //                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        //                 </svg>
        //             </div>
        //         </div>
        //         {/* Balance and Bet Section */}
        //         <div>
        //             {/* Balance Display - Stacked */}
        //             <div className="flex  items-center gap-2">
        //                 <div className="text-[1rem] font-bold text-orange-500 uppercase tracking-wide">CREDIT :</div>
        //                 <div className="font-bold text-[1rem]">{(balance)}</div>
        //             </div>
        //             {/* Bet Section - Stacked */}
        //             <div className="flex gap-2 items-center">
        //                 <span className="text-[1rem] font-bold text-orange-500 uppercase tracking-wide">BET :</span>
        //                 <span className="font-bold text-[1rem]">{(betAmount)}</span>
        //             </div>
        //         </div>
        //     </div>

        //     <div className='flex items-center gap-2'>
        //         {/* Settings Button */}
        //         <div className="flex items-center">
        //             <button
        //                 className="cursor-pointer"
        //                 onClick={toggleSettings}
        //                 style={{
        //                     width: '50px',
        //                     height: '50px',
        //                     backgroundColor: 'transparent',
        //                     border: 'none',
        //                     display: 'flex',
        //                     alignItems: 'center',
        //                     justifyContent: 'center',
        //                     transform: `scale(${settingsScale})`
        //                 }}
        //             >
        //                 {customButtons?.settingsButton ? (
        //                     <img
        //                         src={customButtons.settingsButton}
        //                         alt="Settings"
        //                         style={{
        //                             width: '100%',
        //                             height: '100%',
        //                             objectFit: 'contain',
        //                             filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        //                         }}
        //                         onError={(e) => {
        //                             console.error('[SlotGameUI] Failed to load settings button:', customButtons.settingsButton);
        //                             e.currentTarget.style.display = 'none';
        //                         }}
        //                     />
        //                 ) : (
        //                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        //                     </svg>
        //                 )}
        //             </button>
        //         </div>
        //         <div className='flex items-center rounded-full p-1 bg-black/40'>
        //             <Minus className='w-4 h-4 cursor-pointer' onClick={handleDecreaseBet} />
        //         </div>
        //         {/* Center Section - Spin Controls (Centered) */}
        //         <div className=" flex flex-col items-center">
        //             {/* Spin Button (centered) */}
        //             <button
        //                 className={`spin-btn 
        //                     text-black rounded-full w-[70px] h-[70px] flex items-center justify-center 
        //                     shadow-lg transform  transition-all duration-200 relative
        //                     z-200 active:scale-95
        //                     ${isSpinning
        //                         ? 'opacity-50 cursor-not-allowed'
        //                         : 'cursor-pointer group hover:from-yellow-300 hover:to-yellow-500'}
        //                     ${!customButtons?.spinButton
        //                         ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 border-yellow-700 border-2 '
        //                         : 'bg-transparent'}
        //                   `}

        //                 onClick={onSpin}
        //                 disabled={isSpinning}
        //                 aria-label="Spin"
        //                 style={{ transform: `scale(${spinScale})` }}
        //             >
        //                 {customButtons?.spinButton ? (
        //                     <img
        //                         src={customButtons.spinButton}
        //                         alt="Spin"
        //                         className="w-full h-full object-contain"
        //                         style={{
        //                             filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
        //                             maxWidth: '100%',
        //                             maxHeight: '100%'
        //                         }}
        //                         onError={(e) => {
        //                             console.error('[SlotGameUI] Failed to load spin button:', customButtons.spinButton);
        //                             e.currentTarget.style.display = 'none';
        //                         }}
        //                         onLoad={() => console.log('[SlotGameUI] Spin button loaded successfully')}
        //                     />
        //                 ) : (
        //                     <div className="flex items-center justify-center">
        //                         {/* Black arrow icon */}
        //                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        //                             <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        //                         </svg>
        //                     </div>
        //                 )}
        //             </button>
        //             {/* Auto Spin Button */}
        //             <button
        //                 className={`flex flex-col items-center gap-1 cursor-pointer ${isAutoplayActive ? 'text-yellow-400' : ''}`}
        //                 onClick={() => {
        //                     toggleAutoplay?.();
        //                     onAutoplayToggle?.();
        //                 }}
        //                 aria-label="Auto Spin"
        //                 style={{ transform: `scale(${autoplayScale})` }}
        //             >
        //                 {customButtons?.autoplayButton ? (
        //                     <>
        //                         <div
        //                             style={{
        //                                 width: '50px',
        //                                 height: '50px',
        //                                 backgroundColor: 'transparent',
        //                                 border: 'none',
        //                                 display: 'flex',
        //                                 alignItems: 'center',
        //                                 justifyContent: 'center'
        //                             }}
        //                         >
        //                             <img
        //                                 src={customButtons.autoplayButton}
        //                                 alt="Autoplay"
        //                                 style={{
        //                                     width: '100%',
        //                                     height: '100%',
        //                                     objectFit: 'contain',
        //                                     filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        //                                 }}
        //                                 onError={(e) => {
        //                                     console.error('[SlotGameUI] Failed to load autoplay button:', customButtons.autoplayButton);
        //                                     e.currentTarget.style.display = 'none';
        //                                 }}
        //                             />
        //                         </div>
        //                     </>
        //                 ) : (
        //                     <>
        //                         <div className='flex items-center justify-center border bg-black rounded-md p-1'>
        //                             <span className="text-xs">AUTOPLAY</span>
        //                         </div>
        //                     </>
        //                 )}
        //             </button>

        //         </div>
        //         <div className='flex items-center rounded-full p-1 bg-black/40'>
        //             <Plus className='w-4 h-4 cursor-pointer' onClick={handleIncreaseBet} />
        //         </div>
        //     </div>

        //     {/* Right Section */}

        // </div>
   