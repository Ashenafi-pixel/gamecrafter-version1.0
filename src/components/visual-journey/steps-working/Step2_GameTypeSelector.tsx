import React from 'react';
import GameTypeSelector from '../Step2_GameTypeSelector'; 

/**
 * Step 2: Game Type Selector Component
 * Allows users to select the type of slot game they want to create
 */
const Step2_GameTypeSelector: React.FC = () => {
  
  return (
    <div className="step-container h-full">
      <GameTypeSelector />
    </div>
  );
};

export default Step2_GameTypeSelector;