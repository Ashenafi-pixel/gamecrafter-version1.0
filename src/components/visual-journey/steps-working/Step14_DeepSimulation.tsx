import React from 'react';
import { useGameStore } from '../../../store';
import DeepSimulation from '../DeepSimulation';

/**
 * Step 10: Deep Simulation Component
 * Allows users to run simulations to verify their game's math model
 */
const Step10_DeepSimulation: React.FC = () => {
  const { config } = useGameStore();

  return (
    <div className="step-container">
    
      
      <DeepSimulation />
    </div>
  );
};

export default Step10_DeepSimulation;