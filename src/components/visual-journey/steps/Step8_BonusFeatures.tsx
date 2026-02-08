import React from 'react';
import { useGameStore } from '../../../store';
import { BonusFeatures } from '../../../components/BonusFeatures';

/**
 * Step 8: Bonus Features Component
 * Allows users to configure bonus features like free spins and mini-games
 */
const Step8_BonusFeatures: React.FC = () => {
  const { config } = useGameStore();

  return (
    <div className="step-container">
      <BonusFeatures />
    </div>
  );
};

export default Step8_BonusFeatures;