import React from 'react';
import { useGameStore } from '../../../store';
import GameTypeSelector from '../Step2_GameTypeSelector'; 

/**
 * Step 2: Game Type Selector Component
 * Allows users to select the type of slot game they want to create
 */
const Step2_GameTypeSelector: React.FC = () => {
  const { config } = useGameStore();
  
  return (
    <div className="step-container">
      <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Game Type</h2>
      <GameTypeSelector />
    </div>
  );
};

export default Step2_GameTypeSelector;