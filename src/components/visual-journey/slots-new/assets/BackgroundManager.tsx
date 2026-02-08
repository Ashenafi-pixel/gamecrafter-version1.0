import React from 'react';
import { useGameStore } from '../../../../store';
import { UnifiedAssetControl } from '../../instant-steps/components/UnifiedAssetControl';
import { Sun, Moon, Zap, Image as ImageIcon } from 'lucide-react';

const BackgroundManager: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const [generating, setGenerating] = React.useState<string | null>(null);

    const handleUpdate = (type: 'day' | 'night' | 'freespin' | 'bonus', field: 'url' | 'prompt', value: string) => {
        const bgConfig = config.derivedBackgrounds || {};
        updateConfig({
            ...config,
            derivedBackgrounds: {
                ...bgConfig,
                [type]: field === 'url' ? value : bgConfig[type]
                // Note: We might need to store prompts in a separate object in types.ts if we want persistence, 
                // but for now we focus on the asset URL.
            }
        });
    };

    const mockGenerate = (type: string) => {
        setGenerating(type);
        setTimeout(() => {
            setGenerating(null);
            // In a real implementation, this would call the AI service
            console.log(`Generated ${type} background`);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-orange-500" />
                    Base Game (Day)
                </h3>
                <UnifiedAssetControl
                    label="Main Background"
                    subLabel="The primary backdrop for the base game."
                    value={""} // Prompt (TODO: Add to state if needed)
                    onValueChange={() => { }}
                    imagePreview={config.derivedBackgrounds?.day}
                    onRemoveImage={() => handleUpdate('day', 'url', '')}
                    onUpload={(file) => {
                        const url = URL.createObjectURL(file);
                        handleUpdate('day', 'url', url);
                    }}
                    onGenerate={() => mockGenerate('day')}
                    isGenerating={generating === 'day'}
                    placeholder="Describe a scenic background..."
                />
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    Night/feature Mode
                </h3>
                <UnifiedAssetControl
                    label="Night Variation"
                    subLabel="Darker version for high-tension moments."
                    value={""}
                    onValueChange={() => { }}
                    imagePreview={config.derivedBackgrounds?.night}
                    onRemoveImage={() => handleUpdate('night', 'url', '')}
                    onUpload={(file) => {
                        const url = URL.createObjectURL(file);
                        handleUpdate('night', 'url', url);
                    }}
                    onGenerate={() => mockGenerate('night')}
                    isGenerating={generating === 'night'}
                    placeholder="Describe a night version..."
                />
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Free Spins
                </h3>
                <UnifiedAssetControl
                    label="Free Spin Background"
                    subLabel="Exciting variation for the bonus round."
                    value={""}
                    onValueChange={() => { }}
                    imagePreview={config.derivedBackgrounds?.freespin}
                    onRemoveImage={() => handleUpdate('freespin', 'url', '')}
                    onUpload={(file) => {
                        const url = URL.createObjectURL(file);
                        handleUpdate('freespin', 'url', url);
                    }}
                    onGenerate={() => mockGenerate('freespin')}
                    isGenerating={generating === 'freespin'}
                    placeholder="Describe an intense bonus background..."
                />
            </div>
        </div>
    );
};

export default BackgroundManager;
