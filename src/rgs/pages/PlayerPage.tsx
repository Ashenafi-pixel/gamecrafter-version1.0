import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// import { motion } from 'framer-motion'; 
// Removed unused import to clean up linter warning
import { useGameStore } from '../../store';
import ScratchGridPreview from '../../components/visual-journey/scratch-steps/ScratchGridPreview'; // Corrected Import Path
import { Loader, AlertTriangle, Home } from 'lucide-react';

const PlayerPage: React.FC = () => {
    const { draftId } = useParams<{ draftId: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { updateConfig, setGameType } = useGameStore();
    const [gameName, setGameName] = useState('Loading...');

    useEffect(() => {
        const loadDraft = async () => {
            if (!draftId) return;
            try {
                // Try fetching as a Published Game first (Casino Mode)
                const gameRes = await fetch(`/api/rgs/games/${draftId}`);
                if (gameRes.ok) {
                    const game = await gameRes.json();
                    console.log('[Player] Hydrating Published Game:', game.display_name);

                    // Hydrate Store
                    setGameType(game.config.gameType || 'scratch');
                    updateConfig({
                        ...game.config,
                        gameId: game.id // Ensure ID matches
                    });
                    setGameName(game.display_name);
                    setLoading(false);
                    return;
                }

                // If not found, try fetching from Drafts (Dev Mode)
                const res = await fetch('/api/rgs/drafts');
                if (!res.ok) throw new Error('Failed to connect to RGS');

                const drafts = await res.json();
                const draft = drafts.find((d: any) => d.draftId === draftId);

                if (draft && draft.config) {
                    console.log('[Player] Hydrating Draft Game:', draft.gameName);
                    setGameType(draft.config.gameType || 'scratch');
                    updateConfig({
                        ...draft.config,
                        gameId: draft.draftId
                    });
                    setGameName(draft.gameName);
                } else {
                    throw new Error('Game not found (checked Live and Drafts)');
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadDraft();
    }, [draftId, updateConfig, setGameType]);

    if (loading) return (
        <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
            <Loader className="animate-spin mb-4" size={48} />
            <p className="font-bold text-lg">Loading Game Assets...</p>
        </div>
    );

    if (error) return (
        <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-red-500">
            <AlertTriangle size={64} className="mb-4" />
            <h1 className="text-2xl font-bold mb-2">Game Load Error</h1>
            <p>{error}</p>
            <button
                onClick={() => window.close()}
                className="mt-8 px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition"
            >
                Close Window
            </button>
        </div>
    );

    return (
        // [MOBILE] Use 100dvh so the game fills the real visible height on mobile browsers
        // (avoids the bottom browser chrome eating into the game canvas)
        <div className="w-full overflow-hidden relative font-sans select-none bg-black" style={{ height: '100vh', minHeight: '-webkit-fill-available' }}>
            {/* Game Container — fills screen on mobile, centered portrait box on desktop */}
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1c25]">

                {/* On mobile (< md): fill screen entirely. On desktop: constrain to portrait box */}
                <div
                    className="relative w-full h-full md:max-w-[500px] md:max-h-[900px]"
                    style={{ touchAction: 'none' }}
                >
                    {/* ScratchGridPreview contains the full game engine + GameControls footer */}
                    <ScratchGridPreview
                        mode="mechanics"
                        className="w-full h-full"
                    />
                </div>

            </div>

            {/* Overlay UI — top bar with game title (pointer-events-none so it doesn't block scratch) */}
            <div className="absolute top-0 left-0 w-full p-3 sm:p-4 flex justify-between items-start pointer-events-none z-50">
                <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10 flex items-center gap-2 sm:gap-3 pointer-events-auto">
                    <button onClick={() => window.close()} className="hover:text-red-400"><Home size={16} /></button>
                    <div className="w-px h-3.5 bg-white/20"></div>
                    <span className="font-bold text-xs sm:text-sm tracking-wide text-indigo-300">DEMO</span>
                    <span className="font-bold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{gameName}</span>
                </div>
            </div>

            <div className="absolute bottom-20 left-0 w-full text-center pointer-events-none z-10">
                <p className="text-white/20 text-[10px]">Powered by SlotAI RGS Engine</p>
            </div>
        </div>
    );
};

export default PlayerPage;
