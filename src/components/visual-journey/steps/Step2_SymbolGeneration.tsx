import React from 'react';
import { useGameStore } from '../../../store';
import SymbolGenerator from '../SymbolGenerator';

/**
 * Step 2: Symbol Generation Component
 * Allows users to generate and customize game symbols based on the selected theme
 */
const Step2_SymbolGeneration: React.FC = () => {
  const { config } = useGameStore();
  
  return (
    <div className="step-container">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Your Game Symbols</h2>
      <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
        Generate symbols for your slot game based on your selected theme.
        Customize each symbol to create a cohesive set for your game.
      </p>
      
      
      <SymbolGenerator />
      
    </div>
  );
};

export default Step2_SymbolGeneration;