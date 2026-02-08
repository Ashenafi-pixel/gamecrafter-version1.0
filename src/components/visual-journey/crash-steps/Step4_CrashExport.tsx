import React from 'react';
import { useGameStore } from '../../../store'; // Adjust import path
import { CheckCircle, Download, FileJson, Share2 } from 'lucide-react';

// Define a placeholder export function or hook
// import { useExportCrashGame } from '../../../hooks/useExportCrashGame'; 

const Step4_CrashExport: React.FC = () => {
    const { config } = useGameStore();

    // Mock manifest generation
    const generateManifest = () => {
        const crashConfig = config.crash || {
            growthRate: 1.5,
            houseEdge: 4,
            minMultiplier: 1.01,
            maxMultiplier: 1000,
            algorithm: 'exponential',
            direction: 'up',
            physics: 'standard',
            betting: { maxBets: 1, autoCashoutEnabled: true, minAutoCashout: 1.01, maxAutoCashout: 1000 },
            behaviors: { crashThresholds: { instaCrashChance: 0.01 } },
            visuals: {
                lineColor: '#6366f1',
                gridColor: '#374151',
                textColor: '#ffffff',
                objectType: 'rocket',
                graphStyle: 'solid',
                environment: { backgroundType: 'static', scrollSpeed: 0 },
                assets: { runnerStates: { idle: '', run: '', crash: '' } },
                particles: { trail: { enabled: true }, explosion: { enabled: true } },
                skinId: 'default'
            },
            audio: { enabled: true, volume: 0.5, tracks: {} },
            social: { liveFeedEnabled: true, chatEnabled: true, leaderboardEnabled: true, fakePlayers: 50 },
            economy: { rainEnabled: false, tournamentActive: false },
            camera: { shakeEnabled: true, shakeStrength: 5, zoomEnabled: true },
            // Fallbacks for optional properties to satisfy TS if needed, though interface makes them optional
        } as any; // Cast to any or import CrashConfig to properly type it if preferred, but 'any' is safe here for a fallback local var

        return {
            id: `crash_${Date.now()}`,
            type: 'crash',
            name: config.displayName || 'Untitled Crash Game', // Use displayName
            mechanics: {
                growthRate: crashConfig.growthRate,
                houseEdge: crashConfig.houseEdge,
                direction: crashConfig.direction || 'up',
                physics: crashConfig.physics || 'standard',
                limits: {
                    min: crashConfig.minMultiplier,
                    max: crashConfig.maxMultiplier
                }
            },
            visuals: {
                colors: {
                    line: crashConfig.visuals.lineColor,
                    grid: crashConfig.visuals.gridColor,
                    text: crashConfig.visuals.textColor,
                },
                style: crashConfig.visuals.graphStyle,
                environment: crashConfig.visuals.environment,
                assets: {
                    object: crashConfig.visuals.objectType,
                    customUrl: crashConfig.visuals.customObjectUrl,
                    states: crashConfig.visuals.assets?.runnerStates,
                    background: config.scratch?.layers?.scene?.value || '#111827'
                },
                particles: crashConfig.visuals.particles,
                skinId: crashConfig.visuals.skinId
            },
            audio: crashConfig.audio,
            social: crashConfig.social,
            economy: crashConfig.economy,
            camera: crashConfig.camera,
            version: '2.0.0-ultimate'
        };
    };

    const manifest = generateManifest();

    return (
        <div className="flex h-[calc(100vh-140px)] bg-gray-50">
            <div className="max-w-5xl mx-auto w-full p-8 flex gap-8">

                {/* Left: Summary & Action */}
                <div className="w-1/3 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Ready to Launch</h2>
                        <p className="text-center text-gray-500 mb-6">
                            Your crash game configuration is complete and ready for export.
                        </p>

                        <div className="space-y-3">
                            <button className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                                <Download className="w-5 h-5" />
                                Download Bundle
                            </button>
                            <button className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                <Share2 className="w-5 h-5" />
                                Publish to RGS
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4">Asset Summary</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex justify-between">
                                <span>Game Logic</span>
                                <span className="font-medium text-green-600">Validated</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Visual Assets</span>
                                <span className="font-medium text-green-600">Ready</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Audio</span>
                                <span className={config.crash?.audio?.enabled ? "font-medium text-green-600" : "font-medium text-gray-400"}>
                                    {config.crash?.audio?.enabled ? "Configured" : "Default"}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right: Code Preview */}
                <div className="w-2/3 bg-gray-900 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-300">
                            <FileJson className="w-5 h-5" />
                            <span className="font-mono text-sm">game_manifest.json</span>
                        </div>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Preview</span>
                    </div>
                    <div className="p-6 overflow-auto scrollbar-thin scrollbar-thumb-gray-700">
                        <pre className="font-mono text-sm text-emerald-400 leading-relaxed">
                            {JSON.stringify(manifest, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step4_CrashExport;
