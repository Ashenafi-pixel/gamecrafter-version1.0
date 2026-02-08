import React from 'react';
import AnimationLab from './AnimationLab';

/**
 * Demo component to test the Animation Lab
 * This serves as both a test and demonstration of the system
 */
export const AnimationLabDemo: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <AnimationLab />
    </div>
  );
};

export default AnimationLabDemo;