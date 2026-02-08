import React from 'react';
import ReelAnimation from './ReelAnimation';

const ReelTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          SlotAI Reel Animation Test
        </h1>
        
        <ReelAnimation />
        
        <div className="mt-8 border-t pt-6 text-gray-600">
          <h3 className="text-lg font-medium mb-2">Implementation Notes:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Uses PixiJS for efficient rendering with WebGL</li>
            <li>GSAP for smooth animations with proper easing</li>
            <li>Configurable spin speed, duration, and physics</li>
            <li>Random symbol generation with fallback graphics</li>
            <li>Realistic acceleration, constant speed, and deceleration</li>
            <li>Elastic bounce effect on stop</li>
          </ul>
          
          <p className="mt-4 italic text-sm">
            This is a visual mockup for demonstration purposes and doesn't include actual math models or RNG calculations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReelTest;