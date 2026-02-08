import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, RefreshCw } from 'lucide-react';
import { useGameStore } from '../../store';
import ScratchGridPreview from '../visual-journey/scratch-steps/ScratchGridPreview';

const StandaloneGameModal: React.FC = () => {
    const { showStandaloneGameModal, setShowStandaloneGameModal, config } = useGameStore();

    if (!showStandaloneGameModal) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black flex flex-col"
            >


                {/* Game Container - Full Screen */}
                <div className="w-full h-full relative bg-gray-900">
                    <ScratchGridPreview mode="mechanics" className="h-full w-full" enableSafeZone={true} />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default StandaloneGameModal;
