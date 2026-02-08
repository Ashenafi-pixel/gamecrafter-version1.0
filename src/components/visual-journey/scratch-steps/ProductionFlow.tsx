import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import { motion, AnimatePresence } from 'framer-motion';

const Step5_Production: React.FC = () => {
    const { config, updateConfig, scratchProductionStep } = useGameStore();
    const activeTab = scratchProductionStep;

    // Default Hacksaw-style text
    const DEFAULT_HOW_TO_PLAY = "Match three gametype\n\nYou will win a prize if you reveal three identical symbols, the prize will be equal to the amount of one of those three identical symbols.\n\nPress the BUY-button to buy a new card. Either scratch manually or press the SCRATCH ALL button to reveal all symbols.\n\nPress the AUTO PLAY button to buy multiple cards that will be automatically scratched.";
    const DEFAULT_RULES = "Misuse or malfunction voids all pays and plays. Only highest winning symbol paid per card. Wins are shown in currency and are based on the size of the stake.";
    const DEFAULT_GENERAL = "BALANCE\nYour current balance is shown in the BALANCE display. Balance, bets and winnings are presented in the player’s chosen currency.\n\nBET\nThe current bet level is shown in the BET display. The allowed bet level for this game is €2.00.\n\nTURBO PLAY\nThe Turbo Play functionality is used to get the fastest game round possible (not available on all operators and jurisdictions). Turbo Play is activated from the menu.";
    const DEFAULT_ADDITIONAL = "In addition to the features described here, the bar on the bottom of the game screen displays the current balance in the chosen currency, the amount paid if a win occurs, and the amount bet on the last/current proposition.";
    const DEFAULT_INTERRUPTED = "If your internet connection fails during a game, you can typically resume the round by reloading the game immediately. If a round was already completed on the server but the visual reveal was interrupted, the result will be recorded in your Game History, though the animation may not replay.\n\nUnfinished Rounds: Any active bet on an incomplete round will identify as \"paused\" until you complete the action or the system auto-resolves it. If a game remains inactive for 24 hours (1 day), the system will typically void the round and refund the original wager to your balance.\n\nSystem Protection: We ensure fair play by logging all game states. Malfunctions in hardware or networks do not void stored results unless the game cannot be resolved, in which case bets are refunded. Winning outcomes that require no further player action will be automatically credited.";
    const DEFAULT_HISTORY = "The result of a completed game may be viewed in Game History immediately after closing the game window. Results of unfinished games are not displayed in Game History.";
    const DEFAULT_TERMS = "- Misuse or malfunction voids all pays and plays.\n- Any visual representation of a physical device (a reel, a wheel of fortune or similar) does not represent a “real” physical device and the probabilities of it stopping on any particular position is determined by the game’s random number generator, and not the number of positions on each device.";

    const DEFAULT_PAYTABLE_ROWS = [
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

    // Local state initialized from store or defaults
    const [howToPlay, setHowToPlay] = useState(config.gameRules?.howToPlayText || DEFAULT_HOW_TO_PLAY);
    const [rulesText, setRulesText] = useState(config.gameRules?.rulesText || DEFAULT_RULES);
    const [generalText, setGeneralText] = useState(config.gameRules?.generalText || DEFAULT_GENERAL);
    const [additionalText, setAdditionalText] = useState(config.gameRules?.additionalInfoText || DEFAULT_ADDITIONAL);
    const [interruptedText, setInterruptedText] = useState(config.gameRules?.interruptedGameText || DEFAULT_INTERRUPTED);
    const [historyText, setHistoryText] = useState(config.gameRules?.gameHistoryText || DEFAULT_HISTORY);
    const [termsText, setTermsText] = useState(config.gameRules?.termsText || DEFAULT_TERMS);

    // Paytable Rows State (managed as string for simple editing, could be parsed)
    const [paytableRaw, setPaytableRaw] = useState(() => {
        if (config.gameRules?.paytableRows) {
            return config.gameRules.paytableRows.map(r => `${r.symbol} | ${r.value}`).join('\n');
        }
        return DEFAULT_PAYTABLE_ROWS.map(r => `${r.symbol} | ${r.value}`).join('\n');
    });

    const [aiPrompt, setAiPrompt] = useState(config.marketing?.aiPrompt || "");
    const [thumbnailPreview, setThumbnailPreview] = useState(config.marketing?.thumbnailUrl || "");
    const [posterPreview, setPosterPreview] = useState(config.marketing?.posterUrl || "");

    // Persist Rules
    useEffect(() => {
        const timer = setTimeout(() => {
            // Parse paytable raw string back to objects
            const parsedRows = paytableRaw.split('\n').filter(line => line.trim()).map(line => {
                const [sym, val] = line.split('|').map(s => s.trim());
                return { symbol: sym || "Unknown", value: val || "0" };
            });

            updateConfig({
                gameRules: {
                    helpScreens: [],
                    paytableConfig: {},
                    ...(config.gameRules || {}),
                    howToPlayText: howToPlay,
                    rulesText: rulesText,
                    generalText: generalText,
                    additionalInfoText: additionalText,
                    interruptedGameText: interruptedText,
                    gameHistoryText: historyText,
                    termsText: termsText,
                    paytableRows: parsedRows,
                    // Legacy support
                    generalRulesText: howToPlay,
                    paytableText: paytableRaw
                }
            });
        }, 800);
        return () => clearTimeout(timer);
    }, [howToPlay, rulesText, generalText, additionalText, interruptedText, historyText, termsText, paytableRaw, config.gameRules, updateConfig]);

    // Persist Marketing
    useEffect(() => {
        const timer = setTimeout(() => {
            updateConfig({
                marketing: {
                    ...config.marketing,
                    aiPrompt: aiPrompt,
                    thumbnailUrl: thumbnailPreview,
                    posterUrl: posterPreview
                }
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [aiPrompt, thumbnailPreview, posterPreview, config.marketing, updateConfig]);


    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 0 && (
                                <div className="space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="border-b pb-4">
                                        <h3 className="font-bold text-xl text-gray-900">Game Rules Configuration</h3>
                                        <p className="text-gray-500 text-sm mt-1">Customize all text sections that appear in the Game Info modal.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                        {/* Left Column: Gameplay Info */}
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">How to Play</label>
                                                <textarea
                                                    className="w-full h-40 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none scrollbar-thin"
                                                    value={howToPlay}
                                                    onChange={(e) => setHowToPlay(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Prize Table Data</label>
                                                <p className="text-xs text-gray-400 mb-2">Format: Symbol Name | Amount (one per line)</p>
                                                <textarea
                                                    className="w-full h-48 p-3 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none scrollbar-thin"
                                                    value={paytableRaw}
                                                    onChange={(e) => setPaytableRaw(e.target.value)}
                                                    placeholder="3x Diamond | €10,000"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Rules Terminology</label>
                                                <textarea
                                                    className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    value={rulesText}
                                                    onChange={(e) => setRulesText(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Right Column: Legal & Tech Info */}
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">General Info (Balance/Bet)</label>
                                                <textarea
                                                    className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    value={generalText}
                                                    onChange={(e) => setGeneralText(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Additional Information</label>
                                                <textarea
                                                    className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    value={additionalText}
                                                    onChange={(e) => setAdditionalText(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Interrupted Game Policy</label>
                                                <textarea
                                                    className="w-full h-40 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none scrollbar-thin"
                                                    value={interruptedText}
                                                    onChange={(e) => setInterruptedText(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Game History & Terms</label>
                                                <div className="space-y-4">
                                                    <textarea
                                                        className="w-full h-20 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                        value={historyText}
                                                        onChange={(e) => setHistoryText(e.target.value)}
                                                        placeholder="Game History text..."
                                                    />
                                                    <textarea
                                                        className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                        value={termsText}
                                                        onChange={(e) => setTermsText(e.target.value)}
                                                        placeholder="General Terms..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 1 && (
                                <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">

                                    {/* ROW 1: PREVIEWS (Side by Side) */}
                                    <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
                                        {/* Landscape Preview */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Landscape (800x600)</label>
                                            </div>
                                            <div className="w-[400px] h-[300px] bg-gray-900 rounded-xl flex flex-col items-center justify-center text-gray-400 border border-gray-800 shadow-inner overflow-hidden relative group">
                                                {thumbnailPreview ? (
                                                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundImage: 'linear-gradient(45deg, #1f2937 25%, #111827 25%, #111827 50%, #1f2937 50%, #1f2937 75%, #111827 75%, #111827 100%)', backgroundSize: '20px 20px' }}>
                                                        <span className="font-bold text-white mb-2">800 x 600</span>
                                                        <span className="text-xs">No Image Selected</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Poster Preview */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Poster (300x400)</label>
                                            </div>
                                            <div className="w-[300px] h-[400px] bg-gray-900 rounded-xl flex flex-col items-center justify-center text-gray-400 border border-gray-800 shadow-inner overflow-hidden relative group">
                                                {posterPreview ? (
                                                    <img src={posterPreview} alt="Poster" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundImage: 'linear-gradient(45deg, #1f2937 25%, #111827 25%, #111827 50%, #1f2937 50%, #1f2937 75%, #111827 75%, #111827 100%)', backgroundSize: '20px 20px' }}>
                                                        <span className="font-bold text-white mb-2">300 x 400</span>
                                                        <span className="text-xs">No Image Selected</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 2: CENTRAL INPUT */}
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                                        <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                            <span>✨ AI Generator Prompt</span>
                                        </h4>
                                        <p className="text-xs text-indigo-700 mb-4">
                                            Describe the scene for BOTH formats. The first generated image will be used as a reference for the second to ensure consistency.
                                        </p>
                                        <textarea
                                            className="w-full h-24 p-4 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none bg-white/80"
                                            placeholder="A magical forest background with glowing runes and gold coins..."
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                        />
                                    </div>

                                    {/* ROW 3: ACTIONS (Grouped) */}
                                    <div className="flex flex-wrap gap-8 justify-between">

                                        {/* Landscape Actions */}
                                        <div className="flex-1 min-w-[300px] flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const btn = document.activeElement as HTMLElement;
                                                    if (btn) btn.blur();
                                                    if (!aiPrompt.trim()) return;

                                                    // Cross-Generation Logic
                                                    const referenceMsg = posterPreview ? "\n(Using Poster as Visual Reference)" : "";
                                                    alert(`Generating LANDSCAPE for: "${aiPrompt}"${referenceMsg}`);
                                                }}
                                                disabled={!aiPrompt.trim()}
                                                className={`flex-1 py-3 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all ${!aiPrompt.trim() ? 'opacity-50' : ''}`}
                                            >
                                                Generate Landscape
                                            </button>
                                            <label className="cursor-pointer">
                                                <div className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors text-center text-gray-700 shadow-sm">
                                                    Upload
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setThumbnailPreview(reader.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </label>
                                        </div>

                                        {/* Poster Actions */}
                                        <div className="flex-1 min-w-[300px] flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const btn = document.activeElement as HTMLElement;
                                                    if (btn) btn.blur();
                                                    if (!aiPrompt.trim()) return;

                                                    // Cross-Generation Logic
                                                    const referenceMsg = thumbnailPreview ? "\n(Using Landscape as Visual Reference)" : "";
                                                    alert(`Generating POSTER for: "${aiPrompt}"${referenceMsg}`);
                                                }}
                                                disabled={!aiPrompt.trim()}
                                                className={`flex-1 py-3 bg-purple-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-purple-700 transition-all ${!aiPrompt.trim() ? 'opacity-50' : ''}`}
                                            >
                                                Generate Poster
                                            </button>
                                            <label className="cursor-pointer">
                                                <div className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors text-center text-gray-700 shadow-sm">
                                                    Upload
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setPosterPreview(reader.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Step5_Production;
