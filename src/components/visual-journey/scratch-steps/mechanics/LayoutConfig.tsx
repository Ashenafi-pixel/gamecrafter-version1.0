import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { ScratchConfig, SymbolHuntRules } from '../../../../types';
import { Layout, Trophy, Target, Settings2 } from 'lucide-react';

const Step2_ScratchLayout: React.FC = () => {
    const { config, updateConfig } = useGameStore();

    // Validation Constants
    const MIN_ROWS = 2; const MAX_ROWS = 6;
    const MIN_COLS = 2; const MAX_COLS = 6;
    const MAX_TOTAL = 36; // Relaxed form 9 for Match-2

    // 1. Determine Mechanic Context
    const mechanicType = config.scratch?.mechanic?.type || 'match_3';
    const isSymbolHunt = mechanicType === 'find_symbol';

    // 2. Local State for UI (Immediate Feedback)
    // Grid
    const [rows, setRows] = useState(config.scratch?.layout?.rows || (isSymbolHunt ? 4 : 3));
    const [cols, setCols] = useState(config.scratch?.layout?.columns || (isSymbolHunt ? 4 : 3));

    // Symbol Hunt Rules (Initialize with defaults/store)
    const [ruleMode, setRuleMode] = useState<SymbolHuntRules['ruleMode']>(config.scratch?.rulesGrid?.ruleMode || 'COLLECT_X');
    const [requiredHits, setRequiredHits] = useState(config.scratch?.rulesGrid?.requiredHits || 3);
    const [revealStyle, setRevealStyle] = useState<SymbolHuntRules['revealStyle']>(config.scratch?.rulesGrid?.revealStyle || 'MANUAL');

    // 3. Validation & Sync Logic
    const totalCells = rows * cols;
    const currentTargetSymbol = config.scratch?.rulesGrid?.targetSymbolId || config.scratch?.mechanic?.winningSymbol || '/assets/symbols/defstar.png';

    // Effect: Initialize Rules for Symbol Hunt if missing
    useEffect(() => {
        if (isSymbolHunt && !config.scratch?.rulesGrid) {
            updateConfig({
                scratch: {
                    ...config.scratch,
                    rulesGrid: {
                        ruleMode: 'COLLECT_X',
                        targetSymbolId: '/assets/symbols/defstar.png', // Default Star
                        requiredHits: 3,
                        revealStyle: 'MANUAL',
                        grid: { rows: 4, cols: 4 }
                    },
                    layout: { ...config.scratch?.layout, rows: 4, columns: 4 } // Sync legacy layout
                } as ScratchConfig
            });
            setRows(4);
            setCols(4);
        }
    }, [isSymbolHunt]);

    // Effect: Validate & Persist Changes
    useEffect(() => {
        // Clamping Required Hits (Mode A)
        if (ruleMode === 'COLLECT_X') {
            if (requiredHits > totalCells) {
                setRequiredHits(totalCells); // Auto-clamp down
                // Ideally show toast
            }
            if (requiredHits < 1) setRequiredHits(1);
        }

        // Persist to Store
        const updatedConfig = { ...config.scratch };

        // Always update Legacy Layout (rendering depends on it)
        updatedConfig.layout = {
            ...updatedConfig.layout,
            rows,
            columns: cols,
            // @ts-ignore
            shape: updatedConfig.layout?.shape || 'rectangle'
        };

        // Update RulesGrid if Symbol Hunt
        if (isSymbolHunt) {
            updatedConfig.rulesGrid = {
                ruleMode,
                targetSymbolId: currentTargetSymbol, // Persist existing
                requiredHits,
                revealStyle,
                grid: { rows, cols }
            };
            // Also sync winningSymbol for consistency
            if (!updatedConfig.mechanic) updatedConfig.mechanic = { type: 'find_symbol' };
            updatedConfig.mechanic.winningSymbol = currentTargetSymbol;
        }

        updateConfig({ scratch: updatedConfig as ScratchConfig });

    }, [rows, cols, ruleMode, requiredHits, revealStyle, isSymbolHunt, currentTargetSymbol]);


    // Handlers
    const handleGridChange = (dim: 'rows' | 'cols', delta: number) => {
        if (dim === 'rows') {
            const next = Math.min(Math.max(rows + delta, MIN_ROWS), MAX_ROWS);
            if (next * cols <= MAX_TOTAL) setRows(next);
        } else {
            const next = Math.min(Math.max(cols + delta, MIN_COLS), MAX_COLS);
            if (rows * next <= MAX_TOTAL) setCols(next);
        }
    };


    const getMechanicLabel = (type: string) => {
        switch (type) {
            case 'match_3': return 'Match 3 (Classic)';
            case 'match_2': return 'Match 2 (Easy)';
            case 'match_4': return 'Match 4 (Hard)';
            case 'find_symbol': return 'Symbol Hunt';
            case 'golden_path': return 'Golden Path';
            case 'lucky_number': return 'Lucky Numbers';
            default: return 'Custom Game';
        }
    };

    return (
        <div className="flex flex-col gap-2 px-4 py-2 w-full max-w-5xl mx-auto">

            {/* Compact Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Settings2 className="text-gray-400" size={16} />
                    <h2 className="text-sm font-bold text-gray-700">
                        {isSymbolHunt ? 'Rules & Grid' : 'Grid Configuration'}
                    </h2>
                </div>
                <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
                    {getMechanicLabel(mechanicType)}
                </div>
            </motion.div>

            {/* Content Area - Compact Layout */}
            <div className="flex flex-col gap-2">

                {/* SECTION 1: Rules (Only for Symbol Hunt) */}
                {isSymbolHunt && (
                    <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Trophy size={14} className="fill-blue-50" />
                                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Win Mode</h3>
                            </div>

                            {/* Required Hits Controller (Inline) */}
                            {ruleMode === 'COLLECT_X' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Targets:</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setRequiredHits(Math.max(1, requiredHits - 1))}
                                            className="w-5 h-5 flex items-center justify-center rounded bg-gray-50 border hover:border-blue-300 text-gray-600 font-bold text-xs"
                                        >
                                            -
                                        </button>
                                        <span className="w-4 text-center text-sm font-bold text-gray-800">{requiredHits}</span>
                                        <button
                                            onClick={() => setRequiredHits(Math.min(totalCells, requiredHits + 1))}
                                            className="w-5 h-5 flex items-center justify-center rounded bg-gray-50 border hover:border-blue-300 text-gray-600 font-bold text-xs"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setRuleMode('COLLECT_X')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all text-xs ${ruleMode === 'COLLECT_X'
                                    ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Target size={12} /> Collect Target
                            </button>

                            <button
                                onClick={() => setRuleMode('TIERED_COUNT')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all text-xs ${ruleMode === 'TIERED_COUNT'
                                    ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Trophy size={12} /> Tiered Payout
                            </button>
                        </div>
                    </div>
                )}

                {/* SECTION 2: Grid Layout */}
                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <Layout size={14} className="fill-purple-50" />
                        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Grid Dimensions ({rows}×{cols})</h3>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        {/* Rows Control */}
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Rows</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleGridChange('rows', -1)}
                                    disabled={rows <= MIN_ROWS}
                                    className="w-5 h-5 flex items-center justify-center rounded bg-white shadow-sm border border-gray-200 hover:border-purple-300 text-gray-600 text-xs font-bold disabled:opacity-30"
                                >
                                    -
                                </button>
                                <span className="w-5 text-center text-sm font-bold text-gray-800">{rows}</span>
                                <button
                                    onClick={() => handleGridChange('rows', 1)}
                                    disabled={rows >= MAX_ROWS}
                                    className="w-5 h-5 flex items-center justify-center rounded bg-white shadow-sm border border-gray-200 hover:border-purple-300 text-gray-600 text-xs font-bold disabled:opacity-30"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* X */}
                        <span className="text-gray-300 text-xs">×</span>

                        {/* Cols Control */}
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Cols</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleGridChange('cols', -1)}
                                    disabled={cols <= MIN_COLS}
                                    className="w-5 h-5 flex items-center justify-center rounded bg-white shadow-sm border border-gray-200 hover:border-purple-300 text-gray-600 text-xs font-bold disabled:opacity-30"
                                >
                                    -
                                </button>
                                <span className="w-5 text-center text-sm font-bold text-gray-800">{cols}</span>
                                <button
                                    onClick={() => handleGridChange('cols', 1)}
                                    disabled={cols >= MAX_COLS}
                                    className="w-5 h-5 flex items-center justify-center rounded bg-white shadow-sm border border-gray-200 hover:border-purple-300 text-gray-600 text-xs font-bold disabled:opacity-30"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Info / Toggles */}
                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="bg-white border px-1.5 rounded">Total Cells: <strong>{totalCells}</strong></span>
                        <span className="italic">Preview updates instantly</span>
                    </div>

                    {isSymbolHunt && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Auto-Reveal</span>
                            <button
                                onClick={() => setRevealStyle(prev => prev === 'MANUAL' ? 'AUTO' : 'MANUAL')}
                                className={`w-8 h-4 rounded-full relative transition-colors ${revealStyle === 'AUTO' ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${revealStyle === 'AUTO' ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Step2_ScratchLayout;
