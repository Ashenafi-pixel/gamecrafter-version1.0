import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import {
    Settings,
    Grid3X3,
    Zap,
    Trophy,
    LayoutTemplate,
    ArrowRight,
    Info
} from 'lucide-react';
import { motion } from 'framer-motion';

// Types for local state
type MechanicType = 'betlines' | 'ways' | 'cluster';

const MechanicOption: React.FC<{
    id: MechanicType;
    title: string;
    description: string;
    icon: React.ReactNode;
    selected: boolean;
    onClick: () => void;
}> = ({ title, description, icon, selected, onClick }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
      cursor-pointer rounded-xl p-5 border-2 transition-all duration-300
      flex flex-col gap-3 relative overflow-hidden
      ${selected
                ? 'border-blue-500 bg-blue-50 shadow-md transform scale-[1.01]'
                : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm'
            }
    `}
    >
        <div className={`
      w-12 h-12 rounded-lg flex items-center justify-center mb-2
      ${selected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}
    `}>
            {icon}
        </div>
        <div>
            <h3 className={`font-bold text-lg ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
                {title}
            </h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {description}
            </p>
        </div>

        {selected && (
            <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        )}
    </motion.div>
);

const GRID_PRESETS = {
    betlines: [
        { rows: 3, cols: 3, label: '3x3 Classic' },
        { rows: 3, cols: 5, label: '5x3 Standard' },
        { rows: 4, cols: 5, label: '5x4 Extended' }
    ],
    ways: [
        { rows: 3, cols: 5, label: '243 Ways (5x3)' },
        { rows: 4, cols: 5, label: '1024 Ways (5x4)' },
        { rows: 4, cols: 6, label: '4096 Ways (6x4)' }
    ],
    cluster: [
        { rows: 5, cols: 5, label: '5x5 Grid' },
        { rows: 6, cols: 6, label: '6x6 Grid' },
        { rows: 7, cols: 7, label: '7x7 Reactor' },
        { rows: 8, cols: 8, label: '8x8 Gigantic' }
    ]
};

