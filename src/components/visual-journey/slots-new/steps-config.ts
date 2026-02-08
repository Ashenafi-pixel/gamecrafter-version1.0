import EnhancedStep1_ThemeSelection from '../steps/EnhancedStep1_ThemeSelection';
import Step2_Mechanics from './Step2_Mechanics';
import Step3_Symbols from './Step3_Symbols';
import Step4_Visuals from './Step4_Visuals';
import Step6_Export from './Step6_Export';

export const SLOT_STEPS_V2 = [
    {
        id: 'theme',
        title: 'Theme & Concept',
        description: 'Define the visual identity and generate core assets',
        component: EnhancedStep1_ThemeSelection
    },
    {
        id: 'mechanics',
        title: 'Game Mechanics',
        description: 'Configure grid size, paylines, and rule engines',
        component: Step2_Mechanics
    },
    {
        id: 'symbols',
        title: 'Symbol Manager',
        description: 'Manage high, low, and special symbols',
        component: Step3_Symbols
    },
    {
        id: 'visuals',
        title: 'Visual Assets',
        description: 'Customize background, frame, and UI elements',
        component: Step4_Visuals
    },
    {
        id: 'polish',
        title: 'Polish & Audio',
        description: 'Fine-tune animations and soundscape',
        component: () => null // Placeholder
    },
    {
        id: 'export',
        title: 'Export & Publish',
        description: 'Simulate math and export final game package',
        component: Step6_Export
    }
];
