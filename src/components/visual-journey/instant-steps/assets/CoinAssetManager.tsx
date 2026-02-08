import React, { useState } from 'react';
import { useGameStore } from '../../../../store';
import { Coins, Palette } from 'lucide-react';
import { UnifiedAssetControl } from '../components/UnifiedAssetControl';
import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';

const CoinAssetManager: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const coinConfig = config.instantGameConfig?.coin;
    const visuals = coinConfig?.visuals || {
        edgeColor: '#d1d5db',
        coinMaterial: 'gold',
        headsImage: '',
        tailsImage: ''
    };

    // Local state for generation
    const [genState, setGenState] = useState<{
        heads: boolean;
        tails: boolean;
        headsPrompt: string;
        tailsPrompt: string;
    }>({
        heads: false,
        tails: false,
        headsPrompt: '',
        tailsPrompt: ''
    });

    const updateVisuals = (key: string, value: any) => {
        updateConfig({
            instantGameConfig: {
                ...config.instantGameConfig,
                coin: {
                    ...coinConfig!,
                    visuals: {
                        ...visuals,
                        [key]: value
                    }
                }
            }
        });
    };

    const handleGenerate = async (side: 'heads' | 'tails') => {
        const promptText = side === 'heads' ? genState.headsPrompt : genState.tailsPrompt;
        if (!promptText.trim()) return;

        setGenState(prev => ({ ...prev, [side]: true }));

        try {
            const fullPrompt = `Coin design, ${side} side, ${promptText}, circular emblem, metallic texture, isolated on black background, high quality game asset`;

            const result = await enhancedOpenaiClient.generateImage(fullPrompt, {
                quality: 'high',
                size: '1024x1024'
            });

            if (result.imageUrl) {
                updateVisuals(`${side}Image`, result.imageUrl);
            }
        } catch (error) {
            console.error(`Coin ${side} generation failed:`, error);
        } finally {
            setGenState(prev => ({ ...prev, [side]: false }));
        }
    };

    const handleUpload = (side: 'heads' | 'tails', file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            updateVisuals(`${side}Image`, result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Coin Flip Assets
            </h3>

            {/* Material Customization */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gray-500" /> Material & Style
                </h4>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                            Coin Material
                        </label>
                        <div className="flex gap-2">
                            {['gold', 'silver', 'bronze'].map(mat => (
                                <button
                                    key={mat}
                                    onClick={() => updateVisuals('coinMaterial', mat)}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm capitalize transition-all ${visuals.coinMaterial === mat
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {mat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                            Edge/Rim Color
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={visuals.edgeColor}
                                onChange={(e) => updateVisuals('edgeColor', e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                            />
                            <span className="text-sm text-gray-500 font-mono">{visuals.edgeColor}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Face Customization (Unified Controls) */}
            <div className="space-y-3">
                <UnifiedAssetControl
                    label="Heads Design"
                    value={genState.headsPrompt}
                    onValueChange={(val) => setGenState(prev => ({ ...prev, headsPrompt: val }))}
                    imagePreview={visuals.headsImage}
                    onRemoveImage={() => updateVisuals('headsImage', '')}
                    onUpload={(file) => handleUpload('heads', file)}
                    onGenerate={() => handleGenerate('heads')}
                    isGenerating={genState.heads}
                    placeholder="Describe heads image (e.g. King profile, Lion, Crown)..."
                />

                <UnifiedAssetControl
                    label="Tails Design"
                    value={genState.tailsPrompt}
                    onValueChange={(val) => setGenState(prev => ({ ...prev, tailsPrompt: val }))}
                    imagePreview={visuals.tailsImage}
                    onRemoveImage={() => updateVisuals('tailsImage', '')}
                    onUpload={(file) => handleUpload('tails', file)}
                    onGenerate={() => handleGenerate('tails')}
                    isGenerating={genState.tails}
                    placeholder="Describe tails image (e.g. Number 1, Eagle, Shield)..."
                />
            </div>
        </div>
    );
};

export default CoinAssetManager;
