import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useGameStore } from "../../../../store";

interface NormalDesignProps {
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
    onMaxBet?: () => void;
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

export const NormalDesign: React.FC<NormalDesignProps> = ({
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

    const getButtonScale = (buttonName: keyof NonNullable<typeof buttonScales>) => {
        if (buttonScales && buttonScales[buttonName] !== undefined) {
            return buttonScales[buttonName]! / 100;
        }
        return scaleMultiplier;
    };
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
            className={`slot-game-ui relative w-full h-[80px] uw:h-[130px] flex items-center bg-[#000000ff] px-4 uw:px-6 text-white ${className}`}
            style={{

                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 20,
                pointerEvents: 'auto',
                overflow: 'visible'
            }}
        >
            {/* Left Section */}
            <div className="flex items-center gap-4 uw:gap-8 flex-1">
                <button
                    className="cursor-pointer flex items-center justify-center w-[50px] uw:w-[60px] h-[50px] uw:h-[60px] bg-transparent border-none p-0"
                    onClick={toggleMenu}
                    style={{ transform: `scale(${menuScale}) translate(${menuPosition.x}px, ${menuPosition.y}px)` }}
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 uw:h-12 uw:w-12 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
                <div className="flex items-center gap-4 uw:gap-8">
                    {/* Info Button */}
                    <div className="cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 uw:h-12 uw:w-12 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    {/* Bet Section - Stacked */}
                    <div className="flex flex-col items-center">
                        <span className="text-xs uw:text-2xl font-medium uppercase tracking-wide">BET Amount</span>
                        <div className='flex items-center gap-1 uw:gap-3'>
                            <Minus className='w-4 h-4 uw:w-8 uw:h-8 cursor-pointer' onClick={handleDecreaseBet} />
                            <span className="font-bold text-base uw:text-2xl">
                                {betAmount.toFixed(2)}
                            </span>
                            <Plus className='w-4 h-4 uw:w-8 uw:h-8 cursor-pointer' onClick={handleIncreaseBet} />
                        </div>
                    </div>
                </div>
                {/* Autoplay Button (left cluster, spaced from center) */}
                <button
                    className={`flex flex-col items-center gap-1 cursor-pointer ml-10 uw:ml-48 pr-1 mr-8 uw:mr-8 ${isAutoplayActive ? 'text-yellow-400' : ''}`}
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
                                className="w-[50px] h-[50px] uw:w-[60px] uw:h-[60px] bg-transparent border-none flex items-center justify-center">
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
                            <span className="text-xs">AUTO</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 uw:h-12 uw:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-xs uw:text-xl">AUTO</span>
                        </>
                    )}
                </button>
            </div>

            {/* Center Section - Spin Controls (Centered) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Spin Button (centered) */}
                <div
                    className="relative pointer-events-auto"
                    style={{ transform: `translate(${spinPosition.x}px, ${spinPosition.y}px)` }}
                >
                    <button
                        className={`spin-btn 
                            text-black rounded-full w-[80px] h-[80px] uw:w-[130px] uw:h-[130px] flex items-center justify-center scale-95
                            shadow-lg transform hover:scale-100 transition-all duration-200 relative
                            z-200
                            ${isSpinning
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer group hover:from-yellow-300 hover:to-yellow-500'}
                            ${!customButtons?.spinButton
                            ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 border-yellow-700 border-2 '
                            : 'bg-transparent'}
                          `}
                        onClick={onSpin}
                        style={{ transform: `scale(${spinScale * 0.95})` }}
                        aria-label={isSpinning ? "Stop Spin" : "Spin"}
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
                            <div className="flex flex-col items-center justify-center">
                                {isSpinning ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 uw:h-20 uw:w-20 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                            <rect x="6" y="6" width="12" height="12" rx="2" />
                                        </svg>
                                        <span className="text-xs uw:text-lg text-red-500 font-bold">STOP</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 uw:h-20 uw:w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-xs uw:text-lg">SPIN</span>
                                    </>
                                )}
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4 uw:gap-8 flex-1  justify-end">
                {!isSpinning && 
                <div className="flex flex-col items-center ">
                    <div className="text-xs uw:text-2xl font-medium uppercase">Last Win</div>
                    <div className="font-bold text-sm uw:text-2xl">
                        <span>{winAmount.toFixed(2)}</span>
                    </div>
                </div>}
                <div className="flex flex-col items-center ">
                    <div className="text-xs uw:text-2xl font-medium uppercase">BALANCE (FF)</div>
                    <div className="font-bold text-sm uw:text-2xl">
                        {balance.toFixed(2)}
                    </div>
                </div>

                {/* Sound/Mute Button */}
                <button
                    onClick={toggleSound}
                    className="cursor-pointer w-[50px] h-[50px] uw:w-[60px] uw:h-[60px] bg-transparent border-none flex items-center justify-center"
                    style={{ transform: `scale(${soundScale}) translate(${soundPosition.x}px, ${soundPosition.y}px)` }}
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
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 uw:h-12 uw:w-12 ${!isSoundEnabled ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSoundEnabled ? "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"} />
                        </svg>
                    )}
                </button>
                {/* Settings Button */}
                <button
                    onClick={toggleSettings}
                    className="cursor-pointer w-[50px] h-[50px] uw:w-[60px] uw:h-[60px] bg-transparent border-none flex items-center justify-center"
                    style={{ transform: `scale(${settingsScale}) translate(${settingsPosition.x}px, ${settingsPosition.y}px)` }}
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 uw:h-12 uw:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};
