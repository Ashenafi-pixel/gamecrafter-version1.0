import React, { useState } from 'react';
import { useGameStore } from '../../store';
import BackgroundManager from './assets/BackgroundManager';
import FrameManager from './assets/FrameManager';
import { Image, Frame, Layers } from 'lucide-react';

type Tab = 'background' | 'frame';

const Step4_Visuals: React.FC = () => {
    const { config } = useGameStore();
    const [activeTab, setActiveTab] = useState<Tab>('background');

    // Helper to get active style for preview (Safe access)
    const currentBg = config.derivedBackgrounds?.day;
    const currentFrame = config.frame?.url;

    const renderPreview = () => {
        return (
            <div className="w-full h-full bg-slate-900 relative overflow-hidden rounded-xl border border-slate-700 shadow-2xl">
                {/* Background Layer */}
                {currentBg ? (
                    <img
                        src={currentBg}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-slate-700">
                        No Background Set
                    </div>
                )}

                {/* Frame/Reel Layer */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="relative w-[60%] h-[70%] border-4 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                        {currentFrame && (
                            <img
                                src={currentFrame}
                                alt="Frame"
                                className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] object-fill pointer-events-none"
                            />
                        )}
                        <div className="text-white/30 font-bold tracking-widest uppercase">
                            Reels Area
                        </div>
                    </div>
                </div>

                {/* UI Overlay Mockup */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-sm border-t border-white/10 z-20 flex items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-yellow-500 shadow-lg border-2 border-yellow-300 flex items-center justify-center font-bold text-yellow-900">
                        SPIN
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="px-6 pt-6 pb-2">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                    <Layers className="text-blue-600" />
                    Visual Assets
                </h2>
                <p className="text-gray-500 text-sm">Customize the game encironment and UI wrapper.</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Configuration */}
                <div className="w-full lg:w-[450px] flex flex-col border-r border-gray-200 bg-white z-10">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 px-6 pt-2 gap-4">
                        <button
                            onClick={() => setActiveTab('background')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'background'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Image className="w-4 h-4" />
                            Backgrounds
                        </button>
                        <button
                            onClick={() => setActiveTab('frame')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'frame'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Frame className="w-4 h-4" />
                            Reels & UI
                        </button>
                    </div>

                    {/* Active Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                        {activeTab === 'background' ? <BackgroundManager /> : <FrameManager />}
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="flex-1 bg-gray-50 p-8 flex items-center justify-center overflow-hidden">
                    <div className="w-full max-w-4xl aspect-video shadow-2xl rounded-xl overflow-hidden ring-1 ring-black/5">
                        {renderPreview()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step4_Visuals;
