import React, { useState } from 'react';
import { useGameStore } from '../../../store';
import { Sparkles, Camera, Palette, Zap, Play, Settings2 } from 'lucide-react';
import { CrashConfig } from '../../../types';
import CrashSimulationCanvas from './CrashSimulationCanvas';

const Step5_CrashUltimate: React.FC = () => {
    const { config, updateCrashConfig } = useGameStore();
    const [activeTab, setActiveTab] = useState<'particles' | 'camera' | 'skins'>('particles');

    // Safe access to config
    const crashConfig = config.crash as CrashConfig;
    const visuals = crashConfig?.visuals || {};
    const particles = visuals.particles || {
        trail: { enabled: true, color: '#fbbf24', size: 4, speed: 5, count: 20, lifespan: 1 },
        explosion: { enabled: true, color: '#ef4444', size: 8, speed: 10, count: 50, lifespan: 2 }
    };
    const camera = crashConfig?.camera || {
        shakeEnabled: true,
        shakeStrength: 5,
        zoomEnabled: true,
        zoomLevel: 1.5
    };
    const currentSkin = visuals.skinId || 'default';

    // Preview State
    const [isPlaying, setIsPlaying] = useState(false);

    const updateParticles = (type: 'trail' | 'explosion', key: string, value: any) => {
        updateCrashConfig({
            visuals: {
                ...visuals,
                particles: {
                    ...particles,
                    [type]: {
                        ...particles[type],
                        [key]: value
                    }
                }
            }
        });
    };

    const updateCamera = (key: string, value: any) => {
        updateCrashConfig({
            camera: {
                ...camera,
                [key]: value
            }
        });
    };

    const applySkin = (skinId: string) => {
        let skinColors = {};
        switch (skinId) {
            case 'cyberpunk':
                skinColors = { lineColor: '#facc15', gridColor: '#f472b6', textColor: '#22d3ee' };
                break;
            case 'candy':
                skinColors = { lineColor: '#f472b6', gridColor: '#fcd34d', textColor: '#ffffff' };
                break;
            case 'space':
                skinColors = { lineColor: '#818cf8', gridColor: '#312e81', textColor: '#e0e7ff' };
                break;
            default: // standard
                skinColors = { lineColor: '#6366f1', gridColor: '#374151', textColor: '#ffffff' };
                break;
        }

        updateCrashConfig({
            visuals: {
                ...visuals,
                skinId: skinId,
                ...skinColors
            }
        });
    };

    return (
        <div className="flex h-[calc(100vh-140px)]">
            {/* Left Panel: Configuration */}
            <div className="w-[400px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-6 scrollbar-thin">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Visual Polish</h2>
                    <p className="text-sm text-gray-500">Fine-tune the "juice" of your game.</p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-8 bg-gray-100 p-1 rounded-lg">
                    {[
                        { id: 'particles', icon: Sparkles, label: 'Particles' },
                        { id: 'camera', icon: Camera, label: 'Camera' },
                        { id: 'skins', icon: Palette, label: 'Skins' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'particles' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                            {/* Trail Config */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <Zap size={16} className="text-amber-500" />
                                        Exhaust Trail
                                    </h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={particles.trail.enabled}
                                            onChange={(e) => updateParticles('trail', 'enabled', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {particles.trail.enabled && (
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="color"
                                                    value={particles.trail.color}
                                                    onChange={(e) => updateParticles('trail', 'color', e.target.value)}
                                                    className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                                />
                                                <span className="text-xs text-gray-600 font-mono">{particles.trail.color}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Size ({particles.trail.size}px)</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={particles.trail.size}
                                                onChange={(e) => updateParticles('trail', 'size', Number(e.target.value))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Count</label>
                                            <input
                                                type="range"
                                                min="5"
                                                max="50"
                                                value={particles.trail.count}
                                                onChange={(e) => updateParticles('trail', 'count', Number(e.target.value))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                )}
                            </section>

                            <div className="h-px bg-gray-200" />

                            {/* Explosion Config */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <Sparkles size={16} className="text-red-500" />
                                        Crash Explosion
                                    </h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={particles.explosion.enabled}
                                            onChange={(e) => updateParticles('explosion', 'enabled', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                {particles.explosion.enabled && (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Explosion Color</label>
                                        <input
                                            type="color"
                                            value={particles.explosion.color}
                                            onChange={(e) => updateParticles('explosion', 'color', e.target.value)}
                                            className="h-8 w-full rounded cursor-pointer border-0 p-0 mb-3"
                                        />
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Intensity</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            value={particles.explosion.count}
                                            onChange={(e) => updateParticles('explosion', 'count', Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {activeTab === 'camera' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900">Dynamics</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                                                <Settings2 size={18} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">Screen Shake</div>
                                                <div className="text-xs text-gray-500">Shake on crash</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={camera.shakeEnabled}
                                            onChange={(e) => updateCamera('shakeEnabled', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </label>

                                    {camera.shakeEnabled && (
                                        <div className="pl-4 border-l-2 border-gray-100 ml-4">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Shake Strength</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={camera.shakeStrength}
                                                onChange={(e) => updateCamera('shakeStrength', Number(e.target.value))}
                                                className="w-full"
                                            />
                                        </div>
                                    )}

                                    <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-md">
                                                <Camera size={18} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">Dynamic Zoom</div>
                                                <div className="text-xs text-gray-500">Zoom out as multiplier grows</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={camera.zoomEnabled}
                                            onChange={(e) => updateCamera('zoomEnabled', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </label>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'skins' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                            {[
                                { id: 'default', name: 'Standard', color: 'bg-gray-100' },
                                { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-yellow-400' },
                                { id: 'candy', name: 'Candy Land', color: 'bg-pink-300' },
                                { id: 'space', name: 'Deep Space', color: 'bg-indigo-900' },
                            ].map((skin) => (
                                <div
                                    key={skin.id}
                                    onClick={() => applySkin(skin.id)}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${currentSkin === skin.id
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-transparent bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg shadow-sm ${skin.color}`}></div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{skin.name}</div>
                                            <div className="text-xs text-gray-500">Apply visual preset</div>
                                        </div>
                                        {currentSkin === skin.id && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-bold">
                                                Active
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Preview */}
            <div className="flex-1 bg-gray-900 relative overflow-hidden flex items-center justify-center">
                {/* Background Grid */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(${visuals.gridColor || '#333'} 1px, transparent 1px), linear-gradient(90deg, ${visuals.gridColor || '#333'} 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Physics Simulation Container */}
                <div className="relative w-full max-w-3xl h-96 border-b-2 border-l-2 border-gray-600">
                    <CrashSimulationCanvas
                        config={crashConfig}
                        isPlaying={isPlaying}
                        onCrash={() => setTimeout(() => setIsPlaying(false), 2000)}
                        width={800}
                        height={400}
                    />
                </div>

                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg transition-transform active:scale-95"
                    >
                        <Play size={20} fill="currentColor" />
                        {isPlaying ? 'Reset Preview' : 'Test Flight'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step5_CrashUltimate;
