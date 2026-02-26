import React, { useState, useRef, useEffect } from 'react';

import { useGameStore } from '../../../../store';

import { motion } from 'framer-motion';

import { Image as ImageIcon, Upload, Loader2, X } from 'lucide-react';

import { ScratchConfig } from '../../../../types';

import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';



const BACKGROUND_PRESETS = [

    { id: 'carbon', label: 'Carbon', value: 'repeating-linear-gradient(45deg, #2b2b2b 0px, #2b2b2b 10px, #222 10px, #222 20px)', type: 'color' },

    { id: 'wood', label: 'Wood', value: '#5d4037', type: 'color' },

    { id: 'gold', label: 'Gold', value: 'linear-gradient(135deg, #ffd700, #fdb931)', type: 'color' },

    { id: 'emerald', label: 'Emerald', value: 'linear-gradient(to right, #11998e, #38ef7d)', type: 'color' },

    { id: 'ocean', label: 'Ocean', value: 'linear-gradient(to bottom, #0ea5e9, #2563eb)', type: 'color' },

    { id: 'midnight', label: 'Midnight', value: '#0f172a', type: 'color' },

    { id: 'nebula', label: 'Nebula', value: 'linear-gradient(to right, #2b003e, #1a0b2e)', type: 'color' },

    { id: 'amethyst', label: 'Amethyst', value: 'linear-gradient(135deg, #9d50bb, #6e48aa)', type: 'color' },

    { id: 'cyberpunk', label: 'Neon', value: 'linear-gradient(to bottom, #ff00cc, #333399)', type: 'color' },

    { id: 'sunset', label: 'Sunset', value: 'linear-gradient(to top, #f97316, #db2777)', type: 'color' },

    { id: 'fire', label: 'Fire', value: 'linear-gradient(to top, #f12711, #f5af19)', type: 'color' },

    { id: 'royal', label: 'Royal', value: '#4c0519', type: 'color' },

    { id: 'casino', label: 'Felt', value: '#064e3b', type: 'color' },

    { id: 'noir', label: 'Noir', value: 'linear-gradient(to bottom, #000000, #434343)', type: 'color' },

    { id: 'concrete', label: 'Concrete', value: '#94a3b8', type: 'color' },

    { id: 'peachy', label: 'Peachy', value: 'linear-gradient(to right, #ed4264, #ffedbc)', type: 'color' },

];



