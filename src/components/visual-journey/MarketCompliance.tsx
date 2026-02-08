import React from 'react';
import DirectMarketCompliance from './steps-working/Step15_MarketCompliance';
import { useGameStore } from '../../store';

/**
 * A simple wrapper for the direct-steps Market Compliance component
 */
const MarketCompliance: React.FC = () => {
  const { setStep } = useGameStore();
  
  // Simple navigation handler
  const handleNavigate = (direction: 'next' | 'prev'): void => {
    console.log(`MarketCompliance: Handling ${direction} navigation`);
    if (direction === 'next') {
      // Go to API Export (step 9)
      setStep(9);
    } else {
      // Go back to Deep Simulation (step 7)
      setStep(7);
    }
  };
  
  // Directly render the direct-steps version with navigation handler
  return(
    <div className="step-container">
    <DirectMarketCompliance onNavigate={handleNavigate} />
    </div>

  ); 
};

export default MarketCompliance;