import React, { useState } from 'react';
import { useGameStore } from '../../../../store';
import { Grid, Move, Link2, Unlink2, Sparkles, Upload, Loader2, X } from 'lucide-react';
import { ScratchConfig } from '../../../../types';
import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';

const GridTransform: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [localDesc, setLocalDesc] = useState('');

    // Helper to update scratch config
    const updateScratchConfig = (updates: Partial<ScratchConfig>) => {
        updateConfig({
            scratch: {
                ...config.scratch,
                ...updates
            } as ScratchConfig
        });
    };

    const handleGenerate = async () => {
        if (!localDesc.trim()) return;

        setIsGenerating(true);
        try {
            // Grid-specific prompt strategy
            const promptPrefix = "Game UI grid background pattern, ";
            const promptSuffix = ", seamless texture for slot machine grid, neutral, high resolution, game asset, no text, flat 2d style";
            const fullPrompt = `${promptPrefix}${localDesc}${promptSuffix}`;

            console.log('[GridTransform] Generating with prompt:', fullPrompt);

            const result = await enhancedOpenaiClient.generateImage(fullPrompt, {
                quality: 'high',
                size: '1024x1024'
            });

            if (result.imageUrl) {
                updateScratchConfig({
                    layout: {
                        ...config.scratch?.layout,
                        gridBackgroundImage: result.imageUrl
                    } as any
                });
            }
        } catch (error) {
            console.error("Grid generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper for grid transform defaults
    const gridTransform = config.scratch?.layout?.grid || { x: 0, y: 42, scale: 100, scaleX: 87, scaleY: 79, maintainAspectRatio: false };

    return (
        <section className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 space-y-3">
            <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                <Grid className="text-indigo-500" size={14} />
                Grid Layout
            </h3>
            <div className="space-y-3">

                {/* Header / Base Color Row */}
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Grid Layout</label>

                    {/* Compact Grid Color Picker */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Bg Color</span>
                        <div className="relative group cursor-pointer hover:scale-105 active:scale-95">
                            <div
                                className="w-5 h-5 rounded-full border border-white shadow-sm"
                                style={{ background: config.scratch?.layout?.gridBackgroundColor || '#f3f4f6' }}
                            />
                            <input
                                type="color"
                                value={config.scratch?.layout?.gridBackgroundColor || '#f3f4f6'}
                                onChange={(e) => updateScratchConfig({
                                    layout: {
                                        ...config.scratch?.layout,
                                        gridBackgroundColor: e.target.value
                                    } as any
                                })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid Image / Generator */}
                <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm">
                    {/* Header Row */}
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-indigo-50 rounded flex items-center justify-center text-indigo-600">
                                <Sparkles size={12} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-xs">Grid Image</h4>
                        </div>
                        {config.scratch?.layout?.gridBackgroundImage ? (
                            <button
                                onClick={() => updateScratchConfig({
                                    layout: {
                                        ...config.scratch?.layout,
                                        gridBackgroundImage: undefined
                                    } as any
                                })}
                                className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                            >
                                <X size={10} /> Remove
                            </button>
                        ) : (
                            <span className="text-[10px] font-medium text-slate-400">Upload or Generate</span>
                        )}
                    </div>

                    {/* Content Row */}
                    <div className="flex gap-2">
                        {/* Description / Input Area */}
                        <div className="flex-1">
                            <textarea
                                value={localDesc}
                                onChange={(e) => setLocalDesc(e.target.value)}
                                placeholder="Describe grid pattern..."
                                className="w-full h-full min-h-[36px] bg-slate-50 border border-slate-200 rounded p-2 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-400 leading-tight"
                            />
                        </div>

                        {/* Button Stack */}
                        <div className="flex flex-col gap-1.5 w-28 shrink-0">
                            <input
                                type="file"
                                id="grid-upload"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            const result = ev.target?.result as string;
                                            updateScratchConfig({
                                                layout: {
                                                    ...config.scratch?.layout,
                                                    gridBackgroundImage: result
                                                } as any
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                    e.target.value = '';
                                }}
                            />
                            <button
                                onClick={() => document.getElementById('grid-upload')?.click()}
                                className="flex items-center justify-center gap-1.5 w-full py-1 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-[10px] font-bold rounded transition-all shadow-sm"
                            >
                                <Upload size={10} />
                                Choose
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !localDesc.trim()}
                                className={`flex items-center justify-center gap-1.5 w-full py-1 text-white text-[10px] font-bold rounded shadow-sm transition-all
                                    ${isGenerating || !localDesc.trim()
                                        ? 'bg-indigo-300 cursor-not-allowed'
                                        : 'bg-indigo-500 hover:bg-indigo-600 active:scale-95'
                                    }`}
                            >
                                {isGenerating ? (
                                    <Loader2 className="animate-spin" size={10} />
                                ) : (
                                    <Sparkles size={10} />
                                )}
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>

                    {/* Helper Text */}
                    <div className="mt-1.5 flex items-center justify-between text-[9px] text-gray-400 px-0.5">
                        <span>Background behind symbols & foil</span>
                    </div>
                </div>

                {/* Cell Style Toggle (Compact) */}
                <div>
                    <div className="flex bg-gray-50 p-0.5 rounded-lg w-full border border-gray-100">
                        <button
                            onClick={() => updateScratchConfig({
                                layout: {
                                    ...config.scratch?.layout,
                                    cellStyle: 'boxed'
                                } as any
                            })}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${(!config.scratch?.layout?.cellStyle || config.scratch?.layout.cellStyle === 'boxed') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Boxed
                        </button>
                        <button
                            onClick={() => updateScratchConfig({
                                layout: {
                                    ...config.scratch?.layout,
                                    cellStyle: 'transparent'
                                } as any
                            })}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${config.scratch?.layout?.cellStyle === 'transparent' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Transparent
                        </button>
                    </div>
                </div>

                <hr className="border-gray-50" />

                {/* Grid Transform Controls (Compact) */}
                <div>
                    <style>
                        {`
                        input[type=range] {
                            -webkit-appearance: none;
                            width: 100%;
                            background: transparent;
                        }
                        input[type=range]::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            height: 12px;
                            width: 12px;
                            border-radius: 50%;
                            background: #4f46e5;
                            cursor: pointer;
                            margin-top: -5px;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                            transition: transform 0.1s;
                        }
                        input[type=range]::-webkit-slider-thumb:hover {
                            transform: scale(1.2);
                        }
                        input[type=range]::-webkit-slider-runnable-track {
                            width: 100%;
                            height: 2px;
                            cursor: pointer;
                            background: #e2e8f0;
                            border-radius: 1px;
                        }
                        `}
                    </style>

                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Move size={12} /> Position & Scale
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                        {/* Scale Controls */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5">
                                    <label className="text-[10px] font-medium text-gray-500">Scale Grid</label>
                                    <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-[9px] text-gray-500 cursor-pointer border border-gray-100 hover:bg-gray-100"
                                        onClick={() => updateScratchConfig({
                                            layout: {
                                                ...config.scratch?.layout,
                                                grid: {
                                                    ...gridTransform,
                                                    maintainAspectRatio: !gridTransform.maintainAspectRatio
                                                }
                                            } as any
                                        })}
                                    >
                                        {gridTransform.maintainAspectRatio !== false ? (
                                            <><Link2 size={8} /> Locked</>
                                        ) : (
                                            <><Unlink2 size={8} /> Split</>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {gridTransform.maintainAspectRatio !== false ? (
                                /* Uniform Scale */
                                <div>
                                    <div className="flex justify-between mb-0.5">
                                        <span className="text-[9px] text-gray-300">Uniform</span>
                                        <span className="text-[10px] font-mono text-indigo-600 font-bold">{gridTransform.scale || 100}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="150"
                                        value={gridTransform.scale || 100}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            updateScratchConfig({
                                                layout: {
                                                    ...config.scratch?.layout,
                                                    grid: {
                                                        ...gridTransform,
                                                        scale: val,
                                                        scaleX: val, // Sync X
                                                        scaleY: val  // Sync Y
                                                    }
                                                } as any
                                            });
                                        }}
                                        className="w-full"
                                    />
                                </div>
                            ) : (
                                /* Split Scale */
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-[9px] text-gray-400">Width (X)</span>
                                            <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1 rounded">{gridTransform.scaleX || gridTransform.scale || 100}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            value={gridTransform.scaleX || gridTransform.scale || 100}
                                            onChange={(e) => updateScratchConfig({
                                                layout: {
                                                    ...config.scratch?.layout,
                                                    grid: {
                                                        ...gridTransform,
                                                        scaleX: parseInt(e.target.value)
                                                    }
                                                } as any
                                            })}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-[9px] text-gray-400">Height (Y)</span>
                                            <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1 rounded">{gridTransform.scaleY || gridTransform.scale || 100}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            value={gridTransform.scaleY || gridTransform.scale || 100}
                                            onChange={(e) => updateScratchConfig({
                                                layout: {
                                                    ...config.scratch?.layout,
                                                    grid: {
                                                        ...gridTransform,
                                                        scaleY: parseInt(e.target.value)
                                                    }
                                                } as any
                                            })}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="flex justify-between mb-0.5">
                                    <label className="text-[9px] text-gray-400">Offset X</label>
                                    <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1 rounded">{gridTransform.x || 0}</span>
                                </div>
                                <input
                                    type="range"
                                    min="-100"
                                    max="100"
                                    value={gridTransform.x || 0}
                                    onChange={(e) => updateScratchConfig({
                                        layout: {
                                            ...config.scratch?.layout,
                                            grid: {
                                                ...gridTransform,
                                                x: parseInt(e.target.value)
                                            }
                                        } as any
                                    })}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-0.5">
                                    <label className="text-[9px] text-gray-400">Offset Y</label>
                                    <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1 rounded">{gridTransform.y || 0}</span>
                                </div>
                                <input
                                    type="range"
                                    min="-100"
                                    max="100"
                                    value={gridTransform.y || 0}
                                    onChange={(e) => updateScratchConfig({
                                        layout: {
                                            ...config.scratch?.layout,
                                            grid: {
                                                ...gridTransform,
                                                y: parseInt(e.target.value)
                                            }
                                        } as any
                                    })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GridTransform;