const BackgroundConfig: React.FC = () => {

    const { config, updateConfig } = useGameStore();



    // Helper to update scratch config

    const updateScratchConfig = (updates: Partial<ScratchConfig>) => {

        updateConfig({

            scratch: {

                ...config.scratch,

                ...updates

            } as ScratchConfig

        });

    };



    // Helper to update Layers (v2 Architecture)

    const updateLayer = (layerName: 'scene' | 'card' | 'shape' | 'foil' | 'overlay', data: Partial<any>) => {

        const currentLayers = config.scratch?.layers || {

            scene: { zIndex: 0, visible: true, type: 'color', value: '#1a1a1a' },

            card: { zIndex: 10, visible: true, type: 'color', value: '#ffffff' },

            shape: { zIndex: 20, visible: true, shape: 'rectangle', padding: 20 },

            foil: { zIndex: 30, visible: true, texture: 'silver', opacity: 1, revealMode: 'brush' },

            overlay: { zIndex: 40, visible: true, mascots: [], logos: [] }

        };



        updateScratchConfig({

            layers: {

                ...currentLayers,

                [layerName]: {

                    ...currentLayers[layerName],

                    ...data

                } as any

            }

        });

    };



    // Helper to update legacy Background

    const updateBackground = (value: string, type: 'color' | 'image' = 'image') => {

        updateScratchConfig({

            background: {

                type,

                value

            }

        });

        // Also sync to Layer 0

        updateLayer('scene', { type, value });

    };



    // --- Render Logic ---

    // Fallback to layers.scene to ensure we see what the Preview sees

    // NOTE: Preview checks layers.scene FIRST, so we must too!

    const bgValue = config.scratch?.layers?.scene?.value || config.scratch?.background?.value || '';

    const bgType = config.scratch?.layers?.scene?.type || config.scratch?.background?.type;



    // Robust Image Mode Check:

    // 1. Explicit type is 'image'

    // 2. OR Value is a URL (http/https)

    // 3. OR Value is a Data URI (data:image)

    // 4. AND Value is NOT a gradient or simple color hex

    const isUrlOrData = bgValue.startsWith('http') || bgValue.startsWith('data:image') || bgValue.startsWith('/');

    const isImageMode = bgType === 'image' || isUrlOrData;

    const isColorValue = bgValue.startsWith('#') || bgValue.includes('gradient') || bgValue.startsWith('rgb');



    // Show value if explicitly in image mode, OR if the current value doesn't look like a color/gradient

    // This allows the user to see what they are typing even if 'type' hasn't updated yet, 

    // while hiding the nasty gradient CSS strings.

    const inputValue = (isImageMode || !isColorValue) ? bgValue : '';



    // --- Local State for Input (Fixes typing freeze) ---

    const [localDesc, setLocalDesc] = useState<string>(() => {

        // Filter out any base64 image data that might have been accidentally saved

        return inputValue.startsWith('data:image/') ? '' : inputValue;

    });

    const [isGenerating, setIsGenerating] = useState(false);



    // Wrapper function to filter out base64 image data from localDesc

    const setLocalDescSafe = (value: string) => {

        // Filter out base64 image data

        const filteredValue = value.startsWith('data:image/') ? '' : value;

        setLocalDesc(filteredValue);

    };



    // Sync local state when external store changes (e.g. picking a preset)

    React.useEffect(() => {

        setLocalDescSafe(inputValue);

    }, [inputValue]);



    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {

        const newVal = e.target.value;

        setLocalDescSafe(newVal); // Immediate local update with filtering

        updateBackground(newVal, 'image'); // Global store update

    };



    const handleGenerate = async () => {

        if (!localDesc.trim()) return;



        setIsGenerating(true);

        try {

            // Dynamic Composition based on Card Position

            const layoutX = config.scratch?.layout?.transform?.x ?? 50;

            let compositionPrompt = "vignetted composition, central negative space for game board";



            if (layoutX > 60) {

                // Card is on the RIGHT -> Keep Right side empty

                compositionPrompt = "asymmetrical composition, negative space on the right side for overlay, heavy details on the left";

            } else if (layoutX < 40) {

                // Card is on the LEFT -> Keep Left side empty

                compositionPrompt = "asymmetrical composition, negative space on the left side for overlay, heavy details on the right";

            }



            // Sandwich Method Strategy

            const promptPrefix = "High-end mobile game background, aesthetic casino scratch card wallpaper, ";

            const promptSuffix = `, unreal engine 5 render, 8k, vibrant colors, smooth gradient depth, soft lighting, ${compositionPrompt}, no text, no interface elements`;



            const fullPrompt = `${promptPrefix}${localDesc}${promptSuffix}`;



            console.log('[BackgroundConfig] Generating with prompt:', fullPrompt);



            // Using enhancedOpenaiClient for generation

            const result = await enhancedOpenaiClient.generateImage(fullPrompt, {

                quality: 'high',

                size: '1024x1536' // Portrait (Supported by API)

            });



            if (result.imageUrl) {

                updateBackground(result.imageUrl, 'image');

            }

        } catch (error) {

            console.error("Background generation failed:", error);

            // In a real app we'd show a toast here

        } finally {

            setIsGenerating(false);

        }

    };



    return (

        <div className="flex flex-col h-auto w-full bg-slate-50 relative pb-2 p-1">

            {/* Centered Header */}

            <div className="text-center pt-2 pb-1 z-10">

                <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase">

                    Card Background

                </h2>

            </div>



            <section className="bg-transparent max-w-2xl mx-auto w-full flex flex-col gap-2">



                {/* 1. Base Color (Compact) */}

                <div className="flex items-center gap-2 justify-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm mx-auto w-full max-w-md">

                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Base Color</span>

                    <div className="relative group cursor-pointer transition-transform hover:scale-110 active:scale-95">

                        <div

                            className="w-8 h-8 rounded-full border-2 border-white shadow-md"

                            style={{

                                background: isColorValue ? bgValue : '#ffffff'

                            }}

                        />

                        <input

                            type="color"

                            value={isColorValue && !bgValue.includes('gradient') ? bgValue : '#ffffff'}

                            onChange={(e) => updateBackground(e.target.value, 'color')}

                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"

                        />

                        <div className="absolute inset-0 rounded-full ring-1 ring-gray-200 pointer-events-none" />

                    </div>

                </div>



                {/* 2. Wallpaper Image Card (Compact) */}

                <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm">

                    {/* 1. Prompt Input (Larger) */}

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

                        <div className="flex justify-between items-center mb-4">

                            <div className="flex items-center gap-3">

                                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg">

                                    <ImageIcon size={24} />

                                </div>

                                <div>

                                    <h3 className="font-bold text-gray-900 text-lg">Card Background</h3>

                                    <p className="text-sm text-gray-500">Choose a color, gradient, or generate an AI scene.</p>

                                </div>

                            </div>

                            {isImageMode && bgValue ? (

                                <button

                                    onClick={() => {

                                        // ATOMIC UPDATE

                                        updateScratchConfig({

                                            layers: {

                                                ...config.scratch?.layers,

                                                scene: {

                                                    ...config.scratch?.layers?.scene,

                                                    value: ''

                                                }

                                            } as any,

                                            background: undefined

                                        } as any);

                                    }}

                                    className="text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"

                                >

                                    <X size={14} /> Remove

                                </button>

                            ) : (

                                <span className="text-[10px] font-medium text-slate-400">Upload or Generate</span>

                            )}

                        </div>



                        {/* Content Row */}

                        <div className="flex gap-3 h-24">

                            <textarea

                                value={localDesc}

                                onChange={handleTextChange}

                                placeholder="Describe your background (e.g., 'mystical forest, glowing runes, ancient trees')"

                                className="flex-1 p-3 border border-slate-200 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 resize-none h-full transition-shadow focus:shadow-sm"

                            />

                            <div className="flex flex-col gap-2 w-32 shrink-0 h-full">

                                <input

                                    type="file"

                                    id="bg-upload"

                                    accept="image/*"

                                    className="hidden"

                                    onChange={(e) => {

                                        const file = e.target.files?.[0];

                                        if (file) {

                                            const reader = new FileReader();

                                            reader.onload = (ev) => {

                                                const result = ev.target?.result as string;

                                                updateBackground(result, 'image');

                                            };

                                            reader.readAsDataURL(file);

                                        }

                                        e.target.value = '';

                                    }}

                                />

                                <button

                                    onClick={() => document.getElementById('bg-upload')?.click()}

                                    className="flex-1 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"

                                >

                                    <Upload size={14} />

                                    Choose

                                </button>

                                <button

                                    onClick={handleGenerate}

                                    disabled={isGenerating || !localDesc.trim()}

                                    className={`flex-1 w-full rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 transition-all ${isGenerating

                                        ? 'bg-purple-300 cursor-not-allowed'

                                        : 'bg-purple-600 hover:bg-purple-700 shadow-sm hover:shadow-purple-200'

                                        }`}

                                >

                                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}

                                    Generate

                                </button>

                            </div>

                        </div>

                    </div>



                </div>



                {/* Presets - Horizontal Carousel (Draggable) */}

                <div>

                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Quick Presets</h4>



                    {/* Carousel Container */}

                    <div className="w-full overflow-hidden cursor-grab active:cursor-grabbing">

                        <motion.div

                            className="flex gap-4 pb-4 px-1"

                            drag="x"

                            dragConstraints={{ right: 0, left: -1200 }}

                            dragElastic={0.1}

                            whileTap={{ cursor: "grabbing" }}

                        >

                            {BACKGROUND_PRESETS.map((preset) => (

                                <motion.button

                                    key={preset.id}

                                    whileHover={{ scale: 1.05 }}

                                    whileTap={{ scale: 0.95 }}

                                    onClick={() => {

                                        updateBackground(preset.value, 'color');

                                        setLocalDesc(preset.value);

                                    }}

                                    className="group relative flex flex-col items-center gap-3 p-2 hover:bg-slate-100/50 rounded-xl transition-all flex-shrink-0"

                                >

                                    <div

                                        className="w-20 h-20 rounded-[22px] shadow-sm ring-1 ring-black/5 transition-all"

                                        style={{ background: preset.value }}

                                    />

                                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800">{preset.label}</span>

                                </motion.button>

                            ))}

                        </motion.div>

                    </div>

                </div>

            </section >

        </div >

    );

};



export default BackgroundConfig;

