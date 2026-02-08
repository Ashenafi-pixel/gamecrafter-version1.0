import React, { useState } from 'react';
import { useGameStore } from '../../../../store';
import { Move, Upload, Type, Sparkles, Loader2, X } from 'lucide-react';
import { ScratchConfig } from '../../../../types';
import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';

const LogoManager: React.FC = () => {
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
            const promptPrefix = "Game Logo, title text graphic, ";
            const promptSuffix = ", high resolution, typography, game branding, isolated on black background, vector style";
            const fullPrompt = `${promptPrefix}${localDesc}${promptSuffix}`;

            console.log('[LogoManager] Generating with prompt:', fullPrompt);

            // Import enhancedOpenaiClient if not already imported at top
            const result = await enhancedOpenaiClient.generateImage(fullPrompt, {
                quality: 'high',
                size: '1024x1024'
            });

            if (result.imageUrl) {
                updateScratchConfig({
                    logo: {
                        ...config.scratch?.logo,
                        type: 'image',
                        image: result.imageUrl,
                        scale: config.scratch?.logo?.scale || 100,
                        position: 'custom',
                        customPosition: config.scratch?.logo?.customPosition || { x: 0, y: 0 } // Center by default
                    } as any
                });
            }
        } catch (error) {
            console.error("Logo generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const currentLayout = config.scratch?.logo?.layout || 'integrated';

    return (
        <section className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 space-y-3">
            {/* Header / Layout Mode Row */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <Type className="text-indigo-500" size={14} />
                    Game Logo
                </h3>

                {/* Layout Mode Toggles */}
                <div className="flex bg-slate-50 p-0.5 rounded border border-slate-200">
                    <button
                        onClick={() => updateScratchConfig({ logo: { ...config.scratch?.logo, layout: 'integrated' } as any })}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${currentLayout === 'integrated' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Clipped Inside Card"
                    >
                        Index
                    </button>
                    <button
                        onClick={() => updateScratchConfig({ logo: { ...config.scratch?.logo, layout: 'floating' } as any })}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${currentLayout === 'floating' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Free Floating"
                    >
                        Float
                    </button>
                    <button
                        onClick={() => updateScratchConfig({ logo: { ...config.scratch?.logo, layout: 'pop-out' } as any })}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${currentLayout === 'pop-out' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Extends Outside Border"
                    >
                        Pop-out
                    </button>
                </div>
            </div>

            {/* Logo Image / Generator */}
            <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm">
                {/* Header Row */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-indigo-50 rounded flex items-center justify-center text-indigo-600">
                            <Sparkles size={12} />
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs">Logo Image</h4>
                    </div>
                    {config.scratch?.logo?.image ? (
                        <button
                            onClick={() => updateScratchConfig({
                                logo: { ...config.scratch?.logo, image: undefined, type: 'none' } as any
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
                            placeholder="Describe logo style..."
                            className="w-full h-full min-h-[36px] bg-slate-50 border border-slate-200 rounded p-2 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-400 leading-tight"
                        />
                    </div>

                    {/* Button Stack */}
                    <div className="flex flex-col gap-1.5 w-28 shrink-0">
                        <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const result = ev.target?.result as string;
                                        updateScratchConfig({
                                            logo: {
                                                ...config.scratch?.logo,
                                                type: 'image',
                                                image: result,
                                                layout: currentLayout,
                                                scale: 100, // Ensure visible scale
                                                position: 'custom',
                                                customPosition: { x: 0, y: 0 } // Center explicitly
                                            } as any
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                }
                                e.target.value = '';
                            }}
                        />
                        <button
                            onClick={() => document.getElementById('logo-upload')?.click()}
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
                            {isGenerating ? 'Gen...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Logo Transform Controls (Compact) */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Move size={10} /> Transform
                    </label>

                    {/* Stroke Color Picker (Only for Pop-out) */}
                    {currentLayout === 'pop-out' && (
                        <div className="flex items-center gap-1.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            <span className="text-[8px] font-bold text-gray-400 uppercase">Stroke</span>

                            {/* Auto Toggle */}
                            <button
                                onClick={() => updateScratchConfig({
                                    logo: { ...config.scratch?.logo, autoStroke: !config.scratch?.logo?.autoStroke } as any
                                })}
                                className={`px-1 rounded text-[8px] font-bold border transition-all ${config.scratch?.logo?.autoStroke
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                    }`}
                                title="Match Frame Color"
                            >
                                Auto
                            </button>

                            {/* Color Picker (Conditional) */}
                            {!config.scratch?.logo?.autoStroke && (
                                <div className="relative group cursor-pointer ml-0.5">
                                    <div
                                        className="w-3 h-3 rounded-full border border-white shadow-sm"
                                        style={{ background: config.scratch?.logo?.strokeColor || '#ffffff' }}
                                    />
                                    <input
                                        type="color"
                                        value={config.scratch?.logo?.strokeColor || '#ffffff'}
                                        onChange={(e) => updateScratchConfig({
                                            logo: { ...config.scratch?.logo, strokeColor: e.target.value } as any
                                        })}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {/* Scale */}
                    <div className="col-span-2 flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 w-8">Scale</span>
                        <input
                            type="range"
                            min="20"
                            max="200"
                            value={config.scratch?.logo?.scale || 100}
                            onChange={(e) => updateScratchConfig({
                                logo: { ...config.scratch?.logo, scale: parseInt(e.target.value) } as any
                            })}
                            className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                        />
                        <span className="text-[9px] font-mono text-gray-500 w-6 text-right">{config.scratch?.logo?.scale || 100}%</span>
                    </div>

                    {/* X */}
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 w-4">X</span>
                        <input
                            type="range"
                            min="-300"
                            max="300"
                            value={config.scratch?.logo?.customPosition?.x || 0}
                            onChange={(e) => updateScratchConfig({
                                logo: {
                                    ...config.scratch?.logo,
                                    customPosition: {
                                        x: parseInt(e.target.value),
                                        y: config.scratch?.logo?.customPosition?.y || 0
                                    }
                                } as any
                            })}
                            className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>

                    {/* Y */}
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 w-4">Y</span>
                        <input
                            type="range"
                            min="-400"
                            max="400"
                            value={config.scratch?.logo?.customPosition?.y || 0}
                            onChange={(e) => updateScratchConfig({
                                logo: {
                                    ...config.scratch?.logo,
                                    customPosition: {
                                        x: config.scratch?.logo?.customPosition?.x || 0,
                                        y: parseInt(e.target.value)
                                    }
                                } as any
                            })}
                            className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LogoManager;
