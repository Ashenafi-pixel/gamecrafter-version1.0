import React, { useState } from 'react';
import { useGameStore } from '../../../store';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Rocket, Droplet, Layout, Sparkles, Upload } from 'lucide-react';
import { UnifiedAssetControl } from '../instant-steps/components/UnifiedAssetControl';
import BackgroundConfig from '../scratch-steps/aesthetics/BackgroundConfig';
import { CrashAudioSidebar, CrashAudioPreview } from './Step2D_CrashAudio';

const Step2_CrashVisuals: React.FC = () => {
    const { config, updateCrashConfig } = useGameStore();
    const [activeTab, setActiveTab] = useState('graph');
    const [isGenerating, setIsGenerating] = useState(false);
    const [customAssetPrompt, setCustomAssetPrompt] = useState('');

    const updateCrashVisuals = (key: string, value: any) => {
        const currentVisuals = config.crash?.visuals || {
            lineColor: '#6366f1',
            gridColor: '#374151',
            textColor: '#ffffff',
            objectType: 'rocket',
            graphStyle: 'solid'
        };

        updateCrashConfig({
            visuals: {
                ...currentVisuals,
                [key]: value
            }
        });
    };

    const visualConfig = config.crash?.visuals || {
        lineColor: '#6366f1',
        gridColor: '#374151',
        textColor: '#ffffff',
        objectType: 'rocket',
        graphStyle: 'solid',
        environment: {
            backgroundType: 'static',
            scrollSpeed: 0
        },
        assets: {
            runnerStates: {
                idle: '',
                run: '',
                crash: ''
            }
        }
    };

    // Preset Colors
    const COLORS = [
        '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ffffff'
    ];

    return (
        <div className="flex h-[calc(100vh-140px)]">
            {/* Left Panel: Visual Configuration */}
            <div className="w-[400px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-0 scrollbar-thin">

                {/* Visual Tabs */}
                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <button
                        onClick={() => setActiveTab('graph')}
                        className={`flex-1 py-4 text-sm font-semibold flex flex-col items-center gap-1 transition-colors ${activeTab === 'graph' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layout className="w-4 h-4" />
                        Graph & UI
                    </button>
                    <button
                        onClick={() => setActiveTab('background')}
                        className={`flex-1 py-4 text-sm font-semibold flex flex-col items-center gap-1 transition-colors ${activeTab === 'background' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        Background
                    </button>
                    <button
                        onClick={() => setActiveTab('object')}
                        className={`flex-1 py-4 text-sm font-semibold flex flex-col items-center gap-1 transition-colors ${activeTab === 'object' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Rocket className="w-4 h-4" />
                        Object
                    </button>
                    <button
                        onClick={() => setActiveTab('audio')}
                        className={`flex-1 py-4 text-sm font-semibold flex flex-col items-center gap-1 transition-colors ${activeTab === 'audio' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="text-lg">🔊</span>
                        Audio
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'graph' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Graph Style */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-semibold text-gray-800">Graph Style</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['solid', 'neon', 'dashed', 'gradient'].map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => updateCrashVisuals('graphStyle', style)}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-all capitalize ${visualConfig.graphStyle === style
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Line Color */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Droplet className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-semibold text-gray-800">Line Color</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-3 mb-4">
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => updateCrashVisuals('lineColor', color)}
                                            className={`w-12 h-12 rounded-full shadow-sm border-2 transition-transform hover:scale-110 ${visualConfig.lineColor === color ? 'border-gray-800 ring-2 ring-gray-200 ring-offset-2' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <div className="relative group cursor-pointer w-full h-10 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                    <input
                                        type="color"
                                        value={visualConfig.lineColor}
                                        onChange={(e) => updateCrashVisuals('lineColor', e.target.value)}
                                        className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-500 bg-white/50 pointer-events-none backdrop-blur-[1px]">
                                        CUSTOM COLOR
                                    </div>
                                </div>
                            </section>

                            {/* Grid Color */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Layout className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-semibold text-gray-800">Grid Lines</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {['#374151', '#4b5563', '#9ca3af', '#e5e7eb', '#1f2937', '#000000', 'transparent'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => updateCrashVisuals('gridColor', color)}
                                            className={`w-12 h-12 rounded-lg shadow-sm border-2 transition-transform hover:scale-110 ${visualConfig.gridColor === color ? 'border-indigo-600' : 'border-gray-200'}`}
                                            style={{ backgroundColor: color === 'transparent' ? 'white' : color, backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none', backgroundSize: '10px 10px' }}
                                        />
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'background' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                            {/* Reusing existing Scratch Background Config */}
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                                Note: Using shared background configuration. Changes here affect the global game background.
                            </div>
                            <BackgroundConfig />

                            {/* Environment Motion */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="font-semibold text-gray-800 mb-3 block">Environment Motion</h3>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-gray-600">Scroll Speed (Parallax)</label>
                                    <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                        {visualConfig.environment?.scrollSpeed ?? 0}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    step="1"
                                    value={visualConfig.environment?.scrollSpeed ?? 0}
                                    onChange={(e) => updateCrashVisuals('environment', {
                                        ...visualConfig.environment,
                                        scrollSpeed: parseInt(e.target.value)
                                    })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>Static</span>
                                    <span>High Speed</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'object' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="grid grid-cols-1 gap-2">
                                {['rocket', 'plane', 'dot', 'comet', 'custom'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => updateCrashVisuals('objectType', type)}
                                        className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${visualConfig.objectType === type ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-indigo-600 overflow-hidden">
                                                {type === 'rocket' && <Rocket />}
                                                {type === 'plane' && <div className="text-xl">✈️</div>}
                                                {type === 'dot' && <div className="w-4 h-4 rounded-full bg-indigo-600"></div>}
                                                {type === 'comet' && <div className="text-xl">☄️</div>}
                                                {type === 'custom' && (
                                                    visualConfig.customObjectUrl
                                                        ? <img src={visualConfig.customObjectUrl} alt="Custom" className="w-full h-full object-contain" />
                                                        : <Upload size={16} />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-gray-900 capitalize">{type}</div>
                                                <div className="text-xs text-gray-500">
                                                    {type === 'custom' ? 'Upload your own' : `Standard ${type}`}
                                                </div>
                                            </div>
                                        </div>
                                        {visualConfig.objectType === type && (
                                            <div className="w-4 h-4 rounded-full bg-indigo-600" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {visualConfig.objectType === 'custom' && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    <UnifiedAssetControl
                                        label="Custom Runner"
                                        subLabel="Upload transparent PNG or SVG"
                                        value={customAssetPrompt}
                                        onValueChange={setCustomAssetPrompt}
                                        imagePreview={visualConfig.customObjectUrl}
                                        onRemoveImage={() => updateCrashVisuals('customObjectUrl', undefined)}
                                        onUpload={(file: File) => {
                                            const reader = new FileReader();
                                            reader.onload = (e) => updateCrashVisuals('customObjectUrl', e.target?.result);
                                            reader.readAsDataURL(file);
                                        }}
                                        onGenerate={() => {
                                            // Mock generation for now
                                            setIsGenerating(true);
                                            setTimeout(() => {
                                                setIsGenerating(false);
                                                // Simulating a generated asset
                                            }, 2000);
                                        }}
                                        isGenerating={isGenerating}
                                        placeholder="Describe your runner (e.g. 'Golden spaceship, pixel art')"
                                    />

                                    {/* Sprite State Manager */}
                                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
                                        <h4 className="font-semibold text-gray-800 mb-4 text-sm">Advanced Sprite States</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['idle', 'run', 'crash'].map((state) => (
                                                <div key={state} className="bg-white p-2 rounded border border-gray-200">
                                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">{state} State</div>
                                                    <div className="relative group aspect-square bg-gray-100 rounded flex items-center justify-center cursor-pointer overflow-hidden border border-dashed border-gray-300 hover:border-indigo-400">
                                                        {visualConfig.assets?.runnerStates?.[state as keyof typeof visualConfig.assets.runnerStates] ? (
                                                            <img
                                                                src={visualConfig.assets.runnerStates[state as keyof typeof visualConfig.assets.runnerStates]}
                                                                alt={state}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <Upload className="w-6 h-6 text-gray-300" />
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (ev) => {
                                                                        // Ensure assets and runnerStates exist
                                                                        const currentAssets = visualConfig.assets || { runnerStates: { idle: '', run: '', crash: '' } };
                                                                        const currentStates = currentAssets.runnerStates || { idle: '', run: '', crash: '' };

                                                                        const newStates = {
                                                                            ...currentStates,
                                                                            [state]: ev.target?.result as string
                                                                        };

                                                                        updateCrashVisuals('assets', { ...currentAssets, runnerStates: newStates });
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2">Upload GIFs or WebP for animated states.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'audio' && (
                        <div className="p-6">
                            <CrashAudioSidebar />
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Preview */}
            <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center relative overflow-hidden">
                <div className="bg-white rounded-2xl shadow-xl w-[800px] h-[500px] relative overflow-hidden flex flex-col">
                    {/* Scene Background Layer */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            background: config.scratch?.layers?.scene?.value || config.scratch?.background?.value || '#111827'
                        }}
                    />

                    {/* Game Header */}
                    <div className="relative z-10 p-4 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/10">
                        <span className="font-bold tracking-wider text-white drop-shadow-md">CRASH GAME</span>
                        <div className="flex gap-4 text-sm text-white/80">
                            <span>Balance: $1,000.00</span>
                        </div>
                    </div>

                    {/* Game Canvas */}
                    <div className="flex-1 relative z-10 flex items-center justify-center">
                        {/* Grid Lines */}
                        <div
                            className="absolute bottom-0 left-0 w-full h-full border-l border-b m-8"
                            style={{ borderColor: visualConfig.gridColor }}
                        />

                        {/* Sample Curve */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none p-8" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="lineBuffer" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor={visualConfig.lineColor} stopOpacity="0.5" />
                                    <stop offset="100%" stopColor={visualConfig.lineColor} stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {visualConfig.graphStyle === 'gradient' && (
                                <path
                                    d="M0,500 Q400,300 800,0 L 800,500 L 0,500 Z"
                                    fill="url(#lineBuffer)"
                                    stroke="none"
                                />
                            )}

                            <path
                                d="M0,500 Q400,300 800,0"
                                fill="none"
                                stroke={visualConfig.lineColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={visualConfig.graphStyle === 'dashed' ? '10 10' : 'none'}
                                style={{
                                    filter: visualConfig.graphStyle === 'neon'
                                        ? `drop-shadow(0 0 10px ${visualConfig.lineColor}) drop-shadow(0 0 20px ${visualConfig.lineColor})`
                                        : 'none'
                                }}
                            />
                        </svg>

                        {/* Object */}
                        <motion.div
                            className="absolute"
                            initial={{ bottom: '40px', left: '40px' }}
                            animate={{ bottom: '70%', left: '80%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeIn" }}
                        >
                            <div className="relative transform origin-center">
                                {/* Trails/Glow */}
                                {visualConfig.graphStyle === 'neon' && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 blur-xl rounded-full" />
                                )}

                                {visualConfig.objectType === 'rocket' && <Rocket className="w-10 h-10 text-white -rotate-45" style={{ color: visualConfig.lineColor }} />}
                                {visualConfig.objectType === 'plane' && <div className="text-4xl -rotate-12">✈️</div>}
                                {visualConfig.objectType === 'dot' && <div className="w-6 h-6 rounded-full bg-white shadow-[0_0_15px_white]" style={{ backgroundColor: visualConfig.lineColor }} />}
                                {visualConfig.objectType === 'comet' && <div className="text-4xl -rotate-45">☄️</div>}
                                {visualConfig.objectType === 'custom' && visualConfig.customObjectUrl && (
                                    <img src={visualConfig.customObjectUrl} alt="Runner" className="w-16 h-16 object-contain drop-shadow-lg" />
                                )}
                                {visualConfig.objectType === 'custom' && !visualConfig.customObjectUrl && (
                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center text-xs text-white">?</div>
                                )}
                            </div>
                        </motion.div>

                        <div
                            className="text-7xl font-black z-20 font-mono tracking-tight"
                            style={{
                                color: visualConfig.textColor,
                                textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}
                        >
                            2.45x
                        </div>
                    </div>

                    {/* Audio Visualization */}
                    {activeTab === 'audio' && (
                        <div className="absolute inset-0 z-30 bg-gray-50 flex items-center justify-center">
                            <CrashAudioPreview />
                        </div>
                    )}

                    {/* Game Controls Footer */}
                    <div className="relative z-10 p-4 flex gap-4 justify-center bg-black/40 backdrop-blur-md border-t border-white/5">
                        <div className="flex gap-2 w-full max-w-md">
                            <input type="text" value="10.00" readOnly className="flex-1 bg-black/50 border border-white/10 rounded-lg text-white px-4 py-3 font-mono text-center" />
                            <button className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all uppercase tracking-wider">
                                Place Bet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Step2_CrashVisuals;
