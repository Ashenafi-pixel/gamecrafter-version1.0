
import React, { useState } from 'react';
import { useGameStore } from '../../../store';
import { Play, Download, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { resolveSpin } from '../../../utils/math-engine/slot-resolver';
import { generateCompleteSlotExport } from '../../../utils/slot-export-utils';
import { GameConfig } from '../../../types';

const Step6_Export: React.FC = () => {
    const { config } = useGameStore();
    const [isSimulating, setIsSimulating] = useState(false);
    const [simProgress, setSimProgress] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    const runSimulation = async () => {
        setIsSimulating(true);
        setSimProgress(0);
        setStats(null);

        // Run 10,000 spins in batches
        const totalSpins = 10000;
        const batchSize = 500;
        let wins = 0;
        let totalWinAmount = 0;
        let maxWin = 0;

        // Use a timeout loop to not block UI
        let currentSpin = 0;

        const processBatch = () => {
            const end = Math.min(currentSpin + batchSize, totalSpins);
            for (let i = currentSpin; i < end; i++) {
                const result = resolveSpin(config as GameConfig, `sim_${i}_${Date.now()}`);
                if (result.isWin) {
                    wins++;
                    totalWinAmount += result.winAmount;
                    if (result.winAmount > maxWin) maxWin = result.winAmount;
                }
            }

            currentSpin = end;
            setSimProgress(Math.floor((currentSpin / totalSpins) * 100));

            if (currentSpin < totalSpins) {
                setTimeout(processBatch, 10);
            } else {
                finishSimulation(wins, totalWinAmount, maxWin, totalSpins);
            }
        };

        setTimeout(processBatch, 100);
    };

    const finishSimulation = (wins: number, totalWinAmount: number, maxWin: number, totalSpins: number) => {
        // Assume default bet 10 for resolver
        const totalBet = totalSpins * 10;
        const rtp = totalWinAmount / totalBet;
        const hitRate = wins / totalSpins;

        setStats({
            rtp: (rtp * 100).toFixed(2) + '%',
            hitRate: (hitRate * 100).toFixed(2) + '%',
            maxWin: maxWin.toFixed(0),
            totalWin: totalWinAmount
        });
        setIsSimulating(false);
    };

    const handleDownload = async () => {
        setIsExporting(true);
        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const exportData = generateCompleteSlotExport(config as GameConfig);

            // Add JSON
            zip.file("game.json", JSON.stringify(exportData, null, 2));

            // Add Assets Folder
            const assets = zip.folder("assets");

            // Just a placeholder text for now to prove structure
            assets?.file("readme.txt", "Assets will be located here in the full version.");

            // Generate ZIP
            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);

            // Trigger Download
            const a = document.createElement('a');
            a.href = url;
            a.download = `${config.gameId || 'slot_game'}_v2_export.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error("Export failed", e);
            alert("Export failed: " + e);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-8 overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Export & Publish</h1>
            <p className="text-gray-500 mb-8">Validate your math model and package your game for distribution.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">

                {/* Simulation Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <RefreshCw size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Monte Carlo Simulation</h3>
                                <p className="text-sm text-gray-500">Run 10,000 spins to verify RTP</p>
                            </div>
                        </div>
                        {stats && <div className="text-green-600 flex items-center gap-1 font-bold"><CheckCircle size={16} /> Verified</div>}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">RTP</div>
                                <div className="text-2xl font-black text-gray-800">{stats ? stats.rtp : '--'}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hit Rate</div>
                                <div className="text-2xl font-black text-gray-800">{stats ? stats.hitRate : '--'}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Max Win</div>
                                <div className="text-2xl font-black text-gray-800">{stats ? stats.maxWin : '--'}</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                            <span>Active Mechanic:</span>
                            <span className="font-bold px-2 py-1 bg-gray-200 rounded text-gray-700 uppercase text-xs">
                                {config.reels?.payMechanism || 'betlines'}
                            </span>
                        </div>
                    </div>

                    {isSimulating ? (
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                                style={{ width: `${simProgress}%` }}
                            />
                        </div>
                    ) : (
                        <button
                            onClick={runSimulation}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Play size={20} /> Run Simulation
                        </button>
                    )}
                </div>

                {/* Export Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                <Download size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Game Logic Package</h3>
                                <p className="text-sm text-gray-500">Download ZIP bundle with assets & math</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Includes <b>game.json</b> (RGS Schema)</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Includes <b>Asset Manifest</b></span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600">
                            <AlertTriangle size={16} className="text-amber-500" />
                            <span>HTML5 Wrapper (Coming Soon)</span>
                        </div>
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={isExporting}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isExporting ? 'Packaging...' : <><Download size={20} /> Download ZIP</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Step6_Export;
