import React from 'react';
import { useGameStore } from '../../store';
import ReelAnimation from './ReelAnimation';

interface AnimationIntegratorProps {
  className?: string;
}

/**
 * Component that integrates the PixiJS reel animation with the SlotAI store data
 */
const AnimationIntegrator: React.FC<AnimationIntegratorProps> = ({ className = '' }) => {
  const { config } = useGameStore();
  
  return (
    <div className={`animation-integrator ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Slot Animation Preview</h3>
        <p className="text-sm text-gray-600 mb-4">
          Interactive preview of your slot machine with PixiJS animation
        </p>
      </div>
      
      <ReelAnimation />
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          This animation uses the PixiJS engine for rendering and GSAP for smooth animations.
          It includes physics-based effects like acceleration, constant speed, deceleration, and bounce.
        </p>
        <p className="mt-2">
          Press the SPIN button to test the animation.
        </p>
      </div>
    </div>
  );
};

export default AnimationIntegrator;