import React, { useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { useGameStore } from "../../../../store";

interface PlayNGoStyleUIProps {
    onSpin?: () => void;
    className?: string;
    toggleMenu?: () => void;
    customButtons?: {
        spinButton?: string;
        autoplayButton?: string;
        menuButton?: string;
        soundButton?: string;
        settingsButton?: string;
        infoButton?: string;
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
    BET_VALUES: number[];
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

export const ModernUI: React.FC<PlayNGoStyleUIProps> = ({
    onSpin,
    className = "",
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
    BET_VALUES,
    buttonScale = 100,
    buttonScales,
    buttonPositions,
}) => {
    const { betAmount, balance, isSpinning, setBetAmount , winAmount } = useGameStore();
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

    // Find current bet index and get visible values (5 total: 2 left, center, 2 right)
    const visibleBetValues = useMemo(() => {
        const currentIndex = BET_VALUES.findIndex(val => Math.abs(val - betAmount) < 0.01);
        const selectedIndex = currentIndex >= 0 ? currentIndex : Math.floor(BET_VALUES.length / 2);
        
        // Calculate start index to show 5 values with selected in center
        let startIndex = selectedIndex - 2;
        
        // Handle edge cases
        if (startIndex < 0) {
            startIndex = 0;
        } else if (startIndex + 5 > BET_VALUES.length) {
            startIndex = Math.max(0, BET_VALUES.length - 5);
        }
        
        const visible = BET_VALUES.slice(startIndex, startIndex + 5);
        const centerIndex = selectedIndex - startIndex;
        
        return { values: visible, centerIndex, selectedIndex };
    }, [betAmount]);

    return (
        <div
            className={`w-full flex items-center justify-between px-2 py-2 bg-transparent  ${className}`}
            style={{ height: "80px" }}
        >
            {/* Left Section - Menu & Info */}
            <div className="flex items-center gap-3">
                {/* Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#333] shadow-inner hover:brightness-125 transition"
                    style={{ transform: `scale(${menuScale}) translate(${menuPosition.x}px, ${menuPosition.y}px)` }}
                >
                    {customButtons?.menuButton ? (
                        <img src={customButtons.menuButton} alt="Menu" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>

                {/* Balance Display */}
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uw:text-xl font-semibold text-gray-300 uppercase tracking-wider">BALANCE</span>
                    <span className="text-white text-[1rem] uw:text-2xl font-bold drop-shadow">
                        {balance.toFixed(2)}
                    </span>
                </div>
                {!isSpinning &&
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uw:text-xl font-semibold text-gray-300 uppercase tracking-wider">Last Win</span>
                    <span className="text-white text-[1rem] uw:text-2xl font-bold drop-shadow">
                        {winAmount.toFixed(2)}
                    </span>
                </div>
                }
            </div>

            {/* Center Section - Bet Controls */}
            <div className="flex items-center">
                {/* Decrease Bet */}
                <button
                    onClick={handleDecreaseBet}
                    className="relative flex items-center justify-center w-8 h-8 bg-transparent transition-transform active:scale-95"
                    style={{ transform: `scale(${scaleMultiplier})` }}
                >
                    {/* Triangle shape */}
                    <span
                        className="absolute left-1/2 top-1/2 -translate-x-[60%] -translate-y-1/2 
                        w-0 h-0 
                        border-y-[14px] border-y-transparent border-r-[20px] border-r-[#2bb4ff]
                        hover:border-r-[#4ecaff] 
                        drop-shadow-[0_0_6px_rgba(43,180,255,0.6)]
                        rounded-sm"
                    ></span>
                    {/* Centered minus icon */}
                    <Minus className="w-4 h-4 text-black z-10" />
                </button>

                {/* Bet Value Slider */}
                <div className="flex items-center gap-0.5">
                    {visibleBetValues.values.map((value, index) => {
                        const isSelected = index === visibleBetValues.centerIndex;
                        return (
                            <button
                                key={`${value}-${index}`}
                                onClick={() => setBetAmount(value)}
                                className={`
                                    w-10 uw:w-32 min-w-[40px] px- py-1.5 rounded-lg transition-all duration-200 text-center flex items-center justify-center
                                    ${isSelected 
                                        ? 'bg-gradient-to-b from-[#2bb4ff] to-[#1a8fd9] border-1 border-[#4ecaff] text-white font-bold text-base shadow-[0_0_12px_rgba(43,180,255,0.8)] scale-105' 
                                        : 'bg-[#1c1c1c] border border-[#444] text-gray-400 text-sm font-medium hover:bg-[#2a2a2a] hover:text-gray-300'
                                    }
                                `}
                                style={{ transform: `scale(${scaleMultiplier}${isSelected ? ' * 1.05' : ''})` }}
                            >
                                <span className={isSelected ? 'text-white font-bold text-base uw:text-2xl' : 'uw:text-xl text-gray-400 text-sm font-medium'}>
                                    {value}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Increase Bet */}
                <button
                    onClick={handleIncreaseBet}
                    className="relative flex items-center justify-center w-8 h-8 bg-transparent transition-transform active:scale-95"
                    style={{ transform: `scale(${scaleMultiplier})` }}
                >
                    {/* Right-pointing triangle */}
                    <span
                        className="absolute left-1/2 top-1/2 -translate-x-[40%] -translate-y-1/2 
                                    w-0 h-0 border-y-[14px] border-y-transparent border-l-[20px] border-l-[#2bb4ff]
                                    hover:border-l-[#4ecaff] drop-shadow-[0_0_6px_rgba(43,180,255,0.6)]rounded-sm"
                    ></span>
                    {/* Centered plus icon */}
                    <Plus className="w-4 h-4 text-black z-10" />
                </button>
            </div>

            {/* Right Section - Auto, Sound, Settings */}
            <div className="flex items-center gap-1">
                {/* Sound */}
                <button
                    onClick={toggleSound}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#333] shadow-inner transition"
                    style={{ transform: `scale(${soundScale}) translate(${soundPosition.x}px, ${soundPosition.y}px)` }}
                >
                    {customButtons?.soundButton ? (
                        <img src={customButtons.soundButton} alt="Sound" className={`${!isSoundEnabled ? "brightness-50" : ""}`} />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white ${!isSoundEnabled ? "opacity-50" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d={
                                    isSoundEnabled
                                        ? "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                        : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                                }
                            />
                        </svg>
                    )}
                </button>

                {/* Settings */}
                <button
                    onClick={toggleSettings}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#333] shadow-inner hover:brightness-125 transition"
                    style={{ transform: `scale(${settingsScale}) translate(${settingsPosition.x}px, ${settingsPosition.y}px)` }}
                >
                    {customButtons?.settingsButton ? (
                        <img src={customButtons.settingsButton} alt="Settings" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    )}
                </button>
            </div>
            {/* Bottom Section - Autoplay & Spin */}
            <div className="flex items-center justify-center gap-4 uw:gap-8 pl-3 uw:pl-6">
                {/* Autoplay */}
                <button
                    onClick={() => {
                        toggleAutoplay?.();
                        onAutoplayToggle?.();
                    }}
                    className={`flex items-center justify-center w-10 h-10 uw:w-14 uw:h-14 rounded-full ml-2 uw:ml-4 ${customButtons?.autoplayButton ? "bg-[#1a1a1a]" : "bg-[#f6c343] hover:bg-[#ffd24d]"} border border-[#333] shadow-inner hover:brightness-110 active:scale-95 transition ${isAutoplayActive ? "ring-2 ring-yellow-400" : ""}`}
                    style={{ transform: `scale(${autoplayScale}) translate(${autoplayPosition.x}px, ${autoplayPosition.y}px)` }}
                >
                    {customButtons?.autoplayButton ? (
                        <img src={customButtons.autoplayButton} alt="Auto"/>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 uw:h-9 uw:w-9 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                </button>

                {/* SPIN Button */}
                <button
                    onClick={onSpin}
                    className={`w-24 h-24 uw:w-32 uw:h-32 mb-8 rounded-full flex flex-col items-center justify-center gap-2 uw:gap-3 text-black font-bold ${customButtons?.spinButton ? "" : isSpinning ? "border-4 border-red-500 bg-gradient-to-b from-red-400 to-red-600" : "border-4 border-[#6bff60] bg-gradient-to-b from-[#6bff60] to-[#3adb31]"} shadow-inner hover:scale-105 active:scale-100 transition`}
                    style={{ transform: `scale(${spinScale}) translate(${spinPosition.x}px, ${spinPosition.y}px)` }}
                    aria-label={isSpinning ? "Stop Spin" : "Spin"}
                >
                    {customButtons?.spinButton ? (
                        <img src={customButtons.spinButton} alt={isSpinning ? "Stop" : "Spin"} className="" />
                    ) : (
                        <>
                            {isSpinning ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 uw:h-14 uw:w-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 uw:h-14 uw:w-14 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            )}
                            <span className={`text-sm uw:text-3xl ${isSpinning ? 'text-white' : 'text-black'}`}>
                                {isSpinning ? 'STOP' : 'SPIN'}
                            </span>
                        </>
                    )}
                </button>
            </div>

        </div>
    );
};
