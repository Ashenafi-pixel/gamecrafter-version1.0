import React, { useState } from 'react';
import { useGameStore } from '../../../../store';
import { Palette, Box, Circle } from 'lucide-react';
import { UnifiedAssetControl } from '../components/UnifiedAssetControl';
import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';

const PlinkoAssetManager: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const plinkoConfig = config.instantGameConfig?.plinko;
    const visuals: any = plinkoConfig?.visuals || {
        ballColor: '#ff0055',
        pegColor: '#ffffff',
        pegGlow: true,
        bucketColor: '#3b82f6',
        bucketTheme: 'classic',
        bucketShape: 'standard',
        backgroundColor: '#0f172a',
        particleTrail: false,
        ballTexture: '',
        backgroundTexture: ''
    };

    // Local state for generation
    const [genState, setGenState] = useState<{
        ball: boolean;
        bg: boolean;
        ballPrompt: string;
        bgPrompt: string;
    }>({
        ball: false,
        bg: false,
        ballPrompt: '',
        bgPrompt: ''
    });

    // Tab State
    const [activeTab, setActiveTab] = useState<'ball' | 'background' | 'pegs'>('ball');

    // Drag Scroll Logic
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeft(scrollRef.current?.scrollLeft || 0);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 2; // Scroll speed multiplier
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollLeft - walk;
        }
    };

    const updateVisuals = (keyOrUpdates: string | Record<string, any>, value?: any) => {
        const updates = typeof keyOrUpdates === 'string' ? { [keyOrUpdates]: value } : keyOrUpdates;
        updateConfig({
            instantGameConfig: {
                ...config.instantGameConfig,
                plinko: {
                    ...plinkoConfig!,
                    visuals: {
                        ...visuals,
                        ...updates
                    }
                }
            }
        });
    };

    const handleGenerate = async (type: 'ball' | 'bg') => {
        const promptText = type === 'ball' ? genState.ballPrompt : genState.bgPrompt;
        if (!promptText.trim()) return;

        setGenState(prev => ({ ...prev, [type]: true }));

        try {
            let fullPrompt = '';
            if (type === 'ball') {
                fullPrompt = `Sphere texture, ${promptText}, seamless pattern, 3d ball material, game asset, high quality`;
            } else {
                fullPrompt = `Abstract background, ${promptText}, dark moody, casino game background, ambient lighting, 8k resolution`;
            }

            const result = await enhancedOpenaiClient.generateImage(fullPrompt, {
                quality: 'high',
                size: '1024x1024'
            });

            if (result.imageUrl) {
                updateVisuals(type === 'ball' ? 'ballTexture' : 'backgroundTexture', result.imageUrl);
            }
        } catch (error) {
            console.error(`Plinko ${type} generation failed:`, error);
        } finally {
            setGenState(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleUpload = (type: 'ball' | 'bg', file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            updateVisuals(type === 'ball' ? 'ballTexture' : 'backgroundTexture', result);
        };
        reader.readAsDataURL(file);
    };

    const tabs = [
        { id: 'ball', label: 'Ball Style', icon: Circle },
        { id: 'background', label: 'Background', icon: Palette },
        { id: 'pegs', label: 'Pegs & Buckets', icon: Box },
    ] as const;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Circle className="w-5 h-5 text-pink-500" />
                    Plinko Assets
                </h3>
                <p className="text-sm text-gray-500 mt-1">Customize visual elements</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-100 pb-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all
                                ${isActive
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent hover:border-gray-200'}
                            `}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-1">
                {/* Ball Customization */}
                {activeTab === 'ball' && (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                        Base Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={visuals.ballColor}
                                            onChange={(e) => updateVisuals('ballColor', e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white ring-1 ring-gray-200 shadow-sm"
                                        />
                                        <div className="text-xs text-gray-400 font-mono">{visuals.ballColor}</div>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`
                                        w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300
                                        ${visuals.particleTrail ? 'bg-purple-500' : 'bg-gray-300'}
                                    `}>
                                        <div className={`
                                            bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300
                                            ${visuals.particleTrail ? 'translate-x-4' : 'translate-x-0'}
                                        `}></div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={visuals.particleTrail ?? false}
                                        onChange={(e) => updateVisuals('particleTrail', e.target.checked)}
                                        className="hidden"
                                    />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Trail Effects</span>
                                </label>
                            </div>

                            <UnifiedAssetControl
                                label="Ball Texture"
                                subLabel="Overlays on 3D ball"
                                icon={<Circle size={14} />}
                                value={genState.ballPrompt}
                                onValueChange={(val) => setGenState(prev => ({ ...prev, ballPrompt: val }))}
                                imagePreview={visuals.ballTexture}
                                onRemoveImage={() => updateVisuals('ballTexture', '')}
                                onUpload={(file) => handleUpload('ball', file)}
                                onGenerate={() => handleGenerate('ball')}
                                isGenerating={genState.ball}
                                placeholder="Describe texture (e.g. Metallic Gold, Basketball, Planet)..."
                            />
                        </div>
                    </div>
                )}

                {/* Background Customization */}
                {activeTab === 'background' && (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-6">

                            {/* Card Background Section */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Card Background</h4>

                                <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm mb-4">
                                    <div className="flex justify-center mb-6">
                                        <div className="flex flex-col items-center gap-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Base Color</label>
                                            <div className="relative w-14 h-14 rounded-full shadow-lg ring-4 ring-white border border-gray-200 overflow-hidden cursor-pointer transition-transform hover:scale-105 active:scale-95">
                                                <div
                                                    className="absolute inset-0 z-0"
                                                    style={{ backgroundColor: visuals.backgroundColor }}
                                                />
                                                <input
                                                    type="color"
                                                    value={visuals.backgroundColor}
                                                    onChange={(e) => updateVisuals('backgroundColor', e.target.value)}
                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 opacity-0 cursor-pointer z-10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <UnifiedAssetControl
                                        label="Card Background"
                                        subLabel="Choose a color, gradient, or generate an AI scene."
                                        icon={<Palette size={20} className="text-purple-500" />}
                                        value={genState.bgPrompt}
                                        onValueChange={(val) => setGenState(prev => ({ ...prev, bgPrompt: val }))}
                                        imagePreview={visuals.backgroundTexture}
                                        onRemoveImage={() => updateVisuals('backgroundTexture', '')}
                                        onUpload={(file) => handleUpload('bg', file)}
                                        onGenerate={() => handleGenerate('bg')}
                                        isGenerating={genState.bg}
                                        placeholder="Describe your background (e.g., 'mystical forest, glowing runes, ancient trees')"
                                    />
                                </div>
                            </div>

                            {/* Quick Presets Carousel */}
                            <div className="w-full overflow-hidden">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Presets</h4>
                                <div
                                    ref={scrollRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseUp={handleMouseUp}
                                    onMouseMove={handleMouseMove}
                                    className="flex gap-4 overflow-x-auto pb-6 pt-6 px-2 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] cursor-grab active:cursor-grabbing"
                                >
                                    {[
                                        { name: 'Carbon', color: 'repeating-linear-gradient(45deg, #1a1a1a, #1a1a1a 10px, #222222 10px, #222222 20px)', texture: '' },
                                        { name: 'Wood', color: '#5D4037', texture: '' },
                                        { name: 'Gold', color: '#FFD700', texture: '' },
                                        { name: 'Emerald', color: '#10B981', texture: '' },
                                        { name: 'Ocean', color: '#3B82F6', texture: '' },
                                        { name: 'Midnight', color: '#0f172a', texture: '' },
                                        { name: 'Amethyst', color: 'linear-gradient(135deg, #9d50bb, #6e48aa)', texture: '' },
                                        { name: 'Neon', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', texture: '' },
                                        { name: 'Sunset', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', texture: '' },
                                        { name: 'Fire', color: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)', texture: '' },
                                        { name: 'Royal', color: '#240b36', texture: '' },
                                        { name: 'Felt', color: '#064e3b', texture: '' },
                                    ].map((preset) => {
                                        const isActive = (visuals.backgroundColor || '').toLowerCase() === preset.color.toLowerCase();
                                        return (
                                            <button
                                                key={preset.name}
                                                onClick={() => {
                                                    updateVisuals({
                                                        backgroundColor: preset.color,
                                                        backgroundTexture: preset.texture
                                                    });
                                                }}
                                                className="flex flex-col items-center gap-2 group min-w-[80px] shrink-0"
                                            >
                                                <div
                                                    className={`
                                                        w-16 h-16 rounded-2xl shadow-sm border transition-all duration-300
                                                        ${isActive
                                                            ? 'ring-2 ring-purple-500 ring-offset-2 scale-105 border-transparent shadow-purple-200'
                                                            : 'border-black/10 group-hover:scale-105 group-active:scale-95'
                                                        }
                                                    `}
                                                    style={{ background: preset.color }}
                                                />
                                                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-purple-600 font-bold' : 'text-gray-500 group-hover:text-gray-800'}`}>
                                                    {preset.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* Peg Customization */}
                {activeTab === 'pegs' && (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid gap-6">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                                    Peg Style
                                </label>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={visuals.pegColor}
                                            onChange={(e) => updateVisuals('pegColor', e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white ring-1 ring-gray-200 shadow-sm"
                                        />
                                        <div className="text-sm font-medium text-gray-700">Peg Color</div>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={visuals.pegGlow ?? true}
                                            onChange={(e) => updateVisuals('pegGlow', e.target.checked)}
                                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-600">Neon Glow</span>
                                    </label>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                                    Multiplier Buckets
                                </label>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                                        Bucket Layout
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        {['standard', 'square', 'circle'].map(shape => (
                                            <button
                                                key={shape}
                                                onClick={() => updateVisuals('bucketShape', shape)}
                                                className={`
                                                py-2 px-3 rounded-lg border text-xs font-bold capitalize transition-all flex items-center justify-center gap-2
                                                ${(visuals.bucketShape || 'standard') === shape
                                                        ? 'bg-white border-purple-500 text-purple-600 shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }
                                            `}
                                            >
                                                {shape}
                                            </button>
                                        ))}
                                    </div>

                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                                        Bucket Theme
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['classic', 'neon', 'ocean', 'gold', 'pastel', 'dark'].map(theme => (
                                            <button
                                                key={theme}
                                                onClick={() => {
                                                    updateVisuals({
                                                        bucketTheme: theme,
                                                        // We keep bucketColor empty to allow theme to take over
                                                        bucketColor: ''
                                                    })
                                                }}
                                                className={`
                                                relative h-12 rounded-lg border overflow-hidden transition-all flex items-center justify-center
                                                ${(visuals.bucketTheme || 'classic') === theme
                                                        ? 'ring-2 ring-purple-500 border-transparent shadow-md'
                                                        : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'}
                                            `}
                                            >
                                                <div className={`absolute inset-0 opacity-100 ${theme === 'neon' ? 'bg-gradient-to-r from-purple-500 via-cyan-400 to-green-400' :
                                                    theme === 'ocean' ? 'bg-gradient-to-r from-blue-400 to-indigo-600' :
                                                        theme === 'gold' ? 'bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-600' :
                                                            theme === 'pastel' ? 'bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200' :
                                                                theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900' :
                                                                    'bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400'
                                                    }`} />
                                                <span className="relative z-10 text-[10px] font-bold text-white uppercase tracking-wide drop-shadow-md shadow-black">
                                                    {theme}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlinkoAssetManager;
