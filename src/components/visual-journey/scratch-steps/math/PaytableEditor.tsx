import React, { useEffect } from 'react';
import { useGameStore } from '../../../../store';
import { ScratchConfig, ScratchPrizeTier } from '../../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, TrendingUp, ShieldCheck, Zap, Coins, Target } from 'lucide-react';
import { calculateRTP } from '../../../../utils/math-engine/ScratchMathEngine';

// Industry Standard Presets (Mathematically Balanced for ~96% RTP)
export const PRIZE_PRESETS = {
    CASUAL: {
        name: "Casual / Low Volatility",
        description: "Frequent small wins (~39% hit rate). Best for retention.",
        prizes: [
            { id: 'p_c1', name: 'Jackpot', condition: { type: 'match_n', count: 3, symbolId: 'sym_diamond' }, payout: 100, weight: 10, probability: 0.001 },
            { id: 'p_c2', name: 'Big Win', condition: { type: 'match_n', count: 3, symbolId: 'sym_gold' }, payout: 20, weight: 1000, probability: 0.1 },
            { id: 'p_c3', name: 'Medium Win', condition: { type: 'match_n', count: 3, symbolId: 'sym_silver' }, payout: 5, weight: 15000, probability: 1.5 },
            { id: 'p_c4', name: 'Small Win', condition: { type: 'match_n', count: 3, symbolId: 'sym_bronze' }, payout: 2, weight: 75000, probability: 7.5 },
            { id: 'p_c5', name: 'Money Back', condition: { type: 'match_n', count: 3, symbolId: 'sym_cherry' }, payout: 1, weight: 400000, probability: 40.0 },
        ]
    },
    BALANCED: {
        name: "Standard / Balanced",
        description: "A classic mix. ~34% hit rate with decent prizes.",
        prizes: [
            { id: 'p_b1', name: 'Grand Prize', condition: { type: 'match_n', count: 3, symbolId: 'sym_diamond' }, payout: 2500, weight: 5, probability: 0.0005 },
            { id: 'p_b2', name: 'Major', condition: { type: 'match_n', count: 3, symbolId: 'sym_ruby' }, payout: 500, weight: 50, probability: 0.005 },
            { id: 'p_b3', name: 'Minor', condition: { type: 'match_n', count: 3, symbolId: 'sym_coin' }, payout: 100, weight: 1000, probability: 0.1 },
            { id: 'p_b4', name: 'Mini', condition: { type: 'match_n', count: 3, symbolId: 'sym_bill' }, payout: 10, weight: 53000, probability: 5.3 },
            { id: 'p_b5', name: 'Free Play', condition: { type: 'match_n', count: 3, symbolId: 'sym_cherries' }, payout: 1, weight: 290000, probability: 29.0 },
        ]
    },
    HIGH_ROLLER: {
        name: "High Roller / Volatile",
        description: "Massive wins, lower hit rate (~27%). Chasing the dream.",
        prizes: [
            { id: 'p_h1', name: 'MEGA JACKPOT', condition: { type: 'match_n', count: 3, symbolId: 'sym_crown' }, payout: 50000, weight: 1, probability: 0.0001 },
            { id: 'p_h2', name: 'Super Win', condition: { type: 'match_n', count: 3, symbolId: 'sym_bar_gold' }, payout: 1000, weight: 100, probability: 0.01 },
            { id: 'p_h3', name: 'Big Win', condition: { type: 'match_n', count: 3, symbolId: 'sym_seven' }, payout: 200, weight: 2000, probability: 0.2 },
            { id: 'p_h4', name: 'Nice Win', condition: { type: 'match_n', count: 3, symbolId: 'sym_bell' }, payout: 20, weight: 10000, probability: 1.0 },
            { id: 'p_h5', name: 'Console', condition: { type: 'match_n', count: 3, symbolId: 'sym_plum' }, payout: 1, weight: 210000, probability: 21.0 },
        ]
    }
};

