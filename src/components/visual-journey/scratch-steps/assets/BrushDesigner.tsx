import React from 'react';
import { useGameStore } from '../../../../store';
import { ScratchConfig } from '../../../../types';
import { motion } from 'framer-motion';
import { Brush, Sparkles, Zap, PartyPopper, Upload } from 'lucide-react';
import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';
import { useSuccessPopup, useWarningPopup } from '../../../popups';

const Step2C_ScratchBrush: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const brushConfig = config.scratch?.brush || { size: 40, tipType: 'coin', hardness: 0.8, customBrushes: [], revealThreshold: 0.95 };
    const customBrushes = brushConfig.customBrushes || [];

    // AI Generation State
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [prompt, setPrompt] = React.useState('');
    const { showSuccess } = useSuccessPopup();
    const { showWarning } = useWarningPopup();

    const updateBrush = (updates: any) => {
        updateConfig({
            scratch: {
                ...config.scratch,
                brush: { ...brushConfig, ...updates }
            } as ScratchConfig
        });
    };

    const addCustomBrush = (url: string, label: string) => {
        const newBrush = { id: `custom-${Date.now()}`, url, label };
        const updatedCustomBrushes = [...customBrushes, newBrush];

        updateConfig({
            scratch: {
                ...config.scratch,
                brush: {
                    ...brushConfig,
                    tipType: 'custom' as any,
                    customTipImage: url,
                    customBrushes: updatedCustomBrushes
                } as any
            } as ScratchConfig
        });
    };

    const generateScratcher = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const result = await enhancedOpenaiClient.generateImageWithConfig({
                prompt: `A high quality, isolated scratcher tool icon. Style: 3D Render, shiny, premium game asset. Object: ${prompt}. Isolated on white background.`,
                targetSymbolId: 'scratcher',
                gameId: config.gameId || 'temp_scratch',
                count: 1,
                size: '1024x1024'
            });

            if (result && result.success && result.images && result.images.length > 0) {
                addCustomBrush(result.images[0], prompt);
                showSuccess('Scratcher Generated', 'Your custom tool is ready!');
            } else {
                showWarning('Generation Failed', 'Could not generate scratcher.');
            }
        } catch (error) {
            console.error("Scratcher Gen Error:", error);
            showWarning('Error', 'AI generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const DEFAULT_BRUSH_TYPES = [
        { id: 'coin', label: 'Coin', icon: '🪙', desc: 'Classic coin scratch' },
        { id: 'finger', label: 'Finger', icon: '👆', desc: 'Touch interaction' },
        { id: 'wand', label: 'Magic Wand', icon: '🪄', desc: 'Sparkle reveal' },
        { id: 'eraser', label: 'Eraser', icon: '🧼', desc: 'Clean wipe' }
    ];

    // Combine default and custom brushes for the carousel
    const allBrushes = [
        ...[...customBrushes].reverse().map((b: any) => ({
            id: b.id,
            label: b.label || 'Custom',
            icon: <img src={b.url} alt="Custom" className="w-8 h-8 object-contain" />,
            desc: 'Custom brush',
            isCustom: true,
            url: b.url
        })),
        ...DEFAULT_BRUSH_TYPES
    ];

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                addCustomBrush(dataUrl, 'Uploaded Brush');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-full mx-auto space-y-3">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center w-full"
            >
                <div className="flex items-center justify-center gap-2 mb-0.5">
                    <Brush className="text-purple-600" size={18} />
                    <h2 className="text-lg font-bold text-gray-900">Brush & Interaction</h2>
                </div>
            </motion.div>

            {/* 1. HORIZONTAL CAROUSEL: Brush Types */}
            <div className="relative">
                <div
                    className="flex gap-4 overflow-x-auto pt-4 pb-4 -mx-2 px-6 custom-scrollbar w-full cursor-grab active:cursor-grabbing pr-20"
                    onMouseDown={(e) => {
                        const slider = e.currentTarget;
                        let isDown = true;
                        let startX = e.pageX - slider.offsetLeft;
                        let scrollLeft = slider.scrollLeft;

                        const onMove = (mv: MouseEvent) => {
                            if (!isDown) return;
                            mv.preventDefault();
                            const x = mv.pageX - slider.offsetLeft;
                            const walk = (x - startX) * 2; // scroll-fast
                            slider.scrollLeft = scrollLeft - walk;
                        };

                        const onUp = () => {
                            isDown = false;
                            slider.removeEventListener('mousemove', onMove as any);
                        };

                        slider.addEventListener('mousemove', onMove as any);
                        slider.addEventListener('mouseup', onUp);
                        slider.addEventListener('mouseleave', onUp);
                    }}
                >
                    {allBrushes.map((type: any) => {
                        const isActive = type.isCustom
                            ? (brushConfig.tipType === 'custom' && brushConfig.customTipImage === type.url)
                            : (brushConfig.tipType === type.id);

                        return (
                            <button
                                key={type.id}
                                onClick={() => {
                                    if (type.isCustom) {
                                        updateBrush({ tipType: 'custom', customTipImage: type.url });
                                    } else {
                                        updateBrush({ tipType: type.id as any, customTipImage: undefined });
                                    }
                                }}
                                className={`min-w-[120px] flex-1 p-3 rounded-xl border-2 text-left transition-all snap-start relative group shrink-0 hover:scale-105 active:scale-95 ${isActive
                                    ? 'border-purple-500 bg-purple-50 shadow-md ring-1 ring-purple-500'
                                    : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex flex-col items-center text-center gap-1.5">
                                    <span className="text-3xl filter drop-shadow-sm transition-transform group-hover:scale-110 duration-200 flex items-center justify-center h-10 w-10">
                                        {type.icon}
                                    </span>
                                    <div>
                                        <div className={`font-bold text-sm ${isActive ? 'text-purple-700' : 'text-gray-700'} truncate max-w-[100px]`}>{type.label}</div>
                                        <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{type.desc}</div>
                                    </div>
                                </div>
                                {isActive && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>
                {/* Fade edges for scroll indication if needed */}
                <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-white/90 to-transparent pointer-events-none" />
            </div>

            {/* 2. COMPACT GENERATOR (Collapsible or Inline) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-indigo-500" />
                        <span className="text-xs font-bold text-gray-600 uppercase">Custom Generator</span>
                    </div>
                </div>

                <div className="p-3 flex flex-col md:flex-row gap-3 items-stretch">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe custom cursor (e.g. 'Golden Shield')..."
                            className="w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && prompt && !isGenerating) generateScratcher();
                            }}
                        />
                        <button
                            className="absolute right-1 top-1 p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Generate"
                            onClick={generateScratcher}
                            disabled={!prompt || isGenerating}
                        >
                            {isGenerating ? <div className="animate-spin text-xs">⏳</div> : <Sparkles size={16} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={generateScratcher}
                            disabled={!prompt || isGenerating}
                            className="px-3 py-1.5 bg-indigo-600 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-all whitespace-nowrap"
                        >
                            {isGenerating ? 'Generating...' : 'Generate AI'}
                        </button>
                        <span className="text-gray-300 text-xs">or</span>
                        <label className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap">
                            <Upload size={14} /> Upload
                            <input type="file" accept="image/png,image/jpeg" onChange={handleUpload} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>

            {/* 3. HORIZONTAL PROPERTIES BAR */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1.6fr] gap-4 items-center">

                {/* Left: Size Slider */}
                <div className="flex items-center gap-3 border-r border-gray-100 pr-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        {/* Preview Mini */}
                        <div
                            className="rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center text-[10px]"
                            style={{ width: Math.min(28, brushConfig.size * 0.4), height: Math.min(28, brushConfig.size * 0.4) }}
                        >
                            {brushConfig.tipType === 'custom' ? '★' : ''}
                        </div>
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Brush Size</label>
                            <span className="text-[10px] font-bold text-purple-600">{brushConfig.size}px</span>
                        </div>
                        <input
                            type="range"
                            min="20"
                            max="150"
                            step="5"
                            value={brushConfig.size}
                            onChange={(e) => updateBrush({ size: Number(e.target.value) })}
                            className="w-full accent-purple-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Middle: Reveal Threshold Slider */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-lg">👁️</span>
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Auto Reveal</label>
                            <span className="text-[10px] font-bold text-blue-600">
                                {Math.round((brushConfig.revealThreshold ?? 0.95) * 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="0.99"
                            step="0.05"
                            value={brushConfig.revealThreshold ?? 0.95}
                            onChange={(e) => updateBrush({ revealThreshold: Number(e.target.value) })}
                            className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Right: Toggles (Horizontal Grid) */}
                <div className="flex flex-wrap gap-2 justify-end">

                    {/* Magic Particles */}
                    <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all select-none ${config.scratch?.effects?.particles ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={config.scratch?.effects?.particles || false}
                            onChange={(e) => updateConfig({
                                scratch: {
                                    ...config.scratch,
                                    effects: { ...config.scratch?.effects, particles: e.target.checked }
                                } as ScratchConfig
                            })}
                        />
                        <Sparkles size={12} className={config.scratch?.effects?.particles ? 'fill-yellow-500 text-yellow-500' : ''} />
                        <span className="text-[11px] font-bold">Particles</span>
                    </label>

                    {/* Win Confetti */}
                    <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all select-none ${config.scratch?.effects?.confetti !== false ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={config.scratch?.effects?.confetti ?? true}
                            onChange={(e) => updateConfig({
                                scratch: {
                                    ...config.scratch,
                                    effects: { ...config.scratch?.effects, confetti: e.target.checked }
                                } as ScratchConfig
                            })}
                        />
                        <PartyPopper size={12} />
                        <span className="text-[11px] font-bold">Confetti</span>
                    </label>

                    {/* Holographic Parallax */}
                    <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all select-none ${config.scratch?.effects?.parallax !== false ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={config.scratch?.effects?.parallax ?? true}
                            onChange={(e) => updateConfig({
                                scratch: {
                                    ...config.scratch,
                                    effects: { ...config.scratch?.effects, parallax: e.target.checked }
                                } as ScratchConfig
                            })}
                        />
                        <Zap size={12} />
                        <span className="text-[11px] font-bold">Parallax</span>
                    </label>

                </div>
            </div>

        </div>
    );
};

export default Step2C_ScratchBrush;
