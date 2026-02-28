import React, { useState } from 'react';
import { useGameStore } from '../../../../store';
import { Move, Upload, Ghost, Sparkles, X, Loader2 } from 'lucide-react';
import { ScratchConfig } from '../../../../types';
import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';

const MascotManager: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [localDesc, setLocalDesc] = useState(() => {
        // Filter out any base64 image data that might have been accidentally saved
        const initialValue = config.scratch?.mascot?.image || '';
        return initialValue.startsWith('data:image/') ? '' : initialValue;
    });

    // Wrapper function to filter out base64 image data from localDesc
    const setLocalDescSafe = (value: string) => {
        // Filter out base64 image data
        const filteredValue = value.startsWith('data:image/') ? '' : value;
        setLocalDesc(filteredValue);
    };

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
            const prompt = `Game mascot character, ${localDesc}, transparent background, cute style, sticker art, high quality game asset, centered`;

            console.log('[MascotManager] Generating with prompt:', prompt);

            const result = await enhancedOpenaiClient.generateImage(prompt, {
                quality: 'low',
                size: '1024x1024'
            });

            if (result.imageUrl) {
                updateScratchConfig({
                    mascot: {
                        ...config.scratch?.mascot,
                        type: 'image',
                        image: result.imageUrl,
                        scale: config.scratch?.mascot?.scale || 100,
                        position: 'custom',
                        customPosition: { x: 0, y: 0 } // Center by default
                    } as any
                });
            }
        } catch (error) {
            console.error("Mascot generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const mascotConfig = config.scratch?.mascot || {
        type: 'none',
        scale: 100,
        position: 'custom',
        customPosition: { x: 0, y: 0 },
        animation: 'idle'
    };

    return (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Ghost className="text-pink-500" size={20} />
                Mascot Companion
            </h3>
            <div className="space-y-6">

                {/* Mascot Image / Generator */}
                <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm">
                    {/* Header Row */}
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-pink-50 rounded flex items-center justify-center text-pink-600">
                                <Sparkles size={12} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-xs">Mascot Image</h4>
                        </div>
                        {mascotConfig.image ? (
                            <button
                                onClick={() => updateScratchConfig({
                                    mascot: { ...mascotConfig, image: undefined, type: 'none' } as any
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
                                onChange={(e) => setLocalDescSafe(e.target.value)}
                                placeholder="Describe mascot (e.g. Cute golden star with happy face)..."
                                className="w-full h-full min-h-[36px] bg-slate-50 border border-slate-200 rounded p-2 text-[10px] focus:ring-1 focus:ring-pink-500 outline-none resize-none placeholder:text-slate-400 leading-tight"
                            />
                        </div>

                        {/* Button Stack */}
                        <div className="flex flex-col gap-1.5 w-28 shrink-0">
                            <input
                                type="file"
                                id="mascot-upload"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            const result = ev.target?.result as string;
                                            updateScratchConfig({
                                                mascot: {
                                                    ...mascotConfig,
                                                    type: 'image',
                                                    image: result,
                                                    customPosition: { x: 0, y: 0 } // Reset to center
                                                } as any
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                    e.target.value = '';
                                }}
                            />
                            <button
                                onClick={() => document.getElementById('mascot-upload')?.click()}
                                className="flex-1 flex items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-[9px] font-bold transition-colors py-1.5"
                            >
                                <Upload size={10} />
                                Choose File
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !localDesc.trim()}
                                className={`flex-1 flex items-center justify-center gap-1 rounded text-[9px] font-bold text-white transition-all py-1.5 shadow-sm
                                    ${isGenerating ? 'bg-pink-300' : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'}
                                `}
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={10} /> : <Sparkles size={10} />}
                                {isGenerating ? 'Creating...' : 'Generate AI'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Animation Preset */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Idle Animation</label>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        {['idle', 'bounce', 'float', 'wave'].map((anim) => (
                            <button
                                key={anim}
                                onClick={() => updateScratchConfig({
                                    mascot: { ...mascotConfig, animation: anim as any }
                                })}
                                className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${mascotConfig.animation === anim ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {anim}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mascot Transform */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Move size={16} /> Position & Scale
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-gray-500">Scale</label>
                                <span className="text-xs font-mono text-gray-500">{mascotConfig.scale}%</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="200"
                                value={mascotConfig.scale}
                                onChange={(e) => updateScratchConfig({
                                    mascot: {
                                        ...mascotConfig,
                                        scale: parseInt(e.target.value)
                                    } as any
                                })}
                                className="w-full accent-pink-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs text-gray-500">Position X</label>
                                    <span className="text-xs font-mono text-gray-500">{mascotConfig.customPosition?.x || 0}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="-400"
                                    max="400"
                                    value={mascotConfig.customPosition?.x || 0}
                                    onChange={(e) => updateScratchConfig({
                                        mascot: {
                                            ...mascotConfig,
                                            customPosition: {
                                                x: parseInt(e.target.value),
                                                y: mascotConfig.customPosition?.y || 0
                                            }
                                        } as any
                                    })}
                                    className="w-full accent-pink-500"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs text-gray-500">Position Y</label>
                                    <span className="text-xs font-mono text-gray-500">{mascotConfig.customPosition?.y || 0}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="-400"
                                    max="400"
                                    value={mascotConfig.customPosition?.y || 0}
                                    onChange={(e) => updateScratchConfig({
                                        mascot: {
                                            ...mascotConfig,
                                            customPosition: {
                                                x: mascotConfig.customPosition?.x || 0,
                                                y: parseInt(e.target.value)
                                            }
                                        } as any
                                    })}
                                    className="w-full accent-pink-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default MascotManager;
