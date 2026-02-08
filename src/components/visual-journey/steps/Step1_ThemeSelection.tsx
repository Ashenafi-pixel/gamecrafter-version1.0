import React from 'react';
import { useGameStore } from '../../../store';
import ThemeExplorer from '../ThemeExplorer';

/**
 * Step 1: Theme Selection Component
 * Allows users to select a theme for their slot game and set the game ID
 */
const Step1_ThemeSelection: React.FC = () => {
  const { config } = useGameStore();
  
  return (
    <div className="step-container max-w-full overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Game Theme</h2>
      
      <ThemeExplorer />
      
    </div>
  );
};

export default Step1_ThemeSelection;