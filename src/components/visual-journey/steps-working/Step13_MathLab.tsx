import React from 'react';
import { useGameStore } from '../../../store';
import VisualMathLab from '../VisualMathLab';

/**
 * Step 9: Math Laboratory Component
 * Allows users to configure RTP, volatility, and math model settings
 */
const Step9_MathLab: React.FC = () => {
  const { config } = useGameStore();

  return (
    <div className="step-container">
      <VisualMathLab />
    </div>
  );
};

export default Step9_MathLab;