const Step2_Mechanics: React.FC = () => {
    const { config, updateConfig } = useGameStore();

    // Initialize local state from global config
    // Default to 'betlines' if undefined or invalid
    const initialMechanic = (config.reels?.payMechanism as MechanicType) || 'betlines';
    const validMechanic = ['betlines', 'ways', 'cluster'].includes(initialMechanic) ? initialMechanic : 'betlines';

    const [mechanic, setMechanic] = useState<MechanicType>(validMechanic);

    const [layout, setLayout] = useState({
        rows: config.reels?.layout?.rows || 3,
        cols: config.reels?.layout?.reels || 5
    });

    // Expanded config for bonuses (previously Step 8)
    const [features, setFeatures] = useState({
        wilds: true,
        scatters: true,
        cascades: mechanic === 'cluster', // Default on for cluster
        buyFeature: config.bonus?.hasBuyFeature || false,
        anteBet: config.bonus?.hasAnteBet || false,
        freeSpins: config.bonus?.hasFreeSpins !== false // Default true
    });

    // Sync to Global Store on changes
    useEffect(() => {
        // Determine payline count roughly based on grid
        const lineCount = mechanic === 'betlines'
            ? Math.min(20, layout.rows * 3 + (layout.cols - 3) * 2) // Simple heuristic
            : 0;

        updateConfig({
            ...config,
            // Ensure we set the game type correctly for the engine
            selectedGameType: 'slots_v2',
            reels: {
                ...config.reels,
                payMechanism: mechanic,
                spinDirection: 'vertical',
                layout: {
                    ...config.reels?.layout,
                    rows: layout.rows,
                    reels: layout.cols,
                    shape: 'rectangle'
                },
                mascot: { lines: lineCount },
                // Ensure symbols structure exists
                symbols: config.reels?.symbols || {
                    total: 10,
                    wilds: 1,
                    scatters: 1,
                    list: []
                }
            },
            // Bonus Config (mapping local features to global bonus struct)
            bonus: {
                ...config.bonus,
                hasBuyFeature: features.buyFeature,
                hasAnteBet: features.anteBet,
                hasFreeSpins: features.freeSpins,
            } as any
        });
    }, [mechanic, layout, features]);

    // CSS Grid Rendering
    const renderGridPreview = () => (
        <div className="w-full aspect-[4/3] bg-slate-900 rounded-xl border-4 border-slate-700 shadow-inner p-8 flex items-center justify-center overflow-hidden relative">
            <div
                className="grid gap-2 transition-all duration-500"
                style={{
                    gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
                    width: '100%',
                    maxWidth: `${layout.cols * 60}px`
                }}
            >
                {Array.from({ length: layout.rows * layout.cols }).map((_, i) => (
                    <div
                        key={i}
                        className={`
              aspect-square rounded-md border border-slate-600/50 
              flex items-center justify-center
              ${mechanic === 'cluster' ? 'bg-slate-800' : 'bg-gradient-to-b from-slate-800 to-slate-900'}
            `}
                    >
                        <span className="text-slate-700 text-xs">
                            {i % layout.cols === 0 ? 'Reel' : ''}
                        </span>
                    </div>
                ))}
            </div>

            {/* Overlay Info */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-slate-300 border border-white/10">
                {layout.cols}x{layout.rows} • {mechanic.toUpperCase()}
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 pl-4 pr-6 pt-4">
            {/* Left Panel: Configuration */}
            <div className="flex-1 space-y-8 overflow-y-auto pr-2 pb-10">

                {/* Section 1: Core Mechanic */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <LayoutTemplate className="w-6 h-6 text-blue-600" />
                        Core Mechanics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MechanicOption
                            id="betlines"
                            title="Paylines"
                            description="Classic line-based wins. Good for traditional slots."
                            icon={<ArrowRight className="w-6 h-6" />}
                            selected={mechanic === 'betlines'}
                            onClick={() => setMechanic('betlines')}
                        />
                        <MechanicOption
                            id="ways"
                            title="Ways to Win"
                            description="Wins form left-to-right regardless of row. High action."
                            icon={<Zap className="w-6 h-6" />}
                            selected={mechanic === 'ways'}
                            onClick={() => setMechanic('ways')}
                        />
                        <MechanicOption
                            id="cluster"
                            title="Cluster Pays"
                            description="Grid based. Symbols match in groups. Cascading wins."
                            icon={<Grid3X3 className="w-6 h-6" />}
                            selected={mechanic === 'cluster'}
                            onClick={() => {
                                setMechanic('cluster');
                                setFeatures(f => ({ ...f, cascades: true }));
                                setLayout({ rows: 5, cols: 5 });
                            }}
                        />
                    </div>
                </div>

                {/* Section 2: Grid Layout */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-500" />
                        Grid Size
                    </h2>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {GRID_PRESETS[mechanic].map((preset, idx) => (
                            <button
                                key={idx}
                                onClick={() => setLayout({ rows: preset.rows, cols: preset.cols })}
                                className={`
                  py-2 px-3 rounded-lg text-sm font-medium border transition-all
                  ${layout.rows === preset.rows && layout.cols === preset.cols
                                        ? 'bg-gray-800 text-white border-gray-900'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }
                `}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Sliders */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="w-20 text-sm font-medium text-gray-600">Reels/Cols</span>
                            <input
                                type="range" min="3" max={mechanic === 'cluster' ? 10 : 7}
                                value={layout.cols}
                                onChange={(e) => setLayout({ ...layout, cols: parseInt(e.target.value) })}
                                className="flex-1"
                            />
                            <span className="w-8 text-sm font-bold text-gray-900">{layout.cols}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="w-20 text-sm font-medium text-gray-600">Rows</span>
                            <input
                                type="range" min="3" max={mechanic === 'cluster' ? 10 : 6}
                                value={layout.rows}
                                onChange={(e) => setLayout({ ...layout, rows: parseInt(e.target.value) })}
                                className="flex-1"
                            />
                            <span className="w-8 text-sm font-bold text-gray-900">{layout.rows}</span>
                        </div>
                    </div>
                </div>

                {/* Section 3: Features & Bonus */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        Game Features
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Zap className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Cascades</div>
                                    <div className="text-xs text-gray-500">Winning symbols vanish</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={features.cascades}
                                onChange={(e) => setFeatures({ ...features, cascades: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <Trophy className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Free Spins</div>
                                    <div className="text-xs text-gray-500">Scatters trigger bonus</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={features.freeSpins}
                                onChange={(e) => setFeatures({ ...features, freeSpins: e.target.checked })}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 p-2 rounded-lg">
                                    <Settings className="w-4 h-4 text-yellow-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Buy Feature</div>
                                    <div className="text-xs text-gray-500">Shop for bonuses</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={features.buyFeature}
                                onChange={(e) => setFeatures({ ...features, buyFeature: e.target.checked })}
                                className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Right Panel: Preview */}
            <div className="w-full lg:w-[450px] shrink-0 sticky top-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Engine Preview
                </h3>
                {renderGridPreview()}

                <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-900">
                    <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-1">Architecture Note</p>
                            <p className="opacity-80">
                                You are using the unified Slots 2.0 engine.
                                {mechanic === 'cluster'
                                    ? ' Grid logic enabled. Winning clusters explode and remaining symbols drop down.'
                                    : ' Standard Reel logic enabled. Symbols spin independently per reel.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step2_Mechanics;
