import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../../store';
import { motion } from 'framer-motion';
import { Play, RotateCcw, BarChart2, Coins, History } from 'lucide-react';

const Step3_Tab_Simulation: React.FC = () => {
    const { config } = useGameStore();
    const prizes = config.scratch?.prizes || [];

    const [spinsToRun, setSpinsToRun] = useState(1000);
    const [simBetAmount, setSimBetAmount] = useState(config.scratch?.math?.ticketPrice || 10);
    const [enforceRtpCap, setEnforceRtpCap] = useState(false);

    // Default to Finite Deck if Math Mode is POOL (or default)
    const isFiniteMode = (config.scratch?.math?.mathMode || 'POOL') === 'POOL';
    const [useFiniteDeck, setUseFiniteDeck] = useState(isFiniteMode);

    // Simulation State
    const [simState, setSimState] = useState({
        totalSpins: 0,
        totalBet: 0,
        totalWon: 0,
        gamesPlayed: 0,
        isRunning: false
    });

    const [winHistory, setWinHistory] = useState<number[]>([]);
    const [auditLog, setAuditLog] = useState<{ ticketIndex: number; prizeName: string; win: number }[]>([]);

    // Mutable Deck State for Finite Simulation
    const [deckState, setDeckState] = useState<{
        remainingTickets: number;
        remainingPrizes: Record<string, number>; // prizeId -> count
        isInitialized: boolean;
    }>({
        remainingTickets: 0,
        remainingPrizes: {},
        isInitialized: false
    });

    // Refs for animation and loop control
    const animationFrameRef = useRef<number>();
    const simRef = useRef({
        isRunning: false,
        spinsLeft: 0,
        currentBet: 0
    });

    // Reset Simulation
    // Sync spinsToRun with deck size when Finite Deck is enabled
    useEffect(() => {
        if (useFiniteDeck && config.scratch?.math?.totalTickets) {
            const deckSize = config.scratch.math.totalTickets;
            // Always sync rounds to deck size in Finite Mode
            setSpinsToRun(deckSize);
        }
    }, [useFiniteDeck, config.scratch?.math?.totalTickets]);

    const resetSim = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        simRef.current.isRunning = false;

        setSimState({
            totalSpins: 0,
            totalBet: 0,
            totalWon: 0,
            gamesPlayed: 0,
            isRunning: false
        });
        setWinHistory([]);
        setAuditLog([]); // Clear timeline

        // Reset finite deck if enabled
        if (useFiniteDeck) {
            const initialDeckSize = config.scratch?.math?.totalTickets || 1000000;
            const initialPrizes: Record<string, number> = {};
            prizes.forEach(p => initialPrizes[p.id] = p.weight);

            setDeckState({
                remainingTickets: initialDeckSize,
                remainingPrizes: initialPrizes,
                isInitialized: true
            });
        } else {
            setDeckState(prev => ({ ...prev, isInitialized: false }));
        }
    };

    const runSimulation = () => {
        if (prizes.length === 0) return;

        // Auto-initialize deck if needed
        if (useFiniteDeck && !deckState.isInitialized) {
            resetSim();
            // Small delay to allow state update before running? 
            // Actually better to just proceed with local variables or let user click Run again.
            // For now, we assume user clicked Reset or toggled mode which triggered reset.
        }

        setSimState(prev => ({ ...prev, isRunning: true }));
        simRef.current = {
            isRunning: true,
            spinsLeft: spinsToRun,
            currentBet: simBetAmount
        };

        // Local ephemeral state for the batch loop
        let localDeck = {
            remainingTickets: deckState.remainingTickets || (config.scratch?.math?.totalTickets || 1000000),
            remainingPrizes: { ...deckState.remainingPrizes }
        };

        // If deck not initialized yet (first run), populate it
        if (useFiniteDeck && !deckState.isInitialized) {
            const initialPrizes: Record<string, number> = {};
            prizes.forEach(p => initialPrizes[p.id] = p.weight);
            localDeck.remainingPrizes = initialPrizes;
            localDeck.remainingTickets = config.scratch?.math?.totalTickets || 1000000;
        }

        const mathMode = config.scratch?.math?.mathMode || 'POOL';
        const deckSize = config.scratch?.math?.totalTickets || 1000000;
        const totalWinningTickets = prizes.reduce((sum, p) => sum + p.weight, 0);

        // Theoretical RTP for Capping
        let theoreticalRTP = 0;
        if (mathMode === 'POOL') {
            const totalVal = prizes.reduce((sum, p) => sum + (p.weight * p.payout), 0);
            theoreticalRTP = deckSize > 0 ? (totalVal / deckSize) * 100 : 0;
        } else {
            theoreticalRTP = prizes.reduce((sum, p) => sum + ((p.probability || 0) * p.payout), 0);
        }

        let runningTotalBet = simState.totalBet;
        let runningTotalWon = simState.totalWon;
        let currentRoundOffset = simState.totalSpins;

        // Identify Major Win Levels (e.g. Top 3 tiers)
        const sortedPrizes = [...prizes].sort((a, b) => b.payout - a.payout);
        const majorPrizeIds = new Set(sortedPrizes.slice(0, 3).map(p => p.id));

        const processBatch = () => {
            if (!simRef.current.isRunning || simRef.current.spinsLeft <= 0) {
                setSimState(prev => ({ ...prev, isRunning: false }));
                return;
            }

            const batchSize = 2500; // Process per frame
            const iterations = Math.min(simRef.current.spinsLeft, batchSize);

            let batchWon = 0;
            let batchBet = 0;
            let localWins: number[] = [];
            let localAuditEvents: typeof auditLog = [];

            for (let i = 0; i < iterations; i++) {
                // Check Finite End
                if (useFiniteDeck && localDeck.remainingTickets <= 0) {
                    simRef.current.spinsLeft = 0;
                    break;
                }

                batchBet += simRef.current.currentBet;
                runningTotalBet += simRef.current.currentBet;

                let isWin = false;
                let winningPayout = 0;
                let winningPrizeName = "";
                let winningPrizeId = "";

                if (useFiniteDeck) {
                    // FINITE DRAW WITHOUT REPLACEMENT
                    const rand = Math.random() * localDeck.remainingTickets;
                    let currentWeight = 0;
                    let drawnPrize = null;

                    for (const prize of prizes) {
                        const count = localDeck.remainingPrizes[prize.id] || 0;
                        if (count > 0) {
                            currentWeight += count;
                            if (rand < currentWeight) {
                                drawnPrize = prize;
                                // Decrement
                                localDeck.remainingPrizes[prize.id]--;
                                break;
                            }
                        }
                    }

                    localDeck.remainingTickets--; // Decrement total

                    if (drawnPrize) {
                        isWin = true;
                        winningPayout = drawnPrize.payout;
                        winningPrizeName = drawnPrize.name;
                        winningPrizeId = drawnPrize.id;
                    }

                } else {
                    // UNLIMITED / MONTE CARLO
                    if (mathMode === 'POOL') {
                        isWin = Math.random() < (totalWinningTickets / deckSize);
                        if (isWin) {
                            const rand = Math.random() * totalWinningTickets;
                            let currentWeight = 0;
                            for (const prize of prizes) {
                                currentWeight += prize.weight;
                                if (rand < currentWeight) {
                                    winningPayout = prize.payout;
                                    winningPrizeName = prize.name;
                                    winningPrizeId = prize.id;
                                    break;
                                }
                            }
                        }
                    } else {
                        // Probability Mode
                        const hitRate = prizes.reduce((sum, p) => sum + (p.probability || 0), 0) / 100;
                        isWin = Math.random() < hitRate;
                        if (isWin) {
                            const totalHitProb = prizes.reduce((sum, p) => sum + (p.probability || 0), 0);
                            const rand = Math.random() * totalHitProb;
                            let currentProb = 0;
                            for (const prize of prizes) {
                                currentProb += (prize.probability || 0);
                                if (rand < currentProb) {
                                    winningPayout = prize.payout;
                                    winningPrizeName = prize.name;
                                    winningPrizeId = prize.id;
                                    break;
                                }
                            }
                        }
                    }
                }

                // CAPPING (Compensated)
                if (enforceRtpCap && isWin && !useFiniteDeck) {
                    // Finite deck self-regulates, so strictly only for infinite
                    const potentialWon = runningTotalWon + (simRef.current.currentBet * winningPayout);
                    const expectedWon = runningTotalBet * (theoreticalRTP / 100);
                    if (potentialWon > expectedWon) {
                        isWin = false;
                        winningPayout = 0;
                    }
                }

                if (isWin) {
                    const wonAmount = simRef.current.currentBet * winningPayout;
                    batchWon += wonAmount;
                    runningTotalWon += wonAmount;
                    localWins.push(wonAmount);

                    // Log Major Wins
                    if (majorPrizeIds.has(winningPrizeId)) {
                        localAuditEvents.push({
                            ticketIndex: currentRoundOffset + i + 1,
                            prizeName: winningPrizeName,
                            win: wonAmount
                        });
                    }
                }
            }

            // Update State
            currentRoundOffset += iterations;
            simRef.current.spinsLeft -= iterations;

            setSimState(prev => ({
                ...prev,
                totalSpins: prev.totalSpins + iterations,
                totalBet: prev.totalBet + batchBet,
                totalWon: prev.totalWon + batchWon
            }));

            // Optimize visual history (only keep last 50)
            if (localWins.length > 0) {
                setWinHistory(prev => [...prev, ...localWins].slice(-50));
            }

            // Append Audit Log
            if (localAuditEvents.length > 0) {
                setAuditLog(prev => [...prev, ...localAuditEvents].sort((a, b) => a.ticketIndex - b.ticketIndex));
            }

            // Update Finite Deck State
            if (useFiniteDeck) {
                setDeckState({
                    remainingTickets: localDeck.remainingTickets,
                    remainingPrizes: localDeck.remainingPrizes,
                    isInitialized: true
                });
            }

            // Next Frame
            if (simRef.current.spinsLeft > 0) {
                animationFrameRef.current = requestAnimationFrame(processBatch);
            } else {
                setSimState(prev => ({ ...prev, isRunning: false }));
            }
        };

        animationFrameRef.current = requestAnimationFrame(processBatch);
    };

    const actualRTP = simState.totalBet > 0 ? (simState.totalWon / simState.totalBet) * 100 : 0;
    const ggr = simState.totalBet - simState.totalWon;

    return (
        <div className="flex flex-col h-full gap-2 p-1 w-full max-w-5xl mx-auto">
            {/* Control Panel (Compact) */}
            <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm shrink-0 flex items-center justify-between">
                <div className="flex flex-col">
                    <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
                        <BarChart2 size={16} className="text-purple-500" />
                        {useFiniteDeck ? 'Deck Certification' : 'Monte Carlo Sim'}
                    </h3>
                    <p className="text-[10px] text-gray-400 leading-none">
                        {useFiniteDeck ? "Finite Deck Scenario" : "Verify Math Model"}
                    </p>
                </div>

                <div className="flex gap-2 items-center">

                    {/* Mode Toggles (Compact) */}
                    <div className="flex items-center gap-2 mr-2 bg-gray-50 px-1.5 py-1 rounded border border-gray-200">
                        {(config.scratch?.math?.mathMode || 'POOL') === 'POOL' ? (
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={useFiniteDeck}
                                    onChange={e => {
                                        setUseFiniteDeck(e.target.checked);
                                        const deckSize = config.scratch?.math?.totalTickets || 1000000;
                                        setSpinsToRun(deckSize);
                                        if (e.target.checked) setSimBetAmount(config.scratch?.math?.ticketPrice || 10);
                                        resetSim();
                                    }}
                                    className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-gray-700">Finite</span>
                            </label>
                        ) : (
                            <span className="text-[10px] text-gray-400 px-1">Unltd</span>
                        )}

                        <div className="w-px h-4 bg-gray-200 mx-1"></div>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={enforceRtpCap}
                                disabled={useFiniteDeck}
                                onChange={e => setEnforceRtpCap(e.target.checked)}
                                className="w-3 h-3 text-purple-600 rounded focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                            />
                            <span className="text-[10px] font-bold text-gray-700 disabled:opacity-50">Cap</span>
                        </label>
                    </div>

                    {/* Inputs (Compact) */}
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 w-16 ${useFiniteDeck ? 'opacity-50' : ''}`}>
                            <span className="text-gray-400 font-bold text-[10px]">€</span>
                            <input
                                type="number"
                                value={simBetAmount}
                                disabled={useFiniteDeck}
                                onChange={(e) => setSimBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full bg-transparent font-bold text-gray-700 text-xs focus:outline-none"
                            />
                        </div>

                        <select
                            value={spinsToRun}
                            onChange={(e) => setSpinsToRun(Number(e.target.value))}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded px-2 py-0.5 font-bold outline-none cursor-pointer hover:bg-gray-100 h-6"
                        >
                            {useFiniteDeck ? (
                                <option value={config.scratch?.math?.totalTickets || 1000000}>
                                    Full ({((config.scratch?.math?.totalTickets || 1000000) / 1000).toFixed(0)}k)
                                </option>
                            ) : (
                                <>
                                    <option value={100}>100</option>
                                    <option value={1000}>1k</option>
                                    <option value={5000}>5k</option>
                                    <option value={10000}>10k</option>
                                    <option value={100000}>100k</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1" />

                    <button onClick={resetSim} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                        <RotateCcw size={14} />
                    </button>

                    <button
                        onClick={runSimulation}
                        disabled={prizes.length === 0 || simState.isRunning}
                        className={`px-3 py-1 rounded-md font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 text-white ${simState.isRunning ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 active:scale-95'}`}
                    >
                        <Play size={12} fill="currentColor" />
                        {simState.isRunning ? 'Running...' : 'Run'}
                    </button>
                </div>
            </div>

            {/* Results Strip (Compact) */}
            <div className={`flex gap-2 shrink-0 relative h-20 text-center ${useFiniteDeck ? 'p-1 rounded-lg border border-blue-100 bg-blue-50/30' : ''}`}>

                {useFiniteDeck && deckState.isInitialized && (
                    <div className="absolute -top-2 left-2 bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 rounded-full z-20 border border-blue-200">
                        {(() => {
                            const total = config.scratch?.math?.totalTickets || 1000000;
                            const progress = total > 0 ? ((total - deckState.remainingTickets) / total) * 100 : 0;
                            return progress.toFixed(1);
                        })()}% Done
                    </div>
                )}

                <div className="flex-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Rounds</span>
                    <span className="text-lg font-black text-gray-800 leading-tight">{simState.totalSpins.toLocaleString()}</span>
                </div>

                <div className="flex-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Bets</span>
                    <span className="text-lg font-black text-gray-800 leading-tight">€{simState.totalBet.toLocaleString()}</span>
                </div>

                <div className="flex-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 z-10 relative">Actual RTP</span>
                    <span className={`text-xl font-black z-10 relative leading-tight ${actualRTP > 100 ? 'text-red-500' : 'text-blue-600'}`}>
                        {actualRTP.toFixed(2)}%
                    </span>
                    <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
                        <div className={`h-full ${actualRTP > 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(actualRTP, 100)}%` }} />
                    </div>
                </div>

                <div className="flex-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">House Profit</span>
                    <span className={`text-xl font-black leading-tight ${ggr >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {ggr >= 0 ? '+' : ''}€{ggr.toLocaleString()}
                    </span>
                    <span className="text-[8px] text-gray-400">Margin: {simState.totalBet > 0 ? ((ggr / simState.totalBet) * 100).toFixed(2) : '0.00'}%</span>
                </div>
            </div>

            {/* Bottom Row: Recent Wins & Major Win Timeline */}
            <div className="flex-1 min-h-0 flex gap-2 overflow-hidden pb-1">

                {/* Major Win Timeline */}
                <div className="w-1/3 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                    <div className="p-2 border-b border-gray-100 flex items-center gap-1.5 bg-gray-50 shrink-0">
                        <History size={12} className="text-gray-400" />
                        <h4 className="text-[10px] font-bold text-gray-600 uppercase">Major Wins</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                        {auditLog.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-1">
                                <History size={20} className="opacity-20" />
                                <span className="text-[10px]">No major wins</span>
                            </div>
                        ) : (
                            auditLog.map((log, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] p-1.5 rounded bg-purple-50/50 border border-purple-100">
                                    <span className="font-mono text-gray-500">#{log.ticketIndex.toLocaleString()}</span>
                                    <div className="text-right leading-none">
                                        <div className="font-bold text-purple-700">{log.prizeName}</div>
                                        <div className="font-bold text-green-600 text-[9px]">+€{log.win.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Wins Feed */}
                <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex flex-col p-2">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 shrink-0">Wins Feed (Last 50)</h4>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="flex flex-wrap gap-1 content-start">
                            {winHistory.length === 0 ? (
                                <span className="text-gray-400 text-xs italic w-full text-center mt-4">Waiting for run...</span>
                            ) : (
                                [...winHistory].reverse().map((win, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`px-2 py-1 rounded font-mono font-bold text-[10px] shadow-sm border flex items-center gap-0.5
                                                ${win >= 500 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                win >= 100 ? 'bg-green-100 text-green-700 border-green-200' :
                                                    'bg-white text-gray-600 border-gray-200'}`}
                                    >
                                        <Coins size={8} />
                                        €{win}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step3_Tab_Simulation;
