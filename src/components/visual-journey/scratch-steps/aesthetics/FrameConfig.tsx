import React from 'react';
import { useGameStore } from '../../../../store';
import { Image as ImageIcon, Upload, Loader2, Sparkles, X } from 'lucide-react';
import { ScratchConfig } from '../../../../types';
import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';

const FrameConfig: React.FC = () => {
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

    // Helper to update Overlay (Frame)
    const updateOverlay = (data: Partial<any>) => {
        const currentOverlay = config.scratch?.layers?.overlay || {
            zIndex: 40,
            visible: true,
            mascots: [],
            logos: []
        };

        updateScratchConfig({
            layers: {
                ...config.scratch?.layers,
                overlay: {
                    ...currentOverlay,
                    ...data
                }
            } as any
        });
    };

    // Layout Transform Helpers
    const transform = config.scratch?.layout?.transform || {
        x: 0,
        y: 0,
        scale: 100,
        scaleX: 100,
        scaleY: 100,
        maintainAspectRatio: true
    };

    // --- Local State for Smooth Sliders ---
    const [localTransform, setLocalTransform] = React.useState(transform);
    const [localDesc, setLocalDesc] = React.useState<string>(() => {
        // Filter out any base64 image data that might have been accidentally saved
        const initialValue = '';
        return initialValue.startsWith('data:image/') ? '' : initialValue;
    });
    const [isGenerating, setIsGenerating] = React.useState(false);

    // Wrapper function to filter out base64 image data from localDesc
    const setLocalDescSafe = (value: string) => {
        // Filter out base64 image data
        const filteredValue = value.startsWith('data:image/') ? '' : value;
        setLocalDesc(filteredValue);
    };

    // Sync from global store if changed externally
    React.useEffect(() => {
        setLocalTransform(transform);
    }, [transform.x, transform.y, transform.scale, transform.scaleX, transform.scaleY, transform.maintainAspectRatio]);

    // Handle Local Change (Instant UI) + Debounced Global Update
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleLocalChange = (key: string, val: any) => {
        // 1. Instant UI update
        const newTransform = { ...localTransform, [key]: val };

        // Sync X/Y if locked
        if (localTransform.maintainAspectRatio !== false && (key === 'scale' || key === 'scaleX' || key === 'scaleY')) {
            if (typeof val === 'number') {
                newTransform.scale = val;
                newTransform.scaleX = val;
                newTransform.scaleY = val;
            }
        }

        setLocalTransform(newTransform);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            updateScratchConfig({
                layout: {
                    ...config.scratch?.layout,
                    transform: newTransform
                } as any
            });
        }, 5);
    };

    const handleGenerate = async () => {
        if (!localDesc.trim()) return;

        setIsGenerating(true);
        try {
            // Determine Aspect Ratio
            const scaleX = localTransform.scaleX || 100;
            const scaleY = localTransform.scaleY || 100;
            const ratio = scaleX / scaleY;

            let size: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1024';
            let orientationDesc = "square";

            if (ratio < 0.8) {
                size = '1024x1536'; // Portrait
                orientationDesc = "vertical portrait aspect ratio";
            } else if (ratio > 1.2) {
                size = '1536x1024'; // Landscape
                orientationDesc = "horizontal wide aspect ratio";
            }

            // Frame-specific prompt strategy
            const promptPrefix = `Game UI border frame, ${orientationDesc}, `;
            const promptSuffix = ", rectangular frame with transparent center, high resolution, game asset, isolated on black background, detailed borders, no text";
            const fullPrompt = `${promptPrefix}${localDesc}${promptSuffix}`;

            console.log('[FrameConfig] Generating with prompt:', fullPrompt, 'Size:', size);

            // Using enhancedOpenaiClient for generation
            const result = await enhancedOpenaiClient.generateImage(fullPrompt, {
                quality: 'high',
                size: size
            });

            if (result.imageUrl) {
                updateOverlay({ image: result.imageUrl });
            }
        } catch (error) {
            console.error("Frame generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const frameColor = config.scratch?.layers?.overlay?.color || '#F2F0EB';

    return (
        <section className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 space-y-3">
            {/* Header / Base Color Row */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <ImageIcon className="text-indigo-500" size={14} />
                    Frame & Layout
                </h3>

                <div className="flex items-center gap-2">
                    {/* Layer Order Toggle */}
                    <button
                        onClick={() => updateOverlay({ zIndex: (config.scratch?.layers?.overlay?.zIndex || 120) >= 120 ? 10 : 120 })}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${(config.scratch?.layers?.overlay?.zIndex || 120) >= 120
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                        title="Frame Order: Above or Below Foil"
                    >
                        {(config.scratch?.layers?.overlay?.zIndex || 120) >= 120 ? '⬆ Top' : '⬇ Btm'}
                    </button>

                    {/* Eliminate White Toggle */}
                    <button
                        onClick={() => updateOverlay({ blendMode: (config.scratch?.layers?.overlay as any)?.blendMode === 'multiply' ? 'normal' : 'multiply' })}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${(config.scratch?.layers?.overlay as any)?.blendMode === 'multiply'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                        title="Eliminate white background (Multiply Blend)"
                    >
                        {(config.scratch?.layers?.overlay as any)?.blendMode === 'multiply' ? '⚪ No White' : '⚪ Norm'}
                    </button>

                    {/* Silhouette Toggle (Transparent Background) */}
                    <button
                        onClick={() => updateOverlay({ color: frameColor === 'transparent' ? '#F2F0EB' : 'transparent' })}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${frameColor === 'transparent'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                        title="Make card background transparent (Silhouette Mode)"
                    >
                        {frameColor === 'transparent' ? '👻 Silhou' : '⬜ Card'}
                    </button>

                    {/* Compact Base Color Picker */}
                    <div className={`flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 ${frameColor === 'transparent' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Color</span>
                        <div className="relative group cursor-pointer hover:scale-105 active:scale-95">
                            <div
                                className="w-5 h-5 rounded-full border border-white shadow-sm"
                                style={{
                                    background: frameColor === 'transparent' ?
                                        'repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 10px 10px' : frameColor
                                }}
                            />
                            <input
                                type="color"
                                value={frameColor.startsWith('#') ? frameColor : '#F2F0EB'}
                                onChange={(e) => updateOverlay({ color: e.target.value })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Frame Image / Generator */}
            <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm">
                {/* Header Row */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-indigo-50 rounded flex items-center justify-center text-indigo-600">
                            <Sparkles size={12} />
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs">Frame Image</h4>
                    </div>
                    {config.scratch?.layers?.overlay?.image ? (
                        <button
                            onClick={() => {
                                // ATOMIC UPDATE
                                const currentOverlay = config.scratch?.layers?.overlay || {
                                    zIndex: 40,
                                    visible: true,
                                    mascots: [],
                                    logos: []
                                };

                                updateScratchConfig({
                                    layers: {
                                        ...config.scratch?.layers,
                                        overlay: {
                                            ...currentOverlay,
                                            image: undefined
                                        }
                                    } as any,
                                    cardFrame: undefined,
                                    overlay: undefined
                                } as any);
                            }}
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
                            placeholder="Describe style..."
                            className="w-full h-full min-h-[36px] bg-slate-50 border border-slate-200 rounded p-2 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-400 leading-tight"
                        />
                    </div>

                    {/* Button Stack */}
                    <div className="flex flex-col gap-1.5 w-28 shrink-0">
                        <input
                            type="file"
                            id="frame-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const result = ev.target?.result as string;
                                        updateOverlay({ image: result });
                                    };
                                    reader.readAsDataURL(file);
                                }
                                // Reset input so the same file can be selected again
                                e.target.value = '';
                            }}
                        />
                        <button
                            onClick={() => document.getElementById('frame-upload')?.click()}
                            className="w-full py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-sm h-6"
                        >
                            <Upload size={10} />
                            Choose
                        </button>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !localDesc.trim()}
                            className={`w-full py-1 rounded text-[10px] font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all transform h-6
                                ${isGenerating || !localDesc.trim()
                                    ? 'bg-indigo-400 cursor-not-allowed scale-100'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-105'
                                } text-white`}
                        >
                            {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            {isGenerating ? '...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* 3. Position & Scale (Relaxed & Split) */}
            <div className="space-y-3">
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

                {/* X / Y Position Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] items-center">
                            <span className="font-medium text-gray-500">Offset X</span>
                            <span className="font-mono text-indigo-500 bg-indigo-50 px-1 rounded">{localTransform.x}</span>
                        </div>
                        <input
                            type="range"
                            min="-150"
                            max="150"
                            step="1"
                            value={localTransform.x || 0}
                            onChange={(e) => handleLocalChange('x', parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] items-center">
                            <span className="font-medium text-gray-500">Offset Y</span>
                            <span className="font-mono text-indigo-500 bg-indigo-50 px-1 rounded">{localTransform.y}</span>
                        </div>
                        <input
                            type="range"
                            min="-200"
                            max="200"
                            step="1"
                            value={localTransform.y || 0}
                            onChange={(e) => handleLocalChange('y', parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Scale Control (Split/Locked) */}
                <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Scale</label>
                        <button
                            className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded text-[10px] text-gray-500 border border-gray-100 hover:bg-gray-100 transition-colors"
                            onClick={() => handleLocalChange('maintainAspectRatio', !localTransform.maintainAspectRatio)}
                        >
                            {localTransform.maintainAspectRatio !== false ? (
                                <>🔒 Locked</>
                            ) : (
                                <>🔓 Split</>
                            )}
                        </button>
                    </div>

                    {localTransform.maintainAspectRatio !== false ? (
                        /* Uniform Scale */
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] items-center">
                                <span className="font-medium text-gray-500">Uniform</span>
                                <span className="font-bold text-indigo-600">{localTransform.scale || 100}%</span>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="150"
                                value={localTransform.scale || 100}
                                onChange={(e) => handleLocalChange('scale', parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    ) : (
                        /* Split Scale */
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] items-center">
                                    <span className="font-medium text-gray-500">Width (X)</span>
                                    <span className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">{localTransform.scaleX || 100}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="150"
                                    value={localTransform.scaleX || 100}
                                    onChange={(e) => handleLocalChange('scaleX', parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] items-center">
                                    <span className="font-medium text-gray-500">Height (Y)</span>
                                    <span className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">{localTransform.scaleY || 100}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="150"
                                    value={localTransform.scaleY || 100}
                                    onChange={(e) => handleLocalChange('scaleY', parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default FrameConfig;
