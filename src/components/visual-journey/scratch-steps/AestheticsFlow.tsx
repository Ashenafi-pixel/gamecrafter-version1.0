import React from 'react';
import { useGameStore } from '../../../store';
import { motion, AnimatePresence } from 'framer-motion';

// Sub Components

import BackgroundConfig from './aesthetics/BackgroundConfig';
import FrameConfig from './aesthetics/FrameConfig'; // Frame Only
import GridTransform from './aesthetics/GridTransform'; // Grid Layout
import LogoManager from './aesthetics/LogoManager';
import FoilLayer from './aesthetics/FoilLayer';
import MascotManager from './aesthetics/MascotManager';

const Step3_CardAesthetics: React.FC = () => {
    const { scratchAestheticStep } = useGameStore();

    const activeTab = scratchAestheticStep;

    return (
        <div className="flex flex-col h-full bg-gray-50/50 overflow-y-auto p-6">
            <div className="max-w-[95%] mx-auto w-full space-y-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 0 && <BackgroundConfig />}
                        {activeTab === 1 && <FrameConfig />}
                        {activeTab === 2 && <GridTransform />}
                        {activeTab === 3 && <LogoManager />}
                        {activeTab === 4 && <FoilLayer />}
                        {activeTab === 5 && <MascotManager />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Step3_CardAesthetics;

