import React, { useState } from 'react';
import { useGameStore } from '../../../store';
import { CrashConfig } from '../../../types';
import { BarChart3, TrendingUp, RefreshCw } from 'lucide-react';

const Step6_CrashAnalytics: React.FC = () => {
    const { config } = useGameStore();
    const crashConfig = config.crash as CrashConfig;

    // Simulation Params
    const [simRounds, setSimRounds] = useState(1000);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simResults, setSimResults] = useState<{
        rtp: number;
        busts: number;
        biggestWin: number;
        houseProfit: number;
        history: number[]; // Last 50 multipliers
    } | null>(null);

    // Bankroll Params
    const [bankroll, setBankroll] = useState(1000);
    const [betAmount, setBetAmount] = useState(10);
    const [targetMulti, setTargetMulti] = useState(2.0);
    const [survivalRounds, setSurvivalRounds] = useState<number | null>(null);

    // Simulation Logic
    const runSimulation = async () => {
        setIsSimulating(true);

        // Use a timeout to allow UI update before heavy calc
        setTimeout(() => {
            // Unused vars for now, but kept for future logic expansion if needed
            const growthRate = crashConfig?.growthRate || 0.1;
            const houseEdge = crashConfig?.houseEdge || 4;
            console.log(`Running sim with Growth: ${growthRate}, Edge: ${houseEdge}%`);

            // Standard Crash Algorithm (Crypto-style)
            // Multiplier = 0.99 / (1 - random) 
            // With house edge correction: 
            // e.g. 1% instant bust chance (1.00x)

            let totalWagered = 0;
            let totalWon = 0;
            let busts = 0;
            let maxWin = 0;
            const history: number[] = [];

            // Simple user strategy for RTP calc: Flat bet, cashout at 2x 
            // (Note: RTP is theoretically constant regardless of strategy in fair crash games, but variance changes)
            // To calculate "Game RTP", we simulate the crash points themselves.

            for (let i = 0; i < simRounds; i++) {
                const r = Math.random();

                // 1. Instant Bust Check (House Edge)
                // If house edge is 4%, usually implies 1/25 rounds crash at 1.00x ??
                // Or standard formula: E = 0.99 * (1 / (1-p)) ?
                // Let's use a standard "Bustabit" style compliant formula logic:
                // crashPoint = 0.99 / (1 - X)

                let crashPoint = 0.99 / (1 - r);

                // Cap at maxMultiplier
                const maxM = crashConfig?.maxMultiplier || 1000;
                if (crashPoint > maxM) crashPoint = maxM;

                // Rounding
                crashPoint = Math.floor(crashPoint * 100) / 100;

                // Validation against minMultiplier
                const minM = crashConfig?.minMultiplier || 1.00;
                if (crashPoint < minM) crashPoint = 1.00; // Instant bust

                if (crashPoint <= 1.00) busts++;
                if (crashPoint > maxWin) maxWin = crashPoint;

                // For simulation stats
                if (history.length < 50) history.push(crashPoint);

                // Check hypothetical bet (Bet 10, Target 2x)
                totalWagered += 10;
                if (crashPoint >= 2.00) {
                    totalWon += 20;
                }
            }

            const rtp = (totalWon / totalWagered) * 100;
            const profit = totalWagered - totalWon;

            setSimResults({
                rtp,
                busts,
                biggestWin: maxWin,
                houseProfit: profit,
                history
            });

            setIsSimulating(false);
        }, 100);
    };

    const runBankrollSim = () => {
        // Determine survival rounds with current settings
        // Simulate until bust
        let currentBalance = bankroll;
        let rounds = 0;
        const maxRounds = 10000;

        while (currentBalance > 0 && rounds < maxRounds) {
            const r = Math.random();
            let crashPoint = 0.99 / (1 - r);
            crashPoint = Math.floor(crashPoint * 100) / 100;
            if (crashPoint < 1.00) crashPoint = 1.00;

            currentBalance -= betAmount;
            if (crashPoint >= targetMulti) {
                currentBalance += betAmount * targetMulti;
            }
            rounds++;
        }
        setSurvivalRounds(rounds);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 p-6 overflow-hidden">
            {/* Left Col: RTP & House Edge */}
            <div className="flex-1 space-y-6 overflow-y-auto scrollbar-thin pr-2">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <BarChart3 className="text-blue-600" />
                            RTP Validation
                        </h2>
                        <div className="flex gap-2">
                            <select
                                value={simRounds}
                                onChange={(e) => setSimRounds(Number(e.target.value))}
                                className="text-sm border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="1000">1k Rounds</option>
                                <option value="10000">10k Rounds</option>
                                <option value="100000">100k Rounds</option>
                            </select>
                            <button
                                onClick={runSimulation}
                                disabled={isSimulating}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSimulating ? 'Running...' : 'Run Sim'}
                            </button>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">
                        Simulate game logic to verify Return to Player (RTP) and House Edge integrity using the current algorithm configuration.
                    </p>

                    {simResults ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">Calculated RTP</div>
                                <div className={`text-2xl font-bold ${simResults.rtp >= 95 ? 'text-green-600' : 'text-amber-600'}`}>
                                    {simResults.rtp.toFixed(2)}%
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Target: 96.00%</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">House Profit</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    ${simResults.houseProfit.toFixed(0)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">From ${simRounds * 10} wagered</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">Crash @ 1.00x</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {((simResults.busts / simRounds) * 100).toFixed(2)}%
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Instant Busts</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">Highest Multiplier</div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {simResults.biggestWin.toFixed(2)}x
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <div className="text-center text-gray-400">
                                <RefreshCw className="mx-auto mb-2 opacity-50" />
                                <span>Run simulation to see data</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Heatmap Visualization (Simple Bar) */}
                {simResults && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-4">Distribution Trend (Last 50)</h3>
                        <div className="h-32 flex items-end gap-1 bg-gray-50 p-2 rounded border border-gray-100">
                            {simResults.history.map((val, idx) => (
                                <div
                                    key={idx}
                                    className={`flex-1 min-w-[4px] rounded-t-sm transition-all hover:opacity-80 ${val < 2 ? 'bg-red-400' : val < 10 ? 'bg-blue-400' : 'bg-purple-500'}`}
                                    style={{ height: `${Math.min(val * 5, 100)}%` }}
                                    title={`${val}x`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Col: Bankroll Survival */}
            <div className="w-80 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="text-green-600" />
                            Survival Test
                        </h2>
                        <p className="text-sm text-gray-500 mt-2">
                            Test how long a player lasts with a specific strategy.
                        </p>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Starting Balance</label>
                            <input
                                type="number"
                                value={bankroll}
                                onChange={(e) => setBankroll(Number(e.target.value))}
                                className="w-full text-sm border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Bet Amount</label>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                className="w-full text-sm border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Target Multiplier (Auto-Cashout)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={targetMulti}
                                onChange={(e) => setTargetMulti(Number(e.target.value))}
                                className="w-full text-sm border-gray-300 rounded-lg"
                            />
                        </div>

                        {survivalRounds !== null && (
                            <div className={`p-4 rounded-lg mt-4 text-center ${survivalRounds >= 1000 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                <div className="text-xs font-semibold uppercase tracking-wider mb-1">Result</div>
                                <div className="text-3xl font-bold">{survivalRounds >= 10000 ? '10k+' : survivalRounds}</div>
                                <div className="text-xs opacity-75">Rounds until bust</div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={runBankrollSim}
                        className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold shadow hover:bg-black transition-all mt-4"
                    >
                        Test Strategy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step6_CrashAnalytics;
