import { useState } from "react";
import { PresetConfig, SymbolConfig } from '../../../types/EnhancedAnimationLabStep4';
import { useGameStore } from "../../../store";
import SymbolCarouselItem from "../../enhanced-animation-lab/Symbol-caraousel-Item";
import { Button } from "../../Button";
import { Loader, Sparkles, Upload } from "lucide-react";
import { LAYOUT_TEMPLATES } from "../../enhanced-animation-lab/Layout-Animation-Template";
import enhancedOpenaiClient from "../../../utils/enhancedOpenaiClient";
import { useAnimationLab } from "../../../stores/animationLabStore";

const PRESET_CONFIGURATIONS: PresetConfig[] = [
    {
        name: 'Classic',
        description: 'Traditional 8-symbol setup',
        recommendedFor: 'New slot developers, simple games',
        estimatedRTP: '94-96%',
        suggestedFeatures: ['freespins', 'wild_substitution'],
        symbols: [
            { type: 'wild', count: 1, importance: 5, rarity: 'legendary' },
            { type: 'high 1', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 2', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 3', count: 1, importance: 4, rarity: 'rare' },
            { type: 'medium 1', count: 1, importance: 3, rarity: 'common' },
            { type: 'medium 2', count: 1, importance: 3, rarity: 'common' },
            { type: 'low 1', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 2', count: 1, importance: 2, rarity: 'common' }
        ]
    }
];

const getDefaultDescription = (type: string, theme: string): string => {
    const themeDescriptions: Record<string, Record<string, string>> = {
        default: {
            wild: 'Golden coin with WILD text',
            high: 'Crown or diamond',
            medium: 'Crystal or star',
            low: 'Card symbol'
        }
    };
    const themeKey = theme.toLowerCase().replace(/\s+/g, '-');
    const descriptions = themeDescriptions[themeKey] || themeDescriptions.default;
    return descriptions[type] || descriptions.high;
};

interface EnhancedAnimationLabProps {
    layoutMode?: 'full' | 'creation' | 'animation';
}

const Step5_SymbolGenerationClean: React.FC<EnhancedAnimationLabProps> = ({ layoutMode = 'full' }) => {
    const { config, updateConfig } = useGameStore();
    const [selectedPreset] = useState<string>('Classic');
    const [currentSymbolIndex, setCurrentSymbolIndex] = useState(0);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { isProcessing } = useAnimationLab();

    const preset = PRESET_CONFIGURATIONS.find(p => p.name === selectedPreset);
    const gameStoreSymbols = config?.theme?.generated?.symbols || {};
    const theme = config?.gameTheme || 'default';

    const presetSymbols: SymbolConfig[] = preset ? preset.symbols.map(symbolDef => {
        const storageKey = symbolDef.type.toLowerCase().replace(/\s+/g, '');
        return {
            id: storageKey,
            name: symbolDef.type.charAt(0).toUpperCase() + symbolDef.type.slice(1),
            symbolType: 'block' as const,
            contentType: 'symbol-only' as const,
            size: '1x1' as const,
            prompt: `High quality slot machine symbol: ${getDefaultDescription(symbolDef.type, theme)}`,
            gameSymbolType: symbolDef.type,
            importance: symbolDef.importance,
            rarity: symbolDef.rarity,
            defaultDescription: getDefaultDescription(symbolDef.type, theme),
            imageUrl: gameStoreSymbols[storageKey]
        };
    }) : [];

    const selectedSymbol = presetSymbols[currentSymbolIndex] || null;

    const handleGenerateSymbol = async () => {
        if (!selectedSymbol || !prompt.trim()) return;

        setIsGenerating(true);
        try {
            const result = await enhancedOpenaiClient.generateImageWithConfig({
                prompt: prompt,
                size: '1024x1024',
                targetSymbolId: selectedSymbol.id
            });

            if (result.success && result.images?.[0]) {
                let imageData = result.images[0];

                if (!imageData.startsWith('data:')) {
                    const response = await fetch(imageData);
                    const blob = await response.blob();
                    imageData = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                }

                const storageKey = selectedSymbol.gameSymbolType?.toLowerCase().replace(/\s+/g, '') || '';
                updateConfig({
                    theme: {
                        ...config.theme,
                        generated: {
                            ...config.theme?.generated,
                            symbols: {
                                ...config.theme?.generated?.symbols,
                                [storageKey]: imageData
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="animation-lab-container" style={{ width: '100%' }}>
            <div className='bg-white rounded-md'>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                    <div className="px-4 py-3">
                        <h3 className="text-lg font-semibold text-gray-800">Symbol Creation Lab</h3>
                        <div className="text-sm text-gray-600">
                            {presetSymbols.length} symbols ({presetSymbols.filter(s => s.imageUrl).length} generated)
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentSymbolIndex(Math.max(0, currentSymbolIndex - 1))}
                            disabled={currentSymbolIndex === 0}
                            className="p-1 rounded border disabled:opacity-50"
                        >
                            ←
                        </button>

                        <div className="flex-1 overflow-hidden">
                            <div className="flex gap-3 overflow-x-auto py-2">
                                {presetSymbols.map((symbol, index) => (
                                    <div key={`${symbol.id}-${index}`} className="flex-shrink-0">
                                        <SymbolCarouselItem
                                            symbol={symbol}
                                            isSelected={index === currentSymbolIndex}
                                            onClick={() => setCurrentSymbolIndex(index)}
                                            progress={0}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setCurrentSymbolIndex(Math.min(presetSymbols.length - 1, currentSymbolIndex + 1))}
                            disabled={currentSymbolIndex === presetSymbols.length - 1}
                            className="p-1 rounded border disabled:opacity-50"
                        >
                            →
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="bg-white rounded-lg shadow-sm border mb-4">
                        <div className="px-4 py-3 border-b bg-gray-50">
                            <h3 className="font-semibold">Symbol Prompt</h3>
                        </div>
                        <div className="p-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the symbol..."
                                className="w-full h-24 p-3 border rounded-md resize-none"
                            />
                            <div className='flex gap-3 mt-3'>
                                <Button
                                    variant='generate'
                                    onClick={handleGenerateSymbol}
                                    className='w-full'
                                    disabled={isGenerating || !prompt.trim()}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Generate
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step5_SymbolGenerationClean;
