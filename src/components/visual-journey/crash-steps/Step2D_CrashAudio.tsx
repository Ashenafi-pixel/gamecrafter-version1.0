import React, { useState } from 'react';
import { useGameStore } from '../../../store';
import { Volume2, Play, Pause, Music, Zap, Skull, Trophy } from 'lucide-react';
import { UnifiedAssetControl } from '../instant-steps/components/UnifiedAssetControl';

export const CrashAudioSidebar: React.FC = () => {
    const { config, updateCrashConfig } = useGameStore();
    const [playingPreview, setPlayingPreview] = useState<string | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const audioConfig = config.crash?.audio || {
        enabled: true,
        volume: 0.5,
        tracks: {
            music: '',
            launch: '',
            engine: '',
            crash: '',
            win: ''
        }
    };

    const updateAudio = (key: string, value: any) => {
        updateCrashConfig({
            audio: {
                ...audioConfig,
                [key]: value
            }
        });
    };

    const updateTrack = (trackName: string, url: string) => {
        updateCrashConfig({
            audio: {
                ...audioConfig,
                tracks: {
                    ...audioConfig.tracks,
                    [trackName]: url
                }
            }
        });
    };

    const togglePreview = (url: string | undefined, id: string) => {
        if (!url) return;

        if (playingPreview === id) {
            audioRef.current?.pause();
            setPlayingPreview(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.volume = audioConfig.volume;
                audioRef.current.play();
                setPlayingPreview(id);

                audioRef.current.onended = () => setPlayingPreview(null);
            } else {
                const audio = new Audio(url);
                audio.volume = audioConfig.volume;
                audioRef.current = audio;
                audio.play();
                setPlayingPreview(id);
                audio.onended = () => setPlayingPreview(null);
            }
        }
    };

    const SOUND_TYPES = [
        { id: 'music', label: 'Background Music', icon: Music, desc: 'Looping ambient track' },
        { id: 'launch', label: 'Launch / Takeoff', icon: Rocket, desc: 'Played at start of round' },
        { id: 'engine', label: 'Engine / Rising', icon: Zap, desc: 'Loops/Pitches up during flight' },
        { id: 'crash', label: 'Crash Explosion', icon: Skull, desc: 'Round end failure sound' },
        { id: 'win', label: 'Win / Cashout', icon: Trophy, desc: 'Success sound effect' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-left-4">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Audio Soundscape</h2>
                <p className="text-gray-500 text-sm">Design the auditory experience of your crash game.</p>
            </div>

            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${audioConfig.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Volume2 size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">Master Audio</div>
                        <div className="text-xs text-gray-500">Global sound toggle</div>
                    </div>
                </div>
                <input
                    type="checkbox"
                    checked={audioConfig.enabled}
                    onChange={(e) => updateAudio('enabled', e.target.checked)}
                    className="w-6 h-6 text-indigo-600 rounded focus:ring-indigo-500"
                />
            </div>

            {audioConfig.enabled && (
                <div className="space-y-6">
                    {/* Volume Control */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-gray-700">Master Volume</label>
                            <span className="text-sm text-indigo-600 font-mono">{Math.round(audioConfig.volume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={audioConfig.volume}
                            onChange={(e) => updateAudio('volume', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    {/* Sound Slots */}
                    <div className="space-y-4">
                        {SOUND_TYPES.map((type) => (
                            <div key={type.id} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors bg-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <type.icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-gray-800">{type.label}</div>
                                        <div className="text-[10px] text-gray-400">{type.desc}</div>
                                    </div>
                                    {audioConfig.tracks[type.id as keyof typeof audioConfig.tracks] && (
                                        <button
                                            onClick={() => togglePreview(audioConfig.tracks[type.id as keyof typeof audioConfig.tracks], type.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                                        >
                                            {playingPreview === type.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                        </button>
                                    )}
                                </div>

                                <UnifiedAssetControl
                                    label=""
                                    subLabel={`Upload ${type.label} (.mp3, .wav)`}
                                    value=""
                                    onValueChange={() => { }}
                                    imagePreview={undefined}
                                    onRemoveImage={() => updateTrack(type.id, '')}
                                    onUpload={(file) => {
                                        const reader = new FileReader();
                                        reader.onload = (e) => updateTrack(type.id, e.target?.result as string);
                                        reader.readAsDataURL(file);
                                    }}
                                    onGenerate={() => { }}
                                    isGenerating={false}
                                    placeholder="Or generate sound effect..."
                                    className="border-0 shadow-none p-0"
                                />

                                {audioConfig.tracks[type.id as keyof typeof audioConfig.tracks] && (
                                    <div className="mt-2 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded inline-block font-mono border border-green-100">
                                        ✓ Audio file loaded
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export const CrashAudioPreview: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl shadow-xl w-[600px] h-[400px] flex flex-col items-center justify-center text-gray-400 p-8 text-center border border-dashed border-gray-300 animate-in fade-in zoom-in-95 duration-300">
            <Volume2 size={64} className="text-gray-200 mb-4" />
            <h3 className="text-xl font-bold text-gray-300">Audio Visualization</h3>
            <p className="max-w-xs mt-2 text-sm">
                As you play sounds, a frequency visualization would appear here.
                (Mockup for planning phase)
            </p>
        </div>
    );
};

// Default export wrapper
const Step2D_CrashAudio: React.FC = () => {
    return (
        <div className="flex h-[calc(100vh-140px)]">
            <div className="w-[400px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-6 scrollbar-thin">
                <CrashAudioSidebar />
            </div>
            <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center">
                <CrashAudioPreview />
            </div>
        </div>
    );
};

// Helper icon component since Rocket is already imported in main file
function Rocket(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    )
}

export default Step2D_CrashAudio;
