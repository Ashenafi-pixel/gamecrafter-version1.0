/**
 * Step 4: Symbol Generation with Animation Lab Integration
 * Replaced original implementation with Animation Lab 2.0
 */

import React from 'react';
import EnhancedAnimationLab from '../../animation-lab/EnhancedAnimationLab';
import { AnimationLabProvider } from '../../animation-lab/AnimationLabModeProvider';

const Step4_SymbolGeneration: React.FC = () => {
  return (
    <AnimationLabProvider>
      <div style={{
        width: '100%',
        height: '100vh',
        background: '#ffffff'
      }}>
        <EnhancedAnimationLab />
      </div>
    </AnimationLabProvider>
  );
};

export default Step4_SymbolGeneration;