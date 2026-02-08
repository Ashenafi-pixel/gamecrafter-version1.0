import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import { TrendingUp, Activity, AlertTriangle, Settings } from 'lucide-react';
import CrashSimulationCanvas from './CrashSimulationCanvas';

const Step1_CrashMechanics: React.FC = () => {
    const { config, updateCrashConfig } = useGameStore();
    const [isPlaying, setIsPlaying] = useState(true);

    const handleCrash = () => {
        setTimeout(() => {
            setIsPlaying(false);
            setTimeout(() => setIsPlaying(true), 500);
        }, 2000);
    };

    // Ensure default values for new properties
    const crashConfig = {
        growthRate: config.crash?.growthRate ?? 1.5,
        houseEdge: config.crash?.houseEdge ?? 4,
        maxMultiplier: config.crash?.maxMultiplier ?? 1000,
        minMultiplier: config.crash?.minMultiplier ?? 1.01,
        algorithm: config.crash?.algorithm ?? 'exponential',
        direction: config.crash?.direction ?? 'up', // [NEW] Default to 'up' (Classic Rocket)
        physics: config.crash?.physics ?? 'standard', // [NEW] Default to 'standard'
        betting: config.crash?.betting ?? {
            maxBets: 1,
            autoCashoutEnabled: true,
            minAutoCashout: 1.01,
            maxAutoCashout: 1000
        },
        behaviors: config.crash?.behaviors ?? {
            crashThresholds: {
                instaCrashChance: 0.01 // derived default
            }
        },
        visuals: config.crash?.visuals ?? {
            lineColor: '#6366f1',
            gridColor: '#374151',
            textColor: '#ffffff',
            objectType: 'rocket',
            showGrid: true,
            showAxis: true
        }
    };



    return (
        <div className="flex h-[calc(100vh-140px)]">
            {/* Left Panel: Configuration */}
            <div className="w-[400px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-6 scrollbar-thin">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Mechanics</h2>
                    <p className="text-gray-500 text-sm">Configure the mathematical model and behavior of your crash game.</p>
                </div>

                {/* Algorithm Selector */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-800">Growth Algorithm</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {['linear', 'exponential', 'logistic'].map((algo) => (
                            <button
                                key={algo}
                                onClick={() => updateCrashConfig({ algorithm: algo as any })}
                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${crashConfig.algorithm === algo
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="capitalize">{algo}</div>
                                <div className="text-[10px] opacity-70 mt-1">
                                    {algo === 'linear' && 'Steady'}
                                    {algo === 'exponential' && 'Accelerating'}
                                    {algo === 'logistic' && 'S-Curve'}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Growth Rate */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-800">Growth Dynamics</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Growth Rate</label>
                                <span className="text-sm font-bold text-indigo-600">{crashConfig.growthRate}x</span>
                            </div>
                            <input
                                type="range"
                                min="1.1"
                                max="5.0"
                                step="0.1"
                                value={crashConfig.growthRate}
                                onChange={(e) => updateCrashConfig({ growthRate: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>
                </section>

                {/* Advanced Mechanics: Direction & Physics */}
                <section className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-800">Physics & Movement</h3>
                    </div>

                    {/* Direction */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Movement Direction</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['up', 'right', 'diagonal'].map((dir) => (
                                <button
                                    key={dir}
                                    onClick={() => updateCrashConfig({ direction: dir as any })}
                                    className={`p-2 rounded border text-xs font-medium transition-all capitalize ${crashConfig.direction === dir
                                        ? 'border-indigo-600 bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-600'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {dir}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Physics */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Physics Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['standard', 'gravity', 'bounce'].map((phy) => (
                                <button
                                    key={phy}
                                    onClick={() => updateCrashConfig({ physics: phy as any })}
                                    className={`p-2 rounded border text-xs font-medium transition-all capitalize ${crashConfig.physics === phy
                                        ? 'border-purple-600 bg-white text-purple-700 shadow-sm ring-1 ring-purple-600'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {phy}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Betting Configuration */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-800">Betting Logic</h3>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Max Bets Per Round</label>
                            <div className="flex bg-white rounded-md border border-gray-200 p-0.5">
                                {[1, 2].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => updateCrashConfig({
                                            betting: { ...crashConfig.betting, maxBets: num }
                                        })}
                                        className={`px-3 py-1 text-sm rounded ${crashConfig.betting.maxBets === num
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Enable Auto-Cashout</label>
                            <input
                                type="checkbox"
                                checked={crashConfig.betting.autoCashoutEnabled}
                                onChange={(e) => updateCrashConfig({
                                    betting: { ...crashConfig.betting, autoCashoutEnabled: e.target.checked }
                                })}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </section>

                {/* House Edge */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-gray-800">Probability Engine</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">House Edge (%)</label>
                                <span className="text-sm font-bold text-red-600">{crashConfig.houseEdge}%</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="0.5"
                                value={crashConfig.houseEdge}
                                onChange={(e) => updateCrashConfig({ houseEdge: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                            />
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-orange-800">Insta-Crash Risk</h4>
                                <p className="text-xs text-orange-700 mt-1">
                                    With {crashConfig.houseEdge}% house edge, ~1 in {Math.round(100 / crashConfig.houseEdge)} games crash at 1.00x.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Right Panel: Preview */}
            <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-10 pointer-events-none">
                    {Array.from({ length: 400 }).map((_, i) => (
                        <div key={i} className="border-[0.5px] border-gray-400" />
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-xl w-[800px] h-[500px] relative overflow-hidden flex flex-col">
                    {/* Game Header */}
                    <div className="bg-gray-900 text-white p-4 flex justify-between items-center z-10">
                        <span className="font-bold tracking-wider">CRASH PREVIEW</span>
                        <div className="flex gap-4 text-sm text-gray-400">
                            <span>Balance: $1,000.00</span>
                            {crashConfig.betting.maxBets === 2 && (
                                <span className="text-indigo-400">Dual Bet Active</span>
                            )}
                        </div>
                    </div>

                    {/* Game Canvas - Now using Physics Simulation */}
                    <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
                        <CrashSimulationCanvas
                            config={crashConfig as any}
                            isPlaying={isPlaying}
                            onCrash={handleCrash}
                            width={800}
                            height={500}
                        />
                    </div>

                    {/* Game Controls Footer */}
                    <div className="bg-gray-800 p-4 flex gap-4 justify-center z-10">
                        <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg opacity-50 cursor-not-allowed">
                            BET NOW
                        </button>
                        {crashConfig.betting.maxBets === 2 && (
                            <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg opacity-50 cursor-not-allowed border-l border-white/20">
                                BET 2
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Step1_CrashMechanics;
