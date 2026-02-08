import React from 'react';
import ReelAnimation from './ReelAnimation';

const SlotMachineDemo: React.FC = () => {
  return (
    <div className="w-full h-full bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            Slot Machine Visualization
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Interactive slot reel animation powered by PixiJS and GSAP
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <ReelAnimation />
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-3xl w-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Implementation Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Animation Features</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Acceleration with easing</li>
                  <li>Constant speed phase</li>
                  <li>Deceleration with smooth stopping</li>
                  <li>Elastic bounce effect</li>
                  <li>Staggered reel timing for realism</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Technical Implementation</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>React component integration with WebGL</li>
                  <li>PixiJS for efficient rendering</li>
                  <li>GSAP for animation timing</li>
                  <li>Dynamic symbol texture loading</li>
                  <li>Fallback symbols when textures unavailable</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Integration Notes</h3>
              <p className="text-gray-600">
                This component can be integrated with the SlotAI theme system to use custom generated
                symbols. It can also receive custom win patterns and payline configurations from
                the math model.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotMachineDemo;