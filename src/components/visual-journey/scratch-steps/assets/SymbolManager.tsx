import React, { useState, useRef } from 'react';

import { useGameStore } from '../../../../store';

import { motion, AnimatePresence } from 'framer-motion';

import { Check, Upload, Sparkles, Wand2, X, Trophy, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Image as ImageIcon, Type, LayoutGrid } from 'lucide-react';

import enhancedOpenaiClient from '../../../../utils/enhancedOpenaiClient';



const NUMBER_STYLES = [

    { id: 'gold', name: 'Gold', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300', textColor: 'text-yellow-700' },

    { id: 'silver', name: 'Silver', bgColor: 'bg-gray-100', borderColor: 'border-gray-300', textColor: 'text-gray-700' },

    { id: 'comic', name: 'Comic', bgColor: 'bg-blue-100', borderColor: 'border-blue-300', textColor: 'text-blue-700' },

    { id: 'plain', name: 'Simple', bgColor: 'bg-white', borderColor: 'border-gray-200', textColor: 'text-gray-900' },

];



const Step2E_ScratchHiddenSymbols: React.FC = () => {

    const { config, updateConfig } = useGameStore();



    // -- State --

    const [isGenerating, setIsGenerating] = useState(false);

    const [prompt, setPrompt] = useState('');

    const [expandedPrizeId, setExpandedPrizeId] = useState<string | null>(null);

    const carouselRef = useRef<HTMLDivElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);



    // -- Derived State --

    const currentStyle = config.scratch?.symbols?.style || 'gems';

    const currentNumberStyle = config.scratch?.symbols?.numberStyle || 'gold';

    const customAssets = config.scratch?.symbols?.customAssets || [];

    const isNumberMode = currentStyle === 'numbers';



    // -- Handlers --

    const scrollCarousel = (direction: 'left' | 'right') => {

        if (carouselRef.current) {

            const scrollAmount = 300;

            const newScrollLeft = direction === 'left'

                ? carouselRef.current.scrollLeft - scrollAmount

                : carouselRef.current.scrollLeft + scrollAmount;

            carouselRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });

        }

    };



    const updateSymbolStyle = (style: string) => {

        updateConfig({

            scratch: {

                ...config.scratch,

                symbols: { ...config.scratch?.symbols, style }

            } as any

        });

    };



    const updateNumberStyle = (style: string) => {

        updateConfig({

            scratch: {

                ...config.scratch,

                symbols: { ...config.scratch?.symbols, numberStyle: style }

            } as any

        });

        // If clicking a number style, automatically switch mode to numbers if not already

        if (currentStyle !== 'numbers') {

            updateSymbolStyle('numbers');

        }

    };



    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

        const file = e.target.files?.[0];

        if (!file) return;



        const reader = new FileReader();

        reader.onloadend = () => {

            const base64 = reader.result as string;

            const newAssetId = `custom_sym_${Date.now()}`;

            const newAsset = { id: newAssetId, url: base64, label: 'Custom Upload' };



            updateConfig({

                scratch: {

                    ...config.scratch,

                    symbols: {

                        ...config.scratch?.symbols,

                        customAssets: [newAsset, ...customAssets],

                        style: newAssetId

                    }

                } as any

            });

        };

        reader.readAsDataURL(file);

    };



    const handleAiGeneration = async () => {

        if (!prompt.trim()) return;

        setIsGenerating(true);

        try {

            const advancedPrompt = `A single high-quality 2D vector icon of ${prompt}, casino scratch card symbol style, transparent background, isolated, vibrant colors.`;

            const result = await enhancedOpenaiClient.generateImageWithConfig({ prompt: advancedPrompt, size: '1024x1024' });



            if (result.success && result.images?.[0]) {

                const imageUrl = result.images[0];

                const newAssetId = `ai_sym_${Date.now()}`;

                const newAsset = { id: newAssetId, url: imageUrl, label: prompt };



                updateConfig({

                    scratch: {

                        ...config.scratch,

                        symbols: {

                            ...config.scratch?.symbols,

                            customAssets: [newAsset, ...customAssets],

                            style: newAssetId

                        }

                    } as any

                });

                setPrompt('');

            }

        } catch (error) {

            console.error('AI Generation failed', error);

        } finally {

            setIsGenerating(false);

        }

    };



    const togglePrizeExpansion = (prizeId: string) => {

        setExpandedPrizeId(prev => prev === prizeId ? null : prizeId);

    };



    const handleRemoveSymbol = (assetId: string, e: React.MouseEvent) => {

        e.stopPropagation();

        const assetToRemove = customAssets.find(a => a.id === assetId);

        if (!assetToRemove) return;



        const updatedAssets = customAssets.filter(a => a.id !== assetId);



        // Clean up references in prizes

        const updatedPrizes = (config.scratch?.prizes || []).map(p => {

            if (p.symbolId === assetToRemove.url) {

                return { ...p, symbolId: undefined };

            }

            return p;

        });



        // Clean up references in lose variants

        const updatedLoseVariants = (config.scratch?.symbols?.loseVariants || []).filter(url => url !== assetToRemove.url);



        updateConfig({

            scratch: {

                ...config.scratch,

                prizes: updatedPrizes,

                symbols: {

                    ...config.scratch?.symbols,

                    customAssets: updatedAssets,

                    loseVariants: updatedLoseVariants,

                    // If we deleted the active style/asset, fallback to 'gems' or the first available custom asset

                    style: currentStyle === assetId ? (updatedAssets[0]?.id || 'gems') : currentStyle

                }

            } as any

        });

    };



    return (

        <div className="space-y-8 p-4">



            {/* 1. Header & Context */}

            <div className="flex items-center justify-between">

                <div>

                    <h3 className="text-xl font-bold text-gray-900">Match Symbols & Values</h3>

                    <p className="text-sm text-gray-500">Choose between numeric values or graphical symbols.</p>

                </div>

            </div>



            {/* 2. Combined Selection Area */}

            <div className="grid grid-cols-1 gap-6">



                {/* A. Number Styles (Horizontal Strip) */}

                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">

                    <div className="flex items-center gap-2 mb-3">

                        <Type className="w-4 h-4 text-purple-500" />

                        <span className="text-sm font-bold text-gray-700">100 Match Values (Numeric)</span>

                    </div>

                    <div className="grid grid-cols-4 gap-3">

                        {NUMBER_STYLES.map(style => (

                            <button

                                key={style.id}

                                onClick={() => updateNumberStyle(style.id)}

                                className={`

                                    relative p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1

                                    ${currentNumberStyle === style.id && isNumberMode

                                        ? 'border-purple-600 ring-2 ring-purple-100 scale-[1.02]'

                                        : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'

                                    }

                                    ${style.bgColor}

                                `}

                            >

                                <span className={`text-xl font-black ${style.textColor}`}>100</span>

                                <span className="text-[10px] font-bold text-gray-500 uppercase">{style.name}</span>

                                {currentNumberStyle === style.id && isNumberMode && (

                                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full p-0.5 shadow-sm">

                                        <Check className="w-3 h-3" />

                                    </div>

                                )}

                            </button>

                        ))}

                    </div>

                </div>



                {/* B. Symbol Styles (Hero Generator) */}

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">

                    {/* Left: Icon/Title */}

                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col justify-center items-start md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100">

                        <div className="bg-white p-3 rounded-xl shadow-sm mb-3">

                            <ImageIcon className="w-8 h-8 text-indigo-600" />

                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">Match Symbols</h3>

                        <p className="text-xs text-gray-500 leading-relaxed">

                            Generate custom symbols using AI or upload your own assets to create a unique theme.

                        </p>

                    </div>



                    {/* Right: Controls */}

                    <div className="p-6 md:w-2/3 flex flex-col gap-4">

                        <div className="relative">

                            <textarea

                                value={prompt}

                                onChange={(e) => setPrompt(e.target.value)}

                                placeholder="Describe your symbol (e.g., 'Golden dragon coin', 'Neon cherry')..."

                                className="w-full p-3 pr-24 h-24 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-sm transition-all"

                            />

                            {/* Actions Overlay */}

                            <div className="absolute bottom-3 right-3 flex gap-2">

                                <input

                                    type="file"

                                    ref={fileInputRef}

                                    className="hidden"

                                    accept="image/png,image/jpeg"

                                    onChange={handleFileUpload}

                                />

                                <button

                                    onClick={() => fileInputRef.current?.click()}

                                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"

                                >

                                    <Upload className="w-3 h-3" /> Upload

                                </button>

                                <button

                                    onClick={handleAiGeneration}

                                    disabled={!prompt.trim() || isGenerating}

                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"

                                >

                                    {isGenerating ? <Sparkles className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}

                                    Generate

                                </button>

                            </div>

                        </div>

                    </div>

                </div>



                {/* C. Active Symbol Carousel */}

                <div className="space-y-2">

                    <div className="flex items-center justify-between px-1">

                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Symbol Library</span>

                        <div className="flex gap-1">

                            <button onClick={() => scrollCarousel('left')} className="p-1 hover:bg-gray-100 rounded-full text-gray-400"><ChevronLeft className="w-4 h-4" /></button>

                            <button onClick={() => scrollCarousel('right')} className="p-1 hover:bg-gray-100 rounded-full text-gray-400"><ChevronRight className="w-4 h-4" /></button>

                        </div>

                    </div>



                    <div

                        ref={carouselRef}

                        className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x"

                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}

                    >

                        {customAssets.length === 0 && (

                            <div className="text-xs text-gray-400 italic p-4 w-full text-center border border-dashed border-gray-200 rounded-lg">

                                No custom symbols yet. Generate or upload one above!

                            </div>

                        )}



                        {customAssets.map((asset) => (

                            <div key={asset.id} className="relative group flex-shrink-0 snap-center">

                                <button

                                    onClick={() => updateSymbolStyle(asset.id)}

                                    className={`

                                        relative w-20 h-20 rounded-xl border-2 transition-all p-2 bg-white flex items-center justify-center

                                        ${currentStyle === asset.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-200'}

                                    `}

                                >

                                    <img src={asset.url} className="w-full h-full object-contain" />

                                    {currentStyle === asset.id && (

                                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-0.5 z-10">

                                            <Check className="w-3 h-3" />

                                        </div>

                                    )}

                                </button>

                                <button

                                    onClick={(e) => handleRemoveSymbol(asset.id, e)}

                                    className="absolute -top-2 -right-2 z-20 bg-red-100 text-red-600 border border-red-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white hover:scale-110 shadow-sm"

                                    title="Remove Symbol"

                                >

                                    <X className="w-3 h-3" />

                                </button>

                            </div>

                        ))}

                    </div>

                </div>



            </div>



            <hr className="border-gray-100" />



            {/* 3. Paytable Mapping */}

            <div className="space-y-4">

                <div className="flex items-center gap-2">

                    <Trophy className="w-5 h-5 text-yellow-600" />

                    <div>

                        <h3 className="text-lg font-bold text-gray-900">Paytable Symbol Mapping</h3>

                        <p className="text-xs text-gray-500">Assign specific symbols to your prize tiers.</p>

                    </div>

                </div>



                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">

                    <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">

                        {(() => {

                            const prizes = config.scratch?.prizes || [];

                            return [...prizes].sort((a, b) => b.payout - a.payout).map((prize, index) => {

                                const prizeValue = prize.payout * (config.scratch?.math?.ticketPrice || 1);

                                const isExpanded = expandedPrizeId === prize.id;



                                // Display Logic

                                let displaySrc = '';

                                const isManual = !!prize.symbolId;

                                const isText = !isManual && isNumberMode;



                                if (isManual) {

                                    displaySrc = prize.symbolId || '';

                                } else if (isNumberMode) {

                                    displaySrc = `€${prizeValue}`;

                                } else {

                                    // Default fallback to active symbol or placeholder

                                    const activeAsset = customAssets.find(a => a.id === currentStyle);

                                    displaySrc = activeAsset?.url || '/assets/symbols/placeholder.png';

                                }



                                return (

                                    <div key={prize.id} className={`bg-white rounded-lg border shadow-sm transition-all overflow-hidden ${isExpanded ? 'border-indigo-400 ring-1 ring-indigo-100' : 'border-gray-100'}`}>

                                        <div onClick={() => togglePrizeExpansion(prize.id)} className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">

                                            <div className="flex items-center gap-3">

                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">#{index + 1}</div>

                                                <div>

                                                    <div className="font-bold text-gray-800 text-sm">{prize.name}</div>

                                                    <div className="text-xs text-green-600 font-mono font-bold">€{prizeValue.toLocaleString()}</div>

                                                </div>

                                            </div>

                                            <div className="flex items-center gap-3">

                                                {isManual && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">MANUAL</span>}

                                                <div className="w-10 h-10 rounded border border-gray-200 p-1 bg-gray-50 flex items-center justify-center">

                                                    {isText || (isManual && !displaySrc.startsWith('http') && !displaySrc.startsWith('data:')) ?

                                                        <span className="text-[10px] font-black text-gray-600 leading-tight text-center">{displaySrc}</span> :

                                                        <img src={displaySrc} className="w-full h-full object-contain" />

                                                    }

                                                </div>

                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}

                                            </div>

                                        </div>



                                        <AnimatePresence>

                                            {isExpanded && (

                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-gray-100 bg-gray-50 p-3">

                                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Select Override</div>

                                                    <div className="flex flex-wrap gap-2">

                                                        {customAssets.map(asset => (

                                                            <button

                                                                key={asset.id}

                                                                onClick={(e) => {

                                                                    e.stopPropagation();

                                                                    const newPrizes = [...(config.scratch?.prizes || [])];

                                                                    const target = newPrizes.find(p => p.id === prize.id);

                                                                    if (target) target.symbolId = asset.url;

                                                                    updateConfig({ scratch: { ...config.scratch, prizes: newPrizes } as any });

                                                                }}

                                                                className={`w-12 h-12 rounded border bg-white p-1 hover:border-indigo-500 ${prize.symbolId === asset.url ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200'}`}

                                                            >

                                                                <img src={asset.url} className="w-full h-full object-contain" />

                                                            </button>

                                                        ))}

                                                        <button

                                                            onClick={(e) => {

                                                                e.stopPropagation();

                                                                const newPrizes = [...(config.scratch?.prizes || [])];

                                                                const target = newPrizes.find(p => p.id === prize.id);

                                                                if (target) target.symbolId = ''; // Reset

                                                                updateConfig({ scratch: { ...config.scratch, prizes: newPrizes } as any });

                                                            }}

                                                            className="px-3 h-12 rounded border border-red-200 bg-white text-red-500 hover:bg-red-50 text-xs font-bold"

                                                        >

                                                            Reset

                                                        </button>

                                                    </div>

                                                </motion.div>

                                            )}

                                        </AnimatePresence>

                                    </div>

                                );

                            });

                        })()}

                    </div>

                </div>

            </div>



            <hr className="border-gray-100" />



            {/* 4. Decoy / Lose Symbols - VISIBLE ONLY IN SYMBOLS MODE */}

            {!isNumberMode && (

                <div className="space-y-4">

                    <div className="flex items-center gap-2">

                        <LayoutGrid className="w-5 h-5 text-gray-500" />

                        <div>

                            <h3 className="text-lg font-bold text-gray-900">Non-Winning Symbols (Decoys)</h3>

                            <p className="text-xs text-gray-500">These symbols will appear on non-winning tickets. Select multiple for variety.</p>

                        </div>

                    </div>



                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">

                            {(() => {

                                // [CHANGE] Calculate assigned winning symbols

                                const assignedSymbolUrls = new Set(

                                    (config.scratch?.prizes || [])

                                        .map(p => p.symbolId)

                                        .filter(Boolean) as string[]

                                );



                                // [CHANGE] Filter assets that are NOT winning symbols

                                const availableDecoys = customAssets.filter(asset => !assignedSymbolUrls.has(asset.url));



                                return (

                                    <>

                                        {availableDecoys.map(asset => {

                                            const isSelected = (config.scratch?.symbols?.loseVariants || []).includes(asset.url);

                                            return (

                                                <button

                                                    key={asset.id}

                                                    onClick={() => {

                                                        const currentLose = config.scratch?.symbols?.loseVariants || [];

                                                        let newLose;

                                                        if (isSelected) {

                                                            newLose = currentLose.filter(l => l !== asset.url);

                                                        } else {

                                                            newLose = [...currentLose, asset.url];

                                                        }

                                                        updateConfig({

                                                            scratch: {

                                                                ...config.scratch,

                                                                symbols: {

                                                                    ...config.scratch?.symbols,

                                                                    loseVariants: newLose

                                                                }

                                                            } as any

                                                        });

                                                    }}

                                                    className={`relative aspect-square rounded-xl border-2 transition-all p-2 bg-white flex items-center justify-center group ${isSelected ? 'border-gray-800 ring-2 ring-gray-200 scale-95' : 'border-gray-200 hover:border-gray-300'}`}

                                                >

                                                    <img src={asset.url} className={`w-full h-full object-contain transition-all ${isSelected ? 'grayscale' : 'grayscale-0'}`} />

                                                    {isSelected && (

                                                        <div className="absolute top-1 right-1 bg-gray-800 text-white rounded-full p-0.5">

                                                            <X className="w-3 h-3" />

                                                        </div>

                                                    )}

                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold p-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity truncate rounded-b-lg">

                                                        {isSelected ? 'Decoy' : 'Use'}

                                                    </div>

                                                </button>

                                            );

                                        })}



                                        {/* Fallback States */}

                                        {customAssets.length === 0 && (

                                            <div className="col-span-full py-8 text-center text-gray-400 text-sm italic">

                                                No symbols in library. Generate or upload symbols above to use them as decoys!

                                            </div>

                                        )}

                                        {customAssets.length > 0 && availableDecoys.length === 0 && (

                                            <div className="col-span-full py-6 text-center text-amber-600 bg-amber-50 rounded-lg border border-amber-200 text-xs p-4">

                                                <div className="font-bold mb-1">All symbols are currently assigned to prizes!</div>

                                                Generate or upload more symbols to create non-winning decoys.

                                            </div>

                                        )}

                                    </>

                                );

                            })()}

                        </div>

                    </div>

                </div>

            )}



        </div>

    );

};



export default Step2E_ScratchHiddenSymbols;



