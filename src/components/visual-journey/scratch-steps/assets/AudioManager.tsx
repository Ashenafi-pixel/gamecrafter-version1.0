import React, { useState, useRef } from 'react';
import { useGameStore } from '../../../../store';
import { motion } from 'framer-motion';
import { Volume2, Play, Music, Sparkles, Wand2, Upload, Clock, Loader2, AlertTriangle, Zap } from 'lucide-react';

const AUDIO_SLOTS = [
    { id: 'intro', label: 'Start Sound', desc: 'Played once when game loads', defaultDuration: 3, icon: Zap },
    { id: 'bgm', label: 'Background Ambience', desc: 'Looping atmospheric sound', defaultDuration: 30, icon: Music },
    { id: 'scratch', label: 'Scratch Effect', desc: 'Sound played while scratching', defaultDuration: 2, icon: Volume2 },
    { id: 'win', label: 'Win Celebration', desc: 'Played on big wins', defaultDuration: 5, icon: Sparkles },
    { id: 'near_miss', label: 'Near Miss', desc: 'Tension sound when 2/3 symbols match', defaultDuration: 2, icon: AlertTriangle },
];

const Step2D_ScratchAudio: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const [playingPreview, setPlayingPreview] = useState<string | null>(null);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [prompts, setPrompts] = useState<Record<string, string>>({});
    const [durations, setDurations] = useState<Record<string, number>>({
        intro: 3,
        bgm: 30,
        scratch: 2,
        win: 5,
        near_miss: 2
    });

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handlePlay = (url: string, id: string) => {
        if (playingPreview === id) {
            audioRef.current?.pause();
            setPlayingPreview(null);
        } else {
            const volume = (config.scratch?.audioVolumes as any)?.[id] ?? 0.5;

            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.volume = volume;
                audioRef.current.play();
                audioRef.current.onended = () => setPlayingPreview(null);
            } else {
                const audio = new Audio(url);
                audio.volume = volume;
                audioRef.current = audio;
                audio.play();
                audio.onended = () => setPlayingPreview(null);
            }
            setPlayingPreview(id);
        }
    };

    const handleGenerate = async (id: string) => {
        setGeneratingId(id);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setGeneratingId(null);
        // In real impl, this would update config with result
        alert(`Would generate '${id}' audio with duration ${durations[id]}s and prompt: "${prompts[id] || ''}"`);
    };

    const handleUpload = (id: string, file: File) => {
        const url = URL.createObjectURL(file);
        updateConfig({
            scratch: {
                ...config.scratch,
                audio: {
                    ...config.scratch?.audio,
                    [id]: url
                }
            } as any
        });
    };

    return (
        <div className="w-full mx-auto max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 w-full"
            >
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Volume2 className="text-pink-600" size={24} />
                    <h2 className="text-3xl font-bold text-gray-900">Audio Experience</h2>
                </div>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    Design the sonic landscape of your game. Generate unique SFX or upload your own.
                </p>
            </motion.div>

            <div className="flex flex-col gap-6">
                {AUDIO_SLOTS.map((slot) => {
                    const currentUrl = (config.scratch?.audio as any)?.[slot.id];
                    const currentVolume = (config.scratch?.audioVolumes as any)?.[slot.id] ?? 0.5;
                    const isGenerating = generatingId === slot.id;
                    const Icon = slot.icon;

                    return (
                        <motion.div
                            key={slot.id}
                            layout
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            <div className="p-6 flex flex-col md:flex-row gap-6">
                                {/* Left: Info & Controls */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-pink-50 text-pink-600 rounded-lg">
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{slot.label}</h3>
                                                <p className="text-sm text-gray-500">{slot.desc}</p>
                                            </div>

                                            {/* Duration Input (Header) */}
                                            <div className="flex items-center gap-2 bg-gray-50 px-2 h-8 rounded-lg border border-gray-200 ml-2" title="Duration in seconds">
                                                <Clock size={12} className="text-gray-400 shrink-0" />
                                                <input
                                                    type="number"
                                                    value={durations[slot.id]}
                                                    onChange={(e) => setDurations({ ...durations, [slot.id]: parseInt(e.target.value) || 0 })}
                                                    className="w-8 bg-transparent outline-none text-xs font-medium text-gray-700 text-center"
                                                    min={1}
                                                    max={60}
                                                />
                                                <span className="text-[10px] text-gray-400 font-medium shrink-0">s</span>
                                            </div>

                                            {/* Volume Control */}
                                            <div className="flex items-center gap-2 bg-gray-50 px-2 h-8 rounded-lg border border-gray-200 ml-2" title="Volume">
                                                <Volume2 size={12} className="text-gray-400 shrink-0" />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.1"
                                                    value={currentVolume}
                                                    onChange={(e) => {
                                                        const newVol = parseFloat(e.target.value);
                                                        updateConfig({
                                                            scratch: {
                                                                ...config.scratch,
                                                                audioVolumes: {
                                                                    ...(config.scratch?.audioVolumes || {}),
                                                                    [slot.id]: newVol
                                                                }
                                                            } as any
                                                        });
                                                        // Update preview volume logic if needed real-time
                                                    }}
                                                    className="w-16 accent-pink-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        {currentUrl && (
                                            <button
                                                onClick={() => handlePlay(currentUrl, slot.id)}
                                                className={`p-2 rounded-full transition-colors ${playingPreview === slot.id ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                <Play size={18} fill={playingPreview === slot.id ? "currentColor" : "none"} />
                                            </button>
                                        )}
                                    </div>


                                    {/* Inputs */}
                                    {/* Inputs Area - Sidebar Layout */}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <textarea
                                            value={prompts[slot.id] || ''}
                                            onChange={(e) => setPrompts({ ...prompts, [slot.id]: e.target.value })}
                                            placeholder={`Describe the ${slot.label.toLowerCase()} (e.g., "Upbeat synth pop", "Coin crunch")...`}
                                            className="flex-1 p-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-none text-sm min-h-[88px] transition-all"
                                        />

                                        <div className="flex flex-col gap-2 w-full sm:w-40 shrink-0">


                                            {/* 2. Upload (Middle) */}
                                            <label className="cursor-pointer w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-bold text-gray-700 active:scale-95">
                                                <Upload size={16} />
                                                <span>Upload</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="audio/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleUpload(slot.id, file);
                                                    }}
                                                />
                                            </label>

                                            {/* 3. Generate (Bottom) */}
                                            <button
                                                onClick={() => handleGenerate(slot.id)}
                                                disabled={isGenerating}
                                                className="w-full h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-pink-500/20 active:scale-95 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                                Generate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current File Indicator */}
                            {currentUrl && (
                                <div className="bg-gray-50 px-6 py-2 border-t border-gray-100 flex items-center gap-2 text-xs text-green-600 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Active Audio Loaded
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>


        </div>
    );
};

export default Step2D_ScratchAudio;
