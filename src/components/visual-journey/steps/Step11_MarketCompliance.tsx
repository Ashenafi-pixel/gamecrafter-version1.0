import React from 'react';
import { useGameStore } from '../../../store';
import MarketCompliance from '../MarketCompliance';

/**
 * Step 11: Market Compliance Component
 * Ensures the game meets market regulations and requirements
 * 
 * - Defines jurisdictional restrictions and regulatory approvals
 * - Includes certification data and compliance verification
 */
const Step11_MarketCompliance: React.FC = () => {
  const { config } = useGameStore();
  
  return (
    <div className="step-container">
      {/* <h2 className="text-2xl font-bold mb-6 text-center">Market Compliance</h2>
      <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
        Ensure your game meets the regulatory requirements for different markets.
        Adjust settings to comply with specific jurisdictions where your game will be available.
      </p> */}
      
      <MarketCompliance />
    </div>
  );
};

export default Step11_MarketCompliance;