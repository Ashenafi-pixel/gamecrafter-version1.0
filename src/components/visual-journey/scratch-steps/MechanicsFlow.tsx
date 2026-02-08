import React from 'react';
import { useGameStore } from '../../../store';
import { motion } from 'framer-motion';

// Mechanics Components
import Step2B_ScratchCategory from './mechanics/CategorySelector';
import Step2_ScratchLayout from './mechanics/LayoutConfig';
import Step4_ScratchMechanics from './mechanics/GameFeatures';

// Math Components
import Step3_Tab_Paytable from './math/PaytableEditor';
import Step3_Tab_Math from './math/RtpModeler';
import Step3_Tab_Simulation from './math/GameSimulator';

const Step2_MechanicsAndMath: React.FC = () => {
    const { scratchMechanicStep } = useGameStore();

    // Use scratchMechanicStep as the single source of truth for the active tab (0-5)
    // 0: Category, 1: Layout, 2: Features, 3: Paytable, 4: RTP Modeler, 5: Simulation
    const activeTab = scratchMechanicStep;

    const renderContent = () => {
        switch (activeTab) {
            case 0: return <Step2B_ScratchCategory />;
            case 1: return <Step2_ScratchLayout />;
            case 2: return <Step4_ScratchMechanics />;
            case 3: return <Step3_Tab_Paytable />;
            case 4: return <Step3_Tab_Math />;
            case 5: return <Step3_Tab_Simulation />;
            default: return <Step2B_ScratchCategory />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className={`flex-1 ${activeTab === 0 ? 'overflow-hidden p-0' : 'overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'}`}>
                <div className={`mx-auto ${activeTab === 0 || activeTab >= 3 ? 'max-w-full' : 'max-w-5xl'}`}>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Step2_MechanicsAndMath;
