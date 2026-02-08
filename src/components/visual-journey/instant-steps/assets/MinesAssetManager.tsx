import React from 'react';
import { useGameStore } from '../../../../store';
import { Shield, Gem, Bomb, Palette } from 'lucide-react';
import { UnifiedAssetControl } from '../components/UnifiedAssetControl';
import { enhancedOpenaiClient } from '../../../../utils/enhancedOpenaiClient';

const MinesAssetManager: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const minesConfig = config.instantGameConfig?.mines;
    const visuals = minesConfig?.visuals || {
        tileColor: '#1e293b',
        tileCoverColor: '#475569',
        explodeEffect: 'fire',
        mineIcon: '💣',
        gemIcon: '💎'
    };

    // Local state for generation prompts
    const [genState, setGenState] = React.useState<{
        mine: boolean;
        gem: boolean;
        minePrompt: string;
        gemPrompt: string;
    }>({
        mine: false,
        gem: false,
        minePrompt: '',
        gemPrompt: ''
    });

    const updateVisuals = (key: string, value: any) => {
        updateConfig({
            instantGameConfig: {
                ...config.instantGameConfig,
                mines: {
                    ...minesConfig!,
                    visuals: {
                        ...visuals,
                        [key]: value
                    }
                }
            }
        });
    };

    const handleGenerate = async (type: 'mine' | 'gem') => {
        const promptText = type === 'mine' ? genState.minePrompt : genState.gemPrompt;
        if (!promptText.trim()) return;

        setGenState(prev => ({ ...prev, [type]: true }));

        try {
            const fullPrompt = `${type === 'mine' ? 'Explosive mine, bomb' : 'Gemstone, jewel, prize'}, ${promptText}, game icon, isolated on black background, 3d render style`;

            const result = await enhancedOpenaiClient.generateImage(fullPrompt, {
                quality: 'high',
                size: '1024x1024'
            });

            if (result.imageUrl) {
                updateVisuals(`${type}Icon`, result.imageUrl);
            }
        } catch (error) {
            console.error(`Mines ${type} generation failed:`, error);
        } finally {
            setGenState(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleUpload = (type: 'mine' | 'gem', file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            updateVisuals(`${type}Icon`, result);
        };
        reader.readAsDataURL(file);
    };

    // Helper to determine if value is an image URL or Emoji
    const isImage = (val: string) => val.startsWith('http') || val.startsWith('data:');

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bomb className="w-5 h-5 text-red-500" />
                Mines Assets
            </h3>

            {/* Tile Customization */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gray-500" /> Grid Style
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                            Tile Cover Color
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={visuals.tileCoverColor}
                                onChange={(e) => updateVisuals('tileCoverColor', e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                            Revealed Tile Color
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={visuals.tileColor}
                                onChange={(e) => updateVisuals('tileColor', e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Icon Customization (Unified) */}
            <div className="space-y-3">
                <UnifiedAssetControl
                    label="Mine Icon" // Bomb
                    icon={<Bomb size={12} />}
                    subLabel={!isImage(visuals.mineIcon || '') ? `Current: ${visuals.mineIcon}` : undefined}
                    value={genState.minePrompt}
                    onValueChange={(val) => setGenState(prev => ({ ...prev, minePrompt: val }))}
                    imagePreview={isImage(visuals.mineIcon || '') ? visuals.mineIcon : undefined}
                    onRemoveImage={() => updateVisuals('mineIcon', '💣')} // Revert to default emoji
                    onUpload={(file) => handleUpload('mine', file)}
                    onGenerate={() => handleGenerate('mine')}
                    isGenerating={genState.mine}
                    placeholder="Describe mine (e.g. Naval Mine, TNT Crate)..."
                />

                <UnifiedAssetControl
                    label="Safe Icon" // Gem
                    icon={<Gem size={12} />}
                    subLabel={!isImage(visuals.gemIcon || '') ? `Current: ${visuals.gemIcon}` : undefined}
                    value={genState.gemPrompt}
                    onValueChange={(val) => setGenState(prev => ({ ...prev, gemPrompt: val }))}
                    imagePreview={isImage(visuals.gemIcon || '') ? visuals.gemIcon : undefined}
                    onRemoveImage={() => updateVisuals('gemIcon', '💎')} // Revert to default emoji
                    onUpload={(file) => handleUpload('gem', file)}
                    onGenerate={() => handleGenerate('gem')}
                    isGenerating={genState.gem}
                    placeholder="Describe prize (e.g. Gold Bar, Diamond, Star)..."
                />
            </div>

            {/* Effects */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-500" /> Effects
                </h4>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                        Explosion Style
                    </label>
                    <select
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        value={visuals.explodeEffect}
                        onChange={(e) => updateVisuals('explodeEffect', e.target.value)}
                    >
                        <option value="fire">🔥 Fire</option>
                        <option value="sparkle">✨ Sparkle</option>
                        <option value="smoke">💨 Smoke</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </div>
        </div>
    );
};


export default MinesAssetManager;
