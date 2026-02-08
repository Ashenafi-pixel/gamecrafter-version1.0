import React from 'react';
import { useGameStore } from '../../../../store';
import { UnifiedAssetControl } from '../../instant-steps/components/UnifiedAssetControl';
import { Frame, Layout, MousePointerClick } from 'lucide-react';

const FrameManager: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const [generating, setGenerating] = React.useState<string | null>(null);

    const handleUpdate = (type: 'reel' | 'logo' | 'button', value: string) => {
        // Mock implementation for now, mapping to various config parts
        if (type === 'reel') {
            updateConfig({
                ...config,
                frame: { ...config.frame, url: value } // Assuming standard frame config
            });
        }
    };

    const mockGenerate = (type: string) => {
        setGenerating(type);
        setTimeout(() => {
            setGenerating(null);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Frame className="w-4 h-4 text-slate-500" />
                    Reel Frame
                </h3>
                <UnifiedAssetControl
                    label="Reel Container"
                    subLabel="The border surrounding the symbol grid."
                    value={""}
                    onValueChange={() => { }}
                    imagePreview={config.frame?.url}
                    onRemoveImage={() => handleUpdate('reel', '')}
                    onUpload={(file) => {
                        const url = URL.createObjectURL(file);
                        handleUpdate('reel', url);
                    }}
                    onGenerate={() => mockGenerate('reel')}
                    isGenerating={generating === 'reel'}
                    placeholder="Metallic, wood, gold border..."
                />
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Layout className="w-4 h-4 text-blue-500" />
                    Game Logo
                </h3>
                <UnifiedAssetControl
                    label="Title Logo"
                    subLabel="Displays above the reels."
                    value={""}
                    onValueChange={() => { }}
                    imagePreview={config.splashScreen?.gameTitle ? undefined : undefined} // TODO: Map to actual logo asset
                    onRemoveImage={() => { }}
                    onUpload={() => { }}
                    onGenerate={() => mockGenerate('logo')}
                    isGenerating={generating === 'logo'}
                    placeholder="Game title styled text..."
                />
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                <p>
                    <strong>Note:</strong> UI Buttons (Spin, Bet) are currently using the system theme.
                    Custom button uploads will be enabled in Phase 2.
                </p>
            </div>
        </div>
    );
};

export default FrameManager;
