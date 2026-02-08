import React from 'react';
import { useGameStore } from '../../../store';
import PlinkoAssetManager from './assets/PlinkoAssetManager';
import MinesAssetManager from './assets/MinesAssetManager';
import CoinAssetManager from './assets/CoinAssetManager';
// Add missing imports
// Add missing imports
import { Dna, Bomb, Coins } from 'lucide-react';
import PlinkoPreview from './preview/PlinkoPreview';

const Step4_InstantAssets: React.FC = () => {
    const { config } = useGameStore();

    // Determine intrinsic game type (either explicitly selected or inferred)
    const gameType = config.instantGameType || config.selectedGameType || 'plinko';

    const renderAssetManager = () => {
        switch (gameType) {
            case 'plinko':
                return <PlinkoAssetManager />;
            case 'mines':
                return <MinesAssetManager />;
            case 'coin_flip':
                return <CoinAssetManager />;
            default:
                return (
                    <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
                        <p className="text-red-500">Unknown instant game type: {gameType}</p>
                    </div>
                );
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="mb-4 px-6 pt-6 flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-3">
                        {gameType === 'plinko' && <Dna className="text-pink-500" />}
                        {gameType === 'mines' && <Bomb className="text-slate-600" />}
                        {gameType === 'coin_flip' && <Coins className="text-yellow-500" />}
                        Visual Assets
                        <span className="text-gray-400 font-light mx-2">-</span>
                    </h2>
                    <p className="text-gray-500 pt-2">Customize the look and feel of your game elements.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 h-full">

                {/* Left Panel: Asset Controls */}
                <div className="h-full min-h-0 overflow-hidden">
                    <div className="bg-transparent px-6 pb-6 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        {renderAssetManager()}
                    </div>
                </div>

                {/* Right Panel: Live Preview */}
                <div className="h-full min-w-0 relative">
                    <div className="absolute inset-0 z-10">
                        {renderPreview(gameType, config)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper to render a basic CSS preview based on config
const renderPreview = (type: string, config: any) => {
    // Default visuals to ensure preview shows even if config is empty
    const plinkoDefaults = {
        ballColor: '#ff0055',
        pegColor: '#ffffff',
        pegGlow: true,
        bucketColor: '#3b82f6',
        backgroundColor: '#0f172a'
    };

    const minesDefaults = {
        tileColor: '#1e293b',
        tileCoverColor: '#475569',
        mineIcon: '💣',
        gemIcon: '💎'
    };

    const coinDefaults = {
        coinMaterial: 'gold',
        edgeColor: '#d1d5db'
    };

    if (type === 'plinko') {
        const plinkoConfig = config.instantGameConfig?.plinko || {};
        const visuals = { ...plinkoDefaults, ...plinkoConfig.visuals };

        return (
            <div className="absolute inset-0 z-10">
                <PlinkoPreview
                    rows={plinkoConfig.rows || 16}
                    risk={plinkoConfig.risk || 'medium'}
                    gravity={plinkoConfig.gravity || 1.2}
                    ballSize={plinkoConfig.ballSize || 6}
                    holeSize={plinkoConfig.holeSize || 14}
                    visuals={visuals}
                    autoPlay={false}
                    interactive={true}
                />
            </div>
        );
    }

    if (type === 'mines') {
        const visuals = { ...minesDefaults, ...config.instantGameConfig?.mines?.visuals };

        return (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="grid grid-cols-5 gap-2 p-4 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
                    {Array.from({ length: 25 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl cursor-pointer hover:brightness-110 transition-all shadow-inner"
                            style={{
                                backgroundColor: i === 12 ? visuals.tileColor : visuals.tileCoverColor,
                                transform: i === 12 ? 'scale(0.95)' : 'scale(1)'
                            }}
                        >
                            {i === 12 ? visuals.gemIcon : ''}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'coin_flip') {
        const visuals = { ...coinDefaults, ...config.instantGameConfig?.coin?.visuals };
        const isGold = visuals.coinMaterial === 'gold';
        const isSilver = visuals.coinMaterial === 'silver';
        // Simple colors for materials
        const baseColor = isGold ? '#fbbf24' : isSilver ? '#e5e7eb' : '#b45309';

        return (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="relative w-48 h-48 rounded-full border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center"
                    style={{
                        backgroundColor: baseColor,
                        borderColor: visuals.edgeColor,
                        boxShadow: `inset 0 0 20px rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.3)`
                    }}
                >
                    <div className="text-6xl font-black opacity-20 text-black">
                        $
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <p>Preview not available for {type}</p>
        </div>
    );
};

export default Step4_InstantAssets;
