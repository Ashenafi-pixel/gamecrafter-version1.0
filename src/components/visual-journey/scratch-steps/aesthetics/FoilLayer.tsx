import React, { useState } from 'react';
import { useGameStore } from '../../../../store';
import { ScratchConfig } from '../../../../types';
import { Layers, Palette, Sparkles, Loader2, Upload, X } from 'lucide-react';
import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';
import { motion } from 'framer-motion';

const FoilLayer: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [localDesc, setLocalDesc] = useState(() => {
        // Filter out any base64 image data that might have been accidentally saved
        const initialValue = '';
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

    // Helper to update Foil Layer
    const updateFoil = (data: Partial<any>) => {
        const currentFoil = config.scratch?.layers?.foil || {
            zIndex: 30,
            visible: true,
            texture: 'silver',
            opacity: 1,
            revealMode: 'brush'
        };

        updateScratchConfig({
            layers: {
                ...config.scratch?.layers,
                foil: {
                    ...currentFoil,
                    ...data
                }
            } as any
        });
    };

    const handleGenerate = async () => {
        if (!localDesc.trim()) return;

        setIsGenerating(true);
        try {
            const promptPrefix = "Scratch card foil texture, seamless pattern, ";
            const promptSuffix = ", metallic surface, high resolution, material texture, flat lighting, 8k, game asset";
            const fullPrompt = `${promptPrefix}${localDesc}${promptSuffix}`;

            console.log('[FoilLayer] Generating with prompt:', fullPrompt);

            // Import enhancedOpenaiClient if not already imported at top
            const result = await enhancedOpenaiClient.generateImage(fullPrompt, {
                quality: 'high',
                size: '1024x1024'
            });

            if (result.imageUrl) {
                updateFoil({
                    image: result.imageUrl,
                    texture: 'custom',
                    color: '#ffffff', // Reset tint
                });
            }
        } catch (error) {
            console.error("Foil generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Carousel Logic (Match BackgroundConfig) ---
    const constraintsRef = React.useRef<HTMLDivElement>(null);

    const PRESETS = [
        { id: 'silver', label: 'Silver', color: '#C0C0C0', finish: 'metal', type: 'gradient', value: 'linear-gradient(135deg, #E0E0E0 0%, #A0A0A0 50%, #FFFFFF 100%)' },
        { id: 'gold', label: 'Gold', color: '#FFD700', finish: 'metal', type: 'gradient', value: 'linear-gradient(135deg, #FFD700 0%, #FDB931 50%, #FFFFFF 100%)' },
        { id: 'platinum', label: 'Platinum', color: '#E5E4E2', finish: 'metal', type: 'gradient', value: 'linear-gradient(135deg, #E5E4E2 0%, #BFC0C2 50%, #FFFFFF 100%)' },
        { id: 'rose-gold', label: 'Rose Gold', color: '#B76E79', finish: 'metal', type: 'gradient', value: 'linear-gradient(135deg, #F4C4C2 0%, #B76E79 50%, #FFFFFF 100%)' },
        { id: 'copper', label: 'Copper', color: '#B87333', finish: 'metal', type: 'gradient', value: 'linear-gradient(135deg, #B87333 0%, #8A5A44 50%, #FFFFFF 100%)' },
        { id: 'holographic', label: 'Holo', color: '#E0E0E0', finish: 'glossy', type: 'gradient', value: 'linear-gradient(135deg, #FF0000 0%, #FF9900 15%, #FFFF00 30%, #33FF00 50%, #0099FF 70%, #6600FF 85%, #CC00FF 100%)' },
        { id: 'latex', label: 'Latex', color: '#333333', finish: 'matte', type: 'color', value: '#333333' },
        { id: 'sand', label: 'Sand', color: '#E6D095', finish: 'matte', type: 'color', value: '#E6D095' },
        { id: 'carbon', label: 'Carbon', color: '#1A1A1A', finish: 'matte', type: 'color', value: '#1A1A1A' },
    ];

    return (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Layers className="text-indigo-500" size={20} />
                Foil Layer
            </h3>

            {/* 1. Presets Carousel (Match BackgroundConfig Style) */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">Quick Presets</label>

                <div ref={constraintsRef} className="overflow-hidden w-full px-1 py-1">
                    <motion.div
                        className="flex gap-3 w-max cursor-grab active:cursor-grabbing px-1"
                        drag="x"
                        dragConstraints={constraintsRef}
                        dragElastic={0.1}
                        whileTap={{ cursor: "grabbing" }}
                    >
                        {PRESETS.map(preset => {
                            const isActive = config.scratch?.layers?.foil?.texture === preset.id && !config.scratch?.layers?.foil?.image;

                            return (
                                <motion.button
                                    key={preset.id}
                                    whileHover={{ scale: 1.05, y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => updateFoil({
                                        texture: preset.id,
                                        color: preset.color,
                                        image: undefined
                                    })}
                                    className="flex-shrink-0 flex flex-col items-center gap-1.5 group w-14"
                                >
                                    <div
                                        className={`w-14 h-14 rounded-lg shadow-sm border transition-all relative overflow-hidden ${isActive ? 'border-indigo-500' : 'border-slate-100 group-hover:border-slate-300'
                                            }`}
                                        style={{
                                            background: preset.value || preset.color
                                        }}
                                    >
                                        {/* Active Indicator Overlay */}
                                        {isActive && (
                                            <div className="absolute inset-0 border-2 border-indigo-600 rounded-lg bg-indigo-900/10 flex items-center justify-center">
                                                {/* Dot removed as per request */}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-bold truncate w-full text-center ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                                        }`}>
                                        {preset.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </div>
            </div>

            {/* 2. Custom Foil (Color & Image) */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Palette size={14} /> Custom Appearance
                    </span>
                    {config.scratch?.layers?.foil?.image && (
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                            Custom Image Active
                        </span>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Base Color Picker */}
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Base Color</label>
                        {/* Added relative class here to contain the absolute input */}
                        <div className="relative flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors">
                            <div
                                className="w-4 h-4 rounded-full border border-gray-100 shadow-inner"
                                style={{ background: config.scratch?.layers?.foil?.color || '#C0C0C0' }}
                            />
                            <input
                                type="color"
                                value={config.scratch?.layers?.foil?.color || '#C0C0C0'}
                                onChange={(e) => updateFoil({ color: e.target.value, texture: 'custom' })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <span className="text-[10px] font-mono text-gray-500 uppercase">{config.scratch?.layers?.foil?.color || '#C0C0C0'}</span>
                        </div>
                    </div>

                    {/* Image Generator / Upload */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Texture Image</span>
                            {config.scratch?.layers?.foil?.image && (
                                <button
                                    onClick={() => updateFoil({ image: undefined, texture: 'silver', color: '#C0C0C0' })} // Revert to silver
                                    className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-0.5 rounded flex items-center gap-1"
                                >
                                    <X size={10} /> Reset
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={localDesc}
                                onChange={(e) => setLocalDescSafe(e.target.value)}
                                placeholder="Describe texture (e.g. brushed metal, gold coins)..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded text-[10px] px-2 py-1 outline-none focus:border-indigo-500"
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !localDesc.trim()}
                                    className={`w-8 h-8 flex items-center justify-center rounded text-white transition-all ${isGenerating ? 'bg-indigo-300' : 'bg-indigo-500 hover:bg-indigo-600'
                                        }`}
                                    title="Generate AI Texture"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                </button>
                                <input
                                    type="file"
                                    id="foil-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                const result = ev.target?.result as string;
                                                updateFoil({ image: result, texture: 'custom' });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                        e.target.value = ''; // Reset
                                    }}
                                />
                                <button
                                    onClick={() => document.getElementById('foil-upload')?.click()}
                                    className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                                    title="Upload Texture"
                                >
                                    <Upload size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



        </section>
    );
};

export default FoilLayer;
