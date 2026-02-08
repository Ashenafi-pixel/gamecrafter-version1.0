import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Sub Components
// Sub Components
import Step2C_ScratchBrush from './assets/BrushDesigner';
import Step2D_ScratchAudio from './assets/AudioManager';
import Step2E_ScratchHiddenSymbols from './assets/SymbolManager';

import { useGameStore } from '../../../store';

const Step4_GameplayAssets: React.FC = () => {
    const { scratchGameplayStep } = useGameStore();

    // Use store state
    const activeTab = scratchGameplayStep;

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Top Tabs Removed - Moved to Footer */}

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 0 && <Step2C_ScratchBrush />}

                            {activeTab === 1 && <Step2E_ScratchHiddenSymbols />}

                            {activeTab === 2 && <Step2D_ScratchAudio />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Step4_GameplayAssets;