const Step3_Tab_Paytable: React.FC = () => {
    const { config, updateConfig } = useGameStore();

    const mathMode = config.scratch?.math?.mathMode || 'POOL';

    const updateScratchPrizes = (newPrizes: ScratchPrizeTier[]) => {
        updateConfig({
            scratch: {
                ...config.scratch,
                prizes: newPrizes
            } as ScratchConfig
        });
    };

    // Commercial Viability Constants
    const COMMERCIAL_CONSTRAINTS = {
        MAX_RTP: 0.85, // 85%
        MIN_LOSER_RATE: 0.40, // 40%
        MAX_MONEY_BACK_RATE: 0.15, // 15%
    };

    const prizes = config.scratch?.prizes || []; // Define prizes here for use in validation

    const validateCommercialViability = () => {
        if (mathMode !== 'POOL') return { isValid: true, errors: [], warnings: [] };

        const deckSize = config.scratch?.math?.totalTickets || 1000000;
        const ticketPrice = config.scratch?.math?.ticketPrice || 10;
        const totalPayout = prizes.reduce((sum, p) => sum + (p.weight * p.payout * ticketPrice), 0);
        const totalSales = deckSize * ticketPrice;

        const currentRTP = calculateRTP(
            prizes.map(p => ({ ...p, value: p.payout, isWin: p.payout > 0, probability: p.probability || 0 })),
            deckSize,
            ticketPrice
        );

        // Calculate Losers
        const totalWinners = prizes.reduce((sum, p) => sum + p.weight, 0);
        const losers = Math.max(0, deckSize - totalWinners);
        const loserRate = deckSize > 0 ? losers / deckSize : 0;

        // Calculate Money Back (Payout == 1x)
        const moneyBackCount = prizes.filter(p => p.payout === 1).reduce((sum, p) => sum + p.weight, 0);
        const moneyBackRate = deckSize > 0 ? moneyBackCount / deckSize : 0;

        const errors: string[] = [];
        const warnings: { title: string; message: string; details?: string }[] = [];

        // 3.1 RTP Cap (Hard Block)
        if (currentRTP > COMMERCIAL_CONSTRAINTS.MAX_RTP) {
            errors.push(`RTP (${(currentRTP * 100).toFixed(1)}%) exceeds allowed maximum of ${(COMMERCIAL_CONSTRAINTS.MAX_RTP * 100)}%`);
        }

        // 3.2 Min Loser Rate (Hard Block)
        if (loserRate < COMMERCIAL_CONSTRAINTS.MIN_LOSER_RATE) {
            errors.push(`Too few losing tickets (${(loserRate * 100).toFixed(1)}%). Min required: ${(COMMERCIAL_CONSTRAINTS.MIN_LOSER_RATE * 100)}%`);
        }

        // 3.3 Money-Back Cap (Soft Warning / Risk)
        if (moneyBackRate > COMMERCIAL_CONSTRAINTS.MAX_MONEY_BACK_RATE) {
            warnings.push({
                title: "Money-Back Frequency Risk",
                message: "Money-back tickets refund the full stake and significantly impact player behavior and cash-flow timing.",
                details: `Current rate: ${(moneyBackRate * 100).toFixed(1)}% (Rec. Max: ${(COMMERCIAL_CONSTRAINTS.MAX_MONEY_BACK_RATE * 100)}%). This is profitable but increases early payout risk.`
            });
        }

        // 3.4 Profit Guarantee (Hard Block)
        if (totalPayout > totalSales) {
            errors.push("Guaranteed Loss: Total Payouts exceed Total Sales.");
        }

        // Impossible Config Check (Legacy - Hard Block)
        if (totalWinners > deckSize) {
            errors.push("Configuration Impossible: More winners than tickets!");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    };

    const validation = validateCommercialViability();

    const applyPreset = (presetName: string) => {
        const preset = PRIZE_PRESETS[presetName as keyof typeof PRIZE_PRESETS];
        const currentDeckSize = config.scratch?.math?.totalTickets || 1000000;
        const baseDeckSize = 1000000; // Presets are designed for 1M
        const scaleRatio = currentDeckSize / baseDeckSize;

        const newPrizes = preset.prizes.map(p => ({
            ...p,
            id: `prize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            weight: Math.round(p.weight * scaleRatio),
            probability: p.probability ?? 1.0
        })) as ScratchPrizeTier[];

        // Update prizes
        updateScratchPrizes(newPrizes);
    };

    // RTP Silder Handler
    const handleRtpSliderChange = (targetRtpPercent: number) => {
        // Target RTP (e.g. 70)
        // Current RTP?

        const deckSize = config.scratch?.math?.totalTickets || 1000000;
        // Current RTP = (Sum(weight * payout)) / deckSize
        const currentRtpFactor = prizes.reduce((sum, p) => sum + (p.weight * p.payout), 0) / deckSize;

        const targetRtpFactor = targetRtpPercent / 100;

        if (currentRtpFactor === 0) return;

        const ratio = targetRtpFactor / currentRtpFactor;

        // Scale weights to achieve target
        const scaledPrizes = prizes.map(p => ({
            ...p,
            weight: Math.max(1, Math.round(p.weight * ratio)) // Ensure at least 1? Or allow 0?
        }));

        updateScratchPrizes(scaledPrizes);
    };

    // Auto-load Balanced profile if empty
    useEffect(() => {
        if (!config.scratch?.prizes || config.scratch.prizes.length === 0) {
            applyPreset('BALANCED');
        }
    }, [config.scratch?.prizes]);

    const handleModeChange = (mode: 'POOL' | 'UNLIMITED') => {
        updateConfig({
            scratch: {
                ...config.scratch,
                math: { ...config.scratch?.math, mathMode: mode }
            } as ScratchConfig
        });
    };

    const handleAddPrize = () => {
        const currentPrizes = config.scratch?.prizes || [];
        // Default condition derived from Mechanic Type
        const mechanicType = config.scratch?.mechanic?.type || 'match_3';

        // Smart Defaults
        let defaultCondition: any = { type: 'match_n', count: 3, symbolId: '' };

        if (mechanicType === 'find_symbol') {
            defaultCondition = { type: 'find_target', targetSource: 'fixed', symbolId: config.scratch?.mechanic?.winningSymbol || 'gem_1' };
        } else if (mechanicType === 'lucky_number') {
            defaultCondition = { type: 'find_target', targetSource: 'dynamic', symbolId: '' };
        } else if (mechanicType === 'instant_win') {
            defaultCondition = { type: 'match_n', count: 1, symbolId: 'win_auto' };
        }

        const newPrize: ScratchPrizeTier = {
            id: `prize_${Date.now()}`,
            name: mechanicType === 'find_symbol' ? 'Found Target' : 'New Prize',
            condition: defaultCondition,
            payout: 10,
            weight: 1000,
            probability: 1.0
        };

        updateScratchPrizes([...currentPrizes, newPrize]);
    };

    const handleUpdatePrize = (id: string, field: string, value: any) => {
        const currentPrizes = config.scratch?.prizes || [];
        const updated = currentPrizes.map(p => {
            if (p.id !== id) return p;

            // Handle nested condition updates
            if (field.startsWith('condition.')) {
                const key = field.split('.')[1];
                return {
                    ...p,
                    condition: { ...p.condition, [key]: value }
                };
            }

            return { ...p, [field]: value };
        });
        updateScratchPrizes(updated);
    };

    const handleRemovePrize = (id: string) => {
        const currentPrizes = config.scratch?.prizes || [];
        const updated = currentPrizes.filter(p => p.id !== id);
        updateScratchPrizes(updated);
    };

    // prizes is already defined above for validation
    const deckSize = config.scratch?.math?.totalTickets || 1000000;

    // Derived RTP for Slider Display
    const currentRtpDisplay = (prizes.reduce((sum, p) => sum + (p.weight * p.payout), 0) / deckSize) * 100;

    const handleDeckSizeChange = (newSize: number) => {
        const oldSize = config.scratch?.math?.totalTickets || 1000000;

        // Avoid division by zero
        if (oldSize === 0) {
            updateConfig({
                scratch: {
                    ...config.scratch,
                    math: { ...config.scratch?.math, totalTickets: newSize }
                } as ScratchConfig
            });
            return;
        }

        const ratio = newSize / oldSize;

        // Scale all existing prizes
        const scaledPrizes = (config.scratch?.prizes || []).map(p => {
            // For winning tiers (payout > 0), enforce at least 1 ticket
            // effectively 'Math.ceil' logic or explicit check
            // For losing tiers (payout 0), we don't care about minimum 1
            if (p.payout > 0) {
                const newWeight = Math.round(p.weight * ratio);
                return {
                    ...p,
                    weight: Math.max(1, newWeight)
                };
            }
            return {
                ...p,
                weight: Math.round(p.weight * ratio)
            };
        });

        updateConfig({
            scratch: {
                ...config.scratch,
                prizes: scaledPrizes,
                math: { ...config.scratch?.math, totalTickets: newSize }
            } as ScratchConfig
        });
    };

    return (
        <div className="flex flex-col gap-6 h-full min-h-0">
            {/* 1. Hard Errors Banner (Red) - Blocking & Urgent */}
            {!validation.isValid && mathMode === 'POOL' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm shrink-0 flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-1 bg-red-100 rounded-full text-red-600 mt-0.5">
                            <ShieldCheck size={16} />
                        </div>
                        <div>
                            <h3 className="text-red-800 font-bold text-sm uppercase tracking-wide">Commercially Invalid Configuration</h3>
                            <p className="text-red-600 text-xs mt-1">This scratchcard would result in a guaranteed loss or high risk for the operator.</p>
                            <ul className="mt-2 space-y-1">
                                {validation.errors.map((err, i) => (
                                    <li key={i} className="text-red-700 text-xs font-semibold flex items-center gap-2">
                                        • {err}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Simplified Auto-Fix for Critical Errors Only (RTP/Profit) */}
                    <button
                        onClick={() => {
                            let newPrizes = [...prizes];
                            const deckSize = config.scratch?.math?.totalTickets || 1000000;
                            const ticketPrice = config.scratch?.math?.ticketPrice || 10;

                            // Only fix RTP here
                            const currentRTP = calculateRTP(
                                newPrizes.map(p => ({ ...p, value: p.payout, isWin: p.payout > 0, probability: p.probability || 0 })),
                                deckSize,
                                ticketPrice
                            );

                            if (currentRTP > COMMERCIAL_CONSTRAINTS.MAX_RTP) {
                                const rtpRatio = COMMERCIAL_CONSTRAINTS.MAX_RTP / currentRTP;
                                newPrizes = newPrizes.map(p => ({
                                    ...p,
                                    weight: Math.floor(p.weight * rtpRatio)
                                }));
                                updateScratchPrizes(newPrizes);
                            }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                        <Zap size={14} fill="currentColor" />
                        Fix Critical Issues
                    </button>
                </div>
            )}

            {/* 2. Commercial Risk Warnings (Yellow) - Informational / Best Practice */}
            {validation.warnings.length > 0 && mathMode === 'POOL' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm shrink-0">
                    <div className="flex items-start gap-3">
                        <div className="p-1 bg-yellow-100 rounded-full text-yellow-700 mt-0.5">
                            <TrendingUp size={16} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-yellow-800 font-bold text-sm uppercase tracking-wide">⚠️ Commercial Risk Warning</h3>
                            {validation.warnings.map((warn, i) => (
                                <div key={i} className="mt-1">
                                    <p className="text-yellow-800 text-xs font-bold">{warn.message}</p>
                                    <p className="text-yellow-700 text-xs mt-0.5">{warn.details}</p>
                                </div>
                            ))}
                            <p className="text-[10px] text-yellow-600/80 mt-2 uppercase font-bold tracking-wider">
                                Money-back limits are based on commercial best practices, not mathematical constraints.
                            </p>
                        </div>
                    </div>

                    {/* Autofix Button for Money-Back Warning */}
                    <div className="shrink-0">
                        <button
                            onClick={() => {
                                const deckSize = config.scratch?.math?.totalTickets || 1000000;
                                const maxMoneyBackCount = Math.floor(deckSize * 0.15); // 15% limit

                                let newPrizes = [...prizes];
                                const moneyBackTiers = newPrizes.filter(p => p.payout === 1);
                                const currentMoneyBackCount = moneyBackTiers.reduce((sum, p) => sum + p.weight, 0);

                                if (currentMoneyBackCount > maxMoneyBackCount) {
                                    const reductionRatio = maxMoneyBackCount / currentMoneyBackCount;
                                    newPrizes = newPrizes.map(p => {
                                        if (p.payout === 1) {
                                            return { ...p, weight: Math.floor(p.weight * reductionRatio) };
                                        }
                                        return p;
                                    });
                                    updateScratchPrizes(newPrizes);
                                }
                            }}
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors whitespace-nowrap flex items-center gap-2"
                            title="Reduce Money-Back tickets to 15%"
                        >
                            <Zap size={12} fill="currentColor" />
                            Auto-Fix
                        </button>
                    </div>
                </div>
            )}

            {/* Presets Row - Compact */}
            <div className="grid grid-cols-4 gap-3 shrink-0">
                <button
                    onClick={() => applyPreset('CASUAL')}
                    className="bg-white p-2.5 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all text-left flex items-center gap-3 group"
                >
                    <div className="p-1.5 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors shrink-0">
                        <ShieldCheck size={16} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 text-xs truncate">Casual</h3>
                        <p className="text-[10px] text-gray-500 truncate leading-tight">Frequent wins</p>
                    </div>
                </button>

                <button
                    onClick={() => applyPreset('BALANCED')}
                    className="bg-white p-2.5 rounded-xl border border-blue-200 ring-1 ring-blue-50 hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center gap-3 group"
                >
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors shrink-0">
                        <RefreshCw size={16} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 text-xs truncate">Balanced</h3>
                        <p className="text-[10px] text-gray-500 truncate leading-tight">Standard risk</p>
                    </div>
                </button>

                <button
                    onClick={() => applyPreset('HIGH_ROLLER')}
                    className="bg-white p-2.5 rounded-xl border border-gray-200 hover:border-red-400 hover:shadow-md transition-all text-left flex items-center gap-3 group"
                >
                    <div className="p-1.5 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors shrink-0">
                        <Zap size={16} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 text-xs truncate">High Roller</h3>
                        <p className="text-[10px] text-gray-500 truncate leading-tight">High risk</p>
                    </div>
                </button>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-left flex items-center gap-3 opacity-60 cursor-default">
                    <div className="p-1.5 bg-gray-100 text-gray-400 rounded-lg shrink-0">
                        <TrendingUp size={16} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-600 text-xs truncate">Custom</h3>
                        <p className="text-[10px] text-gray-400 truncate leading-tight">Edit below</p>
                    </div>
                </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                <button
                    onClick={() => handleModeChange('POOL')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${mathMode === 'POOL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Finite Pool (Deck)
                </button>
                <button
                    onClick={() => handleModeChange('UNLIMITED')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${mathMode === 'UNLIMITED' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Unlimited (Probability)
                </button>
            </div>

            {/* Win Logic Switcher (Single vs Multi) */}
            <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                <button
                    onClick={() => updateConfig({ scratch: { ...config.scratch, math: { ...config.scratch?.math, winLogic: 'SINGLE_WIN' } } as ScratchConfig })}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${(!config.scratch?.math?.winLogic || config.scratch?.math?.winLogic === 'SINGLE_WIN') ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Single Win (Classic)
                </button>
                <button
                    onClick={() => updateConfig({ scratch: { ...config.scratch, math: { ...config.scratch?.math, winLogic: 'MULTI_WIN' } } as ScratchConfig })}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${config.scratch?.math?.winLogic === 'MULTI_WIN' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Multi Win (Advanced)
                </button>
            </div>

            {/* Pool Configuration (Only in POOL Mode) */}
            {
                mathMode === 'POOL' && (
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex flex-col gap-3 shadow-sm">
                        {/* Top Row: Remaining Losers & RTP Slider */}
                        <div className="flex items-center justify-between gap-4">
                            {/* RTP Slider (Smart Balancer) */}
                            <div className="bg-blue-100/50 rounded-lg p-2 flex items-center gap-4 border border-blue-200 flex-1">
                                <div className="shrink-0 flex items-center gap-2">
                                    <div className="p-1 bg-blue-200 rounded text-blue-700">
                                        <TrendingUp size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-blue-800">Smart Adjust RTP</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="95"
                                    value={currentRtpDisplay}
                                    onChange={(e) => handleRtpSliderChange(Number(e.target.value))}
                                    className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="text-sm font-bold text-blue-900 w-12 text-right">{currentRtpDisplay.toFixed(0)}%</span>
                            </div>

                            <div className="text-right shrink-0">
                                <div className="text-[9px] uppercase font-bold text-blue-400 mb-0.5">Remaining Losers</div>
                                <div className={`text-xl font-black ${(config.scratch?.math?.totalTickets || 1000000) - prizes.reduce((sum, p) => sum + p.weight, 0) < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                    {((config.scratch?.math?.totalTickets || 1000000) - prizes.reduce((sum, p) => sum + p.weight, 0)).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Prize List - Scrollable */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-3">
                        <span>Active Prize Tiers</span>
                        <span className="bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{prizes.length}</span>
                    </div>

                    {/* Moved Config Inputs */}
                    {mathMode === 'POOL' && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-[9px] uppercase font-bold text-gray-400">Total Tickets:</label>
                                <select
                                    value={config.scratch?.math?.totalTickets || 1000000}
                                    onChange={(e) => handleDeckSizeChange(Number(e.target.value))}
                                    className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded block p-1 py-0.5 cursor-pointer focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value={100000}>100k</option>
                                    <option value={500000}>500k</option>
                                    <option value={1000000}>1M</option>
                                    <option value={2000000}>2M</option>
                                    <option value={5000000}>5M</option>
                                    <option value={10000000}>10M</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[9px] uppercase font-bold text-gray-400">Price:</label>
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-0.5">
                                    <span className="text-gray-400 font-bold text-[10px]">€</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-12 bg-transparent font-bold text-gray-700 text-xs focus:outline-none"
                                        value={config.scratch?.math?.ticketPrice || 10}
                                        onChange={(e) => updateConfig({ scratch: { ...config.scratch, math: { ...config.scratch?.math, ticketPrice: parseFloat(e.target.value) || 0 } } as ScratchConfig })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    <AnimatePresence>
                        {prizes.map((prize, index) => (
                            <motion.div
                                key={prize.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-4 group"
                            >
                                {/* Grip / Index */}
                                <div className="text-gray-300 font-mono text-xs w-6 text-center shrink-0 select-none font-bold">
                                    {index + 1}
                                </div>

                                {/* Name Input */}
                                <div className="flex-1 min-w-0">
                                    <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5 block">Prize Name</label>
                                    <input
                                        value={prize.name}
                                        onChange={e => handleUpdatePrize(prize.id, 'name', e.target.value)}
                                        className="w-full text-sm font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors px-0 py-0.5"
                                        placeholder="e.g. Big Win"
                                    />
                                </div>

                                {/* Condition Logic (Match N or Find Target) */}
                                <div className="w-24 shrink-0">
                                    <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5 block">
                                        {prize.condition?.type === 'match_n' ? 'Match Count' :
                                            prize.condition?.type === 'find_target' ? 'Win Trigger' : 'Condition'}
                                    </label>
                                    <div className="flex flex-col gap-1 w-full">
                                        {/* Match N Input */}
                                        {prize.condition.type === 'match_n' && (
                                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-gray-50 border border-gray-200">
                                                <Target size={12} className="text-gray-400" />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="9"
                                                    value={prize.condition.count}
                                                    onChange={e => handleUpdatePrize(prize.id, 'condition.count', parseInt(e.target.value) || 0)}
                                                    className="w-full bg-transparent text-sm font-semibold text-center focus:outline-none"
                                                />
                                            </div>
                                        )}

                                        {/* Find Target Configuration */}
                                        {prize.condition.type === 'find_target' && (
                                            <div className="flex flex-col gap-1 w-[120px] -ml-6 relative z-10 bg-white shadow-sm rounded border border-gray-100 p-1">
                                                {/* Source Selector */}
                                                <select
                                                    value={prize.condition.targetSource}
                                                    onChange={e => handleUpdatePrize(prize.id, 'condition.targetSource', e.target.value)}
                                                    className="text-[10px] w-full border border-gray-200 rounded p-0.5 bg-gray-50"
                                                >
                                                    <option value="fixed">Specific Symbol</option>
                                                    <option value="dynamic">Winning Numbers</option>
                                                </select>

                                                {/* Symbol ID Input (Only if Fixed) */}
                                                {prize.condition.targetSource === 'fixed' && (
                                                    <input
                                                        type="text"
                                                        value={prize.condition.symbolId || ''}
                                                        onChange={e => handleUpdatePrize(prize.id, 'condition.symbolId', e.target.value)}
                                                        placeholder="Symbol ID (e.g. sym_gold)"
                                                        className="text-[10px] w-full border border-gray-200 rounded p-0.5"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payout */}
                                <div className="w-28 shrink-0">
                                    <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5 block">Payout (Multiplier)</label>
                                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                                        <Coins size={12} className="text-green-600" />
                                        <span className="text-xs font-bold text-green-600">x</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={prize.payout}
                                            onChange={e => handleUpdatePrize(prize.id, 'payout', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-transparent text-sm font-bold text-right focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Weight / Probability Input */}
                                <div className="w-24 shrink-0">
                                    <label className="text-[9px] uppercase font-bold text-gray-400 mb-0.5 block">
                                        {mathMode === 'POOL' ? 'Nr. of Tickets' : 'Probability %'}
                                    </label>
                                    <div className={`flex items-center gap-2 text-gray-700 bg-gray-50 px-2 py-1 rounded border ${mathMode === 'POOL' ? 'border-gray-200' : 'border-purple-200 bg-purple-50'}`}>
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            {mathMode === 'POOL' ? '#' : '%'}
                                        </span>
                                        {mathMode === 'POOL' ? (
                                            <input
                                                type="number"
                                                min="0"
                                                value={prize.weight}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    // Optional: Clamp to remaining OR just Clamp to Deck Size
                                                    // User might want to over-provision momentarily while editing others,
                                                    // but definitely shouldn't exceed Total Deck Size itself.
                                                    const deckSize = config.scratch?.math?.totalTickets || 1000000;
                                                    const clamped = Math.min(val, deckSize);
                                                    handleUpdatePrize(prize.id, 'weight', clamped);
                                                }}
                                                className={`w-full bg-transparent text-sm font-medium text-center focus:outline-none ${prize.weight > (config.scratch?.math?.totalTickets || 1000000) ? 'text-red-600 font-bold' : ''}`}
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={prize.probability || 0}
                                                onChange={e => handleUpdatePrize(prize.id, 'probability', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent text-sm font-medium text-center focus:outline-none text-purple-700 font-bold"
                                            />
                                        )}
                                    </div>
                                </div>



                                {/* Delete Action */}
                                <button
                                    onClick={() => handleRemovePrize(prize.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                    title="Remove Tier"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button
                        onClick={handleAddPrize}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all font-bold flex items-center justify-center gap-2 text-sm mt-2"
                    >
                        <Plus size={16} />
                        Add New Prize Tier
                    </button>

                    <button
                        onClick={() => {
                            if (window.confirm("Reset Paytable to Mechanic Defaults? This will clear current tiers.")) {
                                const mechanicType = config.scratch?.mechanic?.type || 'match_3';

                                import('../../../../utils/validation/scratch-validator').then(({ getScratchDefaults }) => {
                                    const defaults = getScratchDefaults(mechanicType);
                                    if (defaults.prizes) {
                                        updateScratchPrizes(defaults.prizes);
                                    } else {
                                        // Fallback if defaults have no prizes defined yet
                                        applyPreset('BALANCED');
                                    }
                                });
                            }
                        }}
                        className="w-full py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1 mt-1"
                    >
                        <Trash2 size={12} />
                        Reset to {config.scratch?.mechanic?.type?.toUpperCase().replace('_', ' ') || 'DEFAULTS'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default Step3_Tab_Paytable;
