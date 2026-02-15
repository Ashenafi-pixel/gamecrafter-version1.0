import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, RefreshCw } from 'lucide-react';
import { useGameStore } from '../../store';
import ScratchGridPreview from '../visual-journey/scratch-steps/ScratchGridPreview';

const StandaloneGameModal: React.FC = () => {
    const { showStandaloneGameModal, setShowStandaloneGameModal, config } = useGameStore();

    // History Management for Back Button
    React.useEffect(() => {
        if (showStandaloneGameModal) {
            // Push a new state so "Back" doesn't exit the app
            window.history.pushState({ modal: 'standalone' }, '', window.location.pathname + '#preview');

            const handlePopState = () => {
                // If user hits Back, close modal
                setShowStandaloneGameModal(false);
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
                // Clean up URL if we closed manually (not via back button)
                if (window.location.hash === '#preview') {
                    window.history.back();
                }
            };
        }
    }, [showStandaloneGameModal, setShowStandaloneGameModal]);

    if (!showStandaloneGameModal) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black flex flex-col"
            >
                {/* Close Button / Header */}
                <div className="absolute top-4 right-4 z-[110] flex gap-2">
                    <button
                        onClick={() => setShowStandaloneGameModal(false)}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all border border-white/10"
                    >
                        <X size={18} />
                        <span className="font-bold">Close</span>
                    </button>
                </div>

                {/* Game Container - Full Screen */}
                <div className="w-full h-full relative bg-gray-900">
                    <ScratchGridPreview
                        mode="mechanics"
                        className="h-full w-full"
                    // enableSafeZone={true} // Prop doesn't exist on ScratchGridPreview interface, removing.
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default StandaloneGameModal;
