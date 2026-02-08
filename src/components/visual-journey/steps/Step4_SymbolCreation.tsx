/**
 * Step 4: Symbol Creation Mode
 * Uses Animation Lab 2.0 with symbol carousel at bottom
 * The premium slot preview is handled by PremiumLayout
 */

import React from 'react';
import EnhancedAnimationLab from '../../animation-lab/EnhancedAnimationLab';
import { AnimationLabProvider } from '../../animation-lab/AnimationLabModeProvider';

const Step4_SymbolCreation: React.FC = () => {
  return (
    <AnimationLabProvider>
      <EnhancedAnimationLab layoutMode="creation" />
    </AnimationLabProvider>
  );
};

export default Step4_SymbolCreation;