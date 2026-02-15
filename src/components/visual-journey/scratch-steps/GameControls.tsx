import React, { useState } from 'react';
import { RotateCcw, Menu, Pause, Zap, Info, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

// Update Interface
interface GameControlsProps {
    balance: number;
    bet: number;
    win: number;
    gameState: 'idle' | 'playing' | 'revealed' | 'won';
    onBetChange: (bet: number) => void;
    onBuy: () => void;
    onAutoplay: (config: AutoplayConfig) => void;
    isAutoPlaying: boolean;
    onStopAuto: () => void;
    isFixedBet?: boolean;
    gameTitle?: string;
    rulesConfig?: {
        howToPlayText?: string;
        paytableRows?: { symbol: string; value: string }[];
        rulesText?: string;
        generalText?: string;
        additionalInfoText?: string;
        interruptedGameText?: string;
        gameHistoryText?: string;
        termsText?: string;
        paytableConfig?: any;
    };
}

export interface AutoplayConfig {
    rounds: number;
    lossLimit: number;
    singleWinLimit: number;
    stopOnBonus: boolean;
    turbo: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
    balance, bet, win, gameState, onBetChange, onBuy, onAutoplay, isAutoPlaying, onStopAuto, isFixedBet = false, gameTitle = 'GAME TITLE', rulesConfig
}) => {
    const [showAutoModal, setShowAutoModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [autoConfig, setAutoConfig] = useState<AutoplayConfig>({
        rounds: 10,
        lossLimit: 0,
        singleWinLimit: 0,
        stopOnBonus: true,
        turbo: false
    });

    const startAutoplay = () => {
        onAutoplay(autoConfig);
        setShowAutoModal(false);
    };

    // Default Fallbacks (if rulesConfig is missing)
    const howToPlay = rulesConfig?.howToPlayText || "Match three gametype\n\nYou will win a prize if you reveal three identical symbols, the prize will be equal to the amount of one of those three identical symbols.\n\nPress the BUY-button to buy a new card. Either scratch manually or press the SCRATCH ALL button to reveal all symbols.\n\nPress the AUTO PLAY button to buy multiple cards that will be automatically scratched.";
    const rulesText = rulesConfig?.rulesText || "Misuse or malfunction voids all pays and plays. Only highest winning symbol paid per card. Wins are shown in currency and are based on the size of the stake.";
    const generalText = rulesConfig?.generalText || "BALANCE\nYour current balance is shown in the BALANCE display. Balance, bets and winnings are presented in the player’s chosen currency.\n\nBET\nThe current bet level is shown in the BET display. The allowed bet level for this game is €2.00.\n\nTURBO PLAY\nThe Turbo Play functionality is used to get the fastest game round possible (not available on all operators and jurisdictions). Turbo Play is activated from the menu.";
    const additionalText = rulesConfig?.additionalInfoText || "In addition to the features described here, the bar on the bottom of the game screen displays the current balance in the chosen currency, the amount paid if a win occurs, and the amount bet on the last/current proposition.";
    const interruptedText = rulesConfig?.interruptedGameText || "If your internet connection fails during a game, you can typically resume the round by reloading the game immediately. If a round was already completed on the server but the visual reveal was interrupted, the result will be recorded in your Game History, though the animation may not replay.\n\nUnfinished Rounds: Any active bet on an incomplete round will identify as \"paused\" until you complete the action or the system auto-resolves it. If a game remains inactive for 24 hours (1 day), the system will typically void the round and refund the original wager to your balance.\n\nSystem Protection: We ensure fair play by logging all game states. Malfunctions in hardware or networks do not void stored results unless the game cannot be resolved, in which case bets are refunded. Winning outcomes that require no further player action will be automatically credited.";
    const historyText = rulesConfig?.gameHistoryText || "The result of a completed game may be viewed in Game History immediately after closing the game window. Results of unfinished games are not displayed in Game History.";
    const termsText = rulesConfig?.termsText || "- Misuse or malfunction voids all pays and plays.\n- Any visual representation of a physical device (a reel, a wheel of fortune or similar) does not represent a “real” physical device and the probabilities of it stopping on any particular position is determined by the game’s random number generator, and not the number of positions on each device.";

    // Default Table
    const defaultRows = [
        { symbol: "3x Diamond", value: "€150,000.00" },
        { symbol: "3x Gold Bar", value: "€50,000.00" },
        { symbol: "3x Cash Stack", value: "€25,000.00" },
        { symbol: "3x Coins", value: "€10,000.00" },
        { symbol: "3x Ring", value: "€7,500.00" },
        { symbol: "3x Horseshoe", value: "€5,000.00" },
        { symbol: "3x Bell", value: "€2,500.00" },
        { symbol: "3x Clover", value: "€1,000.00" },
        { symbol: "3x Cherry", value: "€500.00" },
        { symbol: "3x Lemon", value: "€100.00" },
    ];
    const paytableRows = rulesConfig?.paytableRows || defaultRows;

    return (
        <div className="w-full bg-black text-white p-2 sm:p-3 shadow-2xl relative z-50 flex items-center justify-between border-t border-gray-800 overflow-x-auto scrollbar-hide md:justify-around">
            {/* LEFT: Menu, Info, Balance */}
            <div className="flex items-center gap-1.5 md:gap-4 shrink-0 z-10 relative">
                <button className="text-white hover:text-gray-300 transition-colors shrink-0 hidden md:block">
                    <Menu size={24} />
                </button>

                <button
                    onClick={() => setShowInfoModal(true)}
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors shrink-0"
                >
                    <Info size={14} className="md:size-4" />
                </button>

                <div className="flex flex-col shrink min-w-0 max-w-[100px] sm:max-w-none">
                    <span className="text-[7px] md:text-[10px] font-bold text-[#FFD700] uppercase tracking-wider truncate hidden xs:block">Balance</span>
                    <span className="text-xs md:text-lg font-bold font-mono leading-none truncate tracking-tight">€{balance.toFixed(2)}</span>
                </div>
            </div>

            {/* CENTER: Auto - Buy - Bet */}
            <div className="flex items-center gap-2 md:gap-6 px-2 sm:px-4">
                {/* Auto */}
                <button
                    onClick={() => setShowAutoModal(true)}
                    disabled={isAutoPlaying || gameState === 'playing'}
                    className="w-8 h-8 md:w-12 md:h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 text-white transition-colors disabled:opacity-50 shrink-0"
                >
                    <div className="flex flex-col items-center justify-center">
                        <RotateCcw size={12} className="md:size-4" />
                        <span className="text-[6px] md:text-[8px] font-bold">AUTO</span>
                    </div>
                </button>

                {/* Buy */}
                <div className="shrink-0">
                    {isAutoPlaying ? (
                        <button
                            onClick={onStopAuto}
                            className="h-9 md:h-14 px-3 md:px-8 bg-red-600 hover:bg-red-500 text-white rounded-full font-black text-xs md:text-base shadow-[0_3px_0_#991b1b] active:shadow-none active:translate-y-[2px] transition-all flex items-center gap-1.5"
                        >
                            <Pause size={14} className="md:size-5" fill="currentColor" />
                            <span className="hidden sm:inline">STOP</span>
                        </button>
                    ) : (
                        <button
                            onClick={onBuy}
                            disabled={gameState === 'playing'}
                            className={`h-9 md:h-14 px-4 md:px-10 rounded-full font-black text-xs md:text-xl shadow-[0_3px_0_#15803d] active:shadow-none active:translate-y-[2px] transition-all flex items-center justify-center gap-2 uppercase tracking-wide
                                ${gameState === 'playing'
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-none translate-y-[2px]'
                                    : gameState === 'won' || gameState === 'revealed'
                                        ? 'bg-[#4ade80] text-green-900 hover:bg-[#22c55e]'
                                        : 'bg-[#22c55e] text-white hover:bg-[#16a34a]'
                                }
                            `}
                        >
                            {gameState === 'playing' ? '...' : gameState === 'revealed' ? 'Play' : 'Buy'}
                        </button>
                    )}
                </div>

                {/* Bet */}
                <div className="flex flex-col relative group shrink-0 min-w-0 max-w-[60px] sm:max-w-none">
                    <span className="text-[7px] md:text-[10px] font-bold text-[#FFD700] uppercase tracking-wider truncate hidden xs:block">Bet</span>
                    <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-xs md:text-lg font-bold font-mono leading-none tracking-tight">€{bet.toFixed(2)}</span>
                        {!isFixedBet && gameState === 'idle' && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-1 hidden sm:group-hover:flex gap-1 shadow-xl z-50">
                                <button onClick={() => onBetChange(Math.max(0.1, bet - 0.1))} className="w-6 h-6 bg-gray-800 rounded hover:bg-gray-700 flex items-center justify-center font-bold text-base">-</button>
                                <button onClick={() => onBetChange(bet + 0.1)} className="w-6 h-6 bg-gray-800 rounded hover:bg-gray-700 flex items-center justify-center font-bold text-base">+</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Win */}
            <div className="flex items-center justify-end shrink-0 min-w-[50px] sm:min-w-[70px] z-10 relative">
                {win > 0 && (
                    <div className="flex flex-col items-end animate-pulse">
                        <span className="text-[7px] md:text-[10px] font-bold text-green-400 uppercase tracking-wider truncate hidden xs:block">Win</span>
                        <span className="text-xs md:text-xl font-black text-green-400">€{win.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* AUTOPLAY MODAL */}
            <Dialog.Root open={showAutoModal} onOpenChange={setShowAutoModal}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white p-6 rounded-2xl w-[95vw] max-w-[400px] shadow-2xl border border-gray-800 z-[101]">
                        <Dialog.Title className="text-xl font-bold mb-6 flex items-center gap-2">
                            <RotateCcw className="text-[#22c55e]" /> Autoplay Options
                        </Dialog.Title>

                        {/* Rounds */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Number of Rounds</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[10, 25, 50, 75, 100].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setAutoConfig({ ...autoConfig, rounds: r })}
                                        className={`py-2 rounded-lg text-sm font-bold border transition-colors
                                            ${autoConfig.rounds === r
                                                ? 'bg-[#22c55e] border-[#22c55e] text-white'
                                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}
                                        `}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3 mb-8">
                            <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-900 rounded-lg border border-gray-800">
                                <span className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-400" /> Turbo Spin
                                </span>
                                <input
                                    type="checkbox"
                                    checked={autoConfig.turbo}
                                    onChange={e => setAutoConfig({ ...autoConfig, turbo: e.target.checked })}
                                    className="w-5 h-5 accent-[#22c55e]"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-900 rounded-lg border border-gray-800">
                                <span className="text-sm font-bold text-gray-300">Stop on Bonus</span>
                                <input
                                    type="checkbox"
                                    checked={autoConfig.stopOnBonus}
                                    onChange={e => setAutoConfig({ ...autoConfig, stopOnBonus: e.target.checked })}
                                    className="w-5 h-5 accent-[#22c55e]"
                                />
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAutoModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={startAutoplay}
                                className="flex-1 py-3 rounded-xl font-bold bg-[#22c55e] text-white hover:bg-green-500 shadow-lg shadow-green-900/50 transition-all hover:scale-[1.02]"
                            >
                                Start
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* INFO MODAL - HACKSAW STYLE */}
            <Dialog.Root open={showInfoModal} onOpenChange={setShowInfoModal}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white p-0 rounded-xl w-[95vw] max-w-[600px] shadow-2xl border border-gray-800 z-[101] max-h-[85vh] overflow-hidden flex flex-col">

                        {/* Header */}
                        <div className="p-4 bg-[#111] border-b border-gray-800 flex justify-center relative shrink-0">
                            <h2 className="text-lg font-bold uppercase tracking-wide text-white">
                                GAME INFO - <span className="text-gray-400">{gameTitle}</span>
                            </h2>
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

                            {/* HOW TO PLAY */}
                            <section>
                                <h3 className="text-[#FFD700] font-bold text-sm uppercase mb-3">HOW TO PLAY</h3>
                                <div className="space-y-3 text-xs text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                                    {howToPlay}
                                </div>
                            </section>

                            {/* PAYTABLE */}
                            <section>
                                <h3 className="text-[#FFD700] font-bold text-sm uppercase mb-3">SCRATCH CARD VALUE SYMBOLS</h3>
                                <div className="border border-gray-700 rounded-sm overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-[#2a2a2a] text-gray-400 font-bold uppercase">
                                            <tr>
                                                <th className="p-3 border-b border-gray-700">PRIZES AVAILABLE*</th>
                                                <th className="p-3 border-b border-gray-700 text-right">AMOUNT</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800 text-gray-300">
                                            {paytableRows.map((row, i) => (
                                                <tr key={i} className={i % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#1f1f1f]"}>
                                                    <td className="p-2 pl-3">{row.symbol}</td>
                                                    <td className="p-2 pr-3 text-right">{row.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-3 text-[10px] text-gray-500 leading-tight">
                                    <p className="mb-1">*Based on a hypothetical series of 10,000,000 cards. Each bet has the same chance to win.</p>
                                    <p>The theoretical return to player for this game is <strong>53.77%</strong>.</p>
                                </div>
                            </section>

                            {/* RULES */}
                            <section>
                                <h3 className="text-[#FFD700] font-bold text-sm uppercase mb-3">RULES</h3>
                                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{rulesText}</p>
                            </section>

                            {/* GENERAL */}
                            <section>
                                <h3 className="text-[#FFD700] font-bold text-sm uppercase mb-3">GENERAL</h3>
                                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{generalText}</p>
                            </section>

                            {/* ADDITIONAL INFO */}
                            <section>
                                <h3 className="text-[#FFD700] font-bold text-sm uppercase mb-3">ADDITIONAL INFORMATION</h3>
                                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{additionalText}</p>
                            </section>

                            {/* INTERRUPTED GAME */}
                            <section>
                                <h3 className="text-[#FFD700] font-bold text-sm uppercase mb-3">INTERRUPTED GAME</h3>
                                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{interruptedText}</p>
                            </section>

                            {/* GAME HISTORY */}
                            <section>
                                <h3 className="text-[#FFD700] font-bold text-sm uppercase mb-3">GAME HISTORY</h3>
                                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{historyText}</p>
                            </section>

                            {/* TERMS */}
                            <section>
                                <h3 className="text-[#FFD700] font-bold text-sm uppercase mb-3">GENERAL TERMS AND CONDITIONS</h3>
                                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{termsText}</p>
                            </section>

                            {/* FOOTER */}
                            <div className="pt-6 border-t border-gray-800 text-[10px] text-gray-500 font-mono">
                                <p>Game generated 2026-01-31 19:57 UTC</p>
                                <p>Game version 1.0.7</p>
                                <p>Server version 2.0.261</p>
                                <p className="mt-2 text-white font-bold">www.slotai-engine.com</p>
                            </div>

                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

        </div>
    );
};
