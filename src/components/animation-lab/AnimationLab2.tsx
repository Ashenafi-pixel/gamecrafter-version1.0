/**
 * Animation Lab 2.0 - Main Container
 * Manages Simple vs Advanced mode switching and provides unified interface
 */

import React from 'react';
import { AnimationLabProvider, useAnimationLab } from './AnimationLabModeProvider';
import SimpleMode from './modes/SimpleMode';
import AdvancedMode from './modes/AdvancedMode';
import ModeToggleHeader from './components/ModeToggleHeader';

const AnimationLabContent: React.FC = () => {
  const { mode } = useAnimationLab();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header with mode toggle */}
      <ModeToggleHeader />
      
      {/* Main content area */}
      <div style={{ padding: '0' }}>
        {mode === 'simple' ? <SimpleMode /> : <AdvancedMode />}
      </div>
    </div>
  );
};

interface AnimationLab2Props {
  initialMode?: 'simple' | 'advanced';
}

const AnimationLab2: React.FC<AnimationLab2Props> = ({ initialMode = 'simple' }) => {
  return (
    <AnimationLabProvider initialMode={initialMode}>
      <AnimationLabContent />
    </AnimationLabProvider>
  );
};

export default AnimationLab2;