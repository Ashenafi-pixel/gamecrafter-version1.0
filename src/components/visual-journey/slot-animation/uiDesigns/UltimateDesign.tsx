import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useGameStore } from "../../../../store";

interface UltimateDesignProps {
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

export const UltimateDesign: React.FC<UltimateDesignProps> = ({
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
    const { betAmount, balance, isSpinning, winAmount } = useGameStore();
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
            className={`slot-game-ui w-full min-h-[88px] flex flex-wrap items-center gap-x-3 gap-y-2 px-3 text-white relative ${className}`}
            style={{

                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 100,
                pointerEvents: 'auto',
                overflow: 'visible'
            }}
        >
            {/* Left Section */}
            <div className="flex items-center gap-x-3 gap-y-1 flex-1 min-w-0">
                {/* Buttons (2 lines for more space) */}
                <div className="grid grid-cols-2 gap-x-1 gap-y-1 place-items-center shrink-0">
                    {/* Hamburger Menu Icon */}
                    <button
                        className="cursor-pointer flex items-center justify-center"
                        onClick={toggleMenu}
                        style={{
                            width: '30px',
                            height: '30px',
                            background: 'transparent',
                            // border: 'none',
                            padding: '0',
                            transform: `scale(${menuScale}) translate(${menuPosition.x}px, ${menuPosition.y}px)`
                        }}
                    >
                        {customButtons?.menuButton ? (
                            <img
                                src={customButtons.menuButton}
                                alt="Menu"
                                className="w-full h-full object-contain"
                                style={{
                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}
                                onError={(e) => {
                                    console.error('[SlotGameUI] Failed to load menu button:', customButtons.menuButton);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 opacity-80 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                    {/* Sound/Mute Button */}
                    <button
                        className="cursor-pointer"
                        onClick={toggleSound}
                        style={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: 'transparent',
                            // border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: `scale(${soundScale}) translate(${soundPosition.x}px, ${soundPosition.y}px)`
                        }}
                    >
                        {customButtons?.soundButton ? (
                            <img
                                src={customButtons.soundButton}
                                alt="Sound"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}
                                onError={(e) => {
                                    console.error('[SlotGameUI] Failed to load sound button:', customButtons.soundButton);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 opacity-80 hover:opacity-100 ${!isSoundEnabled ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSoundEnabled ? "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"} />
                            </svg>
                        )}
                    </button>
                    {/* Info Button */}
                    <div className="cursor-pointer flex items-center justify-center w-9 h-9">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    {/* Settings Button */}
                    <button
                        className="cursor-pointer"
                        onClick={toggleSettings}
                        style={{
                            width: '36px',
                            height: '36px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: `scale(${settingsScale}) translate(${settingsPosition.x}px, ${settingsPosition.y}px)`
                        }}
                    >
                        {customButtons?.settingsButton ? (
                            <img
                                src={customButtons.settingsButton}
                                alt="Settings"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}
                                onError={(e) => {
                                    console.error('[SlotGameUI] Failed to load settings button:', customButtons.settingsButton);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 opacity-80 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </button>
                </div>
                {/* Balance and Bet Section */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div className="flex items-center gap-x-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-orange-500 uppercase tracking-wide">CREDIT :</span>
                            <span className="font-bold text-sm text-white">
                                {balance.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-sm font-bold text-orange-500 uppercase tracking-wide">LAST WIN :</span>
                            <span className="font-bold text-sm text-white">
                                {winAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-orange-500 uppercase tracking-wide">BET :</span>
                        <span className="font-bold text-sm text-white">
                            {betAmount.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end ml-auto min-w-0">
                <button
                    className={`flex flex-col items-center gap-1 cursor-pointer shrink-0 ${isAutoplayActive ? 'text-yellow-400' : ''}`}
                    onClick={() => {
                        toggleAutoplay?.();
                        onAutoplayToggle?.();
                    }}
                    aria-label="Auto Spin"
                    style={{ transform: `scale(${autoplayScale}) translate(${autoplayPosition.x}px, ${autoplayPosition.y}px)` }}
                >
                    {customButtons?.autoplayButton ? (
                        <>
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <img
                                    src={customButtons.autoplayButton}
                                    alt="Autoplay"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                    }}
                                    onError={(e) => {
                                        console.error('[SlotGameUI] Failed to load autoplay button:', customButtons.autoplayButton);
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                className={`
                                              relative w-10 h-10 rounded-full
                                              flex items-center justify-center
                                              transition-all duration-300
                                              ${isAutoplayActive
                                        ? 'bg-yellow-400 shadow-[0_0_12px_rgba(255,200,0,0.8)] scale-105'
                                        : 'bg-black/60 hover:bg-black/80'}
                                                    `}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`w-5 h-5 transition-transform duration-500
                                          ${isAutoplayActive ? 'rotate-180 text-black' : 'text-white'}
                                        `}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0014-7M19 5a9 9 0 00-14 7"
                                    />
                                </svg>

                                {isAutoplayActive && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full" />
                                )}
                            </div>

                        </>
                    )}
                </button>
                <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center shrink-0">
                    <Minus className='w-4 h-4 cursor-pointer' onClick={handleDecreaseBet} />
                </div>
                {/* Center Section - Spin Controls (Centered) */}
                <div className="flex flex-col items-center shrink-0">
                    {/* Spin Button (centered) */}
                    <button
                        className={`spin-btn 
                            text-black rounded-full w-[76px] h-[76px] flex items-center justify-center 
                            shadow-lg transform  transition-all duration-200 relative
                            z-200 active:scale-95
                            ${isSpinning
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer group hover:from-yellow-300 hover:to-yellow-500'}
                            ${!customButtons?.spinButton
                                ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 border-yellow-700 border-2 '
                                : 'bg-transparent'}
                          `}

                        onClick={onSpin}
                        aria-label={isSpinning ? "Stop Spin" : "Spin"}
                        style={{ transform: `scale(${spinScale}) translate(${spinPosition.x}px, ${spinPosition.y}px)` }}
                    >
                        {customButtons?.spinButton ? (
                            <img
                                src={customButtons.spinButton}
                                alt={isSpinning ? "Stop" : "Spin"}
                                className="w-full h-full object-contain"
                                style={{
                                    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                                    maxWidth: '100%',
                                    maxHeight: '100%'
                                }}
                                onError={(e) => {
                                    console.error('[SlotGameUI] Failed to load spin button:', customButtons.spinButton);
                                    e.currentTarget.style.display = 'none';
                                }}
                                onLoad={() => console.log('[SlotGameUI] Spin button loaded successfully')}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-1">
                                {isSpinning ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                            <rect x="6" y="6" width="12" height="12" rx="2" />
                                        </svg>
                                        <span className="text-xs text-red-500 font-bold">STOP</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-xs">SPIN</span>
                                    </>
                                )}
                            </div>
                        )}
                    </button>
                </div>
                <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center shrink-0">
                    <Plus className='w-4 h-4 cursor-pointer' onClick={handleIncreaseBet} />
                </div>
            </div>
        </div>
    );
};
